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

export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const userId = (request as any).userId
    const body = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'No user ID found in token' },
        { status: 401 }
      )
    }

    // Prevent updating sensitive fields
    const allowedFields = ['name', 'avatar', 'email']
    const filteredUpdates: any = {}

    allowedFields.forEach((field) => {
      if (field in body) {
        filteredUpdates[field] = body[field]
      }
    })

    const updatedUser = await UserService.updateUser(userId, filteredUpdates)

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedUser,
    })
  } catch (error) {
    return handleError(error)
  }
})
