# Rackleblock Technologies - Project Knowledge

## Brand Identity

**Company Name:** Rackleblock Technologies  
**Philosophy:** "Consult-First" agency focusing on both high-end web development and simple low-code/automation solutions.

---

## Brand Colors

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Primary Navy | `#1A2B3C` | `210 40% 17%` | Primary brand color, headings, CTAs |
| Secondary Electric Teal | `#00D4FF` | `189 100% 50%` | Accents, highlights, interactive elements |
| Background Slate | `#F8FAFC` | `210 40% 98%` | Light mode background |

---

## Theme Configuration

### Dark Mode (Default)
- Background: Deep navy variants
- Text: Light slate/white
- Accents: Electric Teal for highlights

### Light Mode
- Background: Slate (`#F8FAFC`)
- Text: Navy variants
- Accents: Electric Teal for highlights

**Important:** Always use semantic CSS variables (e.g., `--background`, `--foreground`, `--primary`) so colors swap correctly between themes. Never hardcode hex values directly in components.

---

## Multilingual Structure

The app supports three languages using subdirectory routing:

| Language | Route Prefix | Primary |
|----------|--------------|---------|
| English | `/` (root) | ✅ Yes |
| German | `/de/` | No |
| Italian | `/it/` | No |

### Implementation Notes
- Use a language context/provider for i18n
- Store translations in JSON files per language
- URL structure: `/de/services`, `/it/about`, etc.
- Include language switcher in navigation

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React** | UI framework |
| **Tailwind CSS** | Styling with semantic tokens |
| **Lucide React** | Icon library |
| **Framer Motion** | Animations and transitions |
| **React Router** | Client-side routing with language prefixes |

---

## Services Offered

1. **High-End Web Development**
   - Custom React applications
   - Full-stack solutions
   - Enterprise-grade platforms

2. **Low-Code/Automation Solutions**
   - No-code tool implementations
   - Workflow automation
   - Integration services

3. **Consulting**
   - Technical strategy
   - Digital transformation
   - Technology audits

---

## Design Principles

1. **Professional & Modern** - Clean layouts with purposeful whitespace
2. **Dark-First** - Dark mode is the default experience
3. **Accessible** - WCAG 2.1 AA compliance
4. **Performant** - Optimized animations, lazy loading
5. **Responsive** - Mobile-first approach

---

## Animation Guidelines

Using Framer Motion for:
- Page transitions
- Scroll-triggered reveals
- Hover states on interactive elements
- Loading states

Keep animations subtle and purposeful - avoid excessive motion.

---

## Component Naming Conventions

- Use PascalCase for components
- Prefix page components with page context (e.g., `HomeHero`, `ServicesGrid`)
- Use descriptive names for sections (e.g., `TestimonialsCarousel`, `ContactForm`)

---

## File Structure (Recommended)

```
src/
├── components/
│   ├── layout/        # Header, Footer, Navigation
│   ├── sections/      # Page sections (Hero, Features, etc.)
│   ├── ui/            # Reusable UI components
│   └── shared/        # Cross-cutting components
├── pages/
│   ├── en/            # English pages
│   ├── de/            # German pages
│   └── it/            # Italian pages
├── i18n/
│   ├── en.json
│   ├── de.json
│   └── it.json
├── hooks/             # Custom React hooks
├── lib/               # Utilities
└── assets/            # Images, fonts
```
