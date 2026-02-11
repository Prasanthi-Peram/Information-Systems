import { NextRequest, NextResponse } from 'next/server'
import { withAuth, handleError } from '@/server/middleware/auth'
import { UserService } from '@/server/services/user.service'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const userId = (request as any).userId

    if (!userId) {
      return NextResponse.json(
        { error: 'No user ID found in token' },
        { status: 401 }
      )
    }

    const user = await UserService.getUserById(userId)

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'logout') {
      const response = NextResponse.json({
        status: 'success',
        message: 'Logged out successfully',
      })

      response.cookies.delete('auth_token')
      return response
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    return handleError(error)
  }
}
