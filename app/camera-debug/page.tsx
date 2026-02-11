'use client'

import { useRef, useState, useEffect } from 'react'

export default function CameraDebugPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [permissions, setPermissions] = useState<string>('unknown')

  useEffect(() => {
    checkPermissions()
    listDevices()
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const checkPermissions = async () => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        setPermissions(result.state)
        addLog(`Camera permission: ${result.state}`)
      } else {
        addLog('Permissions API not supported')
      }
    } catch (err) {
      addLog('Could not check permissions')
    }
  }

  const listDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = deviceList.filter(d => d.kind === 'videoinput')
      setDevices(videoDevices)
      addLog(`Found ${videoDevices.length} camera(s)`)
      videoDevices.forEach((d, i) => {
        addLog(`Camera ${i + 1}: ${d.label || 'Unknown'}`)
      })
    } catch (err: any) {
      addLog(`Error listing devices: ${err.message}`)
    }
  }

  const startCamera = async () => {
    try {
      setError('')
      addLog('🎥 Requesting camera access...')
      
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      }
      
      addLog(`Constraints: ${JSON.stringify(constraints)}`)
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      addLog('✅ Got media stream')
      addLog(`Stream active: ${stream.active}`)
      addLog(`Video tracks: ${stream.getVideoTracks().length}`)
      
      if (stream.getVideoTracks().length > 0) {
        const track = stream.getVideoTracks()[0]
        addLog(`Track label: ${track.label}`)
        addLog(`Track enabled: ${track.enabled}`)
        addLog(`Track ready state: ${track.readyState}`)
        addLog(`Track settings: ${JSON.stringify(track.getSettings())}`)
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        addLog('✅ Stream assigned to video element')
        
        videoRef.current.onloadedmetadata = () => {
          addLog('✅ Video metadata loaded')
          addLog(`Video dimensions: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`)
        }
        
        videoRef.current.onplay = () => {
          addLog('✅ Video playing')
        }
        
        setCameraActive(true)
        addLog('✅ Camera should be visible now!')
      }
    } catch (err: any) {
      const errorMsg = `❌ Camera error: ${err.name} - ${err.message}`
      addLog(errorMsg)
      setError(errorMsg)
      
      if (err.name === 'NotAllowedError') {
        addLog('User denied camera permission')
      } else if (err.name === 'NotFoundError') {
        addLog('No camera found on device')
      } else if (err.name === 'NotReadableError') {
        addLog('Camera is in use by another app')
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => {
        track.stop()
        addLog(`Stopped track: ${track.label}`)
      })
      videoRef.current.srcObject = null
      setCameraActive(false)
      addLog('Camera stopped')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">📹 Camera Debug Tool</h1>
        
        {/* System Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">System Info</h2>
          <div className="text-sm space-y-1">
            <p>User Agent: {navigator.userAgent}</p>
            <p>Platform: {navigator.platform}</p>
            <p>Camera Permission: {permissions}</p>
            <p>Cameras Found: {devices.length}</p>
            <p>MediaDevices API: {navigator.mediaDevices ? '✅ Available' : '❌ Not Available'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 space-x-2">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold"
            >
              🎥 START CAMERA
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold"
            >
              ⏹️ STOP CAMERA
            </button>
          )}
          <button
            onClick={() => {
              setLogs([])
              checkPermissions()
              listDevices()
            }}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold"
          >
            🔄 REFRESH
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Video Display */}
        <div className="bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
            style={{ 
              minHeight: '300px', 
              maxHeight: '500px',
              display: 'block',
              backgroundColor: '#000'
            }}
          />
          {!cameraActive && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Camera not started
            </div>
          )}
        </div>

        {cameraActive && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-4 text-center">
            ✅ CAMERA IS ACTIVE - Can you see the video above?
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">Debug Logs</h2>
          <div className="bg-black rounded p-3 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-green-400">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-900/50 rounded-lg p-4">
          <h3 className="font-bold mb-2">📋 Instructions:</h3>
          <ul className="text-sm space-y-1">
            <li>1. Click "START CAMERA" button</li>
            <li>2. Allow camera permission when prompted</li>
            <li>3. Check if video appears in the black box above</li>
            <li>4. Review debug logs for any errors</li>
            <li>5. Take a screenshot and share with support if issues persist</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
