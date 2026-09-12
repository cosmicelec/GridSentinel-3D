# GridSentinel-3D

An industrial-grade, AI-powered 3D Digital Twin and SCADA Anomaly Detection System for smart power substations.

## Architecture

1. **Backend**: FastAPI, PyTorch/Scikit-Learn, WebSockets, SQLite.
2. **Frontend**: Next.js 14, Three.js, React Three Fiber.
3. **Desktop**: Tauri v2 wrapper.
4. **Firmware**: ESP32 C++ simulator script.

## Getting Started

### 1. Backend

Navigate to `backend/` and install dependencies:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
The server will start on `http://localhost:8000` with WebSocket telemetry at `ws://localhost:8000/ws/telemetry`.

### 2. Frontend

Navigate to `frontend/` and install dependencies (React 18 compatible):
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the 3D Digital Twin.

### 3. Desktop Application (Tauri)

The Tauri app embeds the Next.js frontend.
```bash
cd desktop
npm install
npm run tauri dev
```
To build a static Next.js export and package the Tauri app:
```bash
# Inside desktop/
npm run tauri build
```

### 4. ESP32 Firmware

Use PlatformIO or Arduino IDE to flash the `firmware/main.cpp` to an ESP32. Update the `ssid`, `password`, and `serverUrl` (pointing to your local backend IP) inside the file before uploading.

## Features
- **Real-time 3D Digital Twin**: Interactive 3D visualization of substation transformers and transmission lines.
- **AI Anomaly Detection**: Built-in Isolation Forest model to flag false data injections or critical grid metrics.
- **Desktop Ready**: Minimalist dark-themed Tauri integration.
- **Hardware Simulation**: Complete C++ simulator script for continuous testing.
