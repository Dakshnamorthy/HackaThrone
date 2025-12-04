# Deploy ML Priority Model to Vercel

## 🚀 Quick Deployment Guide

### Prerequisites
1. Vercel account (free): https://vercel.com/signup
2. Vercel CLI installed globally

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from this directory
```bash
cd src/priorityModel
vercel
```

### Step 4: Follow the prompts
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** hackathrone-priority-model (or your choice)
- **Directory?** ./ (current directory)
- **Override settings?** No

### Step 5: Get your deployment URL
After deployment, you'll get a URL like:
```
https://hackathrone-priority-model.vercel.app
```

### Step 6: Update your frontend
In your main project's `.env` file, add:
```bash
VITE_PRIORITY_MODEL_URL=https://your-deployment-url.vercel.app
```

Then update `ReportedIssues.jsx` to use this URL instead of `http://localhost:5001`

---

## 📋 Files Needed for Deployment

✅ `server.js` - Express server
✅ `predict.py` - Single prediction
✅ `predict_batch.py` - Batch prediction
✅ `priority_model.pkl` - Trained model
✅ `package.json` - Node dependencies
✅ `requirements.txt` - Python dependencies
✅ `vercel.json` - Vercel configuration

---

## 🔧 Important Notes

### Python Runtime
Vercel supports Python 3.9. The `requirements.txt` specifies compatible versions.

### Model File
Make sure `priority_model.pkl` exists in this directory. If not, run:
```bash
python3 train_model.py
```

### CORS Configuration
The server already has CORS enabled for all origins. In production, you should restrict this to your frontend domain.

### Environment Variables
Set these in Vercel dashboard if needed:
- `PYTHON_CMD=python3`

---

## 🧪 Testing Your Deployment

After deployment, test the endpoints:

### Health Check
```bash
curl https://your-deployment-url.vercel.app/
```

### Single Priority Calculation
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

### Batch Priority Calculation
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

## 🔄 Redeployment

To redeploy after changes:
```bash
cd src/priorityModel
vercel --prod
```

---

## 📊 Monitoring

View logs and analytics in Vercel dashboard:
https://vercel.com/dashboard

---

## ⚠️ Limitations

### Vercel Free Tier:
- 100GB bandwidth/month
- 100 hours serverless function execution/month
- 10 second function timeout
- 50 MB deployment size limit

### For Heavy Usage:
Consider upgrading to Vercel Pro or deploying to:
- Railway.app
- Render.com
- Heroku
- AWS Lambda
- Google Cloud Functions

---

## 🐛 Troubleshooting

### Issue: "Module not found"
- Check `package.json` has all dependencies
- Run `npm install` locally first

### Issue: "Python module not found"
- Check `requirements.txt` has all Python packages
- Verify versions are compatible with Python 3.9

### Issue: "Model file not found"
- Ensure `priority_model.pkl` is in the deployment
- Check `.vercelignore` doesn't exclude it

### Issue: "Function timeout"
- Batch processing might be too slow
- Consider reducing batch size
- Upgrade to Vercel Pro for longer timeouts

---

## 🎯 Production Checklist

Before going to production:

- [ ] Model is trained and tested
- [ ] CORS restricted to your frontend domain
- [ ] Environment variables set in Vercel
- [ ] Error handling tested
- [ ] Rate limiting implemented (optional)
- [ ] Monitoring/logging configured
- [ ] Frontend updated with production URL
- [ ] API endpoints tested with real data

---

## 💡 Alternative: Deploy to Railway

If Vercel doesn't work well, try Railway (better for Python):

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

Railway has better Python support and longer function timeouts.
