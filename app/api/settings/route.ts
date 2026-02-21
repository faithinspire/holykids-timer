import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, settings: data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('app_settings')
      .update({
        organization_name: body.organization_name,
        logo_url: body.logo_url,
        primary_color: body.primary_color,
        secondary_color: body.secondary_color,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, settings: data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
