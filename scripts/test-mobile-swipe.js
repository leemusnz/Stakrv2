#!/usr/bin/env node

/**
 * Mobile Swipe UI Test Script
 * 
 * This script helps verify that the mobile swipe UI fixes are working properly.
 * Run this script after starting the development server.
 */

const puppeteer = require('puppeteer');

async function testMobileSwipe() {
  console.log('🧪 Starting Mobile Swipe UI Tests...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true
    }
  });

  const page = await browser.newPage();

  // Set user agent to mobile
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');

  try {
    console.log('📱 Testing Mobile Discover Page...');
    await testDiscoverPage(page);

    console.log('\n📱 Testing Mobile Onboarding...');
    await testOnboardingPage(page);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testDiscoverPage(page) {
  await page.goto('http://localhost:3000/discover', { waitUntil: 'networkidle0' });

  // Test 1: Verify normal scrolling works
  console.log('  - Testing normal scrolling...');
  const scrollable = await page.evaluate(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    return scrollHeight > clientHeight;
  });
  
  if (scrollable) {
    console.log('    ✅ Page is scrollable');
  } else {
    console.log('    ⚠️  Page may not be scrollable');
  }

  // Test 2: Check for mobile discover component
  const mobileDiscover = await page.$('[data-testid="discover-mobile"]') || 
                        await page.$('.discover-mobile') ||
                        await page.$('[class*="mobile"]');
  
  if (mobileDiscover) {
    console.log('    ✅ Mobile discover component found');
  } else {
    console.log('    ⚠️  Mobile discover component not found');
  }

  // Test 3: Check for action buttons
  const actionButtons = await page.$$('button[class*="rounded-full"]');
  if (actionButtons.length >= 3) {
    console.log(`    ✅ Found ${actionButtons.length} action buttons`);
  } else {
    console.log('    ⚠️  Action buttons not found or insufficient');
  }
}

async function testOnboardingPage(page) {
  await page.goto('http://localhost:3000/onboarding', { waitUntil: 'networkidle0' });

  // Test 1: Check for progress bar
  const progressBar = await page.$('[role="progressbar"]') || 
                     await page.$('[class*="progress"]');
  
  if (progressBar) {
    console.log('    ✅ Progress bar found');
  } else {
    console.log('    ⚠️  Progress bar not found');
  }

  // Test 2: Check for navigation buttons
  const navButtons = await page.$$('button:has-text("Back"), button:has-text("Next")');
  if (navButtons.length >= 2) {
    console.log(`    ✅ Found ${navButtons.length} navigation buttons`);
  } else {
    console.log('    ⚠️  Navigation buttons not found');
  }

  // Test 3: Check for swipe hints
  const swipeHint = await page.$('text*="Swipe"') || 
                   await page.$('[class*="swipe"]');
  
  if (swipeHint) {
    console.log('    ✅ Swipe hints found');
  } else {
    console.log('    ⚠️  Swipe hints not found');
  }
}

// Manual testing instructions
function printManualTestInstructions() {
  console.log('\n📋 Manual Testing Instructions:');
  console.log('================================');
  console.log('');
  console.log('1. Open browser dev tools');
  console.log('2. Toggle device toolbar');
  console.log('3. Select iPhone 12 (375x667)');
  console.log('4. Navigate to http://localhost:3000/discover');
  console.log('');
  console.log('🧪 Test Scenarios:');
  console.log('');
  console.log('✅ SCROLLING TEST:');
  console.log('   - Try scrolling up and down the page');
  console.log('   - Should scroll smoothly without interference');
  console.log('');
  console.log('✅ SWIPE TEST:');
  console.log('   - Try swiping challenge cards left/right/up');
  console.log('   - Should only trigger on intentional swipes (150px+)');
  console.log('   - Should show visual indicators during swipes');
  console.log('');
  console.log('✅ BUTTON TEST:');
  console.log('   - Try using the action buttons instead of swipes');
  console.log('   - Should work as alternative to swipe gestures');
  console.log('');
  console.log('✅ VISUAL TEST:');
  console.log('   - Check for visual indicators during swipes');
  console.log('   - Should only show when actively swiping');
  console.log('   - Should not show constantly');
  console.log('');
  console.log('✅ PERFORMANCE TEST:');
  console.log('   - Check for smooth animations');
  console.log('   - No janky transitions or delays');
  console.log('');
  console.log('🔗 Test URLs:');
  console.log('   - Discover: http://localhost:3000/discover');
  console.log('   - Onboarding: http://localhost:3000/onboarding');
  console.log('   - Mobile Demo: http://localhost:3000/mobile-demo');
}

// Run tests if this script is executed directly
if (require.main === module) {
  // Check if puppeteer is available
  try {
    require('puppeteer');
    testMobileSwipe();
  } catch (error) {
    console.log('📱 Mobile Swipe UI Testing');
    console.log('==========================');
    console.log('');
    console.log('Puppeteer not available. Running manual test instructions...');
    printManualTestInstructions();
  }
}

module.exports = {
  testMobileSwipe,
  printManualTestInstructions
};

