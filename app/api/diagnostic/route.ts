import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      },
      database: {
        connected: false,
        staffCount: 0,
        error: null
      }
    }

    try {
      const supabase = getSupabaseClient()
      
      const { data: staff, error } = await supabase
        .from('staff')
        .select('id, staff_id, first_name, last_name, is_active')
        .limit(5)

      if (error) {
        diagnostics.database.error = error.message
        diagnostics.database.errorCode = error.code
      } else {
        diagnostics.database.connected = true
        diagnostics.database.staffCount = staff?.length || 0
        diagnostics.database.sampleStaff = staff?.map(s => ({
          id: s.id,
          staff_id: s.staff_id,
          name: `${s.first_name} ${s.last_name}`,
          is_active: s.is_active
        }))
      }
    } catch (dbError: any) {
      diagnostics.database.error = dbError.message
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
