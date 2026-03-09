'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/Table'
import { UserCheck } from 'lucide-react'

interface MaintenanceRecord {
  id: string
  deviceId: string
  room: string
  issue: string
  criticality: 'Low' | 'Medium' | 'High'
  technician: string
}

const AssignedMaintenancePage = () => {
  const [assignedItems, setAssignedItems] = useState<MaintenanceRecord[]>([])

  useEffect(() => {
    // Load assigned items from localStorage or state management
    const savedItems = localStorage.getItem('assignedMaintenanceItems')
    if (savedItems) {
      setAssignedItems(JSON.parse(savedItems))
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className='space-y-6'>
        <div className='flex items-center gap-2 mb-6'>
          <UserCheck className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-semibold">Assigned Maintenance</h1>
        </div>
        
        {assignedItems.length > 0 ? (
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead>DeviceID</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Issue/Suggestion</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Assigned Technician</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedItems.map(item => (
                  <TableRow key={item.id} className="bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500">
                    <TableCell className='font-medium'>{item.deviceId}</TableCell>
                    <TableCell>{item.room}</TableCell>
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
                      <span className="text-sm font-medium text-green-700">{item.technician}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No assigned maintenance items yet.</p>
            <p className="text-gray-400 text-sm mt-2">Assign technicians to maintenance items to see them here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignedMaintenancePage
