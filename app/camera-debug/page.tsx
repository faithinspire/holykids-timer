'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CameraDebugPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [permissions, setPermissions] = useState<string>('unknown')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  useEffect(() => {
    checkPermissions()
    listDevices()
  }, [])

  const checkPermissions = async () => {
    try {
      addLog('Checking camera permissions...')
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setPermissions(result.state)
      addLog(`Permission state: ${result.state}`)
      
      result.addEventListener('change', () => {
        setPermissions(result.state)
        addLog(`Permission changed to: ${result.state}`)
      })
    } catch (error: any) {
      addLog(`Permission check error: ${error.message}`)
    }
  }

  const listDevices = async () => {
    try {
      addLog('Listing media devices...')
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const cameras = deviceList.filter(d => d.kind === 'videoinput')
      setDevices(cameras)
      addLog(`Found ${cameras.length} camera(s)`)
      cameras.forEach((cam, i) => {
        addLog(`Camera ${i + 1}: ${cam.label || 'Unknown'} (${cam.deviceId.substring(0, 8)}...)`)
      })
    } catch (error: any) {
      addLog(`Device list error: ${error.message}`)
    }
  }

  const testCamera = async (deviceId?: string) => {
    try {
      addLog('Requesting camera access...')
      
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'user', width: 640, height: 480 }
      }
      
      addLog(`Constraints: ${JSON.stringify(constraints)}`)
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      addLog('✅ Camera access granted!')
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        addLog('Video element connected')
        
        videoRef.current.onloadedmetadata = () => {
          addLog(`Video dimensions: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`)
        }
        
        videoRef.current.onplay = () => {
          addLog('Video playing')
        }
        
        setCameraActive(true)
        
        // Re-list devices to get labels
        await listDevices()
      }
    } catch (error: any) {
      addLog(`❌ Camera error: ${error.name}`)
      addLog(`Error message: ${error.message}`)
      
      if (error.name === 'NotAllowedError') {
        addLog('⚠️ SOLUTION: Allow camera permission in browser settings')
      } else if (error.name === 'NotFoundError') {
        addLog('⚠️ SOLUTION: No camera found on device')
      } else if (error.name === 'NotReadableError') {
        addLog('⚠️ SOLUTION: Camera in use by another app')
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => {
        track.stop()
        addLog(`Stopped track: ${track.kind}`)
      })
      videoRef.current.srcObject = null
      setCameraActive(false)
      addLog('Camera stopped')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">📹 Camera Debug Tool</h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>

        {/* Permission Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">Permission Status</h2>
          <div className={`text-lg font-mono ${
            permissions === 'granted' ? 'text-green-400' : 
            permissions === 'denied' ? 'text-red-400' : 
            'text-yellow-400'
          }`}>
            {permissions.toUpperCase()}
          </div>
        </div>

        {/* Available Cameras */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">Available Cameras ({devices.length})</h2>
          {devices.length === 0 ? (
            <p className="text-gray-400">No cameras detected or permission not granted</p>
          ) : (
            <div className="space-y-2">
              {devices.map((device, i) => (
                <div key={device.deviceId} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                  <div>
                    <div className="font-medium">{device.label || `Camera ${i + 1}`}</div>
                    <div className="text-sm text-gray-400">{device.deviceId.substring(0, 20)}...</div>
                  </div>
                  <button
                    onClick={() => testCamera(device.deviceId)}
                    className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
                  >
                    Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => testCamera()}
            className="bg-green-600 py-4 rounded-lg font-bold text-lg hover:bg-green-500"
          >
            🎥 Test Default Camera
          </button>
          <button
            onClick={stopCamera}
            disabled={!cameraActive}
            className="bg-red-600 py-4 rounded-lg font-bold text-lg hover:bg-red-500 disabled:opacity-50"
          >
            ⏹️ Stop Camera
          </button>
        </div>

        {/* Video Preview */}
        <div className="bg-black rounded-lg overflow-hidden mb-4" style={{ minHeight: '300px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
            style={{ display: 'block' }}
          />
          {!cameraActive && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Camera preview will appear here
            </div>
          )}
        </div>

        {/* Debug Logs */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Debug Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
          <div className="bg-black rounded p-3 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={
                  log.includes('✅') ? 'text-green-400' :
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('⚠️') ? 'text-yellow-400' :
                  'text-gray-300'
                }>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-900/50 rounded-lg p-4">
          <h3 className="font-bold mb-2">📋 Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check permission status above (should be "GRANTED")</li>
            <li>If "DENIED": Go to browser settings and allow camera</li>
            <li>If "PROMPT": Click test button and allow when asked</li>
            <li>Try each camera if multiple are listed</li>
            <li>Check debug logs for specific error messages</li>
            <li>If camera works here, the issue is with face-api.js</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
