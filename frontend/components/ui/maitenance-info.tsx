'use client'

import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export default function MaintenanceTable({ data }: { data:any[] }) {

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Last Service</TableHead>
          <TableHead>Next Service</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map(ac => {
          const lastService = ac.last_service_date ? 
            new Date(ac.last_service_date).toLocaleDateString() : 'N/A'
          const nextService = ac.next_service_date ? 
            new Date(ac.next_service_date).toLocaleDateString() : 'N/A'
          
          return (
            <TableRow key={ac.Device_ID}>
              <TableCell className="font-medium">{ac.Device_ID}</TableCell>
              <TableCell>
                <span className={ac.Health_Score > 70 ? 'text-green-600' : ac.Health_Score > 50 ? 'text-yellow-600' : 'text-red-600'}>
                  {ac.Health_Score.toFixed(0)}%
                </span>
              </TableCell>
              <TableCell className="text-sm">{lastService}</TableCell>
              <TableCell className="text-sm font-medium">{nextService}</TableCell>
              <TableCell className="text-xs">{ac.Maintenance_Advice}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}