// Vercel Serverless Function for batch priority calculation
const { spawn } = require('child_process');
const path = require('path');

// Helper functions
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

function getMLPriorityBatch(issues) {
  return new Promise((resolve) => {
    try {
      const pythonScript = path.join(__dirname, '..', 'predict_batch.py');
      const py = spawn(process.env.PYTHON_CMD || 'python3', [pythonScript], {
        cwd: path.join(__dirname, '..')
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
      
      // Prepare batch data
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
      
      py.stdin.write(JSON.stringify(batchData));
      py.stdin.end();
    } catch (e) {
      console.error('Batch prediction error:', e);
      resolve({ success: false, error: e.message });
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
    const { issues } = req.body;
    
    if (!Array.isArray(issues)) {
      return res.status(400).json({
        success: false,
        message: 'Issues array is required'
      });
    }
    
    const batchResult = await getMLPriorityBatch(issues);
    
    if (!batchResult.success) {
      throw new Error(batchResult.error || 'Batch prediction failed');
    }
    
    const results = batchResult.results.map(result => {
      const score = result.priority_score;
      return {
        id: result.id,
        priorityScore: score.toFixed(3),
        priority: score > 0.7 ? 'High' : score > 0.4 ? 'Medium' : 'Low'
      };
    });
    
    res.json({
      success: true,
      results
    });
  } catch (err) {
    console.error('Batch priority calculation error:', err);
    res.status(500).json({
      success: false,
      message: 'Batch priority calculation failed'
    });
  }
};
