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

  } catch (error: any) {
    console.error('Fingerprint registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
