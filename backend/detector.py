import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        # We will use an IsolationForest for anomaly detection
        # Assume normal operation is fit dynamically or starts with pre-seeded data
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        
        # Pre-seed with some "normal" data to avoid crashing on first predict
        # voltage (kV), current (A), frequency (Hz), temperature (C)
        np.random.seed(42)
        normal_data = pd.DataFrame({
            'voltage': np.random.normal(220.0, 2.0, 100),
            'current': np.random.normal(500.0, 10.0, 100),
            'frequency': np.random.normal(50.0, 0.05, 100),
            'temperature': np.random.normal(45.0, 2.0, 100)
        })
        self.model.fit(normal_data)

    def analyze(self, data):
        # Predict: 1 for normal, -1 for anomaly
        features = pd.DataFrame([{
            'voltage': data['voltage'],
            'current': data['current'],
            'frequency': data['frequency'],
            'temperature': data['temperature']
        }])
        
        # Compute decision function (lower means more anomalous)
        score = self.model.decision_function(features)[0]
        prediction = self.model.predict(features)[0]
        
        # Normalize score roughly to 0.0 -> 1.0 where 1.0 is highest threat
        # IsolationForest decision function usually ranges from -0.5 to 0.5
        # We map it to [0, 1] threat score
        threat_score = max(0.0, min(1.0, 0.5 - score))
        
        is_anomaly = prediction == -1
        
        # Determine specific reason if anomalous
        reason = None
        if is_anomaly:
            if threat_score > 0.8:
                reason = "CRITICAL: Potential False Data Injection or severe fault"
            elif data['frequency'] > 50.5 or data['frequency'] < 49.5:
                reason = "WARNING: Frequency deviation detected"
            elif data['voltage'] < 190.0:
                reason = "WARNING: Voltage drop / Power loss detected"
            else:
                reason = "WARNING: Irregular metric patterns"

        return {
            "threat_score": threat_score,
            "is_anomaly": is_anomaly,
            "message": reason
        }

detector_instance = AnomalyDetector()
