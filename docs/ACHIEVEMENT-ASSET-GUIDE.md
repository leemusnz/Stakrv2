# Stakr Achievement Asset Generation Guide

## Overview

The Stakr achievement system is designed to scale to **thousands of achievements** through procedural generation and template-based creation. This guide explains how to generate the necessary visual assets.

## Current Achievement Count

Based on the template system:
- **Milestone Achievements**: 11 (Levels 1, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100)
- **Challenge Count**: 12 (1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000)
- **Category Mastery**: 36 (6 categories × 6 milestones)
- **Difficulty Mastery**: 18 (3 difficulties × 6 milestones)
- **Streak Achievements**: 7 (3, 7, 14, 30, 50, 100, 365 days)

**Total Base Achievements**: ~84

With expansion potential for:
- More categories (10+ planned)
- Seasonal events (4 per year)
- Special achievements (100+)
- Hidden achievements (50+)

**Projected Total**: 500-1000+ achievements

## Asset Types Needed

### 1. Badge Images (Primary Asset)
- **Format**: PNG with transparency
- **Size**: 512x512px (will be scaled down)
- **Style**: Flat design with subtle gradients
- **Naming**: `{category}/{achievement-id}.png`

### 2. Banner Images (Optional)
- **Format**: PNG/WebP
- **Size**: 1920x400px
- **Use**: Profile showcase, achievement detail pages
- **Naming**: `{category}/{achievement-id}-banner.png`

### 3. Icon Overlays (Optional)
- **Format**: SVG preferred, PNG fallback
- **Size**: 128x128px
- **Use**: Small displays, notifications
- **Naming**: `{category}/{achievement-id}-icon.svg`

## Directory Structure

```
public/
└── achievements/
    ├── milestone/
    │   ├── level-1.png
    │   ├── level-5.png
    │   └── ...
    ├── challenges/
    │   ├── count-1.png
    │   ├── count-5.png
    │   └── ...
    ├── categories/
    │   ├── fitness/
    │   │   ├── 1.png
    │   │   ├── 5.png
    │   │   └── ...
    │   ├── mindfulness/
    │   └── ...
    ├── difficulty/
    │   ├── easy/
    │   ├── medium/
    │   └── hard/
    ├── streaks/
    │   ├── 3-days.png
    │   ├── 7-days.png
    │   └── ...
    └── templates/
        ├── common-template.png
        ├── uncommon-template.png
        └── ...
```

## Tier-Based Visual System

Each achievement tier has a distinct visual style:

### Common (Gray)
- **Color**: `#94a3b8` to `#64748b`
- **Glow**: Subtle gray
- **Border**: Thin, light gray
- **Style**: Simple, clean

### Uncommon (Green)
- **Color**: `#4ade80` to `#16a34a`
- **Glow**: Soft green
- **Border**: Green with slight glow
- **Style**: Slightly more detailed

### Rare (Blue)
- **Color**: `#60a5fa` to `#2563eb`
- **Glow**: Blue shimmer
- **Border**: Blue with glow effect
- **Style**: More intricate design

### Epic (Purple)
- **Color**: `#a78bfa` to `#7c3aed`
- **Glow**: Purple aura
- **Border**: Glowing purple
- **Style**: Complex, animated

### Legendary (Gold)
- **Color**: `#fbbf24` to `#ea580c`
- **Glow**: Golden radiance
- **Border**: Thick gold with particles
- **Style**: Highly detailed, particle effects

### Mythic (Pink/Purple)
- **Color**: `#f472b6` to `#9333ea`
- **Glow**: Rainbow shimmer
- **Border**: Animated gradient
- **Style**: Maximum detail, animated effects

## Asset Generation Methods

### Method 1: AI Generation (Recommended for Scale)

Use AI tools like:
- **Midjourney**: Best for detailed, artistic badges
- **DALL-E 3**: Good for consistent style
- **Stable Diffusion**: Free, customizable

**Prompt Template**:
```
A [TIER] achievement badge for [ACHIEVEMENT_NAME], 
flat design, [COLOR_SCHEME] gradient, 
[ICON_DESCRIPTION] in center, 
game UI style, clean edges, transparent background, 
professional game asset, 4K
```

