'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ClockInPage() {
  const router = useRouter()
  const [method, setMethod] = useState<'pin' | 'fingerprint' | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePinClockIn = async () => {
    if (!pin.trim() || pin.length < 4) {
      toast.error('Please enter valid PIN (4-6 digits)')
      return
    }

    setLoading(true)

    try {
      // Hash PIN
      const encoder = new TextEncoder()
      const data = encoder.encode(pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Verify PIN and clock in
      const response = await fetch('/api/attendance/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin_hash: pinHash
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid PIN')
      }

      // Clock in with PIN
      const clockInResponse = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: result.staff_id,
          method: 'pin'
        })
      })

      const clockInResult = await clockInResponse.json()

      if (!clockInResponse.ok || !clockInResult.success) {
        throw new Error(clockInResult.error || 'Clock-in failed')
      }

      toast.success(`✅ Clocked in successfully, ${result.staff_name}!`)
      setPin('')
      
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('PIN clock-in error:', error)
      toast.error(error.message || 'Clock-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFingerprintClockIn = async () => {
    setLoading(true)

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('Fingerprint authentication not supported on this device')
      }

      // Get all staff with fingerprints for authentication
      const challengeResponse = await fetch('/api/attendance/fingerprint-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all_staff: true })
      })

      const challengeData = await challengeResponse.json()

      if (!challengeResponse.ok) {
        throw new Error(challengeData.error || 'Failed to get challenge')
      }

      // Convert challenge from base64
      const challenge = Uint8Array.from(atob(challengeData.challenge), c => c.charCodeAt(0))

      // Request fingerprint authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: challengeData.credentials.map((cred: any) => ({
            type: 'public-key',
            id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0))
          }))
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Fingerprint verification cancelled')
      }

      // Send credential to server for verification and clock-in
      const response = credential.response as AuthenticatorAssertionResponse
      const clockInResponse = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          authenticator_data: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
          client_data: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          method: 'fingerprint'
        })
      })

      const clockInResult = await clockInResponse.json()

      if (!clockInResponse.ok || !clockInResult.success) {
        throw new Error(clockInResult.error || 'Clock-in failed')
      }

      toast.success('✅ Clocked in successfully!')
      
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('Fingerprint clock-in error:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error('Fingerprint verification cancelled or failed')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Fingerprint not supported on this device')
      } else {
        toast.error(error.message || 'Clock-in failed')
      }
    } finally {
      setLoading(false)
    }
  }



  if (!method) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🕐</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Clock In</h1>
              <p className="text-gray-600">Choose your authentication method</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setMethod('pin')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 rounded-xl font-bold text-xl hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all flex items-center justify-center space-x-3"
              >
                <span className="text-3xl">🔐</span>
                <span>Clock In with PIN</span>
              </button>

              <button
                onClick={() => setMethod('fingerprint')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-6 rounded-xl font-bold text-xl hover:from-purple-700 hover:to-purple-800 shadow-lg transition-all flex items-center justify-center space-x-3"
              >
                <span className="text-3xl">👆</span>
                <span>Clock In with Fingerprint</span>
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (method === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔐</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">PIN Clock In</h1>
              <p className="text-gray-600">Enter your personal PIN</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-2xl text-center tracking-widest"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                onClick={handlePinClockIn}
                disabled={loading || !pin}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Clocking In...</span>
                  </span>
                ) : (
                  '✓ Clock In'
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setMethod(null)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                  disabled={loading}
                >
                  ← Choose Different Method
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (method === 'fingerprint') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👆</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Fingerprint Clock In</h1>
              <p className="text-gray-600">Use your device fingerprint sensor</p>
            </div>

            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800 text-center">
                  Click the button below and follow your device's fingerprint prompt
                </p>
              </div>

              <button
                onClick={handleFingerprintClockIn}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-6 rounded-xl font-bold text-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 shadow-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </span>
                ) : (
                  '👆 Scan Fingerprint'
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setMethod(null)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                  disabled={loading}
                >
                  ← Choose Different Method
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
