'use client'

import { useState } from 'react'

export default function TestModelsPage() {
  const [results, setResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const testModelFiles = async () => {
    setTesting(true)
    setResults([])
    
    const modelFiles = [
      '/models/tiny_face_detector_model-weights_manifest.json',
      '/models/tiny_face_detector_model-shard1',
      '/models/face_landmark_68_model-weights_manifest.json',
      '/models/face_landmark_68_model-shard1',
      '/models/face_recognition_model-weights_manifest.json',
      '/models/face_recognition_model-shard1'
    ]

    const testResults = []

    for (const file of modelFiles) {
      try {
        console.log(`Testing: ${file}`)
        const response = await fetch(file)
        const status = response.status
        const statusText = response.statusText
        const contentType = response.headers.get('content-type')
        
        let content = ''
        if (file.includes('.json')) {
          try {
            const json = await response.json()
            content = JSON.stringify(json, null, 2).substring(0, 200) + '...'
          } catch {
            content = 'Failed to parse JSON'
          }
        } else {
          const blob = await response.blob()
          content = `Binary file, size: ${blob.size} bytes`
        }

        testResults.push({
          file,
          status,
          statusText,
          contentType,
          content,
          success: status === 200
        })
      } catch (error: any) {
        testResults.push({
          file,
          status: 'ERROR',
          statusText: error.message,
          contentType: 'N/A',
          content: error.stack || error.message,
          success: false
        })
      }
    }

    setResults(testResults)
    setTesting(false)
  }

  const testFaceApiLoad = async () => {
    setTesting(true)
    const testResults = [...results]
    
    try {
      console.log('Testing face-api.js loading...')
      
      // Dynamically import face-api
      const faceapi = await import('face-api.js')
      
      testResults.push({
        file: 'face-api.js import',
        status: 200,
        statusText: 'OK',
        contentType: 'module',
        content: 'face-api.js imported successfully',
        success: true
      })

      // Try loading models
      const MODEL_URL = '/models'
      
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        testResults.push({
          file: 'TinyFaceDetector.loadFromUri',
          status: 200,
          statusText: 'OK',
          contentType: 'model',
          content: 'TinyFaceDetector loaded successfully',
          success: true
        })
      } catch (error: any) {
        testResults.push({
          file: 'TinyFaceDetector.loadFromUri',
          status: 'ERROR',
          statusText: 'FAILED',
          contentType: 'model',
          content: error.message + '\n\n' + error.stack,
          success: false
        })
      }

      try {
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        testResults.push({
          file: 'FaceLandmark68Net.loadFromUri',
          status: 200,
          statusText: 'OK',
          contentType: 'model',
          content: 'FaceLandmark68Net loaded successfully',
          success: true
        })
      } catch (error: any) {
        testResults.push({
          file: 'FaceLandmark68Net.loadFromUri',
          status: 'ERROR',
          statusText: 'FAILED',
          contentType: 'model',
          content: error.message + '\n\n' + error.stack,
          success: false
        })
      }

      try {
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        testResults.push({
          file: 'FaceRecognitionNet.loadFromUri',
          status: 200,
          statusText: 'OK',
          contentType: 'model',
          content: 'FaceRecognitionNet loaded successfully',
          success: true
        })
      } catch (error: any) {
        testResults.push({
          file: 'FaceRecognitionNet.loadFromUri',
          status: 'ERROR',
          statusText: 'FAILED',
          contentType: 'model',
          content: error.message + '\n\n' + error.stack,
          success: false
        })
      }

    } catch (error: any) {
      testResults.push({
        file: 'face-api.js import',
        status: 'ERROR',
        statusText: 'FAILED',
        contentType: 'module',
        content: error.message + '\n\n' + error.stack,
        success: false
      })
    }

    setResults(testResults)
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Model Files Diagnostic</h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={testModelFiles}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold disabled:opacity-50"
          >
            {testing ? 'Testing...' : '1. Test Model File Access'}
          </button>

          <button
            onClick={testFaceApiLoad}
            disabled={testing}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold disabled:opacity-50 ml-4"
          >
            {testing ? 'Testing...' : '2. Test face-api.js Loading'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Results:</h2>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  result.success ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{result.file}</h3>
                  <span className={`px-3 py-1 rounded ${result.success ? 'bg-green-600' : 'bg-red-600'}`}>
                    {result.status} {result.statusText}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  Content-Type: {result.contentType}
                </div>
                <pre className="bg-black/50 p-3 rounded text-xs overflow-x-auto">
                  {result.content}
                </pre>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-900/30 border border-blue-500 p-6 rounded-lg">
          <h3 className="font-bold text-xl mb-4">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Test Model File Access" to verify all 6 model files are accessible</li>
            <li>All files should return status 200 OK</li>
            <li>JSON files should show valid JSON content</li>
            <li>Binary files should show file size</li>
            <li>Click "Test face-api.js Loading" to test actual model loading</li>
            <li>Take a screenshot of any errors and share with support</li>
          </ol>
        </div>

        <div className="mt-8 bg-yellow-900/30 border border-yellow-500 p-6 rounded-lg">
          <h3 className="font-bold text-xl mb-4">Expected Files:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>/models/tiny_face_detector_model-weights_manifest.json</li>
            <li>/models/tiny_face_detector_model-shard1</li>
            <li>/models/face_landmark_68_model-weights_manifest.json</li>
            <li>/models/face_landmark_68_model-shard1</li>
            <li>/models/face_recognition_model-weights_manifest.json</li>
            <li>/models/face_recognition_model-shard1</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
