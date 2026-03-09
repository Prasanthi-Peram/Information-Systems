"use client"

import { useState } from 'react'
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

export function DeviceReport({ room, deviceID }: { room: string; deviceID: string }) {
  const [timeRange, setTimeRange] = useState('24h')
  
  const roomName = room 
    ? decodeURIComponent(room).replace(/-/g, ' ').toUpperCase()
    : 'Room'
  const deviceIdDisplay = decodeURIComponent(deviceID).toUpperCase()
  
  // Mock device data - in real app, fetch based on deviceID
  // use shared mock data function to ensure exports match maintenance page
  const deviceData: DeviceData = getMockDeviceData(deviceIdDisplay, roomName)

  // Generate mock temperature and humidity data for different time ranges
  const generateChartData = (range: string) => {
    const dataPoints = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 12
    const labels = range === '24h' 
      ? Array.from({length: dataPoints}, (_, i) => `${i}:00`)
      : range === '7d'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : range === '30d'
      ? Array.from({length: dataPoints}, (_, i) => `Day ${i + 1}`)
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return {
      labels,
      temperature: Array.from({length: dataPoints}, () => 20 + Math.random() * 8),
      humidity: Array.from({length: dataPoints}, () => 40 + Math.random() * 20)
    }
  }

  const [chartData, setChartData] = useState(generateChartData(timeRange))

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
    setChartData(generateChartData(range))
  }

  const handleExportReport = () => {
    exportDeviceReport(deviceData)
  }

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '1y', label: '1 Year' }
  ]

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

      {/* Temperature and Humidity Graph - Bottom */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Temperature & Humidity Trends
              </CardTitle>
              <CardDescription>
                Monitor temperature and humidity over time for {deviceIdDisplay}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeRangeChange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 relative">
            {/* SVG Line Chart */}
            <svg viewBox="0 0 800 320" className="w-full h-full">
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line
                  key={`h-${i}`}
                  x1="60"
                  y1={40 + i * 40}
                  x2="740"
                  y2={40 + i * 40}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
              
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <line
                  key={`v-${i}`}
                  x1={60 + i * 85}
                  y1="40"
                  x2={60 + i * 85}
                  y2="280"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
              
              {/* Temperature Line */}
              <polyline
                points={chartData.temperature.slice(0, 9).map((temp, i) => 
                  `${60 + i * 85},${280 - (temp - 15) * 20}`
                ).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
              />
              
              {/* Humidity Line */}
              <polyline
                points={chartData.humidity.slice(0, 9).map((humidity, i) => 
                  `${60 + i * 85},${280 - (humidity - 30) * 8}`
                ).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
              />
              
              {/* Data Points for Temperature */}
              {chartData.temperature.slice(0, 9).map((temp, i) => (
                <circle
                  key={`temp-${i}`}
                  cx={60 + i * 85}
                  cy={280 - (temp - 15) * 20}
                  r="3"
                  fill="#ef4444"
                />
              ))}
              
              {/* Data Points for Humidity */}
              {chartData.humidity.slice(0, 9).map((humidity, i) => (
                <circle
                  key={`humidity-${i}`}
                  cx={60 + i * 85}
                  cy={280 - (humidity - 30) * 8}
                  r="3"
                  fill="#3b82f6"
                />
              ))}
              
              {/* Left Y-axis labels (Temperature) */}
              {[30, 25, 20, 15].map((temp) => (
                <text
                  key={`temp-label-${temp}`}
                  x="45"
                  y={280 - (temp - 15) * 20 + 5}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                >
                  {temp}
                </text>
              ))}
              
              {/* Right Y-axis labels (Humidity) */}
              {[70, 60, 50, 40].map((humidity) => (
                <text
                  key={`humidity-label-${humidity}`}
                  x="755"
                  y={280 - (humidity - 30) * 8 + 5}
                  textAnchor="start"
                  className="text-xs fill-blue-600"
                >
                  {humidity}
                </text>
              ))}
              
              {/* X-axis labels */}
              {chartData.labels.slice(0, 9).map((label, i) => (
                <text
                  key={`label-${i}`}
                  x={60 + i * 85}
                  y="300"
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {label}
                </text>
              ))}
              
              {/* Axis Labels */}
              <text x="25" y="160" textAnchor="middle" className="text-xs fill-red-600" transform="rotate(-90 25 160)">
                Temperature (°C)
              </text>
              <text x="775" y="160" textAnchor="middle" className="text-xs fill-blue-600" transform="rotate(90 775 160)">
                Humidity (%)
              </text>
            </svg>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-500 rounded"></div>
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium">Humidity</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Info Card */}
      <Card className="bg-white dark:bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Maintenance Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Last Service */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-600">Last Service</span>
              <span className="text-gray-900 font-semibold">{deviceData.lastService}</span>
            </div>

            {/* Next Service Due */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-600">Next Service Due</span>
              <span className="text-gray-900 font-semibold">{deviceData.nextServiceDue}</span>
            </div>

            {/* Warranty Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Warranty Status</span>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                {deviceData.warrantyStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DevicePage({ params }: DevicePageProps) {
  const { room, deviceID } = use(params)
  return <DeviceReport room={room} deviceID={deviceID} />
}

