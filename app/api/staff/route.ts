import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// For server-side operations
function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('Supabase URL:', url)
  console.log('Supabase URL configured:', !!url)
  console.log('Supabase Service Key configured:', !!key)
  
  // Check if URL is valid
  if (!url || !key || url === '=' || url.trim() === '' || !url.startsWith('http')) {
    console.warn('Supabase not configured properly - staff will be stored locally only')
    return null
  }
  
  try {
    return createClient(url, key)
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    return null
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // If Supabase is not configured, return empty array
    if (!supabase) {
      console.log('Supabase not configured, returning empty staff list')
      return NextResponse.json({ staff: [], warning: 'Using local storage only' })
    }
    
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
    return NextResponse.json({ staff: [], error: error.message }, { status: 500 })
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

    const supabase = createServerClient()

    // Generate staff ID and PIN
    const staffId = `STF${Date.now().toString().slice(-4)}`
    const staffPin = pin || Math.floor(1000 + Math.random() * 9000).toString() // 4-digit PIN

    // If Supabase is not configured, return local data
    if (!supabase) {
      console.log('Supabase not configured, staff will be stored locally')
      const localStaff = {
        id: Date.now().toString(),
        staff_id: staffId,
        first_name,
        last_name,
        email: email || `${staffId.toLowerCase()}@holykids.edu`,
        department,
        phone: phone || '',
        role: role || 'Support Staff',
        pin: staffPin,
        biometric_enrolled: false,
        is_active: true,
        created_at: new Date().toISOString()
      }
      
      return NextResponse.json({ 
        success: true, 
        staff: localStaff,
        message: 'Staff saved locally',
        warning: 'Cloud storage not configured. Data saved to browser only.'
      })
    }

    // Insert staff into Supabase
    console.log('Inserting staff into Supabase:', staffId)
    const { data, error } = await supabase
      .from('staff')
      .insert({
        staff_id: staffId,
        first_name,
        last_name,
        email: email || `${staffId.toLowerCase()}@holykids.edu`,
        department,
        phone: phone || '',
        role: role || 'Support Staff',
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

    return NextResponse.json({ 
      success: true, 
      staff: { ...data, pin: staffPin },
      message: 'Staff registered successfully'
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // If Supabase is not configured, return success (already deleted locally)
    if (!supabase) {
      return NextResponse.json({ 
        success: true, 
        message: 'Staff deleted locally' 
      })
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
