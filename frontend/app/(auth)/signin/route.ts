import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import * as jose from 'jose'
import { getUserByEmail, createUser } from '@/lib/auth'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
)

const JWT_EXPIRATION = '7d'

interface SignInBody {
  email: string
  password: string
  role: 'administrator' | 'technician'
  campusId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignInBody = await request.json()

    const { email, password, role, campusId } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate campus ID for administrators
    if (role === 'administrator' && !campusId) {
      return NextResponse.json(
        { error: 'Campus ID is required for administrators' },
        { status: 400 }
      )
    }

    // Get user by email
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password.toString()
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check role matches
    if (user.role !== role) {
      return NextResponse.json(
        { error: 'Role does not match user account' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = await jose.SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      campusId: user.campus_id,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET)

    // Set auth cookie
    const response = NextResponse.json(
      {
        status: 'success',
        message: 'Signed in successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          campusId: user.campus_id,
          avatar: user.avatar,
        },
        token,
      },
      { status: 200 }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
