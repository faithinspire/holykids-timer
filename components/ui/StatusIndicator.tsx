'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function StatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [message, setMessage] = useState('Checking...')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      // Check environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setStatus('error')
        setMessage('Environment not configured')
        return
      }

      // Check API
      const response = await fetch('/api/diagnostic')
      const data = await response.json()

      if (data.database?.connected) {
        setStatus('ok')
        setMessage(`Connected (${data.database.staffCount} staff)`)
      } else {
        setStatus('error')
        setMessage('Database not connected')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Connection failed')
    }
  }

  if (status === 'checking') {
    return null // Don't show while checking
  }

  if (status === 'ok') {
    return null // Don't show if everything is OK
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
        <div className="flex items-center justify-center space-x-3">
          <span>⚠️ {message}</span>
          <Link 
            href="/troubleshoot"
            className="underline font-bold hover:text-red-100"
          >
            Fix Now
          </Link>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="underline hover:text-red-100"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
        
        {showDetails && (
          <div className="mt-2 text-xs bg-red-700 p-2 rounded max-w-2xl mx-auto">
            <p className="mb-1">The app is not properly configured.</p>
            <p>Click "Fix Now" for step-by-step instructions.</p>
          </div>
        )}
      </div>
    </div>
  )
}
