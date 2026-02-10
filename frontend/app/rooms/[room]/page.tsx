'use client'

import { use } from 'react'
import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useWebSocket } from '@/hooks/useWebSocket'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{
    room: string
  }>
}

export default function RoomPage({ params }: Props) {
  const { room } = use(params)
  const roomName = room.toUpperCase()

  const [connected, setConnected] = useState(false)
  const [acList, setAcList] = useState<any[]>([])

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

    setConnected(true)
  }, [])

  useWebSocket(`/ws/room/${roomName}`, onWSMessage)

  if (!connected) {
    return <div className="p-6">🔌 Connecting to ML…</div>
  }

  if (!acList || acList.length === 0) {
    return <div className="p-6">⏳ Waiting for AC data…</div>
  }

  const roomACs = acList.filter(ac => (ac.Device_ID || '').toUpperCase().includes(roomName))

  const normal = roomACs.filter(a => a.pred_condition === 'Normal')
  const maintenance = roomACs.filter(a => a.pred_condition === 'Maintenance')
  const critical = roomACs.filter(a => a.pred_condition === 'Critical')

  const renderCards = (list: typeof roomACs) => {
    if (list.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No devices in this category
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map(ac => (
          <Link
            key={ac.Device_ID}
            href={`/rooms/${room}/${ac.Device_ID.toLowerCase()}`}
          >
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{ac.Device_ID}</h3>
                  <Badge
                    className={cn(
                      ac.pred_condition === 'Normal' &&
                        'bg-green-100 text-green-700',
                      ac.pred_condition === 'Maintenance' &&
                        'bg-yellow-100 text-yellow-700',
                      ac.pred_condition === 'Critical' &&
                        'bg-red-100 text-red-700'
                    )}
                  >
                    {ac.pred_condition}
                  </Badge>
                </div>

                <div className="text-sm">
                  Health: {ac.Health_Score.toFixed(0)}%
                </div>
                <div className="text-sm">
                  Power: {ac.Real_Power_calc.toFixed(1)} W
                </div>
                <div className="text-xs text-muted-foreground">
                  {ac.Maintenance_Advice || 'Normal Operation'}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{roomName}</h1>
      <p className="text-muted-foreground">Live ML-powered monitoring</p>

      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">All ({roomACs.length})</TabsTrigger>
          <TabsTrigger value="normal">Normal ({normal.length})</TabsTrigger>
          <TabsTrigger value="maintenance">
            Maintenance ({maintenance.length})
          </TabsTrigger>
          <TabsTrigger value="critical">
            Critical ({critical.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderCards(roomACs)}
        </TabsContent>
        <TabsContent value="normal" className="mt-6">
          {renderCards(normal)}
        </TabsContent>
        <TabsContent value="maintenance" className="mt-6">
          {renderCards(maintenance)}
        </TabsContent>
        <TabsContent value="critical" className="mt-6">
          {renderCards(critical)}
        </TabsContent>
      </Tabs>
    </div>
  )
}