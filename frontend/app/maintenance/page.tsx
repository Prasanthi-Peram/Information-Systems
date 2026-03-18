'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/Table'
import { UserCheck, Users, FileDown, ArrowLeft, RefreshCw, FileText, ClipboardList, Activity, AlertTriangle, CheckCircle2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
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

interface MaintenanceRecord {
  id: string
  deviceId: string
  room: string
  lastService: string
  nextService: string
  issue: string
  criticality: 'Low' | 'Medium' | 'High' | 'Critical'
  technician?: string
  timeStamp?: string
  status?: string
  assignment_id?: number
  technicianName?: string
  specialization?: string
}

interface Technician {
  id: string
  name: string
  specialization: string
  available: boolean
  phone?: string
  email?: string
}

interface CompletedTask {
  assignment_id: number
  deviceId: string
  room: string
  issue: string
  criticality: string
  technicianName: string
  completedAt: string
}

interface MaintenanceStats {
  pending: number
  assigned: number
  ongoing: number
  rejected: number
  total: number
}

export default function MaintenancePage() {
  const router = useRouter()
  const [pendingTasks, setPendingTasks] = useState<MaintenanceRecord[]>([])
  const [assignedTasks, setAssignedTasks] = useState<MaintenanceRecord[]>([])
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [stats, setStats] = useState<MaintenanceStats>({ pending: 0, assigned: 0, ongoing: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const [showTechnicianDialog, setShowTechnicianDialog] = useState<string | null>(null)
  const [reassigningAssignmentId, setReassigningAssignmentId] = useState<number | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [techniciansList, setTechniciansList] = useState<Technician[]>([])
  const [showAddTechnicianDialog, setShowAddTechnicianDialog] = useState(false)
  const [newTechnician, setNewTechnician] = useState({ name: '', specialization: '', phone: '', email: '' })
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
      if (assignedRes.ok) {
        const data = await assignedRes.json()
        setAssignedTasks(data.map((t: any) => ({
          id: t.assignment_id.toString(),
          assignment_id: t.assignment_id,
          deviceId: t.deviceId,
          room: t.room,
          lastService: t.lastService ?? '',
          nextService: t.nextService ?? '',
          issue: t.issue,
          criticality: t.criticality,
          technician: t.technicianName,
          status: t.status,
          technicianName: t.technicianName,
          specialization: t.specialization
        })))
      }
      if (completedRes.ok) setCompletedTasks(await completedRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (error) {
      console.error('Error fetching maintenance data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTechnicians = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/technicians')
      const data = await response.json()
      setTechniciansList(data.map((tech: any) => ({
        id: tech.technician_id.toString(),
        name: tech.name,
        specialization: tech.specialization,
        available: tech.is_available,
        phone: tech.phone,
        email: tech.email
      })))
    } catch (error) {
      console.error('Error fetching technicians:', error)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchTechnicians()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll, fetchTechnicians])

  const openAssignDialog = (alertId: string) => {
    setReassigningAssignmentId(null)
    setShowTechnicianDialog(alertId)
    fetchTechnicians()
  }

  const openReassignDialog = (assignmentId: number) => {
    setReassigningAssignmentId(assignmentId)
    setShowTechnicianDialog('reassign')
    fetchTechnicians()
  }

  const handleAssignOrReassign = async () => {
    if (!selectedTechnician) return
    const tech = techniciansList.find(t => t.id === selectedTechnician)
    if (!tech) return

    try {
      let res: Response
      if (reassigningAssignmentId !== null) {
        res = await fetch('http://localhost:8000/maintenance/reassign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignment_id: reassigningAssignmentId, technician_id: parseInt(tech.id) }),
        })
      } else {
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
    if (!name || !phone || !specialization) return

    try {
      const userPayload = {
        id: crypto.randomUUID(),
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        password: '$2b$10$placeholder',
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

      if (userRes.ok) {
        setNewTechnician({ name: '', specialization: '', phone: '', email: '' })
        setShowAddTechnicianDialog(false)
        await fetchTechnicians()
      }
    } catch (e) {
      console.error('Error adding technician:', e)
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-white text-black hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* ── STATS BANNER ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending', value: stats.pending, icon: <AlertTriangle className="w-4 h-4 text-orange-500" />, color: 'bg-orange-50 border-orange-100' },
            { label: 'Assigned', value: stats.assigned, icon: <ClipboardList className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
            { label: 'Ongoing', value: stats.ongoing, icon: <Activity className="w-4 h-4 text-purple-500" />, color: 'bg-purple-50 border-purple-100' },
            { label: 'Total Tasks', value: stats.total, icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, color: 'bg-green-50 border-green-100' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`flex items-center gap-3 rounded-xl border p-4 ${color}`}>
              <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '—' : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 1. PENDING ── */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pending Maintenance</h2>
            <Button variant="outline" size="sm" onClick={fetchAll} className="flex items-center gap-1 text-xs">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>AC Unit</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">Loading...</TableCell></TableRow>
                ) : pendingTasks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">No pending tasks</TableCell></TableRow>
                ) : pendingTasks.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.timeStamp ? new Date(item.timeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{item.deviceId}</TableCell>
                    <TableCell>{item.room}</TableCell>
                    <TableCell>{item.issue}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        item.criticality === 'High' || item.criticality === 'Critical' ? 'bg-red-100 text-red-700' :
                          item.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                      )}>
                        {item.criticality}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openAssignDialog(item.id)}>
                        <Users className="h-3 w-3 mr-1" /> Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── 2. ASSIGNED ── */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Assigned Maintenance</h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>AC Unit</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-gray-400">Loading...</TableCell></TableRow>
                ) : assignedTasks.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-gray-400">No assigned tasks</TableCell></TableRow>
                ) : assignedTasks.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.timeStamp ? new Date(item.timeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{item.deviceId}</TableCell>
                    <TableCell>{item.room}</TableCell>
                    <TableCell>{item.issue}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.technicianName}</p>
                        <p className="text-xs text-gray-500">{item.specialization}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        item.status === 'Rejected' ? 'bg-red-100 text-red-700 border-none' :
                          item.status === 'Accepted' ? 'bg-green-100 text-green-700 border-none' :
                            'bg-yellow-100 text-yellow-700 border-none'
                      )}>
                        {item.status === 'Accepted' ? 'Accepted' : item.status === 'Rejected' ? 'Rejected' : 'Awaiting'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {item.status === 'Accepted' && (
                          <Button size="sm" variant="outline" onClick={() => setShowReportDialog(item.assignment_id!)}>
                            <FileText className="h-3 w-3 mr-1" /> Report
                          </Button>
                        )}
                        {item.status === 'Rejected' && (
                          <>
                            <Button size="sm" onClick={() => openReassignDialog(item.assignment_id!)}>
                              <Users className="h-3 w-3 mr-1" /> Reassign
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowReportDialog(item.assignment_id!)}>
                              <FileText className="h-3 w-3 mr-1" /> Report
                            </Button>
                          </>
                        )}
                        {item.status === 'Pending' && (
                          <span className="text-xs text-gray-400 italic">Awaiting response</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── 3. COMPLETED ── */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Completed</h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>AC Unit</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Completed On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">Loading...</TableCell></TableRow>
                ) : completedTasks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">No completed tasks yet</TableCell></TableRow>
                ) : completedTasks.map(item => (
                  <TableRow key={item.assignment_id}>
                    <TableCell className="font-medium">{item.deviceId}</TableCell>
                    <TableCell>{item.room}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{item.issue}</TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{item.technicianName}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{item.completedAt}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 border-none">Completed</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

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
              {techniciansList.map(tech => (
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
              disabled={!newTechnician.name || !newTechnician.phone || !newTechnician.specialization}
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
