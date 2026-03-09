'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User, Shield, Bell } from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'

export default function SettingsPage() {
  const handleLogout = async () => {
    await signOutAction()
  }

  return (
    <div className="@container grow w-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and preferences</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">User Profile</h3>
                <p className="text-sm text-muted-foreground">Manage your personal information</p>
              </div>
              <Button variant="outline">Edit Profile</Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">Change password and security settings</p>
              </div>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              Session Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">Sign Out</h3>
                <p className="text-sm text-red-700 dark:text-red-300">Sign out of your account and return to login</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

