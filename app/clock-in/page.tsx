'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamicImport from 'next/dynamic'

const ThemeToggle = dynamicImport(() => import('@/components/ui/ThemeToggle'), { ssr: false })

export default function ClockInPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceapi, setFaceapi] = useState<any>(null)

  useEffect(() => {
    loadFaceAPI()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadFaceAPI = async () => {
    try {
      const faceapiModule = await import('face-api.js')
      setFaceapi(faceapiModule)
      
      // Load models in background (don't block UI)
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
      
      console.log('Loading AI models in background...')
      
      Promise.all([
        faceapiModule.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapiModule.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]).then(() => {
        console.log('✅ Models loaded successfully')
        loadEnrolledStaff()
      }).catch(error => {
        console.error('❌ Error loading models:', error)
        // Don't block - camera will still work
      })
    } catch (error) {
      console.error('❌ Error loading face-api:', error)
      // Don't show error - allow camera to work anyway
    }
  }

  useEffect(() => {
    if (cameraActive && videoRef.current && faceapi) {
      detectFace()
    }
  }, [cameraActive, faceapi])

  const loadEnrolledStaff = async () => {
    try {
      const response = await fetch('/api/face/enroll')
      const data = await response.json()
      
      if (data.enrolled_faces && data.enrolled_faces.length > 0) {
        setEnrolledCount(data.enrolled_faces.length)
        toast.success(`${data.enrolled_faces.length} staff enrolled`)
      } else {
        setEnrolledCount(0)
      }
    } catch (error) {
      console.log('Could not fetch enrolled faces')
      setEnrolledCount(0)
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
        
        // Start face detection after short delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            detectFace()
            console.log('✅ Face detection started')
          }
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Camera error:', error)
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

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || !faceapi || scanning) return

    const detection = await faceapi.detectSingleFace(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks()

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
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }

    if (cameraActive) {
      requestAnimationFrame(detectFace)
    }
  }

  const handleFaceScan = async () => {
    if (!faceDetected) {
      toast.error('No face detected. Please position your face in the frame.')
      return
    }

    if (enrolledCount === 0) {
      toast.error('No staff enrolled. Please enroll faces first in Staff Management.')
      return
    }

    setScanning(true)

    try {
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

      // Get enrolled faces
      const response = await fetch('/api/face/enroll')
      const data = await response.json()
      const enrolledFaces = data.enrolled_faces || []

      // Find best match
      let bestMatch: any = null
      let highestSimilarity = 0

      for (const enrolled of enrolledFaces) {
        const similarity = compareFaceEmbeddings(targetEmbedding, enrolled.embedding)
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity
          bestMatch = { ...enrolled, confidence: similarity }
        }
      }

      const CONFIDENCE_THRESHOLD = 0.85
      if (!bestMatch || bestMatch.confidence < CONFIDENCE_THRESHOLD) {
        toast.error('Face not recognized. Please try again or use PIN.')
        setScanning(false)
        return
      }

      // Clock in via API
      const clockResponse = await fetch('/api/face/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: bestMatch.id,
          clock_type: 'check_in',
          method: 'face',
          device_id: getDeviceId()
        })
      })

      const result = await clockResponse.json()

      if (clockResponse.ok && result.success) {
        const staff = result.staff
        setLastCheckIn({
          name: staff.full_name,
          department: staff.department,
          time: new Date(staff.clock_in_time).toLocaleTimeString('en-US', { 
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
        toast.success('✅ Clocked in successfully!')
        stopCamera()

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
    return Math.max(0, 1 - distance / 0.6)
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

  const handlePinEntry = () => {
    router.push('/pin-clock-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 transition-colors duration-300 flex flex-col">
      
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

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              📸 Face Recognition
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-white/70 text-base md:text-lg mt-1">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {enrolledCount > 0 && (
              <p className="text-white/60 text-sm mt-2">
                ✅ {enrolledCount} staff enrolled
              </p>
            )}
            {enrolledCount === 0 && (
              <p className="text-yellow-300 text-sm mt-2">
                ⚠️ No staff enrolled yet
              </p>
            )}
          </div>

          {/* Success Display */}
          {showSuccess && lastCheckIn && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-6 animate-fade-in">
              <div className="text-center">
                <div className="w-28 h-28 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
                  <span className="text-6xl">✅</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {lastCheckIn.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                  {lastCheckIn.department}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
                  <p className="text-green-700 dark:text-green-400 font-bold text-2xl mb-2">
                    Clocked In: {lastCheckIn.time}
                  </p>
                  <p className="text-green-600 dark:text-green-500 text-base">
                    {lastCheckIn.date}
                  </p>
                  {lastCheckIn.is_late && (
                    <p className="text-yellow-600 dark:text-yellow-500 text-sm mt-2">
                      ⚠️ Late Arrival
                    </p>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                    Match: {lastCheckIn.confidence}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Camera Section */}
          {!showSuccess && !cameraActive && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="text-center">
                <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-7xl">📸</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3">
                  Position Your Face
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-8">
                  Look directly at the camera for recognition
                </p>
                <button
                  onClick={startCamera}
                  className="w-full py-6 md:py-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-xl md:text-2xl"
                >
                  📸 Start Camera
                </button>
              </div>
            </div>
          )}

          {/* Camera Active */}
          {!showSuccess && cameraActive && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
              {/* Camera View - Simple Square Shape */}
              <div className="relative bg-black">
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
                    {faceDetected && !scanning ? (
                      <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
                        <span className="text-lg">✓</span>
                        <span>Face Detected</span>
                      </div>
                    ) : !scanning ? (
                      <div className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
                        <span className="text-lg">⚠</span>
                        <span>Position Your Face</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Guide Circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 md:w-64 md:h-64 border-4 border-white/50 rounded-full"></div>
                  </div>

                  {/* Scanning Overlay */}
                  {scanning && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-white font-medium">Recognizing...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 space-y-3">
                <button
                  onClick={handleFaceScan}
                  disabled={scanning || !faceDetected}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2"
                >
                  {scanning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">✓</span>
                      <span>Clock In</span>
                    </>
                  )}
                </button>

                <button
                  onClick={stopCamera}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium text-base hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Alternative PIN Entry */}
          {!showSuccess && (
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm mb-3">Face recognition not working?</p>
              <button
                onClick={handlePinEntry}
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
