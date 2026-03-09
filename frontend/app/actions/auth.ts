'use server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

import {getUserByEmail,verifyPassword, createSession,createUser,deleteSession} from '@/lib/auth'
import { redirect } from 'next/navigation'

// Zod schema for signin validation
const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['administrator', 'technician'], {
    message: 'Please select a role',
  }),
  campusId: z.string().optional(),
}).refine((data) => {
  // Campus ID is required only for administrators
  if (data.role === 'administrator') {
    return data.campusId && data.campusId.trim().length > 0
  }
  return true
}, {
  message: 'Campus ID is required for administrators',
  path: ['campusId'],
})

// Zod schema for signup validation
const SignUpSchema = z
  .object({

    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    username: z.string().min(1, 'Username is required'),
    role: z.enum(['administrator', 'technician'], {
      message: 'Please select a role',
    }),
    campusId: z.string().optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => {
    // Campus ID is required only for administrators
    if (data.role === 'administrator') {
      return data.campusId && data.campusId.trim().length > 0
    }
    return true
  }, {
    message: 'Campus ID is required for administrators',
    path: ['campusId'],
  })

export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}

// Sign In function
export async function signIn(formData: FormData): Promise<ActionResponse> {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as string,
      campusId: formData.get('campusId') as string | undefined,
    }

    // Validate input using Zod
    const validationResult = SignInSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    // Mock authentication for testing without database
    const mockUsers = {
      'admin@acmanager.com': {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@acmanager.com',
        password: 'admin',
        role: 'administrator',
        campusId: 'CAMPUS001'
      },
      'tech@acmanager.com': {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'tech@acmanager.com',
        password: 'tech',
        role: 'technician',
        campusId: null
      }
    }
    const mockUser = mockUsers[data.email as keyof typeof mockUsers]
    
    if (!mockUser) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: {
          email: ['Invalid email or password'],
        },
      }
    }

    // Verify password
    if (mockUser.password !== data.password) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: {
          email: ['Invalid email or password'],
        },
      }
    }

    // Verify role matches
    if (mockUser.role !== data.role) {
      return {
        success: false,
        message: 'Invalid role for this account',
        errors: {
          role: ['Invalid role for this account'],
        },
      }
    }
    
    // Verify campus ID for administrators
    if (data.role === 'administrator' && data.campusId !== mockUser.campusId) {
      return {
        success: false,
        message: 'Invalid campus ID',
        errors: {
          campusId: ['Invalid campus ID'],
        },
      }
    }

    // Create mock session
    const sessionCreated = await createSession(mockUser.id)
    if (!sessionCreated) {
      console.error('Failed to create session for user:', mockUser.id)
      return {
        success: false,
        message: 'Failed to create session. Please try again.',
        error: 'Session creation failed',
      }
    }

    return {
      success: true,
      message: 'Signed in successfully',
    }
  } catch (error) {
    console.error('Sign in error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      message: `An error occurred while signing in: ${errorMessage}`,
      error: errorMessage,
    }
  }
}

// Sign Up function
export async function signUp(formData: FormData): Promise<ActionResponse> {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      username: formData.get('username') as string,
      role: formData.get('role') as string,
      campusId: formData.get('campusId') as string | undefined,
      avatar: formData.get('avatar') as string || null,
    }

    // Validate input using Zod
    const validationResult = SignUpSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    const existingUser = await getUserByEmail(data.email)
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists',
        errors: {
          email: ['User with this email already exists'],
        },
      }
    }

    const user = await createUser(
      data.email, 
      data.password, 
      data.username, 
      data.role, 
      data.campusId || null,
      data.avatar?? null
    )
    if (!user) {
      return {
        success: false,
        message: 'Failed to create user',
        error: 'Failed to create user',
      }
    }

    // Create session for the newly registered user
    await createSession(user.id)

    return {
      success: true,
      message: 'Account created successfully',
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      message: 'An error occurred while creating your account',
      error: 'Failed to create account',
    }
  }
}

// Sign Out function
export async function signOut(): Promise<void> {
  try {
    await deleteSession()
  } catch (error) {
    console.error('Sign out error:', error)
    throw new Error('Failed to sign out')
  } finally {
    redirect('/') // Redirect to landing page after signing out
  }
}

// Client-side sign out action for use in client components
export async function signOutAction() {
  'use server'
  try {
    await deleteSession()
  } catch (error) {
    console.error('Sign out error:', error)
    throw new Error('Failed to sign out')
  } finally {
    redirect('/') // Redirect to landing page after signing out
  }
}