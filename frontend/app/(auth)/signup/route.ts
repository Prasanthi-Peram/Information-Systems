import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import * as jose from 'jose'
import { createUser, getUserByEmail } from '@/lib/auth'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
)

const JWT_EXPIRATION = '7d'

interface SignUpBody {
  email: string
  password: string
  confirmPassword: string
  username: string
  role: 'administrator' | 'technician'
  campusId?: string
  avatar?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignUpBody = await request.json()

    const { email, password, confirmPassword, username, role, campusId, avatar } = body

    // Validate input
    if (!email || !password || !confirmPassword || !username || !role) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (role === 'administrator' && !campusId) {
      return NextResponse.json(
        { error: 'Campus ID is required for administrators' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      )
    }

    // Create new user
    const newUser = await createUser(email, password, username, role, campusId || null, avatar || null)

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = await jose.SignJWT({
      userId: newUser.id,
      email: newUser.email,
      role: role,
      campusId: campusId || null,
      name: username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET)

    // Set auth cookie
    const response = NextResponse.json(
      {
        status: 'success',
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: username,
          role: role,
          campusId: campusId || null,
          avatar: avatar || null,
        },
        token,
      },
      { status: 201 }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
