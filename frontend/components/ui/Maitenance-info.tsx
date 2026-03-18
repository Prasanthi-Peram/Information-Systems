'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/Alert-dialog'
import { EllipsisVertical, UserCheck, Users, Plus, RefreshCw, FileText, ClipboardList, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/Dropdown-menu'

interface PendingTask {
  id: string
  deviceId: string
  room: string
  lastService: string
  nextService: string
  issue: string
  criticality: 'Low' | 'Medium' | 'High'
  timeStamp?: string
}

interface AssignedTask {
  assignment_id: number
  deviceId: string
  room: string
  lastService: string
  nextService: string
  issue: string
  criticality: string
  status: string
  technicianName: string
  specialization: string
}

interface CompletedTask extends AssignedTask {
  completedAt: string
}

interface Technician {
  id: string
  name: string
  specialization: string
  available: boolean
}

interface MaintenanceStats {
  pending: number
  assigned: number
  ongoing: number
  rejected: number
  total: number
}

const CriticalityBadge = ({ criticality }: { criticality: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${criticality === 'High' || criticality === 'Critical'
    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
    : criticality === 'Medium'
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
      : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
    }`}>
    {criticality}
  </span>
)

const TableSelectableRowDemo = () => {
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [stats, setStats] = useState<MaintenanceStats>({ pending: 0, assigned: 0, ongoing: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [showTechnicianDialog, setShowTechnicianDialog] = useState<string | null>(null)
  // When reassigning, track the assignment_id of the rejected task
  const [reassigningAssignmentId, setReassigningAssignmentId] = useState<number | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [showAddTechnicianDialog, setShowAddTechnicianDialog] = useState(false)
  const [newTechnician, setNewTechnician] = useState({ name: '', phone: '', email: '', specialization: '' })
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [assignmentSuccess, setAssignmentSuccess] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [pendingRes, assignedRes, completedRes, statsRes] = await Promise.all([
        fetch('http://localhost:8000/maintenance/tasks'),
        fetch('http://localhost:8000/maintenance/assigned-tasks'),
        fetch('http://localhost:8000/maintenance/completed-tasks'),
        fetch('http://localhost:8000/maintenance/stats'),
      ])
      if (pendingRes.ok) setPendingTasks(await pendingRes.json())
      if (assignedRes.ok) setAssignedTasks(await assignedRes.json())
      if (completedRes.ok) setCompletedTasks(await completedRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (e) {
      console.error('Error loading maintenance data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/technicians')
      const data = await res.json()
      setTechnicians(data.map((t: any) => ({
        id: t.technician_id.toString(),
        name: t.name,
        specialization: t.specialization,
        available: t.is_available
      })))
    } catch (e) {
      console.error('Error fetching technicians:', e)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchTechnicians()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll, fetchTechnicians])

  /** Open the technician dialog for a NEW assignment (from Pending table) */
  const openAssignDialog = (alertId: string) => {
    setReassigningAssignmentId(null)
    setShowTechnicianDialog(alertId)
    fetchTechnicians()
  }

  /** Open the technician dialog for a REASSIGNMENT (from Assigned table, rejected row) */
  const openReassignDialog = (assignmentId: number) => {
    setReassigningAssignmentId(assignmentId)
    setShowTechnicianDialog('reassign')
    fetchTechnicians()
  }

  const handleAssignOrReassign = async () => {
    if (!selectedTechnician) return
    const tech = technicians.find(t => t.id === selectedTechnician)
    if (!tech) return

    try {
      let res: Response

      if (reassigningAssignmentId !== null) {
        // Reassign an existing (rejected) assignment
        res = await fetch('http://localhost:8000/maintenance/reassign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignment_id: reassigningAssignmentId, technician_id: parseInt(tech.id) }),
        })
      } else {
        // Fresh assign from the Pending table
        res = await fetch('http://localhost:8000/maintenance/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alert_id: parseInt(showTechnicianDialog!), technician_id: parseInt(tech.id) }),
        })
      }

      if (res.ok) {
        setAssignmentSuccess(true)
        setSelectedTechnician('')
        setTimeout(() => {
          setAssignmentSuccess(false)
          setShowTechnicianDialog(null)
          setReassigningAssignmentId(null)
          fetchAll()
          fetchTechnicians()
        }, 1500)
      }
    } catch (e) {
      console.error('Error assigning technician:', e)
    }
  }

  const handleAddTechnician = async () => {
    const { name, phone, email, specialization } = newTechnician
    if (!name || !phone || !email || !specialization) return

    try {
      // 1. Create the user account
      const userPayload = {
        id: crypto.randomUUID(),
        email,
        password: '$2b$10$placeholder', // placeholder – technician will set password on first login
        name,
        role: 'technician',
        campus_id: null,
        specialization,
        phone,
        created_at: new Date().toISOString(),
      }
      const userRes = await fetch('http://localhost:8000/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      })

      if (!userRes.ok) {
        const err = await userRes.json()
        console.error('Failed to create technician user:', err)
        return
      }

      setNewTechnician({ name: '', phone: '', email: '', specialization: '' })
      setShowAddTechnicianDialog(false)
      // Refresh tech list from backend
      await fetchTechnicians()
    } catch (e) {
      console.error('Error adding technician:', e)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!showDeleteDialog) return
    setPendingTasks(prev => prev.filter(t => t.id !== showDeleteDialog))
    try {
      await fetch(`http://localhost:8000/maintenance/false-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: null }),
      })
    } catch (e) {
      console.error('Failed to send false-alert feedback', e)
    }
    setShowDeleteDialog(null)
    fetchAll()
  }

  const sharedHeaders = (
    <TableRow className='hover:bg-transparent'>
      <TableHead className="font-semibold">DeviceID</TableHead>
      <TableHead className="font-semibold whitespace-nowrap">Room</TableHead>
      <TableHead className="font-semibold hidden md:table-cell whitespace-nowrap">Last Service</TableHead>
      <TableHead className="font-semibold hidden lg:table-cell whitespace-nowrap">Next Service</TableHead>
      <TableHead className="font-semibold hidden sm:table-cell">Issue / Suggestion</TableHead>
      <TableHead className="font-semibold">Action</TableHead>
    </TableRow>
  )

  return (
    <div className='w-full space-y-10'>

      {/* ── STATS BANNER ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: stats.pending, icon: <AlertTriangle className="w-4 h-4 text-orange-500" />, color: 'bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900' },
          { label: 'Assigned', value: stats.assigned, icon: <ClipboardList className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900' },
          { label: 'Ongoing', value: stats.ongoing, icon: <Activity className="w-4 h-4 text-purple-500" />, color: 'bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900' },
          { label: 'Total Tasks', value: stats.total, icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, color: 'bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`flex items-center gap-3 rounded-xl border p-4 ${color}`}>
            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">{icon}</div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 1. PENDING ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pending Maintenance</h2>
          <Button variant="outline" size="sm" onClick={fetchAll} className="flex items-center gap-1 text-xs">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>
        <div className='w-full overflow-x-auto rounded-md border'>
          <Table className="w-full table-auto">
            <TableHeader>{sharedHeaders}</TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">Loading...</TableCell></TableRow>
              ) : pendingTasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">No pending tasks</TableCell></TableRow>
              ) : pendingTasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell className='font-medium'>{task.deviceId}</TableCell>
                  <TableCell className="whitespace-nowrap">{task.room}</TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap">{task.lastService ?? '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell whitespace-nowrap">{task.nextService ?? '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2 flex-nowrap">
                      <CriticalityBadge criticality={task.criticality} />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[350px]">{task.issue}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><EllipsisVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAssignDialog(task.id)}>
                          <UserCheck className="w-4 h-4 mr-2 text-blue-600" /> Assign Technician
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteDialog(task.id)}>
                          Remove (False Alert)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── 2. ASSIGNED ────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Assigned</h2>
        <div className='w-full overflow-x-auto rounded-md border'>
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className="font-semibold">DeviceID</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Room</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Issue / Suggestion</TableHead>
                <TableHead className="font-semibold">Technician</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">Loading...</TableCell></TableRow>
              ) : assignedTasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">No assigned tasks</TableCell></TableRow>
              ) : assignedTasks.map(task => (
                <TableRow key={task.assignment_id}>
                  <TableCell className='font-medium'>{task.deviceId}</TableCell>
                  <TableCell className="whitespace-nowrap">{task.room}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2 flex-nowrap">
                      <CriticalityBadge criticality={task.criticality} />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[350px]">{task.issue}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{task.technicianName}</p>
                      <p className="text-xs text-gray-500">{task.specialization}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      task.status === 'Rejected'
                        ? 'bg-red-100 text-red-700 border-none'
                        : task.status === 'Accepted'
                          ? 'bg-green-100 text-green-700 border-none'
                          : 'bg-yellow-100 text-yellow-700 border-none'
                    }>
                      {task.status === 'Accepted' ? 'Accepted' : task.status === 'Rejected' ? 'Rejected' : 'Awaiting'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Accepted → Report only */}
                      {task.status === 'Accepted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 h-8 px-3 text-xs"
                          onClick={() => setShowReportDialog(task.assignment_id)}
                        >
                          <FileText className="w-3 h-3" /> Report
                        </Button>
                      )}

                      {/* Rejected → Reassign + Report */}
                      {task.status === 'Rejected' && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => openReassignDialog(task.assignment_id)}
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Reassign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 h-8 px-3 text-xs"
                            onClick={() => setShowReportDialog(task.assignment_id)}
                          >
                            <FileText className="w-3 h-3" /> Report
                          </Button>
                        </>
                      )}

                      {/* Pending/Awaiting → no action */}
                      {task.status === 'Pending' && (
                        <span className="text-xs text-gray-400 italic">Awaiting response</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── 3. COMPLETED ───────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Completed</h2>
        <div className='w-full overflow-x-auto rounded-md border'>
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className="font-semibold">DeviceID</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Room</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Issue / Suggestion</TableHead>
                <TableHead className="font-semibold">Technician</TableHead>
                <TableHead className="font-semibold whitespace-nowrap hidden md:table-cell">Completed On</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">Loading...</TableCell></TableRow>
              ) : completedTasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">No completed tasks yet</TableCell></TableRow>
              ) : completedTasks.map(task => (
                <TableRow key={task.assignment_id}>
                  <TableCell className='font-medium'>{task.deviceId}</TableCell>
                  <TableCell className="whitespace-nowrap">{task.room}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2 flex-nowrap">
                      <CriticalityBadge criticality={task.criticality} />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[350px]">{task.issue}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{task.technicianName}</p>
                      <p className="text-xs text-gray-500">{task.specialization}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-500 whitespace-nowrap">{task.completedAt}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 border-none">Completed</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

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

      {/* Technician Assignment / Reassignment Dialog */}
      <AlertDialog open={!!showTechnicianDialog} onOpenChange={() => { setShowTechnicianDialog(null); setReassigningAssignmentId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {reassigningAssignmentId !== null ? 'Reassign Technician' : 'Assign Technician'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {assignmentSuccess ? (
                <span className="text-green-600 font-medium">
                  {reassigningAssignmentId !== null ? 'Task reassigned successfully!' : 'Technician assigned successfully!'}
                </span>
              ) : reassigningAssignmentId !== null
                ? 'Select a new technician to reassign this rejected task.'
                : 'Select a technician to assign to this maintenance task.'}
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
                  <label htmlFor={`tech-${tech.id}`} className={`text-sm font-medium leading-none ${tech.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    {tech.name} <span className="text-xs text-gray-400">({tech.specialization})</span>
                  </label>
                  {!tech.available && <span className="ml-auto text-xs text-muted-foreground font-medium">Unavailable</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddTechnicianDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Technician
            </Button>
            <div className="flex gap-2">
              <AlertDialogCancel onClick={() => { setReassigningAssignmentId(null); setSelectedTechnician('') }}>Cancel</AlertDialogCancel>
              <Button onClick={handleAssignOrReassign} disabled={!selectedTechnician} className="bg-green-500 hover:bg-green-600">
                {reassigningAssignmentId !== null ? 'Reassign' : 'Assign'}
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
              <Plus className="h-5 w-5 text-blue-600" /> Add New Technician
            </AlertDialogTitle>
            <AlertDialogDescription>Enter the technician's information</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {[
              { label: 'Name', key: 'name', placeholder: 'Enter technician name' },
              { label: 'Phone Number', key: 'phone', placeholder: 'Enter phone number' },
              { label: 'Email Address', key: 'email', placeholder: 'Enter email address', type: 'email' },
              { label: 'Specialization', key: 'specialization', placeholder: 'e.g., HVAC, Electrical' }
            ].map(f => (
              <div key={f.key} className="space-y-2">
                <label className="text-sm font-medium">{f.label}</label>
                <Input
                  placeholder={f.placeholder}
                  type={f.type ?? 'text'}
                  value={(newTechnician as any)[f.key]}
                  onChange={e => setNewTechnician(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
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

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog !== null} onOpenChange={() => setShowReportDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Task Report
            </AlertDialogTitle>
            <AlertDialogDescription>
              Report for Assignment #{showReportDialog}. The technician has been notified and this task is being tracked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowReportDialog(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default TableSelectableRowDemo
