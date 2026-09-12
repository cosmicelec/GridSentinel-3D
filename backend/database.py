import sqlite3
from datetime import datetime

DB_NAME = "substation.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            node_id TEXT,
            voltage REAL,
            current REAL,
            frequency REAL,
            temperature REAL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            node_id TEXT,
            severity REAL,
            message TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_telemetry(node_id, data):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        INSERT INTO telemetry (timestamp, node_id, voltage, current, frequency, temperature)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (datetime.utcnow().isoformat(), node_id, data['voltage'], data['current'], data['frequency'], data['temperature']))
    conn.commit()
    conn.close()

def log_alert(node_id, severity, message):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        INSERT INTO alerts (timestamp, node_id, severity, message)
        VALUES (?, ?, ?, ?)
    ''', (datetime.utcnow().isoformat(), node_id, severity, message))
    conn.commit()
    conn.close()

init_db()
