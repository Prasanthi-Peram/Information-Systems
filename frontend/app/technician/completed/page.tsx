'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
    Wrench,
    Clock,
    CheckCircle2,
    Trophy,
    TrendingUp,
    BarChart3,
    CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getUserId } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { TechnicianSidebar } from '@/components/technician/TechnicianSidebar'
import { Badge } from '@/components/ui/Badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table"

interface Task {
    assignment_id: number
    acName: string
    location: string
    condition: string
    severity: string
    status: string
}

interface Metrics {
    total_completed: number
    total_hours: number
    avg_hours_per_task: number
}

export default function CompletedTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [metrics, setMetrics] = useState<Metrics>({ total_completed: 0, total_hours: 0, avg_hours_per_task: 0 })
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            const id = await getUserId()
            if (id) {
                setUserId(id)
                fetchData(id)
            } else {
                router.push('/signin?role=technician')
            }
        }
        init()
    }, [router])

    const fetchData = async (id: string) => {
        try {
            setLoading(true)
            const [tasksRes, metricsRes] = await Promise.all([
                fetch(`http://localhost:8000/technician/tasks/${id}`),
                fetch(`http://localhost:8000/technician/metrics/${id}`)
            ])

            if (tasksRes.ok) {
                const data = await tasksRes.json()
                setTasks(data.filter((t: Task) => t.status === 'Completed'))
            }

            if (metricsRes.ok) {
                const data = await metricsRes.json()
                setMetrics(data)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-[#f8f9fc]">
            <TechnicianSidebar />

            <div className="flex-1 overflow-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Completed Tasks</h1>
                    <p className="text-gray-500">History of your successfully completed maintenance tasks</p>
                </header>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Trophy className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Total Tasks</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{metrics.total_completed}</h3>
                                    <p className="text-xs text-blue-400 mt-1">Completed units</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-green-50/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <Clock className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-green-600">Work Hours</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{metrics.total_hours.toFixed(1)}h</h3>
                                    <p className="text-xs text-green-400 mt-1">Total time spent</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-purple-50/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-purple-600">Avg. Time</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{metrics.avg_hours_per_task.toFixed(1)}h</h3>
                                    <p className="text-xs text-purple-400 mt-1">Per assignment</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-xl">Task History</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="font-bold">Unit Name</TableHead>
                                    <TableHead className="font-bold">Location</TableHead>
                                    <TableHead className="font-bold">Issue</TableHead>
                                    <TableHead className="font-bold text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            Loading tasks...
                                        </TableCell>
                                    </TableRow>
                                ) : tasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No completed tasks yet.
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
                                                <Badge className="bg-green-100 text-green-700 border-none">Completed</Badge>
                                            </TableCell>
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
