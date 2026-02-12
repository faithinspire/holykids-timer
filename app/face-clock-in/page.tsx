'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import dynamicImport from 'next/dynamic'
import * as faceapi from 'face-api.js'

const ThemeToggle = dynamicImport(() => import('@/components/ui/ThemeToggle'), { ssr: false })

interface EnrolledFace {
  id: string
  staff_id: string
  name: string
  department: string
  embedding: number[]
}

export default function FaceClockInPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [enrolledFaces, setEnrolledFaces] = useState<EnrolledFace[]>([])
  const [faceDetected, setFaceDetected] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [clockType, setClockType] = useState<'check_in' | 'check_out'>('check_in')

  useEffect(() => {
    loadEnrolledFaces()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadEnrolledFaces = async () => {
    try {
      // Load enrolled faces from database
      const response = await fetch('/api/face/enroll')
      const data = await response.json()
      
      if (data.enrolled_faces && data.enrolled_faces.length > 0) {
        setEnrolledFaces(data.enrolled_faces)
        console.log(`✅ Loaded ${data.enrolled_faces.length} enrolled staff`)
      } else {
        console.log('⚠️ No staff enrolled yet')
      }
    } catch (error) {
      console.error('❌ Error loading enrolled faces:', error)
      toast.error('Failed to load enrolled staff')
    } finally {
      setLoading(false)
    }
  }

  // 🔥 CRITICAL: Load models ONLY when user clicks Start Camera
  const loadFaceDetectionModels = async (retryCount = 0): Promise<boolean> => {
    const MAX_RETRIES = 3
    
    try {
      console.log(`📦 [MODELS] Loading face detection models (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
      toast.loading('Loading face recognition...')

      // CRITICAL: Use absolute path from public folder
      const MODEL_URL = '/models'
      
      // Test if models are accessible
      console.log('🔍 [MODELS] Testing model file accessibility...')
      const testResponse = await fetch(`${MODEL_URL}/tiny_face_detector_model-weights_manifest.json`)
      
      if (!testResponse.ok) {
        throw new Error(`Model files not accessible: ${testResponse.status} ${testResponse.statusText}`)
      }
      
      console.log('✅ [MODELS] Model files are accessible')

      // Load each model individually with detailed logging
      console.log('📥 [MODELS] Loading TinyFaceDetector...')
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      console.log('✅ [MODELS] TinyFaceDetector loaded')

      console.log('📥 [MODELS] Loading FaceLandmark68Net...')
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      console.log('✅ [MODELS] FaceLandmark68Net loaded')

      console.log('📥 [MODELS] Loading FaceRecognitionNet...')
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      console.log('✅ [MODELS] FaceRecognitionNet loaded')

      setModelsLoaded(true)
      toast.dismiss()
      toast.success('✅ Face recognition ready!')
      console.log('✅ [MODELS] All models loaded successfully')
      
      return true
      
    } catch (error: any) {
      console.error(`❌ [MODELS] Error loading models (attempt ${retryCount + 1}):`, error)
      console.error('❌ [MODELS] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      toast.dismiss()
      
      // Retry logic
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`🔄 [MODELS] Retrying in 2 seconds...`)
        toast.loading(`Retrying model load (${retryCount + 2}/${MAX_RETRIES})...`)
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        return loadFaceDetectionModels(retryCount + 1)
      } else {
        // All retries failed
        console.error('❌ [MODELS] All retry attempts failed')
        toast.error(`Failed to load face recognition after ${MAX_RETRIES} attempts. Please use PIN clock-in instead.`)
        
        setModelsLoaded(false)
        
        return false
      }
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
        
        // Start face detection after camera is ready
        setTimeout(() => startFaceDetection(), 500)
        
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
            setTimeout(() => startFaceDetection(), 500)
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
    setFaceDetected(false)
    console.log('✅ [CAMERA] Camera stopped and cleaned up')
  }

  const startFaceDetection = () => {
    const detectFace = async () => {
      if (videoRef.current && canvasRef.current && cameraActive && !scanning) {
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
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        }

        requestAnimationFrame(detectFace)
      }
    }
    detectFace()
  }

  const handleFaceScan = async () => {
    if (!faceDetected) {
      toast.error('No face detected. Please position your face in the frame.')
      return
    }

    if (enrolledFaces.length === 0) {
      toast.error('No staff enrolled. Please enroll faces first.')
      return
    }

    setScanning(true)

    try {
      // Capture face embedding
      const detection = await faceapi
        .detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        toast.error('Could not detect face. Please try again.')
        setScanning(false)
        return
      }

      const targetEmbedding = Array.from(detection.descriptor)

      // Find best match
      let bestMatch: { id: string; name: string; department: string; confidence: number } | null = null
      let highestSimilarity = 0

      for (const enrolled of enrolledFaces) {
        const similarity = compareFaceEmbeddings(targetEmbedding, enrolled.embedding)
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity
          bestMatch = {
            id: enrolled.id,
            name: enrolled.name,
            department: enrolled.department,
            confidence: similarity
          }
        }
      }

      // Confidence threshold: 85%
      const CONFIDENCE_THRESHOLD = 0.85
      if (!bestMatch || bestMatch.confidence < CONFIDENCE_THRESHOLD) {
        toast.error('Face not recognized. Please try again or use PIN.')
        
        // Log failed attempt
        await fetch('/api/face/clock-in', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_type: 'face',
            reason: `Low confidence: ${(bestMatch?.confidence || 0) * 100}%`,
            device_id: getDeviceId()
          })
        })
        
        setScanning(false)
        return
      }

      // Clock in/out
      const response = await fetch('/api/face/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: bestMatch.id,
          clock_type: clockType,
          method: 'face',
          device_id: getDeviceId()
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const staff = result.staff
        setLastCheckIn({
          name: staff.full_name,
          department: staff.department,
          time: new Date(staff[clockType === 'check_in' ? 'clock_in_time' : 'check_out_time']).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          date: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }),
          is_late: staff.is_late,
          confidence: Math.round(bestMatch.confidence * 100)
        })
        setShowSuccess(true)
        toast.success(`✅ ${clockType === 'check_in' ? 'Clocked in' : 'Clocked out'} successfully!`)

        // Auto-reset after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          setLastCheckIn(null)
          setScanning(false)
        }, 3000)
      } else {
        toast.error(result.error || 'Clock-in failed')
        setScanning(false)
      }
    } catch (error) {
      console.error('Face scan error:', error)
      toast.error('Scan failed. Please try again.')
      setScanning(false)
    }
  }

  const compareFaceEmbeddings = (embedding1: number[], embedding2: number[]): number => {
    let sum = 0
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i]
      sum += diff * diff
    }
    const distance = Math.sqrt(sum)
    const similarity = Math.max(0, 1 - distance / 0.6)
    return similarity
  }

  const getDeviceId = (): string => {
    const nav = navigator
    const screen = window.screen
    const fingerprint = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|')
    
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return `device_${Math.abs(hash).toString(36)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 flex flex-col">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-white/80 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              📸 Face Clock {clockType === 'check_in' ? 'In' : 'Out'}
            </h1>
            <p className="text-white/90 text-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-white/70 text-base mt-1">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {enrolledFaces.length > 0 && (
              <p className="text-white/60 text-sm mt-2">
                ✅ {enrolledFaces.length} staff enrolled
              </p>
            )}
          </div>

          {/* Clock Type Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex">
              <button
                onClick={() => setClockType('check_in')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  clockType === 'check_in'
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Clock In
              </button>
              <button
                onClick={() => setClockType('check_out')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  clockType === 'check_out'
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Clock Out
              </button>
            </div>
          </div>

          {/* Success Display */}
          {showSuccess && lastCheckIn && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-6 animate-fade-in">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {lastCheckIn.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {lastCheckIn.department}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-green-700 dark:text-green-400 font-bold text-xl mb-1">
                    {clockType === 'check_in' ? 'Clocked In' : 'Clocked Out'}: {lastCheckIn.time}
                  </p>
                  <p className="text-green-600 dark:text-green-500 text-sm">
                    {lastCheckIn.date}
                  </p>
                  {lastCheckIn.is_late && (
                    <p className="text-yellow-600 dark:text-yellow-500 text-sm mt-2">
                      ⚠️ Late Arrival
                    </p>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                    Match Confidence: {lastCheckIn.confidence}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Camera Section */}
          {!showSuccess && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6">
              {!cameraActive ? (
                <div className="text-center py-12">
                  <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-7xl">📸</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                    Position Your Face
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Look directly at the camera for recognition
                  </p>
                  <button
                    onClick={startCamera}
                    disabled={!modelsLoaded}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 shadow-lg"
                  >
                    {modelsLoaded ? '📸 Start Camera' : 'Loading...'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ 
                        display: 'block',
                        minHeight: '300px',
                        maxHeight: '600px',
                        backgroundColor: '#000',
                        width: '100%'
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                    
                    {/* Loading indicator when camera is starting */}
                    {cameraActive && videoRef.current && videoRef.current.readyState < 2 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <div className="text-center text-white">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p>Loading camera...</p>
                        </div>
                      </div>
                    )}
                    
                    {faceDetected && !scanning && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Face Detected
                      </div>
                    )}
                    
                    {!faceDetected && !scanning && videoRef.current && videoRef.current.readyState >= 2 && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ⚠ No Face
                      </div>
                    )}

                    {scanning && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-white font-medium">Recognizing...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleFaceScan}
                    disabled={scanning || !faceDetected}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4"
                  >
                    {scanning ? 'Scanning...' : `✓ ${clockType === 'check_in' ? 'Clock In' : 'Clock Out'}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Alternative PIN Entry */}
          {!showSuccess && (
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm mb-3">Face recognition not working?</p>
              <button
                onClick={() => router.push('/pin-clock-in')}
                className="text-white hover:text-white/80 underline text-base font-medium transition-colors"
              >
                Use PIN Instead →
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-white/40 text-xs">
          HOLYKIDS Facial Recognition Attendance System
        </p>
      </div>
    </div>
  )
}
