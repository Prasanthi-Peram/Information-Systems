"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Thermometer,
  Droplets,
  Zap,
  Power,
  Activity,
  ArrowLeft,
  Clock,
  TrendingUp,
  Settings,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ChartAreaInteractive } from '@/components/ui/Parameters'
import { downloadPdfReport } from '@/lib/pdf-utils'
import { getMockDeviceData, DeviceData, exportDeviceReport } from '@/lib/device-utils'

interface DevicePageProps {
  params: Promise<{
    room: string
    deviceID: string
  }>
}

function DeviceReport({ room, deviceID }: { room: string; deviceID: string }) {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState("1h")

  const roomName = room
    ? decodeURIComponent(room).replace(/-/g, ' ').toUpperCase()
    : 'Room'
  const deviceIdDisplay = decodeURIComponent(deviceID).toUpperCase()

  const fetchDeviceDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/devices/${deviceID}`)
      const data = await response.json()
      setDeviceData(data)
    } catch (error) {
      console.error('Error fetching device details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/devices/${deviceID}/history?range=${timeRange}`)
      const data = await response.json()
      setHistoryData(data)
    } catch (error) {
      console.error('Error fetching device history:', error)
    }
  }

  useEffect(() => {
    fetchDeviceDetails()
    const interval = setInterval(fetchDeviceDetails, 30000)
    return () => clearInterval(interval)
  }, [deviceID])

  useEffect(() => {
    fetchDeviceHistory()
  }, [deviceID, timeRange])

  const handleExportReport = () => {
    if (deviceData) {
      exportDeviceReport(deviceData)
    }
  }

  const formatDuration = (hours: number) => {
    if (hours >= 1) {
      return `${hours.toFixed(1)}h`
    }
    const minutes = Math.floor(hours * 60)
    if (minutes >= 1) {
      return `${minutes}m`
    }
    const seconds = Math.round(hours * 3600)
    return `${seconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading device details...</p>
      </div>
    )
  }

  if (!deviceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Device not found.</p>
      </div>
    )
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
      label: 'Runtime Today',
      value: formatDuration(deviceData.hoursToday),
      description: 'Runtime today',
    },
  ]



  return (
    <div className="@container grow w-full space-y-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">{deviceIdDisplay}</h1>
            <p className="text-muted-foreground">{deviceData.location}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/rooms/${room}`}>
              <Button variant="ghost" size="sm" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              onClick={handleExportReport}
              className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 w-full"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Electrical Parameters Chart - Top */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Electrical Parameters Chart - 75% width */}
        <div className="lg:col-span-3 flex">
          <div className="w-full">
            <ChartAreaInteractive
              data={historyData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
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
                  deviceData.status === 'on' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                    deviceData.status === 'off' ? 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                )}>
                  {deviceData.status.toUpperCase()}
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
                  <p className="text-sm">{formatDuration(deviceData.hoursToday)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Total Runtime</p>
                  <p className="text-sm">{formatDuration(deviceData.totalHoursOperated)}</p>
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

      {/* Temperature and Humidity Graph - Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        <div className="lg:col-span-3 flex">
          <div className="w-full">
            <ChartAreaInteractive
              title="Temperature and Humidity"
              showParameterSelect={false}
              defaultParameter="temperature"
              data={historyData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>
        </div>
        <div className="lg:col-span-1 flex">
          {/* Maintenance Info Card */}
          <Card className="bg-white dark:bg-white border-gray-200 w-full">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-gray-900">Maintenance Info</CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <div className="space-y-3">
                {/* Last Service */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Last Service</span>
                  <span className="text-xs text-gray-900 font-semibold">{deviceData.lastService}</span>
                </div>

                {/* Next Service Due */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Next Service Due</span>
                  <span className="text-xs text-gray-900 font-semibold">{deviceData.nextServiceDue}</span>
                </div>

                {/* Warranty Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Warranty Status</span>
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 py-0">
                    {deviceData.warrantyStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DevicePage({ params }: DevicePageProps) {
  const { room, deviceID } = use(params)
  return <DeviceReport room={room} deviceID={deviceID} />
}

