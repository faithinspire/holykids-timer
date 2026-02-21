import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { pin_hash } = await request.json()

    if (!pin_hash) {
      return NextResponse.json(
        { success: false, error: 'PIN is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Get all active staff with PINs
    const { data: staffList, error: fetchError } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, pin, is_active')
      .eq('is_active', true)
      .not('pin', 'is', null)

    if (fetchError || !staffList || staffList.length === 0) {
      console.error('Staff lookup error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // Find staff by matching PIN hash
    let matchedStaff = null
    for (const staff of staffList) {
      // Hash the stored PIN for comparison
      const encoder = new TextEncoder()
      const data = encoder.encode(staff.pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const storedPinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      if (pin_hash === storedPinHash) {
        matchedStaff = staff
        break
      }
    }

    if (!matchedStaff) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // PIN verified successfully
    return NextResponse.json({
      success: true,
      staff_id: matchedStaff.id,
      staff_name: `${matchedStaff.first_name} ${matchedStaff.last_name}`
    })

  } catch (error: any) {
    console.error('PIN verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
