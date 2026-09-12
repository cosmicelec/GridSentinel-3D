"use client"
import React, { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
const SubstationCanvas = dynamic(() => import('@/components/SubstationCanvas'), { ssr: false })
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, Activity, Zap } from 'lucide-react'

interface TelemetryData {
  time: string
  voltage: number
  current: number
  frequency: number
  temperature: number
}

interface Alert {
  node_id: string
  severity: number
  message: string
  timestamp: string
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<Record<string, TelemetryData[]>>({})
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Attempt WebSocket connection
    ws.current = new WebSocket('ws://localhost:8000/ws/telemetry')
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'telemetry') {
        const timeStr = new Date(data.timestamp).toLocaleTimeString()
        
        setTelemetry(prev => {
          const nodeData = prev[data.node_id] || []
          const newData = [...nodeData, { time: timeStr, ...data.metrics }].slice(-20) // Keep last 20
          return { ...prev, [data.node_id]: newData }
        })

        if (data.alert) {
          setAlerts(prev => [{
            node_id: data.node_id,
            severity: data.alert.severity,
            message: data.alert.message,
            timestamp: timeStr
          }, ...prev].slice(0, 10))
        }
      }
    }

    ws.current.onerror = () => {
      console.warn("WebSocket error, falling back to mock data generator.")
      startMockGenerator()
    }

    return () => {
      ws.current?.close()
    }
  }, [])

  // Mock generator fallback if backend is down
  const startMockGenerator = () => {
    setInterval(() => {
      const timeStr = new Date().toLocaleTimeString()
      const nodes = ['TX-01', 'TX-02', 'BRK-01']
      const isAnomaly = Math.random() < 0.1
      const anomalousNode = nodes[Math.floor(Math.random() * nodes.length)]

      nodes.forEach(node => {
        const anomalyActive = isAnomaly && node === anomalousNode
        const metrics = {
          voltage: anomalyActive ? 180 + Math.random() * 20 : 220 + Math.random() * 2,
          current: anomalyActive ? 800 + Math.random() * 50 : 500 + Math.random() * 10,
          frequency: anomalyActive ? 49.5 + Math.random() : 50 + Math.random() * 0.1,
          temperature: anomalyActive ? 70 + Math.random() * 10 : 45 + Math.random() * 2
        }

        setTelemetry(prev => {
          const nodeData = prev[node] || []
          const newData = [...nodeData, { time: timeStr, ...metrics }].slice(-20)
          return { ...prev, [node]: newData }
        })

        if (anomalyActive) {
          setAlerts(prev => [{
            node_id: node,
            severity: 0.9,
            message: "MOCK: Anomaly detected",
            timestamp: timeStr
          }, ...prev].slice(0, 10))
        }
      })
    }, 1000)
  }

  const selectedData = selectedNode ? telemetry[selectedNode] || [] : []

  if (!mounted) {
    return <div className="flex h-screen bg-gray-950 items-center justify-center text-gray-500">Loading Dashboard...</div>
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Main 3D View */}
      <div className="flex-1 relative">
        <SubstationCanvas alerts={alerts} onNodeClick={setSelectedNode} />
        
        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-400" />
            GridSentinel-3D
          </h1>
          <p className="text-gray-400 text-sm">Digital Twin & SCADA Anomaly Detection</p>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
        {/* Node Details */}
        <div className="p-4 border-b border-gray-800 h-1/2 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-blue-400" size={20} />
            Node Telemetry {selectedNode ? `(${selectedNode})` : '(Select a Node)'}
          </h2>
          
          {selectedNode ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#3b82f6" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="current" stroke="#10b981" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Click a 3D node to view metrics
            </div>
          )}
        </div>

        {/* Alert Feed */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Cyber Threat Alerts
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm">No active threats detected.</p>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className="bg-gray-800 p-3 rounded border border-gray-700 shadow-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-red-400">{alert.node_id}</span>
                    <span className="text-xs text-gray-400">{alert.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-300">{alert.message}</p>
                  <div className="mt-2 h-1 w-full bg-gray-700 rounded overflow-hidden">
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${alert.severity * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
