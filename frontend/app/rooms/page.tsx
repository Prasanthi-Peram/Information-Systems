'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { School, Thermometer, Wind, Zap, ArrowLeft, Plus, Search } from 'lucide-react'

interface RoomData {
  device_id: string
  name: string
  temperature: number
  humidity: number
  ac_status: 'on' | 'off'
  power_consumption: number
}

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://localhost:8000/rooms/status')
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Error fetching rooms status:', error)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleRoomClick = (roomName: string) => {
    // Navigate to specific room page using the room name (location)
    router.push(`/rooms/${encodeURIComponent(roomName)}`)
  }

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('http://localhost:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newRoomName.trim() }),
      })
      const result = await response.json()
      if (result.status === 'success') {
        setNewRoomName('')
        setIsModalOpen(false)
        fetchRooms()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error adding room:', error)
      alert('Failed to add room')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.device_id?.toLowerCase().includes(searchTerm.toLowerCase())
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
            onClick={() => setIsModalOpen(true)}
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

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No AC devices found. Start the simulation to see real-time data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <Card
              key={room.name}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleRoomClick(room.name)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {room.name || room.device_id}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{(room.temperature ?? 0).toFixed(1)}°C</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${room.status === 'on'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    AC {room.status === 'on' ? 'On' : 'Off'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-cyan-500" />
                    <span>{(room.humidity ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>{(room.power_consumption ?? 0).toFixed(2)}kW</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRoomClick(room.name)
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Room</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="roomName" className="text-sm font-medium">
                    Room Name
                  </label>
                  <input
                    id="roomName"
                    type="text"
                    placeholder="e.g. NR223"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
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
                      setNewRoomName('')
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !newRoomName.trim()}>
                    {isSubmitting ? 'Adding...' : 'Add Room'}
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
