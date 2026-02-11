'use client'

import Image from "next/image"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const router = useRouter()

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
        <h2 className="mt-8 font-mono text-center text-2xl font-medium text-gray-700 dark:text-white">
          Welcome to Smart AC Manager
        </h2>
        <div className="mt-12 flex justify-center">
          <Button 
            onClick={() => router.push('/select-role')}
            className="font-mono bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white px-8 py-6 text-lg"
          >
            Enter Portal
          </Button>
        </div>
      </div>
    </div>
  )
}