**Example**:
```
A legendary achievement badge for "100-Day Streak", 
flat design, golden orange gradient, 
flame icon in center with particle effects, 
game UI style, clean edges, transparent background, 
professional game asset, 4K
```

### Method 2: Template-Based Generation

1. Create 6 base templates (one per tier)
2. Use Photoshop/Figma scripts to:
   - Swap center icons
   - Adjust colors programmatically
   - Export in batch

**Tools**:
- Figma Plugins: "Batch Styler", "Content Reel"
- Photoshop: Actions + Variables
- Python: PIL/Pillow for programmatic generation

### Method 3: Procedural Generation (Code)

```typescript
// Example using Canvas API
function generateBadge(achievement: Achievement): string {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  
  // Draw gradient background
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
  gradient.addColorStop(0, achievement.gradient.from)
  gradient.addColorStop(1, achievement.gradient.to)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)
  
  // Draw icon
  // ... icon rendering logic
  
  // Add tier-specific effects
  // ... effects logic
  
  return canvas.toDataURL()
}
```

## Optimization Strategy

### For MVP (First 100 Achievements)
1. Create 6 tier templates
2. Generate top 20 most common achievements manually
3. Use placeholders for others (tier-colored circles with icons)

### For Scale (500+ Achievements)
1. Set up AI generation pipeline
2. Batch generate by category
3. Implement lazy loading
4. Use CDN for asset delivery

### For Production (1000+ Achievements)
1. Procedural generation system
2. Asset versioning
3. Progressive image loading
4. WebP/AVIF formats for smaller sizes

## Asset Loading Strategy

```typescript
// Lazy load achievement images
function getAchievementImage(achievement: Achievement): string {
  // Try specific asset first
  const specificUrl = `/achievements/${achievement.category}/${achievement.id}.png`
  
  // Fallback to template with icon overlay
  const fallbackUrl = `/achievements/templates/${achievement.tier}-template.png`
  
  // Ultimate fallback: SVG icon with tier color
  return specificUrl // with error handling
}
```

## Icon System

Use Lucide React icons as base, then:
1. Export as SVG
2. Apply tier-specific colors
3. Add glow effects in CSS
4. Render on tier template

This allows **instant** achievement creation without waiting for assets.

## Implementation Priority

### Phase 1 (Week 1)
- [ ] Create 6 tier templates
- [ ] Generate 20 milestone badges
- [ ] Set up directory structure
- [ ] Implement fallback system

### Phase 2 (Week 2)
- [ ] Generate 50 most common achievements
- [ ] Set up AI generation workflow
- [ ] Implement lazy loading
- [ ] Add CDN integration

### Phase 3 (Month 1)
- [ ] Generate all category badges (200+)
- [ ] Create seasonal templates
- [ ] Add animated badges for legendary+
- [ ] Implement procedural generation

### Phase 4 (Ongoing)
- [ ] Generate on-demand for new achievements
- [ ] A/B test badge designs
- [ ] Community-designed badges
- [ ] Limited edition variants

## Cost Estimates

### AI Generation (Midjourney)
- $30/month = ~1000 images
- Cost per badge: ~$0.03

### Designer (Manual)
- $50/hour
- ~5 badges/hour
- Cost per badge: ~$10

### Recommendation
- Use AI for bulk generation
- Designer for legendary+ tier refinement
- Procedural for common tier

## Tools & Resources

### Design Tools
- **Figma**: Template creation
- **Photoshop**: Batch processing
- **Blender**: 3D badges (legendary+)

### AI Tools
- **Midjourney**: Best quality
- **DALL-E 3**: Consistent style
- **Stable Diffusion**: Free, local

### Code Tools
- **Sharp**: Image processing (Node.js)
- **Pillow**: Image generation (Python)
- **Canvas API**: Browser-based generation

### Asset Libraries
- **Game Icons**: Free SVG icons
- **Flaticon**: Premium icon packs
- **Noun Project**: Simple icons

## Next Steps

1. Review this guide with design team
2. Create tier templates
3. Set up asset pipeline
4. Generate first 100 badges
5. Implement in UI

---

**Questions?** Contact the design team or check `/docs/DESIGN-SYSTEM.md`


