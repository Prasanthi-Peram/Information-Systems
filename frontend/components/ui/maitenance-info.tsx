import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const items = [
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id} className='has-data-[state=checked]:bg-muted/50'>
                <TableCell>
                  <Checkbox id={`table-checkbox-${item.id}`} aria-label={`device-checkbox-${item.id}`} />
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default TableSelectableRowDemo
