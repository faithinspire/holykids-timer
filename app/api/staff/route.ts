import { getSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    // Fetch all staff from Supabase
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ staff: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({ staff: staff || [] })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { staff: [], error: error.message || 'Database configuration error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, department, phone, role, pin } = body

    // Validate required fields
    if (!first_name || !last_name || !department) {
      return NextResponse.json(
        { error: 'First name, last name, and department are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Generate staff ID and PIN
    const staffId = `STF${Date.now().toString().slice(-4)}`
    const staffPin = pin || Math.floor(1000 + Math.random() * 9000).toString()

    // Convert department array to comma-separated string for database
    const departmentString = Array.isArray(department) ? department.join(', ') : department

    // Insert staff into Supabase
    const { data, error } = await supabase
      .from('staff')
      .insert({
        staff_id: staffId,
        first_name,
        last_name,
        email: email || `${staffId.toLowerCase()}@holykids.edu`,
        department: departmentString,
        phone: phone || '',
        role: role || 'Teacher',
        pin: staffPin,
        is_active: true,
        date_joined: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return with department as array for frontend
    const staffWithArrayDept = {
      ...data,
      department: data.department.includes(',') ? data.department.split(', ') : [data.department],
      pin: staffPin
    }

    return NextResponse.json({ 
      success: true, 
      staff: staffWithArrayDept,
      message: 'Staff registered successfully'
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Database configuration error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Soft delete - update is_active to false
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Staff deleted successfully' })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Database configuration error' },
      { status: 500 }
    )
  }
}
