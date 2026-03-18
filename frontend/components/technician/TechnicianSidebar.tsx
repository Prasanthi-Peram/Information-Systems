'use client'

import { cn } from '@/lib/utils'
import {
    Wrench,
    Home,
    Settings,
    LogOut,
    CheckCircle2
} from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItemProps {
    icon: React.ReactNode
    label: string
    href: string
    active?: boolean
}

function NavItem({ icon, label, href, active = false }: NavItemProps) {
    return (
        <Link href={href}>
            <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors",
                active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}>
                {icon}
                <span className="font-medium">{label}</span>
            </div>
        </Link>
    )
}

export function TechnicianSidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-[#1a1c2e] text-white flex flex-col h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                    <Wrench className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl">Technician Portal</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                <NavItem
                    icon={<Home className="w-5 h-5" />}
                    label="Home"
                    href="/technician"
                    active={pathname === '/technician'}
                />
                <NavItem
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    label="Accepted"
                    href="/technician/accepted"
                    active={pathname === '/technician/accepted'}
                />
                <NavItem
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    label="Completed"
                    href="/technician/completed"
                    active={pathname === '/technician/completed'}
                />
            </nav>

            <div className="p-4 space-y-2 border-t border-gray-700">
                <NavItem
                    icon={<Settings className="w-5 h-5" />}
                    label="Settings"
                    href="/technician/settings"
                    active={pathname === '/technician/settings'}
                />
                <div
                    onClick={() => signOutAction()}
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white cursor-pointer transition-colors hover:bg-red-600 rounded-lg group"
                >
                    <LogOut className="w-5 h-5 group-hover:text-white" />
                    <span className="font-medium">Sign Out</span>
                </div>
            </div>
        </div>
    )
}
