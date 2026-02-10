'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function BiometricSetupPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<any>(null)
  const [enrolling, setEnrolling] = useState(false)

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
    
    try {
      // Check if device supports biometric
      if (!window.PublicKeyCredential) {
        toast.error('Biometric authentication not supported on this device')
        setEnrolling(false)
        return
      }

      // Simple biometric check - just verify the device can do biometric auth
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      
      if (!available) {
        toast.error('No fingerprint sensor detected on this device')
        setEnrolling(false)
        return
      }

      // Generate a unique biometric ID for this staff member
      const biometricId = `holykids_${staff.staff_id}_${Date.now()}`
      
      // Create a simple credential with fingerprint
      const publicKeyOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: 'HOLYKIDS',
          id: window.location.hostname
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: staff.staff_id,
          displayName: `${staff.first_name} ${staff.last_name}`
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' as const },
          { alg: -257, type: 'public-key' as const }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform' as const,
          requireResidentKey: false,
          userVerification: 'required' as const
        },
        timeout: 60000,
        attestation: 'none' as const
      }

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential

      if (credential) {
        // Save biometric enrollment to localStorage
        const staffData = localStorage.getItem('holykids_staff')
        if (staffData) {
          const staffList = JSON.parse(staffData)
          const updatedList = staffList.map((s: any) => 
            s.id === staff.id 
              ? { 
                  ...s, 
                  biometric_enrolled: true, 
                  biometric_id: credential.id,
                  biometric_raw_id: Array.from(new Uint8Array(credential.rawId))
                }
              : s
          )
          localStorage.setItem('holykids_staff', JSON.stringify(updatedList))
        }

        toast.success('✅ Fingerprint enrolled successfully!')
        setTimeout(() => {
          window.location.href = '/admin/staff'
        }, 1500)
      }
    } catch (error: any) {
      console.error('Biometric enrollment error:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Fingerprint enrollment cancelled')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Fingerprint not supported on this device')
      } else {
        toast.error('Fingerprint enrollment failed. Please try again.')
      }
    } finally {
      setEnrolling(false)
    }
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => window.location.href = '/admin/staff'} className="text-white hover:bg-white/10 p-2 rounded-lg">
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Biometric Setup</h1>
                <p className="text-white/80 text-xs">Enroll Fingerprint</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👆</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {staff.first_name} {staff.last_name}
            </h2>
            <p className="text-sm text-gray-500">Staff ID: {staff.staff_id}</p>
            <p className="text-sm text-gray-500">{staff.department}</p>
          </div>

          {staff.biometric_enrolled ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-700 text-center">
                ✅ Fingerprint already enrolled
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-700 text-sm text-center">
                Click the button below to enroll your fingerprint for quick check-in
              </p>
            </div>
          )}

          <button
            onClick={handleEnrollFingerprint}
            disabled={enrolling || staff.biometric_enrolled}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrolling ? 'Enrolling...' : staff.biometric_enrolled ? 'Already Enrolled' : 'Enroll Fingerprint'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your fingerprint data is stored securely on your device only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
