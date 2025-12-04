# ml/predict.py
import sys
import json
import joblib
import numpy as np
import os

MODEL_PATH = os.path.join('ml', 'priority_model.pkl')
ISSUE_ENCODER_PATH = os.path.join('ml', 'issue_encoder.pkl')
WEATHER_ENCODER_PATH = os.path.join('ml', 'weather_encoder.pkl')

model = joblib.load(MODEL_PATH)
le_issue = joblib.load(ISSUE_ENCODER_PATH)
le_weather = joblib.load(WEATHER_ENCODER_PATH)

def safe_transform(encoder, value):
    try:
        return encoder.transform([value])[0]
    except Exception:
        # fallback: add safe unknown mapping as 0
        return 0

def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error":"no input"}))
        return

    try:
        input_data = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error": f"invalid json: {str(e)}"}))
        return

    issue_type = input_data.get('issue_type', '')
    weather = input_data.get('weather', '')
    temp = input_data.get('temp', 0.0)
    traffic_delay = input_data.get('traffic_delay', 0.0)
    repeat_count = input_data.get('repeat_count', 0)
    hour = input_data.get('hour', 0)

    issue_encoded = safe_transform(le_issue, issue_type)
    weather_encoded = safe_transform(le_weather, weather)

    X = np.array([[issue_encoded, weather_encoded, float(temp), float(traffic_delay), int(repeat_count), int(hour)]])
    try:
        pred = model.predict(X)[0]
        # ensure within 0..1 range (if your model was trained like that)
        if pred < 0: pred = 0.0
        # you might clamp >1 depending on your dataset
        result = {"priority_score": round(float(pred), 2)}
    except Exception as e:
        result = {"error": str(e), "priority_score": 0.0}

    print(json.dumps(result))

if __name__ == "__main__":
    main()
