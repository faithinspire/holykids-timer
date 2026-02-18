import { getSupabaseClient } from '@/lib/supabase'

export async function logAudit(data: {
  staff_id?: string
  action: string
  details?: string
  ip_address?: string
  user_agent?: string
}): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        staff_id: data.staff_id || null,
        action: data.action,
        details: data.details || null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Audit log failed (non-blocking):', error.message)
    }
  } catch (error) {
    console.error('Audit log exception (non-blocking):', error)
  }
}
