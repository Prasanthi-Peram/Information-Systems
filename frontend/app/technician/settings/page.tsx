'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TechnicianSidebar } from '@/components/technician/TechnicianSidebar'
import { getUserId } from '@/app/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormLabel as Label } from '@/components/ui/Form'
import { User, Briefcase, Phone, Mail, Save, Loader2 } from 'lucide-react'

interface TechnicianProfile {
    name: string
    email: string
    specialization: string
    phone: string
}

export default function TechnicianSettings() {
    const [profile, setProfile] = useState<TechnicianProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            const id = await getUserId()
            if (id) {
                setUserId(id)
                fetchProfile(id)
            } else {
                router.push('/signin?role=technician')
            }
        }
        init()
    }, [router])

    const fetchProfile = async (id: string) => {
        try {
            setLoading(true)
            const res = await fetch(`http://localhost:8000/technician/profile/${id}`)
            if (res.ok) {
                const data = await res.json()
                setProfile({
                    name: data.name,
                    email: data.email,
                    specialization: data.specialization || '',
                    phone: data.phone || ''
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!userId || !profile) return

        try {
            setSaving(true)
            const res = await fetch(`http://localhost:8000/technician/profile/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: profile.name,
                    specialization: profile.specialization,
                    phone: profile.phone
                })
            })

            if (res.ok) {
                // Show success state or toast
                alert('Profile updated successfully!')
            }
        } catch (error) {
            console.error('Error saving profile:', error)
            alert('Failed to update profile.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen bg-[#f8f9fc]">
                <TechnicianSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-[#f8f9fc]">
            <TechnicianSidebar />

            <div className="flex-1 overflow-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500">Manage your personal information and account settings</p>
                </header>

                <div className="max-w-2xl">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="border-b bg-gray-50/50">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Personal Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        Full Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={profile?.name}
                                        onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                                        className="focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        value={profile?.email}
                                        disabled
                                        className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 italic">Email cannot be changed</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-gray-400" />
                                            Specialization
                                        </Label>
                                        <Input
                                            id="specialization"
                                            value={profile?.specialization}
                                            onChange={(e) => setProfile(prev => prev ? { ...prev, specialization: e.target.value } : null)}
                                            placeholder="e.g. HVAC, Electrical"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={profile?.phone}
                                            onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
