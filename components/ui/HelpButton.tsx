'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HelpButton() {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showMenu && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 p-3 w-64 mb-2">
          <div className="space-y-2">
            <Link 
              href="/troubleshoot"
              className="block px-4 py-2 text-sm hover:bg-gray-100 rounded"
              onClick={() => setShowMenu(false)}
            >
              🔧 Troubleshoot Issues
            </Link>
            <Link 
              href="/test-staff-api"
              className="block px-4 py-2 text-sm hover:bg-gray-100 rounded"
              onClick={() => setShowMenu(false)}
            >
              🧪 Test APIs
            </Link>
            <a 
              href="/api/diagnostic"
              target="_blank"
              className="block px-4 py-2 text-sm hover:bg-gray-100 rounded"
              onClick={() => setShowMenu(false)}
            >
              📊 View Diagnostics
            </a>
            <hr className="my-2" />
            <a 
              href="https://supabase.com/dashboard"
              target="_blank"
              className="block px-4 py-2 text-sm hover:bg-gray-100 rounded text-blue-600"
              onClick={() => setShowMenu(false)}
            >
              Supabase Dashboard ↗
            </a>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center text-2xl"
        title="Help & Troubleshooting"
      >
        {showMenu ? '✕' : '?'}
      </button>
    </div>
  )
}
