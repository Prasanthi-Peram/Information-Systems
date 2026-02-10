'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Tooltip,
} from 'recharts'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type DataPoint = {
  time: string
  voltage: number
  current: number
  power: number
}

type Props = {
  data: DataPoint[]
}

export function ChartAreaInteractive({ data }: Props) {
  const [parameter, setParameter] = React.useState<'voltage' | 'current' | 'power'>('voltage')
  const [range, setRange] = React.useState<'7d' | '30d' | '90d'>('90d')

  // -----------------------------
  // TIME FILTER
  // -----------------------------
  const filteredData = React.useMemo(() => {
    const days =
      range === '7d' ? 7 :
      range === '30d' ? 30 : 90

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return data.filter((d) => new Date(d.time) >= cutoff)
  }, [data, range])

  const labelMap = {
    voltage: 'Voltage (V)',
    current: 'Current (A)',
    power: 'Power Consumption (W)',
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Electrical Parameters</CardTitle>

        <div className="flex gap-2">
          {/* PARAMETER SELECT */}
          <Select value={parameter} onValueChange={(v) => setParameter(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="voltage">Voltage</SelectItem>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="power">Power</SelectItem>
            </SelectContent>
          </Select>

          {/* TIME RANGE */}
          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <AreaChart
          width={900}
          height={300}
          data={filteredData}
        >
          <defs>
            <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            }
          />

          <Tooltip
            formatter={(value) => [
              Number(value).toFixed(2),
              labelMap[parameter],
            ]}
            labelFormatter={(label) =>
              new Date(label).toLocaleString()
            }
          />

          <Area
            type="monotone"
            dataKey={parameter}
            stroke="#2563eb"
            fill="url(#fillGradient)"
          />
        </AreaChart>
      </CardContent>
    </Card>
  )
}