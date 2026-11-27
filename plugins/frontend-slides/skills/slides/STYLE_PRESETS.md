# Style Presets Reference

Curated visual styles for Frontend Slides. Each preset is inspired by real design references — no generic "AI slop" aesthetics. **Abstract shapes only — no illustrations.**

**Viewport CSS:** For mandatory base styles, see [viewport-base.css](viewport-base.css). Include in every presentation.

---

## Dark Themes

### 1. Bold Signal

**Vibe:** Confident, bold, modern, high-impact

**Layout:** Colored card on dark gradient. Number top-left, navigation top-right, title bottom-left.

**Typography:**
- Display: `Archivo Black` (900)
- Body: `Space Grotesk` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #1a1a1a;
    --bg-gradient: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    --card-bg: #FF5722;
    --text-primary: #ffffff;
    --text-on-card: #1a1a1a;
}
```

**Signature Elements:**
- Bold colored card as focal point (orange, coral, or vibrant accent)
- Large section numbers (01, 02, etc.)
- Navigation breadcrumbs with active/inactive opacity states
- Grid-based layout for precise alignment

---

### 2. Electric Studio

**Vibe:** Bold, clean, professional, high contrast

**Layout:** Split panel—white top, blue bottom. Brand marks in corners.

**Typography:**
- Display: `Manrope` (800)
- Body: `Manrope` (400/500)

**Colors:**
```css
:root {
    --bg-dark: #0a0a0a;
    --bg-white: #ffffff;
    --accent-blue: #4361ee;
    --text-dark: #0a0a0a;
    --text-light: #ffffff;
}
```

**Signature Elements:**
- Two-panel vertical split
- Accent bar on panel edge
- Quote typography as hero element
- Minimal, confident spacing

---

### 3. Creative Voltage

**Vibe:** Bold, creative, energetic, retro-modern

**Layout:** Split panels—electric blue left, dark right. Script accents.

**Typography:**
- Display: `Syne` (700/800)
- Mono: `Space Mono` (400/700)

**Colors:**
```css
:root {
    --bg-primary: #0066ff;
    --bg-dark: #1a1a2e;
    --accent-neon: #d4ff00;
    --text-light: #ffffff;
}
```

**Signature Elements:**
- Electric blue + neon yellow contrast
- Halftone texture patterns
- Neon badges/callouts
- Script typography for creative flair

---

### 4. Dark Botanical

**Vibe:** Elegant, sophisticated, artistic, premium

**Layout:** Centered content on dark. Abstract soft shapes in corner.

**Typography:**
- Display: `Cormorant` (400/600) — elegant serif
- Body: `IBM Plex Sans` (300/400)

**Colors:**
```css
:root {
    --bg-primary: #0f0f0f;
    --text-primary: #e8e4df;
    --text-secondary: #9a9590;
    --accent-warm: #d4a574;
    --accent-pink: #e8b4b8;
    --accent-gold: #c9b896;
}
```

**Signature Elements:**
- Abstract soft gradient circles (blurred, overlapping)
- Warm color accents (pink, gold, terracotta)
- Thin vertical accent lines
- Italic signature typography
- **No illustrations—only abstract CSS shapes**

---

## Light Themes

### 5. Notebook Tabs

**Vibe:** Editorial, organized, elegant, tactile

**Layout:** Cream paper card on dark background. Colorful tabs on right edge.

**Typography:**
- Display: `Bodoni Moda` (400/700) — classic editorial
- Body: `DM Sans` (400/500)

**Colors:**
```css
:root {
    --bg-outer: #2d2d2d;
    --bg-page: #f8f6f1;
    --text-primary: #1a1a1a;
    --tab-1: #98d4bb; /* Mint */
    --tab-2: #c7b8ea; /* Lavender */
    --tab-3: #f4b8c5; /* Pink */
    --tab-4: #a8d8ea; /* Sky */
    --tab-5: #ffe6a7; /* Cream */
}
```

**Signature Elements:**
- Paper container with subtle shadow
- Colorful section tabs on right edge (vertical text)
- Binder hole decorations on left
- Tab text must scale with viewport: `font-size: clamp(0.5rem, 1vh, 0.7rem)`

---

### 6. Pastel Geometry

**Vibe:** Friendly, organized, modern, approachable

**Layout:** White card on pastel background. Vertical pills on right edge.

**Typography:**
- Display: `Plus Jakarta Sans` (700/800)
- Body: `Plus Jakarta Sans` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #c8d9e6;
    --card-bg: #faf9f7;
    --pill-pink: #f0b4d4;
    --pill-mint: #a8d4c4;
    --pill-sage: #5a7c6a;
    --pill-lavender: #9b8dc4;
    --pill-violet: #7c6aad;
}
```

