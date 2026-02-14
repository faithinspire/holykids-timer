'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function FaceEnrollmentPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<any>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    loadStaffData()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadStaffData = async () => {
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
    } catch (error) {
      console.error('Error loading staff:', error)
      toast.error('Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.autoplay = true
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        
        await videoRef.current.play()
        setStream(mediaStream)
        setCameraActive(true)
        toast.success('Camera ready!')
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      toast.error('Could not access camera')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const captureFace = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)
    toast.success('Face captured!')
  }

  const handleEnroll = async () => {
    if (!capturedImage) {
      toast.error('Please capture your face first')
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
      const encoder = new TextEncoder()
      const data = encoder.encode(pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const response = await fetch('/api/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          image: capturedImage,
          pin_hash: pinHash
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('✅ Face enrolled successfully!')
        stopCamera()
        setTimeout(() => router.push('/admin/staff'), 2000)
      } else {
        throw new Error(result.error || 'Enrollment failed')
      }
    } catch (error: any) {
      console.error('Enrollment error:', error)
      toast.error(error.message || 'Failed to enroll face')
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
      <div className="shadow-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                stopCamera()
                router.push('/admin/staff')
              }} 
              className="text-white hover:bg-white/10 p-2 rounded-lg"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-white">Face Enrollment</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto">
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
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Step 1: Capture Your Face
            </h3>
          </div>

          <div className="relative bg-black" style={{ minHeight: '400px' }}>
            {!cameraActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                  <span className="text-6xl">📸</span>
                </div>
                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 shadow-lg"
                >
                  📸 Start Camera
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    display: capturedImage ? 'none' : 'block',
                    minHeight: '400px',
                    maxHeight: '600px'
                  }}
                />
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {capturedImage && (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                    style={{ minHeight: '400px', maxHeight: '600px' }}
                  />
                )}
              </>
            )}
          </div>

          <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {cameraActive && !capturedImage && (
              <>
                <button
                  onClick={captureFace}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg"
                >
                  📸 Capture Face
                </button>
                <button
                  onClick={stopCamera}
                  className="w-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </>
            )}
            
            {capturedImage && (
              <button
                onClick={() => setCapturedImage(null)}
                className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-700 shadow-lg"
              >
                🔄 Retry Capture
              </button>
            )}
          </div>
        </div>

        {capturedImage && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Step 2: Set Your PIN
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter PIN (4-6 digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-lg text-center tracking-widest bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-lg text-center tracking-widest bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="••••"
                />
              </div>
            </div>
          </div>
        )}

        {capturedImage && pin.length >= 4 && pin === confirmPin && (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-xl font-bold text-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-2xl flex items-center justify-center space-x-3"
          >
            {enrolling ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enrolling...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">✓</span>
                <span>Complete Enrollment</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
