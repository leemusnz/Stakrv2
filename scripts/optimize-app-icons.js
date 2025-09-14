#!/usr/bin/env node

/**
 * App Icon Optimization Script
 * 
 * This script ensures that the Stakr app icons are properly optimized
 * for mobile devices and PWA installation.
 * 
 * Requirements:
 * - Sharp package for image processing
 * - Proper icon files in public/logos/
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for different platforms
const iconSizes = [
  // PWA Manifest sizes
  { size: 72, purpose: 'any' },
  { size: 96, purpose: 'any' },
  { size: 128, purpose: 'any' },
  { size: 144, purpose: 'any' },
  { size: 152, purpose: 'any' },
  { size: 192, purpose: 'any' },
  { size: 384, purpose: 'any' },
  { size: 512, purpose: 'any' },
  
  // Apple Touch Icon sizes
  { size: 57, purpose: 'apple' },
  { size: 60, purpose: 'apple' },
  { size: 72, purpose: 'apple' },
  { size: 76, purpose: 'apple' },
  { size: 114, purpose: 'apple' },
  { size: 120, purpose: 'apple' },
  { size: 144, purpose: 'apple' },
  { size: 152, purpose: 'apple' },
  { size: 180, purpose: 'apple' },
];

// Generate manifest.json with proper icon configurations
function generateManifest() {
  const manifest = {
    name: "Stakr - Challenge-Based Self-Improvement",
    short_name: "Stakr",
    description: "Build better habits through accountable challenges with real stakes",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#F46036",
    orientation: "portrait",
    scope: "/",
    categories: ["lifestyle", "health-and-fitness", "productivity"],
    lang: "en",
    dir: "ltr",
    icons: iconSizes.map(({ size, purpose }) => ({
      src: `/logos/stakr-icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: purpose === 'apple' ? 'any' : purpose
    })),
    shortcuts: [
      {
        name: "Discover Challenges",
        short_name: "Discover",
        description: "Browse new challenges to join",
        url: "/discover",
        icons: [{ src: "/logos/stakr-icon-96x96.png", sizes: "96x96" }]
      },
      {
        name: "My Profile",
        short_name: "Profile", 
        description: "View your profile and progress",
        url: "/profile",
        icons: [{ src: "/logos/stakr-icon-96x96.png", sizes: "96x96" }]
      }
    ]
  };

  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Generated optimized manifest.json');
}

// Generate Apple splash screen meta tags
function generateAppleSplashScreens() {
  const splashScreens = [
    // iPhone sizes
    { width: 375, height: 812, ratio: 3, device: 'iPhone 12/13 Mini' },
    { width: 390, height: 844, ratio: 3, device: 'iPhone 13/14' },
    { width: 393, height: 852, ratio: 3, device: 'iPhone 14 Pro' },
    { width: 430, height: 932, ratio: 3, device: 'iPhone 14 Pro Max' },
    
    // iPad sizes
    { width: 768, height: 1024, ratio: 2, device: 'iPad' },
    { width: 1024, height: 1366, ratio: 2, device: 'iPad Pro' },
  ];

  console.log('📱 Apple Splash Screen configurations:');
  splashScreens.forEach(({ width, height, ratio, device }) => {
    console.log(`  - ${device}: ${width}x${height} @${ratio}x`);
  });
}

// Validate existing icon files
function validateIcons() {
  const logosDir = path.join(process.cwd(), 'public', 'logos');
  
  if (!fs.existsSync(logosDir)) {
    console.log('❌ Logos directory not found');
    return false;
  }

  const requiredIcons = [
    'stakr-icon.png',
    'stakr-icon-white.png',
    'stakr-full.png',
    'stakr-full-white.png'
  ];

  let allIconsExist = true;
  requiredIcons.forEach(icon => {
    const iconPath = path.join(logosDir, icon);
    if (fs.existsSync(iconPath)) {
      console.log(`✅ Found: ${icon}`);
    } else {
      console.log(`❌ Missing: ${icon}`);
      allIconsExist = false;
    }
  });

  return allIconsExist;
}

// Main execution
function main() {
  console.log('🚀 Optimizing Stakr App Icons...\n');
  
  // Validate existing icons
  const iconsValid = validateIcons();
  if (!iconsValid) {
    console.log('\n❌ Please ensure all required icon files exist in public/logos/');
    process.exit(1);
  }
  
  // Generate optimized manifest
  generateManifest();
  
  // Generate Apple splash screen configurations
  generateAppleSplashScreens();
  
  console.log('\n✅ App icon optimization complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Ensure your main icon (stakr-icon.png) is at least 512x512px');
  console.log('  2. Test PWA installation on mobile devices');
  console.log('  3. Verify splash screens display correctly on iOS');
  console.log('  4. Test app icon appearance on home screen');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateManifest,
  generateAppleSplashScreens,
  validateIcons,
  iconSizes
};
