# Design System Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `movrr-app` visual language to inherit `movrr-website-new` brand tokens, Manrope typography, hybrid forest/signal greens, quiet surfaces, and product-density motion — without changing business logic.

**Architecture:** Token-first cascade. Port marketing `--movrr-*` OKLCH tokens into `app/globals.css`, remap shadcn semantic CSS variables to the hybrid product model (deep forest = brand chrome, signal green = `--primary` CTAs), swap Inter→Manrope, delete glass/dead marketing utilities, then restyle primitives → shell → product components → screens. Presentational classes only.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4 (`@theme inline`), shadcn/ui (radix-vega), framer-motion, next-themes, recharts, sonner, lucide-react.

**Spec:** `docs/superpowers/specs/2026-07-28-design-system-alignment-design.md`

## Global Constraints

- Marketing site (`movrr-website-new`) is canonical brand source of truth — inherit language, not layouts
- Hybrid colour mapping: deep forest for brand chrome; signal green (`oklch(0.7123 0.1953 149.53)`) as `--primary` for CTAs/active/focus; muted neutrals elsewhere
- Keep full dark mode; rebuild on MOVRR ink/forest (not cool blue-gray `… 240` neutrals)
- Manrope for sans/display; JetBrains Mono for mono only
- Quiet surfaces: no glassmorphism as default product chrome
- Do NOT change auth flows, routing, APIs, analytics, TanStack Query, Supabase, role gates, or form validation logic
- Do NOT touch `movrr-mobile` or extract a shared npm package in this pass
- Product density: page titles `text-2xl md:text-3xl font-semibold`, not marketing clamp heroes
- Verify with `npm run typecheck`, `npm run lint`, `npm run build`, and banned-pattern greps (no test runner in package.json — do not add one)

---

## File structure (units of change)

| File / area | Responsibility |
|-------------|----------------|
| `app/globals.css` | All design tokens, `@theme inline`, base typography, quiet utilities, reduced-motion |
| `app/layout.tsx` | Load Manrope + JetBrains Mono; apply font CSS variables on `<html>` |
| `components/ui/*` | Token-aligned primitives (button, card, badge, input, …) |
| `components/layout/*` | Sidebar, Navbar, Footer, Breadcrumb brand chrome |
| `components/shared/*` | PageShell, PageHeader, EmptyState, RouteError, RouteLoading |
| `components/stats/StatsCard.tsx` | Quiet stats; semantic trend colours; no rainbow hardcodes |
| `components/auth/*` + `app/auth/*` | Deep-forest brand panel + quiet form canvas |
| `app/dashboard/**` pages | Replace `gradient-bg` / `glass-card` / hardcodes with semantic classes |
| `components/advertiser/PerformanceChart.tsx` | Chart series from remapped chart tokens |

---

### Task 1: Foundation — fonts + Manrope wiring

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css` (`@theme inline` font lines)

**Interfaces:**
- Produces: `--font-manrope` on `<html>`; `@theme` `--font-sans` / `--font-display` resolve to `var(--font-manrope)`; `--font-mono` to `var(--font-jetbrains-mono)`

- [ ] **Step 1: Swap Inter for Manrope in root layout**

In `app/layout.tsx`, replace Inter import/usage with:

```tsx
import { Manrope, JetBrains_Mono } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});
```

Apply on `<html>`:

```tsx
className={`${manrope.variable} ${jetbrainsMono.variable} antialiased scroll-smooth`}
```

- [ ] **Step 2: Wire `@theme` fonts to CSS variables**

In `app/globals.css` `@theme inline`, replace string literal fonts with:

```css
--font-sans: var(--font-manrope), "Manrope Fallback", system-ui, sans-serif;
--font-display: var(--font-manrope), "Manrope Fallback", system-ui, sans-serif;
--font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
```

- [ ] **Step 3: Verify fonts compile**

Run: `npm run typecheck`  
Expected: PASS

Run: `rg -n "Inter" app/layout.tsx app/globals.css`  
Expected: no matches

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat(design): adopt Manrope as product sans/display face"
```

---

### Task 2: Foundation — port `--movrr-*` tokens + hybrid semantic remap

**Files:**
- Modify: `app/globals.css`
- Reference (read-only): `C:\Users\ghyor\OneDrive\Desktop\Projects\movrr-website-new\app\globals.css`

**Interfaces:**
- Produces: Full `--movrr-*` brand layer in `:root`; hybrid shadcn remaps light+dark; `@theme` `--color-movrr-*` utilities; product heading scale; `prefers-reduced-motion` block; no glass/gradient utilities; `@utility page-canvas`

