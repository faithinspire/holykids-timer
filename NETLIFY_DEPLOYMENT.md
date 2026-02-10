# Deploying HOLYKIDS Biometric Attendance to Netlify

## ✅ Configuration Updated

Your app has been configured for Netlify deployment. Follow these steps:

## Step 1: Install Dependencies

```bash
npm install
```

This will install the `@netlify/next` package needed for proper deployment.

## Step 2: Configure Environment Variables in Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these values:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_SUPABASE_URL | `https://mmluzuxcoqyrtenstkxq.supabase.co` |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHV6dXhjb3F5cnRlbnN0a3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mjg3MTksImV4cCI6MjA4NTIwNDcxOX0.c8fGCzUxFNOW9s7Q-8JPwBEMsfQHflGex108fXXZpTc` |
| SUPABASE_SERVICE_ROLE_KEY | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHV6dXhjb3F5cnRlbnN0a3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYyODcxOSwiZXhwIjoyMDg1MjA0NzE5fQ.QdOIYO18gIjfc6AGHxc-gXg0ShWbMT7fTJSsJ_sVtnk` |
| NEXT_PUBLIC_APP_NAME | `HOLYKIDS Staff Attendance` |
| NEXT_PUBLIC_ORGANIZATION_NAME | `HOLYKIDS School` |
| NEXT_PUBLIC_APP_URL | `https://YOUR-SITE-NAME.netlify.app` |
| NEXT_PUBLIC_REQUIRE_HTTPS | `true` |

5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

## Step 3: Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Netlify will automatically detect Next.js and use the correct settings
4. Add environment variables in Netlify dashboard
5. Trigger a new deploy

## Step 4: Verify Deployment

1. Open your Netlify site URL
2. Go to `/test-connection` to verify Supabase connection
3. Test login and staff management

## Common Issues Fixed

✅ **API routes now working** - Configured proper Netlify Functions handler
✅ **Static assets loading** - Fixed cache headers and redirects
✅ **Next.js pages rendering** - Removed conflicting SPA fallback rules

## Troubleshooting

If build fails with Node version error, ensure netlify.toml has `NODE_VERSION = "18"`

If API routes return 404, check that environment variables are set in Netlify

---

**Created by Olushola Paul Odunuga**
