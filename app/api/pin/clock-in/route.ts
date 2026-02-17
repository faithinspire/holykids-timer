import { getSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Hash PIN using SHA-256
function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staff_number, pin, clock_type, device_id } = body

    if (!staff_number || !pin || !clock_type) {
      return NextResponse.json(
        { error: 'Staff number, PIN, and clock type are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Hash the provided PIN
    const pinHash = hashPin(pin)

    // Find staff by staff_number and verify PIN
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', staff_number)
      .eq('is_active', true)
      .single()

    if (staffError || !staff) {
      // Log failed attempt
      await supabase
        .from('failed_clock_attempts')
        .insert({
          attempt_type: 'pin',
          reason: 'Invalid staff number',
          device_id: device_id || null,
          attempted_at: new Date().toISOString()
        })

      return NextResponse.json({ error: 'Invalid staff number or PIN' }, { status: 401 })
    }

    // Verify PIN hash
    // If pin_hash is null, fall back to plain PIN comparison (for backward compatibility)
    const pinMatches = staff.pin_hash 
      ? staff.pin_hash === pinHash 
      : staff.pin === pin

    if (!pinMatches) {
      // Log failed attempt
      await supabase
        .from('failed_clock_attempts')
        .insert({
          attempt_type: 'pin',
          staff_id: staff.id,
          reason: 'Incorrect PIN',
          device_id: device_id || null,
          attempted_at: new Date().toISOString()
        })

      return NextResponse.json({ error: 'Invalid staff number or PIN' }, { status: 401 })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toISOString()

    // Check if already clocked in/out today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staff.id)
      .eq('attendance_date', today)
      .single()

    if (clock_type === 'check_in') {
      if (existingAttendance && existingAttendance.check_in_time) {
        return NextResponse.json({
          error: 'Already clocked in today',
          existing: existingAttendance
        }, { status: 400 })
      }

      // Determine if late (after 8:00 AM)
      const checkInHour = now.getHours()
      const checkInMinute = now.getMinutes()
      const isLate = checkInHour > 8 || (checkInHour === 8 && checkInMinute > 0)

      // Create new attendance record
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          staff_id: staff.id,
          attendance_date: today,
          check_in_time: currentTime,
          status: isLate ? 'present_late' : 'present',
          is_late: isLate,
          clock_method: 'pin',
          clock_type: 'check_in',
          device_id: device_id || null
        })
        .select()
        .single()

      if (attendanceError) {
        console.error('Error creating attendance:', attendanceError)
        return NextResponse.json({ error: attendanceError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Clocked in successfully',
        staff: {
          id: staff.id,
          staff_id: staff.staff_id,
          full_name: `${staff.first_name} ${staff.last_name}`,
          department: staff.department,
          clock_in_time: currentTime,
          is_late: isLate
        },
        attendance
      })
    } else if (clock_type === 'check_out') {
      if (!existingAttendance) {
        return NextResponse.json({
          error: 'No check-in record found for today'
        }, { status: 400 })
      }

      if (existingAttendance.check_out_time) {
        return NextResponse.json({
          error: 'Already clocked out today',
          existing: existingAttendance
        }, { status: 400 })
      }

      // Update attendance with check-out time
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .update({
          check_out_time: currentTime
        })
        .eq('id', existingAttendance.id)
        .select()
        .single()

      if (attendanceError) {
        console.error('Error updating attendance:', attendanceError)
        return NextResponse.json({ error: attendanceError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Clocked out successfully',
        staff: {
          id: staff.id,
          staff_id: staff.staff_id,
          full_name: `${staff.first_name} ${staff.last_name}`,
          department: staff.department,
          check_out_time: currentTime
        },
        attendance
      })
    }

    return NextResponse.json({ error: 'Invalid clock type' }, { status: 400 })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
