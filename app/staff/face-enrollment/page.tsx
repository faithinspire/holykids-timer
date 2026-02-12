'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import dynamic from 'next/dynamic'
import * as faceapi from 'face-api.js'

const ThemeToggle = dynamic(() => import('@/components/ui/ThemeToggle'), { ssr: false })

type CameraState = 'idle' | 'starting' | 'active' | 'error'
type CaptureState = 'none' | 'capturing' | 'captured' | 'processing'

export default function FaceEnrollmentPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // State management
  const [loading, setLoading] = useState(true)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [staff, setStaff] = useState<any>(null)
  
  // Camera states
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [cameraError, setCameraError] = useState<string>('')
  
  // Capture states
  const [captureState, setCaptureState] = useState<CaptureState>('none')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null)
  
  // PIN states
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // Load models and staff data on mount
  useEffect(() => {
    loadModelsAndStaff()
    
    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [])

  const loadModelsAndStaff = async () => {
    try {
      // Load staff data
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

      // Load face-api models in background
      console.log('📦 Loading face detection models...')
      toast.loading('Loading face detection models...')
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ])
      
      setModelsLoaded(true)
      toast.dismiss()
      toast.success('Face detection ready!')
      console.log('✅ Models loaded successfully')
      
    } catch (error) {
      console.error('❌ Error loading:', error)
      toast.dismiss()
      toast.error('Failed to load face detection')
    } finally {
      setLoading(false)
    }
  }

  // 1️⃣ START CAMERA - Explicit user action required
  const startCamera = async () => {
    setCameraState('starting')
    setCameraError('')
    console.log('🎥 [START] User clicked Start Camera')

    try {
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use Chrome, Firefox, or Safari.')
      }

      console.log('🎥 [REQUEST] Requesting camera permission...')
      
      // Request camera with mobile-optimized constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, min: 320, max: 1280 },
          height: { ideal: 480, min: 240, max: 720 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('✅ [STREAM] Got media stream:', {
        active: stream.active,
        tracks: stream.getVideoTracks().length
      })

      if (!videoRef.current) {
        throw new Error('Video element not found')
      }

      // CRITICAL: Attach stream to video element
      videoRef.current.srcObject = stream
      videoRef.current.autoplay = true
      videoRef.current.playsInline = true  // CRITICAL for mobile Safari
      videoRef.current.muted = true
      
      streamRef.current = stream

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element lost'))
          return
        }

        const video = videoRef.current
        const timeout = setTimeout(() => {
          cleanup()
          reject(new Error('Video load timeout after 10 seconds'))
        }, 10000)

        const onLoadedMetadata = () => {
          console.log('✅ [VIDEO] Metadata loaded:', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          })
          cleanup()
          resolve()
        }

        const onError = (e: Event) => {
          console.error('❌ [VIDEO] Error:', e)
          cleanup()
          reject(new Error('Video element error'))
        }

        const cleanup = () => {
          clearTimeout(timeout)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
        }

        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
      })

      // Force play (required on some mobile browsers)
      try {
        await videoRef.current.play()
        console.log('✅ [VIDEO] Playing')
      } catch (playError) {
        console.warn('⚠️ [VIDEO] Auto-play warning (may be normal):', playError)
      }

      setCameraState('active')
      toast.success('Camera active! Position your face in the frame.')
      console.log('✅ [CAMERA] Fully initialized and displaying')

      // Start face detection loop
      startFaceDetection()

    } catch (error: any) {
      console.error('❌ [CAMERA] Error:', error)
      
      let errorMessage = 'Could not access camera'
      
      // Handle specific error types
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is in use by another application. Please close other apps and try again.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support required settings.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setCameraState('error')
      setCameraError(errorMessage)
      toast.error(errorMessage)
      
      // Cleanup on error
      stopCamera()
    }
  }

  // Stop camera and cleanup
  const stopCamera = () => {
    console.log('🛑 [STOP] Stopping camera...')
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`🛑 [TRACK] Stopping: ${track.label}`)
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraState('idle')
    setFaceDetected(false)
    console.log('✅ [STOP] Camera stopped and cleaned up')
  }

  // Face detection loop
  const startFaceDetection = () => {
    if (!modelsLoaded) {
      console.warn('⚠️ [DETECTION] Models not loaded yet')
      return
    }

    const detectFace = async () => {
      if (cameraState !== 'active' || !videoRef.current || !canvasRef.current) {
        return
      }

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()

        if (detection) {
          setFaceDetected(true)
          
          // Draw detection on canvas
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
          
          // Clear canvas
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        }
      } catch (error) {
        console.error('❌ [DETECTION] Error:', error)
      }

      // Continue detection loop
      if (cameraState === 'active') {
        requestAnimationFrame(detectFace)
      }
    }

    detectFace()
  }

  // 2️⃣ CAPTURE FACE - Explicit user action required
  const captureFace = async () => {
    if (!faceDetected) {
      toast.error('No face detected. Please position your face in the frame.')
      return
    }

    if (!videoRef.current) {
      toast.error('Camera not ready')
      return
    }

    setCaptureState('capturing')
    console.log('📸 [CAPTURE] User clicked Capture Face')

    try {
      // Capture image from video
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)

      // Extract face embedding
      console.log('🔍 [EMBEDDING] Extracting face features...')
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        throw new Error('Could not detect face in captured image')
      }

      const embedding = Array.from(detection.descriptor)
      setFaceEmbedding(embedding)
      
      setCaptureState('captured')
      toast.success('Face captured successfully!')
      console.log('✅ [CAPTURE] Face embedding extracted:', embedding.length, 'dimensions')

    } catch (error: any) {
      console.error('❌ [CAPTURE] Error:', error)
      setCaptureState('none')
      toast.error(error.message || 'Failed to capture face')
    }
  }

  // Retry capture
  const retryCapture = () => {
    console.log('🔄 [RETRY] User clicked Retry')
    setCaptureState('none')
    setCapturedImage(null)
    setFaceEmbedding(null)
    toast('Position your face and try again')
  }

  // 3️⃣ VERIFY & ENROLL - Final step
  const handleEnroll = async () => {
    if (!faceEmbedding) {
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
    setCaptureState('processing')
    console.log('💾 [ENROLL] Starting enrollment...')

    try {
      // Hash PIN with SHA-256
      const encoder = new TextEncoder()
      const data = encoder.encode(pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      console.log('📤 [API] Sending enrollment data...')
      
      // Save to Supabase
      const response = await fetch('/api/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.id,
          face_embedding: faceEmbedding,  // Store embedding, not image
          pin_hash: pinHash
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('✅ Face enrolled successfully!')
        console.log('✅ [ENROLL] Success')
        
        stopCamera()
        
        setTimeout(() => {
          router.push('/admin/staff')
        }, 2000)
      } else {
        throw new Error(result.error || 'Enrollment failed')
      }
    } catch (error: any) {
      console.error('❌ [ENROLL] Error:', error)
      toast.error(error.message || 'Failed to enroll face')
      setCaptureState('captured')
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
              <button 
                onClick={() => {
                  stopCamera()
                  router.push('/admin/staff')
                }} 
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
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

      <div className="px-4 py-6 max-w-3xl mx-auto">
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
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Step 1: Capture Your Face
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {cameraState === 'idle' && 'Click "Start Camera" to begin'}
              {cameraState === 'starting' && 'Initializing camera...'}
              {cameraState === 'active' && faceDetected && 'Face detected! Click "Capture Face" when ready'}
              {cameraState === 'active' && !faceDetected && 'Position your face in the frame'}
              {cameraState === 'error' && 'Camera error - see message below'}
            </p>
          </div>

          {/* Camera Display */}
          <div className="relative bg-black" style={{ minHeight: '400px' }}>
            {cameraState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                  <span className="text-6xl">📸</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Ready to Enroll
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
                  Click the button below to start your camera and capture your face for attendance recognition.
                </p>
                {!modelsLoaded && (
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-4">
                    ⏳ Loading face detection models...
                  </p>
                )}
              </div>
            )}

            {cameraState === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white text-lg">Starting camera...</p>
                <p className="text-white/60 text-sm mt-2">Please allow camera access if prompted</p>
              </div>
            )}

            {cameraState === 'active' && (
              <>
                {/* Live Video Feed - ALWAYS VISIBLE */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    display: 'block',
                    minHeight: '400px',
                    maxHeight: '600px',
                    backgroundColor: '#000'
                  }}
                />

                {/* Face Detection Overlay Canvas */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />

                {/* Face Detection Indicator */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  {faceDetected ? (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center space-x-2">
                      <span className="text-lg">✓</span>
                      <span>Face Detected</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center space-x-2">
                      <span className="text-lg">⚠</span>
                      <span>Position Your Face</span>
                    </div>
                  )}
                </div>

                {/* Face Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-80 border-4 border-white/30 rounded-3xl"></div>
                </div>

                {/* Captured Image Overlay */}
                {capturedImage && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                      <img 
                        src={capturedImage} 
                        alt="Captured face" 
                        className="w-full rounded-xl shadow-2xl"
                      />
                      <div className="mt-4 text-center">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-full inline-flex items-center space-x-2">
                          <span className="text-lg">✓</span>
                          <span className="font-bold">Face Captured</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {cameraState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-5xl">❌</span>
                </div>
                <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                  Camera Error
                </h3>
                <p className="text-red-700 dark:text-red-400 text-center max-w-md mb-6">
                  {cameraError}
                </p>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {cameraState === 'idle' && (
              <button
                onClick={startCamera}
                disabled={!modelsLoaded}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                {modelsLoaded ? '📸 Start Camera' : '⏳ Loading Models...'}
              </button>
            )}

            {cameraState === 'active' && captureState === 'none' && (
              <>
                <button
                  onClick={captureFace}
                  disabled={!faceDetected}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  📸 Capture Face
                </button>
                <button
                  onClick={stopCamera}
                  className="w-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </>
            )}

            {captureState === 'captured' && (
              <button
                onClick={retryCapture}
                className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-700 shadow-lg transition-all"
              >
                🔄 Retry Capture
              </button>
            )}

            {cameraState === 'error' && (
              <button
                onClick={startCamera}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transition-all"
              >
                🔄 Try Again
              </button>
            )}
          </div>
        </div>

        {/* PIN Section - Only show after successful capture */}
        {captureState === 'captured' && faceEmbedding && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              Step 2: Set Your PIN
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a 4-6 digit PIN as a backup method for clock-in
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-lg text-center tracking-widest bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-lg text-center tracking-widest bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder="••••"
                />
              </div>
            </div>
          </div>
        )}

        {/* Final Enrollment Button */}
        {captureState === 'captured' && faceEmbedding && pin.length >= 4 && pin === confirmPin && (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-xl font-bold text-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all flex items-center justify-center space-x-3"
          >
            {enrolling ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enrolling...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">✓</span>
                <span>Verify & Complete Enrollment</span>
              </>
            )}
          </button>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
            <span className="text-xl mr-2">📋</span>
            Instructions
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Click "Start Camera" and allow camera access when prompted</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Position your face within the guide frame</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Wait for "Face Detected" confirmation (green badge)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Click "Capture Face" to take your photo</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">5.</span>
              <span>Set a memorable 4-6 digit PIN for backup access</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">6.</span>
              <span>Click "Verify & Complete Enrollment" to finish</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-500">
              <strong>Privacy:</strong> Only face embeddings (mathematical representations) are stored, not actual photos. Your data is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
