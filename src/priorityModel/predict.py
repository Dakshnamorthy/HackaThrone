# ml/predict.py
import sys
import joblib
import numpy as np
import os

# Load model from ml/ folder
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'priority_model.pkl')
model = joblib.load(model_path)

# Read input from Node.js
issue_type = sys.argv[1]
lat = float(sys.argv[2])
lng = float(sys.argv[3])
is_rain = sys.argv[4].lower() == 'true'
traffic = float(sys.argv[5])
blur = float(sys.argv[6])
repeat_count = int(sys.argv[7])
hour = int(sys.argv[8])

is_pothole = 1 if issue_type == 'Pothole' else 0
is_garbage = 1 if issue_type == 'Garbage' else 0
is_water = 1 if issue_type == 'Water' else 0

X = np.array([[
    is_pothole, is_garbage, is_water,
    lat, lng, is_rain, traffic, blur, repeat_count, hour
]])
score = model.predict(X)[0]
print(f"{score:.2f}")
