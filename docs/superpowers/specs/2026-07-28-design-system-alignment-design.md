# Design System Alignment — movrr-app ↔ movrr-website-new

**Date:** 2026-07-28  
**Status:** Approved for planning  
**Scope:** Visual / design-language migration of `movrr-app` to inherit the canonical brand language of `movrr-website-new`  
**Type:** Design language migration (not a redesign, not visual cloning)

---

## 1. Intent

A user moving between `movrr-website-new` and `movrr-app` must feel they remain inside one product ecosystem.

The marketing site is the **canonical brand expression**. The authenticated app is the **productivity continuation** of that brand: same visual language, design tokens, typography, motion principles, and premium restraint — applied at dashboard density, not storytelling layout.

### Decisions locked

| Decision | Choice |
|----------|--------|
| Colour mapping | **Hybrid (C):** deep forest for brand chrome; bright signal green for CTAs/actions; muted neutrals elsewhere |
| Dark mode | **Keep (A):** full light/dark/system; dark rebuilt on MOVRR ink/forest surfaces |
| Typography | **Manrope everywhere (A):** JetBrains Mono retained for IDs, codes, dense data |
| Surfaces | **Quiet (A):** drop glassmorphism; hairline borders; subtle elevation only where interactive |
| Approach | **Token-first cascade:** port `--movrr-*`, remap shadcn semantics, then sweep components/screens |

---

## 2. Canonical language (source of truth)

Source: `movrr-website-new/app/globals.css`, Manrope via `next/font`, lucide + custom brand icons, framer-motion easing `[0.22, 1, 0.36, 1]`.

### Brand philosophy (inherit)

1. Forest-green authority — near-black greens with one vivid signal green  
2. One face (Manrope), hierarchy via weight + opacity + tracking  
3. Restraint over chrome — hairline borders and opacity, not heavy shadows or glass  
4. Motion as polish — shared easing, reduced-motion respected  
5. Dual-surface storytelling adapted to product: soft canvas + deep brand accents, not full-bleed photo heroes

### What not to inherit

- Marketing section rhythm (`py-32`, clamp hero type)  
- Full-bleed photography as primary product chrome  
- `movrr-card` marketing radius (`1.75rem`) as default dashboard card  
- Editorial whitespace that hurts ops density  
- Marketing footer / social theatre inside the product shell

---

## 3. Token architecture

### 3.1 Port `--movrr-*` brand layer

Copy the marketing brand token set into `movrr-app/app/globals.css` (same OKLCH values), including at minimum:

- Core: `--movrr-green`, `--movrr-green-light`, `--movrr-green-dark`, `--movrr-green-ink`, `--movrr-green-text`, `--movrr-accent`, neutrals  
- Text: `--movrr-text-primary`, `--movrr-text-secondary`, `--movrr-text-inverse`, `--movrr-text-heading`, `--movrr-text-brand`  
- Surfaces: `--movrr-bg-*` (primary, secondary, tertiary, ink, canvas, soft, muted, card-dark, elevated, panel, …)  
- Borders: `--movrr-border-soft`, `--movrr-border-muted`, `--movrr-border-strong`  
- Semantic: `--movrr-success*`, `--movrr-warning`, `--movrr-error`

Expose needed tokens via `@theme inline` so Tailwind utilities (`bg-movrr-*`, `text-movrr-*`, `border-movrr-*`) work in the app.

### 3.2 Hybrid shadcn semantic remapping (product)

**Light mode**

