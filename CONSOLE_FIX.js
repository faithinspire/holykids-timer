// ═══════════════════════════════════════════════════════════
// EMERGENCY FIX - Run this in browser console (F12)
// ═══════════════════════════════════════════════════════════

console.log('🔧 Starting emergency biometric fix...')

// Get all staff
let staffData = localStorage.getItem('holykids_staff')

if (!staffData) {
  console.error('❌ No staff found in localStorage')
  console.log('Please add staff first in Staff Management')
} else {
  let staffList = JSON.parse(staffData)
  console.log('👥 Found', staffList.length, 'staff members')
  
  // Show current enrollment status
  staffList.forEach((s, i) => {
    console.log(`${i + 1}. ${s.first_name} ${s.last_name} - Enrolled: ${s.biometric_enrolled || false}`)
  })
  
  // Ask which staff to enroll
  console.log('\n📝 To enroll a staff member, run:')
  console.log('enrollStaff(0)  // For first staff')
  console.log('enrollStaff(1)  // For second staff')
  console.log('etc...')
  
  // Create helper function
  window.enrollStaff = function(index) {
    if (index < 0 || index >= staffList.length) {
      console.error('❌ Invalid index. Use 0 to', staffList.length - 1)
      return
    }
    
    let staff = staffList[index]
    staff.biometric_enrolled = true
    staff.fingerprint_id = `fp_${staff.staff_id}_${Date.now()}`
    staff.enrolled_at = new Date().toISOString()
    
    localStorage.setItem('holykids_staff', JSON.stringify(staffList))
    
    console.log('✅ Enrolled:', staff.first_name, staff.last_name)
    console.log('📋 Fingerprint ID:', staff.fingerprint_id)
    console.log('🔄 Refresh the page to see changes')
  }
  
  // Create helper to enroll ALL staff
  window.enrollAll = function() {
    staffList.forEach((staff, i) => {
      staff.biometric_enrolled = true
      staff.fingerprint_id = `fp_${staff.staff_id}_${Date.now() + i}`
      staff.enrolled_at = new Date().toISOString()
    })
    
    localStorage.setItem('holykids_staff', JSON.stringify(staffList))
    
    console.log('✅ Enrolled ALL', staffList.length, 'staff members')
    console.log('🔄 Refresh the page to see changes')
  }
  
  console.log('\n💡 Quick fix: enrollAll() to enroll everyone')
}

// ═══════════════════════════════════════════════════════════
// USAGE:
// 1. Open browser console (F12)
// 2. Copy and paste this entire file
// 3. Press Enter
// 4. Run: enrollStaff(0) or enrollAll()
// 5. Refresh page
// 6. Try clock-in
// ═══════════════════════════════════════════════════════════
