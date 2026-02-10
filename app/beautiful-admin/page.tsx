'use client'

import { useState, useEffect } from 'react'

// Mock data for demonstration
const mockStats = {
  totalStaff: 156,
  presentToday: 142,
  lateToday: 8,
  absentToday: 6,
  attendancePercentage: 91.0,
  onLeaveToday: 4
}

const mockRecentActivity = [
  { id: 1, name: 'Sarah Johnson', action: 'checked in', time: '8:15 AM', status: 'success', department: 'Mathematics' },
  { id: 2, name: 'Mike Chen', action: 'checked in', time: '8:22 AM', status: 'warning', department: 'Science' },
  { id: 3, name: 'Emily Davis', action: 'checked out', time: '5:10 PM', status: 'success', department: 'English' },
  { id: 4, name: 'David Wilson', action: 'applied for leave', time: '7:45 AM', status: 'info', department: 'History' },
  { id: 5, name: 'Lisa Brown', action: 'checked in', time: '8:05 AM', status: 'success', department: 'Art' },
]

export default function BeautifulAdminPage() {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [greeting, setGreeting] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
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

      // Set greeting and auto dark mode based on time
      const hour = now.getHours()
      if (hour < 12) setGreeting('Good Morning')
      else if (hour < 17) setGreeting('Good Afternoon')
      else setGreeting('Good Evening')

      // Auto dark mode after 6 PM or before 6 AM
      setIsDarkMode(hour >= 18 || hour < 6)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse ${
          isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-500' : 'bg-gradient-to-r from-blue-300 to-purple-400'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse ${
          isDarkMode ? 'bg-gradient-to-r from-pink-400 to-red-500' : 'bg-gradient-to-r from-pink-300 to-red-400'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-40 left-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse ${
          isDarkMode ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-yellow-300 to-orange-400'
        }`} style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className={`backdrop-blur-md border-b transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/50 border-gray-700/50' 
            : 'bg-white/50 border-gray-200/50'
        }`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl shadow-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}>
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                    Beautiful Admin Dashboard
                  </h1>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {greeting}, Administrator • {currentDate}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Live Clock */}
                <div className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
                }`}>
                  <svg className={`h-5 w-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-mono text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    {currentTime}
                  </span>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
                    isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/70' : 'bg-white/50 hover:bg-white/70'
                  }`}
                >
                  {isDarkMode ? (
                    <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

                {/* Notifications */}
                <button className={`relative p-3 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
                  isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/70' : 'bg-white/50 hover:bg-white/70'
                }`}>
                  <svg className={`h-6 w-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.07 2.82l-.908.908a3.5 3.5 0 000 4.95l.908.908a3.5 3.5 0 004.95 0l.908-.908a3.5 3.5 0 000-4.95l-.908-.908a3.5 3.5 0 00-4.95 0z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    3
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* Total Staff */}
            <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Total Staff</p>
                  <p className={`text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{mockStats.totalStaff}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Present Today */}
            <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Present</p>
                  <p className="text-3xl font-bold text-green-600">{mockStats.presentToday}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Late Today */}
            <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Late</p>
                  <p className="text-3xl font-bold text-yellow-600">{mockStats.lateToday}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Absent Today */}
            <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Absent</p>
                  <p className="text-3xl font-bold text-red-600">{mockStats.absentToday}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* On Leave */}
            <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>On Leave</p>
                  <p className="text-3xl font-bold text-purple-600">{mockStats.onLeaveToday}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className={`lg:col-span-1 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Attendance</p>
                  <p className="text-3xl font-bold text-indigo-600">{mockStats.attendancePercentage}%</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className={`w-full rounded-full h-2 transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${mockStats.attendancePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Recent Activity</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {mockRecentActivity.map((activity, index) => (
                <div key={activity.id} className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/70' : 'bg-white/50 hover:bg-white/70'
                }`}>
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? (isDarkMode ? 'bg-green-900' : 'bg-green-100') :
                    activity.status === 'warning' ? (isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100') :
                    (isDarkMode ? 'bg-blue-900' : 'bg-blue-100')
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <span className="font-semibold">{activity.name}</span> {activity.action}
                    </p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {activity.department} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Theme Info */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className={`px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800/80 text-white' : 'bg-white/80 text-gray-900'
        }`}>
          <p className="text-sm font-medium">
            🎨 {isDarkMode ? 'Night Mode' : 'Day Mode'} • Auto-switching at 6 PM
          </p>
        </div>
      </div>
    </div>
  )
}