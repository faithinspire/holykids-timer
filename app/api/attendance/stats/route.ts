import { NextRequest, NextResponse } from 'next/server'
import { AttendanceService } from '@/lib/attendance'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staff_id = searchParams.get('staff_id')
    const month = searchParams.get('month')

    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const attendanceService = AttendanceService.getInstance()
    const stats = await attendanceService.getAttendanceStats(staff_id, month || undefined)

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