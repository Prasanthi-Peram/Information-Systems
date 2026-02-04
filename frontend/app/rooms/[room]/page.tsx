"use client"

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Thermometer, 
  Droplets, 
  TrendingUp,
  Clock,
  Zap,
  Power,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { use } from 'react'

interface RoomPageProps {
  params: Promise<{
    room: string
  }>
}

export default function RoomPage({ params }: RoomPageProps) {
  // Extract room name from params
  const { room } = use(params)
  const roomName = room 
    ? decodeURIComponent(room).replace(/-/g, ' ').toUpperCase()
    : 'Room'
  
  // Tab counts - these would come from your data source
  const tabCounts = {
    all: 6,
    active: 4,
    inactive: 1,
    maintenance: 1,
  }
  
  // Metric cards (Temperature, Humidity, Average Performance, Uptime)
  const metricCards = [
    {
      icon: Thermometer,
      iconColor: 'text-red-600',
      title: 'Room Temperature',
      badge: {
        color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
        icon: TrendingUp,
        iconColor: 'text-green-500',
        text: '+2.1%',
      },
      value: 24,
    },
    {
      icon: Droplets,
      iconColor: 'text-blue-600',
      title: 'Humidity',
      badge: {
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        icon: TrendingUp,
        iconColor: 'text-blue-500',
        text: '+1.5%',
      },
      value: 55,
    },
    {
      icon: TrendingUp,
      iconColor: 'text-pink-600',
      title: 'Average Performance',
      badge: {
        color: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
        icon: TrendingUp,
        iconColor: 'text-pink-500',
        text: '+3.2%',
      },
      value: 92,
    },
    {
      icon: Clock,
      iconColor: 'text-purple-600',
      title: 'Uptime',
      badge: {
        color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
        icon: TrendingUp,
        iconColor: 'text-purple-500',
        text: '+0.5%',
      },
      value: 99.8,
    },
  ]

  // AC Unit cards data
  const allUnits = [
    {
      id: 1,
      deviceId: 'AC-001',
      location: 'Conference Room A',
      status: 'ON',
      temperature: 22.5,
      current: 8.5,
      voltage: 230,
      hoursToday: 6.5,
      performance: 95,
      condition: 'Excellent',
      conditionColor: 'text-green-500',
    },
    {
      id: 2,
      deviceId: 'AC-002',
      location: 'Office Floor 1',
      status: 'ON',
      temperature: 23,
      current: 9.2,
      voltage: 228,
      hoursToday: 7.2,
      performance: 87,
      condition: 'Good',
      conditionColor: 'text-purple-500',
    },
    {
      id: 3,
      deviceId: 'AC-003',
      location: 'Server Room',
      status: 'ON',
      temperature: 18.5,
      current: 10.1,
      voltage: 231,
      hoursToday: 24,
      performance: 98,
      condition: 'Excellent',
      conditionColor: 'text-green-500',
    },
    {
      id: 4,
      deviceId: 'AC-004',
      location: 'Lobby',
      status: 'ON',
      temperature: 24,
      current: 7.8,
      voltage: 229,
      hoursToday: 5.5,
      performance: 82,
      condition: 'Good',
      conditionColor: 'text-purple-500',
    },
    {
      id: 5,
      deviceId: 'AC-005',
      location: 'Cafeteria',
      status: 'OFF',
      temperature: 25,
      current: 0,
      voltage: 0,
      hoursToday: 0,
      performance: 0,
      condition: 'Inactive',
      conditionColor: 'text-gray-500',
    },
    {
      id: 6,
      deviceId: 'AC-006',
      location: 'Storage Room',
      status: 'MAINTENANCE',
      temperature: 20,
      current: 0,
      voltage: 0,
      hoursToday: 0,
      performance: 0,
      condition: 'Maintenance',
      conditionColor: 'text-yellow-500',
    },
  ]

  const activeUnits = allUnits.filter(unit => unit.status === 'ON')
  const inactiveUnits = allUnits.filter(unit => unit.status === 'OFF')
  const maintenanceUnits = allUnits.filter(unit => unit.status === 'MAINTENANCE')

  return (
    <div className="@container grow w-full space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">{roomName}</h1>
          <p className="text-muted-foreground">Real-time monitoring and control</p>
        </div>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 @3xl:grid-cols-4 gap-4">
          {metricCards.map((card, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-4">
                  <card.icon className={cn('size-5', card.iconColor)} />
                  <Badge className={cn('px-2 py-0.5 rounded-full flex items-center gap-1 text-xs', card.badge.color)}>
                    <card.badge.icon className={`w-3 h-3 ${card.badge.iconColor}`} />
                    {card.badge.text}
                  </Badge>
                </div>
                <div className="flex-1 flex flex-col justify-between grow">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">{card.title}</div>
                    <div className="text-2xl font-bold text-foreground">
                      {card.value === 24 
                        ? `${card.value}°C`
                        : card.value === 55
                        ? `${card.value}%`
                        : card.value === 92
                        ? card.value.toLocaleString()
                        : card.value === 99.8
                        ? `${card.value}%`
                        : card.value.toLocaleString()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allUnits.map((unit) => (
                <Link key={unit.id} href={`/rooms/${room}/${unit.deviceId.toLowerCase()}`}>
                  <Card className="relative cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-0.5">{unit.deviceId}</h3>
                      </div>
                      <Badge className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        unit.status === 'ON' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                        unit.status === 'OFF' ? 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                      )}>
                        {unit.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Temperature</p>
                            <p className="text-base font-semibold">{unit.temperature}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Current</p>
                            <p className="text-base font-semibold">{unit.current}A</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Voltage</p>
                            <p className="text-base font-semibold">{unit.voltage}V</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Power className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Hours Today</p>
                            <p className="text-base font-semibold">{unit.hoursToday}h</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Performance</span>
                        <span className="font-semibold">{unit.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                        <div 
                          className={cn(
                            'h-1.5 rounded-full',
                            unit.performance >= 90 ? 'bg-green-500' :
                            unit.performance >= 80 ? 'bg-purple-500' :
                            'bg-gray-400'
                          )}
                          style={{ width: `${unit.performance}%` }}
                        />
                      </div>
                      <p className={cn('text-sm font-semibold', unit.conditionColor)}>
                        {unit.condition}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeUnits.map((unit) => (
                <Link key={unit.id} href={`/rooms/${room}/${unit.deviceId.toLowerCase()}`}>
                  <Card className="relative cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-0.5">{unit.deviceId}</h3>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 px-2 py-0.5 rounded-full text-xs">
                        {unit.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Temperature</p>
                            <p className="text-base font-semibold">{unit.temperature}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Current</p>
                            <p className="text-base font-semibold">{unit.current}A</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Voltage</p>
                            <p className="text-base font-semibold">{unit.voltage}V</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Power className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Hours Today</p>
                            <p className="text-base font-semibold">{unit.hoursToday}h</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Performance</span>
                        <span className="font-semibold">{unit.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                        <div 
                          className={cn(
                            'h-1.5 rounded-full',
                            unit.performance >= 90 ? 'bg-green-500' :
                            unit.performance >= 80 ? 'bg-purple-500' :
                            'bg-gray-400'
                          )}
                          style={{ width: `${unit.performance}%` }}
                        />
                      </div>
                      <p className={cn('text-sm font-semibold', unit.conditionColor)}>
                        {unit.condition}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inactiveUnits.map((unit) => (
                <Link key={unit.id} href={`/rooms/${room}/${unit.deviceId.toLowerCase()}`}>
                  <Card className="relative cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-0.5">{unit.deviceId}</h3>
                      </div>
                      <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                        {unit.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Temperature</p>
                            <p className="text-base font-semibold">{unit.temperature}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Current</p>
                            <p className="text-base font-semibold">{unit.current}A</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Voltage</p>
                            <p className="text-base font-semibold">{unit.voltage}V</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Power className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Hours Today</p>
                            <p className="text-base font-semibold">{unit.hoursToday}h</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Performance</span>
                        <span className="font-semibold">{unit.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                        <div 
                          className={cn(
                            'h-1.5 rounded-full',
                            unit.performance >= 90 ? 'bg-green-500' :
                            unit.performance >= 80 ? 'bg-purple-500' :
                            'bg-gray-400'
                          )}
                          style={{ width: `${unit.performance}%` }}
                        />
                      </div>
                      <p className={cn('text-sm font-semibold', unit.conditionColor)}>
                        {unit.condition}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="maintenance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {maintenanceUnits.map((unit) => (
                <Link key={unit.id} href={`/rooms/${room}/${unit.deviceId.toLowerCase()}`}>
                  <Card className="relative cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-0.5">{unit.deviceId}</h3>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 px-2 py-0.5 rounded-full text-xs">
                        {unit.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Temperature</p>
                            <p className="text-base font-semibold">{unit.temperature}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Current</p>
                            <p className="text-base font-semibold">{unit.current}A</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Voltage</p>
                            <p className="text-base font-semibold">{unit.voltage}V</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Power className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Hours Today</p>
                            <p className="text-base font-semibold">{unit.hoursToday}h</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Performance</span>
                        <span className="font-semibold">{unit.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                        <div 
                          className={cn(
                            'h-1.5 rounded-full',
                            unit.performance >= 90 ? 'bg-green-500' :
                            unit.performance >= 80 ? 'bg-purple-500' :
                            'bg-gray-400'
                          )}
                          style={{ width: `${unit.performance}%` }}
                        />
                      </div>
                      <p className={cn('text-sm font-semibold', unit.conditionColor)}>
                        {unit.condition}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  )
}
