// Shared type definitions for the attendance system

export interface CheckInData {
  staff_id: string
  staff_name?: string
  timestamp: string
  method?: 'pin' | 'face' | 'fingerprint' | 'manual'
  location?: string
  device_info?: {
    user_agent?: string
    ip_address?: string
    device_type?: string
  }
  credential_used?: string
}

export interface CheckOutData {
  staff_id: string
  timestamp: string
  location?: string
}

export interface AttendanceRecord {
  id: string
  staff_id: string
  staff_name?: string
  staff_department?: string
  date: string
  check_in_time: string
  check_out_time?: string
  status: 'present' | 'absent' | 'late' | 'present_late'
  is_late: boolean
  method?: string
  location?: string
}

export interface StaffMember {
  id: string
  staff_id: string
  first_name: string
  last_name: string
  email?: string
  department: string | string[]
  phone?: string
  role: string
  pin: string
  biometric_enrolled: boolean
  biometric_id?: string
  face_enrolled?: boolean
  is_active: boolean
  created_at?: string
}
