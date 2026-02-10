'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function StaffCheckInPage() {
  const [pin, setPin] = useState('')
  const [checking, setChecking] = useState(false)

  const handlePinCheckIn = async () => {
    if (pin.length !== 4) {
      toast.error('Please enter a 4-digit PIN')
      return
    }

    setChecking(true)

    try {
      const staffData = localStorage.getItem('holykids_staff')
      if (!staffData) {
        toast.error('No staff registered')
        setChecking(false)
        return
      }

      const staffList = JSON.parse(staffData)
      const staff = staffList.find((s: any) => s.pin === pin)

      if (!staff) {
        toast.error('Invalid PIN')
        setPin('')
        setChecking(false)
        return
      }

      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0]
      const attendanceData = localStorage.getItem('holykids_attendance')
      const attendance = attendanceData ? JSON.parse(attendanceData) : []
      
      const existingCheckIn = attendance.find(
        (a: any) => a.staff_id === staff.id && a.date === today && a.check_in_time
      )

      if (existingCheckIn) {
        toast.error('Already checked in today')
        setPin('')
        setChecking(false)
        return
      }

      // Record check-in
      const checkIn = {
        id: Date.now().toString(),
        staff_id: staff.id,
        staff_name: `${staff.first_name} ${staff.last_name}`,
        staff_department: staff.department,
        check_in_time: new Date().toISOString(),
        date: today,
        status: 'present'
      }

      attendance.push(checkIn)
      localStorage.setItem('holykids_attendance', JSON.stringify(attendance))

      toast.success(`Welcome ${staff.first_name}! Checked in successfully`)
      setPin('')
      
      // Show success screen
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Check-in failed')
    } finally {
      setChecking(false)
    }
  }

  const handleBiometricCheckIn = async () => {
    setChecking(true)

    try {
      if (!window.PublicKeyCredential) {
        toast.error('Biometric authentication not supported')
        setChecking(false)
        return
      }

      // Request biometric authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required'
        }
      })

      if (credential) {
        // Find staff by biometric ID
        const staffData = localStorage.getItem('holykids_staff')
        if (!staffData) {
          toast.error('No staff registered')
          setChecking(false)
          return
        }

        const staffList = JSON.parse(staffData)
        const staff = staffList.find((s: any) => s.biometric_id === credential.id)

        if (!staff) {
          toast.error('Biometric not recognized')
          setChecking(false)
          return
        }

        // Check if already checked in today
        const today = new Date().toISOString().split('T')[0]
        const attendanceData = localStorage.getItem('holykids_attendance')
        const attendance = attendanceData ? JSON.parse(attendanceData) : []
        
        const existingCheckIn = attendance.find(
          (a: any) => a.staff_id === staff.id && a.date === today && a.check_in_time
        )

        if (existingCheckIn) {
          toast.error('Already checked in today')
          setChecking(false)
          return
        }

        // Record check-in
        const checkIn = {
          id: Date.now().toString(),
          staff_id: staff.id,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          staff_department: staff.department,
          check_in_time: new Date().toISOString(),
          date: today,
          status: 'present',
          method: 'biometric'
        }

        attendance.push(checkIn)
        localStorage.setItem('holykids_attendance', JSON.stringify(attendance))

        toast.success(`Welcome ${staff.first_name}! Checked in successfully`)
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Biometric check-in error:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Biometric authentication cancelled')
      } else {
        toast.error('Biometric check-in failed')
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Staff Check-In</h1>
            <p className="text-white/80">HOLYKIDS Attendance System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Biometric Check-In */}
            <div className="mb-6">
              <button
                onClick={handleBiometricCheckIn}
                disabled={checking}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span className="text-2xl">👆</span>
                <span>{checking ? 'Checking in...' : 'Check-In with Fingerprint'}</span>
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* PIN Check-In */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your 4-digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••"
                disabled={checking}
              />
              <button
                onClick={handlePinCheckIn}
                disabled={checking || pin.length !== 4}
                className="w-full mt-4 py-3 bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              >
                {checking ? 'Checking in...' : 'Check-In with PIN'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
