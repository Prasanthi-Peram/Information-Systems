import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/server/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'status') {
      return NextResponse.json({
        status: 'ready',
        message: 'WebSocket endpoint is ready. Connect via WebSocket protocol at /api/ws',
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Use WebSocket protocol to connect',
    }, { status: 400 })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Relay to backend WebSocket if provided
    const apiUrl = process.env.API_URL || 'http://localhost:8000'

    const response = await fetch(`${apiUrl}/ws`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json({
      status: 'success',
      data,
    })
  } catch (error) {
    return handleError(error)
  }
}
