import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logAudit } from '@/lib/auditLog'

export async function POST(request: NextRequest) {
  try {
    const { face_embedding, clock_type = 'check_in' } = await request.json()

    if (!face_embedding || !Array.isArray(face_embedding)) {
      return NextResponse.json({ error: 'Invalid face_embedding' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data: enrolledStaff, error: fetchError } = await supabase
      .from('staff')
      .select('id, staff_id, first_name, last_name, department, face_embedding')
      .eq('face_enrolled', true)
      .eq('is_active', true)
      .not('face_embedding', 'is', null)

    if (fetchError || !enrolledStaff || enrolledStaff.length === 0) {
      return NextResponse.json({ error: 'No enrolled faces found' }, { status: 404 })
    }

    let bestMatch: any = null
    let bestDistance = Infinity
    const MATCH_THRESHOLD = 0.6

    for (const staff of enrolledStaff) {
      try {
        const storedEmbedding = JSON.parse(staff.face_embedding)
        const distance = euclideanDistance(face_embedding, storedEmbedding)
        
        if (distance < bestDistance && distance < MATCH_THRESHOLD) {
          bestDistance = distance
          bestMatch = staff
        }
      } catch (e) {
        continue
      }
    }

    if (!bestMatch) {
      return NextResponse.json({ error: 'Face not recognized' }, { status: 404 })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', bestMatch.id)
      .eq('attendance_date', today)
      .single()

    if (clock_type === 'check_in') {
      if (existing?.check_in_time) {
        return NextResponse.json({ error: 'Already clocked in' }, { status: 400 })
      }

      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0)

      const { error } = await supabase
        .from('attendance')
        .insert({
          staff_id: bestMatch.id,
          attendance_date: today,
          check_in_time: now.toISOString(),
          status: isLate ? 'present_late' : 'present',
          is_late: isLate,
          clock_method: 'face'
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      logAudit({
        staff_id: bestMatch.id,
        action: 'clock_in_face',
        details: `Face recognition clock in - ${bestMatch.first_name} ${bestMatch.last_name}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      }).catch(() => {})

      return NextResponse.json({
        success: true,
        staff: {
          id: bestMatch.id,
          full_name: `${bestMatch.first_name} ${bestMatch.last_name}`,
          department: bestMatch.department,
          check_in_time: now.toISOString(),
          is_late: isLate
        }
      })
    } else {
      if (!existing) {
        return NextResponse.json({ error: 'Must clock in first' }, { status: 400 })
      }

      if (existing.check_out_time) {
        return NextResponse.json({ error: 'Already clocked out' }, { status: 400 })
      }

      const { error } = await supabase
        .from('attendance')
        .update({ check_out_time: now.toISOString() })
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      logAudit({
        staff_id: bestMatch.id,
        action: 'clock_out_face',
        details: `Face recognition clock out - ${bestMatch.first_name} ${bestMatch.last_name}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      }).catch(() => {})

      return NextResponse.json({
        success: true,
        staff: {
          id: bestMatch.id,
          full_name: `${bestMatch.first_name} ${bestMatch.last_name}`,
          department: bestMatch.department,
          check_out_time: now.toISOString()
        }
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2)
  }
  return Math.sqrt(sum)
}

