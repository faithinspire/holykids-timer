'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BypassPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    // Create admin session without Supabase
    const adminData = {
      id: 'bypass-admin-0000',
      email: 'admin@timeattendance.edu',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'Super Admin',
      department: 'Administration',
      staff_id: 'ADMIN001',
      is_active: true,
      date_joined: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Store in localStorage for persistence
    localStorage.setItem('bypass_admin', JSON.stringify(adminData))
    localStorage.setItem('bypass_mode', 'true')

    // Set cookie
    document.cookie = 'bypass_mode=true; path=/; max-age=86400'
    document.cookie = 'bypass_admin=1; path=/; max-age=86400'

    setStatus('✅ Session created! Redirecting...')

    // Redirect to admin dashboard
    setTimeout(() => {
      router.push('/admin/dashboard')
    }, 1500)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Bypass</h1>
        <p className="text-gray-600">{status}</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Logging in as: admin@timeattendance.edu</p>
        </div>
      </div>
    </div>
  )
}
