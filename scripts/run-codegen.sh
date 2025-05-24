#!/bin/bash

# Script to run Supabase codegen for database types

echo "🔄 Running Supabase TypeScript codegen..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️ Supabase CLI not found, installing..."
    npm install --save-dev supabase
fi

# Run the codegen command
echo "🚀 Generating TypeScript types from Supabase schema..."
npm run codegen

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully generated database.types.ts"
    echo "🔍 You can now use these types in your code"
else
    echo "❌ Error generating database types"
    echo "Please check your Supabase project ID and connection"
    exit 1
fi