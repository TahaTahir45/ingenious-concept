# Ingenious Concepts — AI Digital Solutions (concept redesign)

A reimagined web experience for **Ingenious Concepts** as a next-gen AI and digital solutions brand.

**Live preview:** _add your Vercel / Netlify / GitHub Pages URL here_
**Brand system:** [`brand.html`](brand.html)

---

## The idea: one brief in, every channel out

The identity is built on a prism. A single beam of light enters the glass and leaves as a spectrum.
For Ingenious Concepts, the beam is the client's brief and the spectrum is the five practices that deliver it:

| Practice | Color (dark / light) |
| --- | --- |
| AI & Digital Solutions | `#5B8CFF` / `#2F5BE0` |
| Growth & Full-Scale Digital Marketing | `#37D6A6` / `#0E8F6A` |
| On-Ground & Experiential Marketing | `#FFB547` / `#B86A00` |
| Game Development & Interactive Experiences | `#FF5C93` / `#D12A68` |
| Tech Staffing & Resource Augmentation | `#A88BFF` / `#6C46E0` |

Each practice owns one color, in the same order, everywhere it appears: the hero rays, the service tabs,
the 3D prism faces, the contact form and the logo.

## 1. Brand identity & visual direction

- **Logo mark:** an equilateral prism with one white beam entering and five colored rays leaving (`assets/logo-mark.svg`, `assets/logo.svg`, `assets/favicon.svg`).
- **Wordmark:** Unbounded SemiBold, two lines, tight leading.
- **Core palette:**
  - Prism Ink `#10133A` (dark base)
  - Night Glass `#181C4A` (raised surfaces)
  - Lumen `#EEF0FA` (light base, text on dark)
  - Slate `#A3A9CC` (secondary text)
  - Ion `#5B8CFF` (accent, links, focus)
- **Typography:**
  - Unbounded is the display face. It's a wide, sculpted grotesque that feels built, which suits 3D, games and installations.
  - Instrument Sans is the text face. It's compact and quiet, and it stays legible in forms and chips.
- **Dark / light harmony:** both themes share the same token names (`css/tokens.css`), so every component switches with a single `data-theme` attribute. Dark is the default, because the prism reads best as light on ink.
- **Contrast:** every spectrum color keeps at least 3:1 contrast against its background (the WCAG minimum for non-text marks). Text always uses the body colors.

## 2. Service pillars

All 21 deliverables from the brief are presented in an interactive services section:

- **Filter pills (tabs):** a color-coded tablist with full keyboard support (← → Home End).
- **3D pentagonal prism:** five faces for five practices. It rotates the shortest way to the selected practice. Click a face, swipe it, or use the tabs; it tilts with the pointer.
- **Expandable deliverable cards:** each deliverable expands to a plain-language description and "includes" chips.
- **Hero ray labels:** each ray in the WebGL hero is a button that jumps to its practice.

All copy lives in one file, `js/data/pillars.js`. The tabs, prism faces, hero rays and contact form all render from it.

## 3. Technical & UX

- **3D hero:** Three.js (r128) with custom GLSL shaders:
  - fresnel glass with a light glint
  - additive light beams
  - a dispersion fan inside the prism
  - drifting dust
  - a single orchestrated intro: the beam fires, the glass catches it, and the rays fan out
- **Responsive:** tuned for mobile (390px), tablet (820px) and desktop (1440px+). The WebGL scene recomposes for each aspect ratio.
- **Micro-interactions:** spectrum glow on primary buttons, animated nav underlines, the rotating prism with pointer tilt, accordion rows, and a light line that runs through the process steps.
- **Performance:**
  - no framework and no build step
  - the render loop pauses when the hero is off-screen or the tab is hidden
  - pixel ratio is capped at 2
  - the services section is CSS 3D, so the page has only one WebGL context
- **Accessibility:**
  - semantic landmarks and a skip link
  - visible focus states
  - ARIA tabs and accordion
  - `inert` on collapsed content
  - form errors announced with `aria-live`
  - `prefers-reduced-motion` respected, with the intro skipped and the final scene shown
  - an SVG fallback if WebGL is unavailable

## Project structure

```
├── index.html              Main page
├── brand.html              Brand system page
├── assets/                 Logo, mark and favicon (SVG)
├── css/
│   ├── tokens.css          Palette, type scale, spacing, dark/light themes
│   ├── base.css            Reset, typography, buttons, header, footer
│   ├── sections.css        Hero, services, process, contact
│   └── brand.css           Brand page only
└── js/
    ├── main.js             Entry point: wires the modules together
    ├── brand.js            Brand page entry
    ├── data/pillars.js     All service content (single source of truth)
    ├── scene/prism-scene.js  Three.js hero
    ├── components/         services, contact, nav, theme, reveal
    └── utils/dom.js        Small shared helpers
```

## Run locally

The site uses native ES modules, so it needs a local server. Opening `index.html` directly from the file system won't load the scripts.

- **VS Code:** install the *Live Server* extension, then right-click `index.html` and choose **Open with Live Server**.
- **Node:** `npx serve .`
- **Python:** `python3 -m http.server 8000`, then open http://localhost:8000

## Deploy

No build step is needed. The repo root is the site.

- **Vercel:** choose New Project, import this repo, set Framework Preset to **Other**, leave the build command empty, and deploy.
- **Netlify:** choose Add new site, import from Git, leave the build command empty, set the publish directory to `/`, and deploy.
- **GitHub Pages:** go to Settings, then Pages, choose **Deploy from a branch**, and select `main` / root.

## Customizing

- **Contact email:** change `CONTACT_EMAIL` in `js/main.js` and the `mailto:` link in `index.html`. The form opens a pre-filled email. To collect briefs instead, replace the `mailto` step in `js/components/contact.js` with a `fetch()` to Formspree or a serverless function.
- **Service copy:** edit `js/data/pillars.js`.
- **Colors and type:** edit `css/tokens.css`.

---

Concept redesign by Umar Khan.
