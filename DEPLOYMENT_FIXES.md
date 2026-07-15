# API Cross-Origin Request Fixes

## Problem
The frontend deployed on Vercel was making API requests to its own domain instead of the backend deployed on Render, resulting in 404 errors:
- ❌ `https://smart-help-desk-system.vercel.app/auth/register` (wrong - frontend domain)
- ✅ `https://smart-helpdesk-system.onrender.com/auth/register` (correct - backend domain)

## Solution Applied

### 1. **Client-Side Changes**

#### Updated `/client/src/utils/api.js`
- Fixed the Axios configuration to properly use `VITE_API_URL` in production
- Development: Uses empty baseURL to route through Vite dev proxy
- Production: Uses `import.meta.env.VITE_API_URL` environment variable

#### Updated `/client/.env.example`
```env
VITE_API_URL=https://smart-helpdesk-system.onrender.com
```

**Action Required:**
- When deploying on Vercel, set the environment variable in project settings:
  - Key: `VITE_API_URL`
  - Value: `https://smart-helpdesk-system.onrender.com`

### 2. **Server-Side Changes**

#### Updated `/server/index.js`
- Updated CORS configuration to accept the Vercel frontend URL
- Fallback to `https://smart-help-desk-system.vercel.app` if `CLIENT_URL` is not set

#### Updated `/server/.env.example`
```env
CLIENT_URL=https://smart-help-desk-system.vercel.app
```

**Action Required:**
- When deploying on Render, set the environment variable in project settings:
  - Key: `CLIENT_URL`
  - Value: `https://smart-help-desk-system.vercel.app`

## Deployment Steps

### Frontend (Vercel)
1. Go to Vercel project settings
2. Navigate to **Environment Variables**
3. Add/update:
   - Key: `VITE_API_URL`
   - Value: `https://smart-helpdesk-system.onrender.com`
4. Trigger a new deployment (push to main branch or redeploy)

### Backend (Render)
1. Go to Render project settings
2. Navigate to **Environment**
3. Add/update:
   - Key: `CLIENT_URL`
   - Value: `https://smart-help-desk-system.vercel.app`
4. Trigger a new deployment (push to main branch or manual redeploy)

## Verification

After deployment, verify API requests are working:

1. Open the frontend in your browser: `https://smart-help-desk-system.vercel.app`
2. Open browser DevTools (F12) → Network tab
3. Perform an action that makes an API request (login, view tickets, etc.)
4. Check that requests go to `https://smart-helpdesk-system.onrender.com/...` NOT the Vercel domain
5. Verify responses return 200/201 status codes (not 404)

## Additional Notes

- **withCredentials: true** is configured to allow cookies to be sent in cross-origin requests
- CORS is properly configured on the backend to accept cross-origin requests
- Environment variables are the source of truth for URLs across environments
- Changes are backward compatible with local development (uses proxy configuration)

## Files Modified

1. `/client/src/utils/api.js` - API configuration
2. `/client/.env.example` - Client environment template
3. `/server/index.js` - CORS configuration
4. `/server/.env.example` - Server environment template
