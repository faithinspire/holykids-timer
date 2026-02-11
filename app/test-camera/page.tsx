'use client'

import { useRef, useState } from 'react'

export default function TestCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState('')

  const startCamera = async () => {
    try {
      setError('')
      console.log('Requesting camera...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      
      console.log('Got stream:', stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        console.log('Camera active!')
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setError(err.message || 'Camera failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-4">Camera Test</h1>
        
        {!cameraActive && (
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-bold mb-4"
          >
            START CAMERA
          </button>
        )}
        
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
            Error: {error}
          </div>
        )}
        
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
            style={{ minHeight: '400px', display: 'block' }}
          />
        </div>
        
        {cameraActive && (
          <div className="mt-4 bg-green-600 text-white p-4 rounded-lg text-center">
            ✅ CAMERA IS WORKING!
          </div>
        )}
      </div>
    </div>
  )
}
