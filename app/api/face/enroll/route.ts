import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staff_id, face_embedding, pin_hash } = body

    if (!staff_id || !face_embedding || !pin_hash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Array.isArray(face_embedding)) {
      return NextResponse.json(
        { success: false, error: 'face_embedding must be an array' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('staff')
      .update({
        face_embedding: JSON.stringify(face_embedding),
        face_enrolled: true,
        face_enrolled_at: new Date().toISOString(),
        pin_hash: pin_hash
      })
      .eq('id', staff_id)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Face enrolled successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data: enrolledStaff, error } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, department, face_embedding')
      .eq('face_enrolled', true)
      .not('face_embedding', 'is', null)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const enrolled_faces = enrolledStaff?.map(staff => ({
      id: staff.id,
      staff_id: staff.staff_id,
      name: `${staff.first_name} ${staff.last_name}`,
      department: staff.department,
      embedding: JSON.parse(staff.face_embedding)
    })) || []

    return NextResponse.json({
      success: true,
      enrolled_faces
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
