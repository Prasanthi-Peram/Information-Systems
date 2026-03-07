import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SunSnow, Zap, Briefcase, ArrowUpRight, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HealthChart } from '@/components/ui/health-chart'
import { ChartAreaInteractive } from '@/components/ui/parameters'
import TableSelectableRowDemo from '@/components/ui/maitenance-info'

const cards = [
  {
    icon: SunSnow,
    iconColor: 'text-green-600',
    title: 'Active ACs',
    badge: {
      color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      icon: TrendingUp,
      iconColor: 'text-green-500',
      text: '+12.8%',
    },
    value: 17,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
  {
    icon: Zap,
    iconColor: 'text-blue-600',
    title: 'Power Consumption',
    badge: {
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      icon: TrendingUp,
      iconColor: 'text-blue-500',
      text: '+3.7%',
    },
    value: 3421,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
  {
    icon: ArrowUpRight,
    iconColor: 'text-pink-600',
    title: 'Avg. Performance',
    badge: {
      color: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
      icon: TrendingDown,
      iconColor: 'text-pink-500',
      text: '-2.1%',
    },
    value: 89,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
  {
    icon: Briefcase,
    iconColor: 'text-purple-600',
    title: 'Scheduled Maintenance',
    badge: {
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
      icon: TrendingUp,
      iconColor: 'text-purple-500',
      text: '+8.2%',
    },
    value: 124567,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
  {
    icon: AlertCircle,
    iconColor: 'text-orange-600',
    title: 'Alerts',
    badge: {
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
      icon: TrendingUp,
      iconColor: 'text-orange-500',
      text: '+5.3%',
    },
    value: 12,
    dateRange: 'From Jan 01 - Jul 30, 2024',
  },
]

export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="@container grow w-full space-y-6">
        <div className="grid grid-cols-1 @3xl:grid-cols-5 gap-4">
          {cards.map((card, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col h-full p-4">
                <div className="flex items-center mb-4">
                  <card.icon className={cn('size-5', card.iconColor)} />
                </div>
                <div className="flex-1 flex flex-col justify-between grow">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">{card.title}</div>
                    <div className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <ChartAreaInteractive />
          </div>
          <div className="lg:col-span-1">
            <HealthChart />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Maintenance Information</CardTitle>
                <CardDescription>AC system maintenance records and status</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto min-h-[20rem] max-h-[30rem] lg:min-h-[25rem] lg:max-h-[35rem]">
                <TableSelectableRowDemo />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>System alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[20rem] lg:min-h-[25rem]">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">High Temperature Alert</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">AC Unit #5 temperature exceeded threshold</p>
                      <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Maintenance Due</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">AC Unit #12 scheduled maintenance in 3 days</p>
                      <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">Power Consumption Spike</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">Unusual power consumption detected in AC Unit #8</p>
                      <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Filter Replacement</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">AC Unit #3 filter needs replacement</p>
                      <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
