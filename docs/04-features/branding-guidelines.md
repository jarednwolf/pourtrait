### Branding Guidelines
- **Color usage map**
  - Primary actions: `bg-primary` with hover `bg-primary-600`.
  - Accents and links: `text-primary` with hover `text-primary-600`.
  - Surfaces: `bg-surface` (light), `dark:bg-dark-surface`.
  - Status: green/yellow/red/blue tokens; avoid custom purples.

- **CTA guidance**
  - Use `Button` with variants: `primary` for main action, `outline` for secondary, `secondary` for neutral.
  - Maintain consistent spacing: buttons stack with `gap-3` and align to type rhythm.

- **Wordmark usage**: Use `public/branding/wordmark.svg` for headers and large brand placement. Maintain clear space equal to the height of the letter P. Do not distort or recolor.
- **Tagline**: “Every bottle a brushstroke”. Use in meta descriptions and marketing copy, not as part of the lockup.
- **Color palette**:
  - **Primary**: `#6D28D9` (use `text-primary`/`bg-primary`), dark variants `#5B21B6` (`primary-600`), `#4C1D95` (`primary-700`).
  - **Surfaces**: `#FFFFFF` (`bg-surface`), `#F8F7FB` (`bg-surface-alt`).
  - **Accessibility**: Links use `text-link` with hover `text-link-hover` for AA+ on light surfaces.
- **Typography scale** (Tailwind tokens):
  - `text-display-1`, `text-display-2`, `text-heading-1`, `text-heading-2`, `text-heading-3`, `text-body-lg`, `text-body`, `text-caption`.
- **Border radius**: `rounded-brand-sm|md|lg`. Shadows `shadow-brand-xs|sm|md`.
- **Do’s**:
  - Ensure minimum AA contrast for text on backgrounds.
  - Prefer solid backgrounds behind the wordmark.
- **Don’ts**:
  - Place wordmark on busy imagery without sufficient contrast layer.
  - Use SVG wordmark as social/OG image; export to PNG/JPEG/WebP for cards.

### Asset Generation
- **Type Scale and Spacing Rhythm**

- Headings: `text-display-1` (hero), `text-display-2` (section hero), `text-heading-1/2/3` (page sections and tiles).
- Body: `text-body-lg` for prominent paragraphs; default `text-body` for content; `text-caption` for annotations.
- Spacing rhythm follows 4px base with key spacings: `mt-4`, `mt-6`, `mt-8`, `py-6`, `py-10`, `py-16`. Prefer these steps to maintain vertical rhythm with the type scale.
- Buttons: default `size=md`; primary actions use `variant=primary`, secondary/tertiary use `outline` or `secondary`.

- Run `npm run assets:generate` to create PWA icons and the OG card.
- Inputs: `public/images/hero.jpg`, `public/branding/wordmark.svg`.
- Outputs:
  - PWA icons in `public/icons/` as `icon-*.png` and `shortcut-*.png`.
  - Social card `public/images/og-card.jpg` (1200x630) used in metadata.

