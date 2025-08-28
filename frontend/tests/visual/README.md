# Visual Testing Documentation

## Overview
This directory contains comprehensive visual regression tests for the E-Taca donation platform using Playwright.

## Test Coverage

### Test Files
- **home.spec.ts** - Home page visual tests including hero section, particles background, and organization buttons
- **organization.spec.ts** - Organization pages with donation goals and glass card effects
- **admin.spec.ts** - Admin panel including login, dashboard, and all admin pages
- **donation-flow.spec.ts** - Complete donation flow from selection to success/failure pages
- **components.spec.ts** - Individual UI components (buttons, cards, inputs, modals, etc.)
- **mobile.spec.ts** - Mobile-specific UI and interactions
- **accessibility.spec.ts** - Accessibility compliance including color contrast, keyboard navigation, and ARIA labels

## Running Tests

### Local Development
```bash
# Run all visual tests
npm run test:visual

# Run tests with UI mode for debugging
npm run test:visual:ui

# Update baseline screenshots
npm run test:visual:update

# Debug tests step by step
npm run test:visual:debug

# Run tests in headed mode (see browser)
npm run test:visual:headed

# Run specific test file
npx playwright test tests/visual/home.spec.ts

# Run tests for specific browser
npx playwright test --project="Desktop Chrome"
```

### CI/CD Integration
Visual tests run automatically on:
- Push to main or develop branches
- Pull requests to main
- Manual workflow dispatch

## Visual Test Helper

The `visual-helper.ts` file provides utilities for:
- Taking consistent screenshots
- Comparing with baseline images
- Hiding animations for stable tests
- Checking accessibility
- Testing responsive layouts

## Configuration

Tests are configured in `playwright.config.ts`:
- Multiple browser engines (Chrome, Firefox, Safari)
- Mobile devices (iPhone 12, Pixel 5, iPad)
- Desktop viewports (1920x1080)
- Automatic retries on failure
- HTML and JSON reporting

## Best Practices

1. **Disable Animations**: Use `hideAnimatedElements()` to ensure consistent screenshots
2. **Wait for Network**: Use `waitForLoadState('networkidle')` before taking screenshots
3. **Use Baselines**: Commit baseline images to track visual changes
4. **Test Multiple Viewports**: Ensure responsive design works across devices
5. **Check Accessibility**: Include basic accessibility checks in visual tests

## Updating Baselines

When intentional visual changes are made:
```bash
# Update all baselines
npm run test:visual:update

# Update specific test baselines
npx playwright test tests/visual/home.spec.ts --update-snapshots
```

## Viewing Test Reports

After running tests:
```bash
# Open HTML report
npx playwright show-report

# Reports are saved in:
# - playwright-report/ (HTML)
# - test-results/report.json (JSON)
```

## Screenshot Storage

- **Baselines**: Stored in `tests/visual/**/__screenshots__/`
- **Test Screenshots**: Saved in `tests/visual/screenshots/`
- **Failure Screenshots**: Automatically captured in `test-results/`

## Troubleshooting

### Flaky Tests
- Increase `waitForTimeout` values
- Use `waitForLoadState('networkidle')`
- Disable animations with `hideAnimatedElements()`

### Different Results Locally vs CI
- Ensure same browser versions
- Use Docker for consistent environment
- Check font rendering differences

### Large Diffs
- Update threshold in `compareWithBaseline()`
- Increase `maxDiffPixels` tolerance
- Consider viewport size differences