"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { status: "good", count: 275, fill: "#22c55e" },
  { status: "fair", count: 200, fill: "#eab308" },
  { status: "poor", count: 187, fill: "#ef4444" },
]

const chartConfig = {
  count: {
    label: "Count",
  },
  good: {
    label: "Good",
    color: "#22c55e",
  },
  fair: {
    label: "Fair",
    color: "#eab308",
  },
  poor: {
    label: "Poor",
    color: "#ef4444",
  },
} satisfies ChartConfig

const COLORS = [
  "#22c55e", // green for good
  "#eab308", // yellow for fair
  "#ef4444", // red for poor
]

export function HealthChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Health Status</CardTitle>
        <CardDescription>AC System Health Distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null
                  const data = payload[0]
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: data.payload?.fill || COLORS[0] }}
                        />
                        <span className="text-muted-foreground">{data.name}:</span>
                        <span className="font-medium">{data.value}</span>
                      </div>
                    </div>
                  )
                }}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Health improved by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing health status distribution across all AC units
        </div>
      </CardFooter>
    </Card>
  )
}
