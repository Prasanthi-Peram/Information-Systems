'use client'

import { useState, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  SunSnow,
  Zap,
  Briefcase,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'

import { ChartAreaInteractive } from '@/components/ui/parameters'
import { HealthChart } from '@/components/ui/health-chart'
import MaintenanceTable from '@/components/ui/maitenance-info'
import AlertsPanel from '@/components/ui/alerts-panel'
import { useWebSocket } from '@/hooks/useWebSocket'

/* ===============================
   TYPES
================================ */
export type ACData = {
  Device_ID: string
  Time_Stamp: string
  voltage: number
  Current: number
  Real_Power_calc: number
  pred_perf: number
  Health_Score: number
  pred_condition: string
  Maintenance_Advice: string
  critical_alert: number

  // OPTIONAL (future-safe)
  last_service_date?: string
  next_service_date?: string
}

type HistoryPoint = {
  time: string
  voltage: number
  current: number
  power: number
  health: number
}

export default function DashboardPage() {
  const [latestByAC, setLatestByAC] = useState<Record<string, ACData>>({})
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [wsConnected, setWsConnected] = useState(false)

  /* -------------------------------
     WEBSOCKET HANDLER
  -------------------------------- */
  const onWSMessage = useCallback((payload: any[] | any) => {
    console.log('WS payload:', payload)

    const rows = Array.isArray(payload) ? payload : [payload]
    if (!rows.length) return

    setLatestByAC((prev) => {
      const next = { ...prev }
      rows.forEach((r) => {
        if (!r?.Device_ID) return
        next[r.Device_ID] = r
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

    setWsConnected(true)
  }, [])

  useWebSocket('/ws/ml', onWSMessage)

  /* -------------------------------
     DERIVED DATA
  -------------------------------- */
  const acList = useMemo(() => Object.values(latestByAC), [latestByAC])
  const liveCount = acList.length

  /* -------------------------------
     UI STATES
  -------------------------------- */
  if (!wsConnected) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Connecting to ML WebSocket…
      </div>
    )
  }

  if (liveCount === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Waiting for ML data…
      </div>
    )
  }

  /* -------------------------------
     KPI CALCULATIONS
  -------------------------------- */
  const totalPower = acList.reduce(
    (s, r) => s + (r.Real_Power_calc ?? 0),
    0
  )

  const avgPerf =
    acList.reduce((s, r) => s + (r.pred_perf ?? 0), 0) / liveCount

  const avgHealth =
    acList.reduce((s, r) => s + (r.Health_Score ?? 0), 0) / liveCount

  const totalAlerts = acList.filter((r) => r.critical_alert === 1).length

  const cards = [
    { icon: SunSnow, title: 'Active ACs', value: liveCount },
    { icon: Zap, title: 'Power Consumption (W)', value: Math.round(totalPower) },
    { icon: ArrowUpRight, title: 'Avg Performance', value: avgPerf.toFixed(1) },
    { icon: Briefcase, title: 'Avg Health', value: avgHealth.toFixed(0) },
    { icon: AlertCircle, title: 'Alerts', value: totalAlerts },
  ]

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="p-6 space-y-6">

      <Badge className="bg-green-100 text-green-700">
        ● LIVE · ML updates every 3 seconds
      </Badge>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <Icon className="size-5 text-blue-600 mb-2" />
                <div className="text-sm text-muted-foreground">{c.title}</div>
                <div className="text-2xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ChartAreaInteractive data={history} />
        </div>
        <div className="lg:col-span-1">
          <HealthChart data={history} />
        </div>
      </div>

      {/* MAINTENANCE + ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        <div className="lg:col-span-3 overflow-hidden">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Information</CardTitle>
              <CardDescription>Live ML diagnostics</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <MaintenanceTable data={acList} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AlertsPanel data={acList} />
        </div>

      </div>
    </div>
  )
}