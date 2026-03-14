#!/usr/bin/env node

/**
 * Mobile Testing Script for Stakr
 * 
 * Tests service worker, PWA functionality, and mobile performance
 * Run: node scripts/mobile-test.js
 */

const https = require('https');
const fs = require('fs');

const SITE_URL = process.env.SITE_URL || 'https://stakr.app';
const RESULTS_DIR = './test-results';

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

// Create results directory
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Test 1: Check Service Worker exists
async function testServiceWorker() {
  log('\n📱 Testing Service Worker...', 'cyan');
  
  return new Promise((resolve) => {
    https.get(`${SITE_URL}/sw.js`, (res) => {
      if (res.statusCode === 200) {
        log(`${checkmark()} Service worker file exists (sw.js)`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const hasNetworkFirst = data.includes('NetworkFirst');
          const hasCacheFirst = data.includes('CacheFirst');
          const hasSkipWaiting = data.includes('skipWaiting');
          const hasClientsClaimimport = data.includes('clients.claim');
          
          if (hasNetworkFirst || data.includes('network-first')) {
            log(`${checkmark()} Network-first strategy detected`);
          } else {
            log(`${crossmark()} Warning: Network-first strategy not found`);
          }
          
          if (hasSkipWaiting || data.includes('self.skipWaiting')) {
            log(`${checkmark()} Skip waiting enabled`);
          } else {
            log(`${crossmark()} Warning: Skip waiting not found`);
          }
          
          resolve(true);
        });
      } else {
        log(`${crossmark()} Service worker not found (${res.statusCode})`);
        resolve(false);
      }
    }).on('error', (err) => {
      log(`${crossmark()} Error fetching service worker: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

// Test 2: Check PWA Manifest
async function testManifest() {
  log('\n📱 Testing PWA Manifest...', 'cyan');
  
  return new Promise((resolve) => {
    https.get(`${SITE_URL}/manifest.json`, (res) => {
      if (res.statusCode === 200) {
        log(`${checkmark()} Manifest file exists`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const manifest = JSON.parse(data);
            
            // Check required fields
            const checks = [
              { field: 'name', value: manifest.name },
              { field: 'short_name', value: manifest.short_name },
              { field: 'start_url', value: manifest.start_url },
              { field: 'display', value: manifest.display },
              { field: 'theme_color', value: manifest.theme_color },
              { field: 'background_color', value: manifest.background_color },
            ];
            
            checks.forEach(({ field, value }) => {
              if (value) {
                log(`${checkmark()} ${field}: ${value}`);
              } else {
                log(`${crossmark()} Missing: ${field}`, 'yellow');
              }
            });
            
            // Check icons
            if (manifest.icons && manifest.icons.length > 0) {
              log(`${checkmark()} Icons defined: ${manifest.icons.length} sizes`);
              const has192 = manifest.icons.some(i => i.sizes?.includes('192'));
              const has512 = manifest.icons.some(i => i.sizes?.includes('512'));
              
              if (has192) log(`${checkmark()} 192x192 icon present`);
              else log(`${crossmark()} Missing 192x192 icon`, 'yellow');
              
              if (has512) log(`${checkmark()} 512x512 icon present`);
              else log(`${crossmark()} Missing 512x512 icon`, 'yellow');
            } else {
              log(`${crossmark()} No icons defined`, 'red');
            }
            
            resolve(true);
          } catch (err) {
            log(`${crossmark()} Invalid manifest JSON: ${err.message}`, 'red');
            resolve(false);
          }
        });
      } else {
        log(`${crossmark()} Manifest not found (${res.statusCode})`);
        resolve(false);
      }
    }).on('error', (err) => {
      log(`${crossmark()} Error fetching manifest: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

// Test 3: Check HTML meta tags for mobile
async function testMobileMetaTags() {
  log('\n📱 Testing Mobile Meta Tags...', 'cyan');
  
  return new Promise((resolve) => {
    https.get(SITE_URL, (res) => {
      if (res.statusCode === 200) {
        let html = '';
        res.on('data', (chunk) => html += chunk);
        res.on('end', () => {
          const checks = [
            { name: 'Viewport meta', pattern: /<meta[^>]*name="viewport"[^>]*>/i },
            { name: 'Theme color', pattern: /<meta[^>]*name="theme-color"[^>]*>/i },
            { name: 'Apple web app capable', pattern: /<meta[^>]*name="apple-mobile-web-app-capable"[^>]*>/i },
            { name: 'Manifest link', pattern: /<link[^>]*rel="manifest"[^>]*>/i },
            { name: 'Apple touch icon', pattern: /<link[^>]*rel="apple-touch-icon"[^>]*>/i },
          ];
          
          checks.forEach(({ name, pattern }) => {
            if (pattern.test(html)) {
              log(`${checkmark()} ${name} present`);
            } else {
              log(`${crossmark()} Missing: ${name}`, 'yellow');
            }
          });
          
          resolve(true);
        });
      } else {
        log(`${crossmark()} Could not fetch homepage (${res.statusCode})`);
        resolve(false);
      }
    }).on('error', (err) => {
      log(`${crossmark()} Error fetching homepage: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

// Test 4: Performance check
async function testPerformance() {
  log('\n📱 Performance Check...', 'cyan');
  log('Note: Run Lighthouse for detailed mobile performance metrics', 'yellow');
  log('Command: npx lighthouse https://stakr.app --preset=desktop --view', 'cyan');
  log('Mobile:  npx lighthouse https://stakr.app --preset=mobile --view', 'cyan');
  return true;
}

// Main test runner
async function runTests() {
  log('='.repeat(60), 'blue');
  log('  Stakr Mobile Testing Suite', 'blue');
  log('='.repeat(60), 'blue');
  log(`\nTesting: ${SITE_URL}\n`, 'cyan');
  
  const results = {
    serviceWorker: await testServiceWorker(),
    manifest: await testManifest(),
    metaTags: await testMobileMetaTags(),
    performance: await testPerformance(),
  };
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('  Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  log(`\n${passed}/${total} test categories passed\n`);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? checkmark() : crossmark();
    const name = test.replace(/([A-Z])/g, ' $1').trim();
    log(`${status} ${name}`);
  });
  
  log('\n' + '='.repeat(60), 'blue');
  log('\nNext Steps:', 'cyan');
  log('1. Run Lighthouse audit for detailed performance metrics');
  log('2. Test on physical iOS device (Safari)');
  log('3. Test on physical Android device (Chrome)');
  log('4. Check MOBILE_TESTING.md for complete checklist\n');
  
  // Save results
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    url: SITE_URL,
    results,
    passed,
    total,
  };
  
  fs.writeFileSync(
    `${RESULTS_DIR}/mobile-test-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );
  
  log(`Results saved to ${RESULTS_DIR}/`, 'green');
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
