"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/Chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"

export const description = "An interactive area chart"


const chartConfig = {
  voltage: {
    label: "Voltage",
    color: "hsl(217.2 91.2% 59.8%)",
  },
  current: {
    label: "Current",
    color: "hsl(217.2 91.2% 59.8%)",
  },
  power: {
    label: "Power",
    color: "hsl(217.2 91.2% 59.8%)",
  },
  temperature: {
    label: "Temperature",
    color: "hsl(var(--chart-1))",
  },
  humidity: {
    label: "Humidity",
    color: "hsl(var(--chart-2))",
  },
  both: {
    label: "Both",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  title?: string
  showParameterSelect?: boolean
  defaultParameter?: "voltage" | "current" | "power" | "temperature" | "humidity"
  allowedParameters?: ("voltage" | "current" | "power" | "temperature" | "humidity")[]
  data: any[]
  timeRange: string
  onTimeRangeChange: (range: string) => void
}

export function ChartAreaInteractive({
  title = "Electrical Parameters",
  showParameterSelect = true,
  defaultParameter = "voltage",
  allowedParameters = ["voltage", "current", "power", "temperature", "humidity"],
  data,
  timeRange,
  onTimeRangeChange
}: ChartAreaInteractiveProps) {
  const [parameter, setParameter] = React.useState<"voltage" | "current" | "power" | "temperature" | "humidity">(defaultParameter)


  return (
    <Card className="pt-0 flex flex-col h-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex gap-2">
          {showParameterSelect && (
            <Select value={parameter} onValueChange={(value) => setParameter(value as any)}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:flex"
                aria-label="Select parameter"
              >
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {allowedParameters.includes("voltage") && (
                  <SelectItem value="voltage" className="rounded-lg">Voltage</SelectItem>
                )}
                {allowedParameters.includes("current") && (
                  <SelectItem value="current" className="rounded-lg">Current</SelectItem>
                )}
                {allowedParameters.includes("power") && (
                  <SelectItem value="power" className="rounded-lg">Power Consumption</SelectItem>
                )}
                {allowedParameters.includes("temperature") && (
                  <SelectItem value="temperature" className="rounded-lg">Temperature</SelectItem>
                )}
                {allowedParameters.includes("humidity") && (
                  <SelectItem value="humidity" className="rounded-lg">Humidity</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
          <Select value={timeRange} onValueChange={onTimeRangeChange} defaultValue="1h">
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:flex"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1h" className="rounded-lg">
                1 Hour
              </SelectItem>
              <SelectItem value="24h" className="rounded-lg">
                24 Hours
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 Days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                1 Month
              </SelectItem>
              <SelectItem value="1y" className="rounded-lg">
                1 Year
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-3 flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-full w-full min-h-[280px]"
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillSelected" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-power)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-power)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillTemperature" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-temperature)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-temperature)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-humidity)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-humidity)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={10}
              interval={0}
              tickFormatter={(value) => {
                const date = new Date(value)
                if (isNaN(date.getTime())) return ""
                if (timeRange === "24h" || timeRange === "1h") {
                  return date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                  })
                }
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={parameter}
              type="natural"
              fill="url(#fillSelected)"
              stroke="hsl(217.2 91.2% 59.8%)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
