'use client'

import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function AlertsPanel({ data }: { data: any[] }) {

  async function sendFeedback(ac: any, feedback: 'false_alarm' | 'correct') {
    try {
      const apiUrl = `http://${window.location.hostname}:8000/ml/feedback`
      console.log('Sending feedback to:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: ac.Device_ID,
          time_stamp: ac.Time_Stamp,
          feedback
        })
      })
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error(' Feedback failed:', response.status, errorText)
        alert(` Failed to save feedback (${response.status})\n\nMake sure the backend is running on localhost:8000`)
        return
      }

      // Try to parse JSON response
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error(' JSON parse error:', parseError)
        alert(` Server response error. Please try again.`)
        return
      }
      
      console.log(`Feedback sent: ${ac.Device_ID} - ${feedback}`)
      
      // Show success message
      if (feedback === 'false_alarm') {
        alert(`False alarm recorded for ${ac.Device_ID}\n\nThe model will learn from this correction and improve future predictions.`)
      } else {
        alert(`Correct prediction confirmed for ${ac.Device_ID}\n\nThank you for validating the model's accuracy!`)
      }
    } catch (err) {
      console.error(' Feedback error:', err)
      alert(` Error sending feedback: ${err instanceof Error ? err.message : String(err)}\n\nMake sure the backend API is running on localhost:8000`)
    }
  }

  const alerts = data.filter(ac => ac.critical_alert === 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {alerts.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No active alerts
          </div>
        )}

        {/* INFO BOX */}
        {alerts.length > 0 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
            <strong>How Feedback Works:</strong>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li><strong>False Alarm:</strong> Click if the alert is wrong - AC is fine</li>
              <li><strong>Correct:</strong> Click if the alert is accurate</li>
              <li>Your feedback trains the ML model to improve</li>
              <li>Go to <strong>Settings → Model Feedback</strong> to retrain the model</li>
            </ul>
          </div>
        )}

        {alerts.map(ac => (
          <div
            key={ac.Device_ID}
            className="p-3 rounded-lg border bg-red-50 border-red-200 text-red-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-2 font-medium">
                <AlertTriangle size={16} />
                {ac.Device_ID}
              </div>
            </div>

            <div className="text-xs mt-1 mb-2">
              {ac.Maintenance_Advice}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => sendFeedback(ac, 'false_alarm')}
                className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200 font-medium transition cursor-pointer"
              >
                False Alarm
              </button>

              <button
                onClick={() => sendFeedback(ac, 'correct')}
                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 font-medium transition cursor-pointer"
              >
                Correct
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}