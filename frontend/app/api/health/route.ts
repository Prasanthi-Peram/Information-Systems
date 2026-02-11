import { NextRequest, NextResponse } from 'next/server'
import { ApiService } from '@/server/services/api.service'

export async function GET(request: NextRequest) {
  try {
    const health = await ApiService.getHealth()
    return NextResponse.json({
      status: 'healthy',
      backend: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Backend unreachable',
      },
      { status: 503 }
    )
  }
}
