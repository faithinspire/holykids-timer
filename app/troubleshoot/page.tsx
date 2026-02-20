'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TroubleshootPage() {
  const [envCheck, setEnvCheck] = useState({
    hasUrl: false,
    hasKey: false,
    urlValue: '',
    keyPreview: ''
  })

  useEffect(() => {
    setEnvCheck({
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...'
        : 'Not set'
    })
  }, [])

  const allGood = envCheck.hasUrl && envCheck.hasKey

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">🔧 Troubleshooting</h1>
          <p className="text-gray-600">Diagnose and fix common issues</p>
        </div>

        {/* Environment Status */}
        <div className={`rounded-lg shadow-lg p-6 mb-6 ${allGood ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <h2 className="text-2xl font-bold mb-4">
            {allGood ? '✅ Environment Variables OK' : '❌ Environment Variables Missing'}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
              <span className={envCheck.hasUrl ? 'text-green-600' : 'text-red-600'}>
                {envCheck.hasUrl ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            {envCheck.hasUrl && (
              <div className="text-xs text-gray-600 pl-3">
                {envCheck.urlValue}
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-white rounded">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              <span className={envCheck.hasKey ? 'text-green-600' : 'text-red-600'}>
                {envCheck.hasKey ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            {envCheck.hasKey && (
              <div className="text-xs text-gray-600 pl-3">
                {envCheck.keyPreview}
              </div>
            )}
          </div>

          {!allGood && (
            <div className="mt-6 p-4 bg-white rounded border-l-4 border-red-500">
              <h3 className="font-bold text-red-800 mb-2">How to Fix:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Go to <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a></li>
                <li>Select your project</li>
                <li>Go to Settings → API</li>
                <li>Copy the Project URL and anon/public key</li>
                <li>
                  <strong>For local development:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Create/edit <code className="bg-gray-100 px-1">.env.local</code> file</li>
                    <li>Add the variables</li>
                    <li>Restart dev server</li>
                  </ul>
                </li>
                <li>
                  <strong>For Render deployment:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Go to Render dashboard</li>
                    <li>Select your service</li>
                    <li>Go to Environment tab</li>
                    <li>Add the variables</li>
                    <li>Save (auto-redeploys)</li>
                  </ul>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Quick Tests */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🧪 Quick Tests</h2>
          
          <div className="space-y-3">
            <Link 
              href="/test-staff-api"
              className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-blue-900">Test Staff API</h3>
                  <p className="text-sm text-blue-700">Check if staff data loads correctly</p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Link>

            <a 
              href="/api/diagnostic"
              target="_blank"
              className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-purple-900">Diagnostic Endpoint</h3>
                  <p className="text-sm text-purple-700">View raw diagnostic data</p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </a>

            <a 
              href="/api/staff"
              target="_blank"
              className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-green-900">Staff API Endpoint</h3>
                  <p className="text-sm text-green-700">View raw staff data</p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </a>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🔍 Common Issues</h2>
          
          <div className="space-y-4">
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer font-bold hover:bg-gray-50">
                Staff not loading / Infinite loading spinner
              </summary>
              <div className="p-4 border-t bg-gray-50 text-sm">
                <p className="font-bold mb-2">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Environment variables not set</li>
                  <li>Staff table is empty</li>
                  <li>Database connection failed</li>
                  <li>Browser cache showing old version</li>
                </ul>
                <p className="font-bold mb-2">Solutions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check environment variables above</li>
                  <li>Run the Test Staff API</li>
                  <li>Clear browser cache (Ctrl+Shift+R)</li>
                  <li>Check Supabase staff table has records</li>
                </ol>
              </div>
            </details>

            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer font-bold hover:bg-gray-50">
                Camera not capturing images
              </summary>
              <div className="p-4 border-t bg-gray-50 text-sm">
                <p className="font-bold mb-2">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Camera permission denied</li>
                  <li>Camera in use by another app</li>
                  <li>Video not fully loaded</li>
                </ul>
                <p className="font-bold mb-2">Solutions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Allow camera permission in browser</li>
                  <li>Close other apps using camera</li>
                  <li>Wait for "Camera ready!" message</li>
                  <li>Check browser console (F12) for errors</li>
                </ol>
              </div>
            </details>

            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer font-bold hover:bg-gray-50">
                Face enrollment fails
              </summary>
              <div className="p-4 border-t bg-gray-50 text-sm">
                <p className="font-bold mb-2">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>No face detected in image</li>
                  <li>Face models not loaded</li>
                  <li>Poor lighting</li>
                </ul>
                <p className="font-bold mb-2">Solutions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ensure face is clearly visible</li>
                  <li>Use good lighting</li>
                  <li>Look directly at camera</li>
                  <li>Wait for models to load</li>
                  <li>Try capturing again</li>
                </ol>
              </div>
            </details>

            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer font-bold hover:bg-gray-50">
                Changes not showing after deployment
              </summary>
              <div className="p-4 border-t bg-gray-50 text-sm">
                <p className="font-bold mb-2">Solutions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Wait 2-3 minutes for deployment to complete</li>
                  <li>Check Render logs for deployment status</li>
                  <li>Clear browser cache (Ctrl+Shift+R)</li>
                  <li>Try incognito/private browsing mode</li>
                  <li>Check if changes are on GitHub</li>
                </ol>
              </div>
            </details>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📚 Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/admin/dashboard" className="p-3 bg-gray-50 hover:bg-gray-100 rounded border">
              Admin Dashboard
            </Link>
            <Link href="/admin/staff" className="p-3 bg-gray-50 hover:bg-gray-100 rounded border">
              Staff Management
            </Link>
            <Link href="/test-staff-api" className="p-3 bg-gray-50 hover:bg-gray-100 rounded border">
              API Test Page
            </Link>
            <a href="https://supabase.com/dashboard" target="_blank" className="p-3 bg-gray-50 hover:bg-gray-100 rounded border">
              Supabase Dashboard ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
