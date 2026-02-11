'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { School, Thermometer, Wind, Zap, ArrowLeft, Plus, Search } from 'lucide-react'

interface RoomData {
  id: string
  name: string
  temperature: number
  humidity: number
  acStatus: 'on' | 'off'
  powerConsumption: number
  capacity: number
}

const roomsData: RoomData[] = [
  {
    id: 'nr312',
    name: 'NR312',
    temperature: 22,
    humidity: 45,
    acStatus: 'on',
    powerConsumption: 2.5,
    capacity: 30
  },
  {
    id: 'nc324',
    name: 'NC324',
    temperature: 21,
    humidity: 50,
    acStatus: 'on',
    powerConsumption: 3.2,
    capacity: 25
  },
  {
    id: 'nr422',
    name: 'NR422',
    temperature: 23,
    humidity: 42,
    acStatus: 'off',
    powerConsumption: 0,
    capacity: 35
  },
  {
    id: 'ords-lab',
    name: 'ORDS Lab',
    temperature: 20,
    humidity: 40,
    acStatus: 'on',
    powerConsumption: 4.1,
    capacity: 20
  }
]

export default function RoomsPage() {
  const router = useRouter()
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')

  const handleRoomClick = (roomId: string) => {
    setSelectedRoom(roomId)
    // Navigate to specific room page
    window.location.href = `/rooms/${roomId}`
  }

  const handleAddRoom = () => {
    // Placeholder for add room functionality
    alert('Add Room functionality coming soon!')
  }

  const filteredRooms = roomsData.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Rooms Management</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">Monitor and control AC systems in different rooms</p>
          <Button
            onClick={handleAddRoom}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map((room) => (
          <Card 
            key={room.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleRoomClick(room.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                {room.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{room.temperature}°C</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  room.acStatus === 'on' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  AC {room.acStatus === 'on' ? 'On' : 'Off'}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-cyan-500" />
                  <span>{room.humidity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>{room.powerConsumption}kW</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRoomClick(room.id)
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
