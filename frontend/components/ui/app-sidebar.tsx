"use client"

import { Home, Drill, MonitorCog, School, AirVent, ChevronDown, ChevronRight, Settings, LogOut, User, Shield, UserCheck } from "lucide-react"
import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/Button"
import { signOutAction } from '@/app/actions/auth'

export function AppSidebar() {
  const [isAPsOpen, setIsAPsOpen] = useState(true)

  return (
    <Sidebar>
      <SidebarHeader className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center">
            <AirVent className="h-8 w-8 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xl text-white">Smart AC Manager</span>
            <span className="text-xs text-slate-500">Dashboard</span>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-800"></div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-slate-200 hover:text-white hover:bg-slate-800/50">
                  <a href="/dashboard">
                    <Home className="h-7 w-7" />
                    <span className="text-base">Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-slate-200 hover:text-white hover:bg-slate-800/50">
                  <a href="/maintenance">
                    <Drill className="h-7 w-7" />
                    <span className="text-base">Maintenance</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-slate-200 hover:text-white hover:bg-slate-800/50">
                  <a href="/rooms">
                    <School className="h-7 w-7" />
                    <span className="text-base">Rooms</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-slate-800">
        <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-slate-200 hover:text-white hover:bg-slate-800/50">
              <a href="/settings">
                <Settings className="h-7 w-7" />
                <span className="text-base">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAction} className="w-full">
              <SidebarMenuButton 
                type="submit"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full"
              >
                <LogOut className="h-7 w-7" />
                <span className="text-base">Sign Out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}