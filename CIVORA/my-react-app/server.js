// server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import axios from "axios";
import { spawn } from "child_process";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// NOTE: Don't use express.json() before multer when handling multipart/form-data with files
// app.use(express.json());

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const issuesFile = path.join(process.cwd(), "issues.json");

const readIssues = () => {
  try {
    if (!fs.existsSync(issuesFile)) return [];
    return JSON.parse(fs.readFileSync(issuesFile, "utf8"));
  } catch (err) {
    console.error("Error reading issues file:", err);
    return [];
  }
};
const writeIssues = (data) => {
  fs.writeFileSync(issuesFile, JSON.stringify(data, null, 2));
};

// helper: haversine distance (meters)
const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// map open-meteo weathercode to simple labels
const weatherCodeToLabel = (code) => {
  // open-meteo codes: 0 clear, 1-3 mainly clear/partly cloudy, 45-99 fog/rain/etc
  if (code === 0) return "Clear";
  if (code >= 1 && code <= 3) return "PartlyCloudy";
  if (code >= 45 && code <= 55) return "Fog";
  if (code >= 56 && code <= 67) return "SnowOrSleet";
  if (code >= 71 && code <= 82) return "Snow";
  if (code >= 80 && code <= 99) return "Rain";
  return "Unknown";
};

const callPythonPredict = (payload) => {
  return new Promise((resolve) => {
    try {
      const py = spawn(process.env.PYTHON_CMD || "python3", ["ml/predict.py"]);
      let out = "";
      let err = "";
      py.stdout.on("data", (b) => (out += b.toString()));
      py.stderr.on("data", (b) => (err += b.toString()));
      py.on("close", (code) => {
        if (err) {
          console.warn("python stderr:", err);
        }
        try {
          const parsed = JSON.parse(out);
          resolve(parsed);
        } catch (e) {
          console.error("Failed parsing python output:", out, e);
          resolve({ error: "invalid python output", priority_score: 0 });
        }
      });
      // write payload to stdin
      py.stdin.write(JSON.stringify(payload));
      py.stdin.end();
    } catch (e) {
      console.error("callPythonPredict error:", e);
      resolve({ error: e.message, priority_score: 0 });
    }
  });
};

// POST submit issue
app.post("/api/submit-issue", upload.array("images", 10), async (req, res) => {
  try {
    console.log("Incoming fields:", req.body);
    console.log("Files:", req.files?.map((f) => f.filename));

    const { issueType, description, lat, lon } = req.body;
    if (!issueType || !description || !lat || !lon) {
      return res.json({ success: false, error: "Missing required fields" });
    }

    const files = req.files?.map((f) => f.filename) || [];
    const id = Date.now();
    const createdAt = new Date().toISOString();
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    // weather: use open-meteo (no key)
    let weatherLabel = "Unknown";
    let temp = null;
    try {
      const wRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current_weather=true`
      );
      const cw = wRes.data.current_weather;
      if (cw) {
        temp = cw.temperature;
        weatherLabel = weatherCodeToLabel(cw.weathercode ?? 0);
      }
    } catch (err) {
      console.warn("Weather API failed:", err.message);
    }

    // read existing issues to compute repeat_count and traffic proxy
    const issues = readIssues();
    // repeat_count: count same issueType reported within radius (e.g., 500m)
    const RADIUS_M = 500;
    let repeat_count = 0;
    let nearbyCount = 0;
    for (const it of issues) {
      if (!it.lat || !it.lon) continue;
      const d = haversineMeters(latNum, lonNum, Number(it.lat), Number(it.lon));
      if (d <= RADIUS_M) {
        nearbyCount++;
        if (it.issueType === issueType) repeat_count++;
      }
    }

    // traffic_delay: if TRAFFIC_API_URL is provided, try calling it. Otherwise estimate
    let traffic_delay = 0;
    if (process.env.TRAFFIC_API_URL) {
      try {
        // expected: TRAFFIC_API_URL?lat=..&lon=.. returns {delay_seconds: ..} or similar
        const tRes = await axios.get(`${process.env.TRAFFIC_API_URL}?lat=${latNum}&lon=${lonNum}`);
        const delay = tRes.data.delay_seconds ?? tRes.data.traffic_delay ?? tRes.data.delay ?? null;
        if (delay !== null) traffic_delay = Number(delay);
      } catch (err) {
        console.warn("Traffic API failed:", err.message);
      }
    }
    // fallback traffic proxy: nearbyCount * 60 (seconds)
    if (!traffic_delay) traffic_delay = nearbyCount * 60;

    // hour
    const hour = new Date(createdAt).getHours();

    // Build predict payload
    const predictPayload = {
      issue_type: issueType,
      weather: weatherLabel,
      temp: temp ?? 0,
      traffic_delay: traffic_delay,
      repeat_count: repeat_count,
      hour: hour,
    };

    // call python prediction
    const pyOut = await callPythonPredict(predictPayload);
    const priority_score = Number(pyOut.priority_score ?? pyOut.priority ?? 0);

    // save issue with predicted score
    const newIssue = {
      id,
      issueType,
      description,
      lat: latNum,
      lon: lonNum,
      images: files,
      weather: weatherLabel,
      temp: temp,
      traffic_delay,
      repeat_count,
      hour,
      priority_score,
      createdAt,
    };

    issues.push(newIssue);
    writeIssues(issues);

    console.log("Saved new issue:", newIssue);
    res.json({ success: true, issueId: id, priority_score });
  } catch (err) {
    console.error("Server error:", err);
    res.json({ success: false, error: err.message });
  }
});

// Get all issues
app.get("/api/all-issues", (req, res) => {
  const issues = readIssues();
  res.json({ issues });
});

// Prioritize: return issues with priority_score (sorted)
app.get("/api/prioritize-issues", (req, res) => {
  const issues = readIssues();
  // ensure priority_score exists on each item
  const withScore = issues.map((i) => ({
    ...i,
    priority_score: Number(i.priority_score ?? 0),
  }));
  const prioritized = withScore.sort((a, b) => b.priority_score - a.priority_score);
  res.json({ issues: prioritized });
});

// Optional: top N
app.get("/api/top-priorities", (req, res) => {
  const limit = parseInt(req.query.limit || "10", 10);
  const issues = readIssues();
  const prioritized = issues
    .map((i) => ({ ...i, priority_score: Number(i.priority_score ?? 0) }))
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, limit);
  res.json({ issues: prioritized });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
