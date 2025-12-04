#!/bin/bash
# Deploy ML Priority Model to Vercel

echo "🚀 Deploying ML Priority Model to Vercel..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if model file exists
if [ ! -f "priority_model.pkl" ]; then
    echo "⚠️  Model file not found!"
    echo "🧠 Training model first..."
    python3 train_model.py
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node dependencies..."
    npm install
    echo ""
fi

echo "✅ All prerequisites ready!"
echo ""
echo "🚀 Starting deployment..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the deployment URL from above"
echo "2. Add it to your .env file:"
echo "   VITE_ML_API_URL=https://your-deployment-url.vercel.app"
echo "3. Update ReportedIssues.jsx to use the environment variable"
echo "4. Restart your frontend: npm run dev"
echo ""
echo "📖 See UPDATE_ML_URL.md for detailed instructions"
