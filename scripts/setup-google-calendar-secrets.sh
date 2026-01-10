#!/bin/bash

# Google Calendar API Secrets Setup Script
# This script sets up the required secrets for Google Calendar integration in Supabase

echo "🔐 Google Calendar API Secrets Setup"
echo "======================================"
echo ""
echo "This script will help you set up the required secrets for Google Calendar integration."
echo "Make sure you have the Supabase CLI installed and logged in."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install -g supabase"
    exit 1
fi

# Prompt for Google Client ID
echo "📝 Enter your Google Client ID:"
echo "   (Get this from Google Cloud Console > APIs & Services > Credentials)"
read -r GOOGLE_CLIENT_ID

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ Google Client ID is required"
    exit 1
fi

# Prompt for Google Client Secret
echo ""
echo "📝 Enter your Google Client Secret:"
echo "   (Get this from Google Cloud Console > APIs & Services > Credentials)"
read -rs GOOGLE_CLIENT_SECRET

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Google Client Secret is required"
    exit 1
fi

# Prompt for Redirect URI
echo ""
echo "📝 Enter your Google Calendar Redirect URI:"
echo "   (Default: http://localhost:5173/auth/google-calendar/callback)"
read -r GOOGLE_CALENDAR_REDIRECT_URI

if [ -z "$GOOGLE_CALENDAR_REDIRECT_URI" ]; then
    GOOGLE_CALENDAR_REDIRECT_URI="http://localhost:5173/auth/google-calendar/callback"
fi

echo ""
echo "🚀 Setting up Supabase secrets..."

# Set secrets using Supabase CLI
supabase secrets set GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
supabase secrets set GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
supabase secrets set GOOGLE_CALENDAR_REDIRECT_URI="$GOOGLE_CALENDAR_REDIRECT_URI"

echo ""
echo "✅ Secrets have been set successfully!"
echo ""
echo "📋 Summary:"
echo "   - GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}..."
echo "   - GOOGLE_CLIENT_SECRET: ****"
echo "   - GOOGLE_CALENDAR_REDIRECT_URI: $GOOGLE_CALENDAR_REDIRECT_URI"
echo ""
echo "🔗 Next steps:"
echo "   1. Verify secrets in Supabase Dashboard > Settings > Edge Functions > Secrets"
echo "   2. Deploy Edge Functions: supabase functions deploy"
echo "   3. Test the OAuth flow in your application"
