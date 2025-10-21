#!/bin/bash

# Vercel Environment Variables Setup Helper
# This script helps you verify that all required environment variables are set

echo "🔍 Checking required environment variables for InkMatching Web..."
echo ""

MISSING=0

# Function to check if variable exists
check_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Missing: $1"
        MISSING=$((MISSING + 1))
        return 1
    else
        echo "✅ Found: $1"
        return 0
    fi
}

echo "📱 Firebase Client Configuration:"
check_var "NEXT_PUBLIC_FIREBASE_API_KEY"
check_var "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
check_var "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
check_var "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
check_var "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
check_var "NEXT_PUBLIC_FIREBASE_APP_ID"
check_var "NEXT_PUBLIC_FIREBASE_DATABASE_URL"

echo ""
echo "🔐 Firebase Admin (Server-side):"
check_var "FIREBASE_SERVICE_ACCOUNT_KEY"

echo ""
echo "💳 Stripe Configuration:"
check_var "STRIPE_SECRET_KEY"
check_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
check_var "STRIPE_WEBHOOK_SECRET"

echo ""
echo "🤖 OpenAI Configuration:"
check_var "OPENAI_API_KEY"

echo ""
echo "═══════════════════════════════════════"

if [ $MISSING -eq 0 ]; then
    echo "✅ All environment variables are set!"
    echo ""
    echo "You can now run:"
    echo "  npm run build    # Test production build"
    echo "  npm run dev      # Start development server"
    exit 0
else
    echo "❌ $MISSING environment variable(s) missing"
    echo ""
    echo "Please check VERCEL_DEPLOYMENT.md for setup instructions"
    echo ""
    echo "Quick fix:"
    echo "  1. Copy .env.local.example to .env.local"
    echo "  2. Fill in all values with your credentials"
    echo "  3. Run this script again"
    exit 1
fi
