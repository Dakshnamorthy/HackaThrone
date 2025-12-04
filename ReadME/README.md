# HackaThrone - Civic Issue Management Platform

A modern Vite + React application for managing civic issues with ML-powered priority prediction.

## Project Structure

```
HackaThrone-1/
├── src/                          # Main Vite + React application
│   ├── gov/                      # Government dashboard components
│   │   └── ReportedIssues.jsx   # Issues management with ML prioritization
│   ├── priorityModel/           # ML Priority Model Server
│   │   ├── server.js            # Node.js Express server
│   │   ├── predict.py           # Python ML prediction script
│   │   ├── train_model.py       # Model training script
│   │   └── priority_model.pkl   # Trained ML model
│   └── ...
├── CIVORA/                       # Alternative implementation (optional)
│   └── my-react-app/
│       ├── ml/                   # ML models and scripts
│       └── server.js             # Backend server
└── package.json
```

## Features

- 🎯 **ML-Powered Issue Prioritization**: AI-based priority calculation using Random Forest model
- 📊 **Government Dashboard**: Manage and track citizen-reported issues
- 🗺️ **Location-Based Analysis**: Geographic context for issue prioritization
- ⚡ **Real-time Updates**: Live priority calculations and database updates
- 🔄 **Batch Processing**: Prioritize multiple issues simultaneously

---

## ML Issue Prioritization

### Overview

The ML Issue Prioritization feature uses a Python-based Random Forest model to automatically calculate priority scores for civic issues based on:
- Issue type (Pothole, Garbage, Water, Electrical, Road, etc.)
- Geographic location (latitude/longitude)
- Weather conditions
- Traffic impact
- Repeat count (nearby similar issues)
- Time of day

### Setup Instructions

#### 1. Install Dependencies

**Main Application:**
```bash
npm install
```

**Priority Model Server:**
```bash
cd src/priorityModel
npm install
```

**Python Dependencies:**
```bash
pip install numpy pandas scikit-learn joblib
```

#### 2. Train the ML Model

Before using the prioritization feature, you need to train the model:

```bash
cd src/priorityModel
python train_model.py
```

This will create `priority_model.pkl` in the `src/priorityModel/` directory.

**For CIVORA (alternative implementation):**
```bash
cd CIVORA/my-react-app
python ml/train_model.py
```

This creates model files in `CIVORA/my-react-app/ml/`:
- `priority_model.pkl`
- `issue_encoder.pkl`
- `weather_encoder.pkl`

#### 3. Configure Environment Variables

Create a `.env` file in the project root (use `.env.example` as template):

**Windows (Command Prompt):**
```cmd
set PYTHON_CMD=python
```

**Windows (PowerShell):**
```powershell
$env:PYTHON_CMD="python"
```

**macOS/Linux:**
```bash
export PYTHON_CMD=python3
```

#### 4. Start the Priority Model Server

```bash
cd src/priorityModel
npm start
```

The server will run on `http://localhost:5001`

You should see:
```
🚀 Priority Model Server running on port 5001
🤖 ML Model: Ready for priority calculations
✅ ML Model is ready!
```

#### 5. Start the Vite Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Usage

#### Single Issue Prioritization

1. Navigate to **Government Dashboard** → **Reported Issues**
2. Find any issue in the list
3. Click the **"AI Priority"** button on the issue card
4. The ML model will calculate and update the priority automatically

#### Batch Prioritization (All Issues)

1. Navigate to **Government Dashboard** → **Reported Issues**
2. Click the **"Prioritize All Issues"** button at the top of the page
3. Confirm the batch operation
4. All visible issues will be prioritized using the ML model
5. Priorities are automatically saved to the database

### API Endpoints

The Priority Model Server exposes the following endpoints:

#### `POST /api/calculate-priority`

Calculate priority for a single issue.

**Request:**
```json
{
  "id": "issue-uuid",
  "type": "Pothole",
  "latitude": 11.9416,
  "longitude": 79.8083,
  "description": "Large pothole on main road",
  "location": "Main Street"
}
```

**Response:**
```json
{
  "success": true,
  "priorityScore": "0.750",
  "priority": "High"
}
```

#### `POST /api/calculate-priorities`

Calculate priorities for multiple issues in batch.

**Request:**
```json
{
  "issues": [
    {
      "id": "issue-1",
      "type": "Garbage",
      "latitude": 11.9416,
      "longitude": 79.8083
    },
    {
      "id": "issue-2",
      "type": "Water",
      "latitude": 11.9500,
      "longitude": 79.8100
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "issue-1",
      "priorityScore": "0.450",
      "priority": "Medium"
    },
    {
      "id": "issue-2",
      "priorityScore": "0.650",
      "priority": "High"
    }
  ]
}
```

### How It Works

**Frontend → Backend → Python ML → Backend → Frontend**

1. **Frontend (ReportedIssues.jsx)**: User clicks "Prioritize All Issues" or "AI Priority"
2. **API Call**: Frontend sends issue data to `http://localhost:5001/api/calculate-priorities`
3. **Node.js Server (server.js)**: Receives request, validates data
4. **Python ML (predict.py)**: Node spawns Python process with issue data
5. **ML Model**: Loads `priority_model.pkl`, predicts priority score
6. **Python Output**: Returns JSON with priority score
7. **Node.js Response**: Sends priority data back to frontend
8. **Frontend Update**: Updates UI and saves to Supabase database

### Priority Levels

- **High**: Priority score > 0.7 (Red badge)
- **Medium**: Priority score 0.4 - 0.7 (Orange badge)
- **Low**: Priority score < 0.4 (Green badge)

### Troubleshooting

**Error: "Priority Model Server Error"**
- Ensure the priority model server is running on port 5001
- Check that `npm install` was run in `src/priorityModel/`
- Verify Python is installed and accessible

**Error: "ML Model failed to load"**
- Run `python train_model.py` to create the model file
- Check that `priority_model.pkl` exists in `src/priorityModel/`
- Verify Python dependencies are installed

**Error: "Failed to fetch"**
- Check CORS settings in `server.js`
- Verify the server is running on the correct port
- Check browser console for network errors

### Development

**To modify the ML model:**
1. Edit `src/priorityModel/train_model.py`
2. Adjust features, training data, or model parameters
3. Re-run `python train_model.py`
4. Restart the priority model server

**To add new features:**
1. Update `predict.py` to accept new input parameters
2. Modify `server.js` to pass new data to Python
3. Update frontend to send new fields in API calls

---

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
