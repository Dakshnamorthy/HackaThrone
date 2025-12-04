#!/bin/bash
# Test batch prediction performance

echo "🧪 Testing batch prediction..."
echo ""

# Test data
TEST_DATA='[
  {"id":"test1","type":"Pothole","latitude":11.9416,"longitude":79.8083,"is_rain":false,"traffic":0.3,"blur":0.5,"repeat_count":2,"hour":14},
  {"id":"test2","type":"Garbage","latitude":11.9500,"longitude":79.8100,"is_rain":true,"traffic":0.7,"blur":0.2,"repeat_count":5,"hour":18},
  {"id":"test3","type":"Water","latitude":11.9300,"longitude":79.8200,"is_rain":false,"traffic":0.1,"blur":0.8,"repeat_count":1,"hour":10},
  {"id":"test4","type":"Pothole","latitude":11.9450,"longitude":79.8150,"is_rain":true,"traffic":0.9,"blur":0.3,"repeat_count":4,"hour":20}
]'

echo "📊 Testing with 4 issues..."
START=$(date +%s%3N)
RESULT=$(echo "$TEST_DATA" | python3 predict_batch.py)
END=$(date +%s%3N)
DURATION=$((END - START))

echo "✅ Result:"
echo "$RESULT" | python3 -m json.tool
echo ""
echo "⏱️  Time taken: ${DURATION}ms"
echo ""

if [ $DURATION -lt 2000 ]; then
  echo "✅ PASS: Batch prediction is fast (< 2 seconds)"
else
  echo "❌ FAIL: Batch prediction is slow (> 2 seconds)"
fi
