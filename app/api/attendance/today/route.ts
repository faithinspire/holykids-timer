import { NextRequest, NextResponse } from 'next/server'
import { ServerAttendanceService } from '@/lib/serverAttendance'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staff_id = searchParams.get('staff_id')

    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const attendanceService = ServerAttendanceService.getInstance()
    const todayAttendance = await attendanceService.getTodayAttendance(staff_id)

    return NextResponse.json({
      success: true,
      data: todayAttendance
    })

  } catch (error: any) {
    console.error('Today attendance API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch today\'s attendance' },
      { status: 500 }
    )
  }
}