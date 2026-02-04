export default function DSSPage() {
  return (
    <div className="@container grow w-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">DSS</h1>
        <p className="text-muted-foreground">Decision Support System for AC management</p>
      </div>
      
      <div className="grid gap-4">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">DSS Overview</h2>
          <p className="text-muted-foreground">DSS content will be displayed here.</p>
        </div>
      </div>
    </div>
  )
}

