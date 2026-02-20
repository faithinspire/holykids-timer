'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ClockInPage() {
  const router = useRouter()
  const [staffNumber, setStaffNumber] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const handlePinVerification = async () => {
    if (!staffNumber.trim()) {
      toast.error('Please enter staff number')
      return
    }

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

      // Verify PIN
      const response = await fetch('/api/attendance/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_number: staffNumber,
          pin_hash: pinHash
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid staff number or PIN')
      }

      // PIN verified, now prompt for fingerprint
      await handleFingerprintVerification(result.staff_id)

    } catch (error: any) {
      console.error('PIN verification error:', error)
      toast.error(error.message || 'Verification failed')
      setLoading(false)
    }
  }

  const handleFingerprintVerification = async (staffId: string) => {
    setVerifying(true)

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('Fingerprint authentication not supported on this device')
      }

      // Get challenge from server
      const challengeResponse = await fetch('/api/attendance/fingerprint-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId })
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
      const response = await credential.response as AuthenticatorAssertionResponse
      const clockInResponse = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staffId,
          credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          authenticator_data: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
          client_data: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON)))
        })
      })

      const clockInResult = await clockInResponse.json()

      if (!clockInResponse.ok || !clockInResult.success) {
        throw new Error(clockInResult.error || 'Clock-in failed')
      }

      toast.success('✅ Clocked in successfully!')
      setStaffNumber('')
      setPin('')
      
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('Fingerprint verification error:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error('Fingerprint verification cancelled or failed')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Fingerprint not supported on this device')
      } else {
        toast.error(error.message || 'Fingerprint verification failed')
      }
    } finally {
      setLoading(false)
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🕐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Clock In</h1>
            <p className="text-gray-600">Enter your credentials to clock in</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Number
              </label>
              <input
                type="text"
                value={staffNumber}
                onChange={(e) => setStaffNumber(e.target.value.toUpperCase())}
                placeholder="STF0001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg text-center tracking-widest"
                disabled={loading}
              />
            </div>

            <button
              onClick={handlePinVerification}
              disabled={loading || !staffNumber || !pin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
            >
              {verifying ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Fingerprint...</span>
                </span>
              ) : loading ? (
                'Verifying PIN...'
              ) : (
                '🔐 Verify with Fingerprint'
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-800 text-sm"
                disabled={loading}
              >
                ← Back to Home
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              <strong>How it works:</strong> Enter your staff number and PIN, then verify with your device fingerprint sensor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
