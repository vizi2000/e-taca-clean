#!/bin/bash

echo "Setting up Visual Testing for E-Taca Platform"
echo "============================================="

# Create necessary directories
mkdir -p tests/visual/screenshots
mkdir -p tests/visual/__screenshots__

# Install Playwright if not already installed
if ! command -v playwright &> /dev/null; then
    echo "Installing Playwright..."
    npm install -D @playwright/test playwright
fi

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install

# Run initial test to create baseline
echo "Creating initial baselines..."
npm run test:visual:update -- --project="Desktop Chrome" tests/visual/home.spec.ts

echo ""
echo "Visual testing setup complete!"
echo ""
echo "Available commands:"
echo "  npm run test:visual         - Run all visual tests"
echo "  npm run test:visual:ui      - Run tests with UI mode"
echo "  npm run test:visual:update  - Update baseline screenshots"
echo "  npm run test:visual:debug   - Debug tests step by step"
echo "  npm run test:visual:headed  - Run tests with visible browser"
echo ""
echo "To run a specific test:"
echo "  npx playwright test tests/visual/home.spec.ts"
echo ""
echo "To view test report:"
echo "  npx playwright show-report"