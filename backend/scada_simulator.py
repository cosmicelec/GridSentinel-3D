import asyncio
import random
from datetime import datetime

class SCADASimulator:
    def __init__(self):
        self.nodes = ['TX-01', 'TX-02', 'BRK-01']
        self.anomaly_active = False
        self.anomaly_timer = 0
        self.anomalous_node = None

    def _generate_normal(self):
        return {
            'voltage': round(random.gauss(220.0, 1.5), 2),
            'current': round(random.gauss(500.0, 5.0), 2),
            'frequency': round(random.gauss(50.0, 0.02), 3),
            'temperature': round(random.gauss(45.0, 1.0), 1)
        }

    def _generate_anomaly(self):
        # Determine type of anomaly
        anomaly_type = random.choice(['spike', 'drop', 'frequency_shift'])
        if anomaly_type == 'spike':
            return {
                'voltage': round(random.gauss(220.0, 1.5), 2),
                'current': round(random.gauss(800.0, 20.0), 2), # Current spike
                'frequency': round(random.gauss(50.0, 0.02), 3),
                'temperature': round(random.gauss(80.0, 2.0), 1) # Temp spike
            }
        elif anomaly_type == 'drop':
            return {
                'voltage': round(random.gauss(50.0, 10.0), 2), # Massive voltage drop
                'current': round(random.gauss(50.0, 5.0), 2),
                'frequency': round(random.gauss(50.0, 0.02), 3),
                'temperature': round(random.gauss(45.0, 1.0), 1)
            }
        else:
            return {
                'voltage': round(random.gauss(220.0, 1.5), 2),
                'current': round(random.gauss(500.0, 5.0), 2),
                'frequency': round(random.gauss(51.5, 0.1), 3), # Frequency shift
                'temperature': round(random.gauss(45.0, 1.0), 1)
            }

    async def stream_data(self, queue: asyncio.Queue):
        while True:
            # 5% chance to start an anomaly that lasts for some iterations
            if not self.anomaly_active and random.random() < 0.05:
                self.anomaly_active = True
                self.anomaly_timer = random.randint(5, 15)
                self.anomalous_node = random.choice(self.nodes)

            for node in self.nodes:
                if self.anomaly_active and node == self.anomalous_node:
                    data = self._generate_anomaly()
                else:
                    data = self._generate_normal()
                
                payload = {
                    "node_id": node,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": data
                }
                await queue.put(payload)

            if self.anomaly_active:
                self.anomaly_timer -= 1
                if self.anomaly_timer <= 0:
                    self.anomaly_active = False

            await asyncio.sleep(1.0) # 1 update per second
