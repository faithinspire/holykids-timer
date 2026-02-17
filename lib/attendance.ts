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

  getTodayAttendance(staffId?: string): AttendanceRecord[] {
    const today = new Date().toISOString().split('T')[0]
    const records = localStorage.getItem('holykids_attendance')
    if (!records) return []
    
    const allRecords: AttendanceRecord[] = JSON.parse(records)
    const todayRecords = allRecords.filter(r => r.date === today)
    
    if (staffId) {
      return todayRecords.filter(r => r.staff_id === staffId)
    }
    
    return todayRecords
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
      
      const record: AttendanceRecord = {
        id: Date.now().toString(),
        staff_id: data.staff_id,
        staff_name: data.staff_name,
        staff_department: '',
        check_in_time: data.timestamp,
        date: today,
        status: 'present'
      }
      
      const allRecords = localStorage.getItem('holykids_attendance')
      const records: AttendanceRecord[] = allRecords ? JSON.parse(allRecords) : []
      records.push(record)
      localStorage.setItem('holykids_attendance', JSON.stringify(records))
      
      return { success: true, record }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
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
