import { getSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staff_id, fingerprint_id } = body

    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Update staff biometric enrollment in Supabase
    const { data, error } = await supabase
      .from('staff')
      .update({
        biometric_enrolled: true,
        fingerprint_id: fingerprint_id || `fp_${staff_id}_${Date.now()}`,
        enrolled_at: new Date().toISOString()
      })
      .eq('id', staff_id)
      .select()
      .single()

    if (error) {
      console.error('Error enrolling biometric:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      staff: data,
      message: 'Biometric enrolled successfully'
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Database configuration error' },
      { status: 500 }
    )
  }
}
