export default function MaintenancePage() {
  return (
    <div className="@container grow w-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Maintenance</h1>
        <p className="text-muted-foreground">Manage and track AC unit maintenance schedules</p>
      </div>
      
      <div className="grid gap-4">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Maintenance Overview</h2>
          <p className="text-muted-foreground">Maintenance content will be displayed here.</p>
        </div>
      </div>
    </div>
  )
}

