import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logAudit } from '@/lib/auditLog'

export async function POST(request: Request) {
  try {
    const { staff_id, credential_id, method } = await request.json()

    const supabase = getSupabaseClient()
    let staffData = null

    // Handle PIN-only authentication
    if (method === 'pin') {
      if (!staff_id) {
        return NextResponse.json(
          { success: false, error: 'Staff ID is required' },
          { status: 400 }
        )
      }

      // Get staff info
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, staff_id, first_name, last_name')
        .eq('id', staff_id)
        .single()

      if (staffError || !staff) {
        return NextResponse.json(
          { success: false, error: 'Staff not found' },
          { status: 404 }
        )
      }

      staffData = staff
    }
    // Handle fingerprint-only authentication
    else if (method === 'fingerprint') {
      if (!credential_id) {
        return NextResponse.json(
          { success: false, error: 'Credential is required' },
          { status: 400 }
        )
      }

      // Find staff by credential ID
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, staff_id, first_name, last_name, biometric_credential_id')
        .eq('biometric_credential_id', credential_id)
        .single()

      if (staffError || !staff) {
        return NextResponse.json(
          { success: false, error: 'Fingerprint not recognized' },
          { status: 404 }
        )
      }

      staffData = staff
    }
    else {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication method' },
        { status: 400 }
      )
    }

    // Check if already clocked in today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id, check_in_time, check_out_time')
      .eq('staff_id', staffData.id)
      .gte('check_in_time', `${today}T00:00:00`)
      .lte('check_in_time', `${today}T23:59:59`)
      .single()

    if (existingAttendance && !existingAttendance.check_out_time) {
      return NextResponse.json(
        { success: false, error: 'Already clocked in today' },
        { status: 400 }
      )
    }

    // Record clock-in
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        staff_id: staffData.id,
        check_in_time: new Date().toISOString(),
        auth_method: method,
        staff_name: `${staffData.first_name} ${staffData.last_name}`,
        staff_number: staffData.staff_id
      })
      .select()
      .single()

    if (attendanceError) {
      console.error('Attendance insert error:', attendanceError)
      return NextResponse.json(
        { success: false, error: 'Failed to record attendance' },
        { status: 500 }
      )
    }

    // Log audit
    logAudit({
      staff_id: staffData.id,
      action: 'clock_in',
      details: `Clocked in using ${method}`
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Clocked in successfully',
      attendance_id: attendance.id,
      check_in_time: attendance.check_in_time
    })

  } catch (error: any) {
    console.error('Clock-in error:', error)
    return NextResponse.json(
      { success: false, error: 'Clock-in failed' },
      { status: 500 }
    )
  }
}
