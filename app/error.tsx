'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl font-bold text-red-300 mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h1>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
          <div className="text-sm text-gray-500">
            <p>Error ID: {error.digest}</p>
            <p>Contact your system administrator if this continues</p>
          </div>
        </div>
      </div>
    </div>
  )
}