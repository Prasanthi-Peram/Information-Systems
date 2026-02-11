import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/server/services/user.service'
import { withAuth, handleError } from '@/server/middleware/auth'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const role = searchParams.get('role')

    let users

    if (role) {
      users = await UserService.getUsersByRole(role)
    } else {
      users = await UserService.getAllUsers(limit, offset)
    }

    return NextResponse.json({
      status: 'success',
      data: users,
      count: users.length,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()

    const user = await UserService.updateUser(body.id, body)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { status: 'success', data: user },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
})
