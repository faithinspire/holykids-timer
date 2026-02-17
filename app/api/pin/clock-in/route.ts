import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import crypto from 'crypto'

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { staff_number, pin, clock_type } = await request.json()

    if (!staff_number || !pin || !clock_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const pinHash = hashPin(pin)

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', staff_number)
      .eq('is_active', true)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const pinMatches = staff.pin_hash ? staff.pin_hash === pinHash : staff.pin === pin

    if (!pinMatches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staff.id)
      .eq('attendance_date', today)
      .single()

    if (clock_type === 'check_in') {
      if (existing?.check_in_time) {
        return NextResponse.json({ error: 'Already clocked in' }, { status: 400 })
      }

      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0)

      const { error } = await supabase
        .from('attendance')
        .insert({
          staff_id: staff.id,
          attendance_date: today,
          check_in_time: now.toISOString(),
          status: isLate ? 'present_late' : 'present',
          is_late: isLate,
          clock_method: 'pin'
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        staff: {
          id: staff.id,
          staff_id: staff.staff_id,
          full_name: `${staff.first_name} ${staff.last_name}`,
          department: staff.department,
          check_in_time: now.toISOString(),
          is_late: isLate
        }
      })
    } else {
      if (!existing) {
        return NextResponse.json({ error: 'No check-in found' }, { status: 400 })
      }

      if (existing.check_out_time) {
        return NextResponse.json({ error: 'Already clocked out' }, { status: 400 })
      }

      const { error } = await supabase
        .from('attendance')
        .update({ check_out_time: now.toISOString() })
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        staff: {
          id: staff.id,
          staff_id: staff.staff_id,
          full_name: `${staff.first_name} ${staff.last_name}`,
          department: staff.department,
          check_out_time: now.toISOString()
        }
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
