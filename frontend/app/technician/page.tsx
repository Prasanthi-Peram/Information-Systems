'use client'

import { useState, useEffect } from 'react'
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
import {
    Wrench,
    Clock,
    CheckCircle2,
    XCircle,
    Home,
    Settings,
    LogOut,
    FileText,
    Check,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getUserId } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { TechnicianSidebar } from '@/components/technician/TechnicianSidebar'
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

interface TechnicianStats {
    pending: number
    accepted: number
    rejected: number
}

interface MaintenanceTask {
    assignment_id: number
    acName: string
    location: string
    condition: string
    severity: 'Low' | 'Medium' | 'High' | 'Critical'
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed'
}

export default function TechnicianDashboard() {
    const [stats, setStats] = useState<TechnicianStats>({
        pending: 0,
        accepted: 0,
        rejected: 0
    })
    const [tasks, setTasks] = useState<MaintenanceTask[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [confirmAcceptId, setConfirmAcceptId] = useState<number | null>(null)
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            const id = await getUserId()
            if (id) {
                setUserId(id)
            } else {
                router.push('/signin?role=technician')
            }
        }
        init()
    }, [router])

    useEffect(() => {
        if (userId) {
            fetchData(userId)
        }
    }, [userId])

    const fetchData = async (id: string) => {
        try {
            setLoading(true)
            const statsRes = await fetch(`http://localhost:8000/technician/stats/${id}`)
            const statsData = await statsRes.json()
            setStats(statsData)

            const tasksRes = await fetch(`http://localhost:8000/technician/tasks/${id}`)
            const tasksData = await tasksRes.json()
            setTasks(tasksData)
        } catch (error) {
            console.error('Error fetching technician data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (assignmentId: number, status: string) => {
        try {
            await fetch(`http://localhost:8000/technician/assignment/${assignmentId}/status?status=${status}`, {
                method: 'POST'
            })
        } catch (error) {
            console.error('Error updating status:', error)
        } finally {
            // Always re-fetch from backend so the UI reflects real DB state
            if (userId) fetchData(userId)
        }
    }

    return (
        <div className="flex h-screen bg-[#f8f9fc]">
            <TechnicianSidebar />

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
                    <p className="text-gray-500">Manage your assigned maintenance tasks</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon={<Clock className="w-6 h-6 text-orange-600" />}
                        label="Pending"
                        value={stats.pending}
                        sublabel="Waiting for acceptance"
                        color="orange"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
                        label="Accepted"
                        value={stats.accepted}
                        sublabel="Accepted for service"
                        color="green"
                    />
                    <StatCard
                        icon={<XCircle className="w-6 h-6 text-red-600" />}
                        label="Rejected"
                        value={stats.rejected}
                        sublabel="Rejected assignments"
                        color="red"
                    />
                </div>

                {/* Tasks Table */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-xl">Assigned Units</CardTitle>
                        </div>
                        <p className="text-sm text-gray-500">Units assigned to you for maintenance</p>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="font-bold">Unit Name</TableHead>
                                    <TableHead className="font-bold">Location</TableHead>
                                    <TableHead className="font-bold">Condition</TableHead>
                                    <TableHead className="font-bold text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No tasks assigned yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tasks.map((task) => (
                                        <TableRow key={task.assignment_id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Wrench className="w-4 h-4 text-blue-500" />
                                                    {task.acName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{task.location}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 flex-nowrap">
                                                    <Badge
                                                        className={cn(
                                                            "font-medium whitespace-nowrap",
                                                            task.severity === 'Critical' || task.severity === 'High' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                                                                task.severity === 'Medium' ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                                                                    "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                                        )}
                                                    >
                                                        {task.severity}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500 truncate">{task.condition}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 flex-wrap">

                                                    {/* ── Pending: Accept + Reject + Report ── */}
                                                    {task.status === 'Pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-500 hover:bg-green-600 text-white h-8 px-3"
                                                                onClick={() => setConfirmAcceptId(task.assignment_id)}
                                                            >
                                                                Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-red-500 hover:bg-red-600 text-white h-8 px-3"
                                                                onClick={() => handleStatusUpdate(task.assignment_id, 'Rejected')}
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                                                            >
                                                                <FileText className="w-3 h-3 mr-1" />Report
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* ── Accepted: badge + Report only ── */}
                                                    {task.status === 'Accepted' && (
                                                        <>
                                                            <Badge className="bg-green-100 text-green-700 border-none self-center">Accepted</Badge>
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                                                            >
                                                                <FileText className="w-3 h-3 mr-1" />Report
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* ── Rejected: badge + Report only ── */}
                                                    {task.status === 'Rejected' && (
                                                        <>
                                                            <Badge className="bg-red-100 text-red-700 border-none self-center">Rejected</Badge>
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                                                            >
                                                                <FileText className="w-3 h-3 mr-1" />Report
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* ── Completed ── */}
                                                    {task.status === 'Completed' && (
                                                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Accept Confirmation Modal */}
                                            <AlertDialog open={confirmAcceptId === task.assignment_id} onOpenChange={(open) => { if (!open) setConfirmAcceptId(null) }}>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Accept Task</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to undertake this task? You will be responsible for servicing <strong>{task.acName}</strong> at <strong>{task.location}</strong>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => {
                                                                handleStatusUpdate(task.assignment_id, 'Accepted')
                                                                setConfirmAcceptId(null)
                                                            }}
                                                        >
                                                            Yes, Accept
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


function StatCard({ icon, label, value, sublabel, color }: { icon: React.ReactNode, label: string, value: number, sublabel: string, color: string }) {
    const colorClasses = {
        blue: "border-blue-100",
        orange: "border-orange-100",
        green: "border-green-100",
        red: "border-red-100"
    }

    return (
        <Card className={cn("border shadow-none", colorClasses[color as keyof typeof colorClasses])}>
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-xl",
                        color === 'blue' ? "bg-blue-50" :
                            color === 'orange' ? "bg-orange-50" :
                                color === 'green' ? "bg-green-50" :
                                    "bg-red-50"
                    )}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{label}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                        <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
