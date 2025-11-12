# Neode Logo Usage Guide

## Logo File
**Primary Logo**: `/assets/img/logo-neode.png`
- Format: PNG with transparency
- Size: 454x454 pixels
- Type: Square icon/badge style

## Usage Throughout App

### 1. **Splash Screen**
- **Size**: Medium-large (300px max width)
- **Position**: Centered on screen
- **Timing**: Appears after alien intro and welcome message
- **Style**: Drop shadow for depth

```vue
<img 
  src="/assets/img/logo-neode.png" 
  class="w-[min(50vw,300px)] max-w-[80vw]"
/>
```

---

### 2. **Login Page**
- **Size**: 96px (24 in Tailwind = 96px)
- **Position**: **Half in, half out of glass card** (original design)
- **Style**: Absolute positioned at `-top-12` (48px up from card top)
- **Effect**: Logo appears to "float" above the card

```vue
<div class="glass-card p-8 pt-20 relative">
  <div class="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
    <img 
      src="/assets/img/logo-neode.png" 
      class="w-24 h-24"
    />
  </div>
</div>
```

**Visual Effect:**
```
        ┌─────┐
        │     │  ← Half of logo above card
     ╔══│═════│══╗
     ║  │     │  ║
     ║  └─────┘  ║  ← Half of logo inside card
     ║           ║
     ║  Content  ║
     ╚═══════════╝
```

---

### 3. **Onboarding Intro**
- **Size**: 128px (32 in Tailwind)
- **Position**: **Half in, half out of glass card**
- **Style**: Same floating effect as login

```vue
<div class="glass-card p-12 pt-20 relative">
  <div class="absolute -top-16 left-1/2 -translate-x-1/2">
    <img 
      src="/assets/img/logo-neode.png" 
      class="w-32 h-32"
    />
  </div>
</div>
```

---

### 4. **Onboarding Options**
- **Size**: 128px (32 in Tailwind)
- **Position**: Centered above heading (not in card)
- **Style**: Standard centered logo

```vue
<img 
  src="/assets/img/logo-neode.png" 
  class="w-32 h-32 mx-auto mb-8"
/>
```

---

### 5. **Dashboard Sidebar**
- **Size**: 64px (16 in Tailwind)
- **Position**: Top of sidebar, inline with server name
- **Style**: Compact for sidebar

```vue
<div class="flex items-center gap-3">
  <img src="/assets/img/logo-neode.png" class="w-16 h-16" />
  <div>
    <h2>Server Name</h2>
    <p>v0.0.0</p>
  </div>
</div>
```

---

### 6. **Browser Tab (Favicon)**
- **File**: Same logo used as favicon
- **Platforms**: Standard favicon + Apple touch icon

```html
<link rel="icon" type="image/png" href="/assets/img/logo-neode.png" />
<link rel="apple-touch-icon" href="/assets/img/logo-neode.png" />
```

---

## Size Reference

| Location | Tailwind Class | Actual Size | Purpose |
|----------|---------------|-------------|---------|
| Splash | `w-[min(50vw,300px)]` | Up to 300px | Large reveal |
| Onboarding Intro | `w-32 h-32` | 128px | Prominent |
| Onboarding Options | `w-32 h-32` | 128px | Header |
| Login | `w-24 h-24` | 96px | Floating |
| Sidebar | `w-16 h-16` | 64px | Compact |

---

## The "Half In, Half Out" Effect

This is the signature Neode design pattern for modals/cards:

### CSS Pattern:
```vue
<div class="glass-card pt-20 relative">  <!-- Extra top padding -->
  <div class="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
    <img src="/assets/img/logo-neode.png" class="w-24 h-24" />
  </div>
  <!-- Content -->
</div>
```

### Key Properties:
- **Parent card**: `relative` positioning, `pt-20` (extra top padding for logo space)
- **Logo container**: `absolute` positioning
- **Vertical**: `-top-12` (moves logo up by 48px, half of 96px logo height)
- **Horizontal**: `left-1/2 -translate-x-1/2` (perfect centering)
- **Z-index**: `z-10` (appears above card)

### Math:
- Logo height: 96px
- Pushed up: `-48px` (half the height)
- Result: **Top 48px outside card, bottom 48px inside card**

---

## Don't Use These (Deprecated)

❌ `/assets/img/logo-large.svg` - Old text-based logo  
❌ `/assets/img/icon.png` - Generic icon  
❌ `/assets/img/neode-logo.png` - Duplicate, use `logo-neode.png`

✅ **Always use**: `/assets/img/logo-neode.png`

---

## Design Philosophy

The logo represents:
- **Sovereignty**: Bold, centered presence
- **Elegance**: Clean design that works with glassmorphism
- **Trust**: Consistent across all touchpoints

The "floating" effect on cards creates visual hierarchy and draws attention to the brand while maintaining the clean, modern aesthetic.

---

## Responsive Behavior

### Mobile (< 768px):
- Logo sizes scale down proportionally
- Floating effect maintained
- Touch-friendly sizing

### Tablet (768px - 1024px):
- Standard sizes
- Full effects

### Desktop (> 1024px):
- Largest sizes for impact
- Maximum visual effect

---

**Remember**: The logo is your brand identity. Use it consistently! 🎨

