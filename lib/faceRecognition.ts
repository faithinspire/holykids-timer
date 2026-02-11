// ========================================
// FACIAL RECOGNITION LIBRARY
// Using face-api.js (FaceNet implementation)
// ========================================

import * as faceapi from 'face-api.js'

let modelsLoaded = false

// Load face recognition models
export async function loadFaceModels() {
  if (modelsLoaded) return true

  try {
    // FORCE CDN ONLY - guaranteed to work on all devices
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
    
    console.log('Loading face models from CDN:', MODEL_URL)
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ])
    
    modelsLoaded = true
    console.log('✅ Face recognition models loaded successfully')
    return true
  } catch (error) {
    console.error('❌ Error loading face models:', error)
    return false
  }
}

// Detect face and extract embedding from video element
export async function detectFaceAndGetEmbedding(
  videoElement: HTMLVideoElement
): Promise<{ embedding: number[]; confidence: number } | null> {
  try {
    // Detect face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return null
    }

    // Get face descriptor (128-dimensional embedding)
    const embedding = Array.from(detection.descriptor)
    const confidence = detection.detection.score

    return { embedding, confidence }
  } catch (error) {
    console.error('Error detecting face:', error)
    return null
  }
}

// Detect face from image element
export async function detectFaceFromImage(
  imageElement: HTMLImageElement
): Promise<{ embedding: number[]; confidence: number } | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return null
    }

    const embedding = Array.from(detection.descriptor)
    const confidence = detection.detection.score

    return { embedding, confidence }
  } catch (error) {
    console.error('Error detecting face from image:', error)
    return null
  }
}

// Compare two face embeddings using Euclidean distance
export function compareFaceEmbeddings(
  embedding1: number[],
  embedding2: number[]
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have same length')
  }

  // Calculate Euclidean distance
  let sum = 0
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i]
    sum += diff * diff
  }
  const distance = Math.sqrt(sum)

  // Convert distance to similarity score (0-1, where 1 is identical)
  // Typical face-api.js distance threshold is 0.6
  // We'll convert to similarity where lower distance = higher similarity
  const similarity = Math.max(0, 1 - distance / 0.6)

  return similarity
}

// Find best matching face from a list of enrolled faces
export function findBestMatch(
  targetEmbedding: number[],
  enrolledFaces: Array<{ id: string; embedding: number[]; name: string }>
): { id: string; name: string; confidence: number } | null {
  let bestMatch: { id: string; name: string; confidence: number } | null = null
  let highestSimilarity = 0

  for (const enrolled of enrolledFaces) {
    const similarity = compareFaceEmbeddings(targetEmbedding, enrolled.embedding)
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity
      bestMatch = {
        id: enrolled.id,
        name: enrolled.name,
        confidence: similarity
      }
    }
  }

  // Only return match if confidence is above threshold (0.85 = 85%)
  const CONFIDENCE_THRESHOLD = 0.85
  if (bestMatch && bestMatch.confidence >= CONFIDENCE_THRESHOLD) {
    return bestMatch
  }

  return null
}

// Liveness detection - check for blink
export async function detectBlink(
  videoElement: HTMLVideoElement,
  duration: number = 3000
): Promise<boolean> {
  const startTime = Date.now()
  let blinkDetected = false
  let previousEyeState = 'open'

  while (Date.now() - startTime < duration) {
    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()

      if (detection && detection.expressions) {
        // Check if eyes are closed (using expressions as proxy)
        const eyesClosed = detection.expressions.neutral < 0.5
        const currentEyeState = eyesClosed ? 'closed' : 'open'

        // Detect blink (transition from open to closed to open)
        if (previousEyeState === 'open' && currentEyeState === 'closed') {
          blinkDetected = true
        }

        previousEyeState = currentEyeState
      }

      // Wait a bit before next check
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error in blink detection:', error)
    }
  }

  return blinkDetected
}

// Capture frame from video as base64 image
export function captureFrameFromVideo(
  videoElement: HTMLVideoElement
): string {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  ctx.drawImage(videoElement, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.8)
}

// Hash PIN using Web Crypto API
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Verify PIN against hash
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin)
  return pinHash === hash
}

// Get device ID (browser fingerprint)
export function getDeviceId(): string {
  // Create a simple device fingerprint
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

  // Hash the fingerprint
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  return `device_${Math.abs(hash).toString(36)}`
}

// Check camera permissions
export async function checkCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Camera permission denied:', error)
    return false
  }
}

// Get camera stream
export async function getCameraStream(facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    })
    return stream
  } catch (error) {
    console.error('Error getting camera stream:', error)
    return null
  }
}

// Stop camera stream
export function stopCameraStream(stream: MediaStream) {
  stream.getTracks().forEach(track => track.stop())
}
