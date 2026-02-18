// Server-side attendance service - NO browser APIs
// This file is safe to import in API routes and server components

import { getSupabaseClient } from '@/lib/supabase'
import { AttendanceRecord } from '@/types'

const supabase = getSupabaseClient()

export class ServerAttendanceService {
  private static instance: ServerAttendanceService

  static getInstance(): ServerAttendanceService {
    if (!ServerAttendanceService.instance) {
      ServerAttendanceService.instance = new ServerAttendanceService()
    }
    return ServerAttendanceService.instance
  }

  async getTodayAttendance(staffId?: string): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      if (!supabase) {
        // Return empty array if Supabase not configured
        return []
      }

      let query = supabase
        .from('attendance')
        .select('*')
        .eq('attendance_date', today)
        .order('check_in_time', { ascending: false })

      if (staffId) {
        query = query.eq('staff_id', staffId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching attendance:', error)
        return []
      }

      return (data || []).map(record => ({
        id: record.id,
        staff_id: record.staff_id,
        staff_name: record.staff_name,
        staff_department: record.staff_department,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        date: record.attendance_date,
        status: record.status || 'present',
        is_late: record.is_late || false
      }))
    } catch (error) {
      console.error('getTodayAttendance error:', error)
      return []
    }
  }

  async checkIn(data: {
    staff_id: string
    staff_name?: string
    timestamp: string
    method?: string
    location?: string
    device_info?: any
    credential_used?: string
  }): Promise<{ success: boolean; record?: AttendanceRecord; error?: string }> {
    try {
      const today = new Date(data.timestamp).toISOString().split('T')[0]

      if (!supabase) {
        return {
          success: false,
          error: 'Database not configured'
        }
      }

      // Check if already checked in today
      const existing = await this.getTodayAttendance(data.staff_id)
      if (existing.length > 0 && existing[0].check_in_time) {
        return {
          success: false,
          error: 'Already checked in today'
        }
      }

      const record = {
        staff_id: data.staff_id,
        staff_name: data.staff_name,
        staff_department: '',
        attendance_date: today,
        check_in_time: data.timestamp,
        status: 'present',
        method: data.method,
        location: data.location
      }

      const { data: inserted, error } = await supabase
        .from('attendance')
        .insert([record])
        .select()
        .single()

      if (error) {
        console.error('Check-in error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        record: {
          id: inserted.id,
          staff_id: inserted.staff_id,
          staff_name: inserted.staff_name,
          staff_department: inserted.staff_department,
          check_in_time: inserted.check_in_time,
          check_out_time: inserted.check_out_time,
          date: inserted.attendance_date,
          status: inserted.status,
          is_late: inserted.is_late || false
        }
      }
    } catch (error: any) {
      console.error('checkIn error:', error)
      return {
        success: false,
        error: error.message || 'Check-in failed'
      }
    }
  }

  async checkOut(staffId: string): Promise<{ success: boolean; record?: AttendanceRecord; error?: string }> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Database not configured'
        }
      }

      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      const { data: updated, error } = await supabase
        .from('attendance')
        .update({ check_out_time: now })
        .eq('staff_id', staffId)
        .eq('attendance_date', today)
        .select()
        .single()

      if (error) {
        console.error('Check-out error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      if (!updated) {
        return {
          success: false,
          error: 'No check-in record found for today'
        }
      }

      return {
        success: true,
        record: {
          id: updated.id,
          staff_id: updated.staff_id,
          staff_name: updated.staff_name,
          staff_department: updated.staff_department,
          check_in_time: updated.check_in_time,
          check_out_time: updated.check_out_time,
          date: updated.attendance_date,
          status: updated.status,
          is_late: updated.is_late || false
        }
      }
    } catch (error: any) {
      console.error('checkOut error:', error)
      return {
        success: false,
        error: error.message || 'Check-out failed'
      }
    }
  }
}
