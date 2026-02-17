'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { ClientAttendanceStorage } from '@/lib/clientAttendance'
import toast from 'react-hot-toast'

interface RecentCheckin {
  id: string
  staff_id: string
  staff_name?: string
  department?: string
  check_in_time: string
}

export default function AdminDashboard() {
  const { user, staff, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    total_staff: 0,
    present_today: 0,
    absent_today: 0,
    late_today: 0,
    attendance_percentage: 0
  })
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([])
  const [isDemoMode, setIsDemoMode] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Load staff from localStorage
    const localData = localStorage.getItem('holykids_staff')
    const staffList = localData ? JSON.parse(localData) : []
    
    // Load today's attendance from client storage
    const attendanceStorage = ClientAttendanceStorage.getInstance()
    const todayRecords = attendanceStorage.getTodayAttendance()
    
    if (staffList.length === 0) {
      setIsDemoMode(true)
      setStats({
        total_staff: 0,
        present_today: 0,
        absent_today: 0,
        late_today: 0,
        attendance_percentage: 0
      })
      setRecentCheckins([])
      return
    }

    setIsDemoMode(false)
    const presentIds = new Set(todayRecords.filter(r => r.check_in_time).map(r => r.staff_id))
    const present = staffList.filter((s: any) => presentIds.has(s.id)).length
    
    setStats({
      total_staff: staffList.length,
      present_today: present,
      absent_today: staffList.length - present,
      late_today: 0,
      attendance_percentage: Math.round((present / staffList.length) * 100)
    })
    
    // Set recent check-ins with staff info
    const checkins: RecentCheckin[] = todayRecords
      .filter((r: any) => r.check_in_time)
      .map((r: any) => {
        const staffMember = staffList.find((s: any) => s.id === r.staff_id)
        return {
          id: r.id,
          staff_id: r.staff_id,
          staff_name: r.staff_name || staffMember?.first_name + ' ' + staffMember?.last_name || 'Unknown',
          department: r.staff_department || staffMember?.department || 'Unknown',
          check_in_time: r.check_in_time || ''
        }
      })
      .sort((a: any, b: any) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
      
    setRecentCheckins(checkins)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)' }}>
      {/* Header */}
      <div className="shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/80 text-xs">{currentDate} • {currentTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs bg-white/10 px-2 py-1 rounded">
                Admin
              </span>
              <button onClick={handleSignOut} className="bg-white/10 px-3 py-1 rounded text-white text-xs">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-gray-500 text-xs">Total Staff</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total_staff}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <p className="text-gray-500 text-xs">Present Today</p>
            <p className="text-2xl font-bold text-gray-800">{stats.present_today}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
            <p className="text-gray-500 text-xs">Absent Today</p>
            <p className="text-2xl font-bold text-gray-800">{stats.absent_today}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
            <p className="text-gray-500 text-xs">Late Today</p>
            <p className="text-2xl font-bold text-gray-800">{stats.late_today}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-gray-500 text-xs">Attendance Rate</p>
            <p className="text-2xl font-bold text-gray-800">{stats.attendance_percentage}%</p>
          </div>
        </div>

        {/* Clock In Button - Prominent */}
        <div className="mb-4">
          <button 
            onClick={() => window.location.href = '/face-clock-in'}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-2xl shadow-2xl p-6 hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-center space-x-4">
              <span className="text-5xl">📸</span>
              <div className="text-left">
                <h2 className="text-2xl font-bold">Face Clock In / Out</h2>
                <p className="text-white/80 text-sm">Use camera for facial recognition</p>
              </div>
            </div>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button onClick={() => window.location.href = '/admin/staff'}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-800 text-sm">Staff</h3>
          </button>
          
          <button onClick={() => window.location.href = '/admin/reports'}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 text-sm">Reports</h3>
          </button>
          
          <button onClick={() => window.location.href = '/staff/face-enrollment'}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold text-gray-800 text-sm">Face Enrollment</h3>
          </button>
          
          <button onClick={() => window.location.href = '/admin/settings'}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-semibold text-gray-800 text-sm">Settings</h3>
          </button>
        </div>

        {/* Empty State Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl p-4 text-white mb-4">
            <h3 className="font-semibold mb-1">Getting Started</h3>
            <p className="text-white/90 text-sm mb-2">
              Add staff members to see attendance data.
            </p>
            <button onClick={() => window.location.href = '/admin/staff'}
                    className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium">
              Add Staff
            </button>
          </div>
        )}

        {/* Recent Check-ins */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Check-ins</h2>
          {recentCheckins.length > 0 ? (
            <div className="space-y-2">
              {recentCheckins.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                         style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      {record.staff_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{record.staff_name}</p>
                      <p className="text-xs text-gray-500">{record.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(record.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Present
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No check-ins recorded today</p>
              {isDemoMode && (
                <button onClick={() => window.location.href = '/admin/staff'}
                        className="text-purple-600 text-sm mt-2">
                  Add staff to get started →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-gray-500 text-xs">
        <p className="mb-1">HOLYKIDS Facial Recognition Attendance System</p>
        <p className="text-gray-400">Created by Olushola Paul Odunuga</p>
      </div>
    </div>
  )
}
