import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/server/services/device.service'
import { withAuth, handleError } from '@/server/middleware/auth'

interface Params {
  id: string
}

export const GET = withAuth(async (request: NextRequest, { params }: { params: Params }) => {
  try {
    const { id } = params
    const deviceId = parseInt(id)

    if (isNaN(deviceId)) {
      return NextResponse.json(
        { error: 'Invalid device ID' },
        { status: 400 }
      )
    }

    const device = await DeviceService.getDeviceById(deviceId)

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: device,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Params }) => {
  try {
    const { id } = params
    const deviceId = parseInt(id)
    const body = await request.json()

    if (isNaN(deviceId)) {
      return NextResponse.json(
        { error: 'Invalid device ID' },
        { status: 400 }
      )
    }

    const device = await DeviceService.updateDevice(deviceId, body)

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: device,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: Params }) => {
  try {
    const { id } = params
    const deviceId = parseInt(id)

    if (isNaN(deviceId)) {
      return NextResponse.json(
        { error: 'Invalid device ID' },
        { status: 400 }
      )
    }

    const deleted = await DeviceService.deleteDevice(deviceId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      message: 'Device deleted',
    })
  } catch (error) {
    return handleError(error)
  }
})
