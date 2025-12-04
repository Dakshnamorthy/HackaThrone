# ml/train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

os.makedirs('ml', exist_ok=True)

# ====== Training Dataset Example (replace with your CSV if available) ======
data = {
    'issue_type': ['Garbage', 'Water', 'Electricity', 'Road', 'Garbage', 'Water'],
    'weather': ['Rain', 'Clear', 'Storm', 'Rain', 'Clouds', 'Clear'],
    'temp': [28, 35, 30, 25, 29, 33],
    'traffic_delay': [300, 60, 420, 180, 240, 90],
    'repeat_count': [4, 1, 3, 2, 5, 1],
    'hour': [10, 14, 19, 7, 16, 12],
    'priority': [0.9, 0.3, 0.85, 0.7, 0.95, 0.4]
}

df = pd.DataFrame(data)

# Encode categorical columns
le_issue = LabelEncoder()
le_weather = LabelEncoder()
df['issue_type_encoded'] = le_issue.fit_transform(df['issue_type'])
df['weather_encoded'] = le_weather.fit_transform(df['weather'])

# Features + Target
X = df[['issue_type_encoded', 'weather_encoded', 'temp', 'traffic_delay', 'repeat_count', 'hour']]
y = df['priority']

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model + encoders
joblib.dump(model, 'ml/priority_model.pkl')
joblib.dump(le_issue, 'ml/issue_encoder.pkl')
joblib.dump(le_weather, 'ml/weather_encoder.pkl')

print("✅ Model trained and saved successfully!")
