# 🚀 Deploy ML Model to Vercel - Complete Guide

## Why Deploy to Vercel?

✅ **Free hosting** - No credit card required
✅ **Always online** - No need to run local server
✅ **Fast** - Global CDN
✅ **HTTPS** - Secure by default
✅ **Easy deployment** - One command
✅ **Auto-scaling** - Handles traffic spikes

---

## 📋 Prerequisites

1. **Vercel Account** (free)
   - Sign up: https://vercel.com/signup
   - Use GitHub/GitLab/Bitbucket or email

2. **Trained ML Model**
   - File: `priority_model.pkl` must exist
   - If not, run: `python3 train_model.py`

---

## 🚀 Deployment Steps

### Method 1: Automated Script (Easiest)

```bash
cd src/priorityModel
./deploy.sh
```

This script will:
- Check if Vercel CLI is installed
- Train the model if needed
- Install dependencies
- Deploy to Vercel

### Method 2: Manual Deployment

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```
- Choose your login method (GitHub, GitLab, etc.)
- Follow the browser authentication

**Step 3: Navigate to ML model directory**
```bash
cd src/priorityModel
```

**Step 4: Ensure model is trained**
```bash
python3 train_model.py
```

**Step 5: Deploy**
```bash
vercel
```

**Follow the prompts:**
```
? Set up and deploy "~/HackaThrone-1/src/priorityModel"? [Y/n] Y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] N
? What's your project's name? hackathrone-priority-model
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

**Step 6: Deploy to production**
```bash
vercel --prod
```

---

## 📝 After Deployment

### 1. Copy Your Deployment URL

You'll see output like:
```
✅ Production: https://hackathrone-priority-model-abc123.vercel.app
```

### 2. Update .env File

Add to `/Users/sarathyv/HackaThrone-1/.env`:
```bash
VITE_ML_API_URL=https://hackathrone-priority-model-abc123.vercel.app
```

### 3. Update Frontend Code

Edit `src/gov/ReportedIssues.jsx`:

**Add at the top of the component:**
```javascript
const ReportedIssues = () => {
  const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5001';
  // ... rest of your code
```

**Find line ~540 (single prediction):**
```javascript
// OLD:
const response = await fetch('http://localhost:5001/api/calculate-priority', {

// NEW:
const response = await fetch(`${ML_API_URL}/api/calculate-priority`, {
```

**Find line ~670 (batch prediction):**
```javascript
// OLD:
const response = await fetch('http://localhost:5001/api/calculate-priorities', {

// NEW:
const response = await fetch(`${ML_API_URL}/api/calculate-priorities`, {
```

### 4. Restart Frontend

```bash
npm run dev
```

---

## 🧪 Test Your Deployment

### Test 1: Health Check
```bash
curl https://your-deployment-url.vercel.app/
```

**Expected response:**
```json
{
  "status": "running",
  "service": "HackaThrone Priority Model Server",
  "endpoints": [
    "POST /api/calculate-priority - Calculate priority for single issue",
    "POST /api/calculate-priorities - Calculate priorities for multiple issues"
  ],
  "modelStatus": "ready"
}
```

### Test 2: Single Priority
```bash
curl -X POST https://your-deployment-url.vercel.app/api/calculate-priority \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "type": "Pothole",
    "latitude": 11.9416,
    "longitude": 79.8083
  }'
```

**Expected response:**
```json
{
  "success": true,
  "priorityScore": "0.756",
  "priority": "High"
}
```

### Test 3: Batch Priority
```bash
curl -X POST https://your-deployment-url.vercel.app/api/calculate-priorities \
  -H "Content-Type: application/json" \
  -d '{
    "issues": [
      {"id": "1", "type": "Pothole", "latitude": 11.9416, "longitude": 79.8083},
      {"id": "2", "type": "Garbage", "latitude": 11.9500, "longitude": 79.8100}
    ]
  }'
```

---

## 📊 Monitor Your Deployment

### Vercel Dashboard
https://vercel.com/dashboard

View:
- Deployment logs
- Function invocations
- Bandwidth usage
- Error rates

### View Logs
```bash
vercel logs
```

---

## 🔄 Redeploy After Changes

```bash
cd src/priorityModel
vercel --prod
```

---

## 🐛 Troubleshooting

### Issue: "Command not found: vercel"
**Solution:**
```bash
npm install -g vercel
```

### Issue: "Model file not found"
**Solution:**
```bash
cd src/priorityModel
python3 train_model.py
```

### Issue: "Python module not found"
**Solution:**
Check `requirements.txt` has all dependencies:
```
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
joblib==1.3.2
```

### Issue: "Function timeout"
**Solution:**
- Vercel free tier has 10s timeout
- Reduce batch size in frontend
- Or upgrade to Vercel Pro (60s timeout)

### Issue: "CORS error"
**Solution:**
The server already has CORS enabled. If still having issues, check the server.js CORS configuration.

### Issue: "Deployment size too large"
**Solution:**
- Check `.vercelignore` excludes unnecessary files
- Remove `node_modules` before deploying (Vercel installs them)

---

## 💰 Vercel Free Tier Limits

- **Bandwidth:** 100 GB/month
- **Function Execution:** 100 hours/month
- **Function Timeout:** 10 seconds
- **Deployments:** Unlimited
- **Team Members:** 1

**For most use cases, free tier is enough!**

---

## 🎯 Production Checklist

Before going live:

- [ ] Model trained and tested locally
- [ ] All dependencies in package.json and requirements.txt
- [ ] CORS configured correctly
- [ ] Environment variables set (if any)
- [ ] Tested all API endpoints
- [ ] Frontend updated with production URL
- [ ] Error handling tested
- [ ] Monitoring configured

---

## 🔐 Security Best Practices

### 1. Restrict CORS (Production)

Edit `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

### 2. Add Rate Limiting

Install:
```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Add API Key (Optional)

For extra security, require an API key:
```javascript
const API_KEY = process.env.API_KEY;

app.use('/api/', (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vercel CLI:** https://vercel.com/docs/cli
- **Python on Vercel:** https://vercel.com/docs/functions/serverless-functions/runtimes/python

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ ML model running 24/7
- ✅ No local server needed
- ✅ Fast global access
- ✅ Free hosting
- ✅ HTTPS by default

**Your ML-powered issue prioritization is now production-ready!** 🚀
