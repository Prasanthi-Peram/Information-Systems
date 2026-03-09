'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SunSnow, Zap, Briefcase, ArrowUpRight, AlertCircle, Calendar, Users, X, ArrowLeft, Thermometer, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HealthChart } from '@/components/ui/health-chart'
import { ChartAreaInteractive } from '@/components/ui/parameters'
import { useState, useEffect } from 'react'

interface MaintenanceRecord {
  id: string
  deviceId: string
  room: string
  lastService: string
  nextService: string
  issue: string
  criticality: 'Low' | 'Medium' | 'High'
  scheduled?: boolean
  technician?: string
}

interface Technician {
  id: string
  name: string
  specialization: string
  available: boolean
  phone?: string
  email?: string
}

const technicians: Technician[] = [
  { id: 'tech1', name: 'John Smith', specialization: 'HVAC', available: true, phone: '000-000-0000', email: 'john@example.com' },
  { id: 'tech2', name: 'Sarah Johnson', specialization: 'Refrigeration', available: true, phone: '000-000-0000', email: 'sarah@example.com' },
  { id: 'tech3', name: 'Mike Wilson', specialization: 'Electrical', available: true, phone: '000-000-0000', email: 'mike@example.com' },
  { id: 'tech4', name: 'Emily Davis', specialization: 'General Maintenance', available: false, phone: '000-000-0000', email: 'emily@example.com' },
  { id: 'tech5', name: 'Robert Brown', specialization: 'HVAC', available: true, phone: '000-000-0000', email: 'robert@example.com' },
  { id: 'tech6', name: 'Lisa Chen', specialization: 'Controls', available: true, phone: '000-000-0000', email: 'lisa@example.com' },
]

const initialItems: MaintenanceRecord[] = [
  {
    id: '1',
    deviceId: 'AC-001',
    room: 'Conference Room A',
    lastService: '2024-01-15',
    nextService: '2024-07-15',
    issue: 'Filter cleaning required',
    criticality: 'Low'
  },
  {
    id: '2',
    deviceId: 'AC-002',
    room: 'Office 201',
    lastService: '2024-02-20',
    nextService: '2024-08-20',
    issue: 'None',
    criticality: 'Low'
  },
  {
    id: '3',
    deviceId: 'AC-003',
    room: 'Lobby',
    lastService: '2023-12-10',
    nextService: '2024-06-10',
    issue: 'Refrigerant level check needed',
    criticality: 'Medium'
  },
  {
    id: '4',
    deviceId: 'AC-004',
    room: 'Server Room',
    lastService: '2024-03-05',
    nextService: '2024-09-05',
    issue: 'None',
    criticality: 'Low'
  },
  {
    id: '5',
    deviceId: 'AC-005',
    room: 'Office 305',
    lastService: '2023-11-18',
    nextService: '2024-05-18',
    issue: 'Compressor noise detected',
    criticality: 'High'
  },
  {
    id: '6',
    deviceId: 'AC-006',
    room: 'Cafeteria',
    lastService: '2024-01-30',
    nextService: '2024-07-30',
    issue: 'Drainage system check',
    criticality: 'Medium'
  },
  {
    id: '7',
    deviceId: 'AC-007',
    room: 'Office 102',
    lastService: '2024-02-12',
    nextService: '2024-08-12',
    issue: 'None',
    criticality: 'Low'
  }
]

