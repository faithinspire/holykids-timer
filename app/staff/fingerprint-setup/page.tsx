'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function FingerprintSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [staff, setStaff] = useState<any>(null)

  useEffect(() => {
    const staffId = searchParams.get('staff_id')
    if (!staffId) {
      toast.error('No staff ID provided')
      router.push('/admin/staff')
      return
    }

    loadStaff(staffId)
  }, [searchParams])

  const loadStaff = async (staffId: string) => {
    try {
      const response = await fetch('/api/staff')
      const data = await response.json()

      if (!data.staff) {
        throw new Error('Failed to load staff')
      }

      const staffMember = data.staff.find((s: any) => s.id === staffId)
      if (!staffMember) {
        throw new Error('Staff not found')
      }

      setStaff(staffMember)
    } catch (error: any) {
      toast.error(error.message)
      router.push('/admin/staff')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterFingerprint = async () => {
    if (!staff) return

    // Check WebAuthn support
    if (!window.PublicKeyCredential) {
      toast.error('Fingerprint authentication not supported on this device')
      return
    }

    setRegistering(true)

    try {
      // Get registration options from server
      const optionsResponse = await fetch('/api/staff/fingerprint/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staff.id })
      })

      const options = await optionsResponse.json()

      if (!optionsResponse.ok) {
        throw new Error(options.error || 'Failed to get registration options')
      }

      // Convert challenge and user ID from base64
      const challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0))
      const userId = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0))

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: options.rp.name,
            id: options.rp.id
          },
          user: {
            id: userId,
            name: options.user.name,
            displayName: options.user.displayName
          },
          pubKeyCredParams: options.pubKeyCredParams,
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Fingerprint registration cancelled')
      }

      // Send credential to server
      const response = credential.response as AuthenticatorAttestationResponse
      const registerResponse = await fetch('/api/staff/fingerprint/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          public_key: btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!))),
          attestation_object: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
          client_data: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON)))
        })
      })

      const result = await registerResponse.json()

      if (!registerResponse.ok || !result.success) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('✅ Fingerprint registered successfully!')
      setTimeout(() => router.push('/admin/staff'), 2000)

    } catch (error: any) {
      console.error('Fingerprint registration error:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error('Fingerprint registration cancelled')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Fingerprint not supported on this device')
      } else {
        toast.error(error.message || 'Registration failed')
      }
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Staff Not Found</h2>
          <button
            onClick={() => router.push('/admin/staff')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Staff
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">👆</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Fingerprint Setup</h1>
            <p className="text-gray-600">Register your device fingerprint for quick clock-in</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {staff.first_name[0]}{staff.last_name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {staff.first_name} {staff.last_name}
                </h2>
                <p className="text-gray-600">{staff.staff_id}</p>
                <p className="text-sm text-gray-500">{staff.department}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-bold text-yellow-800 mb-2">📱 How it works:</h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Your device will prompt you to use your fingerprint sensor</li>
                <li>This registers your device's biometric authentication</li>
                <li>No actual fingerprint data is stored - only a secure credential</li>
                <li>You'll use this with your PIN to clock in/out</li>
              </ul>
            </div>

            <button
              onClick={handleRegisterFingerprint}
              disabled={registering}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-xl font-bold text-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 shadow-lg transition-all"
            >
              {registering ? (
                <span className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registering...</span>
                </span>
              ) : (
                '👆 Register Fingerprint'
              )}
            </button>

            <button
              onClick={() => router.push('/admin/staff')}
              disabled={registering}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
