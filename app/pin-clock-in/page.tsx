'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamicImport from 'next/dynamic'

const ThemeToggle = dynamicImport(() => import('@/components/ui/ThemeToggle'), { ssr: false })

export default function PinClockInPage() {
  const router = useRouter()
  const [staffNumber, setStaffNumber] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [clockType, setClockType] = useState<'check_in' | 'check_out'>('check_in')

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!staffNumber || !pin) {
      toast.error('Please enter both Staff Number and PIN')
      return
    }

    if (pin.length < 4 || pin.length > 6) {
      toast.error('PIN must be 4-6 digits')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/pin/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_number: staffNumber,
          pin,
          clock_type: clockType,
          device_id: getDeviceId()
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const staff = result.staff
        setLastCheckIn({
          name: staff.full_name,
          department: staff.department,
          time: new Date(staff[clockType === 'check_in' ? 'clock_in_time' : 'check_out_time']).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          date: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }),
          is_late: staff.is_late
        })
        setShowSuccess(true)
        toast.success(`✅ ${clockType === 'check_in' ? 'Clocked in' : 'Clocked out'} successfully!`)

        // Clear form
        setStaffNumber('')
        setPin('')

        // Auto-reset after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          setLastCheckIn(null)
        }, 3000)
      } else {
        toast.error(result.error || 'Clock-in failed')
      }
    } catch (error) {
      console.error('PIN clock-in error:', error)
      toast.error('Failed to clock in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNumberPad = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num)
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
  }

  const handleClear = () => {
    setStaffNumber('')
    setPin('')
  }

  const getDeviceId = (): string => {
    const nav = navigator
    const screen = window.screen
    const fingerprint = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|')
    
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return `device_${Math.abs(hash).toString(36)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 flex flex-col">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/clock-in')}
          className="text-white/80 hover:text-white transition-colors text-sm"
        >
          ← Back to Face Recognition
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              🔐 PIN Clock {clockType === 'check_in' ? 'In' : 'Out'}
            </h1>
            <p className="text-white/90 text-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-white/70 text-base mt-1">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Clock Type Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex">
              <button
                onClick={() => setClockType('check_in')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  clockType === 'check_in'
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Clock In
              </button>
              <button
                onClick={() => setClockType('check_out')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  clockType === 'check_out'
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Clock Out
              </button>
            </div>
          </div>

          {/* Success Display */}
          {showSuccess && lastCheckIn && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-6 animate-fade-in">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {lastCheckIn.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {lastCheckIn.department}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-green-700 dark:text-green-400 font-bold text-xl mb-1">
                    {clockType === 'check_in' ? 'Clocked In' : 'Clocked Out'}: {lastCheckIn.time}
                  </p>
                  <p className="text-green-600 dark:text-green-500 text-sm">
                    {lastCheckIn.date}
                  </p>
                  {lastCheckIn.is_late && (
                    <p className="text-yellow-600 dark:text-yellow-500 text-sm mt-2">
                      ⚠️ Late Arrival
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PIN Form */}
          {!showSuccess && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
              <form onSubmit={handlePinSubmit} className="space-y-6">
                
                {/* Staff Number Input */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Staff Number
                  </label>
                  <input
                    type="text"
                    value={staffNumber}
                    onChange={(e) => setStaffNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-lg text-center font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="STF1234"
                    autoComplete="off"
                  />
                </div>

                {/* PIN Display */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    PIN
                  </label>
                  <div className="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="flex justify-center space-x-3">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold ${
                            i < pin.length
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                          }`}
                        >
                          {i < pin.length ? '•' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumberPad(num.toString())}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-2xl py-4 rounded-xl transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumberPad('0')}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-2xl py-4 rounded-xl transition-colors"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 font-bold py-4 rounded-xl transition-colors"
                  >
                    ⌫
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !staffNumber || pin.length < 4}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Processing...' : `✓ ${clockType === 'check_in' ? 'Clock In' : 'Clock Out'}`}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-white/40 text-xs">
          HOLYKIDS PIN Attendance System
        </p>
      </div>
    </div>
  )
}
