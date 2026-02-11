import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/server/services/user.service'
import { withAuth, handleError } from '@/server/middleware/auth'

interface Params {
  id: string
}

export const GET = withAuth(async (request: NextRequest, { params }: { params: Params }) => {
  try {
    const { id } = params

    const user = await UserService.getUserById(id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: user,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Params }) => {
  try {
    const { id } = params
    const body = await request.json()

    const user = await UserService.updateUser(id, body)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: user,
    })
  } catch (error) {
    return handleError(error)
  }
})
