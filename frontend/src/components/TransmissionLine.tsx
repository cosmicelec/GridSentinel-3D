"use client"
import React from 'react'
import { Line } from '@react-three/drei'

interface TransmissionLineProps {
  start: [number, number, number]
  end: [number, number, number]
  active: boolean
}

export default function TransmissionLine({ start, end, active }: TransmissionLineProps) {
  const color = active ? '#10b981' : '#6b7280'
  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={3}
      dashed={!active}
    />
  )
}
