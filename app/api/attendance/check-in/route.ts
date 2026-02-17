import { NextRequest, NextResponse } from 'next/server'
import { ServerAttendanceService } from '@/lib/serverAttendance'
import { CheckInData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staff_id, staff_name, timestamp, method, location, device_info, credential_used }: CheckInData = body

    if (!staff_id || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const attendanceService = ServerAttendanceService.getInstance()

    // Check if already checked in today
    const todayRecords = await attendanceService.getTodayAttendance(staff_id)
    if (todayRecords.length > 0 && todayRecords[0].check_in_time) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      )
    }

    // Record check-in
    const checkInData: CheckInData = {
      staff_id,
      staff_name,
      timestamp,
      method,
      location,
      device_info: {
        ...device_info,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      },
      credential_used
    }

    const result = await attendanceService.checkIn(checkInData)

    if (result.success && result.record) {
      return NextResponse.json({
        success: true,
        message: 'Check-in successful',
        data: result.record
      })
    }

    return NextResponse.json(
      { error: result.error || 'Check-in failed' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Check-in API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process check-in' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staff_id = searchParams.get('staff_id')

    const attendanceService = ServerAttendanceService.getInstance()
    const records = await attendanceService.getTodayAttendance(staff_id || undefined)

    return NextResponse.json({
      success: true,
      data: records
    })
  } catch (error: any) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}
