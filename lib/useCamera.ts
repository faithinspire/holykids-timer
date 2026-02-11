import { useRef, useState, useCallback, useEffect } from 'react'

export interface CameraOptions {
  facingMode?: 'user' | 'environment'
  width?: number
  height?: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface CameraState {
  isActive: boolean
  isLoading: boolean
  error: string | null
  stream: MediaStream | null
}

export function useCamera(options: CameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<CameraState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [state.stream])

  const startCamera = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('🎥 [useCamera] Starting camera...')

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      // Build constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'user',
          width: { ideal: options.width || 640, min: 320, max: 1280 },
          height: { ideal: options.height || 480, min: 240, max: 720 },
          aspectRatio: { ideal: 1.333 }
        },
        audio: false
      }

      console.log('🎥 [useCamera] Requesting with constraints:', constraints)

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      if (mediaStream.getVideoTracks().length === 0) {
        throw new Error('No video tracks available')
      }

      const videoTrack = mediaStream.getVideoTracks()[0]
      console.log('✅ [useCamera] Got video track:', {
        label: videoTrack.label,
        settings: videoTrack.getSettings()
      })

      // Attach to video element
      if (!videoRef.current) {
        throw new Error('Video element not available')
      }

      videoRef.current.srcObject = mediaStream

      // Wait for metadata
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element lost'))
          return
        }

        const video = videoRef.current
        const timeout = setTimeout(() => {
          cleanup()
          reject(new Error('Video load timeout'))
        }, 10000)

        const onLoadedMetadata = () => {
          console.log('✅ [useCamera] Video ready:', {
            width: video.videoWidth,
            height: video.videoHeight
          })
          cleanup()
          resolve()
        }

        const onError = () => {
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

      // Force play
      try {
        await videoRef.current.play()
      } catch (playError) {
        console.warn('⚠️ [useCamera] Auto-play warning:', playError)
      }

      setState({
        isActive: true,
        isLoading: false,
        error: null,
        stream: mediaStream
      })

      options.onSuccess?.()
      console.log('✅ [useCamera] Camera started successfully')

    } catch (error: any) {
      console.error('❌ [useCamera] Error:', error)

      let errorMessage = 'Could not access camera'

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera in use by another app'
      } else if (error.name === 'OverconstrainedError') {
        // Retry with basic constraints
        try {
          console.log('⚠️ [useCamera] Retrying with basic constraints...')
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
          
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream
            await videoRef.current.play()
            
            setState({
              isActive: true,
              isLoading: false,
              error: null,
              stream: basicStream
            })
            
            options.onSuccess?.()
            return
          }
        } catch (retryError) {
          errorMessage = 'Camera constraints not supported'
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      setState({
        isActive: false,
        isLoading: false,
        error: errorMessage,
        stream: null
      })

      options.onError?.(new Error(errorMessage))
    }
  }, [options])

  const stopCamera = useCallback(() => {
    console.log('🛑 [useCamera] Stopping camera...')

    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        console.log(`🛑 [useCamera] Stopping track: ${track.label}`)
        track.stop()
      })
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setState({
      isActive: false,
      isLoading: false,
      error: null,
      stream: null
    })

    console.log('✅ [useCamera] Camera stopped')
  }, [state.stream])

  const captureImage = useCallback((quality: number = 0.8): string | null => {
    if (!videoRef.current) {
      console.error('❌ [useCamera] Video element not available')
      return null
    }

    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      console.error('❌ [useCamera] Video not ready')
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('❌ [useCamera] Could not get canvas context')
      return null
    }

    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', quality)
    
    console.log('✅ [useCamera] Image captured')
    return imageData
  }, [])

  return {
    videoRef,
    ...state,
    startCamera,
    stopCamera,
    captureImage
  }
}
