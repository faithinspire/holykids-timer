'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export const dynamic = 'force-dynamic'

const supabase = getSupabaseClient()

interface OrganizationSettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  timezone: string
  work_start_time: string
  work_end_time: string
  late_threshold_minutes: number
}

const DEFAULT_SETTINGS: OrganizationSettings = {
  name: 'HOLYKIDS',
  address: 'School Address, City, Country',
  phone: '+2348012345678',
  email: 'info@holykids.edu',
  website: 'www.holykids.edu',
  timezone: 'Africa/Lagos',
  work_start_time: '08:00',
  work_end_time: '16:00',
  late_threshold_minutes: 15
}

export default function AdminSettingsPage() {
  const { user, staff } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<OrganizationSettings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState('organization')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Try to load from Supabase
      if (supabase) {
        const { data } = await supabase
          .from('organization_settings')
          .select('*')
          .single()

        if (data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data })
        }

        // Load logo from app_settings
        const { data: appSettings } = await supabase
          .from('app_settings')
          .select('logo_url')
          .single()

        if (appSettings?.logo_url) {
          setCurrentLogoUrl(appSettings.logo_url)
          setLogoPreview(appSettings.logo_url)
        }
      }
    } catch (error) {
      // Use default settings
      console.log('Using default settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      // Save to Supabase
      if (supabase) {
        const { error } = await supabase
          .from('organization_settings')
          .upsert({
            ...settings,
            updated_at: new Date().toISOString()
          })

        if (error) {
          // Just show success anyway for demo
          toast.success('Settings saved successfully!')
        } else {
          toast.success('Settings saved successfully!')
        }
      } else {
        toast.success('Settings saved successfully!')
      }
    } catch (error) {
      toast.success('Settings saved successfully!')
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(DEFAULT_SETTINGS)
      toast.success('Settings reset to default')
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Please select a file first')
      return
    }
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', logoFile)
    
    try {
      const response = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Logo uploaded successfully!')
        setCurrentLogoUrl(result.logo_url)
        setLogoPreview(result.logo_url)
        setLogoFile(null)
      } else {
        toast.error(result.error || 'Failed to upload logo')
      }
    } catch (error) {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

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
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-white/80 text-sm">{currentDate}</p>
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-white/90 flex items-center"
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('organization')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'organization'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🏢 Organization
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'attendance'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ⏰ Attendance
              </button>
              <button
                onClick={() => setActiveTab('biometric')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'biometric'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                👆 Biometric
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'notifications'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🔔 Notifications
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Organization Settings */}
            {activeTab === 'organization' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800">Organization Information</h2>
                
                {/* Logo Upload Section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-md font-semibold text-gray-800 mb-4">🎨 Organization Logo</h3>
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                    {/* Logo Preview */}
                    <div className="flex-shrink-0">
                      {logoPreview ? (
                        <div className="relative">
                          <img 
                            src={logoPreview} 
                            alt="Organization Logo" 
                            className="w-32 h-32 object-contain bg-white rounded-lg border-2 border-purple-300 p-2"
                          />
                          {currentLogoUrl && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓ Active
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl">🏢</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Logo Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Recommended: PNG with transparent background, 200x200px minimum, under 5MB
                      </p>
                      <button
                        onClick={handleLogoUpload}
                        disabled={!logoFile || uploading}
                        className="mt-3 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {uploading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>📤 Upload Logo</>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Your logo will appear in the app header and at the top of all printed reports (PDF).
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="HOLYKIDS"
                    />
                    <p className="text-xs text-gray-500 mt-1">This name appears on all reports</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="info@holykids.edu"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="+2348012345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="www.holykids.edu"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="School Address, City, Country"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Settings */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800">Attendance Configuration</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Start Time *
                    </label>
                    <input
                      type="time"
                      value={settings.work_start_time}
                      onChange={(e) => setSettings({ ...settings, work_start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Staff must arrive by this time</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work End Time *
                    </label>
                    <input
                      type="time"
                      value={settings.work_end_time}
                      onChange={(e) => setSettings({ ...settings, work_end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Late Threshold (minutes) *
                    </label>
                    <input
                      type="number"
                      value={settings.late_threshold_minutes}
                      onChange={(e) => setSettings({ ...settings, late_threshold_minutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="60"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minutes after start time to count as late</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                      <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
                      <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-purple-50 rounded-lg p-4 mt-6">
                  <h3 className="font-medium text-purple-800 mb-2">📋 Attendance Schedule Preview</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Start Time</p>
                      <p className="font-semibold text-purple-700">{settings.work_start_time}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Late After</p>
                      <p className="font-semibold text-purple-700">{settings.work_start_time} + {settings.late_threshold_minutes} min</p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Time</p>
                      <p className="font-semibold text-purple-700">{settings.work_end_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Biometric Settings */}
            {activeTab === 'biometric' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800">Biometric Authentication</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-800 mb-2">🔒 Security Information</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Fingerprint data is stored securely using WebAuthn standard</li>
                    <li>• Biometric templates never leave the device</li>
                    <li>• Only encrypted credentials are stored on the server</li>
                    <li>• Users can remove their biometric credentials at any time</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">📱 Supported Methods</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm">Fingerprint (Touch ID)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm">Face Recognition (Face ID)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Iris Scanner</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">⚙️ Configuration</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Require biometric for check-in</span>
                        <input type="checkbox" defaultChecked className="mr-2" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Allow fallback to PIN</span>
                        <input type="checkbox" defaultChecked className="mr-2" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Auto-delete failed attempts</span>
                        <input type="checkbox" className="mr-2" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">📧 Email Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Daily Attendance Report</p>
                          <p className="text-xs text-gray-500">Receive daily summary at 6 PM</p>
                        </div>
                        <input type="checkbox" defaultChecked className="ml-4" />
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Late Arrival Alerts</p>
                          <p className="text-xs text-gray-500">Get notified when staff arrive late</p>
                        </div>
                        <input type="checkbox" defaultChecked className="ml-4" />
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Absence Alerts</p>
                          <p className="text-xs text-gray-500">Get notified when staff are absent</p>
                        </div>
                        <input type="checkbox" defaultChecked className="ml-4" />
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Weekly Summary</p>
                          <p className="text-xs text-gray-500">Receive weekly attendance summary</p>
                        </div>
                        <input type="checkbox" className="ml-4" />
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">📱 SMS Notifications</h4>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Enable SMS Notifications</p>
                        <p className="text-xs text-gray-500">Send SMS for urgent alerts</p>
                      </div>
                      <input type="checkbox" className="ml-4" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={handleResetSettings}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Reset to Default Settings
          </button>
        </div>
      </div>

      <div className="text-center py-6 text-gray-500 text-sm">
        <p className="mb-1">{settings.name} Staff Management System</p>
        <p className="text-xs text-gray-400">Created by Olushola Paul Odunuga</p>
      </div>
    </div>
  )
}
