'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { UserCheck, Calendar, Users, FileDown, ArrowLeft, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

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
}

const technicians: Technician[] = [
  { id: 'tech1', name: 'John Smith', specialization: 'HVAC', available: true },
  { id: 'tech2', name: 'Sarah Johnson', specialization: 'Refrigeration', available: true },
  { id: 'tech3', name: 'Mike Wilson', specialization: 'Electrical', available: true },
  { id: 'tech4', name: 'Emily Davis', specialization: 'General Maintenance', available: false },
  { id: 'tech5', name: 'Robert Brown', specialization: 'HVAC', available: true },
  { id: 'tech6', name: 'Lisa Chen', specialization: 'Controls', available: true },
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

export default function MaintenancePage() {
  const router = useRouter()
  const [items, setItems] = useState<MaintenanceRecord[]>(initialItems)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set())
  const [assignedItems, setAssignedItems] = useState<MaintenanceRecord[]>([])
  const [showTechnicianDialog, setShowTechnicianDialog] = useState<string | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null)

  const handleExportPageReport = () => {
    const reports = [
      ...items.map(item => ({
        deviceInfo: {
          deviceId: item.deviceId,
          location: item.room,
          generatedAt: new Date().toISOString(),
        },
        deviceStatus: {
          status: 'Pending Maintenance',
          performance: '75%',
          condition: 'Fair',
          runtimeToday: '8 hours',
          totalHours: '2500h',
          temperature: '22°C',
          humidity: '45%',
          current: '5.2A',
          voltage: '230V',
          powerConsumption: '1.2 kW',
        },
        maintenanceInfo: {
          lastService: item.lastService,
          nextServiceDue: item.nextService,
          warrantyStatus: item.criticality === 'High' ? 'Needs Attention' : 'Active',
          issue: item.issue,
        },
      })),
      ...assignedItems.map(item => ({
        deviceInfo: {
          deviceId: item.deviceId,
          location: item.room,
          generatedAt: new Date().toISOString(),
        },
        deviceStatus: {
          status: 'Under Maintenance',
          performance: '75%',
          condition: 'Fair',
          runtimeToday: '6 hours',
          totalHours: '2500h',
          temperature: '22°C',
          humidity: '45%',
          current: '5.2A',
          voltage: '230V',
          powerConsumption: '1.2 kW',
        },
        maintenanceInfo: {
          lastService: item.lastService,
          nextServiceDue: item.nextService,
          warrantyStatus: item.criticality === 'High' ? 'Needs Attention' : 'Active',
          issue: item.issue,
          assignedTechnician: item.technician || 'Not Assigned',
        },
      }))
    ]

    const reportData = {
      generatedAt: new Date().toISOString(),
      totalDevices: reports.length,
      pendingCount: items.length,
      assignedCount: assignedItems.length,
      reports: reports
    }

    const jsonString = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `maintenance_board_report_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const loadAssignedItems = () => {
      const savedItems = localStorage.getItem('assignedMaintenanceItems')
      if (savedItems) {
        setAssignedItems(JSON.parse(savedItems))
      }
    }
    
    // Load initial items
    loadAssignedItems()
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'assignedMaintenanceItems') {
        loadAssignedItems()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check for changes periodically (for same-tab updates)
    const interval = setInterval(loadAssignedItems, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

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
      const technician = technicians.find(t => t.id === selectedTechnician)
      const itemToAssign = items.find(item => item.id === showTechnicianDialog)
      
      if (itemToAssign && technician) {
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

  const handleUnassignTechnician = (itemId: string) => {
    setShowCancelDialog(itemId)
  }

  const confirmCancel = (itemId: string) => {
    const itemToUnassign = assignedItems.find(item => item.id === itemId)
    
    if (itemToUnassign) {
      const updatedItem = { ...itemToUnassign, technician: undefined, scheduled: false }
      
      const newAssignedItems = assignedItems.filter(item => item.id !== itemId)
      setAssignedItems(newAssignedItems)
      localStorage.setItem('assignedMaintenanceItems', JSON.stringify(newAssignedItems))
      
      const restoredItem = { ...updatedItem, id: itemId }
      setItems(prev => [...prev, restoredItem])
      
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
    setShowCancelDialog(null)
  }

  const handleExportReport = (item: MaintenanceRecord) => {
    const reportData = {
      deviceInfo: {
        deviceId: item.deviceId,
        location: item.room,
        generatedAt: new Date().toISOString(),
      },
      deviceStatus: {
        status: 'Active',
        performance: '85%',
        condition: 'Good',
        runtimeToday: '8 hours',
        totalHours: '2500h',
        temperature: '22°C',
        humidity: '45%',
        current: '5.2A',
        voltage: '230V',
        powerConsumption: '1.2 kW',
      },
      maintenanceInfo: {
        lastService: item.lastService,
        nextServiceDue: item.nextService,
        warrantyStatus: item.criticality === 'High' ? 'Needs Attention' : 'Active',
        issue: item.issue,
        assignedTechnician: item.technician || 'Not Assigned',
      },
    }

    const jsonString = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${item.deviceId}_report_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportAllReport = () => {
    if (assignedItems.length === 0) return
    
    const reports = assignedItems.map(item => ({
      deviceInfo: {
        deviceId: item.deviceId,
        location: item.room,
        generatedAt: new Date().toISOString(),
      },
      deviceStatus: {
        status: 'Active',
        performance: '85%',
        condition: 'Good',
        runtimeToday: '8 hours',
        totalHours: '2500h',
        temperature: '22°C',
        humidity: '45%',
        current: '5.2A',
        voltage: '230V',
        powerConsumption: '1.2 kW',
      },
      maintenanceInfo: {
        lastService: item.lastService,
        nextServiceDue: item.nextService,
        warrantyStatus: item.criticality === 'High' ? 'Needs Attention' : 'Active',
        issue: item.issue,
        assignedTechnician: item.technician || 'Not Assigned',
      },
    }))

    const reportData = {
      generatedAt: new Date().toISOString(),
      totalDevices: reports.length,
      reports: reports
    }

    const jsonString = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `all-maintenance-report_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDeleteConfirm = () => {
    if (showDeleteDialog) {
      setItems(prev => prev.filter(item => item.id !== showDeleteDialog))
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(showDeleteDialog)
        return newSet
      })
      setShowDeleteDialog(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance</h1>
            <p className="text-muted-foreground">Manage and track AC unit maintenance schedules</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 border-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
        

        
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Assigned Maintenance
          </h2>
          {assignedItems.length > 0 ? (
            <div className="space-y-2">
              {assignedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <div className="font-medium">{item.deviceId}</div>
                      <div className="text-sm text-muted-foreground">{item.room}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                      {item.technician}
                    </Badge>
                    <button
                      onClick={() => handleExportReport(item)}
                      className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      Export
                    </button>
                    <button
                      onClick={() => handleUnassignTechnician(item.id)}
                      className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No assigned maintenance technicians yet.</p>
              <p className="text-gray-400 text-sm mt-2">Assign technicians to maintenance to see them here.</p>
            </div>
          )}
        </div>
      </div>
      
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Cancel</h3>
            <p className="text-gray-600 mb-6">Do you want to cancel this maintenance assignment?</p>
            <div className="flex justify-between gap-4">
              <button
                onClick={() => confirmCancel(showCancelDialog)}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowCancelDialog(null)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showTechnicianDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Assign Technician</h3>
            <div className="space-y-3">
              {technicians.map(technician => (
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
            <div className="flex justify-end gap-2 mt-4">
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
    </div>
  )
}

