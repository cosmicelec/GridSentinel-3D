from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

from scada_simulator import SCADASimulator
from detector import detector_instance
from database import log_telemetry, log_alert

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global queue for sharing data between simulator and websockets
data_queue = asyncio.Queue()
simulator = SCADASimulator()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    # Start the simulator task
    asyncio.create_task(simulator.stream_data(data_queue))
    # Start the processor task
    asyncio.create_task(process_data())

@app.post("/api/telemetry")
async def receive_telemetry(request: Request):
    payload = await request.json()
    if 'timestamp' not in payload:
        from datetime import datetime
        payload['timestamp'] = datetime.utcnow().isoformat()
    await data_queue.put(payload)
    return {"status": "success"}

async def process_data():
    while True:
        payload = await data_queue.get()
        node_id = payload['node_id']
        data = payload['data']
        
        # Log telemetry to DB
        log_telemetry(node_id, data)
        
        # Run AI Anomaly Detection
        analysis = detector_instance.analyze(data)
        
        message = {
            "type": "telemetry",
            "node_id": node_id,
            "timestamp": payload['timestamp'],
            "metrics": data
        }
        
        # If anomaly, augment message and log alert
        if analysis['is_anomaly']:
            message['alert'] = {
                "severity": analysis['threat_score'],
                "message": analysis['message']
            }
            log_alert(node_id, analysis['threat_score'], analysis['message'])

        # Broadcast to all connected clients
        await manager.broadcast(json.dumps(message))

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, though we only push data
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
