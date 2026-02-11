import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key || url === '=' || url.trim() === '' || !url.startsWith('http')) {
    console.warn('Supabase not configured')
    return null
  }
  
  try {
    return createClient(url, key)
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staff_id, face_embedding, pin_hash } = body

    if (!staff_id || !face_embedding) {
      return NextResponse.json(
        { error: 'Staff ID and face embedding are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // If Supabase not configured, save to localStorage
    if (!supabase) {
      console.log('Supabase not configured, face enrollment will be stored locally')
      return NextResponse.json({
        success: true,
        message: 'Face enrolled locally',
        warning: 'Cloud storage not configured. Data saved to browser only.',
        staff_id
      })
    }

    // Convert embedding array to JSON string for storage
    const embeddingJson = JSON.stringify(face_embedding)

    // Update staff record with face embedding
    const { data, error } = await supabase
      .from('staff')
      .update({
        face_embedding: embeddingJson,
        face_enrolled: true,
        face_enrolled_at: new Date().toISOString(),
        pin_hash: pin_hash || null
      })
      .eq('id', staff_id)
      .select()
      .single()

    if (error) {
      console.error('Error enrolling face:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Face enrolled successfully',
      staff: {
        id: data.id,
        staff_id: data.staff_id,
        first_name: data.first_name,
        last_name: data.last_name,
        department: data.department,
        face_enrolled: data.face_enrolled
      }
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get all enrolled faces for matching
export async function GET() {
  try {
    const supabase = createServerClient()

    if (!supabase) {
      return NextResponse.json({ enrolled_faces: [], warning: 'Using local storage only' })
    }

    // Fetch all staff with face enrolled
    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, department, face_embedding')
      .eq('face_enrolled', true)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching enrolled faces:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Parse face embeddings from JSON strings
    const enrolledFaces = (staff || []).map(s => ({
      id: s.id,
      staff_id: s.staff_id,
      name: `${s.first_name} ${s.last_name}`,
      department: s.department,
      embedding: s.face_embedding ? JSON.parse(s.face_embedding) : null
    })).filter(s => s.embedding !== null)

    return NextResponse.json({ enrolled_faces: enrolledFaces })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
