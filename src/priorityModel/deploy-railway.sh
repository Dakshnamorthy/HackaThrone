#!/bin/bash
# Deploy ML Priority Model to Railway

echo "🚀 Deploying ML Priority Model to Railway..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    echo ""
fi

# Check if model file exists
if [ ! -f "priority_model.pkl" ]; then
    echo "⚠️  Model file not found!"
    echo "🧠 Training model first..."
    python3 train_model.py
    echo ""
fi

echo "✅ All prerequisites ready!"
echo ""
echo "🚀 Starting deployment to Railway..."
echo ""

# Deploy to Railway
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Get your deployment URL:"
echo "   railway domain"
echo ""
echo "📝 Next steps:"
echo "1. Run: railway domain"
echo "2. Copy the URL"
echo "3. Add to your .env file:"
echo "   VITE_ML_API_URL=https://your-railway-url.railway.app"
echo "4. Update ReportedIssues.jsx to use the environment variable"
echo "5. Restart your frontend: npm run dev"
echo ""
echo "📖 See DEPLOY_TO_RAILWAY.md for detailed instructions"
