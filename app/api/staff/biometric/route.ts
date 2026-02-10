import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staff_id, biometric_id, device_info } = body

    if (!staff_id || !biometric_id) {
      return NextResponse.json(
        { error: 'Staff ID and biometric ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if staff exists
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name')
      .eq('id', staff_id)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Insert biometric credential
    const { data, error } = await supabase
      .from('biometric_credentials')
      .insert({
        staff_id: staff.id,
        credential_id: biometric_id,
        public_key: 'webauthn_key', // For WebAuthn
        device_info: device_info || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving biometric:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update staff to show biometric enrolled
    await supabase
      .from('staff')
      .update({ biometric_enrolled: true })
      .eq('id', staff.id)

    return NextResponse.json({
      success: true,
      message: 'Biometric enrolled successfully',
      staff: {
        id: staff.id,
        staff_id: staff.staff_id,
        first_name: staff.first_name,
        last_name: staff.last_name
      }
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const staff_id = searchParams.get('staff_id')

    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get staff details with biometric status
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*, biometric_credentials(*)')
      .eq('id', staff_id)
      .single()

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      staff,
      biometric_enrolled: staff.biometric_credentials?.length > 0
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
