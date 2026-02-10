'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/auth/login'
      } else {
        window.location.href = '/admin/dashboard'
      }
    }
  }, [user, loading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  )
}