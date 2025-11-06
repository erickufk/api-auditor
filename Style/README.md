# Pointer AI Design System Transfer Package

This package contains everything you need to implement the Pointer AI landing page design in your own project.

## 📦 What's Included

1. **design-system.css** - Complete color system and base styles
2. **animated-background.tsx** - Reusable grid background component
3. **animated-section.tsx** - Scroll-triggered animation wrapper

## 🚀 Installation Steps

### Step 1: Install Dependencies

\`\`\`bash
npm install framer-motion
# or
pnpm add framer-motion
\`\`\`

### Step 2: Add Design System CSS

Copy the contents of `design-system.css` into your `app/globals.css` file (or create a new CSS file and import it).

### Step 3: Update Tailwind Config

Make sure your `tailwind.config.ts` includes these color variables:

\`\`\`typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(var(--primary-dark))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
      },
    },
  },
}
\`\`\`

### Step 4: Add Components

Copy `animated-background.tsx` and `animated-section.tsx` into your `components/` folder.

## 💡 Usage Examples

### Basic Background

\`\`\`tsx
import { AnimatedBackground } from "@/components/animated-background"

export default function Page() {
  return (
    <AnimatedBackground className="min-h-screen rounded-2xl">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-6xl font-semibold">Your Content</h1>
      </div>
    </AnimatedBackground>
  )
}
\`\`\`

### With Animations

\`\`\`tsx
import { AnimatedBackground } from "@/components/animated-background"
import { AnimatedSection } from "@/components/animated-section"

export default function Page() {
  return (
    <AnimatedBackground className="min-h-screen rounded-2xl">
      <AnimatedSection delay={0}>
        <h1>Fades in first</h1>
      </AnimatedSection>
      
      <AnimatedSection delay={0.2}>
        <p>Fades in 0.2s later</p>
      </AnimatedSection>
    </AnimatedBackground>
  )
}
\`\`\`

### Without Gradient Blurs (Simpler)

\`\`\`tsx
<AnimatedBackground showGradients={false}>
  <YourContent />
</AnimatedBackground>
\`\`\`

## 🎨 Key Design Tokens

### Colors
- **Primary**: `hsl(165 96% 71%)` - Teal accent (#78fcd6)
- **Background**: `hsl(210 11% 7%)` - Dark background (#0f1211)
- **Foreground**: `hsl(160 14% 93%)` - Light text (#e7eceb)

### Typography
- **Headings**: 36px-72px, font-weight: 600
- **Body**: 16px-20px, font-weight: 400-500
- **Line Height**: 1.5-1.6 (use `leading-relaxed`)

### Spacing
- **Container Max Width**: 1320px
- **Grid Gap**: 24px
- **Border Radius**: 16px (cards), 9999px (buttons)

### Animations
- **Duration**: 0.8s
- **Easing**: cubic-bezier(0.33, 1, 0.68, 1)
- **Scroll Trigger**: Once (doesn't repeat)

## 🎯 Pro Tips

1. **Glassmorphism Cards**: Use the `.glass-card` utility class for consistent card styling
2. **Grid Background**: The grid is 36px spacing with dashed strokes
3. **Responsive**: Background scales automatically with `preserveAspectRatio="xMidYMid slice"`
4. **Performance**: Animations use `viewport={{ once: true }}` to prevent re-triggering

## 🔧 Customization

### Change Primary Color
Edit the `--primary` variable in `design-system.css`:
\`\`\`css
--primary: 165 96% 71%; /* Change these HSL values */
\`\`\`

### Adjust Grid Density
In `animated-background.tsx`, change the array sizes:
\`\`\`tsx
{[...Array(35)].map(...)} // 35 columns
{[...Array(22)].map(...)} // 22 rows
\`\`\`

### Modify Animation Speed
In `animated-section.tsx`, adjust the duration:
\`\`\`tsx
transition={{ duration: 0.8 }} // Change to 0.5, 1.0, etc.
\`\`\`

## 📝 Notes

- The background component is fully responsive
- All colors use HSL format for easy theming
- Animations are GPU-accelerated via Framer Motion
- Grid pattern uses SVG for crisp rendering at any size

## 🆘 Troubleshooting

**Colors not showing?**
- Make sure you've copied the CSS variables to your globals.css
- Check that Tailwind config includes the color extensions

**Animations not working?**
- Verify framer-motion is installed
- Ensure components are marked with "use client"

**Background not visible?**
- Check that parent container has defined height
- Verify z-index layering (background should be z-0, content z-10)
