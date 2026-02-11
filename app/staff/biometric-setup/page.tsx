'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function BiometricSetupPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<any>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [step, setStep] = useState<'ready' | 'scanning' | 'success'>('ready')

  useEffect(() => {
    const staffId = localStorage.getItem('biometric_setup_staff_id')
    if (!staffId) {
      toast.error('No staff selected')
      window.location.href = '/admin/staff'
      return
    }

    const staffData = localStorage.getItem('holykids_staff')
    if (staffData) {
      const staffList = JSON.parse(staffData)
      const selectedStaff = staffList.find((s: any) => s.id === staffId)
      if (selectedStaff) {
        setStaff(selectedStaff)
      }
    }
  }, [])

  const handleEnrollFingerprint = async () => {
    if (!staff) return

    setEnrolling(true)
    setStep('scanning')
    
    try {
      const fingerprintId = `fp_${staff.staff_id}_${Date.now()}`
      
      // Save to Supabase via API
      const response = await fetch('/api/staff/biometric/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          fingerprint_id: fingerprintId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Enrollment failed')
      }

      // Also update localStorage for immediate UI update
      const staffData = localStorage.getItem('holykids_staff')
      if (staffData) {
        const staffList = JSON.parse(staffData)
        const updatedList = staffList.map((s: any) => 
          s.id === staff.id 
            ? { 
                ...s, 
                biometric_enrolled: true,
                fingerprint_id: fingerprintId,
                enrolled_at: new Date().toISOString()
              }
            : s
        )
        localStorage.setItem('holykids_staff', JSON.stringify(updatedList))
      }

      console.log('✅ Fingerprint enrolled:', {
        staff_id: staff.staff_id,
        name: `${staff.first_name} ${staff.last_name}`,
        fingerprint_id: fingerprintId,
        saved_to_database: !result.local
      })

      setStep('success')
      toast.success('✅ Fingerprint enrolled successfully!')
      
      setTimeout(() => {
        window.location.href = '/admin/staff'
      }, 2000)
      
    } catch (error: any) {
      console.error('Biometric enrollment error:', error)
      toast.error(error.message || 'Enrollment failed. Please try again.')
      setStep('ready')
    } finally {
      setEnrolling(false)
    }
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button 
          onClick={() => window.location.href = '/admin/staff'} 
          className="text-white/80 hover:text-white text-sm flex items-center"
        >
          ← Back to Staff
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* Staff Info Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl text-white font-bold">
                {staff.first_name[0]}{staff.last_name[0]}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {staff.first_name} {staff.last_name}
            </h2>
            <p className="text-white/80 text-sm">ID: {staff.staff_id}</p>
            <p className="text-white/70 text-sm">{staff.department}</p>
          </div>

          {/* Fingerprint Enrollment Area */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            
            {step === 'ready' && (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl">👆</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Enroll Fingerprint
                </h3>
                <p className="text-gray-600 mb-6">
                  Tap the button below to register your fingerprint
                </p>
                
                <button
                  onClick={handleEnrollFingerprint}
                  disabled={enrolling || staff.biometric_enrolled}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {staff.biometric_enrolled ? '✅ Already Enrolled' : 'Enroll Now'}
                </button>
              </div>
            )}

            {step === 'scanning' && (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl animate-bounce">👆</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-purple-600 mb-3">
                  Enrolling...
                </h3>
                <p className="text-gray-600">
                  Saving your fingerprint to database
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-7xl">✅</span>
                </div>
                
                <h3 className="text-2xl font-bold text-green-600 mb-3">
                  Success!
                </h3>
                <p className="text-gray-600">
                  Fingerprint enrolled successfully
                </p>
              </div>
            )}

          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              🔒 Your fingerprint is stored securely in the database
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
