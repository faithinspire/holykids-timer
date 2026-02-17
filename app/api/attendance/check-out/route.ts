import { NextRequest, NextResponse } from 'next/server'
import { ServerAttendanceService } from '@/lib/serverAttendance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staff_id } = body

    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const attendanceService = ServerAttendanceService.getInstance()

    // Check if checked in today
    const todayRecords = await attendanceService.getTodayAttendance(staff_id)
    if (todayRecords.length === 0 || !todayRecords[0].check_in_time) {
      return NextResponse.json(
        { error: 'No check-in found for today. Please check in first.' },
        { status: 400 }
      )
    }

    // Check if already checked out
    if (todayRecords[0].check_out_time) {
      return NextResponse.json(
        { error: 'Already checked out today' },
        { status: 400 }
      )
    }

    // Record check-out
    const result = await attendanceService.checkOut(staff_id)

    if (result.success && result.record) {
      return NextResponse.json({
        success: true,
        message: 'Check-out successful',
        data: result.record
      })
    }

    return NextResponse.json(
      { error: result.error || 'Check-out failed' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Check-out API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process check-out' },
      { status: 500 }
    )
  }
}
