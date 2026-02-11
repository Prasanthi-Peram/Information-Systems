'use client'

import Image from "next/image"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function SelectRolePage() {
  const router = useRouter()

  const handleRoleSelection = (role: 'administrator' | 'technician') => {
    router.push(`/signin?role=${role}`)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#121212] bg-[url(/bg3.jpeg)] bg-cover bg-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
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
          Select Your Domain
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1A1A1A] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-dark-border-subtle space-y-4">
          <Button
            onClick={() => handleRoleSelection('administrator')}
            className="w-full font-mono bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white py-6 text-lg"
          >
            Administrator
          </Button>
          
          <Button
            onClick={() => handleRoleSelection('technician')}
            className="w-full font-mono bg-green-700 hover:bg-green-600 active:bg-green-800 text-white py-6 text-lg"
          >
            Technician
          </Button>
        </div>
      </div>
    </div>
  )
}
