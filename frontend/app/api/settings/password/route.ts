import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { withAuth, handleError } from '@/server/middleware/auth'
import { pool } from '@/lib/db'

interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const userId = (request as any).userId
    const body: PasswordChangeRequest = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'No user ID found in token' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword, confirmPassword } = body

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All password fields are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Get user by id
    const result = await pool.query(
      `SELECT password FROM users WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password.toString()
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await pool.query(
      `UPDATE users SET password = $1, updated_at = now() WHERE id = $2`,
      [hashedPassword, userId]
    )

    return NextResponse.json({
      status: 'success',
      message: 'Password changed successfully',
    })
  } catch (error) {
    return handleError(error)
  }
})
