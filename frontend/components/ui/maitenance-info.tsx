'use client'

import { useState, useEffect } from 'react'
import { useId } from 'react'

import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/Table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/Dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/Alert-dialog'
import { EllipsisVertical, UserCheck, Calendar, Users, Plus } from 'lucide-react'

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

const initialTechnicians: Technician[] = [
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

const TableSelectableRowDemo = () => {
  const id = useId()
  const [items, setItems] = useState<MaintenanceRecord[]>(initialItems)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set())
  const [assignedItems, setAssignedItems] = useState<MaintenanceRecord[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [showTechnicianDialog, setShowTechnicianDialog] = useState<string | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [showAddTechnicianDialog, setShowAddTechnicianDialog] = useState(false)
  const [newTechnician, setNewTechnician] = useState({ name: '', phone: '', email: '', specialization: '' })
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians)
  const [assignmentSuccess, setAssignmentSuccess] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTechnicians = localStorage.getItem('maintenanceTechnicians')
    const savedAssignedItems = localStorage.getItem('assignedMaintenanceItems')
    
    if (savedTechnicians) {
      try {
        setTechnicians(JSON.parse(savedTechnicians))
      } catch (e) {
        console.error('Failed to parse saved technicians', e)
      }
    }
    
    if (savedAssignedItems) {
      try {
        setAssignedItems(JSON.parse(savedAssignedItems))
      } catch (e) {
        console.error('Failed to parse saved assigned items', e)
      }
    }
  }, [])

  // Persist technicians to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('maintenanceTechnicians', JSON.stringify(technicians))
  }, [technicians])

  // Persist assigned items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('assignedMaintenanceItems', JSON.stringify(assignedItems))
  }, [assignedItems])

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems)
    
    if (checked) {
      newSelectedItems.add(itemId)
      // Mark as scheduled when checked
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, scheduled: true } : item
      ))
    } else {
      newSelectedItems.delete(itemId)
      // Unschedule when unchecked
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, scheduled: false, technician: undefined } : item
      ))
    }
    
    setSelectedItems(newSelectedItems)
    // Remove from marked for deletion if unchecked
    const newMarkedForDeletion = new Set(markedForDeletion)
    newMarkedForDeletion.delete(itemId)
    setMarkedForDeletion(newMarkedForDeletion)
  }

  const handleDoubleClick = (itemId: string) => {
    if (selectedItems.has(itemId)) {
      const newMarkedForDeletion = new Set(markedForDeletion)
      if (newMarkedForDeletion.has(itemId)) {
        newMarkedForDeletion.delete(itemId)
      } else {
        newMarkedForDeletion.add(itemId)
      }
      setMarkedForDeletion(newMarkedForDeletion)
    }
  }

  const handleScheduleClick = (itemId: string) => {
    setShowTechnicianDialog(itemId)
  }

  const handleAssignTechnician = () => {
    if (showTechnicianDialog && selectedTechnician) {
      const technician = technicians.find(t => t.id === selectedTechnician)
      const itemToAssign = items.find(item => item.id === showTechnicianDialog)
      
      if (itemToAssign && technician) {
        // Update item with technician
        const updatedItem = { ...itemToAssign, technician: technician.name }
        
        // Move to assigned items
        const newAssignedItems = [...assignedItems, updatedItem]
        setAssignedItems(newAssignedItems)
        
        // Mark technician as unavailable
        setTechnicians(prev => prev.map(t => 
          t.id === selectedTechnician ? { ...t, available: false } : t
        ))
        
        // Remove from main items
        setItems(prev => prev.filter(item => item.id !== showTechnicianDialog))
        
        // Remove from selected items
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(showTechnicianDialog)
          return newSet
        })
        
        // Remove from marked for deletion if it was marked
        setMarkedForDeletion(prev => {
          const newSet = new Set(prev)
          newSet.delete(showTechnicianDialog)
          return newSet
        })
        
        // Show success message and reset
        setAssignmentSuccess(true)
        setSelectedTechnician('')
        setTimeout(() => setAssignmentSuccess(false), 2000)
        
        // Keep dialog open so user can add more technicians if needed
      }
    }
  }

  const handleAddTechnician = () => {
    if (newTechnician.name && newTechnician.phone && newTechnician.email && newTechnician.specialization) {
      const technicianId = `tech${Date.now()}`
      const addedTechnician: Technician = {
        id: technicianId,
        name: newTechnician.name,
        specialization: newTechnician.specialization,
        available: true
      }
      
      setTechnicians(prev => [...prev, addedTechnician])
      setNewTechnician({ name: '', phone: '', email: '', specialization: '' })
      setShowAddTechnicianDialog(false)
      // Keep the assign dialog open so user can immediately assign the newly added technician
    }
  }

  const isMarkedForDeletion = (itemId: string) => {
    return markedForDeletion.has(itemId)
  }

  const handleDeleteConfirm = () => {
    if (showDeleteDialog) {
      setItems(prev => prev.filter(item => item.id !== showDeleteDialog))
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(showDeleteDialog)
        return newSet
      })
      setMarkedForDeletion(prev => {
        const newSet = new Set(prev)
        newSet.delete(showDeleteDialog)
        return newSet
      })
      setShowDeleteDialog(null)
    }
  }

  return (
    <div className='w-full'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>
                <Checkbox id={id} aria-label='select-all' />
              </TableHead>
              <TableHead>DeviceID</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Last Service</TableHead>
              <TableHead>Next Service</TableHead>
              <TableHead>Issue/Suggestion</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Technician</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow 
                key={item.id} 
                className={`
                  ${selectedItems.has(item.id) && !isMarkedForDeletion(item.id) ? 'bg-green-100 dark:bg-green-950/30 border-l-4 border-l-green-500' : ''}
                  ${isMarkedForDeletion(item.id) ? 'bg-red-100 dark:bg-red-950/30 border-l-4 border-l-red-500' : ''}
                  ${selectedItems.has(item.id) && isMarkedForDeletion(item.id) ? 'bg-yellow-100 dark:bg-yellow-950/30 border-l-4 border-l-yellow-500' : ''}
                  has-data-[state=checked]:bg-muted/50
                `}
                onDoubleClick={() => handleDoubleClick(item.id)}
              >
                <TableCell>
                  <Checkbox 
                    id={`table-checkbox-${item.id}`} 
                    aria-label={`device-checkbox-${item.id}`}
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className='font-medium'>{item.deviceId}</TableCell>
                <TableCell>{item.room}</TableCell>
                <TableCell>{item.lastService}</TableCell>
                <TableCell>{item.nextService}</TableCell>
                <TableCell>{item.issue}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.criticality === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                    item.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                    'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  }`}>
                    {item.criticality}
                  </span>
                </TableCell>
                <TableCell>
                  {item.scheduled && item.technician ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                      {item.technician}
                    </Badge>
                  ) : item.scheduled ? (
                    <Badge 
                      className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 cursor-pointer hover:bg-green-200" 
                      onClick={() => handleScheduleClick(item.id)}
                    >
                      Scheduled
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.technician ? (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{item.technician}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not Assigned</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ARE YOU SURE?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the AC unit from maintenance list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Yes, remove it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Technician Assignment Dialog */}
      <AlertDialog open={!!showTechnicianDialog} onOpenChange={() => setShowTechnicianDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Assign Technician
            </AlertDialogTitle>
            <AlertDialogDescription>
              {assignmentSuccess ? (
                <span className="text-green-600 font-medium">✓ Technician assigned successfully!</span>
              ) : (
                'Select a technician to assign to this maintenance task.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {technicians.map(tech => (
                <div key={tech.id} className={`flex items-center space-x-2 p-2 border rounded-lg ${tech.available ? 'hover:bg-accent/50 cursor-pointer' : 'opacity-50 bg-muted/50 cursor-not-allowed'}`}>
                  <Checkbox 
                    id={`tech-${tech.id}`}
                    checked={selectedTechnician === tech.id}
                    onCheckedChange={() => tech.available && setSelectedTechnician(tech.id)}
                    disabled={!tech.available}
                  />
                  <label 
                    htmlFor={`tech-${tech.id}`} 
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${tech.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    {tech.name}
                  </label>
                  {!tech.available && (
                    <span className="ml-auto text-xs text-muted-foreground font-medium">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAddTechnicianDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Technician
            </Button>
            <div className="flex gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button onClick={handleAssignTechnician} disabled={!selectedTechnician} className="bg-green-500 hover:bg-green-600">
                Assign
              </Button>
              <Button onClick={() => setShowTechnicianDialog(null)} variant="outline">
                Done
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Technician Dialog */}
      <AlertDialog open={showAddTechnicianDialog} onOpenChange={setShowAddTechnicianDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Technician
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter the technician's information
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Enter technician name"
                value={newTechnician.name}
                onChange={(e) => setNewTechnician(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="Enter phone number"
                value={newTechnician.phone}
                onChange={(e) => setNewTechnician(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                placeholder="Enter email address"
                type="email"
                value={newTechnician.email}
                onChange={(e) => setNewTechnician(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Specialization</label>
              <Input
                placeholder="e.g., HVAC, Electrical, Refrigeration"
                value={newTechnician.specialization}
                onChange={(e) => setNewTechnician(prev => ({ ...prev, specialization: e.target.value }))}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAddTechnician}
              disabled={!newTechnician.name || !newTechnician.phone || !newTechnician.email || !newTechnician.specialization}
            >
              Add Technician
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default TableSelectableRowDemo
