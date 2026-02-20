import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { staff_id } = await request.json()

    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, email')
      .eq('id', staff_id)
      .single()

    if (error || !staff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      )
    }

    // Generate random challenge
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Generate user ID
    const userIdBuffer = new TextEncoder().encode(staff.id)

    const options = {
      challenge: btoa(String.fromCharCode(...challenge)),
      rp: {
        name: 'HOLYKIDS Attendance',
        id: typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      },
      user: {
        id: btoa(String.fromCharCode(...userIdBuffer)),
        name: staff.email || staff.staff_id,
        displayName: `${staff.first_name} ${staff.last_name}`
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 } // RS256
      ]
    }

    return NextResponse.json(options)

  } catch (error: any) {
    console.error('Registration options error:', error)
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    )
  }
}
