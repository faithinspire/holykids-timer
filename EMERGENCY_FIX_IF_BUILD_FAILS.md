# EMERGENCY FIX - IF BUILD STILL FAILS

## If Vercel Build STILL Shows "Module not found: Can't resolve 'face-api.js'"

This means the package-lock.json might be corrupted or out of sync.

---

## SOLUTION 1: Force Clean Install (RECOMMENDED)

Run these commands in your terminal:

```cmd
REM Delete the lock file
del package-lock.json

REM Delete node_modules (if it exists locally)
rmdir /s /q node_modules

REM Clean npm cache
cmd /c npm cache clean --force

REM Reinstall everything
cmd /c npm install

REM Verify face-api.js is installed
cmd /c npm list face-api.js

REM Commit the new lock file
git add package-lock.json
git commit -m "Regenerate package-lock.json with face-api.js"
git push origin main
```

---

## SOLUTION 2: Add Webpack Configuration to Next.js

If Solution 1 doesn't work, add explicit webpack configuration.

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  allowedDevOrigins: ['10.143.107.234', 'http://10.143.107.234:3000'],
  images: {
    unoptimized: true,
    domains: ['supabase.co', 'localhost'],
  },
  
  // ADD THIS WEBPACK CONFIGURATION
  webpack: (config, { isServer }) => {
    // Ensure face-api.js is properly resolved
    config.resolve.alias = {
      ...config.resolve.alias,
      'face-api.js': require.resolve('face-api.js'),
    }
    
    // Handle canvas module (face-api.js dependency)
    if (isServer) {
      config.externals = [...config.externals, 'canvas']
    }
    
    return config
  },
  
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self), biometric=(self)',
          },
        ],
      },
    ];
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
```

Then commit and push:
```cmd
git add next.config.js
git commit -m "Add webpack config for face-api.js"
git push origin main
```

---

## SOLUTION 3: Use Dynamic Imports Everywhere

If webpack config doesn't work, change all face-api.js imports to dynamic imports.

### Update `lib/faceRecognition.ts`:

```typescript
// Change from:
import * as faceapi from 'face-api.js'

// To:
let faceapi: any = null

async function loadFaceAPI() {
  if (!faceapi) {
    faceapi = await import('face-api.js')
  }
  return faceapi
}

// Then update all functions to call loadFaceAPI() first
export async function loadModels(): Promise<void> {
  const api = await loadFaceAPI()
  // ... rest of code using api instead of faceapi
}
```

### Update `app/face-clock-in/page.tsx`:

```typescript
// Change from:
import * as faceapi from 'face-api.js'

// To:
const [faceapi, setFaceapi] = useState<any>(null)

useEffect(() => {
  import('face-api.js').then(module => {
    setFaceapi(module)
  })
}, [])
```

---

## SOLUTION 4: Alternative - Use TensorFlow.js Directly

If face-api.js continues to cause problems, we can switch to TensorFlow.js with MediaPipe:

```cmd
cmd /c npm uninstall face-api.js
cmd /c npm install @tensorflow/tfjs @tensorflow-models/face-detection
```

This would require rewriting the face recognition code, but it's more stable and better maintained.

---

## SOLUTION 5: PIN-Only System (LAST RESORT)

If all else fails, we can disable facial recognition and use PIN-only:

1. Remove all face-api.js imports
2. Update clock-in pages to redirect to PIN clock-in
3. Hide face enrollment options
4. Use PIN as the primary authentication method

This is not ideal, but it would get the system working immediately.

---

## How to Choose:

1. **Try Solution 1 first** - Clean install usually fixes package issues
2. **If that fails, try Solution 2** - Webpack config helps with module resolution
3. **If still failing, try Solution 3** - Dynamic imports avoid build-time issues
4. **If desperate, try Solution 4** - Different library, same functionality
5. **Last resort: Solution 5** - PIN-only system (works but no facial recognition)

---

## Current Recommendation:

**WAIT** for the current Vercel deployment (commit 78d53be) to complete first.

If it succeeds: ✅ Problem solved!
If it fails: Try Solution 1 (clean install)

---

## Need Help?

If you're stuck, provide:
1. Full Vercel build log (copy/paste)
2. Which commit is being built
3. Exact error message
4. Whether you've run any of these solutions

I'll help you debug further.
