import { AppSidebar } from "@/components/ui/App-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/Sidebar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

