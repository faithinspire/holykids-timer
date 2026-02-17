import { getSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staff_id, clock_type, method = 'face' } = body

    if (!staff_id || !clock_type) {
      return NextResponse.json(
        { error: 'Staff ID and clock type are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staff_id)
      .eq('is_active', true)
      .single()

    if (staffError || !staffData) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('attendance_date', today)
      .single()

    if (clock_type === 'check_in') {
      if (existingAttendance && existingAttendance.check_in_time) {
        return NextResponse.json(
          { error: 'Already clocked in today', existing: existingAttendance },
          { status: 400 }
        )
      }

      const checkInHour = now.getHours()
      const checkInMinute = now.getMinutes()
      const isLate = checkInHour > 8 || (checkInHour === 8 && checkInMinute > 0)

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          staff_id,
          attendance_date: today,
          check_in_time: now.toISOString(),
          status: isLate ? 'present_late' : 'present',
          is_late: isLate,
          clock_method: method
        })
        .select()
        .single()

      if (attendanceError) {
        return NextResponse.json(
          { error: attendanceError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Clocked in successfully',
        staff: {
          id: staffData.id,
          staff_id: staffData.staff_id,
          full_name: `${staffData.first_name} ${staffData.last_name}`,
          department: staffData.department,
          clock_in_time: now.toISOString(),
          is_late: isLate
        },
        attendance
      })
    } else if (clock_type === 'check_out') {
      if (!existingAttendance) {
        return NextResponse.json(
          { error: 'No check-in record found for today' },
          { status: 400 }
        )
      }

      if (existingAttendance.check_out_time) {
        return NextResponse.json(
          { error: 'Already clocked out today', existing: existingAttendance },
          { status: 400 }
        )
      }

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .update({ check_out_time: now.toISOString() })
        .eq('id', existingAttendance.id)
        .select()
        .single()

      if (attendanceError) {
        return NextResponse.json(
          { error: attendanceError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Clocked out successfully',
        staff: {
          id: staffData.id,
          staff_id: staffData.staff_id,
          full_name: `${staffData.first_name} ${staffData.last_name}`,
          department: staffData.department,
          check_out_time: now.toISOString()
        },
        attendance
      })
    }

    return NextResponse.json(
      { error: 'Invalid clock type' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { attempt_type, staff_id, reason } = body

    const supabase = getSupabaseClient()

    await supabase.from('failed_clock_attempts').insert({
      attempt_type,
      staff_id: staff_id || null,
      reason,
      attempted_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
