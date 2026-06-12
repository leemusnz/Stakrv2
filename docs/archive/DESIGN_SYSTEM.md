# Stakr Design System

**Overall Aesthetic:** Premium glass morphism with athletic energy — clean SaaS meets Nike's boldness with Apple polish.

## Visual Style

### Glass Morphism HUD
- Frosted glass cards: `backdrop-blur-2xl`
- Semi-transparent backgrounds: `bg-white/80 dark:bg-black/40`
- Subtle borders: `border-slate-200 dark:border-white/10`
- Layered gradients for depth

### Background Treatment
- Grayscale fitness/athletic photography (30-50% desaturation)
- Multiple gradient overlays:
  - `from-white/80 via-white/70 to-white/80` (light)
  - `from-black/80 via-black/70 to-black/80` (dark)
- Noise texture overlay: 2-1.5% opacity for premium grain

### Ambient Glows
- Pulsing orange orbs in background
- Colors: `#F46036`, `#D74E25`
- Blur: 100-120px
- Opacity: 10-20% (light), 15-20% (dark)
- Animation: `animate-pulse` with staggered delays

## Color Palette

### Brand Colors
- **Primary Orange:** `#F46036`
- **Secondary Orange:** `#D74E25`
- **Brand Gradient:** `from-[#F46036] to-[#D74E25]`

### Neutrals
- **Light mode:** White, slate-50, slate-100, slate-200
- **Dark mode:** Black, #0A0A0A, #1A1A1A, #0F0F0F
- **Text:** slate-900 (light), white (dark)
- **Muted text:** slate-600 (light), slate-400 (dark)

### Semantic Colors
- **Success:** green-500/green-600
- **Error:** red-500/red-600
- **Warning:** yellow-500

## Interactive Patterns

### Card Hover Effects
```tsx
// Outer glow
<div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

// Shimmer sweep
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
```

### Input Field States
- **Base:** `bg-slate-100/50 dark:bg-white/5`
- **Border:** `border-slate-300 dark:border-white/10`
- **Focus:** `focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20`
- **Hover glow:** Orange gradient overlay at 10% opacity

### Button Transforms
- Primary CTA: `transform hover:scale-[1.02]`
- Shadow elevation: `shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40`
- Gradient: `from-[#F46036] to-[#D74E25]`
- Hover: `hover:from-[#ff724c] hover:to-[#e85a30]`

## Typography

### Font Stack
- **Heading:** Montserrat (weights: 400-800) — `font-heading`
- **Body:** Inter — `font-body`
- **Monospace:** JetBrains Mono — `font-mono`
- **Display alternatives:** Plus Jakarta Sans, Oswald, Outfit, Chakra Petch

### Hierarchy
- **Hero title:** `text-5xl font-heading font-bold`
- **Section title:** `text-3xl font-heading font-semibold`
- **Card title:** `text-xl font-heading font-semibold`
- **Labels:** `text-sm font-heading font-bold uppercase tracking-wider`
- **Body:** `text-base font-body`
- **Small text:** `text-sm font-body`

### Gradient Text
```tsx
<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">
  Stakr
</span>
```

## Layout Patterns

### Spacing
- Generous padding: `p-8` on cards
- Vertical rhythm: `space-y-6` for sections
- Input height: `h-14` for touch targets

### Container Structure
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F]">
  {/* Background layers */}
  {/* Ambient glows */}
  {/* Noise texture */}
  {/* Content */}
</div>
```

## Trust & Polish

### Trust Signals
- Lock icons with "Secure", "No spam" text
- Small, subtle placement (`text-xs text-slate-600`)
- Grouped with separators

### Loading States
- Spinning border: `animate-spin rounded-full border-b-2 border-white`
- Inline with button text
- Contextual messages: "Signing in...", "Loading..."

### Error/Success Messages
- Glass cards: `bg-red-500/10 border border-red-500/20 backdrop-blur-sm`
- Icons: AlertCircle (error), CheckCircle (success)
- Rounded: `rounded-xl`

## Component Standards

### Buttons
- **Primary CTA:** Orange gradient, h-14, bold heading font, shadow
- **Secondary:** Outline, glass background, subtle hover
- **Social:** White/glass bg, brand logo, subtle hover

### Form Inputs
- Height: `h-14`
- Icons: Left-aligned, `w-5 h-5`, slate-500
- Padding: `pl-12` (with icon), `pr-12` (with right action)
- Glass background with subtle border

### Cards
- Base: White/black glass with backdrop blur
- Border: Subtle white/10 or slate-200
- Shadow: xl/2xl
- Rounded: `rounded-2xl`
- Group hover effects

## Dark Mode Strategy
- True black backgrounds (`#0A0A0A`, `black`)
- Higher glow opacity (15-20%)
- White/10 borders
- Muted text: slate-400
- Maintain glass effect with `bg-black/40`

## Consistency Checklist
- [ ] Glass morphism backgrounds on all auth/marketing pages
- [ ] Brand orange gradient on all CTAs
- [ ] Pulsing ambient glows in backgrounds
- [ ] Noise texture overlay
- [ ] Consistent input heights (h-14)
- [ ] Uppercase bold labels
- [ ] Hover shimmer/glow effects
- [ ] Trust signals on conversion pages
- [ ] Dark mode variants for all components
