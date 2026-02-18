'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

declare const faceapi: any

export default function FaceClockInPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [processing, setProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [clockType, setClockType] = useState<'check_in' | 'check_out'>('check_in')
  const [result, setResult] = useState<any>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

  useEffect(() => {
    loadFaceModels()
    return () => {
      if (stream) {
        stream.getTracks().forEach((track: any) => track.stop())
      }
    }
  }, [])

  const loadFaceModels = async () => {
    if (typeof window === 'undefined') return
    
    try {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.min.js'
      script.async = true
      
      await new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })

      await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model')
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model')
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model')
      
      setModelsLoaded(true)
    } catch (error) {
      console.error('Failed to load face models:', error)
      setModelsError('Failed to load face recognition models')
    }
  }

  const startCamera = async () => {
    if (!modelsLoaded) {
      toast.error('Face recognition models not loaded yet')
      return
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setCameraActive(true)
        toast.success('Camera ready!')
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      let errorMessage = 'Could not access camera'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application.'
      }
      
      toast.error(errorMessage)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track: any) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setCapturedImage(null)
  }

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready')
      return
    }

    setProcessing(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')
      
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)
      
      toast.loading('Detecting face...')

      const img = await faceapi.fetchImage(imageData)
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        throw new Error('No face detected. Please try again.')
      }

      const faceEmbedding = Array.from(detection.descriptor)

      const enrolledResponse = await fetch('/api/face/enroll')
      const enrolledData = await enrolledResponse.json()

      if (!enrolledData.enrolled_faces || enrolledData.enrolled_faces.length === 0) {
        throw new Error('No enrolled faces found. Please enroll first.')
      }

      let bestMatch = null
      let bestDistance = Infinity

      for (const enrolled of enrolledData.enrolled_faces) {
        const distance = faceapi.euclideanDistance(faceEmbedding, enrolled.embedding)
        if (distance < bestDistance) {
          bestDistance = distance
          bestMatch = enrolled
        }
      }

      const threshold = 0.6
      if (bestDistance > threshold) {
        throw new Error('Face not recognized. Please try again or use PIN.')
      }

      toast.dismiss()
      toast.loading('Verifying...')

      const response = await fetch('/api/face/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: bestMatch.id,
          clock_type: clockType
        })
      })

      const data = await response.json()
      toast.dismiss()

      if (response.ok && data.success) {
        setResult({
          ...data,
          confidence: 1 - bestDistance
        })
        toast.success(`✅ ${clockType === 'check_in' ? 'Clocked in' : 'Clocked out'} successfully!`)
        
        setTimeout(() => {
          setResult(null)
          setCapturedImage(null)
          setProcessing(false)
        }, 3000)
      } else {
        throw new Error(data.error || 'Clock operation failed')
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      toast.dismiss()
      toast.error(error.message || 'Face verification failed')
      
      setTimeout(() => {
        if (confirm('Face verification failed. Use PIN instead?')) {
          router.push('/pin-clock-in')
        } else {
          setCapturedImage(null)
          setProcessing(false)
        }
      }, 1000)
    }
  }

  const retryCapture = () => {
    setCapturedImage(null)
    setProcessing(false)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 flex flex-col">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => {
            stopCamera()
            router.push('/admin/dashboard')
          }}
          className="text-white/80 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
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
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-6 animate-fade-in">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {result.staff.full_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {result.staff.department}
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-green-700 dark:text-green-400 font-bold text-xl mb-1">
                    {clockType === 'check_in' ? 'Clocked In' : 'Clocked Out'}
                  </p>
                  {result.confidence && (
                    <p className="text-green-600 dark:text-green-500 text-sm">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Camera Section */}
          {!result && (
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
                  {modelsError ? (
                    <p className="text-red-600 mb-4">{modelsError}</p>
                  ) : !modelsLoaded ? (
                    <p className="text-yellow-600 mb-4">Loading face recognition models...</p>
                  ) : null}
                  <button
                    onClick={startCamera}
                    disabled={!modelsLoaded}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {modelsLoaded ? '📸 Start Camera' : 'Loading...'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
                    {/* Live Video Feed */}
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ 
                        display: capturedImage ? 'none' : 'block',
                        minHeight: '300px',
                        maxHeight: '600px',
                        backgroundColor: '#000',
                        border: '2px solid #8b5cf6'
                      }}
                    />
                    
                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    
                    {/* Captured Image Preview */}
                    {capturedImage && (
                      <img 
                        src={capturedImage} 
                        alt="Captured" 
                        className="w-full h-full object-cover"
                        style={{ minHeight: '300px', maxHeight: '600px' }}
                      />
                    )}

                    {/* Processing Overlay */}
                    {processing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-white font-medium">Verifying face...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="mt-4 space-y-3">
                    {!capturedImage && !processing && (
                      <>
                        <button
                          onClick={captureAndVerify}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 shadow-lg"
                        >
                          📸 Capture & Verify
                        </button>
                        <button
                          onClick={stopCamera}
                          className="w-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium hover:bg-gray-400 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {capturedImage && !processing && !result && (
                      <button
                        onClick={retryCapture}
                        className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-700 shadow-lg"
                      >
                        🔄 Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PIN Fallback */}
          {!result && (
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm mb-3">Face recognition not working?</p>
              <button
                onClick={() => {
                  stopCamera()
                  router.push('/pin-clock-in')
                }}
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
