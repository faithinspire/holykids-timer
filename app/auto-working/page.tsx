'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// Auto-working system with built-in data
const ADMIN_CREDENTIALS = {
  email: 'admin@timeattendance.edu',
  password: 'Admin123!@#'
}

const MOCK_STAFF_DATA = [
  { id: '1', name: 'John Smith', department: 'Mathematics', status: 'present', time: '8:15 AM' },
  { id: '2', name: 'Sarah Johnson', department: 'Science', status: 'late', time: '8:22 AM' },
  { id: '3', name: 'Mike Chen', department: 'English', status: 'present', time: '8:10 AM' },
  { id: '4', name: 'Emily Davis', department: 'History', status: 'present', time: '8:18 AM' },
  { id: '5', name: 'David Wilson', department: 'Mathematics', status: 'late', time: '8:25 AM' },
  { id: '6', name: 'Lisa Brown', department: 'Art', status: 'present', time: '8:05 AM' },
  { id: '7', name: 'James Taylor', department: 'PE', status: 'absent', time: '--' },
  { id: '8', name: 'Maria Garcia', department: 'Music', status: 'present', time: '8:12 AM' },
]

export default function AutoWorkingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fingerprintSupported, setFingerprintSupported] = useState(false)
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    attendancePercentage: 0
  })

  useEffect(() => {
    updateTime()
    checkFingerprintSupport()
    calculateStats()
    
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const updateTime = () => {
    const now = new Date()
    setCurrentTime(now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }))
    setCurrentDate(now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))

    const hour = now.getHours()
    setIsDarkMode(hour >= 18 || hour < 6)
  }

  const checkFingerprintSupport = () => {
    const supported = !!(navigator.credentials && navigator.credentials.create)
    setFingerprintSupported(supported)
  }

  const calculateStats = () => {
    const totalStaff = MOCK_STAFF_DATA.length
    const presentToday = MOCK_STAFF_DATA.filter(s => s.status === 'present').length
    const lateToday = MOCK_STAFF_DATA.filter(s => s.status === 'late').length
    const absentToday = MOCK_STAFF_DATA.filter(s => s.status === 'absent').length
    const attendancePercentage = Math.round(((presentToday + lateToday) / totalStaff) * 100)

    setStats({
      totalStaff,
      presentToday,
      lateToday,
      absentToday,
      attendancePercentage
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (loginEmail === ADMIN_CREDENTIALS.email && loginPassword === ADMIN_CREDENTIALS.password) {
      setIsLoggedIn(true)
      toast.success('Login successful!')
    } else {
      toast.error('Invalid credentials')
    }
    setLoading(false)
  }

  const handleFingerprintAuth = async () => {
    if (!fingerprintSupported) {
      toast.error('Fingerprint not supported')
      return
    }

    toast.loading('Place finger on sensor...', { duration: 2000 })
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.dismiss()
    toast.success('✅ Fingerprint authenticated!')
  }

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🏫</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Auto Working</h1>
            <p className="text-gray-600">Staff Attendance System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Demo: admin@timeattendance.edu<br />Password: Admin123!@#
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Auto Working Dashboard</h1>
            <p className="text-sm opacity-80">{currentDate} • {currentTime}</p>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="bg-white/20 px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalStaff}</p>
          <p className="text-xs text-gray-600">Total</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
          <p className="text-xs text-gray-600">Present</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.lateToday}</p>
          <p className="text-xs text-gray-600">Late</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
          <p className="text-xs text-gray-600">Absent</p>
        </div>
      </div>

      {/* Staff List */}
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Today's Attendance</h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {MOCK_STAFF_DATA.map((staff) => (
            <div key={staff.id} className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{staff.name}</p>
                  <p className="text-sm text-gray-600">{staff.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{staff.time}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  staff.status === 'present' ? 'bg-green-100 text-green-800' :
                  staff.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {staff.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center p-4 text-gray-500 text-sm">
        <p>HOLYKIDS Staff Attendance System</p>
      </div>
    </div>
  )
}
