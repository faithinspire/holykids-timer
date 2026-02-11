'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const ThemeToggle = dynamic(() => import('@/components/ui/ThemeToggle'), { ssr: false })

export default function ClockInPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [enrolledCount, setEnrolledCount] = useState(0)

  useEffect(() => {
    // Check how many staff are enrolled
    const staffData = localStorage.getItem('holykids_staff')
    if (staffData) {
      const staffList = JSON.parse(staffData)
      const enrolled = staffList.filter((s: any) => s.biometric_enrolled === true)
      setEnrolledCount(enrolled.length)
      console.log('📊 Enrolled staff count:', enrolled.length)
      console.log('📋 Enrolled staff:', enrolled.map((s: any) => `${s.first_name} ${s.last_name}`))
    }
  }, [])

  const handleBiometricScan = async () => {
    setScanning(true)
    setShowSuccess(false)

    try {
      // Get all staff from localStorage
      const staffData = localStorage.getItem('holykids_staff')
      if (!staffData) {
        toast.error('No staff registered in system')
        setScanning(false)
        return
      }

      const staffList = JSON.parse(staffData)
      console.log('👥 Total staff:', staffList.length)
      
      // Filter enrolled staff - SIMPLIFIED CHECK
      const enrolledStaff = staffList.filter((s: any) => s.biometric_enrolled === true)
      
      console.log('✅ Enrolled staff:', enrolledStaff.length)
      enrolledStaff.forEach((s: any) => {
        console.log(`  - ${s.first_name} ${s.last_name} (ID: ${s.staff_id})`)
      })

      if (enrolledStaff.length === 0) {
        toast.error('No staff with fingerprint enrolled. Please enroll first in Staff Management.')
        setScanning(false)
        return
      }

      // Show fingerprint prompt
      toast('Place your finger on the sensor...', { icon: '👆', duration: 3000 })

      // Simulate fingerprint scan (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // For now, use the first enrolled staff (in production, this would match the actual fingerprint)
      // TODO: Integrate actual fingerprint matching
      const staff = enrolledStaff[0]

      console.log('🎯 Staff identified:', `${staff.first_name} ${staff.last_name}`)

      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0]
      const attendanceData = localStorage.getItem('holykids_attendance')
      const attendance = attendanceData ? JSON.parse(attendanceData) : []
      
      const existingCheckIn = attendance.find(
        (a: any) => a.staff_id === staff.id && a.date === today && a.check_in_time
      )

      if (existingCheckIn) {
        const time = new Date(existingCheckIn.check_in_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        toast.error(`${staff.first_name} already clocked in today at ${time}`)
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

      console.log('✅ Check-in recorded:', checkIn)

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
        setScanning(false)
      }, 3000)
      
    } catch (error: any) {
      console.error('❌ Biometric scan error:', error)
      toast.error('Scan failed. Please try again or use PIN.')
      setScanning(false)
    }
  }

  const handlePinEntry = () => {
    router.push('/staff/check-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 transition-colors duration-300 flex flex-col">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-white/80 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              ⏱️ Clock In
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-white/70 text-base md:text-lg mt-1">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {enrolledCount > 0 && (
              <p className="text-white/60 text-sm mt-2">
                {enrolledCount} staff enrolled
              </p>
            )}
          </div>

          {/* Success Display */}
          {showSuccess && lastCheckIn && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-6 animate-fade-in">
              <div className="text-center">
                <div className="w-28 h-28 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
                  <span className="text-6xl">✅</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {lastCheckIn.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                  {lastCheckIn.department}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
                  <p className="text-green-700 dark:text-green-400 font-bold text-2xl mb-2">
                    Clocked In: {lastCheckIn.time}
                  </p>
                  <p className="text-green-600 dark:text-green-500 text-base">
                    {lastCheckIn.date}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scan Button - FULL SCREEN FOCUS */}
          {!showSuccess && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="text-center">
                
                {/* Large Fingerprint Icon */}
                <div className="relative mb-8">
                  <div className={`w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                    scanning 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-500 animate-pulse scale-110' 
                      : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:scale-105'
                  }`}>
                    <span className="text-8xl md:text-9xl">👆</span>
                  </div>
                  {scanning && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 md:w-56 md:h-56 border-4 border-purple-300 dark:border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-56 h-56 md:w-64 md:h-64 border-4 border-blue-300 dark:border-blue-700 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      </div>
                    </>
                  )}
                </div>

                {/* Instructions */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3">
                  {scanning ? 'Scanning...' : 'Place Your Finger'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-8">
                  {scanning ? 'Please wait while we verify your fingerprint' : 'Touch the button below to clock in'}
                </p>

                {/* Big Scan Button */}
                <button
                  onClick={handleBiometricScan}
                  disabled={scanning}
                  className="w-full py-6 md:py-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xl md:text-2xl"
                >
                  {scanning ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning Fingerprint...
                    </span>
                  ) : (
                    '👆 Scan Fingerprint'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Alternative PIN Entry */}
          {!showSuccess && (
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm mb-3">Fingerprint not working?</p>
              <button
                onClick={handlePinEntry}
                className="text-white hover:text-white/80 underline text-base font-medium transition-colors"
              >
                Use PIN Instead →
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-white/40 text-xs">
          HOLYKIDS Staff Attendance System
        </p>
      </div>
    </div>
  )
}
