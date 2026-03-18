'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    Plus,
    UserPlus,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Technician {
    technician_id: number
    user_id: string
    name: string
    specialization: string
    phone: string
    is_available: boolean
}

interface AssignTechnicianModalProps {
    isOpen: boolean
    onClose: () => void
    onAssign: (technicianId: number) => void
    alertId: string | number | null
}

export function AssignTechnicianModal({ isOpen, onClose, onAssign, alertId }: AssignTechnicianModalProps) {
    const [technicians, setTechnicians] = useState<Technician[]>([])
    const [selectedTechId, setSelectedTechId] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchTechnicians()
        }
    }, [isOpen])

    const fetchTechnicians = async () => {
        try {
            setLoading(true)
            const res = await fetch('http://localhost:8000/technicians')
            const data = await res.json()
            setTechnicians(data)
        } catch (error) {
            console.error('Error fetching technicians:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-[400px] max-w-full shadow-2xl transform transition-all scale-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Assign Technician</h3>
                    <Button
                        size="sm"
                        className="bg-[#00b341] hover:bg-[#009e3a] text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 h-8"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="font-semibold">Add</span>
                    </Button>
                </div>

                <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading technicians...</div>
                    ) : technicians.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No technicians found in database.</div>
                    ) : (
                        technicians.map((tech) => (
                            <div
                                key={tech.technician_id}
                                className={cn(
                                    "flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer border-2",
                                    selectedTechId === tech.technician_id
                                        ? "border-green-500 bg-green-50/30"
                                        : "border-transparent hover:bg-gray-50"
                                )}
                                onClick={() => tech.is_available && setSelectedTechId(tech.technician_id)}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedTechId === tech.technician_id
                                        ? "border-green-500 bg-green-500"
                                        : "border-gray-300"
                                )}>
                                    {selectedTechId === tech.technician_id && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="font-bold text-gray-900 leading-tight">{tech.name}</div>
                                    <div className="text-sm text-gray-400 font-medium">{tech.specialization}</div>
                                </div>

                                <Badge
                                    className={cn(
                                        "rounded-full px-3 py-0.5 text-[11px] font-bold border-none",
                                        tech.is_available
                                            ? "bg-green-100 text-green-600 hover:bg-green-100"
                                            : "bg-red-100 text-red-500 hover:bg-red-100"
                                    )}
                                >
                                    {tech.is_available ? 'Available' : 'Unavailable'}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl border-gray-200 text-gray-600 font-bold h-12 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => selectedTechId && onAssign(selectedTechId)}
                        disabled={!selectedTechId}
                        className={cn(
                            "flex-1 rounded-xl font-bold h-12 flex items-center justify-center gap-2 transition-all",
                            selectedTechId
                                ? "bg-[#7fd3a1] hover:bg-[#6bc28f] text-white"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        <UserPlus className="w-5 h-5" />
                        Assign
                    </Button>
                </div>
            </div>
        </div>
    )
}
