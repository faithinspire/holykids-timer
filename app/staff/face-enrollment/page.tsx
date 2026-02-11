'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import dynamic from 'next/dynamic'

const ThemeToggle = dynamic(() => import('@/components/ui/ThemeToggle'), { ssr: false })

export default function FaceEnrollmentPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [staff, setStaff] = useState<any>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  useEffect(() => {
    loadStaff()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadStaff = async () => {
    try {
      const staffId = localStorage.getItem('face_enrollment_staff_id')
      if (!staffId) {
        toast.error('No staff selected')
        router.push('/admin/staff')
        return
      }

      const response = await fetch('/api/staff')
      const data = await response.json()
      const staffMember = data.staff?.find((s: any) => s.id === staffId)

      if (!staffMember) {
        toast.error('Staff not found')
        router.push('/admin/staff')
        return
      }

      setStaff(staffMember)
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setCameraActive(true)
        toast.success('Camera ready!')
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      toast.error('Could not access camera: ' + (error.message || 'Unknown error'))
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setCameraActive(false)
      setCapturedImage(null)
    }
  }

  const captureImage = () => {
    if (!videoRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)
      toast.success('Image captured!')
    }
  }

  const handleEnroll = async () => {
    if (!capturedImage) {
      toast.error('Please capture an image first')
      return
    }

    if (pin.length < 4 || pin.length > 6) {
      toast.error('PIN must be 4-6 digits')
      return
    }

    if (pin !== confirmPin) {
      toast.error('PINs do not match')
      return
    }

    setEnrolling(true)

    try {
      // Hash PIN
      const encoder = new TextEncoder()
      const data = encoder.encode(pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Save to database (image as base64 for now)
      const response = await fetch('/api/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          face_embedding: capturedImage,  // Store image directly
          pin_hash: pinHash
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('✅ Enrolled successfully!')
        stopCamera()
        
        setTimeout(() => router.push('/admin/staff'), 2000)
      } else {
        toast.error(result.error || 'Enrollment failed')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      toast.error('Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="shadow-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => router.push('/admin/staff')} className="text-white hover:bg-white/10 p-2 rounded-lg">
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Face Enrollment</h1>
                <p className="text-white/80 text-sm">Capture photo</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {staff && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {staff.first_name[0]}{staff.last_name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {staff.first_name} {staff.last_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{staff.department}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            Capture Photo
          </h3>
          
          {!cameraActive ? (
            <div className="text-center py-12 px-4">
              <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📸</span>
              </div>
              <button
                onClick={startCamera}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700"
              >
                Start Camera
              </button>
            </div>
          ) : (
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full"
                style={{ display: 'block', minHeight: '300px' }}
              />
              
              {capturedImage && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <img src={capturedImage} alt="Captured" className="max-w-full max-h-full" />
                </div>
              )}
            </div>
          )}
        </div>

        {cameraActive && (
          <>
            <div className="mb-6 space-y-3">
              {!capturedImage ? (
                <button
                  onClick={captureImage}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700"
                >
                  📸 Capture Photo
                </button>
              ) : (
                <button
                  onClick={() => setCapturedImage(null)}
                  className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-700"
                >
                  🔄 Retake Photo
                </button>
              )}
              
              <button
                onClick={stopCamera}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>

            {capturedImage && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Set PIN</h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter PIN (4-6 digits)"
                    className="w-full px-4 py-3 border rounded-lg text-center text-lg"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirm PIN"
                    className="w-full px-4 py-3 border rounded-lg text-center text-lg"
                  />
                </div>
              </div>
            )}

            {capturedImage && pin.length >= 4 && pin === confirmPin && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {enrolling ? 'Saving...' : '✓ Complete Enrollment'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
