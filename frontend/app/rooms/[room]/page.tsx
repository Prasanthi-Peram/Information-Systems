"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
  Thermometer,
  Droplets,
  TrendingUp,
  Clock,
  Zap,
  Power,
  Activity,
  ArrowLeft,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { use, useState, useEffect } from 'react'

interface ACUnit {
  device_id: string
  status: 'on' | 'off' | 'maintenance'
  temperature: number
  humidity: number
  current: number
  voltage: number
  hours_today: number
  performance: number
  health: number
  total_hours: number
  condition: string
  condition_color: string
}

interface RoomDetails {
  room_name: string
  avg_temp: number
  avg_humidity: number
  avg_performance: number
  max_uptime: number
  units: ACUnit[]
}

interface RoomPageProps {
  params: Promise<{
    room: string
  }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter()
  const { room } = use(params)
  const [data, setData] = useState<RoomDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDeviceId, setNewDeviceId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roomName = room
    ? decodeURIComponent(room).replace(/-/g, ' ').toUpperCase()
    : 'Room'

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/rooms/${room}`)
      const result = await response.json()
      if (result.error) {
        console.error(result.error)
      } else {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching room details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoomDetails()
  }, [room])

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeviceId.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('http://localhost:8000/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: newDeviceId.trim(),
          room_name: room
        }),
      })
      const result = await response.json()
      if (result.status === 'success') {
        setNewDeviceId('')
        setIsModalOpen(false)
        fetchRoomDetails()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error adding device:', error)
      alert('Failed to add device')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading room details...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Room not found.</p>
        <Link href="/rooms">
          <Button variant="outline">Back to Rooms</Button>
        </Link>
      </div>
    )
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

  const tabCounts = {
    all: data.units.length,
    active: data.units.filter(u => u.status === 'on').length,
    inactive: data.units.filter(u => u.status === 'off').length,
    maintenance: data.units.filter(u => u.status === 'maintenance').length,
  }

  const metricCards = [
    {
      icon: Thermometer,
      iconColor: 'text-red-600',
      title: 'Room Temperature',
      value: `${data.avg_temp}°C`,
    },
    {
      icon: Droplets,
      iconColor: 'text-blue-600',
      title: 'Humidity',
      value: `${data.avg_humidity}%`,
    },
    {
      icon: TrendingUp,
      iconColor: 'text-pink-600',
      title: 'Average Performance',
      value: data.avg_performance,
    },
    {
      icon: Clock,
      iconColor: 'text-purple-600',
      title: 'Uptime',
      value: formatDuration(data.max_uptime),
    },
  ]


  const renderUnitCard = (unit: ACUnit) => {
    return (
      <Link key={unit.device_id} href={`/rooms/${room}/${unit.device_id.toLowerCase()}`}>
        <Card className="relative cursor-pointer hover:shadow-md transition-shadow h-full">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold mb-0.5">{unit.device_id}</h3>
              </div>
              <Badge className={cn(
                'px-2 py-0.5 rounded-full text-xs font-bold',
                unit.status === 'on' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                  unit.status === 'off' ? 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
              )}>
                {unit.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="text-base font-semibold">
                      {unit.temperature > 0 ? `${unit.temperature.toFixed(1)}°C` : '--'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Humidity</p>
                    <p className="text-base font-semibold">
                      {unit.humidity > 0 ? `${unit.humidity.toFixed(1)}%` : '--'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className="text-base font-semibold">
                      {unit.current > 0 ? `${unit.current.toFixed(1)}A` : '--'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Voltage</p>
                    <p className="text-base font-semibold">
                      {unit.voltage > 0 ? `${unit.voltage.toFixed(0)}V` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Power className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Runtime Today</p>
                <p className="text-base font-semibold">{formatDuration(unit.hours_today)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Performance</span>
                <span className="font-semibold">{unit.performance.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                <div
                  className={cn(
                    'h-1.5 rounded-full',
                    unit.performance >= 90 ? 'bg-green-500' :
                      unit.performance >= 70 ? 'bg-purple-500' :
                        unit.performance > 0 ? 'bg-yellow-500' :
                          'bg-gray-400'
                  )}
                  style={{ width: `${unit.performance}%` }}
                />
              </div>
              <p className={cn('text-sm font-semibold', unit.condition_color)}>
                {unit.condition}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="@container grow w-full space-y-6">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-3xl font-bold">{roomName}</h1>
          <div className="flex flex-col gap-2">
            <Link href="/rooms">
              <Button
                variant="ghost"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Real-time monitoring and control</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 @3xl:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-4">
                <card.icon className={cn('size-5', card.iconColor)} />
              </div>
              <div className="flex-1 flex flex-col justify-between grow">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">{card.title}</div>
                  <div className="text-2xl font-bold text-foreground">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for AC Units */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 data-[state=active]:dark:bg-purple-950 data-[state=active]:dark:text-purple-400 data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:bg-gray-800 data-[state=inactive]:dark:text-gray-400"
          >
            All Units ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:dark:bg-green-950 data-[state=active]:dark:text-green-400 data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:bg-gray-800 data-[state=inactive]:dark:text-gray-400"
          >
            Active ({tabCounts.active})
          </TabsTrigger>
          <TabsTrigger
            value="inactive"
            className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-700 data-[state=active]:dark:bg-gray-700 data-[state=active]:dark:text-gray-300 data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:bg-gray-800 data-[state=inactive]:dark:text-gray-400"
          >
            Inactive ({tabCounts.inactive})
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700 data-[state=active]:dark:bg-yellow-950 data-[state=active]:dark:text-yellow-400 data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:bg-gray-800 data-[state=inactive]:dark:text-gray-400"
          >
            Maintenance ({tabCounts.maintenance})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {data.units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.units.map(renderUnitCard)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-1">No AC Units Found</h3>
              <p className="text-muted-foreground mb-4">This room doesn't have any devices assigned yet.</p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Device
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.units.filter(u => u.status === 'on').map(renderUnitCard)}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.units.filter(u => u.status === 'off').map(renderUnitCard)}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.units.filter(u => u.status === 'maintenance').map(renderUnitCard)}
          </div>
        </TabsContent>
      </Tabs>
      {/* Add Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New AC Device</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="deviceId" className="text-sm font-medium">
                    Device ID
                  </label>
                  <input
                    id="deviceId"
                    type="text"
                    placeholder="e.g. NR221-AC-03"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsModalOpen(false)
                      setNewDeviceId('')
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !newDeviceId.trim()}>
                    {isSubmitting ? 'Adding...' : 'Add Device'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
