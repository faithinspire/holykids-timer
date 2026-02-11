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
    loadModelsAndFaces()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadModelsAndFaces = async () => {
    try {
      // Load face-api models
      toast.loading('Loading face recognition...')
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      toast.dismiss()
      setModelsLoaded(true)

      // Load enrolled faces
      const response = await fetch('/api/face/enroll')
      const data = await response.json()
      
      if (data.enrolled_faces && data.enrolled_faces.length > 0) {
        setEnrolledFaces(data.enrolled_faces)
        toast.success(`${data.enrolled_faces.length} staff enrolled`)
      } else {
        toast('No staff enrolled yet', { icon: '⚠️' })
      }
    } catch (error) {
      console.error('Error loading:', error)
      toast.error('Failed to load face recognition')
    } finally {
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
        startFaceDetection()
      }
    } catch (error) {
      console.error('Camera error:', error)
      toast.error('Could not access camera')
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
                  <div className="relative mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-xl"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full"
                    />
                    
                    {faceDetected && !scanning && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Face Detected
                      </div>
                    )}
                    
                    {!faceDetected && !scanning && (
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
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
