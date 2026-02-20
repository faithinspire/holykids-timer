'use client'

import { useState } from 'react'

export default function TestStaffAPI() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [staffResult, setStaffResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDiagnostic = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/diagnostic')
      const data = await response.json()
      setDiagnosticResult(data)
    } catch (error: any) {
      setDiagnosticResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testStaffAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/staff')
      const data = await response.json()
      setStaffResult(data)
    } catch (error: any) {
      setStaffResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Staff API Test Page</h1>

        <div className="space-y-6">
          {/* Diagnostic Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">1. Test Diagnostic Endpoint</h2>
            <button
              onClick={testDiagnostic}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test /api/diagnostic
            </button>
            
            {diagnosticResult && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(diagnosticResult, null, 2)}
                </pre>
                
                {diagnosticResult.database?.connected && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800 font-bold">✅ Database Connected</p>
                    <p className="text-green-700">Staff Count: {diagnosticResult.database.staffCount}</p>
                  </div>
                )}
                
                {diagnosticResult.database?.connected === false && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-bold">❌ Database Not Connected</p>
                    <p className="text-red-700">Error: {diagnosticResult.database.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staff API Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">2. Test Staff API</h2>
            <button
              onClick={testStaffAPI}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Test /api/staff
            </button>
            
            {staffResult && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(staffResult, null, 2)}
                </pre>
                
                {staffResult.staff && staffResult.staff.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800 font-bold">✅ Staff API Working</p>
                    <p className="text-green-700">Found {staffResult.staff.length} staff members</p>
                  </div>
                )}
                
                {staffResult.staff && staffResult.staff.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-bold">⚠️ No Staff Found</p>
                    <p className="text-yellow-700">Staff table is empty. Add staff members in Supabase.</p>
                  </div>
                )}
                
                {staffResult.error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-bold">❌ API Error</p>
                    <p className="text-red-700">{staffResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📋 Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click "Test /api/diagnostic" to check database connection</li>
              <li>Click "Test /api/staff" to check if staff data loads</li>
              <li>Check the results above for any errors</li>
              <li>If database not connected, check environment variables on Render</li>
              <li>If no staff found, add staff in Supabase or via admin UI</li>
            </ol>
          </div>

          {/* Environment Info */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">🔧 Environment Check</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold">Supabase URL:</span>{' '}
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL 
                    ? `✅ ${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
                    : '❌ Not set'}
                </span>
              </p>
              <p>
                <span className="font-bold">Supabase Key:</span>{' '}
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                    ? `✅ Set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...)` 
                    : '❌ Not set'}
                </span>
              </p>
              
              {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 font-bold">❌ Environment Variables Missing</p>
                  <p className="text-red-700 text-xs mt-2">
                    Add these to your Render environment settings:
                  </p>
                  <ul className="text-red-700 text-xs mt-2 list-disc list-inside">
                    <li>NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
