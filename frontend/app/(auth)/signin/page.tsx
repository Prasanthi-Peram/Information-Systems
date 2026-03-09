'use client'

import Image from "next/image"
import { useActionState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormError,
} from '@/components/ui/Form'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { signIn, ActionResponse } from '@/app/actions/auth'
import { ArrowLeft } from 'lucide-react'

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') as 'administrator' | 'technician' | null
  const [role, setRole] = useState<'administrator' | 'technician' | null>(roleParam)

  useEffect(() => {
    if (roleParam) {
      setRole(roleParam)
    } else {
      setRole('administrator') // Default to administrator if no role param
    }
  }, [roleParam])

   // Use useActionState hook for the form submission action
   const [state, formAction, isPending] = useActionState<
   ActionResponse,
   FormData
 >(async (prevState: ActionResponse, formData: FormData) => {
   try {
     const result = await signIn(formData)

     // Handle successful submission
     if (result.success) {
       toast.success('Signed in successfully')
       // Use smooth client-side navigation instead of full page reload
       setTimeout(() => {
         router.push('/dashboard')
       }, 500)
       return result
     }

     return result
   } catch (err) {
     console.error('Sign in form error:', err)
     return {
       success: false,
       message: (err as Error).message || 'An error occurred',
       errors: undefined,
     }
   }
 }, initialState)

  if (!role) {
    return null // Will redirect to select-role
  }

  const isAdministrator = role === 'administrator'

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#121212] bg-[url(/bg3.jpeg)]  bg-cover bg-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/select-role')}
            className="font-mono text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex justify-center">
          <Image
            src="/header1.png"
            alt="Smart AC Manager"
            width={400}
            height={150}
            className="rounded-lg object-cover"
            priority
          />
        </div>
        <h2 className="mt-2 font-mono text-center text-xl font-medium text-gray-700 dark:text-white">
          Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1A1A1A] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-dark-border-subtle">
          <Form action={formAction} className="space-y-6">
            {state?.message && !state.success && (
              <FormError>{state.message}</FormError>
            )}

            <input type="hidden" name="role" value={role} />

            {isAdministrator && (
              <FormGroup>
                <FormLabel className="font-mono" htmlFor="campusId">Campus ID</FormLabel>
                <FormInput
                  id="campusId"
                  name="campusId"
                  type="text"
                  required
                  disabled={isPending}
                  aria-describedby="campusId-error"
                  className={state?.errors?.campusId ? 'border-red-500' : ''}
                  placeholder="Enter your campus ID"
                />
                {state?.errors?.campusId && (
                  <p id="campusId-error" className="text-sm text-red-500">
                    {state.errors.campusId[0]}
                  </p>
                )}
              </FormGroup>
            )}

            <FormGroup>
              <FormLabel className="font-mono" htmlFor="email">Email</FormLabel>
              <FormInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                aria-describedby="email-error"
                className={state?.errors?.email ? 'border-red-500' : ''}
              />
              {state?.errors?.email && (
                <p id="email-error" className="text-sm text-red-500">
                  {state.errors.email[0]}
                </p>
              )}
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="password" className='font-mono'>Password</FormLabel>
              <FormInput
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
                aria-describedby="password-error"
                className={state?.errors?.password ? 'border-red-500' : ''}
              />
              {state?.errors?.password && (
                <p id="password-error" className="text-sm text-red-500">
                  {state.errors.password[0]}
                </p>
              )}
            </FormGroup>

            <div>
              <Button type="submit" className="w-full font-mono bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white" isLoading={isPending}>
                Sign in
              </Button>
            </div>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              Don&apos;t have an account?{' '}
              <Link 
                href={`/signup?role=${role}`}
                className="font-mono font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}