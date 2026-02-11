import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
)

export interface AuthenticatedRequest extends NextRequest {
  userId?: string
  userRole?: string
  userEmail?: string
}

export async function verifyAuth(request: NextRequest): Promise<{
  isValid: boolean
  userId?: string
  role?: string
  email?: string
  error?: string
}> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return { isValid: false, error: 'No token provided' }
    }

    const verified = await jose.jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as any

    return {
      isValid: true,
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    }
  }
}

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await verifyAuth(request)

    if (!auth.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: auth.error },
        { status: 401 }
      )
    }

    const req = request as AuthenticatedRequest
    req.userId = auth.userId
    req.userRole = auth.role
    req.userEmail = auth.email

    return handler(req)
  }
}

export function handleError(error: any) {
  console.error('API Error:', error)

  if (error instanceof Error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal Server Error', message: 'An unexpected error occurred' },
    { status: 500 }
  )
}
