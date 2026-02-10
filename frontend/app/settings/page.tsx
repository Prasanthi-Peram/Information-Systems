import FeedbackDashboard from '@/components/ui/feedback-dashboard'

export default function SettingsPage() {
  return (
    <div className="@container grow w-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and ML model performance</p>
      </div>
      
      <div className="grid gap-6">
        {/* MODEL FEEDBACK */}
        <FeedbackDashboard />

        {/* OTHER SETTINGS */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
          <p className="text-muted-foreground">Additional settings coming soon...</p>
        </div>
      </div>
    </div>
  )
}

