# Professional Frontend: Tech Specifications

Recommended implementation patterns for high-performance, professional web interfaces.

## 1. Core Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router) for SEO, performance, and modularity.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first, maintainable styling.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) or [GSAP](https://gsap.com/) for smooth scrolling and micro-interactions.
- **Icons**: [Lucide React](https://lucide.dev/) or custom SVG wireframes.

## 2. Implementation Patterns

### Typography (Tailwind Config)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Founders Grotesk', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.05em',
      },
      spacing: {
        'section': '120px',
      }
    },
  },
}
```

### Layout Components
- **Section Wrapper**: Always use a standard container with large vertical padding.
  ```jsx
  const Section = ({ children }) => (
    <section className="py-section px-6 md:px-12 max-w-7xl mx-auto">
      {children}
    </section>
  );
  ```
- **Hero**: Full-height viewport (`h-screen`) with centered content and smooth reveal animations.

### Animation Rules
- **Enter Transitions**: Use subtle `y: 20` and `opacity: 0` to `opacity: 1` transitions.
- **Hover States**: Prefer scaling or subtle color shifts over abrupt changes.
- **Scroll Effects**: Implement parallax on background images using Framer Motion's `useScroll`.

## 3. Performance & Quality
- **Images**: Use `next/image` with proper `priority` for heroes.
- **A11y**: Ensure 4.5:1 contrast ratios and full keyboard navigability for the overlay menu.
- **Modularity**: Components should be self-contained with clear Props interfaces.
