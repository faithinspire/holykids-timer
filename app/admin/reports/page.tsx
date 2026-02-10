'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Organization name - can be configured in settings
const ORGANIZATION_NAME = 'HOLYKIDS'

interface AttendanceRecord {
  id: string
  staff_id: string
  staff?: { first_name: string; last_name: string; department: string }
  attendance_date: string
  check_in_time: string
  check_out_time: string
  status: string
  is_late: boolean
}

interface StaffMember {
  id: string
  staff_id: string
  first_name: string
  last_name: string
  department: string
  email?: string
}

export default function AdminReportsPage() {
  const { user, staff } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [reportType, setReportType] = useState('attendance')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load staff from Supabase
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, staff_id, first_name, last_name, department, email')
        .eq('is_active', true)

      if (staffData && staffData.length > 0) {
        setStaffList(staffData)
      }
      // Load attendance from Supabase
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, staff:staff_id(first_name, last_name, department)')
        .gte('attendance_date', dateRange.start)
        .lte('attendance_date', dateRange.end)
        .order('attendance_date', { ascending: false })

      if (attendance && attendance.length > 0) {
        setAttendanceData(attendance)
      }
      // If no data, show empty state (no demo data)
    } catch (error) {
      // No demo data - show empty state
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    let filtered = attendanceData

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(a => a.staff?.department === selectedDepartment)
    }

    if (selectedStaff !== 'all') {
      filtered = filtered.filter(a => a.staff_id === selectedStaff)
    }

    return filtered
  }

  const exportToCSV = () => {
    setIsExporting(true)
    const data = getFilteredData()
    
    const headers = ['Date', 'Staff ID', 'Name', 'Department', 'Check In', 'Check Out', 'Status', 'Late']
    const rows = data.map(a => [
      a.attendance_date,
      staffList.find(s => s.id === a.staff_id)?.staff_id || '',
      a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : '',
      a.staff?.department || '',
      a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : '--:--',
      a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString() : '--:--',
      a.status,
      a.is_late ? 'Yes' : 'No'
    ])

    const csvContent = [
      `${ORGANIZATION_NAME} - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Period: ${dateRange.start} to ${dateRange.end}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${ORGANIZATION_NAME}_${reportType}_report_${dateRange.start}.csv`
    link.click()
    
    toast.success('CSV exported successfully!')
    setIsExporting(false)
  }

  const exportToPDF = () => {
    setIsExporting(true)
    const data = getFilteredData()

    // Create printable HTML
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups for PDF export')
      setIsExporting(false)
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${ORGANIZATION_NAME} - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #667eea; }
          .org-name { font-size: 28px; font-weight: bold; color: #667eea; margin-bottom: 5px; }
          .report-title { font-size: 20px; color: #555; margin-bottom: 10px; }
          .meta { font-size: 12px; color: #888; }
          .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .stat-box { text-align: center; padding: 15px 30px; background: #f5f7fa; border-radius: 10px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .stat-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #667eea; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
          td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
          tr:nth-child(even) { background: #f9f9f9; }
          tr:hover { background: #f0f0f0; }
          .status-present { color: #28a745; font-weight: bold; }
          .status-late { color: #ffc107; font-weight: bold; }
          .status-absent { color: #dc3545; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="org-name">${ORGANIZATION_NAME}</div>
          <div class="report-title">${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</div>
          <div class="meta">Generated on: ${new Date().toLocaleDateString()} | Period: ${dateRange.start} to ${dateRange.end}</div>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <div class="stat-value">${data.length}</div>
            <div class="stat-label">Total Records</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${data.filter(d => d.status === 'present' && !d.is_late).length}</div>
            <div class="stat-label">On Time</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${data.filter(d => d.is_late).length}</div>
            <div class="stat-label">Late</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${data.filter(d => d.status === 'absent').length}</div>
            <div class="stat-label">Absent</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Staff Name</th>
              <th>Department</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(a => `
              <tr>
                <td>${a.attendance_date}</td>
                <td>${a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : '-'}</td>
                <td>${a.staff?.department || '-'}</td>
                <td>${a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : '--:--'}</td>
                <td>${a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString() : '--:--'}</td>
                <td class="status-${a.is_late ? 'late' : a.status === 'absent' ? 'absent' : 'present'}">
                  ${a.status === 'present_late' ? 'Late' : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>${ORGANIZATION_NAME} Staff Biometric Attendance System</p>
          <p>Page generated automatically - ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      toast.success('PDF exported successfully!')
      setIsExporting(false)
    }, 500)
  }

  const departments = [...new Set(staffList.map(s => s.department))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/admin/dashboard')} className="text-white hover:bg-white/10 p-2 rounded-lg">
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Reports</h1>
                <p className="text-white/80 text-sm">{currentDate}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportToCSV}
                disabled={isExporting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center"
              >
                📄 Download CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center"
              >
                📊 Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Staff</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Records</p>
            <p className="text-2xl font-bold text-gray-800">{getFilteredData().length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Present (On Time)</p>
            <p className="text-2xl font-bold text-green-600">{getFilteredData().filter(d => d.status === 'present' && !d.is_late).length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Late Arrivals</p>
            <p className="text-2xl font-bold text-yellow-600">{getFilteredData().filter(d => d.is_late).length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500">
            <p className="text-gray-500 text-sm">Absent</p>
            <p className="text-2xl font-bold text-red-600">{getFilteredData().filter(d => d.status === 'absent').length}</p>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Staff Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check In</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check Out</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getFilteredData().map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{record.attendance_date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                          {record.staff ? `${record.staff.first_name[0]}${record.staff.last_name[0]}` : '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {record.staff ? `${record.staff.first_name} ${record.staff.last_name}` : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.staff?.department || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' && !record.is_late ? 'bg-green-100 text-green-700' :
                        record.is_late ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {record.status === 'present_late' ? 'Late' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {getFilteredData().length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No records found for the selected filters</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center py-6 text-gray-500 text-sm">
        <p className="mb-1">{ORGANIZATION_NAME} Staff Management System</p>
        <p className="text-xs text-gray-400">Created by Olushola Paul Odunuga</p>
      </div>
    </div>
  )
}
