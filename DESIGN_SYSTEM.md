# InkMatching Design System

## Overview
A modern, consistent design system for InkMatching Web with a dark "ink" theme featuring gradient accents and glassmorphism effects.

---

## 🎨 Color Palette

### Background Colors
- `bg-ink-bg` - Main background (#05070d)
- `bg-ink-bg-soft` - Softer background (#090e16)
- `bg-ink-surface` - Card/panel surface (#101623)
- `bg-ink-surface-alt` - Alternative surface (#141c2d)

### Text Colors
- `text-ink-text` - Primary text (#d4d9e6)
- `text-ink-text-muted` - Secondary/muted text (#8d97ad)

### Accent Colors
- `text-ink-accent` / `bg-ink-accent` - Primary accent (#24d1f7)
- `text-ink-accent-strong` - Strong accent (#7c5cff)
- Gradient: `#24d1f7` → `#7c5cff`

---

## 🔘 Button Components

### Primary Button
**Usage**: Main call-to-action buttons
```tsx
<button className="btn-primary">
  Click Me
</button>
```
**Features**:
- Gradient background (#24d1f7 → #7c5cff)
- Glow effect on hover
- Smooth scale animation
- Auto-disabled state styling

### Secondary Button
**Usage**: Alternative actions, less emphasis
```tsx
<button className="btn-secondary">
  Cancel
</button>
```
**Features**:
- Glass morphism effect
- Border with accent hover
- Subtle background

### Danger Button
**Usage**: Delete, decline, or destructive actions
```tsx
<button className="btn-danger">
  Delete
</button>
```
**Features**:
- Red color scheme
- Warning visual cues

### Success Button
**Usage**: Confirm, accept actions
```tsx
<button className="btn-success">
  Accept
</button>
```
**Features**:
- Green color scheme
- Positive visual cues

### Ghost Button
**Usage**: Minimal emphasis actions
```tsx
<button className="btn-ghost">
  Skip
</button>
```
**Features**:
- No background
- Minimal styling
- Text-only appearance

---

## 🎯 Icon Buttons

### Primary Icon Button
```tsx
<button className="btn-icon-primary">
  <XMarkIcon className="w-5 h-5" />
</button>
```

### Secondary Icon Button
```tsx
<button className="btn-icon-secondary">
  <XMarkIcon className="w-5 h-5" />
</button>
```

**Features**:
- Square shape, rounded
- Perfect for close buttons
- Scale animation on hover

---

## 📏 Button Sizes

### Small
```tsx
<button className="btn-primary btn-sm">
  Small Button
</button>
```

### Default (Medium)
```tsx
<button className="btn-primary">
  Default Button
</button>
```

### Large
```tsx
<button className="btn-lg btn-primary">
  Large Button
</button>
```

---

## 📝 Form Components

### Input
```tsx
<input 
  type="text" 
  className="input" 
  placeholder="Enter text..."
/>
```

### Textarea
```tsx
<textarea 
  className="textarea" 
  placeholder="Enter message..."
/>
```

### Label
```tsx
<label className="label">
  Field Name
</label>
```

**Features**:
- Consistent border-radius (rounded-2xl)
- Glow focus states
- Glass morphism background
- Smooth transitions

---

## 🎴 Card Component

```tsx
<div className="card">
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</div>
```

**Features**:
- Glass morphism effect
- Double border effect
- Soft shadow
- Rounded corners (rounded-3xl)

---

## 🏷️ Utility Components

### Pill
```tsx
<span className="pill">
  Status Badge
</span>
```

### Chip
```tsx
<button className="chip">
  Filter Tag
</button>
```

### Section Title
```tsx
<h2 className="section-title">
  Section Name
</h2>
```

---

## 🌊 Effects & Animations

### Shadows
- `shadow-glow` - Strong glow effect
- `shadow-glow-soft` - Subtle glow effect
- `shadow-inner-glow` - Inner border glow

### Hover States
All interactive elements include:
- `hover:scale-[1.02]` - Slight scale up
- `active:scale-[0.98]` - Slight scale down when clicked
- `transition-all duration-200` - Smooth transitions

### Backdrop Effects
- `backdrop-blur-md` - Glass morphism blur
- `bg-white/5` - Semi-transparent white overlay

---

## 📐 Spacing & Layout

### Border Radius
- `rounded-2xl` (1rem) - Inputs, small cards
- `rounded-3xl` (1.75rem) - Large cards
- `rounded-4xl` (2.5rem) - Hero sections
- `rounded-full` - Buttons, pills, icons

### Gaps
- `gap-2` (0.5rem) - Tight spacing
- `gap-3` (0.75rem) - Default button gaps
- `gap-4` (1rem) - Card spacing
- `gap-6` (1.5rem) - Section spacing

---

## ✨ Best Practices

### DO ✅
- Use `btn-primary` for primary actions
- Use `btn-secondary` for cancel/alternative actions
- Always include icons with appropriate size (`w-5 h-5` for buttons)
- Use consistent spacing (gap-3 for button groups)
- Apply disabled states to buttons during loading
- Use `cursor-pointer` on clickable elements
- Include hover states on interactive elements

### DON'T ❌
- Don't mix button styles (e.g., `btn btn-primary` - just use `btn-primary`)
- Don't use inline styles when utility classes exist
- Don't forget disabled states for async actions
- Don't use inconsistent border-radius
- Don't skip transition animations
- Don't use arbitrary colors outside the ink palette

---

## 🎭 Component Examples

### Action Button Group
```tsx
<div className="flex gap-3">
  <button className="btn-primary">
    <CheckIcon className="w-5 h-5" />
    Confirm
  </button>
  <button className="btn-secondary">
    Cancel
  </button>
</div>
```

### Modal Header
```tsx
<div className="flex items-center justify-between p-6 border-b border-white/10">
  <h2 className="text-2xl font-bold flex items-center gap-3">
    <SparklesIcon className="w-7 h-7 text-ink-accent" />
    Modal Title
  </h2>
  <button className="btn-icon-secondary">
    <XMarkIcon className="w-5 h-5" />
  </button>
</div>
```

### Search Input
```tsx
<div className="relative">
  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-text-muted" />
  <input
    type="text"
    className="input pl-12"
    placeholder="Search..."
  />
</div>
```

### Loading State
```tsx
<div className="flex items-center justify-center gap-3 py-6">
  <div className="w-6 h-6 border-2 border-ink-accent border-t-transparent rounded-full animate-spin" />
  <span className="text-ink-text-muted">Loading...</span>
</div>
```

### Empty State
```tsx
<div className="card p-12 text-center space-y-6">
  <div className="text-ink-text text-lg font-medium">
    No items yet
  </div>
  <p className="text-ink-text-muted text-sm max-w-md mx-auto">
    Get started by creating your first item
  </p>
  <div className="flex justify-center gap-4 pt-4">
    <button className="btn-primary">
      Create New
    </button>
  </div>
</div>
```

---

## 🚀 Implementation Notes

### Tailwind Configuration
All ink colors are defined in `tailwind.config.ts`:
```typescript
colors: {
  ink: {
    bg: '#05070d',
    accent: '#24d1f7',
    // ... etc
  }
}
```

### Global Styles
Component classes are defined in `app/globals.css` using Tailwind's `@layer components` directive.

### Icons
We use `@heroicons/react/24/outline` for consistent iconography:
```tsx
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
```

---

## 📱 Responsive Design

All components are mobile-first and responsive:
- Buttons maintain consistent sizing
- Modals adapt to screen size
- Grid layouts use responsive columns
- Touch targets meet accessibility standards (min 44px)

---

## ♿ Accessibility

All components include:
- Proper focus states (`focus-visible:ring-2`)
- Disabled states for buttons
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Sufficient color contrast

---

## 🎨 Customization

To modify the design system:
1. Update colors in `tailwind.config.ts`
2. Modify component styles in `app/globals.css`
3. Test across all pages for consistency
4. Update this documentation

---

**Version**: 1.0  
**Last Updated**: October 20, 2025  
**Maintained by**: InkMatching Team
