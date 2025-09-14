const fs = require('fs');
const path = require('path');

// Icon sizes we need for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create the optimized manifest.json content
const manifestContent = {
  "name": "Stakr - Challenge-Based Self-Improvement",
  "short_name": "Stakr",
  "description": "Build better habits through accountable challenges with real stakes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#F46036",
  "orientation": "portrait",
  "scope": "/",
  "id": "stakr-app",
  "display_override": ["window-controls-overlay", "standalone"],
  "categories": [
    "lifestyle",
    "health-and-fitness",
    "productivity"
  ],
  "lang": "en",
  "dir": "ltr",
  "icons": iconSizes.map(size => ({
    "src": `/icons/icon-${size}x${size}.png`,
    "sizes": `${size}x${size}`,
    "type": "image/png",
    "purpose": "any"
  })),
  "shortcuts": [
    {
      "name": "Discover Challenges",
      "short_name": "Discover",
      "description": "Browse new challenges to join",
      "url": "/discover",
      "icons": [
        {
          "src": "/icons/icon-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "My Profile",
      "short_name": "Profile",
      "description": "View your profile and progress",
      "url": "/profile",
      "icons": [
        {
          "src": "/icons/icon-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write the updated manifest
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2));

console.log('✅ Updated manifest.json with optimized icon paths');
console.log('📁 Icons directory created at:', iconsDir);
console.log('📋 Next steps:');
console.log('1. Create properly sized and centered icon files in /public/icons/');
console.log('2. Each icon should be optimized for its specific size');
console.log('3. Logo should be properly centered and sized within each icon');

// Instructions for manual icon creation
console.log('\n🎨 Icon Creation Guidelines:');
iconSizes.forEach(size => {
  const logoSize = Math.floor(size * 0.7); // Logo should be 70% of icon size
  const padding = Math.floor((size - logoSize) / 2);
  console.log(`${size}x${size}: Logo ${logoSize}x${logoSize}, centered with ${padding}px padding`);
});
