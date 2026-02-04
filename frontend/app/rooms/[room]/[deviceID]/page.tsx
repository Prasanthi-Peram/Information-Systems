"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Thermometer, 
  Droplets, 
  Zap, 
  Power,
  Activity,
  ArrowLeft,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChartAreaInteractive } from '@/components/ui/parameters'

interface DevicePageProps {
  params: Promise<{
    room: string
    deviceID: string
  }>
}

export default function DevicePage({ params }: DevicePageProps) {
  const { room, deviceID } = use(params)
  const roomName = room 
    ? decodeURIComponent(room).replace(/-/g, ' ').toUpperCase()
    : 'Room'
  const deviceIdDisplay = decodeURIComponent(deviceID).toUpperCase()
  
  // Mock device data - in real app, fetch based on deviceID
  const performance = 95
  const condition = performance >= 90 ? 'Good' : performance >= 70 ? 'Fair' : 'Poor'
  const conditionColor = performance >= 90 ? 'text-green-500' : performance >= 70 ? 'text-yellow-500' : 'text-red-500'
  
  const deviceData = {
    deviceId: deviceIdDisplay,
    location: 'Conference Room A',
    status: 'ON',
    temperature: 22.5,
    current: 8.5,
    voltage: 230,
    hoursToday: 6.5,
    totalHoursOperated: 1245.5,
    performance,
    condition,
    conditionColor,
    humidity: 55,
    powerConsumption: 2.4,
  }

  const metrics = [
    {
      icon: Thermometer,
      iconColor: 'text-red-600',
      label: 'Temperature',
      value: `${deviceData.temperature}°C`,
      description: 'Current room temperature',
    },
    {
      icon: Droplets,
      iconColor: 'text-blue-600',
      label: 'Humidity',
      value: `${deviceData.humidity}%`,
      description: 'Relative humidity level',
    },
    {
      icon: Activity,
      iconColor: 'text-purple-600',
      label: 'Current',
      value: `${deviceData.current}A`,
      description: 'Electrical current',
    },
    {
      icon: Zap,
      iconColor: 'text-yellow-600',
      label: 'Voltage',
      value: `${deviceData.voltage}V`,
      description: 'Electrical voltage',
    },
    {
      icon: Power,
      iconColor: 'text-green-600',
      label: 'Power Consumption',
      value: `${deviceData.powerConsumption} kW`,
      description: 'Current power usage',
    },
    {
      icon: Activity,
      iconColor: 'text-pink-600',
      label: 'Hours Today',
      value: `${deviceData.hoursToday}h`,
      description: 'Runtime today',
    },
  ]

  return (
    <div className="@container grow w-full space-y-6">
      <div className="mb-4">
        <Link href={`/rooms/${room}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {roomName}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">{deviceIdDisplay}</h1>
        <p className="text-muted-foreground">{deviceData.location}</p>
      </div>

      {/* Side by side layout: Electrical Parameters (75%) and Device Status (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Electrical Parameters Chart - 75% width */}
        <div className="lg:col-span-3 flex">
          <div className="w-full">
            <ChartAreaInteractive />
          </div>
        </div>

        {/* Device Status Card - 25% width */}
        <div className="lg:col-span-1 flex">
          <Card className="w-full flex flex-col h-full">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Device Status</CardTitle>
                  <CardDescription className="text-xs">Current operational status</CardDescription>
                </div>
                <Badge className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  deviceData.status === 'ON' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                  deviceData.status === 'OFF' ? 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                )}>
                  {deviceData.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 py-3">
              {/* Performance Score and Condition side by side */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Performance Score</p>
                  <p className="text-sm">{deviceData.performance}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Condition</p>
                  <p className={cn('text-sm', deviceData.conditionColor)}>
                    {deviceData.condition}
                  </p>
                </div>
              </div>

              {/* Runtime Today and Total Hours side by side */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Runtime Today</p>
                  <p className="text-sm">{deviceData.hoursToday} hours</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Total Hours</p>
                  <p className="text-sm">{deviceData.totalHoursOperated}h</p>
                </div>
              </div>

              {/* All Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                {metrics.map((metric, index) => (
                  <div key={index} className="space-y-0.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <CardTitle className="text-xs font-medium">{metric.label}</CardTitle>
                      <metric.icon className={cn('h-3.5 w-3.5', metric.iconColor)} />
                    </div>
                    <div className="text-sm">{metric.value}</div>
                    <p className="text-[10px] text-muted-foreground">{metric.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

