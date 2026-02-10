"use client"

import { use } from 'react'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartAreaInteractive } from '@/components/ui/parameters'
import { useWebSocket } from '@/hooks/useWebSocket'
import { cn } from '@/lib/utils'

export default function DevicePage({
  params,
}: {
  params: Promise<{ room: string; deviceID: string }>
}) {
  const { room, deviceID } = use(params)
  const deviceId = deviceID.toUpperCase()

  const [connected, setConnected] = useState(false)
  const [acList, setAcList] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  const onWSMessage = useCallback((payload: any[] | any) => {
    const rows = Array.isArray(payload) ? payload : [payload]
    if (!rows.length) return

    setAcList((prev) => {
      const next = [...prev]
      rows.forEach((r) => {
        if (!r?.Device_ID) return
        const idx = next.findIndex((x) => x.Device_ID === r.Device_ID)
        if (idx === -1) next.push(r)
        else next[idx] = r
      })
      return next
    })

    setHistory((prev) => [
      ...prev.slice(-120),
      ...rows.map((r) => ({
        time: r.Time_Stamp ?? '',
        voltage: r.voltage ?? 0,
        current: r.Current ?? 0,
        power: r.Real_Power_calc ?? 0,
        health: r.Health_Score ?? 0,
      })),
    ])

    setConnected(true)
  }, [])

  useWebSocket(`/ws/device/${deviceId}`, onWSMessage)

  if (!connected) return <div className="p-6">Connecting to ML…</div>

  const device = acList.find(d => d.Device_ID === deviceId)
  if (!device) return <div className="p-6">Device not found</div>

  const deviceHistory = history

  return (
    <div className="p-6 space-y-6">
      <Link href={`/rooms/${room}`}>
        <button className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to {room.toUpperCase()}
        </button>
      </Link>

      <h1 className="text-3xl font-bold">{deviceId}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ChartAreaInteractive data={deviceHistory} />
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge
                className={cn(
                  device.pred_condition === 'Normal' && 'bg-green-100 text-green-700',
                  device.pred_condition === 'Maintenance' && 'bg-yellow-100 text-yellow-700',
                  device.pred_condition === 'Critical' && 'bg-red-100 text-red-700'
                )}
              >
                {device.pred_condition}
              </Badge>

              <div>Health: {device.Health_Score.toFixed(0)}%</div>
              <div>Power: {device.Real_Power_calc.toFixed(1)} W</div>
              <div>Voltage: {device.voltage.toFixed(1)} V</div>
              <div>Current: {device.Current.toFixed(1)} A</div>

              <p className="text-sm text-muted-foreground">
                {device.Maintenance_Advice || 'Normal Operation'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}