**Signature Elements:**
- Rounded card with soft shadow
- **Vertical pills on right edge** with varying heights (like tabs)
- Consistent pill width, heights: short → medium → tall → medium → short
- Download/action icon in corner

---

### 7. Split Pastel

**Vibe:** Playful, modern, friendly, creative

**Layout:** Two-color vertical split (peach left, lavender right).

**Typography:**
- Display: `Outfit` (700/800)
- Body: `Outfit` (400/500)

**Colors:**
```css
:root {
    --bg-peach: #f5e6dc;
    --bg-lavender: #e4dff0;
    --text-dark: #1a1a1a;
    --badge-mint: #c8f0d8;
    --badge-yellow: #f0f0c8;
    --badge-pink: #f0d4e0;
}
```

**Signature Elements:**
- Split background colors
- Playful badge pills with icons
- Grid pattern overlay on right panel
- Rounded CTA buttons

---

### 8. Vintage Editorial

**Vibe:** Witty, confident, editorial, personality-driven

**Layout:** Centered content on cream. Abstract geometric shapes as accent.

**Typography:**
- Display: `Fraunces` (700/900) — distinctive serif
- Body: `Work Sans` (400/500)

**Colors:**
```css
:root {
    --bg-cream: #f5f3ee;
    --text-primary: #1a1a1a;
    --text-secondary: #555;
    --accent-warm: #e8d4c0;
}
```

**Signature Elements:**
- Abstract geometric shapes (circle outline + line + dot)
- Bold bordered CTA boxes
- Witty, conversational copy style
- **No illustrations—only geometric CSS shapes**

---

## Specialty Themes

### 9. Neon Cyber

**Vibe:** Futuristic, techy, confident

**Typography:** `Clash Display` + `Satoshi` (Fontshare)

