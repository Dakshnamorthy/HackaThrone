// Vercel Serverless Function for single priority calculation
const { spawn } = require('child_process');
const path = require('path');

// Helper functions from server.js
function getWeatherImpact(lat, lng) {
  const rainProbability = Math.abs(Math.sin(lat * lng));
  return rainProbability > 0.6 ? 1 : 0;
}

function getTrafficImpact(lat, lng) {
  const trafficScore = Math.abs(Math.cos(lat + lng));
  return parseFloat(trafficScore.toFixed(2));
}

function estimateBlur() {
  return Math.random() * 0.5 + 0.3;
}

function countNearbyIssues(lat, lng) {
  return Math.floor(Math.random() * 5);
}

function getMLPriority(issue) {
  return new Promise((resolve) => {
    try {
      const lat = issue.latitude || 11.9416;
      const lng = issue.longitude || 79.8083;
      
      const pythonScript = path.join(__dirname, '..', 'predict.py');
      const py = spawn(process.env.PYTHON_CMD || 'python3', [
        pythonScript,
        issue.type || 'Unknown',
        lat.toString(),
        lng.toString(),
        getWeatherImpact(lat, lng).toString(),
        getTrafficImpact(lat, lng).toString(),
        estimateBlur().toString(),
        countNearbyIssues(lat, lng).toString(),
        new Date().getHours().toString()
      ]);
      
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
          resolve(parseFloat(parsed.priority_score));
        } catch (e) {
          console.error('Failed parsing Python output:', out, e);
          resolve(0.5);
        }
      });
    } catch (e) {
      console.error('ML prediction error:', e);
      resolve(0.5);
    }
  });
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const issue = req.body;
    
    if (!issue.type) {
      return res.status(400).json({
        success: false,
        message: 'Issue type is required'
      });
    }
    
    const priorityScore = await getMLPriority(issue);
    const priority = priorityScore > 0.7 ? 'High' : priorityScore > 0.4 ? 'Medium' : 'Low';
    
    res.json({
      success: true,
      priorityScore: priorityScore.toFixed(3),
      priority
    });
  } catch (err) {
    console.error('Priority calculation error:', err);
    res.status(500).json({
      success: false,
      message: 'Priority calculation failed'
    });
  }
};
