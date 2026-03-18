'use client'

import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { SunSnow, Zap, Briefcase, ArrowUpRight, AlertCircle, Users, X, ArrowLeft, Heart, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HealthChart } from '@/components/ui/Health-chart'
import { ChartAreaInteractive } from '@/components/ui/Parameters'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
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
import { Input } from '@/components/ui/Input'

interface MaintenanceRecord {
  id: string
  deviceId: string
  room: string
  lastService: string
  nextService: string
  issue: string
  criticality: 'Low' | 'Medium' | 'High' | 'Critical'
  timeStamp?: string
}

interface Technician {
  id: string
  name: string
  specialization: string
  available: boolean
  phone?: string
  email?: string
}

interface DashboardStats {
  active_acs: number
  avg_performance: number
  avg_health: number
  avg_power: number
  maintenance_tasks: number
  health_distribution: { good: number, fair: number, poor: number }
}

export default function DashboardPage() {
  const router = useRouter()
  const [items, setItems] = useState<MaintenanceRecord[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showTechnicianDialog, setShowTechnicianDialog] = useState<string | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [techniciansList, setTechniciansList] = useState<Technician[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [showAddTechnicianDialog, setShowAddTechnicianDialog] = useState(false)
  const [newTechnician, setNewTechnician] = useState({ name: '', specialization: '', phone: '', email: '' })
  const [stats, setStats] = useState<DashboardStats>({
    active_acs: 0,
    avg_performance: 0,
    avg_health: 0,
    avg_power: 0,
    maintenance_tasks: 0,
    health_distribution: { good: 0, fair: 0, poor: 0 }
  })
  const [alerts, setAlerts] = useState<any[]>([])
  const [historyData, setHistoryData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState("1h")
  const [loading, setLoading] = useState(true)
  const [assignmentSuccess, setAssignmentSuccess] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, alertsRes, tasksRes, historyRes] = await Promise.all([
        fetch('http://localhost:8000/dashboard/stats'),
        fetch('http://localhost:8000/alerts'),
        fetch('http://localhost:8000/maintenance/tasks'),
        fetch(`http://localhost:8000/dashboard/history?range=${timeRange}`)
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (alertsRes.ok) setAlerts(await alertsRes.json())
      if (tasksRes.ok) setItems(await tasksRes.json())
      if (historyRes.ok) setHistoryData(await historyRes.json())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

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

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems)
    if (checked) {
      newSelectedItems.add(itemId)
    } else {
      newSelectedItems.delete(itemId)
    }
    setSelectedItems(newSelectedItems)
  }

  const handleScheduleClick = (itemId: string) => {
    setShowTechnicianDialog(itemId)
    fetchTechnicians()
  }

  const handleAssignTechnician = async () => {
    if (showTechnicianDialog && selectedTechnician) {
      const tech = techniciansList.find(t => t.id === selectedTechnician)
      if (!tech) return

      try {
        const response = await fetch('http://localhost:8000/maintenance/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_id: parseInt(showTechnicianDialog),
            technician_id: parseInt(tech.id)
          }),
        })

        if (response.ok) {
          setAssignmentSuccess(true)
          setSelectedTechnician('')
          setTimeout(() => {
            setAssignmentSuccess(false)
            setShowTechnicianDialog(null)
            fetchAll()
            fetchTechnicians()
            setSelectedItems(prev => {
              const newSet = new Set(prev)
              newSet.delete(showTechnicianDialog)
              return newSet
            })
          }, 1500)
        }
      } catch (error) {
        console.error('Error assigning technician:', error)
      }
    }
  }

  const confirmDelete = async (itemId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/alerts/resolve/${itemId}`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchAll()
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
    setShowDeleteDialog(null)
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

  const getHealthStatus = (score: number) => {
    if (score > 70) return { label: 'Good', color: 'text-green-600' }
    if (score > 40) return { label: 'Fair', color: 'text-yellow-600' }
    return { label: 'Poor', color: 'text-red-600' }
  }

  const healthStatus = getHealthStatus(stats.avg_health)

  const cards = [
    { icon: SunSnow, iconColor: 'text-green-600', title: 'Active ACs', value: stats.active_acs, unit: '' },
    { icon: Zap, iconColor: 'text-blue-600', title: 'Power Consumption', value: stats.avg_power, unit: ' kW' },
    { icon: Briefcase, iconColor: 'text-purple-600', title: 'Maintenance Tasks', value: stats.maintenance_tasks, unit: '' },
    { icon: ArrowUpRight, iconColor: 'text-pink-600', title: 'Avg. Performance', value: stats.avg_performance, unit: '%' },
    { icon: Heart, iconColor: healthStatus.color, title: 'System Health', value: stats.avg_health, unit: '%', status: healthStatus.label },
  ]

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">AC Management System Overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="flex items-center gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="@container grow w-full space-y-6">
        <div className="grid grid-cols-1 @3xl:grid-cols-5 gap-4">
          {cards.map((card, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-4">
                  <card.icon className={cn('size-5', card.iconColor)} />
                  {card.status && (
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", card.iconColor)}>
                      {card.status}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between grow">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">{card.title}</div>
                    <div className="text-2xl font-bold text-foreground">
                      {loading ? '—' : (card.value ?? 0).toLocaleString()}{card.unit}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <ChartAreaInteractive
              data={historyData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>
          <div className="lg:col-span-1">
            <HealthChart data={stats.health_distribution} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* ── MAINTENANCE INFORMATION ── */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Maintenance Information</CardTitle>
                <CardDescription>AC system maintenance records and status</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto min-h-[20rem] max-h-[30rem] lg:min-h-[25rem] lg:max-h-[35rem]">
                <div className="w-full overflow-x-auto rounded-md border">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold">AC Unit</th>
                        <th className="text-left p-4 font-semibold whitespace-nowrap">Time</th>
                        <th className="text-left p-4 font-semibold whitespace-nowrap">Room</th>
                        <th className="text-left p-4 font-semibold hidden sm:table-cell w-full whitespace-nowrap">Issue</th>
                        <th className="text-left p-4 font-semibold">Criticality</th>
                        <th className="text-left p-4 w-[100px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading tasks...</td></tr>
                      ) : items.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No pending maintenance tasks.</td></tr>
                      ) : items.map(item => (
                        <tr
                          key={item.id}
                          className={cn(
                            "border hover:bg-accent/50 transition-colors",
                            selectedItems.has(item.id) && "bg-green-50 dark:bg-green-900/20"
                          )}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
                              />
                              <span className="font-medium whitespace-nowrap">{item.deviceId}</span>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap text-xs text-muted-foreground">
                            {item.timeStamp ? new Date(item.timeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                          </td>
                          <td className="p-4 whitespace-nowrap">{item.room}</td>
                          <td className="p-4 hidden sm:table-cell whitespace-nowrap truncate max-w-[200px]">{item.issue}</td>
                          <td className="p-4">
                            <Badge className={cn(
                              item.criticality === 'High' || item.criticality === 'Critical' ? 'bg-red-100 text-red-700' :
                                item.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                            )}>
                              {item.criticality}
                            </Badge>
                          </td>
                          <td className="p-4 w-[100px]">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleScheduleClick(item.id)}
                                className={cn("h-8 px-2 text-xs transition-opacity", !selectedItems.has(item.id) && "opacity-0 pointer-events-none")}
                              >
                                <Users className="h-3 w-3 mr-1" /> Assign
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDeleteDialog(item.id)}
                                className={cn("h-8 w-8 p-0 text-red-500 transition-opacity", !selectedItems.has(item.id) && "opacity-0 pointer-events-none")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── ALERTS SIDEBAR ── */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>System alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[20rem] lg:min-h-[25rem] overflow-auto">
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading alerts...</div>
                  ) : alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div
                        key={alert.alert_id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border",
                          alert.alert_criticality === 'Critical' ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" :
                            alert.alert_criticality === 'Warning' ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950" :
                              "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                        )}
                      >
                        <AlertCircle className={cn(
                          "h-5 w-5 mt-0.5",
                          alert.alert_criticality === 'Critical' ? "text-red-600 dark:text-red-400" :
                            alert.alert_criticality === 'Warning' ? "text-orange-600 dark:text-orange-400" :
                              "text-blue-600 dark:text-blue-400"
                        )} />
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            alert.alert_criticality === 'Critical' ? "text-red-900 dark:text-red-100" :
                              alert.alert_criticality === 'Warning' ? "text-orange-900 dark:text-orange-100" :
                                "text-blue-900 dark:text-blue-100"
                          )}>
                            {alert.alert_text}
                          </p>
                          <p className={cn(
                            "text-xs mt-1",
                            alert.alert_criticality === 'Critical' ? "text-red-700 dark:text-red-300" :
                              alert.alert_criticality === 'Warning' ? "text-orange-700 dark:text-orange-300" :
                                "text-blue-700 dark:text-blue-300"
                          )}>
                            Device: {alert.device_id}
                            {alert.recommendation && ` • ${alert.recommendation}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.time_stamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                      <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                      <p>No active alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
                <span className="text-green-600 font-medium">Technician assigned successfully!</span>
              ) : 'Select a technician to assign to this maintenance task.'}
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
              <Users className="h-4 w-4" /> Add Technician
            </Button>
            <div className="flex gap-2">
              <AlertDialogCancel onClick={() => setSelectedTechnician('')}>Cancel</AlertDialogCancel>
              <Button onClick={handleAssignTechnician} disabled={!selectedTechnician} className="bg-green-500 hover:bg-green-600">
                Assign
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Technician Dialog */}
      <AlertDialog open={showAddTechnicianDialog} onOpenChange={setShowAddTechnicianDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Technician</AlertDialogTitle>
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

      {/* False Alarm Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as False Alarm?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the alert as a false alarm and remove it from the maintenance list.
              Model retraining is automatically triggered every 10 false alarms to improve accuracy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete(showDeleteDialog!)} className="bg-red-600 hover:bg-red-700">
              Mark False
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
