# ml/train_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib

print("🧠 Generating realistic training data...")

# Simulate real-world data
num_samples = 1000
data = []

for _ in range(num_samples):
    lat = np.random.uniform(10.0, 14.0)
    lng = np.random.uniform(76.0, 80.5)
    issue_type = np.random.choice(['Pothole', 'Garbage', 'Streetlight'])
    
    # Simulate weather: rain increases risk
    is_rain = 1 if lat >= 10.0 and lat <= 12.0 and np.random.rand() < 0.6 else 0
    weather = 'Rain' if is_rain else 'Clear'
    
    # Simulate traffic: 0=low, 0.5=medium, 1=high
    traffic = np.random.choice([0, 0.5, 1], p=[0.3, 0.5, 0.2])
    
    # Simulate image quality: higher blur = lower priority
    blur = np.random.uniform(0.0, 1.0)
    
    # Repeat reports in same area
    repeat_count = np.random.randint(0, 5)
    
    # Time of day (prime time = higher urgency)
    hour = np.random.randint(0, 24)
    
    # === Realistic priority logic (model learns from this) ===
    score = 0.35 * (issue_type == 'Pothole')
    score += 0.25 * (issue_type == 'Garbage')
    score += 0.2 * (issue_type == 'Water')
    
    if weather == 'Rain':
        score += 0.2
    
    if traffic == 1:
        score += 0.15
    elif traffic == 0.5:
        score += 0.05
    
    if blur < 0.3:
        score += 0.1
    
    if repeat_count >= 3:
        score += 0.15
    elif repeat_count >= 1:
        score += 0.05
        
    if 18 <= hour <= 22:
        score += 0.1
    
    score = np.clip(score, 0.1, 0.99)
    
    # One-hot encode
    data.append([issue_type == 'Pothole', issue_type == 'Garbage', issue_type == 'Water',
                 lat, lng, is_rain, traffic, blur, repeat_count, hour, score])

columns = [
    'is_pothole', 'is_garbage', 'is_water', 'lat', 'lng', 'is_rain',
    'traffic', 'blur', 'repeat_count', 'hour', 'priority'
]
df = pd.DataFrame(data, columns=columns)
df.to_csv('ml/training_data.csv', index=False)
print("✅ Saved training_data.csv")

X = df.drop('priority', axis=1)
y = df['priority']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

joblib.dump(model, 'ml/priority_model.pkl')
print("✅ Model saved: ml/priority_model.pkl")

print(f"📈 Model accuracy: Train={model.score(X_train, y_train):.3f}, Test={model.score(X_test, y_test):.3f}")
