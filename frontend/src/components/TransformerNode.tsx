"use client"
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface TransformerNodeProps {
  id: string
  position: [number, number, number]
  status: 'normal' | 'warning' | 'critical'
  onClick: (id: string) => void
}

export default function TransformerNode({ id, position, status, onClick }: TransformerNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current && status !== 'normal') {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1
      meshRef.current.scale.set(scale, scale, scale)
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1)
    }
  })

  const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#eab308' : '#3b82f6'

  return (
    <group position={position} onClick={() => onClick(id)}>
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>
      <Html position={[0, 1.5, 0]} center>
        <div className="bg-gray-900/80 text-white px-2 py-1 rounded text-xs font-mono border border-gray-600">
          {id}
        </div>
      </Html>
    </group>
  )
}
