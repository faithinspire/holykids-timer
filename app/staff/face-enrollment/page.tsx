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


export default function FaceEnrollmentPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [staff, setStaff] = useState<any>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  useEffect(() => {
    loadModelsAndStaff()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadModelsAndStaff = async () => {
    try {
      // Get staff ID from localStorage
      const staffId = localStorage.getItem('face_enrollment_staff_id')
      if (!staffId) {
        toast.error('No staff selected for enrollment')
        router.push('/admin/staff')
        return
      }

      // Fetch staff details
      const response = await fetch('/api/staff')
      const data = await response.json()
      const staffMember = data.staff?.find((s: any) => s.id === staffId)

      if (!staffMember) {
        toast.error('Staff not found')
        router.push('/admin/staff')
        return
      }

      setStaff(staffMember)
      
      // Load face-api models in background (don't block UI)
      console.log('Loading AI models in background...')
      loadFaceAPIModels()
      
      setLoading(false)
      setModelsLoaded(true)  // Allow camera to start
    } catch (error) {
      console.error('❌ Error loading:', error)
      setLoading(false)
      setModelsLoaded(true)  // Still allow camera even if error
    }
  }

  const loadFaceAPIModels = async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ])
      
      console.log('✅ AI models loaded successfully')
    } catch (error) {
      console.error('❌ Error loading AI models:', error)
      // Don't show error to user - camera will still work
    }
  }

  const startCamera = async () => {
    try {
      // Mobile-friendly camera constraints
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        },
        audio: false
      }
      
      console.log('Requesting camera access...')
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setCameraActive(true)  // Show camera IMMEDIATELY
        
        console.log('✅ Camera stream set')
        toast.dismiss()
        toast.success('Camera ready!')
        
        // Start face detection after short delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            startFaceDetection()
            console.log('✅ Face detection started')
          }
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Camera error:', error)
      toast.dismiss()
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera permission denied. Please allow camera access.')
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found on this device.')
        } else {
          toast.error('Could not access camera: ' + error.message)
        }
      } else {
        toast.error('Could not access camera')
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setCameraActive(false)
    }
  }

  const startFaceDetection = () => {
    const detectFace = async () => {
      if (videoRef.current && canvasRef.current && cameraActive) {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()

        if (detection) {
          setFaceDetected(true)
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true)
          const resizedDetection = faceapi.resizeResults(detection, dims)
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            faceapi.draw.drawDetections(canvasRef.current, resizedDetection)
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection)
          }
        } else {
          setFaceDetected(false)
        }

        requestAnimationFrame(detectFace)
      }
    }
    detectFace()
  }

  const handleEnroll = async () => {
    if (!faceDetected) {
      toast.error('No face detected. Please position your face in the frame.')
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
      // Capture face embedding
      const detection = await faceapi
        .detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        toast.error('Could not detect face. Please try again.')
        setEnrolling(false)
        return
      }

      const embedding = Array.from(detection.descriptor)

      // Hash PIN
      const encoder = new TextEncoder()
      const data = encoder.encode(pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Save to database
      const response = await fetch('/api/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          face_embedding: embedding,
          pin_hash: pinHash
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('✅ Face and PIN enrolled successfully!')
        stopCamera()
        
        // Also save to localStorage for offline
        const localStaff = JSON.parse(localStorage.getItem('holykids_staff') || '[]')
        const updatedStaff = localStaff.map((s: any) => 
          s.id === staff.id 
            ? { ...s, face_enrolled: true, face_embedding: JSON.stringify(embedding), pin_hash: pinHash }
            : s
        )
        localStorage.setItem('holykids_staff', JSON.stringify(updatedStaff))
        localStorage.setItem('face_enrolled_' + staff.id, JSON.stringify(embedding))

        setTimeout(() => router.push('/admin/staff'), 2000)
      } else {
        toast.error(result.error || 'Enrollment failed')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      toast.error('Failed to enroll face')
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
      {/* Header */}
      <div className="shadow-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => router.push('/admin/staff')} className="text-white hover:bg-white/10 p-2 rounded-lg">
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Face Enrollment</h1>
                <p className="text-white/80 text-sm">Register facial recognition</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Staff Info */}
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
                <p className="text-sm text-gray-500 dark:text-gray-500">Staff ID: {staff.staff_id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Camera Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            Step 1: Capture Your Face
          </h3>
          
          {!cameraActive ? (
            <div className="text-center py-12 px-4">
              <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📸</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Position your face in front of the camera
              </p>
              <button
                onClick={startCamera}
                disabled={!modelsLoaded}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {modelsLoaded ? 'Start Camera' : 'Loading...'}
              </button>
            </div>
          ) : (
            <div className="relative bg-black rounded-xl overflow-hidden">
              {/* Camera View - Simple Square Shape */}
              <div className="relative w-full aspect-square max-h-[80vh]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover bg-black"
                  style={{ display: 'block', minHeight: '300px' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ display: faceDetected ? 'block' : 'none' }}
                />
                
                {/* Face Detection Indicator */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  {faceDetected ? (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
                      <span className="text-lg">✓</span>
                      <span>Face Detected</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
                      <span className="text-lg">⚠</span>
                      <span>Position Your Face</span>
                    </div>
                  )}
                </div>

                {/* Guide Circle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 md:w-64 md:h-64 border-4 border-white/50 rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIN Section */}
        {cameraActive && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Step 2: Set Your PIN (Fallback)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a 4-6 digit PIN as backup for clock-in
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enter PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg text-center tracking-widest bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg text-center tracking-widest bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="••••"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {cameraActive && (
          <div className="space-y-3">
            <button
              onClick={handleEnroll}
              disabled={enrolling || !faceDetected || pin.length < 4 || pin !== confirmPin}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2"
            >
              {enrolling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">📸</span>
                  <span>Capture & Save</span>
                </>
              )}
            </button>

            <button
              onClick={stopCamera}
              disabled={enrolling}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium text-base hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">📋 Instructions:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Look directly at the camera</li>
            <li>• Ensure good lighting on your face</li>
            <li>• Remove glasses if possible</li>
            <li>• Keep a neutral expression</li>
            <li>• Wait for "Face Detected" confirmation</li>
            <li>• Set a memorable PIN for backup access</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
