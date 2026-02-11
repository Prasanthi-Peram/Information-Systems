'use client'

import Image from 'next/image'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Button  from '@/components/ui/Button'
import {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormError,
} from '@/components/ui/Form'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { signUp, ActionResponse } from '@/app/actions/auth'

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
}

export default function SignUpPage() {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState<
    ActionResponse,
    FormData
  >(async (_prevState, formData) => {
    try {
      const result = await signUp(formData)

      if (result.success) {
        toast.success('Account created successfully')
        router.push('/dashboard')
      }

      return result
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || 'An error occurred',
        errors: undefined,
      }
    }
  }, initialState)

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#121212] bg-[url(/bg3.jpeg)] bg-cover bg-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
          Sign up for an account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Form action={formAction} className="space-y-6">
          {state?.message && !state.success && (
            <FormError>{state.message}</FormError>
          )}

          <FormGroup>
            <FormLabel className="font-mono" htmlFor="email">
              Email
            </FormLabel>
            <FormInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              className={[
                'font-mono',
                state?.errors?.email ? 'border-red-500' : '',
              ].join(' ')}
            />
            {state?.errors?.email && (
              <p className="text-sm text-red-500">
                {state.errors.email[0]}
              </p>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel className="font-mono" htmlFor="username">
              Username
            </FormLabel>
            <FormInput
              id="username"
              name="username"
              type="text"
              required
              disabled={isPending}
              className={[
                'font-mono',
                state?.errors?.username ? 'border-red-500' : '',
              ].join(' ')}
            />
            {state?.errors?.username && (
              <p className="text-sm text-red-500">
                {state.errors.username[0]}
              </p>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel className="font-mono" htmlFor="password">
              Password
            </FormLabel>
            <FormInput
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={isPending}
              className={state?.errors?.password ? 'border-red-500' : ''}
            />
            {state?.errors?.password && (
              <p className="text-sm text-red-500">
                {state.errors.password[0]}
              </p>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel className="font-mono" htmlFor="confirmPassword">
              Confirm Password
            </FormLabel>
            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              disabled={isPending}
              className={state?.errors?.confirmPassword ? 'border-red-500' : ''}
            />
            {state?.errors?.confirmPassword && (
              <p className="text-sm text-red-500">
                {state.errors.confirmPassword[0]}
              </p>
            )}
          </FormGroup>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full font-mono bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white"
          >
            {isPending ? 'Creating account…' : 'Sign up'}
          </Button>
        </Form>

        <div className="bg-white dark:bg-[#1A1A1A] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-dark-border-subtle mt-6">
          <p className="font-mono text-sm text-center text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/signin"
              className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}