**Colors:** Deep navy (#0a0f1c), cyan accent (#00ffcc), magenta (#ff00aa)

**Signature:** Particle backgrounds, neon glow, grid patterns

---

### 10. Terminal Green

**Vibe:** Developer-focused, hacker aesthetic

**Typography:** `JetBrains Mono` (monospace only)

**Colors:** GitHub dark (#0d1117), terminal green (#39d353)

**Signature:** Scan lines, blinking cursor, code syntax styling

---

### 11. Swiss Modern

**Vibe:** Clean, precise, Bauhaus-inspired

**Typography:** `Archivo` (800) + `Nunito` (400)

**Colors:** Pure white, pure black, red accent (#ff3300)

**Signature:** Visible grid, asymmetric layouts, geometric shapes

---

### 12. Paper & Ink

**Vibe:** Editorial, literary, thoughtful

**Typography:** `Cormorant Garamond` + `Source Serif 4`

**Colors:** Warm cream (#faf9f7), charcoal (#1a1a1a), crimson accent (#c41e3a)

**Signature:** Drop caps, pull quotes, elegant horizontal rules

---

## More Dark Themes

### 13. Midnight Gallery

**Vibe:** Quietly dramatic, cultured, premium

**Layout:** Treat each slide like an exhibition catalog: a strict caption rail, one large title or color field, and generous gallery-like negative space.

**Typography:** `DM Serif Display` for headlines + `DM Sans` for supporting text.

**Colors:** Ink navy (#101820), soft ivory (#f4f0e8), muted brass (#c6a86b), slate (#87939b).

**Signature:** Use small catalog numbers, precise hairline dividers, and framed color fields; keep the palette matte and avoid glow effects.

---

### 14. Ember Archive

**Vibe:** Warm, cinematic, archival

**Layout:** Layered charcoal panels with a strong rust-orange title block and small archival-style metadata.

**Typography:** `Bebas Neue` for display + `Source Sans 3` for body.

**Colors:** Charcoal (#211b19), ember (#d85a32), parchment (#f1e5d2), dusty rose (#a66b65).

**Signature:** Oversized dates, narrow divider lines, offset panels, and grain-like texture built from subtle CSS gradients.

---

### 15. Arctic Signal

**Vibe:** Precise, cool, technical, composed

**Layout:** Dark blue-gray canvas with a modular grid and crisp cyan data callouts.

**Typography:** `Space Grotesk` for display + `IBM Plex Mono` for labels and figures.

**Colors:** Deep fjord (#101d2a), ice (#e5f2f5), glacier blue (#75c9dc), steel (#708795).

**Signature:** Fine grid lines, numbered sections, slim cyan markers, and compact charts with ample breathing room.

---

### 16. Plum Observatory

**Vibe:** Dreamy, contemplative, quietly futuristic

**Layout:** A single radial composition anchors each slide: place the title off-center and use one large orbit diagram as the visual counterweight.

**Typography:** `Instrument Serif` for display + `Manrope` for body.

**Colors:** Aubergine (#201526), lilac (#d7c4e8), comet peach (#f3a987), dusk (#8f829a).

**Signature:** Limit geometry to a few concentric rings and measured labels; use peach only to mark the focal point, not as scattered decoration.

---

## More Light Themes

### 17. Citrus Modern

**Vibe:** Fresh, optimistic, direct

**Layout:** Build an editorial index: oversized section number at the top, a narrow citrus side panel, and left-aligned content in a consistent column.

**Typography:** `League Spartan` for display + `Public Sans` for body.

**Colors:** Paper (#fbf8ef), ink (#20231f), citrus (#d8ef57), leaf (#55765b).

**Signature:** Repeat the same numbered header and caption rail across slides; use citrus as a single solid panel, never as a background wash.

---

### 18. Coastal Ledger

**Vibe:** Calm, credible, thoughtful

**Layout:** Open cream pages with a narrow ocean-blue rail for section markers and chart legends.

**Typography:** `Newsreader` for display + `Nunito Sans` for body.

**Colors:** Salt (#f4f1e8), deep tide (#183b4e), sea glass (#9bc6bd), sand (#d9c5a1).

**Signature:** Ledger-like rules, broad margins, simple data tables, and alternating pale-blue content bands.

---

### 19. Rose Quartz Editorial

**Vibe:** Soft, expressive, modern

**Layout:** Use a two-column magazine spread: narrow quote or pull-stat column beside a wider body column on a blush paper field.

**Typography:** `Gloock` for headlines + `Karla` for body.

**Colors:** Blush (#f3e3e1), charcoal (#292526), rose (#bd7180), mauve-gray (#9a898d).

**Signature:** Make the quote column the recurring device; use rose only for quotation marks, rules, or one highlighted phrase.

---

### 20. Terracotta Atelier

**Vibe:** Human, crafted, grounded

**Layout:** Warm white canvas with terracotta blocks and an irregular but consistent editorial grid.

**Typography:** `Lora` for display + `Figtree` for body.

**Colors:** Chalk (#f7f2e9), terracotta (#b9573f), olive (#70734b), espresso (#322a25).

**Signature:** Keep an uneven but repeatable three-column grid, with one terracotta column reserved for section labels and key figures.

---

## More Specialty Themes

### 21. Blueprint Lab

**Vibe:** Inventive, systematic, engineering-minded

**Layout:** Blueprint-blue field with clear construction lines and bright white labels.

**Typography:** `Barlow Condensed` for display + `IBM Plex Mono` for measurements.

**Colors:** Blueprint (#123f68), chalk (#f2f6f3), drafting cyan (#70d6e8), signal orange (#ff9b52).

**Signature:** Dimension lines, coordinate markers, modular diagrams, and orange reserved for critical findings.

---

### 22. Mineral Study

**Vibe:** Natural, tactile, quietly luxurious

**Layout:** Warm stone background, layered mineral-tone panels, and compact specimen-style captions.

**Typography:** `Fraunces` for display + `Alegreya Sans` for body.

**Colors:** Limestone (#eee8db), basalt (#303431), malachite (#527965), ochre (#c28a45).

**Signature:** Use flat stratigraphic bands and specimen-style labels as data containers; avoid floating crystals, faux stone textures, and decorative facets.

---

### 23. Analog Future

**Vibe:** Retro-tech, playful, experimental

**Layout:** Cream-and-black modular layout with one vivid signal color and deliberately oversized typography.

**Typography:** `Archivo Black` for display + `Space Mono` for labels.

**Colors:** Warm white (#f3eddf), near-black (#171717), signal orange (#ff5b35), electric lilac (#a78bfa).

**Signature:** Borrow from printed instrument panels: registration marks, ruled labels, and offset blocks. Keep motion clean—no glitch effects or decorative scan lines.

---

### 24. Celestial Almanac

**Vibe:** Reflective, poetic, expansive

**Layout:** Structure slides like an astronomical almanac: a warm paper-colored calendar/data panel against midnight, with dates and seasonal observations as the hierarchy.

**Typography:** `Cormorant Garamond` for display + `Jost` for body.

**Colors:** Midnight (#171b2b), moon (#f1ead9), constellation gold (#d7b66d), nebula (#8790b8).

**Signature:** Use compact calendar grids, date/location captions, and one restrained gold marker. Avoid orbit graphics so this remains distinct from Plum Observatory.

---

## Font Pairing Quick Reference

| Preset | Display Font | Body Font | Source |
|--------|--------------|-----------|--------|
| Bold Signal | Archivo Black | Space Grotesk | Google |
| Electric Studio | Manrope | Manrope | Google |
| Creative Voltage | Syne | Space Mono | Google |
| Dark Botanical | Cormorant | IBM Plex Sans | Google |
| Notebook Tabs | Bodoni Moda | DM Sans | Google |
| Pastel Geometry | Plus Jakarta Sans | Plus Jakarta Sans | Google |
| Split Pastel | Outfit | Outfit | Google |
| Vintage Editorial | Fraunces | Work Sans | Google |
| Neon Cyber | Clash Display | Satoshi | Fontshare |
| Terminal Green | JetBrains Mono | JetBrains Mono | JetBrains |
| Midnight Gallery | DM Serif Display | DM Sans | Google |
| Ember Archive | Bebas Neue | Source Sans 3 | Google |
| Arctic Signal | Space Grotesk | IBM Plex Mono | Google |
| Plum Observatory | Instrument Serif | Manrope | Google |
| Citrus Modern | League Spartan | Public Sans | Google |
| Coastal Ledger | Newsreader | Nunito Sans | Google |
| Rose Quartz Editorial | Gloock | Karla | Google |
| Terracotta Atelier | Lora | Figtree | Google |
| Blueprint Lab | Barlow Condensed | IBM Plex Mono | Google |
| Mineral Study | Fraunces | Alegreya Sans | Google |
| Analog Future | Archivo Black | Space Mono | Google |
| Celestial Almanac | Cormorant Garamond | Jost | Google |

---

## DO NOT USE (Generic AI Patterns)

**Fonts:** Inter, Roboto, Arial, system fonts as display

**Colors:** `#6366f1` (generic indigo), purple gradients on white

**Layouts:** Everything centered, generic hero sections, identical card grids

**Decorations:** Realistic illustrations, gratuitous glassmorphism, drop shadows without purpose

---

## CSS Gotchas

### Negating CSS Functions

**WRONG — silently ignored by browsers (no console error):**
```css
right: -clamp(28px, 3.5vw, 44px);   /* Browser ignores this */
margin-left: -min(10vw, 100px);      /* Browser ignores this */
```

**CORRECT — wrap in `calc()`:**
```css
right: calc(-1 * clamp(28px, 3.5vw, 44px));  /* Works */
margin-left: calc(-1 * min(10vw, 100px));     /* Works */
```

CSS does not allow a leading `-` before function names. The browser silently discards the entire declaration — no error, the element just appears in the wrong position. **Always use `calc(-1 * ...)` to negate CSS function values.**
