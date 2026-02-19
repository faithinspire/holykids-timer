'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestFixPage() {
  const searchParams = useSearchParams()
  const [staffId, setStaffId] = useState<string | null>(null)
  const [staffData, setStaffData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('staff_id')
    setStaffId(id)

    if (id) {
      loadStaff(id)
    }
  }, [searchParams])

  const loadStaff = async (id: string) => {
    try {
      const response = await fetch('/api/staff')
      const data = await response.json()
      
      console.log('All staff:', data.staff)
      console.log('Looking for ID:', id)
      
      const staff = data.staff?.find((s: any) => s.id === id)
      
      if (staff) {
        setStaffData(staff)
        setError(null)
      } else {
        setError('Staff not found in list')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Diagnostic Test Page</h1>
        
        <div className="space-y-4">
          <div>
            <p className="font-semibold">Staff ID from URL:</p>
            <p className="text-sm bg-gray-100 p-2 rounded">{staffId || 'None'}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-semibold">❌ Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {staffData && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800 font-semibold">✅ Staff Found:</p>
              <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(staffData, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="font-semibold mb-2">Test Instructions:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Go to Admin → Staff Management</li>
              <li>Copy a staff member's ID from the list</li>
              <li>Visit: /test-fix?staff_id=PASTE_ID_HERE</li>
              <li>Check if staff is found</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="font-semibold">Code Version Check:</p>
            <p className="text-sm">Build Time: {new Date().toISOString()}</p>
            <p className="text-sm">Fix Version: 2.0 (URL Parameter Loading)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
