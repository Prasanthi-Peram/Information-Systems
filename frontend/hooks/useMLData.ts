'use client'

import { useEffect, useRef, useState } from 'react'

export type ACData = {
  Device_ID: string
  Time_Stamp: string
  voltage: number
  Current: number
  Real_Power_calc: number
  pred_perf: number
  Health_Score: number
  pred_condition: 'Normal' | 'Maintenance' | 'Critical'
  Maintenance_Advice: string
  critical_alert: number
  Room: string
}

export type HistoryPoint = {
  time: string
  voltage: number
  current: number
  power: number
  health: number
  room: string
  deviceId: string
}

function inferRoom(deviceId: string) {
  const match = deviceId.match(/^[A-Z]+\d+/)
  return match ? match[0] : 'UNKNOWN'
}

export function useMLData() {
  const [acList, setACList] = useState<ACData[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/ml')
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (e) => {
      let parsed
      try {
        parsed = JSON.parse(e.data)
      } catch {
        return
      }

      const rows = Array.isArray(parsed) ? parsed : [parsed]

      setACList(prev => {
        const map = new Map(prev.map(a => [a.Device_ID, a]))
        rows.forEach(r => {
          map.set(r.Device_ID, {
            ...r,
            Room: inferRoom(r.Device_ID),
          })
        })
        return Array.from(map.values())
      })

      setHistory(prev => [
        ...prev.slice(-300),
        ...rows.map(r => ({
          time: r.Time_Stamp,
          voltage: r.voltage,
          current: r.Current,
          power: r.Real_Power_calc,
          health: r.Health_Score,
          room: inferRoom(r.Device_ID),
          deviceId: r.Device_ID,
        })),
      ])
    }

    ws.onclose = () => setConnected(false)

    return () => ws.close()
  }, [])

  return { connected, acList, history }
}