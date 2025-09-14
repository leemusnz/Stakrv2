const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes we need for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Path to the original icon
const originalIconPath = path.join(__dirname, '..', 'public', 'logos', 'stakr-icon.png');

async function createPWAIcon(size) {
  try {
    console.log(`Creating ${size}x${size} icon...`);
    
    // Create a properly sized icon with centered logo
    // The logo should be about 70% of the icon size for good visibility
    const logoSize = Math.floor(size * 0.75);
    const padding = Math.floor((size - logoSize) / 2);
    
    // Create the icon with proper centering
    const icon = await sharp(originalIconPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    
    console.log(`✅ Created icon-${size}x${size}.png`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${size}x${size} icon:`, error.message);
    return false;
  }
}

async function createAllIcons() {
  console.log('🎨 Creating PWA icons with proper sizing and centering...\n');
  
  // Check if original icon exists
  if (!fs.existsSync(originalIconPath)) {
    console.error('❌ Original icon not found at:', originalIconPath);
    return;
  }
  
  let successCount = 0;
  
  for (const size of iconSizes) {
    const success = await createPWAIcon(size);
    if (success) successCount++;
  }
  
  console.log(`\n🎉 Icon creation complete! ${successCount}/${iconSizes.length} icons created successfully.`);
  console.log('📱 Icons are now properly sized and centered for optimal PWA display.');
  console.log('🔄 You may need to reinstall the PWA or clear browser cache to see changes.');
}

// Run the icon creation
createAllIcons().catch(console.error);
