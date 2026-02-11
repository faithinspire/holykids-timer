'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import dynamic from 'next/dynamic'

const ThemeToggle = dynamic(() => import('@/components/ui/ThemeToggle'), { ssr: false })

interface StaffMember {
  id: string
  staff_id: string
  first_name: string
  last_name: string
  email?: string
  department: string
  phone?: string
  role: string
  pin: string
  biometric_enrolled: boolean
  biometric_id?: string
  is_active: boolean
  created_at?: string
}

// API base URL
const API_URL = '/api/staff'

export default function AdminStaffPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: [] as string[], // Changed to array for multiple departments
    phone: '',
    role: 'Teacher'
  })
  const [newPin, setNewPin] = useState('')

  // Load staff from API
  const loadStaff = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(API_URL)
      const data = await response.json()
      
      if (data.warning) {
        // Show warning about Supabase not configured
        toast.error(data.warning, { duration: 5000 })
      }
      
      if (data.staff && Array.isArray(data.staff)) {
        setStaffList(data.staff)
        // Also save to localStorage for offline access
        localStorage.setItem('holykids_staff', JSON.stringify(data.staff))
      } else {
        // Fallback to localStorage
        const localData = localStorage.getItem('holykids_staff')
        if (localData) {
          setStaffList(JSON.parse(localData))
        }
      }
    } catch (error) {
      console.log('API not available, using localStorage')
      const localData = localStorage.getItem('holykids_staff')
      if (localData) {
        setStaffList(JSON.parse(localData))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString() // 4-digit PIN
  }

  const handleAddStaff = async () => {
    console.log('Add staff clicked', newStaff)
    
    if (!newStaff.first_name || !newStaff.last_name || newStaff.department.length === 0) {
      toast.error('Please fill in First Name, Last Name, and at least one Department')
      return
    }

    setSaving(true)
    const pin = generatePin()
    const staffMember = {
      first_name: newStaff.first_name,
      last_name: newStaff.last_name,
      email: newStaff.email,
      department: newStaff.department,
      phone: newStaff.phone,
      role: newStaff.role,
      pin: pin
    }

    console.log('Saving staff:', staffMember)

    try {
      // Try to save to Supabase via API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffMember)
      })

      const data = await response.json()
      console.log('API response:', data)

      if (response.ok && data.success) {
        if (data.warning) {
          toast.success('✅ Staff saved locally (offline mode)')
        } else {
          toast.success('✅ Staff saved to cloud database!')
        }
        
        // Show PIN after adding
        setNewPin(pin)
        setSelectedStaff(data.staff || { ...staffMember, id: Date.now().toString(), staff_id: `STF${Date.now().toString().slice(-4)}`, biometric_enrolled: false, is_active: true })
        setShowAddModal(false)
        setShowPinModal(true)
        
        // Reload staff list
        await loadStaff()
      } else {
        // API returned error, save locally
        console.error('API error:', data.error || data.message)
        throw new Error(data.error || 'API failed')
      }
    } catch (error: any) {
      console.log('Saving locally due to error:', error.message)
      
      // Save to localStorage as fallback
      const localStaff: StaffMember = {
        id: Date.now().toString(),
        staff_id: `STF${Date.now().toString().slice(-4)}`,
        ...staffMember,
        biometric_enrolled: false,
        is_active: true,
        created_at: new Date().toISOString()
      }

      const updatedList = [...staffList, localStaff]
      localStorage.setItem('holykids_staff', JSON.stringify(updatedList))
      setStaffList(updatedList)
      
      toast.success('Staff saved locally (offline mode)')
      
      // Show PIN after adding
      setNewPin(pin)
      setSelectedStaff(localStaff)
      setShowAddModal(false)
      setShowPinModal(true)
    } finally {
      setSaving(false)
      setNewStaff({ first_name: '', last_name: '', email: '', department: '', phone: '', role: 'Support Staff' })
    }
  }

  const handleDeleteStaff = async (id: string, staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    setSaving(true)
    try {
      // Try to delete from API
      const response = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' })
      
      if (!response.ok) throw new Error('Delete failed')
    } catch (error) {
      console.log('Delete failed, removing locally')
    }

    // Remove locally
    const updatedList = staffList.filter(s => s.id !== id)
    localStorage.setItem('holykids_staff', JSON.stringify(updatedList))
    setStaffList(updatedList)
    toast.success('Staff deleted')
    setSaving(false)
  }

  const handleViewPin = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember)
    setShowPinModal(true)
  }

  const handleFaceEnrollment = (staffMember: StaffMember) => {
    localStorage.setItem('face_enrollment_staff_id', staffMember.id)
    window.location.href = '/staff/face-enrollment'
  }

  const departments = [
    'ICT',
    'Economics', 
    'Commerce',
    'Chemistry',
    'Biology',
    'Physics',
    'Mathematics',
    'English',
    'Social Studies',
    'Arts',
    'Physical Education',
    'Religious Studies',
    'Administration',
    'Library',
    'Laboratory'
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 transition-colors duration-300">
      {/* Header */}
      <div className="shadow-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => window.location.href = '/admin/dashboard'} className="text-white hover:bg-white/10 p-2 rounded-lg transition-all">
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg">Staff Management</h1>
                <p className="text-white/80 text-xs">{currentDate}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform shadow-lg"
              >
                + Add Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-blue-500 dark:border-blue-400 hover:scale-105 transition-transform">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Total Staff</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{staffList.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-green-500 dark:border-green-400 hover:scale-105 transition-transform">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">With PIN</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{staffList.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-purple-500 dark:border-purple-400 hover:scale-105 transition-transform">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Face ID</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{staffList.filter(s => s.face_enrolled).length}</p>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden-mobile">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">PIN</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Face ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{member.first_name} {member.last_name}</p>
                          <p className="text-xs text-gray-500">{member.staff_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden-mobile">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(member.department) ? (
                          member.department.map((dept, idx) => (
                            <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {dept}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-600">{member.department}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewPin(member)}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-medium hover:bg-purple-200"
                      >
                        View PIN
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {member.face_enrolled ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          ✅ Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFaceEnrollment(member)}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs hover:bg-blue-200"
                        >
                          Setup Face
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFaceEnrollment(member)}
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                        >
                          Face
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id, member.staff_id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {staffList.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No staff members yet</p>
              <button onClick={() => setShowAddModal(true)} className="text-purple-600 font-medium text-sm">
                Add your first staff member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Staff</h2>
            <p className="text-xs text-gray-500 mb-4">A 4-digit PIN will be auto-generated for this staff member</p>
            {saving && (
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-xs mb-4">
                Saving to database...
              </div>
            )}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newStaff.first_name}
                    onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={newStaff.last_name}
                    onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="john@holykids.edu"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Departments * (Select at least 1, can select multiple)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  {departments.map(dept => (
                    <label key={dept} className="flex items-center py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaff.department.includes(dept)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStaff({ ...newStaff, department: [...newStaff.department, dept] })
                          } else {
                            setNewStaff({ ...newStaff, department: newStaff.department.filter(d => d !== dept) })
                          }
                        }}
                        className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{dept}</span>
                    </label>
                  ))}
                </div>
                {newStaff.department.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newStaff.department.map(dept => (
                      <span key={dept} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {dept}
                        <button
                          type="button"
                          onClick={() => setNewStaff({ ...newStaff, department: newStaff.department.filter(d => d !== dept) })}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="+2348012345678"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Administrator">Administrator</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Support Staff">Support Staff</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Security">Security</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Lab Technician">Lab Technician</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  setNewStaff({ first_name: '', last_name: '', email: '', department: [], phone: '', role: 'Teacher' })
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 active:bg-purple-700"
              >
                {saving ? 'Saving...' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Display Modal */}
      {showPinModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">{selectedStaff.first_name} {selectedStaff.last_name}</h2>
              <p className="text-sm text-gray-500 mb-4">Staff ID: {selectedStaff.staff_id}</p>
              
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">4-Digit PIN</p>
                <p className="text-3xl font-bold text-purple-600 tracking-widest">{selectedStaff.pin}</p>
              </div>
              
              <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mb-4">
                ⚠️ Save this PIN! Staff will use it for check-in if fingerprint fails.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedStaff.pin)
                    toast.success('PIN copied!')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
                >
                  Copy PIN
                </button>
                <button
                  onClick={() => {
                    setShowPinModal(false)
                    handleFaceEnrollment(selectedStaff)
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                >
                  Setup Face ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .hidden-mobile {
            display: none;
          }
        }
      `}</style>

      <div className="text-center py-4 text-gray-500 text-xs">
        <p className="mb-1">HOLYKIDS Staff Management System</p>
        <p className="text-gray-400">Created by Olushola Paul Odunuga</p>
      </div>
    </div>
  )
}
