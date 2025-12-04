# Quick Start Guide - ML Issue Prioritization

## 🚀 First Time Setup (5 minutes)

### Step 1: Install Python Dependencies
```bash
pip install numpy pandas scikit-learn joblib
```

### Step 2: Install Node Dependencies
```bash
# Main app
npm install

# Priority model server
cd src/priorityModel
npm install
cd ../..
```

### Step 3: Train ML Model
```bash
cd src/priorityModel
python train_model.py
# You should see: ✅ Model saved: priority_model.pkl
cd ../..
```

---

## ▶️ Running the Application

### Terminal 1 - Start Priority Model Server
```bash
cd src/priorityModel
npm start
```
**Expected output:**
```
🚀 Priority Model Server running on port 5001
🤖 ML Model: Ready for priority calculations
✅ ML Model is ready!
```

### Terminal 2 - Start Vite Frontend
```bash
npm run dev
```
**Expected output:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## 🎯 Using the Feature

1. Open browser: `http://localhost:5173`
2. Login as government user
3. Navigate to: **Reported Issues** page
4. Click: **"Prioritize All Issues (N)"** button
5. Confirm the dialog
6. Wait for completion (shows progress)
7. See updated priority badges!

---

## 🔧 Troubleshooting

### Python Command Issues (Windows)
```powershell
# PowerShell
$env:PYTHON_CMD="python"
```

### Python Command Issues (Mac/Linux)
```bash
export PYTHON_CMD=python3
```

### Port Already in Use
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Model Not Found
```bash
cd src/priorityModel
python train_model.py
```

---

## 📊 Quick Test

After setup, test with curl:

```bash
curl -X POST http://localhost:5001/api/calculate-priority \
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
  "priorityScore": "0.XXX",
  "priority": "High|Medium|Low"
}
```

---

## ✅ Success Checklist

- [ ] Python dependencies installed
- [ ] Node dependencies installed
- [ ] ML model trained (priority_model.pkl exists)
- [ ] Priority server running on port 5001
- [ ] Vite frontend running on port 5173
- [ ] Can access Reported Issues page
- [ ] "Prioritize All Issues" button visible
- [ ] Clicking button shows confirmation dialog
- [ ] Issues get updated with priorities

---

## 🆘 Need Help?

See full documentation in `README.md` or `ML_INTEGRATION_SUMMARY.md`
