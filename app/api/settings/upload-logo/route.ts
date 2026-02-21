import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    
    // Upload to Supabase Storage
    const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    // Update app_settings
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('id')
      .single()

    if (settingsData) {
      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ logo_url: publicUrl })
        .eq('id', settingsData.id)

      if (updateError) throw updateError
    }

    return NextResponse.json({ 
      success: true, 
      logo_url: publicUrl 
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
