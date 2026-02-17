import { NextRequest, NextResponse } from 'next/server'
import { ServerAttendanceService } from '@/lib/serverAttendance'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staff_id = searchParams.get('staff_id')

    const attendanceService = ServerAttendanceService.getInstance()
    const records = await attendanceService.getTodayAttendance(staff_id || undefined)

    // Calculate basic stats
    const stats = {
      total_records: records.length,
      checked_in: records.filter(r => r.check_in_time).length,
      checked_out: records.filter(r => r.check_out_time).length
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    console.error('Attendance stats API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance stats' },
      { status: 500 }
    )
  }
}
