import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { staff_id, all_staff } = await request.json()

    const supabase = getSupabaseClient()

    // If all_staff is true, get all registered fingerprints
    if (all_staff) {
      const { data: staffList, error } = await supabase
        .from('staff')
        .select('id, biometric_credential_id')
        .eq('is_active', true)
        .not('biometric_credential_id', 'is', null)

      if (error || !staffList || staffList.length === 0) {
        return NextResponse.json(
          { error: 'No registered fingerprints found' },
          { status: 404 }
        )
      }

      // Generate random challenge
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      const challengeBase64 = btoa(String.fromCharCode(...challenge))

      return NextResponse.json({
        challenge: challengeBase64,
        credentials: staffList.map(s => ({
          id: s.biometric_credential_id
        }))
      })
    }

    // Get specific staff's credentials
    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    // Get staff's registered credentials
    const { data: staff, error } = await supabase
      .from('staff')
      .select('biometric_credential_id')
      .eq('id', staff_id)
      .single()

    if (error || !staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      )
    }

    if (!staff.biometric_credential_id) {
      return NextResponse.json(
        { error: 'No fingerprint registered. Please register your fingerprint first.' },
        { status: 400 }
      )
    }

    // Generate random challenge
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    const challengeBase64 = btoa(String.fromCharCode(...challenge))

    return NextResponse.json({
      challenge: challengeBase64,
      credentials: [{
        id: staff.biometric_credential_id
      }]
    })

  } catch (error: any) {
    console.error('Challenge generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    )
  }
}
