import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logAudit } from '@/lib/auditLog'

/**
 * Attendance Sync Endpoint for External Devices
 * 
 * Allows external fingerprint devices to sync attendance records
 * in batch mode
 */

export async function POST(request: Request) {
  try {
    const { device_id, records } = await request.json()

    if (!device_id || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Device ID and records array are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const record of records) {
      try {
        const { staff_id, timestamp, action, pin } = record

        if (!staff_id || !timestamp || !action) {
          results.failed++
          results.errors.push(`Missing required fields for record: ${JSON.stringify(record)}`)
          continue
        }

        // Verify staff exists
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('id, staff_id, first_name, last_name, pin')
          .eq('id', staff_id)
          .single()

        if (staffError || !staff) {
          results.failed++
          results.errors.push(`Staff not found: ${staff_id}`)
          continue
        }

        // Verify PIN if provided
        if (pin && staff.pin !== pin) {
          results.failed++
          results.errors.push(`Invalid PIN for staff: ${staff_id}`)
          continue
        }

        // Record attendance
        if (action === 'clock_in') {
          const { error: attendanceError } = await supabase
            .from('attendance')
            .insert({
              staff_id: staff.id,
              check_in_time: timestamp,
              auth_method: 'external_device',
              staff_name: `${staff.first_name} ${staff.last_name}`,
              staff_number: staff.staff_id
            })

          if (attendanceError) {
            results.failed++
            results.errors.push(`Failed to record clock-in for ${staff_id}: ${attendanceError.message}`)
          } else {
            results.success++
            
            // Log audit
            logAudit({
              staff_id: staff.id,
              action: 'clock_in',
              details: `Clocked in via external device ${device_id}`
            }).catch(console.error)
          }
        } else if (action === 'clock_out') {
          // Find today's attendance record
          const today = new Date(timestamp).toISOString().split('T')[0]
          const { data: attendance, error: findError } = await supabase
            .from('attendance')
            .select('id')
            .eq('staff_id', staff.id)
            .gte('check_in_time', `${today}T00:00:00`)
            .lte('check_in_time', `${today}T23:59:59`)
            .is('check_out_time', null)
            .single()

          if (findError || !attendance) {
            results.failed++
            results.errors.push(`No active clock-in found for ${staff_id}`)
            continue
          }

          const { error: updateError } = await supabase
            .from('attendance')
            .update({ check_out_time: timestamp })
            .eq('id', attendance.id)

          if (updateError) {
            results.failed++
            results.errors.push(`Failed to record clock-out for ${staff_id}: ${updateError.message}`)
          } else {
            results.success++
            
            // Log audit
            logAudit({
              staff_id: staff.id,
              action: 'clock_out',
              details: `Clocked out via external device ${device_id}`
            }).catch(console.error)
          }
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`Error processing record: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      device_id,
      results: {
        total: records.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors
      }
    })

  } catch (error: any) {
    console.error('[SYNC] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    )
  }
}
