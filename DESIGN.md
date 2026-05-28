# La Tribu — Design System

## Colors

| Token       | Hex       | Usage                          |
|-------------|-----------|--------------------------------|
| `--charcoal`| `#12100e` | Backgrounds, text              |
| `--coral`   | `#ef5a3f` | Primary CTA, **text accent color (orange)**, button fills |
| `--magenta` | `#d92c69` | Secondary accent, gradients    |
| `--gold`    | `#e2a23c` | Highlights, badges (dark variant #8a6518 on light bg) |
| `--cream`   | `#f4eadc` | Light backgrounds, body text   |
| `--white`   | `#fff8ec` | Page background, card surfaces |

### Gradients

- Primary gradient: `linear-gradient(135deg, var(--coral), var(--magenta))`
- Used on: CTA buttons, hero overlays, section dividers

## Typography

| Role     | Font          | Weight     | Usage                        |
|----------|---------------|------------|------------------------------|
| Display  | Bebas Neue    | 400        | H1, H2, nav links, hero text|
| Body     | Inter         | 400, 600   | Paragraphs, form labels, UI |
| Script   | Pacifico      | 400        | Accent text (in orange/coral), taglines, subtitles |

### Scale

- Hero title ("LA TRIBU"): `20vh` (~20% of hero height)
- Hero subtitle (Pacifico accent): `10vh` (~10% of hero height)
- Hero heading (generic): `clamp(3rem, 8vw, 6rem)`
- Section heading (H2): `clamp(2rem, 5vw, 3.5rem)`
- Subheading (H3): `1.5rem`
- Body: `1rem` (16px)
- Small/caption: `0.875rem`

### Letter spacing

- Display headings: `0.02em`
- Body: default

## Spacing

- Section padding: `5rem 2rem` (desktop), `3rem 1rem` (mobile)
- Card padding: `1.5rem`
- Grid gap: `2rem` (desktop), `1rem` (mobile)
- Container max-width: `1200px`, centered

## Responsive Breakpoints

| Name    | Max-width | Notes                           |
|---------|-----------|--------------------------------|
| Tablet  | `960px`   | 2-col grids, reduced padding   |
| Mobile  | `620px`   | 1-col stack, smaller type scale |

## Components

### Buttons

- **Shape**: squared with small chamfer, `border-radius: 6px` (NOT pill-shaped)
- **Primary CTA**: coral/orange solid fill, white text, padding `1rem 2rem`, uppercase Bebas Neue
- **Secondary CTA**: charcoal fill, cream outline, white text
- **Hover**: slight scale (`1.05`) + box-shadow
- **Icons**: inline SVG icons next to button text (arrow for navigation CTAs, people icon for community CTAs)

### Cards (Event Cards)

- Dark charcoal background with `border-radius: 16px`
- Cover image at top, content below
- Gold date badge, cream title, body text
- Hover: subtle translateY(-4px) lift

### Navigation

- Fixed top, charcoal background with slight transparency
- Logo left, nav links right (Bebas Neue, uppercase)
- Mobile: hamburger menu → slide-in overlay
- Active link: coral underline

### Footer

- Charcoal background, cream text
- Email signup form: inline input + gradient submit button
- Social links, WhatsApp QR placeholder
- Copyright at bottom

### Forms

- Input: transparent background, cream border, cream text, `border-radius: 50px`
- Focus: coral border glow
- Submit button: matches primary CTA style

## Imagery

- Hero: full-bleed background image, gradient overlay dark (left) to transparent (right), content left-aligned, red stamp logo in bottom-right corner
- Event cards: 16:9 ratio cover images
- Gallery: CSS grid masonry-style layout
- All images should feel warm, energetic, community-focused

## Animation

- Page transitions: none (static site)
- Hover effects: `transition: all 0.3s ease`
- Scroll: subtle fade-in on section entry (CSS-only with `@keyframes` or IntersectionObserver)
