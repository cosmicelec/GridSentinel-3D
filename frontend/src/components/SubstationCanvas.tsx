"use client"
import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid } from '@react-three/drei'
import TransformerNode from './TransformerNode'
import TransmissionLine from './TransmissionLine'

interface SubstationCanvasProps {
  alerts: { node_id: string; severity: number; message: string; timestamp: string }[]
  onNodeClick: (id: string) => void
}

const NODES = [
  { id: 'TX-01', position: [-5, 1, 0] as [number, number, number] },
  { id: 'TX-02', position: [5, 1, 0] as [number, number, number] },
  { id: 'BRK-01', position: [0, 1, -5] as [number, number, number] }
]

export default function SubstationCanvas({ alerts, onNodeClick }: SubstationCanvasProps) {
  const getStatus = (id: string) => {
    const nodeAlerts = alerts.filter(a => a.node_id === id)
    if (nodeAlerts.length === 0) return 'normal'
    const latest = nodeAlerts[nodeAlerts.length - 1]
    return latest.severity > 0.8 ? 'critical' : 'warning'
  }

  return (
    <div className="w-full h-full bg-gray-950">
      <Canvas camera={{ position: [0, 5, 15], fov: 50 }}>
        <React.Suspense fallback={null}>
          <color attach="background" args={['#030712']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <Grid args={[20, 20]} cellColor="#1f2937" sectionColor="#374151" fadeDistance={30} />
          
          {NODES.map(node => (
            <TransformerNode
              key={node.id}
              id={node.id}
              position={node.position}
              status={getStatus(node.id)}
              onClick={onNodeClick}
            />
          ))}

          <TransmissionLine start={NODES[0].position} end={NODES[2].position} active={getStatus('TX-01') === 'normal'} />
          <TransmissionLine start={NODES[1].position} end={NODES[2].position} active={getStatus('TX-02') === 'normal'} />

          <OrbitControls makeDefault />
          <Environment preset="city" />
        </React.Suspense>
      </Canvas>
    </div>
  )
}
