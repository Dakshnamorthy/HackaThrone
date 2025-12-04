# Update Frontend to Use Deployed ML Model

## After deploying to Vercel, follow these steps:

### Step 1: Add the URL to .env

Add this line to `/Users/sarathyv/HackaThrone-1/.env`:

```bash
VITE_ML_API_URL=https://your-vercel-deployment-url.vercel.app
```

Replace `your-vercel-deployment-url` with your actual Vercel URL.

### Step 2: Update ReportedIssues.jsx

The code needs to use the environment variable instead of hardcoded localhost.

Find these lines in `src/gov/ReportedIssues.jsx`:

**Line ~540 (Single issue prediction):**
```javascript
const response = await fetch('http://localhost:5001/api/calculate-priority', {
```

**Change to:**
```javascript
const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:5001';
const response = await fetch(`${mlApiUrl}/api/calculate-priority`, {
```

**Line ~670 (Batch prediction):**
```javascript
const response = await fetch('http://localhost:5001/api/calculate-priorities', {
```

**Change to:**
```javascript
const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:5001';
const response = await fetch(`${mlApiUrl}/api/calculate-priorities`, {
```

### Step 3: Restart your frontend

```bash
npm run dev
```

Now your app will use the deployed ML model on Vercel! 🚀

---

## Benefits of Deploying ML Model

✅ **No need to run local server** - Works from anywhere
✅ **Always available** - 99.9% uptime
✅ **Faster** - Vercel's global CDN
✅ **Scalable** - Handles multiple requests
✅ **Free** - Vercel free tier is generous
✅ **HTTPS** - Secure by default

---

## Testing After Deployment

1. Open browser console
2. Click "Prioritize All Issues"
3. Check network tab - should call Vercel URL
4. Verify it works!
