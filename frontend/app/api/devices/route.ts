import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/server/services/device.service'
import { withAuth, handleError } from '@/server/middleware/auth'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const roomId = searchParams.get('room_id')
    const status = searchParams.get('status')

    let devices

    if (roomId) {
      devices = await DeviceService.getDevicesByRoom(roomId)
    } else if (status) {
      devices = await DeviceService.getDevicesByStatus(status)
    } else {
      devices = await DeviceService.getAllDevices(limit, offset)
    }

    return NextResponse.json({
      status: 'success',
      data: devices,
      count: devices.length,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const device = await DeviceService.createDevice(body)

    return NextResponse.json(
      { status: 'success', data: device },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
})
