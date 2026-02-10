# Deployment Guide

## 🚀 Complete Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 2: Setup Supabase

#### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `school-attendance-system`
   - Database Password: Generate a strong password
   - Region: Choose closest to your location
5. Wait for project creation (2-3 minutes)

#### 2.2 Get Project Credentials
1. Go to Project Settings → API
2. Copy the following:
   - Project URL
   - Anon (public) key
   - Service role key (keep this secret!)

#### 2.3 Run Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and run the SQL script
4. Verify tables are created in Table Editor

### Step 3: Configure Environment Variables

#### 3.1 Update .env.local
Replace the placeholder values in `.env.local`:

```env
# Replace with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# Update app configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SCHOOL_NAME=Your School Name

# Optional: Enable geofencing
NEXT_PUBLIC_SCHOOL_LATITUDE=40.7128
NEXT_PUBLIC_SCHOOL_LONGITUDE=-74.0060
NEXT_PUBLIC_GEOFENCE_RADIUS=500
```

#### 3.2 Create Admin User
1. Go to Supabase Authentication → Users
2. Click "Add User"
3. Enter admin details:
   - Email: `admin@yourschool.edu`
   - Password: Create a strong password
   - Email Confirm: Yes
4. Copy the User ID
5. Go to SQL Editor and run:

```sql
-- Update the staff table with your admin user ID
UPDATE staff 
SET id = 'your-copied-user-id'
WHERE staff_id = 'ADMIN001';
```

### Step 4: Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` and login with your admin credentials.

### Step 5: Production Deployment

#### Option A: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard
   - Deploy

3. **Configure Domain**
   - Add custom domain in Vercel settings
   - Update `NEXT_PUBLIC_APP_URL` in environment variables

#### Option B: Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `.next`
3. **Environment Variables**: Add all from `.env.local`

#### Option C: Docker

```dockerfile
# Create Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t school-attendance .
docker run -p 3000:3000 --env-file .env.local school-attendance
```

### Step 6: SSL Certificate (Required for WebAuthn)

WebAuthn requires HTTPS in production. Most hosting providers (Vercel, Netlify) provide automatic SSL.

For custom domains:
- Use Let's Encrypt for free SSL
- Configure your web server (Nginx, Apache) for HTTPS
- Ensure all traffic redirects to HTTPS

### Step 7: PWA Setup

#### 7.1 Generate App Icons
Create icons in `public/icons/` directory:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

#### 7.2 Test PWA Installation
1. Open app in mobile browser
2. Look for "Add to Home Screen" prompt
3. Install and test offline functionality

### Step 8: Configure Email Notifications (Optional)

#### 8.1 Gmail Setup
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Google Account → Security → App passwords
   - Select "Mail" and your device
   - Copy the generated password

#### 8.2 Update Environment Variables
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 9: Testing Checklist

#### 9.1 Authentication Testing
- [ ] Admin login works
- [ ] Staff login works
- [ ] Role-based access control
- [ ] Session management

#### 9.2 Biometric Testing
- [ ] WebAuthn support detection
- [ ] Fingerprint enrollment
- [ ] Fingerprint authentication
- [ ] Fallback authentication

#### 9.3 Attendance Testing
- [ ] Check-in functionality
- [ ] Check-out functionality
- [ ] Geofencing (if enabled)
- [ ] Status calculation
- [ ] History tracking

#### 9.4 Mobile Testing
- [ ] Responsive design
- [ ] Touch interactions
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Performance on 3G

### Step 10: Go Live

#### 10.1 Final Configuration
1. Update production URLs
2. Configure monitoring (Sentry, LogRocket)
3. Set up backup schedules
4. Configure analytics

#### 10.2 User Onboarding
1. Create staff accounts in Supabase Auth
2. Import staff data via SQL or admin panel
3. Send login credentials to staff
4. Provide training materials

#### 10.3 Launch Checklist
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Database populated with staff data
- [ ] Admin accounts created
- [ ] Backup system configured
- [ ] Monitoring tools active
- [ ] Documentation provided to users

## 🔧 Troubleshooting

### Common Issues

#### WebAuthn Not Working
- Ensure HTTPS is enabled
- Check browser compatibility
- Verify device has fingerprint sensor
- Clear browser cache and cookies

#### Database Connection Issues
- Verify Supabase credentials
- Check Row Level Security policies
- Ensure user has proper permissions

#### PWA Installation Issues
- Verify manifest.json is accessible
- Check service worker registration
- Ensure HTTPS is enabled
- Test on different browsers

#### Performance Issues
- Enable caching in hosting provider
- Optimize images and assets
- Check database query performance
- Monitor bundle size

### Support Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **WebAuthn Guide**: [webauthn.guide](https://webauthn.guide)
- **PWA Checklist**: [web.dev/pwa-checklist](https://web.dev/pwa-checklist)

## 📊 Monitoring & Maintenance

### Performance Monitoring
- Set up Vercel Analytics or Google Analytics
- Monitor Core Web Vitals
- Track user engagement metrics
- Monitor error rates

### Database Maintenance
- Regular backup verification
- Query performance monitoring
- Storage usage tracking
- Index optimization

### Security Monitoring
- Regular security audits
- Dependency updates
- SSL certificate renewal
- Access log monitoring

---

**Created by Olushola Paul Odunuga**

For additional support, please refer to the main README.md or contact the development team.