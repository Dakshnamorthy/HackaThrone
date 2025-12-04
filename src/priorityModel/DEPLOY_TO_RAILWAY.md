# Deploy ML Model to Railway (Better Python Support)

## Why Railway Instead of Vercel?

Railway has **much better Python support** than Vercel:
- ✅ No package size limits
- ✅ Better Python version control
- ✅ Longer execution times
- ✅ Easier deployment
- ✅ Free tier available

---

## 🚀 Deploy to Railway (5 minutes)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### Step 3: Initialize Project

```bash
cd /Users/sarathyv/HackaThrone-1/src/priorityModel
railway init
```

**Follow prompts:**
- Project name: `priority-model`
- Create new project: Yes

### Step 4: Deploy

```bash
railway up
```

That's it! Railway will:
- Detect it's a Node.js + Python project
- Install all dependencies automatically
- Deploy and give you a URL

### Step 5: Get Your URL

```bash
railway domain
```

Or check the Railway dashboard: https://railway.app/dashboard

---

## 📝 Configuration Files Needed

Railway needs these files (already exist):

### `package.json` ✅
Already exists with correct dependencies.

### `requirements.txt` ✅
Already exists with Python packages.

### `Procfile` (Create this)
Tells Railway how to start your server:

```
web: node server.js
```

### `railway.json` (Optional)
For custom configuration:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🎯 After Deployment

### 1. Get Your Railway URL

```bash
railway domain
```

Example: `https://priority-model-production.up.railway.app`

### 2. Update Your .env

Add to `/Users/sarathyv/HackaThrone-1/.env`:

```bash
VITE_ML_API_URL=https://your-railway-url.railway.app
```

### 3. Update Frontend

Same as before - use environment variable in `ReportedIssues.jsx`.

---

## 💰 Railway Free Tier

- **$5 free credits per month**
- **500 hours execution time**
- **100 GB bandwidth**
- **8 GB RAM**
- **8 vCPU**

Much more generous than Vercel for Python apps!

---

## 🧪 Test Your Deployment

```bash
# Health check
curl https://your-railway-url.railway.app/

# Single priority
curl -X POST https://your-railway-url.railway.app/api/calculate-priority \
  -H "Content-Type: application/json" \
  -d '{"id":"test","type":"Pothole","latitude":11.9416,"longitude":79.8083}'

# Batch priority
curl -X POST https://your-railway-url.railway.app/api/calculate-priorities \
  -H "Content-Type: application/json" \
  -d '{"issues":[{"id":"1","type":"Pothole","latitude":11.9416,"longitude":79.8083}]}'
```

---

## 🔄 Redeploy After Changes

```bash
railway up
```

---

## 📊 Monitor Your App

Railway Dashboard: https://railway.app/dashboard

View:
- Deployment logs
- Resource usage
- Environment variables
- Metrics

---

## ⚡ Quick Deploy Script

Create `deploy-railway.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if model exists
if [ ! -f "priority_model.pkl" ]; then
    echo "Training model..."
    python3 train_model.py
fi

# Deploy
railway up

echo "✅ Deployment complete!"
echo "Get your URL: railway domain"
```

Make it executable:
```bash
chmod +x deploy-railway.sh
```

Run it:
```bash
./deploy-railway.sh
```

---

## 🎉 Benefits Over Vercel

| Feature | Railway | Vercel |
|---------|---------|--------|
| Python Support | ✅ Excellent | ⚠️ Limited |
| Package Size | ✅ No limit | ❌ 50MB |
| Execution Time | ✅ No limit | ❌ 10s (free) |
| Python Version | ✅ Any | ⚠️ 3.9 only |
| scikit-learn | ✅ Works | ❌ Often fails |
| Setup | ✅ Easy | ⚠️ Complex |

---

## 🚀 Ready to Deploy?

```bash
npm install -g @railway/cli
cd /Users/sarathyv/HackaThrone-1/src/priorityModel
railway login
railway init
railway up
railway domain
```

**Railway is the best choice for Python ML models!** 🎯
