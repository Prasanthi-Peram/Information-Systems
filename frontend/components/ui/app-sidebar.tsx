"use client"

import { Home, Drill, MonitorCog, School, AirVent, ChevronDown, ChevronRight, Settings } from "lucide-react"
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
                    <span className="text-base">Maintence</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-slate-200 hover:text-white hover:bg-slate-800/50">
                  <a href="/dss">
                    <MonitorCog className="h-7 w-7" />
                    <span className="text-base">DSS</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Collapsible open={isAPsOpen} onOpenChange={setIsAPsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="text-slate-200 hover:text-white hover:bg-slate-800/50">
                      <School className="h-7 w-7" />
                      <span className="text-base">Rooms</span>
                      {isAPsOpen ? (
                        <ChevronDown className="ml-auto h-7 w-7" />
                      ) : (
                        <ChevronRight className="ml-auto h-7 w-7" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-2 space-y-1">
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/30">
                          <a href="/rooms/nr312" className="text-sm">NR312</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/30">
                          <a href="/rooms/nc324" className="text-sm">NC324</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/30">
                          <a href="/rooms/nr422" className="text-sm">NR422</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/30">
                          <a href="/rooms/ords-lab" className="text-sm">ORDS Lab</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-slate-200 hover:text-white hover:bg-slate-800/50">
              <a href="/settings">
                <Settings className="h-7 w-7" />
                <span className="text-base">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}