- [ ] **Step 1: Copy marketing brand tokens into `:root`**

At the top of `:root` in `app/globals.css`, insert the exact OKLCH values from marketing for core greens/neutrals, text semantic, backgrounds, borders, and status tokens. Copy verbatim from website `:root` brand block (approx lines 7–54). Do not invent new OKLCH values.

- [ ] **Step 2: Remap light shadcn semantics (hybrid)**

Replace current light `:root` shadcn tokens with:

```css
--background: var(--movrr-bg-canvas);
--foreground: var(--movrr-text-heading);
--card: var(--movrr-bg-elevated);
--card-foreground: var(--movrr-text-heading);
--popover: var(--movrr-bg-surface);
--popover-foreground: var(--movrr-text-heading);
--primary: var(--movrr-green-text); /* signal green CTAs */
--primary-foreground: var(--movrr-white);
--secondary: var(--movrr-bg-soft);
--secondary-foreground: var(--movrr-green);
--muted: var(--movrr-bg-soft);
--muted-foreground: var(--movrr-text-secondary);
--accent: color-mix(in oklab, var(--movrr-success) 12%, var(--movrr-bg-soft));
--accent-foreground: var(--movrr-text-brand);
--destructive: var(--movrr-error);
--destructive-foreground: var(--movrr-white);
--success: var(--movrr-success);
--success-foreground: var(--movrr-white);
--warning: var(--movrr-warning);
--warning-foreground: var(--movrr-green-ink);
--info: var(--movrr-green-light);
--info-foreground: var(--movrr-white);
--border: var(--movrr-border-soft);
--input: var(--movrr-border-soft);
--ring: var(--movrr-green-light);
--chart-1: var(--movrr-success);
--chart-2: var(--movrr-green);
--chart-3: var(--movrr-accent);
--chart-4: var(--movrr-warning);
--chart-5: var(--movrr-gray);
--radius: 0.75rem;
--sidebar: var(--movrr-bg-elevated);
--sidebar-foreground: var(--movrr-text-heading);
--sidebar-primary: var(--movrr-green-text);
--sidebar-primary-foreground: var(--movrr-white);
--sidebar-accent: var(--movrr-bg-soft);
--sidebar-accent-foreground: var(--movrr-text-brand);
--sidebar-border: var(--movrr-border-soft);
--sidebar-ring: var(--movrr-green-light);
```

Remove: `--accent-alt*`, `--glass-*`, `--gradient-*` from `:root`. Keep `color-scheme: light`.

- [ ] **Step 3: Remap `.dark` to ink/forest**

```css
.dark {
  --background: var(--movrr-bg-ink);
  --foreground: var(--movrr-text-inverse);
  --card: var(--movrr-bg-card-dark);
  --card-foreground: var(--movrr-text-inverse);
  --popover: var(--movrr-bg-tertiary);
  --popover-foreground: var(--movrr-text-inverse);
  --primary: var(--movrr-accent);
  --primary-foreground: var(--movrr-green-dark);
  --secondary: var(--movrr-bg-tertiary);
  --secondary-foreground: var(--movrr-text-inverse);
  --muted: var(--movrr-bg-tertiary);
  --muted-foreground: color-mix(in oklab, var(--movrr-text-inverse) 65%, transparent);
  --accent: color-mix(in oklab, var(--movrr-success) 18%, var(--movrr-bg-card-dark));
  --accent-foreground: var(--movrr-text-inverse);
  --destructive: oklch(0.65 0.22 27);
  --destructive-foreground: var(--movrr-white);
  --success: var(--movrr-success-soft);
  --success-foreground: var(--movrr-green-ink);
  --warning: var(--movrr-warning);
  --warning-foreground: var(--movrr-green-ink);
  --info: var(--movrr-green-light);
  --info-foreground: var(--movrr-white);
  --border: color-mix(in oklab, var(--movrr-text-inverse) 12%, transparent);
  --input: color-mix(in oklab, var(--movrr-text-inverse) 12%, transparent);
  --ring: var(--movrr-accent);
  --chart-1: var(--movrr-success-soft);
  --chart-2: var(--movrr-accent);
  --chart-3: var(--movrr-green-light);
  --chart-4: var(--movrr-warning);
  --chart-5: var(--movrr-gray);
  --sidebar: var(--movrr-bg-card-dark);
  --sidebar-foreground: var(--movrr-text-inverse);
  --sidebar-primary: var(--movrr-accent);
  --sidebar-primary-foreground: var(--movrr-green-dark);
  --sidebar-accent: var(--movrr-bg-tertiary);
  --sidebar-accent-foreground: var(--movrr-text-inverse);
  --sidebar-border: color-mix(in oklab, var(--movrr-text-inverse) 12%, transparent);
  --sidebar-ring: var(--movrr-accent);
  color-scheme: dark;
}
```

