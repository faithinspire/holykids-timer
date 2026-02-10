import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { staffList } = body

    if (!staffList || !Array.isArray(staffList)) {
      return NextResponse.json(
        { error: 'Staff list is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    let successCount = 0
    let failCount = 0

    for (const staff of staffList) {
      try {
        const pin = staff.pin || '----'

        // Check if staff already exists
        const { data: existing } = await supabase
          .from('staff')
          .select('id')
          .eq('staff_id', staff.staff_id)
          .single()

        if (existing) {
          // Update
          const { error } = await supabase
            .from('staff')
            .update({
              first_name: staff.first_name,
              last_name: staff.last_name,
              email: staff.email || `${staff.staff_id.toLowerCase()}@holykids.edu`,
              department: staff.department,
              phone: staff.phone || '',
              role: staff.role || 'Support Staff',
              biometric_enrolled: staff.biometric_enrolled || false,
              is_active: staff.is_active !== false
            })
            .eq('id', existing.id)

          if (error) failCount++
          else successCount++
        } else {
          // Insert
          const { error } = await supabase
            .from('staff')
            .insert({
              staff_id: staff.staff_id,
              first_name: staff.first_name,
              last_name: staff.last_name,
              email: staff.email || `${staff.staff_id.toLowerCase()}@holykids.edu`,
              department: staff.department,
              phone: staff.phone || '',
              role: staff.role || 'Support Staff',
              pin: pin,
              biometric_enrolled: staff.biometric_enrolled || false,
              is_active: staff.is_active !== false,
              date_joined: staff.date_joined || new Date().toISOString().split('T')[0]
            })

          if (error) failCount++
          else successCount++
        }
      } catch (error) {
        console.error('Error syncing staff:', staff.staff_id, error)
        failCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} staff, ${failCount} failed`,
      successCount,
      failCount
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  // GET: Fetch staff from Supabase
  try {
    const supabase = createServerClient()
    
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ staff: staff || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
