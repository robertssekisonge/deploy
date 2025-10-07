# School Management System - Free Deployment Guide

## Quick Setup (5 minutes)

### 1. Backend on Render (Free)
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Name:** `sms-backend`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment Variables:**
     ```
     DATABASE_URL=postgresql://neondb_owner:npg_cBUm4in0bRlz@ep-wispy-mountain-addlj0j7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     NODE_ENV=production
     PORT=10000
     ```
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy the URL (e.g., `https://sms-backend-xyz.onrender.com`)

### 2. Frontend on Firebase Hosting (Free)
1. Go to https://console.firebase.google.com
2. Select project `sms-shools`
3. Go to "Hosting" → "Get started"
4. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
5. In your project folder:
   ```bash
   firebase init hosting
   # Choose: sms-shools, frontend/dist, Yes (SPA)
   ```
6. Create `frontend/.env.production`:
   ```
   VITE_API_BASE_URL=https://your-render-url.onrender.com/api
   ```
7. Build and deploy:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   firebase deploy
   ```

### 3. Database (Already Set Up)
- Neon Postgres is already configured
- Connection string is in backend/.env
- No additional setup needed

## Result
- **Frontend:** https://sms-shools.web.app
- **Backend:** https://your-app.onrender.com
- **Database:** Neon Postgres (cloud)
- **Cost:** $0/month

## Alternative: Local Backend + Cloudflare Tunnel
If you prefer to keep backend local:
1. Install Cloudflare Tunnel: `winget install Cloudflare.cloudflared`
2. Run: `cloudflared tunnel --url http://localhost:5000`
3. Use the tunnel URL in frontend/.env.production
4. Deploy frontend to Firebase Hosting

## Troubleshooting
- **Build fails:** Check Node.js version (use 18+)
- **Database errors:** Verify Neon connection string
- **CORS issues:** Add your domain to backend CORS settings
- **API not working:** Check environment variables in Render

## Next Steps
1. Test the deployed app
2. Set up custom domain (optional)
3. Configure email settings
4. Add SSL certificates (automatic on both platforms)
