// Priority Model Server for HackaThrone
const express = require('express');
const cors = require('cors');
const { PythonShell } = require('python-shell');

const app = express();

// Enable CORS for your React app
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Origin', 'Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Store processed issues for nearby calculation
const processedIssues = [];

// Simplified weather impact (can be enhanced with real API later)
function getWeatherImpact(lat, lng) {
  // Simulate weather based on location and time
  const hour = new Date().getHours();
  const isRainyRegion = lat >= 11.0 && lat <= 12.0; // Puducherry region
  const isRainyTime = hour >= 14 && hour <= 18; // Afternoon rain
  return (isRainyRegion && isRainyTime) ? 0.2 : 0;
}

// Simplified traffic impact based on time and location
function getTrafficImpact(lat, lng) {
  const hour = new Date().getHours();
  const isUrbanArea = lng >= 79.7 && lng <= 79.9; // Urban Puducherry
  
  // Rush hours: 8-10 AM, 6-8 PM
  if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
    return isUrbanArea ? 0.3 : 0.15;
  }
  return 0;
}

// Estimate image blur (simulate for now)
function estimateBlur() {
  return Math.random() * 0.8; // 0.0 (clear) to 0.8 (blurry)
}

// Count how many issues are near this location
function countNearbyIssues(lat, lng, radius = 0.01) {
  return processedIssues.filter(issue => {
    if (!issue.latitude || !issue.longitude) return false;
    const dist = Math.sqrt((issue.latitude - lat) ** 2 + (issue.longitude - lng) ** 2);
    return dist <= radius;
  }).length;
}

// Call Python ML model to predict priority using your database fields
async function getMLPriority(issueData) {
  return new Promise((resolve) => {
    // Extract data from your database structure
    const lat = issueData.latitude || 11.9416; // Default to Puducherry
    const lng = issueData.longitude || 79.8083;
    const issueType = issueData.type; // From your database: type field
    
    // Calculate contextual factors
    const weatherBoost = getWeatherImpact(lat, lng);
    const trafficBoost = getTrafficImpact(lat, lng);
    const blur = estimateBlur();
    const repeat = countNearbyIssues(lat, lng);
    const hour = new Date().getHours();

    const options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: __dirname, // Current directory has predict.py
      args: [
        issueType, lat, lng,
        weatherBoost > 0,       // is_rain
        trafficBoost,           // traffic impact
        blur, repeat, hour
      ]
    };

    PythonShell.run('predict.py', options, (err, results) => {
      if (err || !results || !results[0]) {
        console.error('ML Error:', err);
        // Fallback priority calculation
        let fallbackScore = 0.5;
        if (issueType === 'Pothole') fallbackScore = 0.7;
        else if (issueType === 'Garbage') fallbackScore = 0.4;
        else if (issueType === 'Streetlight') fallbackScore = 0.3;
        
        resolve(Math.max(0.1, Math.min(0.99, fallbackScore + weatherBoost + trafficBoost)));
      } else {
        const score = parseFloat(results[0]) + weatherBoost + trafficBoost;
        resolve(Math.max(0.1, Math.min(0.99, score)));
      }
    });
  });
}

// Test ML model on startup
PythonShell.run('predict.py', {
  scriptPath: __dirname,
  args: ['Pothole', '11.9416', '79.8083', 'true', '0.3', '0.1', '3', '20']
}, (err) => {
  if (err) {
    console.error('❌ ML Model failed to load:', err);
  } else {
    console.log('✅ ML Model is ready!');
  }
});

// API endpoint to calculate priority for existing issues
app.post('/api/calculate-priority', async (req, res) => {
  try {
    const issueData = req.body;
    
    // Validate required fields from your database
    if (!issueData.type) {
      return res.status(400).json({
        success: false,
        message: 'Issue type is required'
      });
    }

    // Calculate priority using ML model
    const priorityScore = await getMLPriority(issueData);
    
    // Store for nearby calculations
    processedIssues.push({
      id: issueData.id,
      type: issueData.type,
      latitude: issueData.latitude,
      longitude: issueData.longitude,
      priorityScore
    });

    console.log(`✅ Priority calculated: ${issueData.id || 'New'} | Type: ${issueData.type} | Priority: ${priorityScore.toFixed(3)}`);

    res.json({
      success: true,
      priorityScore: priorityScore.toFixed(3),
      priority: priorityScore > 0.7 ? 'High' : priorityScore > 0.4 ? 'Medium' : 'Low'
    });
  } catch (err) {
    console.error('❌ Priority calculation error:', err);
    res.status(500).json({
      success: false,
      message: 'Priority calculation failed'
    });
  }
});

// API endpoint to get priority for multiple issues
app.post('/api/calculate-priorities', async (req, res) => {
  try {
    const { issues } = req.body;
    
    if (!Array.isArray(issues)) {
      return res.status(400).json({
        success: false,
        message: 'Issues array is required'
      });
    }

    const results = [];
    
    for (const issue of issues) {
      const priorityScore = await getMLPriority(issue);
      results.push({
        id: issue.id,
        priorityScore: priorityScore.toFixed(3),
        priority: priorityScore > 0.7 ? 'High' : priorityScore > 0.4 ? 'Medium' : 'Low'
      });
    }

    res.json({
      success: true,
      results
    });
  } catch (err) {
    console.error('❌ Batch priority calculation error:', err);
    res.status(500).json({
      success: false,
      message: 'Batch priority calculation failed'
    });
  }
});

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'HackaThrone Priority Model Server',
    endpoints: [
      'POST /api/calculate-priority - Calculate priority for single issue',
      'POST /api/calculate-priorities - Calculate priorities for multiple issues'
    ],
    modelStatus: 'ready'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Priority Model Server running on port ${PORT}`);
  console.log(`🤖 ML Model: Ready for priority calculations`);
  console.log(`🔗 CORS enabled for React apps on ports 3000-3002`);
  console.log(`📡 API Base URL: http://localhost:${PORT}`);
});