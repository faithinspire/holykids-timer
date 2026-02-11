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
      console.log('🎥 [CAMERA] Requesting camera access...')
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      // Request camera permission with optimized constraints for mobile
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, min: 320, max: 1280 },
          height: { ideal: 480, min: 240, max: 720 },
          aspectRatio: { ideal: 1.333 }
        },
        audio: false
      }
      
      console.log('🎥 [CAMERA] Constraints:', JSON.stringify(constraints))
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('✅ [CAMERA] Stream obtained:', {
        active: mediaStream.active,
        tracks: mediaStream.getVideoTracks().length
      })
      
      if (mediaStream.getVideoTracks().length === 0) {
        throw new Error('No video tracks in stream')
      }

      const videoTrack = mediaStream.getVideoTracks()[0]
      console.log('✅ [CAMERA] Video track:', {
        label: videoTrack.label,
        enabled: videoTrack.enabled,
        readyState: videoTrack.readyState,
        settings: videoTrack.getSettings()
      })
      
      if (videoRef.current) {
        // CRITICAL: Set srcObject BEFORE setting any handlers
        videoRef.current.srcObject = mediaStream
        
        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element lost'))
            return
          }

          const video = videoRef.current
          
          const onLoadedMetadata = () => {
            console.log('✅ [CAMERA] Metadata loaded:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState
            })
            cleanup()
            resolve()
          }

          const onError = (e: Event) => {
            console.error('❌ [CAMERA] Video error:', e)
            cleanup()
            reject(new Error('Video element error'))
          }

          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
          }

          video.addEventListener('loadedmetadata', onLoadedMetadata)
          video.addEventListener('error', onError)

          // Timeout after 10 seconds
          setTimeout(() => {
            cleanup()
            reject(new Error('Video load timeout'))
          }, 10000)
        })

        // Force play (required on some mobile browsers)
        try {
          await videoRef.current.play()
          console.log('✅ [CAMERA] Video playing')
        } catch (playError) {
          console.warn('⚠️ [CAMERA] Auto-play failed (may be normal):', playError)
        }

        setStream(mediaStream)
        setCameraActive(true)
        toast.dismiss()
        toast.success('Camera ready!')
        console.log('✅ [CAMERA] Camera fully initialized')
      }
    } catch (error: any) {
      console.error('❌ [CAMERA] Error:', error)
      
      // Detailed error messages
      let errorMessage = 'Could not access camera'
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application. Please close other apps using the camera.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the required settings. Trying with basic settings...'
        
        // Retry with minimal constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream
            await videoRef.current.play()
            setStream(basicStream)
            setCameraActive(true)
            toast.success('Camera ready with basic settings!')
            return
          }
        } catch (retryError) {
          console.error('❌ [CAMERA] Retry failed:', retryError)
        }
      } else if (error.name === 'TypeError') {
        errorMessage = 'Camera API not supported in this browser. Please use Chrome, Firefox, or Safari.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.dismiss()
      toast.error(errorMessage, { duration: 5000 })
    }
  }

  const stopCamera = () => {
    console.log('🛑 [CAMERA] Stopping camera...')
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log(`🛑 [CAMERA] Stopping track: ${track.label}`)
        track.stop()
      })
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setCameraActive(false)
    setCapturedImage(null)
    console.log('✅ [CAMERA] Camera stopped and cleaned up')
  }

  const captureImage = () => {
    if (!videoRef.current) {
      toast.error('Video not ready')
      return
    }
    
    // Ensure video has dimensions
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      toast.error('Camera not fully loaded. Please wait...')
      return
    }
    
    console.log('📸 [CAPTURE] Capturing image:', {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    })
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)
      toast.success('Image captured!')
      console.log('✅ [CAPTURE] Image captured successfully')
    } else {
      toast.error('Failed to capture image')
      console.error('❌ [CAPTURE] Could not get canvas context')
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
            <div className="relative bg-black" style={{ minHeight: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ 
                  display: 'block',
                  minHeight: '300px',
                  maxHeight: '600px',
                  backgroundColor: '#000',
                  width: '100%'
                }}
              />
              
              {capturedImage && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              
              {/* Loading indicator when camera is starting */}
              {cameraActive && videoRef.current && videoRef.current.readyState < 2 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p>Loading camera...</p>
                  </div>
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
