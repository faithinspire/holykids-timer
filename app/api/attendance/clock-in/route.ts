import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logAudit } from '@/lib/auditLog'

export async function POST(request: Request) {
  try {
    const { staff_id, credential_id } = await request.json()

    if (!staff_id || !credential_id) {
      return NextResponse.json(
        { success: false, error: 'Staff ID and credential are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Verify credential matches registered credential
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, biometric_credential_id')
      .eq('id', staff_id)
      .single()

    if (staffError || !staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      )
    }

    if (staff.biometric_credential_id !== credential_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid fingerprint' },
        { status: 401 }
      )
    }

    // Check if already clocked in today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id, check_in_time, check_out_time')
      .eq('staff_id', staff_id)
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
        staff_id: staff_id,
        check_in_time: new Date().toISOString(),
        auth_method: 'pin+fingerprint',
        staff_name: `${staff.first_name} ${staff.last_name}`,
        staff_number: staff.staff_id
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
      staff_id: staff_id,
      action: 'clock_in',
      details: `Clocked in using PIN + Fingerprint`
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