const cards = [
  {
    icon: SunSnow,
    iconColor: 'text-green-600',
    title: 'Active ACs',
    value: 17,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
  {
    icon: Zap,
    iconColor: 'text-blue-600',
    title: 'Power Consumption',
    value: 243,
    dateRange: 'Last 7 days',
  },
  {
    icon: Briefcase,
    iconColor: 'text-purple-600',
    title: 'Maintenance Tasks',
    value: 12,
    dateRange: 'Last 7 days',
  },
  {
    icon: ArrowUpRight,
    iconColor: 'text-pink-600',
    title: 'Avg. Performance',
    value: 89,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
  {
    icon: AlertCircle,
    iconColor: 'text-orange-600',
    title: 'Alerts',
    value: 12,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
]

export default function DashboardPage() {
  const [assignedItems, setAssignedItems] = useState<any[]>([])
  const [items, setItems] = useState<MaintenanceRecord[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showTechnicianDialog, setShowTechnicianDialog] = useState<string | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [techniciansList, setTechniciansList] = useState<Technician[]>(technicians)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [showAddTechnicianDialog, setShowAddTechnicianDialog] = useState(false)
  const [newTechnician, setNewTechnician] = useState({ name: '', specialization: '', phone: '', email: '' })
  const [adminPassword, setAdminPassword] = useState('')

  useEffect(() => {
    const savedItems = localStorage.getItem('assignedMaintenanceItems')
    const savedSelectedItems = localStorage.getItem('selectedMaintenanceItems')
    
    if (savedItems) {
      const parsedAssignedItems = JSON.parse(savedItems)
      setAssignedItems(parsedAssignedItems)
      
      // Filter out assigned items from initialItems
      const assignedIds = parsedAssignedItems.map((item: any) => item.id)
      const filteredItems = initialItems.filter(item => !assignedIds.includes(item.id))
      setItems(filteredItems)
    } else {
      setItems(initialItems)
    }

    // Load selectedItems from localStorage
    if (savedSelectedItems) {
      const parsedSelectedItems = JSON.parse(savedSelectedItems)
      setSelectedItems(new Set(parsedSelectedItems))
    }
  }, [])

  useEffect(() => {
    // Save selectedItems to localStorage whenever it changes
    if (selectedItems.size > 0) {
      localStorage.setItem('selectedMaintenanceItems', JSON.stringify(Array.from(selectedItems)))
    } else {
      localStorage.removeItem('selectedMaintenanceItems')
    }
  }, [selectedItems])

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems)
    
    if (checked) {
      newSelectedItems.add(itemId)
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, scheduled: true } : item
      ))
    } else {
      newSelectedItems.delete(itemId)
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, scheduled: false } : item
      ))
    }
    
    setSelectedItems(newSelectedItems)
  }

  const handleScheduleClick = (itemId: string) => {
    setShowTechnicianDialog(itemId)
  }

  const handleAssignTechnician = () => {
    if (showTechnicianDialog && selectedTechnician) {
      const technician = techniciansList.find(t => t.id === selectedTechnician)
      const itemToAssign = items.find(item => item.id === showTechnicianDialog)
      
      if (itemToAssign && technician && technician.available) {
        // Update technician availability to unavailable
        const updatedTechnicians = techniciansList.map(t => 
          t.id === selectedTechnician ? { ...t, available: false } : t
        )
        setTechniciansList(updatedTechnicians)
        
        const updatedItem = { ...itemToAssign, technician: technician.name }
        
        const newAssignedItems = [...assignedItems, updatedItem]
        setAssignedItems(newAssignedItems)
        localStorage.setItem('assignedMaintenanceItems', JSON.stringify(newAssignedItems))
        
        setItems(prev => prev.filter(item => item.id !== showTechnicianDialog))
        
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(showTechnicianDialog)
          return newSet
        })
      }
      
      setShowTechnicianDialog(null)
      setSelectedTechnician('')
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setShowDeleteDialog(itemId)
  }

  const confirmDelete = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
    setShowDeleteDialog(null)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">AC Management System Overview</p>
      </div>
      
      <div className="@container grow w-full space-y-6">
        <div className="grid grid-cols-1 @3xl:grid-cols-5 gap-4">
          {cards.map((card, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col h-full p-4">
                <div className="flex items-center mb-4">
                  <card.icon className={cn('size-5', card.iconColor)} />
                </div>
                <div className="flex-1 flex flex-col justify-between grow">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">{card.title}</div>
                    <div className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <ChartAreaInteractive />
          </div>
          <div className="lg:col-span-1">
            <HealthChart />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Maintenance Information</CardTitle>
                <CardDescription>AC system maintenance records and status</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto min-h-[20rem] max-h-[30rem] lg:min-h-[25rem] lg:max-h-[35rem]">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Pending Maintenance
                  </h3>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4" style={{ width: '150px' }}>AC Unit</th>
                          <th className="text-left p-4" style={{ width: '120px' }}>Room</th>
                          <th className="text-left p-4">Issue</th>
                          <th className="text-left p-4" style={{ width: '100px' }}>Criticality</th>
                          <th className="text-left p-4" style={{ width: '120px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr 
                            key={item.id} 
                            className={`border hover:bg-accent/50 transition-colors ${
                              selectedItems.has(item.id) ? 'bg-green-100 dark:bg-green-900' : ''
                            } ${
                              showDeleteDialog === item.id ? 'bg-red-100 dark:bg-red-900' : ''
                            }`}
                            style={{ height: '60px' }}
                          >
                            <td className="p-4" style={{ width: '150px' }}>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(item.id)}
                                  onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                                  className="rounded w-4 h-4"
                                />
                                <span className="font-medium whitespace-nowrap">{item.deviceId}</span>
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '120px' }}>{item.room}</td>
                            <td className="p-4">{item.issue}</td>
                            <td className="p-4" style={{ width: '100px' }}>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.criticality === 'High' ? 'bg-red-100 text-red-700' :
                                item.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {item.criticality}
                              </span>
                            </td>
                            <td className="p-4" style={{ width: '120px' }}>
                              <div className="flex items-center gap-3" style={{ width: '120px', height: '24px' }}>
                                <button
                                  onClick={() => handleScheduleClick(item.id)}
                                  className={`px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-opacity flex items-center ${
                                    selectedItems.has(item.id) ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                  }`}
                                >
                                  <Users className="h-3 w-3 mr-1" style={{ transform: 'rotate(0deg)' }} />
                                  Assign
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className={`w-6 h-6 bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-all transition-colors ${
                                    selectedItems.has(item.id) ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                  }`}
                                >
                                  <X className="h-4 w-4 font-bold" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>System alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[20rem] lg:min-h-[25rem]">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">High Temperature Alert</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">AC Unit #5 temperature exceeded threshold</p>
                      <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Maintenance Due</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">AC Unit #12 scheduled maintenance in 3 days</p>
                      <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">Power Consumption Spike</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">Unusual power consumption detected in AC Unit #8</p>
                      <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Filter Replacement</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">AC Unit #3 filter needs replacement</p>
                      <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {showTechnicianDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Assign Technician</h3>
              <button
                onClick={() => {
                  setAdminPassword('')
                  setShowAddTechnicianDialog(true)
                }}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Users className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            <div className="space-y-3">
              {techniciansList.map(technician => (
                <div key={technician.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="technician"
                    value={technician.id}
                    checked={selectedTechnician === technician.id}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    disabled={!technician.available}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium">{technician.name}</div>
                    <div className="text-sm text-muted-foreground">{technician.specialization}</div>
                  </div>
                  <div className={`ml-auto px-2 py-1 rounded-full text-xs ${
                    technician.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {technician.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 mt-4">
              <button
                onClick={() => setShowTechnicianDialog(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTechnician}
                disabled={!selectedTechnician}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Users className="h-4 w-4 mr-2" style={{ transform: 'rotate(0deg)' }} />
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTechnicianDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Technician</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter technician name"
                  value={newTechnician.name}
                  onChange={(e) => setNewTechnician(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter phone number"
                  value={newTechnician.phone}
                  onChange={(e) => setNewTechnician(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  type="email"
                  placeholder="Enter email address"
                  value={newTechnician.email}
                  onChange={(e) => setNewTechnician(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Specialization</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., HVAC, Electrical"
                  value={newTechnician.specialization}
                  onChange={(e) => setNewTechnician(prev => ({ ...prev, specialization: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Admin Password</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4">
              <button
                onClick={() => setShowAddTechnicianDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newTechnician.name || !newTechnician.phone || !newTechnician.specialization) return
                  const id = `tech-${Date.now()}`
                  const added: Technician = {
                    id,
                    name: newTechnician.name,
                    specialization: newTechnician.specialization,
                    available: true,
                    phone: newTechnician.phone,
                    email: newTechnician.email || undefined,
                  }
                  setTechniciansList(prev => [...prev, added])
                  setNewTechnician({ name: '', specialization: '', phone: '', email: '' })
                  setAdminPassword('')
                  setShowAddTechnicianDialog(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={
                  !newTechnician.name ||
                  !newTechnician.phone ||
                  !newTechnician.specialization ||
                  !adminPassword
                }
              >
                Save Technician
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Do you want to delete this maintenance item?</p>
            <div className="flex justify-between gap-4">
              <button
                onClick={() => confirmDelete(showDeleteDialog)}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
