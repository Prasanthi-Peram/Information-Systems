import { NextRequest, NextResponse } from 'next/server'
import { TelemetryService } from '@/server/services/telemetry.service'
import { withAuth, handleError } from '@/server/middleware/auth'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')
    const type = searchParams.get('type') // 'metrics', 'health', 'latest', 'range'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const interval = parseInt(searchParams.get('interval') || '60')

    if (!deviceId) {
      return NextResponse.json(
        { error: 'device_id is required' },
        { status: 400 }
      )
    }

    const dId = parseInt(deviceId)

    let data
    switch (type) {
      case 'metrics':
        data = await TelemetryService.getAggregatedMetrics(dId, interval)
        break
      case 'health':
        data = await TelemetryService.getDeviceHealth(dId)
        break
      case 'latest':
        data = await TelemetryService.getLatestTelemetry(dId)
        break
      case 'range':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date required for range query' },
            { status: 400 }
          )
        }
        data = await TelemetryService.getTelemetryByDateRange(
          dId,
          new Date(startDate),
          new Date(endDate)
        )
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be one of: metrics, health, latest, range' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      status: 'success',
      type,
      data,
    })
  } catch (error) {
    return handleError(error)
  }
})
