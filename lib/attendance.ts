export interface AttendanceRecord {
  id: string
  staff_id: string
  staff_name?: string
  staff_department?: string
  check_in_time?: string
  check_out_time?: string
  date: string
  status: string
}

export class AttendanceService {
  private static instance: AttendanceService

  static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService()
    }
    return AttendanceService.instance
  }

  getTodayAttendance(): AttendanceRecord[] {
    const today = new Date().toISOString().split('T')[0]
    const records = localStorage.getItem('holykids_attendance')
    if (!records) return []
    
    const allRecords: AttendanceRecord[] = JSON.parse(records)
    return allRecords.filter(r => r.date === today)
  }

  checkIn(staffId: string, staffName: string, department: string): AttendanceRecord {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()
    
    const record: AttendanceRecord = {
      id: Date.now().toString(),
      staff_id: staffId,
      staff_name: staffName,
      staff_department: department,
      check_in_time: now,
      date: today,
      status: 'present'
    }
    
    const records = this.getTodayAttendance()
    records.push(record)
    localStorage.setItem('holykids_attendance', JSON.stringify(records))
    
    return record
  }

  checkOut(staffId: string): AttendanceRecord | null {
    const records = this.getTodayAttendance()
    const record = records.find(r => r.staff_id === staffId)
    
    if (record) {
      record.check_out_time = new Date().toISOString()
      localStorage.setItem('holykids_attendance', JSON.stringify(records))
    }
    
    return record || null
  }
}
