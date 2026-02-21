import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logAudit } from '@/lib/auditLog'

/**
 * External Fingerprint Device Integration
 * 
 * This endpoint allows external fingerprint devices to:
 * 1. Send fingerprint scan data
 * 2. Receive auto-generated PIN for staff verification
 * 3. Sync clock-in/out records
 * 
 * Expected request format:
 * {
 *   device_id: string,
 *   fingerprint_data: string (base64 encoded),
 *   action: 'clock_in' | 'clock_out' | 'verify'
 * }
 */

export async function POST(request: Request) {
  try {
    const { device_id, fingerprint_data, action, staff_identifier } = await request.json()

    if (!device_id) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // If staff_identifier is provided (staff_id or staff_number), generate PIN
    if (staff_identifier) {
      // Find staff by ID or staff_number
      const { data: staff, error } = await supabase
        .from('staff')
        .select('id, staff_id, first_name, last_name, pin, biometric_credential_id')
        .or(`id.eq.${staff_identifier},staff_id.eq.${staff_identifier}`)
        .single()

      if (error || !staff) {
        return NextResponse.json(
          { success: false, error: 'Staff not found' },
          { status: 404 }
        )
      }

      // Generate auto-PIN if staff doesn't have one
      let autoPin = staff.pin
      if (!autoPin) {
        // Generate 6-digit PIN based on staff ID and timestamp
        const timestamp = Date.now().toString().slice(-4)
        const staffIdNum = staff.staff_id.replace(/\D/g, '').slice(-2) || '00'
        autoPin = `${staffIdNum}${timestamp}`.slice(0, 6)

        // Update staff with auto-generated PIN
        await supabase
          .from('staff')
          .update({ pin: autoPin })
          .eq('id', staff.id)

        console.log(`[EXTERNAL-DEVICE] Auto-generated PIN for ${staff.first_name} ${staff.last_name}: ${autoPin}`)
      }

      // Return PIN for device display
      return NextResponse.json({
        success: true,
        staff_id: staff.id,
        staff_name: `${staff.first_name} ${staff.last_name}`,
        pin: autoPin,
        message: 'PIN generated/retrieved successfully'
      })
    }

    // Handle fingerprint verification and clock-in/out
    if (fingerprint_data && action) {
      // In a real implementation, you would:
      // 1. Match fingerprint_data against stored biometric templates
      // 2. Identify the staff member
      // 3. Record attendance

      // For now, we'll use a simplified approach
      // The external device should send the matched staff_id

      return NextResponse.json({
        success: true,
        message: 'Fingerprint verification endpoint ready',
        note: 'Please send staff_identifier to get PIN or use /api/attendance/clock-in with staff_id'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request parameters' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('[EXTERNAL-DEVICE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'External device integration failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for device status check
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const device_id = searchParams.get('device_id')

  if (!device_id) {
    return NextResponse.json(
      { success: false, error: 'Device ID is required' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    device_id,
    status: 'online',
    api_version: '1.0',
    endpoints: {
      verify_and_get_pin: 'POST /api/attendance/external-device with staff_identifier',
      clock_in: 'POST /api/attendance/clock-in with staff_id and method',
      sync_records: 'POST /api/attendance/sync'
    }
  })
}
