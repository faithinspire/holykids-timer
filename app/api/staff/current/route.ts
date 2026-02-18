import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ 
        error: 'Staff profile not linked to this user' 
      }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