| Token | Maps to | Rationale |
|-------|---------|-----------|
| `--background` | canvas / white | Quiet product canvas |
| `--foreground` | heading / near-black | Readable body |
| `--card` | elevated / soft white | Quiet cards |
| `--primary` | **signal green** (`--movrr-green-text` / success ≈ `#10c259`) | Interactive CTAs & key actions |
| `--primary-foreground` | white / inverse | Contrast on CTAs |
| `--secondary` | soft / off-white | Secondary fills |
| `--secondary-foreground` | deep forest (`--movrr-green`) | Brand text on secondary |
| `--accent` | soft signal tint (light: pale green wash; not violet/orange) | Subtle highlights / selected rows |
| `--muted` / `--muted-foreground` | soft / gray | Low emphasis |
| `--destructive` | `--movrr-error` | Errors |
| `--success` | `--movrr-success` | Progress / rewards |
| `--warning` | `--movrr-warning` | Warnings |
| `--ring` | `--movrr-green-light` (dark: signal green) | Focus rings |
| `--border` / `--input` | `--movrr-border-soft` | Hairlines |
| `--sidebar` | soft elevated (`--movrr-bg-elevated` / soft) | Quiet nav rail |
| `--sidebar-primary` | signal green (same family as `--primary`) | Active nav item |
| Charts | greens + restrained neutrals/amber | Kill rainbow SaaS palette |

**Brand chrome** (not `--primary`): sidebar wordmark well, auth left panel, and deep brand text use `--movrr-bg-primary` / `--movrr-green` / `--movrr-text-brand` directly. Interactive fills and CTAs use `--primary` (signal green).

**Dark mode**

Rebuild on marketing ink surfaces:

- `--background` → `--movrr-bg-ink` / near-ink  
- `--card` → `--movrr-bg-card-dark` / tertiary  
- `--primary` → bright signal / accent (readable CTAs on dark)  
- Borders → low-opacity inverse / muted green-gray  
- Remove cool blue-gray hue drift (`… 240` neutrals)

### 3.3 Remove / replace

- `--glass-bg`, `--glass-border`, `--glass-shadow` and `.glass-card`  
- Default `.gradient-bg` page wash (replace with flat semantic background)  
- Dead marketing utilities (`.cta-primary`, `.hero-section`, `.testimonial-card`, `.urgency-banner`, etc.) if unused  
- Abandoned orange/violet accent-alt as brand accents (keep only if a true semantic need exists; prefer status tokens)

### 3.4 Radius & elevation

- Keep `--radius: 0.75rem` and derived sm/md/lg/xl  
- Product cards: `rounded-xl` (not marketing `rounded-[1.75rem]`)  
- Elevation: hairline borders first; `shadow-sm` sparingly for floating chrome (menus, mobile drawer); no heavy glass shadows

---

## 4. Typography

- Load **Manrope** via `next/font/google` as `--font-manrope`  
- Wire `@theme`: `--font-sans` and `--font-display` → Manrope  
- Keep **JetBrains Mono** for mono roles (IDs, codes, dense numeric tables where helpful)  
- Replace global marketing-scale heading rules (`text-4xl md:text-6xl lg:text-7xl`) with product scale:

| Role | Guidance |
|------|----------|
| Page title | `text-2xl md:text-3xl font-semibold tracking-tight` |
| Section / card title | `text-sm font-semibold` or `text-base font-semibold` |
| Body | `text-sm` / `text-base`, `leading-relaxed` sparingly |
| Meta / kicker | optional `text-[0.68rem] uppercase tracking-wide` — use rarely |
| Stat value | `text-2xl md:text-3xl font-semibold` (not rainbow-coloured) |

OpenType: prefer `liga` / `kern` on body where feasible; tracking `-0.02em` to `-0.03em` on titles (not marketing `-0.04em` at hero scale).

---

## 5. Shell & components

### 5.1 Shell

- **Sidebar:** Deep forest brand mark area; quiet canvas nav; active = signal green treatment; logout uses destructive semantic tokens (no raw `red-600`)  
- **Navbar:** Quiet, hairline border; breadcrumb + theme + user chip; no glass  
- **Footer:** Minimal product chrome — strip marketing social / “Made with ♥” theatre  
- **PageShell / PageHeader:** Flat background, consistent padding (`px-4 sm:px-6`, `py-6 md:py-8`)

### 5.2 Primitives (`components/ui/*`)

Align Button, Card, Badge, Input, Textarea, Select, Alert, Skeleton, Checkbox, Label, Form, Avatar, Separator to:

- Token-only colours  
- Shared radius  
- Signal-green focus rings  
- No emerald/blue/purple Tailwind palette hardcodes  

### 5.3 Product components

