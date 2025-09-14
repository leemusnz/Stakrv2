const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const originalIconPath = path.join(__dirname, '..', 'public', 'logos', 'stakr-icon.png');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const appleSizes = [120, 180];

async function createAppleIcon(size) {
  try {
    console.log(`Creating Apple icon ${size}x${size}...`);
    
    const logoSize = Math.floor(size * 0.75);
    const padding = Math.floor((size - logoSize) / 2);
    
    await sharp(originalIconPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    
    console.log(`✅ Created Apple icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`❌ Error creating Apple icon ${size}x${size}:`, error.message);
  }
}

async function createAllAppleIcons() {
  for (const size of appleSizes) {
    await createAppleIcon(size);
  }
  console.log('🎉 Apple icons created successfully!');
}

createAllAppleIcons().catch(console.error);
