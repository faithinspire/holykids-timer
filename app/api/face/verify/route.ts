import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Simple face detection using image analysis
// This is a placeholder - you'll need to integrate with a proper face recognition service
async function detectAndCompareFace(imageBase64: string): Promise<{
  detected: boolean
  embedding?: number[]
  confidence?: number
}> {
  try {
    // TODO: Integrate with face recognition service
    // Options:
    // 1. AWS Rekognition
    // 2. Azure Face API
    // 3. Google Cloud Vision
    // 4. face-recognition.js (Node.js)
    // 5. Python microservice with DeepFace
    
    // For now, return mock data
    // In production, this should call your face recognition service
    console.log('🔍 [SERVER] Analyzing face image...')
    
    // Mock embedding (128 dimensions)
    const mockEmbedding = Array.from({ length: 128 }, () => Math.random())
    
    return {
      detected: true,
      embedding: mockEmbedding,
      confidence: 0.92
    }
  } catch (error) {
    console.error('❌ [SERVER] Face detection error:', error)
    return { detected: false }
  }
}

function compareFaceEmbeddings(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0
  
  let sum = 0
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i]
    sum += diff * diff
  }
  
  const distance = Math.sqrt(sum)
  const similarity = Math.max(0, 1 - distance / 0.6)
  return similarity
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, clock_type = 'check_in' } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    console.log('📥 [SERVER] Received face verification request')

    // Step 1: Detect face and extract embedding
    const faceResult = await detectAndCompareFace(image)
    
    if (!faceResult.detected || !faceResult.embedding) {
      return NextResponse.json(
        { success: false, error: 'No face detected in image' },
        { status: 400 }
      )
    }

    console.log('✅ [SERVER] Face detected, comparing with enrolled staff...')

    // Step 2: Get all enrolled staff
    const { data: enrolledStaff, error: fetchError } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, department, face_embedding')
      .eq('face_enrolled', true)
      .not('face_embedding', 'is', null)

    if (fetchError) {
      console.error('❌ [SERVER] Database error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }

    if (!enrolledStaff || enrolledStaff.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No enrolled staff found' },
        { status: 404 }
      )
    }

    console.log(`🔍 [SERVER] Comparing against ${enrolledStaff.length} enrolled staff...`)

    // Step 3: Find best match
    let bestMatch: any = null
    let highestSimilarity = 0

    for (const staff of enrolledStaff) {
      try {
        const storedEmbedding = JSON.parse(staff.face_embedding)
        const similarity = compareFaceEmbeddings(faceResult.embedding, storedEmbedding)
        
        console.log(`  - ${staff.first_name} ${staff.last_name}: ${(similarity * 100).toFixed(1)}%`)
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity
          bestMatch = {
            ...staff,
            confidence: similarity
          }
        }
      } catch (error) {
        console.error(`❌ [SERVER] Error comparing with ${staff.first_name}:`, error)
      }
    }

    // Step 4: Check confidence threshold (85%)
    const CONFIDENCE_THRESHOLD = 0.85
    
    if (!bestMatch || bestMatch.confidence < CONFIDENCE_THRESHOLD) {
      console.log(`❌ [SERVER] No match found (best: ${(highestSimilarity * 100).toFixed(1)}%)`)
      
      // Log failed attempt
      await supabase.from('failed_clock_attempts').insert({
        staff_id: bestMatch?.id || null,
        attempt_type: 'face',
        reason: `Low confidence: ${(highestSimilarity * 100).toFixed(1)}%`,
        device_id: request.headers.get('user-agent') || 'unknown'
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Face not recognized. Please try again or use PIN.',
          confidence: highestSimilarity
        },
        { status: 401 }
      )
    }

    console.log(`✅ [SERVER] Match found: ${bestMatch.first_name} ${bestMatch.last_name} (${(bestMatch.confidence * 100).toFixed(1)}%)`)

    // Step 5: Record attendance
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Check if already clocked in/out today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', bestMatch.id)
      .gte('date', today)
      .lte('date', today)
      .single()

    let attendanceData: any = {
      staff_id: bestMatch.id,
      date: today,
      clock_method: 'face',
      device_id: request.headers.get('user-agent') || 'unknown',
      clock_type: clock_type
    }

    if (clock_type === 'check_in') {
      if (existingAttendance?.clock_in_time) {
        return NextResponse.json(
          { success: false, error: 'Already clocked in today' },
          { status: 400 }
        )
      }
      
      attendanceData.clock_in_time = now.toISOString()
      
      // Check if late (after 8:00 AM)
      const clockInHour = now.getHours()
      const clockInMinute = now.getMinutes()
      attendanceData.is_late = clockInHour > 8 || (clockInHour === 8 && clockInMinute > 0)
    } else {
      if (!existingAttendance) {
        return NextResponse.json(
          { success: false, error: 'Must clock in first' },
          { status: 400 }
        )
      }
      
      if (existingAttendance.clock_out_time) {
        return NextResponse.json(
          { success: false, error: 'Already clocked out today' },
          { status: 400 }
        )
      }
      
      // Update existing record
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          clock_out_time: now.toISOString(),
          clock_method: 'face'
        })
        .eq('id', existingAttendance.id)

      if (updateError) {
        console.error('❌ [SERVER] Update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to record clock out' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        staff: {
          id: bestMatch.id,
          full_name: `${bestMatch.first_name} ${bestMatch.last_name}`,
          department: bestMatch.department,
          clock_out_time: now.toISOString()
        },
        confidence: bestMatch.confidence
      })
    }

    // Insert new attendance record (check-in)
    const { error: insertError } = await supabase
      .from('attendance')
      .insert(attendanceData)

    if (insertError) {
      console.error('❌ [SERVER] Insert error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to record attendance' },
        { status: 500 }
      )
    }

    console.log('✅ [SERVER] Attendance recorded successfully')

    return NextResponse.json({
      success: true,
      staff: {
        id: bestMatch.id,
        full_name: `${bestMatch.first_name} ${bestMatch.last_name}`,
        department: bestMatch.department,
        clock_in_time: attendanceData.clock_in_time,
        is_late: attendanceData.is_late
      },
      confidence: bestMatch.confidence
    })

  } catch (error: any) {
    console.error('❌ [SERVER] Verification error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}