- **StatsCard:** Monochrome + single signal accent; marketing-like icon wells (`rounded-[14px]`, soft fill); remove blue/purple/amber hardcodes  
- **EmptyState / RouteError / RouteLoading / skeletons:** Calm Manrope, muted surfaces, one clear action  
- **Charts:** Remap series to chart tokens (greens + restrained secondary)  
- **Auth:** Left panel deep forest; form canvas quiet; primary CTA signal green  

### 5.4 Motion

- Prefer duration `200–400ms` for product UI  
- Shared easing `[0.22, 1, 0.36, 1]` where framer-motion is used  
- Respect `prefers-reduced-motion` (CSS + MotionConfig if adopted)  
- No marketing-scale staggered hero reveals on dashboard pages  

---

## 6. Screen sweep

Presentational-only updates (no business logic changes) across:

- `/auth/signin`, `/auth/reset-password`  
- `/dashboard` and all rider/advertiser child routes (campaigns, routes, rewards, notifications, analytics, billing, settings)  
- Shared layout + loading/error boundaries  

Replace: `glass-card`, `gradient-bg`, palette hardcodes (`text-blue-600`, `bg-purple-100`, `emerald-*`, `text-red-600`, `hover:text-black`, gray hover hacks).

---

## 7. Accessibility & responsiveness

- Verify contrast for signal green on white and deep forest on inverse text  
- Visible focus rings (`--ring`) on all interactive controls  
- Preserve touch targets (≥44px where already used)  
- Keyboard nav unchanged functionally  
- Spot-check desktop, tablet, mobile; large screens keep `max-w` content discipline (no ultrawide sprawl without measure)  
- Dark mode contrast on ink surfaces  

---

## 8. Performance & non-regression

- Prefer CSS tokens over new animation libraries  
- Removing glass blur should **improve** paint cost  
- Manrope via `next/font` (self-hosted subset) — acceptable vs Inter swap  
- Do **not** change: auth flows, routing, Supabase/API, TanStack Query, analytics events, role gates, form validation logic  

---

## 9. Phased delivery

1. **Foundation** — tokens, fonts, dark remaps, delete glass/dead CSS  
2. **Primitives** — `components/ui/*`  
3. **Shell** — Sidebar, Navbar, Footer, PageShell, PageHeader, ThemeToggle  
4. **Product components** — StatsCard, empties, skeletons, charts, forms  
5. **Screens** — auth + all dashboard presentational sweeps  
6. **Polish & verify** — a11y, responsive, cohesion (“one product?”), smoke functional paths  

---

## 10. Success criteria

- [ ] Website → app feels continuous (Manrope, forest/signal greens, quiet borders)  
- [ ] No default glassmorphism product chrome  
- [ ] No high-visibility Tailwind palette hardcodes  
- [ ] Dark mode = MOVRR ink/forest, not cool blue-gray  
- [ ] Dashboard remains dense, calm, ops-ready  
- [ ] Auth/routing/API/analytics behaviour unchanged  
- [ ] Production / ops / launch / GTM ready visually  

---

## 11. Explicit non-goals

- Rebuilding app layouts into marketing storytelling sections  
- Extracting a shared `@movrr/design-tokens` package in this pass  
- Changing `movrr-mobile`  
- New product features  

---

## 12. Audit snapshot (pre-migration)

### Critical

- Primary green mismatch (`#23b245` vs marketing deep/signal system)  
- Inter vs Manrope  
- No `--movrr-*` layer in app  
- Glass + gradient product chrome vs marketing restraint  

### Important

- StatsCard / Badge / Sidebar / Auth hardcodes  
- Cool blue-gray dark mode  
- Marketing-scale global heading CSS  
- Dead marketing utilities in `globals.css`  
- Footer marketing tone  

### Polish

- Magic numbers (sidebar widths, `text-[10px]`)  
- Incomplete font CSS var wiring  
- Chart rainbow series  
- Inconsistent icon well treatments  

---

## 13. Out of scope follow-ups (optional later)

- Shared design-tokens package consumed by website + app  
- Align `movrr-mobile` to the same token vocabulary  
- Expand missing shadcn primitives (dialog, sheet, table, tabs) only if product needs them  
