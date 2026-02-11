'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Zap, TrendingUp, AlertTriangle } from 'lucide-react'

export default function FeedbackDashboard() {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [retraining, setRetraining] = useState(false)
  const [message, setMessage] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh stats every 5 seconds
    if (!autoRefresh) return
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  async function fetchStats() {
    try {
      const res = await fetch('/ml/feedback-stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(' Failed to fetch stats:', err)
    }
  }

  async function triggerRetrain() {
    setRetraining(true)
    setMessage('')
    try {
      const res = await fetch('/ml/retrain', { method: 'POST' })
      const data = await res.json()
      setMessage(`${data.message}`)
      setTimeout(fetchStats, 1000)
    } catch (err) {
      setMessage(` Retraining failed: ${err}`)
    } finally {
      setRetraining(false)
    }
  }

  const falseAlarmCount = stats.find(s => s.feedback === 'false_alarm')?.count || 0
  const correctCount = stats.find(s => s.feedback === 'correct')?.count || 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Feedback & Retraining</CardTitle>
          <CardDescription>
            Monitor ML model feedback and trigger retraining when needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">False Alarms</div>
                  <div className="text-3xl font-bold text-blue-600">{falseAlarmCount}</div>
                </div>
                <AlertTriangle className="size-8 text-blue-400" />
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Correct Predictions</div>
                  <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                </div>
                <TrendingUp className="size-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* LEARNING FLOW */}
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <div className="text-sm text-purple-900">
              <strong>How the Model Learns:</strong>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-600">1️⃣</span>
                  <span>Alert appears on Dashboard (e.g., "Preventive Maintenance Suggested")</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-600">2️⃣</span>
                  <span>You click <strong>"False Alarm"</strong> or <strong>"Correct"</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-600">3️⃣</span>
                  <span>Feedback is saved to database with timestamp and sensor data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-600">4️⃣</span>
                  <span>When you click <strong>"Trigger Model Retraining"</strong> below:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="ml-6">• Model analyzes all false alarms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="ml-6">• Updates Isolation Forest algorithm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="ml-6">• Reduces false positives in future predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-600">5️⃣</span>
                  <span>Next alerts are smarter and more accurate! </span>
                </div>
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-sm text-amber-900">
              <strong>Key Points:</strong>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li>Feedback saved immediately when you click "False Alarm" or "Correct"</li>
                <li>See stats above showing model's learning progress</li>
                <li>Once 30+ false alarms are collected, model can retrain</li>
                <li>Retraining improves model accuracy for future predictions</li>
                <li>Auto-refresh every 5 seconds to show real-time stats</li>
              </ul>
            </div>
          </div>

          {/* RETRAIN READINESS */}
          <div className={`p-3 rounded-lg border-2 ${
            falseAlarmCount >= 30
              ? 'bg-green-50 border-green-300 text-green-900'
              : 'bg-yellow-50 border-yellow-300 text-yellow-900'
          }`}>
            <div className="text-sm font-medium">
              {falseAlarmCount >= 30 ? (
                <>Model Ready to Retrain ({falseAlarmCount} false alarms collected)</>
              ) : (
                <>Collecting False Alarms... {falseAlarmCount}/30 needed to retrain</>
              )}
            </div>
            <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  falseAlarmCount >= 30 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(100, (falseAlarmCount / 30) * 100)}%` }}
              />
            </div>
          </div>

          {/* RETRAIN BUTTON */}
          <div>
            <button
              onClick={triggerRetrain}
              disabled={retraining}
              className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 text-white ${
                retraining
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 transition'
              }`}
            >
              <Zap size={18} />
              {retraining ? 'Retraining in progress...' : ' Trigger Model Retraining'}
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Requires 30+ false alarms to retrain. Currently: {falseAlarmCount}
            </p>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className={`p-3 rounded text-sm ${
              message.startsWith('')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* FEEDBACK TABLE */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Feedback Summary</h3>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Count</th>
                    <th className="px-4 py-2 text-left">Unique Devices</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(stat => (
                    <tr key={stat.feedback} className="border-t">
                      <td className="px-4 py-2 capitalize">{stat.feedback}</td>
                      <td className="px-4 py-2 font-medium">{stat.count}</td>
                      <td className="px-4 py-2">{stat.devices}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
