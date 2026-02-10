'use client'

import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function HealthChart({ data }: { data: { health: number }[] }) {
  const healthy = data.filter(d => d.health >= 75).length
  const warning = data.filter(d => d.health >= 50 && d.health < 75).length
  const critical = data.filter(d => d.health < 50).length

  const chartData = [
    { name: 'Healthy', value: healthy },
    { name: 'Warning', value: warning },
    { name: 'Critical', value: critical },
  ]

  const COLORS = ['#22c55e', '#eab308', '#ef4444']

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Health Status</CardTitle>
        <p className="text-sm text-muted-foreground">
          AC System Health Distribution
        </p>
      </CardHeader>

      <CardContent className="flex justify-center items-center pt-4">
        <PieChart width={260} height={260}>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={55}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </CardContent>
    </Card>
  )
}