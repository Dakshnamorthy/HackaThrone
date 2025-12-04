// Priority Model Server for HackaThrone
const express = require('express');
const cors = require('cors');
const { PythonShell } = require('python-shell');
const { spawn } = require('child_process');

const app = express();

// Enable CORS for your React app
app.use(cors({
  origin: '*', // Allow all origins for now (restrict in production)
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

// Optimized batch prediction - single Python process for all issues
async function getMLPriorityBatch(issues) {
  return new Promise((resolve) => {
    try {
      const py = spawn(process.env.PYTHON_CMD || 'python3', ['predict_batch.py'], {
        cwd: __dirname
      });
      
      let out = '';
      let err = '';
      
      py.stdout.on('data', (b) => (out += b.toString()));
      py.stderr.on('data', (b) => (err += b.toString()));
      
      py.on('close', (code) => {
        if (err) {
          console.warn('Python stderr:', err);
        }
        try {
          const parsed = JSON.parse(out);
          resolve(parsed);
        } catch (e) {
          console.error('Failed parsing Python output:', out, e);
          resolve({ success: false, error: 'invalid python output' });
        }
      });
      
      // Prepare batch data with contextual factors
      const batchData = issues.map(issue => {
        const lat = issue.latitude || 11.9416;
        const lng = issue.longitude || 79.8083;
        return {
          id: issue.id,
          type: issue.type,
          latitude: lat,
          longitude: lng,
          is_rain: getWeatherImpact(lat, lng) > 0,
          traffic: getTrafficImpact(lat, lng),
          blur: estimateBlur(),
          repeat_count: countNearbyIssues(lat, lng),
          hour: new Date().getHours()
        };
      });
      
      // Send all issues at once
      py.stdin.write(JSON.stringify(batchData));
      py.stdin.end();
    } catch (e) {
      console.error('Batch prediction error:', e);
      resolve({ success: false, error: e.message });
    }
  });
}

// API endpoint to get priority for multiple issues (OPTIMIZED)
app.post('/api/calculate-priorities', async (req, res) => {
  try {
    const { issues } = req.body;
    
    if (!Array.isArray(issues)) {
      return res.status(400).json({
        success: false,
        message: 'Issues array is required'
      });
    }

    console.log(`📊 Processing ${issues.length} issues in batch...`);
    const startTime = Date.now();
    
    // Use optimized batch prediction
    const batchResult = await getMLPriorityBatch(issues);
    
    if (!batchResult.success) {
      throw new Error(batchResult.error || 'Batch prediction failed');
    }
    
    // Map scores to priority levels
    const results = batchResult.results.map(result => {
      const score = result.priority_score;
      return {
        id: result.id,
        priorityScore: score.toFixed(3),
        priority: score > 0.7 ? 'High' : score > 0.4 ? 'Medium' : 'Low'
      };
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Batch complete: ${issues.length} issues in ${duration}ms (${(duration/issues.length).toFixed(0)}ms per issue)`);

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