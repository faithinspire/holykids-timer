import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logAudit } from '@/lib/auditLog'

export async function POST(request: NextRequest) {
  try {
    const { staff_id, face_embedding, pin_hash } = await request.json()

    if (!staff_id || !face_embedding || !pin_hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!Array.isArray(face_embedding)) {
      return NextResponse.json({ error: 'Invalid face_embedding' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('staff')
      .update({
        face_embedding: JSON.stringify(face_embedding),
        face_enrolled: true,
        face_enrolled_at: new Date().toISOString(),
        pin_hash
      })
      .eq('id', staff_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAudit({
      staff_id,
      action: 'face_enrolled',
      details: 'Face biometric enrolled successfully'
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, department, face_embedding')
      .eq('face_enrolled', true)
      .eq('is_active', true)
      .not('face_embedding', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const enrolled_faces = data?.map(s => ({
      id: s.id,
      staff_id: s.staff_id,
      name: `${s.first_name} ${s.last_name}`,
      department: s.department,
      embedding: JSON.parse(s.face_embedding)
    })) || []

    return NextResponse.json({ enrolled_faces })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
