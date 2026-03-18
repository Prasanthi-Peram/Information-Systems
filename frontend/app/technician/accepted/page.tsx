'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
    Wrench,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    MapPin,
    Calendar,
    Filter,
    Search,
    MoreVertical,
    CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

export default function AcceptedTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            const id = await getUserId()
            if (id) {
                setUserId(id)
                fetchTasks(id)
            } else {
                router.push('/signin?role=technician')
            }
        }
        init()
    }, [router])

    const fetchTasks = async (id: string) => {
        try {
            setLoading(true)
            const res = await fetch(`http://localhost:8000/technician/tasks/${id}`)
            if (res.ok) {
                const data = await res.json()
                setTasks(data.filter((t: Task) => t.status === 'Accepted'))
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (assignmentId: number, newStatus: string) => {
        // Optimistically remove from list
        setTasks(prev => prev.filter(t => t.assignment_id !== assignmentId))
        try {
            await fetch(`http://localhost:8000/technician/assignment/${assignmentId}/status?status=${newStatus}`, {
                method: 'POST'
            })
        } catch (error) {
            console.error('Error updating status:', error)
            if (userId) fetchTasks(userId)
        }
    }

    return (
        <div className="flex h-screen bg-[#f8f9fc]">
            <TechnicianSidebar />

            <div className="flex-1 overflow-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Accepted Tasks</h1>
                    <p className="text-gray-500">Tasks you have accepted and are currently working on</p>
                </header>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <CardTitle className="text-xl">In Progress</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="font-bold">Unit Name</TableHead>
                                    <TableHead className="font-bold">Location</TableHead>
                                    <TableHead className="font-bold">Issue</TableHead>
                                    <TableHead className="font-bold text-right">Action</TableHead>
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
                                            No accepted tasks.
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
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                                    onClick={() => handleStatusUpdate(task.assignment_id, 'Completed')}
                                                >
                                                    Complete
                                                </Button>
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
