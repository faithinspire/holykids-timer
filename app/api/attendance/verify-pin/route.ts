import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { staff_number, pin_hash } = await request.json()

    if (!staff_number || !pin_hash) {
      return NextResponse.json(
        { success: false, error: 'Staff number and PIN are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Find staff by staff_number (e.g., STF0001)
    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, pin, is_active')
      .eq('staff_id', staff_number)
      .eq('is_active', true)
      .single()

    if (error || !staff) {
      console.error('Staff lookup error:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid staff number or PIN' },
        { status: 401 }
      )
    }

    // Hash the stored PIN for comparison
    const encoder = new TextEncoder()
    const data = encoder.encode(staff.pin)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const storedPinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Compare hashes
    if (pin_hash !== storedPinHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid staff number or PIN' },
        { status: 401 }
      )
    }

    // PIN verified successfully
    return NextResponse.json({
      success: true,
      staff_id: staff.id,
      staff_name: `${staff.first_name} ${staff.last_name}`
    })

  } catch (error: any) {
    console.error('PIN verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
