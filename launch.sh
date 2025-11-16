#!/bin/bash

###############################################################################
# Realm of Valor - Unix/Mac Launch Script
###############################################################################

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm is not installed. Installing..."
    npm install -g pnpm
fi

# Run the launcher
node launcher.js
