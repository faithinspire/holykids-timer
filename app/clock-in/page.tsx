'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const ThemeToggle = dynamic(() => import('@/components/ui/ThemeToggle'), { ssr: false })

export default function ClockInPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleBiometricScan = async () => {
    setScanning(true)
    setShowSuccess(false)

    try {
      // Check if Web Authentication API is available
      if (!window.PublicKeyCredential) {
        toast.error('Biometric authentication not supported on this device')
        setScanning(false)
        return
      }

      // Request biometric authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: []
        }
      })

      if (credential) {
        // Find staff by biometric ID
        const staffData = localStorage.getItem('holykids_staff')
        if (!staffData) {
          toast.error('No staff registered in system')
          setScanning(false)
          return
        }

        const staffList = JSON.parse(staffData)
        const staff = staffList.find((s: any) => s.biometric_id === credential.id)

        if (!staff) {
          toast.error('❌ Fingerprint not recognized. Please register first.')
          setScanning(false)
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
          toast.error(`${staff.first_name} already clocked in today at ${new Date(existingCheckIn.check_in_time).toLocaleTimeString()}`)
          setScanning(false)
          return
        }

        // Record check-in
        const checkInTime = new Date()
        const checkIn = {
          id: Date.now().toString(),
          staff_id: staff.id,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          staff_department: staff.department,
          check_in_time: checkInTime.toISOString(),
          date: today,
          status: 'present',
          method: 'biometric'
        }

        attendance.push(checkIn)
        localStorage.setItem('holykids_attendance', JSON.stringify(attendance))

        // Show success
        setLastCheckIn({
          name: `${staff.first_name} ${staff.last_name}`,
          department: staff.department,
          time: checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: checkInTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        })
        setShowSuccess(true)
        
        toast.success(`✅ Welcome ${staff.first_name}!`)
        
        // Auto-reset after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          setLastCheckIn(null)
        }, 3000)
      }
    } catch (error: any) {
      console.error('Biometric scan error:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Scan cancelled')
      } else {
        toast.error('Scan failed. Please try again.')
      }
    } finally {
      setScanning(false)
    }
  }

  const handlePinEntry = () => {
    router.push('/staff/check-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 transition-colors duration-300">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              ⏱️ Clock In
            </h1>
            <p className="text-white/80 text-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-white/60 text-sm mt-1">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Success Display */}
          {showSuccess && lastCheckIn && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-6 animate-fade-in">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {lastCheckIn.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {lastCheckIn.department}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-green-700 dark:text-green-400 font-bold text-lg">
                    Clocked In: {lastCheckIn.time}
                  </p>
                  <p className="text-green-600 dark:text-green-500 text-sm mt-1">
                    {lastCheckIn.date}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scan Button */}
          {!showSuccess && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-6">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                    scanning 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-500 animate-pulse scale-110' 
                      : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:scale-105'
                  }`}>
                    <span className="text-6xl">👆</span>
                  </div>
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-40 h-40 border-4 border-purple-300 dark:border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {scanning ? 'Scanning...' : 'Place Your Finger'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {scanning ? 'Please wait while we verify your fingerprint' : 'Touch the sensor to clock in'}
                </p>

                <button
                  onClick={handleBiometricScan}
                  disabled={scanning}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {scanning ? 'Scanning Fingerprint...' : 'Scan Fingerprint'}
                </button>
              </div>
            </div>
          )}

          {/* Alternative PIN Entry */}
          <div className="text-center">
            <p className="text-white/60 text-sm mb-3">Fingerprint not working?</p>
            <button
              onClick={handlePinEntry}
              className="text-white hover:text-white/80 underline text-sm font-medium transition-colors"
            >
              Use PIN Instead →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-white/40 text-xs">
          HOLYKIDS Staff Attendance System
        </p>
      </div>
    </div>
  )
}
