import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

function compareFaceEmbeddings(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0
  
  let sum = 0
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i]
    sum += diff * diff
  }
  
  const distance = Math.sqrt(sum)
  return Math.max(0, 1 - distance / 0.6)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { face_embedding, clock_type = 'check_in' } = body

    if (!face_embedding || !Array.isArray(face_embedding)) {
      return NextResponse.json(
        { success: false, error: 'Invalid face_embedding' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data: enrolledStaff, error: fetchError } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, department, face_embedding')
      .eq('face_enrolled', true)
      .eq('is_active', true)
      .not('face_embedding', 'is', null)

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!enrolledStaff || enrolledStaff.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No enrolled staff found' },
        { status: 404 }
      )
    }

    let bestMatch: any = null
    let highestSimilarity = 0

    for (const staff of enrolledStaff) {
      try {
        const storedEmbedding = JSON.parse(staff.face_embedding)
        const similarity = compareFaceEmbeddings(face_embedding, storedEmbedding)
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity
          bestMatch = {
            ...staff,
            confidence: similarity
          }
        }
      } catch (error) {
        continue
      }
    }

    const CONFIDENCE_THRESHOLD = 0.85
    
    if (!bestMatch || bestMatch.confidence < CONFIDENCE_THRESHOLD) {
      await supabase.from('failed_clock_attempts').insert({
        staff_id: bestMatch?.id || null,
        attempt_type: 'face',
        reason: `Low confidence: ${(highestSimilarity * 100).toFixed(1)}%`,
        attempted_at: new Date().toISOString()
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Face not recognized',
          confidence: highestSimilarity
        },
        { status: 401 }
      )
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', bestMatch.id)
      .eq('attendance_date', today)
      .single()

    if (clock_type === 'check_in') {
      if (existingAttendance?.check_in_time) {
        return NextResponse.json(
          { success: false, error: 'Already clocked in today' },
          { status: 400 }
        )
      }
      
      const clockInHour = now.getHours()
      const clockInMinute = now.getMinutes()
      const isLate = clockInHour > 8 || (clockInHour === 8 && clockInMinute > 0)

      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          staff_id: bestMatch.id,
          attendance_date: today,
          check_in_time: now.toISOString(),
          status: isLate ? 'present_late' : 'present',
          is_late: isLate,
          clock_method: 'face'
        })

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        staff: {
          id: bestMatch.id,
          full_name: `${bestMatch.first_name} ${bestMatch.last_name}`,
          department: bestMatch.department,
          check_in_time: now.toISOString(),
          is_late: isLate
        },
        confidence: bestMatch.confidence
      })
    } else {
      if (!existingAttendance) {
        return NextResponse.json(
          { success: false, error: 'Must clock in first' },
          { status: 400 }
        )
      }
      
      if (existingAttendance.check_out_time) {
        return NextResponse.json(
          { success: false, error: 'Already clocked out today' },
          { status: 400 }
        )
      }
      
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ check_out_time: now.toISOString() })
        .eq('id', existingAttendance.id)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        staff: {
          id: bestMatch.id,
          full_name: `${bestMatch.first_name} ${bestMatch.last_name}`,
          department: bestMatch.department,
          check_out_time: now.toISOString()
        },
        confidence: bestMatch.confidence
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
