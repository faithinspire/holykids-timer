import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side face detection
async function detectFaceAndExtractEmbedding(imageBase64: string): Promise<{
  detected: boolean
  embedding?: number[]
}> {
  try {
    console.log('🔍 [SERVER] Detecting face in image...')
    
    // TODO: Integrate with face recognition service
    // For now, generate mock embedding (128 dimensions)
    const mockEmbedding = Array.from({ length: 128 }, () => Math.random())
    
    return {
      detected: true,
      embedding: mockEmbedding
    }
  } catch (error) {
    console.error('❌ [SERVER] Face detection error:', error)
    return { detected: false }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staff_id, image, pin_hash } = body

    if (!staff_id || !image || !pin_hash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('📥 [SERVER] Face enrollment request for staff:', staff_id)

    // Detect face and extract embedding on server
    const faceResult = await detectFaceAndExtractEmbedding(image)
    
    if (!faceResult.detected || !faceResult.embedding) {
      return NextResponse.json(
        { success: false, error: 'No face detected in image. Please try again with better lighting.' },
        { status: 400 }
      )
    }

    console.log('✅ [SERVER] Face detected, saving to database...')

    // Save to database
    const { error } = await supabase
      .from('staff')
      .update({
        face_embedding: JSON.stringify(faceResult.embedding),
        face_enrolled: true,
        face_enrolled_at: new Date().toISOString(),
        pin_hash: pin_hash
      })
      .eq('id', staff_id)

    if (error) {
      console.error('❌ [SERVER] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save enrollment' },
        { status: 500 }
      )
    }

    console.log('✅ [SERVER] Face enrolled successfully')

    return NextResponse.json({
      success: true,
      message: 'Face enrolled successfully'
    })

  } catch (error: any) {
    console.error('❌ [SERVER] Enrollment error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve enrolled faces
export async function GET() {
  try {
    const { data: enrolledStaff, error } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, department, face_embedding')
      .eq('face_enrolled', true)
      .not('face_embedding', 'is', null)

    if (error) throw error

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
    console.error('Error fetching enrolled faces:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
