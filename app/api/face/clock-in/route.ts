import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key || url === '=' || url.trim() === '' || !url.startsWith('http')) {
    return null
  }
  
  try {
    return createClient(url, key)
  } catch (error) {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staff_id, clock_type, method, device_id } = body

    if (!staff_id || !clock_type) {
      return NextResponse.json(
        { error: 'Staff ID and clock type are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get staff details
    let staffData: any = null
    
    if (supabase) {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staff_id)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
      }
      
      staffData = data
    } else {
      return NextResponse.json(
        { error: 'Database not configured. Please contact administrator.' },
        { status: 503 }
      )
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toISOString()

    // Check if already clocked in today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staff_id)
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
          staff_id,
          attendance_date: today,
          check_in_time: currentTime,
          status: isLate ? 'present_late' : 'present',
          is_late: isLate,
          clock_method: method || 'face',
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
          id: staffData.id,
          staff_id: staffData.staff_id,
          full_name: `${staffData.first_name} ${staffData.last_name}`,
          department: staffData.department,
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
          id: staffData.id,
          staff_id: staffData.staff_id,
          full_name: `${staffData.first_name} ${staffData.last_name}`,
          department: staffData.department,
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

// Log failed clock-in attempt
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { attempt_type, staff_id, reason, device_id } = body

    const supabase = createServerClient()

    if (!supabase) {
      return NextResponse.json({ success: true, warning: 'Local mode' })
    }

    await supabase
      .from('failed_clock_attempts')
      .insert({
        attempt_type,
        staff_id: staff_id || null,
        reason,
        device_id: device_id || null,
        attempted_at: new Date().toISOString()
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error logging failed attempt:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
