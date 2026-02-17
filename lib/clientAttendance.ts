// Client-side attendance storage - BROWSER ONLY
// This file uses localStorage and should ONLY be imported by client components
// DO NOT import this in API routes or server components

'use client'

import { AttendanceRecord } from '@/types'

export class ClientAttendanceStorage {
  private static instance: ClientAttendanceStorage

  static getInstance(): ClientAttendanceStorage {
    if (!ClientAttendanceStorage.instance) {
      ClientAttendanceStorage.instance = new ClientAttendanceStorage()
    }
    return ClientAttendanceStorage.instance
  }

  getTodayAttendance(staffId?: string): AttendanceRecord[] {
    if (typeof window === 'undefined') return []
    
    const today = new Date().toISOString().split('T')[0]
    const records = localStorage.getItem('holykids_attendance')
    if (!records) return []
    
    try {
      const allRecords: AttendanceRecord[] = JSON.parse(records)
      const todayRecords = allRecords.filter(r => r.date === today)
      
      if (staffId) {
        return todayRecords.filter(r => r.staff_id === staffId)
      }
      
      return todayRecords
    } catch (error) {
      console.error('Error parsing attendance records:', error)
      return []
    }
  }

  getAllAttendance(): AttendanceRecord[] {
    if (typeof window === 'undefined') return []
    
    const records = localStorage.getItem('holykids_attendance')
    if (!records) return []
    
    try {
      return JSON.parse(records)
    } catch (error) {
      console.error('Error parsing attendance records:', error)
      return []
    }
  }

  saveAttendance(record: AttendanceRecord): void {
    if (typeof window === 'undefined') return
    
    try {
      const allRecords = this.getAllAttendance()
      allRecords.push(record)
      localStorage.setItem('holykids_attendance', JSON.stringify(allRecords))
    } catch (error) {
      console.error('Error saving attendance record:', error)
    }
  }

  updateCheckOut(staffId: string): AttendanceRecord | null {
    if (typeof window === 'undefined') return null
    
    try {
      const records = this.getTodayAttendance()
      const record = records.find(r => r.staff_id === staffId)
      
      if (record) {
        record.check_out_time = new Date().toISOString()
        
        // Update in storage
        const allRecords = this.getAllAttendance()
        const index = allRecords.findIndex(r => r.id === record.id)
        if (index !== -1) {
          allRecords[index] = record
          localStorage.setItem('holykids_attendance', JSON.stringify(allRecords))
        }
      }
      
      return record || null
    } catch (error) {
      console.error('Error updating check-out:', error)
      return null
    }
  }

  clearAll(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('holykids_attendance')
  }
}
