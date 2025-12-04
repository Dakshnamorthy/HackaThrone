# predict_batch.py - Optimized batch prediction
import sys
import json
import joblib
import numpy as np
import os

# Load model ONCE at startup
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'priority_model.pkl')
model = joblib.load(model_path)

def predict_single(issue_data):
    """Predict priority for a single issue"""
    issue_type = issue_data.get('type', 'Unknown')
    lat = float(issue_data.get('latitude', 11.9416))
    lng = float(issue_data.get('longitude', 79.8083))
    is_rain = issue_data.get('is_rain', False)
    traffic = float(issue_data.get('traffic', 0.0))
    blur = float(issue_data.get('blur', 0.5))
    repeat_count = int(issue_data.get('repeat_count', 0))
    hour = int(issue_data.get('hour', 12))
    
    # One-hot encode issue type
    is_pothole = 1 if issue_type == 'Pothole' else 0
    is_garbage = 1 if issue_type == 'Garbage' else 0
    is_water = 1 if issue_type == 'Water' else 0
    
    # Create feature vector
    X = np.array([[
        is_pothole, is_garbage, is_water,
        lat, lng, is_rain, traffic, blur, repeat_count, hour
    ]])
    
    # Predict
    score = model.predict(X)[0]
    return float(score)

def main():
    try:
        # Read JSON array from stdin
        raw = sys.stdin.read()
        if not raw:
            print(json.dumps({"error": "no input"}))
            return
        
        issues = json.loads(raw)
        
        if not isinstance(issues, list):
            issues = [issues]  # Handle single issue
        
        # Process all issues
        results = []
        for issue in issues:
            try:
                score = predict_single(issue)
                results.append({
                    "id": issue.get('id'),
                    "priority_score": round(score, 3)
                })
            except Exception as e:
                results.append({
                    "id": issue.get('id'),
                    "priority_score": 0.5,
                    "error": str(e)
                })
        
        print(json.dumps({"success": True, "results": results}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
