import { NextRequest, NextResponse } from 'next/server'
import { TelemetryService } from '@/server/services/telemetry.service'
import { withAuth, handleError } from '@/server/middleware/auth'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!deviceId) {
      return NextResponse.json(
        { error: 'device_id is required' },
        { status: 400 }
      )
    }

    const telemetry = await TelemetryService.getDeviceTelemetry(
      parseInt(deviceId),
      limit,
      offset
    )

    return NextResponse.json({
      status: 'success',
      data: telemetry,
      count: telemetry.length,
    })
  } catch (error) {
    return handleError(error)
  }
})

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.time_stamp || !data.device_id) {
      return NextResponse.json(
        { error: 'time_stamp and device_id are required' },
        { status: 400 }
      )
    }

    // Send to FastAPI backend
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:8000'}/ws`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    return NextResponse.json({ status: 'success', message: 'Telemetry received' })
  } catch (error) {
    return handleError(error)
  }
}
