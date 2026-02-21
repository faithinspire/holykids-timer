import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logAudit } from '@/lib/auditLog'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staff_id, step } = body

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Handle PIN setting
    if (step === 'set_pin') {
      const { pin } = body

      if (!pin || pin.length < 4 || pin.length > 6) {
        return NextResponse.json(
          { success: false, error: 'PIN must be 4-6 digits' },
          { status: 400 }
        )
      }

      // Check if PIN is already in use by another staff member
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('pin', pin)
        .neq('id', staff_id)
        .single()

      if (existingStaff) {
        return NextResponse.json(
          { success: false, error: 'This PIN is already in use. Please choose a different one.' },
          { status: 400 }
        )
      }

      // Update staff with PIN
      const { error } = await supabase
        .from('staff')
        .update({ pin })
        .eq('id', staff_id)

      if (error) {
        console.error('PIN update error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to set PIN' },
          { status: 500 }
        )
      }

      // Log audit
      logAudit({
        staff_id: staff_id,
        action: 'pin_set',
        details: 'Staff PIN created'
      }).catch(console.error)

      return NextResponse.json({
        success: true,
        message: 'PIN set successfully'
      })
    }

    // Handle fingerprint registration
    if (step === 'register_fingerprint') {
      const { credential_id } = body

      if (!credential_id) {
        return NextResponse.json(
          { success: false, error: 'Credential is required' },
          { status: 400 }
        )
      }

      // Update staff with credential ID
      const { data, error } = await supabase
        .from('staff')
        .update({
          biometric_credential_id: credential_id,
          biometric_enrolled: true
        })
        .eq('id', staff_id)
        .select()
        .single()

      if (error) {
        console.error('Fingerprint registration error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to register fingerprint' },
          { status: 500 }
        )
      }

      // Log audit
      logAudit({
        staff_id: staff_id,
        action: 'fingerprint_registered',
        details: 'Fingerprint credential registered'
      }).catch(console.error)

      return NextResponse.json({
        success: true,
        message: 'Fingerprint registered successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid step' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
