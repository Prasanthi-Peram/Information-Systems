"use server"
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import * as jose from 'jose'
import { cache } from 'react'
import { pool } from './db'

// JWT types
interface JWTPayload {
  userId: string
  [key: string]: string | number | boolean | null | undefined
}


const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
)

// JWT expiration time
const JWT_EXPIRATION = '7d' // 7 days

// Token refresh threshold (refresh if less than this time left)
const REFRESH_THRESHOLD = 24 * 60 * 60 // 24 hours in seconds

// Hash a password
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  plain: string,
  stored: Uint8Array | string
) {
  const hashString = (() => {
    if (Buffer.isBuffer(stored)) return stored.toString('utf8')

    const s = String(stored)

    if (s.startsWith('\\x')) {
      return Buffer.from(s.slice(2), 'hex').toString('utf8')
    }
    return s
  })()

  return bcrypt.compare(plain, hashString)
}

type DbUser = {
  id: string
  email: string
  password: Uint8Array | string
  name?: string | null
  avatar?: string | null
  role?: string | null
  campus_id?: string | null
  created_at?: string
}


// Get user by email
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const result = await pool.query(
      `SELECT id, email, password, name, avatar, role, campus_id, created_at 
       FROM users WHERE email = $1`,
      [email]
    )
    return result.rows[0] as DbUser | null
  } catch (error) {
    console.error('Database error in getUserByEmail:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error(error instanceof Error ? error.message : 'Database error')
  }
}


// Create a new user
export async function createUser(
  email: string,
  password: string,
  username: string,
  role: string,
  campusId: string | null = null,
  avatar: string | null = null
): Promise<{ id: string; email: string } | null> {
  try {
    const hashedPassword = await hashPassword(password)
    const nowIso = new Date().toISOString()
    const id = crypto.randomUUID()

    let result
    try {
      result = await pool.query(
        `INSERT INTO users (id, email, password, name, avatar, role, campus_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email`,
        [id, email, hashedPassword, username, avatar, role, campusId, nowIso]
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes('column')) {
        if (error.message.includes('role')) {
          console.error('Role column does not exist in database. Please run: ALTER TABLE users ADD COLUMN role VARCHAR(20);')
          throw new Error('Database schema error: role column is missing. Please add the role column to the users table.')
        } else if (error.message.includes('campus_id')) {
          console.error('Campus ID column does not exist in database. Please run: ALTER TABLE users ADD COLUMN campus_id VARCHAR(50);')
          throw new Error('Database schema error: campus_id column is missing. Please add the campus_id column to the users table.')
        }
        throw error
      } else {
        throw error
      }
    }

    return result.rows[0] as { id: string; email: string } | null
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

// Generate a JWT token
export async function generateJWT(payload: JWTPayload) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET)
}

// Verify a JWT token
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}



// Check if token needs refresh
export async function shouldRefreshToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      clockTolerance: 15, // 15 seconds tolerance for clock skew
    })

    // Get expiration time
    const exp = payload.exp as number
    const now = Math.floor(Date.now() / 1000)

    // If token expires within the threshold, refresh it
    return exp - now < REFRESH_THRESHOLD
  } catch {
    // If verification fails, token is invalid or expired
    return false
  }
}

// Create a session using JWT
export async function createSession(userId: string) {
  try {
    // Create JWT with user data
    const token = await generateJWT({ userId })

    // Store JWT in a cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    })

    return true
  } catch (error) {
    console.error('Error creating session:', error)
    return false
  }
}

// Get current session from JWT
export const getSession = cache(async () => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) return null
    const payload = await verifyJWT(token)

    return payload ? { userId: payload.userId } : null
  } catch (error) {
    // Handle the specific prerendering error
    if (
      error instanceof Error &&
      error.message.includes('During prerendering, `cookies()` rejects')
    ) {
      console.log(
        'Cookies not available during prerendering, returning null session'
      )
      return null
    }

    console.error('Error getting session:', error)
    return null
  }
})

// Delete session by clearing the JWT cookie
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}