- [ ] **Step 4: Extend `@theme inline` with `--color-movrr-*`**

Copy the MOVRR custom colour mappings from website `@theme inline` (website approx lines 179–225) into app `@theme inline`. Keep existing semantic `--color-*` mappings. Remove `--color-accent-alt*` if tokens removed.

- [ ] **Step 5: Replace base typography + add reduced-motion**

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    text-rendering: optimizeLegibility;
    font-feature-settings: "liga" 1, "kern" 1, "ss01" 1;
  }
  h1, h2, h3, h4 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
  }
  h1 {
    @apply text-2xl md:text-3xl font-semibold tracking-tight text-balance;
  }
  h2 {
    @apply text-xl md:text-2xl font-semibold tracking-tight text-balance;
  }
  h3 {
    @apply text-base md:text-lg font-semibold tracking-tight text-balance;
  }
  p {
    @apply text-sm md:text-base leading-relaxed text-pretty;
  }
  ::selection {
    background: var(--movrr-success-soft);
    color: var(--movrr-green-dark);
  }
  .container {
    @apply max-w-[1400px]! mx-auto px-4 sm:px-6 lg:px-8;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Delete glass, gradient, and dead marketing utilities; add page-canvas**

Remove from `app/globals.css`:

- Entire marketing `@layer components` block (`.cta-primary`, `.hero-section`, `.testimonial-card`, etc.) — optionally keep `.touch-target` under utilities
- `.glass-card`, `.gradient-bg`

Add:

```css
@utility page-canvas {
  @apply min-h-screen bg-background px-4 sm:px-6 py-6 md:py-8 lg:pt-6;
}
```

Retune remaining motion keyframes to `cubic-bezier(0.22, 1, 0.36, 1)` and shorter travel (`translateY(12px)`).

- [ ] **Step 7: Verify token surface**

Run: `rg -n "glass-card|gradient-bg|23b245|accent-alt|glass-bg" app/globals.css`  
Expected: no matches

Run: `rg -n "--movrr-green:" app/globals.css`  
Expected: match present

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add app/globals.css
git commit -m "feat(design): port movrr tokens and hybrid semantic remaps"
```

---

### Task 3: Primitives — badge, card, input, checkbox token cleanup

**Files:**
- Modify: `components/ui/badge.tsx`
- Modify: `components/ui/card.tsx`
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/textarea.tsx`
- Modify: `components/ui/checkbox.tsx`
- Modify: `components/ui/alert.tsx` (if hardcoded colours)
- Modify: `components/ui/skeleton.tsx`

**Interfaces:**
- Consumes: `--primary`, `--success`, `--destructive`, `--border`, `--ring`
- Produces: badge `success` variant using success tokens (not emerald Tailwind)

- [ ] **Step 1: Fix Badge success variant**

In `components/ui/badge.tsx`:

```tsx
success:
  "bg-success/12 text-success border-success/20 dark:bg-success/18 dark:text-success dark:border-success/25",
```

- [ ] **Step 2: Quiet Card defaults**

Ensure `components/ui/card.tsx` uses `rounded-xl border border-border bg-card text-card-foreground` with no heavy shadow / glass. Prefer `shadow-none` or `shadow-xs` at most.

- [ ] **Step 3: Inputs / textarea / checkbox**

- Input/Textarea: `rounded-xl border-border bg-background focus-visible:ring-ring`
- Checkbox: prefer radius from scale; no ad-hoc colours

- [ ] **Step 4: Verify**

Run: `rg -n "emerald-|blue-|purple-|gray-" components/ui`  
Expected: no palette hardcodes

Run: `npm run typecheck`

- [ ] **Step 5: Commit**

```bash
git add components/ui
git commit -m "refactor(ui): align primitives to semantic movrr tokens"
```

---

### Task 4: Shell — Sidebar, Navbar, Footer, PageHeader, PageShell

**Files:**
- Modify: `components/layout/Sidebar.tsx`
- Modify: `components/layout/Navbar.tsx`
- Modify: `components/layout/Footer.tsx`
- Modify: `components/layout/Breadcrumb.tsx` (if needed)
- Modify: `components/shared/PageHeader.tsx`
- Modify: `components/shared/PageShell.tsx`
- Modify: `components/ThemeToggle.tsx` (if needed)

**Interfaces:**
- Consumes: `bg-movrr-bg-primary` for brand mark well; `bg-primary` for active nav
- Produces: quiet product footer (no social theatre / heart line)

- [ ] **Step 1: Sidebar brand chrome + semantic logout**

In `components/layout/Sidebar.tsx`:

1. Logo well → `bg-movrr-bg-primary rounded-[10px]`
2. Wordmark → `text-sm font-semibold tracking-[-0.03em]` (keep brand clarity)
3. Active nav → `bg-primary text-primary-foreground`
4. Logout → `text-destructive hover:text-destructive hover:bg-destructive/10`
5. Replace `hover:text-black` → `hover:text-foreground`
6. Framer easing → `[0.22, 1, 0.36, 1]`, durations ≤0.3s

- [ ] **Step 2: Navbar quiet chrome**

Hairline `border-b border-border`, no glass/blur. Token-only user chip / theme toggle.

- [ ] **Step 3: Slim Footer**

```tsx
<footer className="border-t border-border bg-background px-6 py-4">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
    <span>© {currentYear} Movrr Media</span>
    <span>Product workspace</span>
  </div>
</footer>
```

Remove Heart, social links, `gradient-bg`, marketing badges.

- [ ] **Step 4: PageHeader + PageShell**

- PageHeader title: `text-2xl md:text-3xl font-semibold tracking-tight`
- PageShell main: ensure children sit on `bg-background`

- [ ] **Step 5: Verify**

Run: `rg -n "text-red-|hover:text-black|Made with|gradient-bg|glass-card" components/layout components/shared components/ThemeToggle.tsx`  
Expected: no matches

Run: `npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add components/layout components/shared/PageHeader.tsx components/shared/PageShell.tsx components/ThemeToggle.tsx
git commit -m "refactor(shell): quiet product chrome with movrr brand accents"
```

---

### Task 5: Product components — StatsCard, empties, charts, forms

**Files:**
- Modify: `components/stats/StatsCard.tsx`
- Modify: `components/shared/EmptyState.tsx`
- Modify: `components/shared/RouteError.tsx`
- Modify: `components/shared/RouteLoading.tsx`
- Modify: `components/skeleton/SectionSkeleton.tsx`
- Modify: `components/advertiser/PerformanceChart.tsx`
- Modify: `components/advertiser/CampaignList.tsx`
- Modify: `components/rider/Overview.tsx`
- Modify: `components/auth/SigninForm.tsx`
- Modify: `components/form/*` (if needed)

**Interfaces:**
- StatsCard accents: `primary | success | warning | destructive | muted` only

- [ ] **Step 1: Rewrite StatsCard colour maps**

```tsx
const iconColorClasses = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
} as const;

const iconBgClasses = {
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/15",
  destructive: "bg-destructive/10",
  muted: "bg-muted",
} as const;
```

Update prop types. Default icon well: `rounded-[14px]` + `bg-primary/10 text-primary`.

Default card surface:

```tsx
: "border border-border bg-card",
```

Trend:

```tsx
trend.type === "increase" ? "text-success" : "text-destructive"
```

- [ ] **Step 2: Empty / error / loading**

Replace `gradient-bg` + `glass-card` with `page-canvas` + `Card className="border-border"`.

- [ ] **Step 3: CampaignList + Overview**

Replace `glass-card` with `border-border`.

- [ ] **Step 4: PerformanceChart**

Series colours from `var(--chart-1)` … `var(--chart-5)` only.

- [ ] **Step 5: SigninForm**

Replace gray hover hardcodes with `hover:bg-muted`.

- [ ] **Step 6: Verify**

```bash
rg -n "glass-card|gradient-bg|emerald-|text-blue-|bg-purple-|text-red-|bg-gray-" components
```

Expected: no matches

Run: `npm run typecheck`

- [ ] **Step 7: Commit**

```bash
git add components
git commit -m "refactor(components): remove glass and palette hardcodes"
```

---

### Task 6: Auth surfaces

**Files:**
- Modify: `app/auth/layout.tsx`
- Modify: `app/auth/signin/page.tsx` (if needed)
- Modify: `app/auth/reset-password/page.tsx`
- Modify: `app/unauthorized/page.tsx`
- Modify: `app/not-found.tsx`

**Interfaces:**
- Auth left panel uses `bg-movrr-bg-primary` (deep forest), not bright primary gradient

- [ ] **Step 1: Auth layout brand panel**

Change left panel from `bg-gradient-to-br from-primary to-primary/80 text-white` to:

```tsx
bg-movrr-bg-primary text-movrr-text-inverse
```

Icon wells: `bg-movrr-text-inverse/10`.  
Right panel: `bg-background` or `bg-movrr-bg-soft`.  
Motion: `ease: [0.22, 1, 0.36, 1]`, duration `0.45`.

- [ ] **Step 2: Reset / unauthorized / not-found**

Replace `gradient-bg` + `glass-card` with `bg-background` + `Card className="border-border shadow-sm"`.

- [ ] **Step 3: Verify**

```bash
rg -n "gradient-bg|glass-card" app/auth app/unauthorized.tsx app/not-found.tsx
```

Expected: no matches

Run: `npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add app/auth app/unauthorized.tsx app/not-found.tsx
git commit -m "refactor(auth): deep-forest brand panel and quiet canvases"
```

---

### Task 7: Dashboard screen sweep

**Files:**
- Modify:
  - `app/dashboard/page.tsx`
  - `app/dashboard/campaigns/page.tsx`
  - `app/dashboard/campaigns/[id]/page.tsx`
  - `app/dashboard/routes/page.tsx`
  - `app/dashboard/routes/[id]/page.tsx`
  - `app/dashboard/rewards/page.tsx`
  - `app/dashboard/notifications/page.tsx`
  - `app/dashboard/analytics/page.tsx`
  - `app/dashboard/billing/page.tsx`
  - `app/dashboard/settings/page.tsx`

**Interfaces:**
- Consumes: `page-canvas` utility
- No logic/data-fetching changes

- [ ] **Step 1: Replace presentational shells file-by-file**

1. Outer wrapper → `page-canvas`
2. `glass-card` → `border-border` (drop glass)
3. Keep JSX structure, conditionals, and data props unchanged

- [ ] **Step 2: Repo-wide banned pattern check**

```bash
rg -n "glass-card|gradient-bg" app components
rg -n "emerald-|text-blue-600|bg-purple-|text-red-600|hover:text-black|bg-gray-200" app components
rg -n "#23b245|Inter" app components
```

Expected: zero matches

- [ ] **Step 3: Typecheck + lint + build**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add app/dashboard
git commit -m "refactor(dashboard): apply quiet page-canvas and tokenized cards"
```

---

### Task 8: Polish, a11y, cohesion verification

**Files:**
- Touch only if gaps found

- [ ] **Step 1: Manual smoke checklist (`npm run dev`)**

1. Light: sign-in → overview → rewards → settings  
2. Dark toggle: sidebar, cards, CTAs readable  
3. Keyboard tab: visible focus rings  
4. Reduced motion OS setting: no long animations  
5. Mobile &lt;1024: sidebar drawer + touch targets  

- [ ] **Step 2: Cohesion gate**

If website → app still feels like two products, fix top offenders (auth panel, sidebar logo well, leftover glass). Stop only when it feels like **one product**.

- [ ] **Step 3: Final automated gate**

```bash
rg -n "glass-card|gradient-bg|emerald-|text-blue-600|bg-purple-|#23b245" app components
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 4: Commit polish if needed**

```bash
git add -A
git commit -m "polish(design): final cohesion and a11y pass"
```

Skip empty commit if clean.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Port `--movrr-*` | Task 2 |
| Hybrid primary mapping | Task 2 |
| Dark ink/forest | Task 2 |
| Manrope | Task 1 |
| Quiet surfaces / no glass | Tasks 2, 5, 6, 7 |
| Primitives token-only | Task 3 |
| Shell brand chrome | Task 4 |
| StatsCard / charts | Task 5 |
| Auth deep forest | Task 6 |
| Dashboard sweep | Task 7 |
| A11y / reduced motion / verify | Tasks 2, 8 |
| No logic regressions | Global constraint + Task 7 |

---

## Execution notes

- Prefer ripgrep + typecheck/lint/build over inventing a test harness
- Never edit `app/actions/*`, `app/api/*`, or Supabase clients for this plan
- Do not redesign layouts — presentational class migration only
- Website token source: `C:\Users\ghyor\OneDrive\Desktop\Projects\movrr-website-new\app\globals.css`
