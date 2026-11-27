# Animation Patterns Reference

Use this catalog to give a deck a deliberate motion language. Treat examples as
recipes to adapt—not a checklist to apply all at once. Motion should clarify
sequence, hierarchy, or meaning; it should never delay reading or compete with
the message.

## Choosing a motion system

| Feeling | Useful patterns | Visual cues |
|---|---|---|
| **Dramatic / cinematic** | Slow image reveal, restrained zoom, layered parallax, masked title | Dark field, full-bleed image, generous negative space |
| **Techy / futuristic** | Grid wipe, line draw, data build, brief glitch accent | Grid, luminous details, precise geometry |
| **Playful / friendly** | Short spring settle, staggered cards, gentle float | Rounded shapes, bright colors, soft scale changes |
| **Professional / corporate** | Cross-fade, short directional push, clean chart build | Simple geometry, consistent timing, readable data |
| **Calm / minimal** | Gentle dissolve, slow opacity shift, low-amplitude drift | Quiet palette, whitespace, restrained movement |
| **Editorial / magazine** | Curtain reveal, masked headline, image-text choreography | Strong type, asymmetrical composition, deliberate pauses |
| **Data / explainer** | Timeline draw, bar build, numbered-step reveal | Motion follows the order of the explanation |

**Use complexity with intent:** choose one signature slide transition and one
hero entrance idea for a deck or section. A single complex sequence can make a
moment memorable; repeating several complex effects on every slide becomes
noise. Keep important copy visible quickly, provide a static end state, and
prefer `transform` and `opacity` over layout-triggering properties.

## Slide-to-slide transitions

The base cross-fade in `viewport-base.css` is the default. These optional styles
assume the controller continues to toggle `.active` / `.visible` on `.slide`
elements. Add one transition class to `.deck-stage`; do not combine several
transition recipes on the same deck. Preserve the base visibility behavior and
never switch slides with `display: none`.

### 1. Directional push

A short horizontal movement can signal progression through a sequence. Use it
sparingly, such as between chapters or for a deck with a spatial narrative.

```css
.deck-stage.transition-push .slide {
    transform: translateX(56px);
    transition: opacity 420ms ease, transform 520ms cubic-bezier(.22, 1, .36, 1),
                visibility 0s linear 420ms;
}
.deck-stage.transition-push .slide.active,
.deck-stage.transition-push .slide.visible {
    transform: translateX(0);
    transition-delay: 0s;
}
```

For a true forward/backward directional push, have the controller set a
short-lived direction class before changing the active slide, then clear it
after the transition. Test both directions; do not infer direction from DOM
order when the deck can jump to a slide.

### 2. Zoom through

Use a slight scale shift to suggest focus or a change of conceptual distance.
Keep the scale difference small so edges and text do not feel unstable.

```css
.deck-stage.transition-zoom .slide {
    transform: scale(.975);
    transition: opacity 420ms ease, transform 520ms cubic-bezier(.2, .75, .25, 1),
                visibility 0s linear 420ms;
}
.deck-stage.transition-zoom .slide.active,
.deck-stage.transition-zoom .slide.visible {
    transform: scale(1);
    transition-delay: 0s;
}
```

### 3. Directional wipe

A clip-path wipe works well for chapter changes, maps, and editorial layouts.
Keep this effect to simple shapes; complex clipping can be expensive on large
images.

```css
.deck-stage.transition-wipe .slide {
    clip-path: inset(0 100% 0 0);
    transition: clip-path 620ms cubic-bezier(.76, 0, .24, 1),
                opacity 620ms ease, visibility 0s linear 620ms;
}
.deck-stage.transition-wipe .slide.active,
.deck-stage.transition-wipe .slide.visible {
    clip-path: inset(0);
    transition-delay: 0s;
}
```

### 4. Curtain reveal

A single color panel retracts from the center. Use a stage background color that
matches the deck's palette; ensure it cannot cover controls outside the stage.

```css
.deck-stage.transition-curtain .slide::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
    background: var(--transition-curtain, var(--slide-bg, #111));
    transform: scaleX(1);
    transform-origin: center;
    transition: transform 680ms cubic-bezier(.76, 0, .24, 1);
}
.deck-stage.transition-curtain .slide.active::after,
.deck-stage.transition-curtain .slide.visible::after {
    transform: scaleX(0);
}
```

### 5. Subtle 3D hinge

A tiny perspective change can suit a presentation about objects, spaces, or
interfaces. Avoid large rotations: they make text hard to follow and can cause
flicker on low-powered devices.

```css
.deck-stage.transition-hinge {
    perspective: 1800px;
}
.deck-stage.transition-hinge .slide {
    transform: rotateY(-5deg) scale(.985);
    transform-origin: left center;
    backface-visibility: hidden;
    transition: opacity 460ms ease, transform 560ms cubic-bezier(.2, .75, .25, 1),
                visibility 0s linear 460ms;
}
.deck-stage.transition-hinge .slide.active,
.deck-stage.transition-hinge .slide.visible {
    transform: rotateY(0) scale(1);
    transition-delay: 0s;
}
```

### 6. Section-only transition

Keep most slide changes on the default fade, and mark only section openers with a
transition class. If applying per-slide classes, make sure inactive slides keep
their normal visibility and the controller removes temporary classes after
navigation.

## Entrance animation catalog

Keep entrance effects tied to `.visible` so the initial state and final state
are deterministic. Avoid animations that leave content transparent or blurred
if JavaScript fails. Use one main reveal pattern per slide, with small delays
only for grouped elements.

### 1. Fade and lift

```css
.reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 560ms cubic-bezier(.16, 1, .3, 1),
                transform 560ms cubic-bezier(.16, 1, .3, 1);
}
.visible .reveal {
    opacity: 1;
    transform: translateY(0);
}
```

### 2. Staggered cascade

Use for a short list, cards, or steps. Apply `.stagger` to the parent and
`--stagger-index` values (0, 1, 2…) to its children. Keep the full cascade brief.

```css
.stagger > * {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 420ms ease, transform 520ms cubic-bezier(.16, 1, .3, 1);
    transition-delay: calc(var(--stagger-index, 0) * 75ms);
}
.visible .stagger > * {
    opacity: 1;
    transform: translateY(0);
}
```

### 3. Scale and settle

Useful for a single number, quote, or focal object—not every card on a slide.

```css
.reveal-scale {
    opacity: 0;
    transform: scale(.92);
    transition: opacity 480ms ease, transform 620ms cubic-bezier(.2, 1.35, .4, 1);
}
.visible .reveal-scale {
    opacity: 1;
    transform: scale(1);
}
```

If the overshoot feels too playful, replace the spring curve with a standard
cubic-bezier ease-out.

### 4. Masked headline

Wrap each line in an overflow-hidden element and animate the inner text. This
creates a clean editorial reveal without clipping descenders.

```html
<span class="headline-mask"><span class="headline-mask__text reveal-mask">A clearer idea</span></span>
```

```css
.headline-mask { display: block; overflow: hidden; padding-block: .08em; }
.reveal-mask {
    display: inline-block;
    transform: translateY(115%);
    transition: transform 720ms cubic-bezier(.76, 0, .24, 1);
}
.visible .reveal-mask { transform: translateY(0); }
```

### 5. Soft focus reveal

Use on a large image or background subject, not on small text. Keep blur values
modest to avoid expensive repainting.

```css
.reveal-focus {
    opacity: 0;
    filter: blur(8px);
    transform: scale(1.025);
    transition: opacity 700ms ease, filter 800ms ease, transform 900ms ease;
}
.visible .reveal-focus {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
}
```

### 6. Draw an SVG line or route

Give a path `pathLength="1"`, then reveal it with `stroke-dashoffset`. Keep a
static route or endpoint visible in reduced-motion mode.

```html
<svg viewBox="0 0 600 120" role="img" aria-labelledby="route-title">
  <title id="route-title">The route from research to launch</title>
  <path class="route-line" pathLength="1" d="M10 80 C160 10 400 110 590 35" />
</svg>
```

```css
.route-line {
    fill: none;
    stroke: currentColor;
    stroke-width: 4;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    transition: stroke-dashoffset 1100ms cubic-bezier(.65, 0, .35, 1);
}
.visible .route-line { stroke-dashoffset: 0; }
```

### 7. Build a data chart

Animate bars from the baseline, while keeping labels and values available in
HTML from the start. Give each bar a custom property for its final scale.

```css
.chart-bar {
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 760ms cubic-bezier(.2, .8, .2, 1);
    transition-delay: calc(var(--bar-index, 0) * 90ms);
}
.visible .chart-bar { transform: scaleY(var(--bar-value, 1)); }
```

Do not make data understandable only through animation or color; keep a visible
axis, labels, and values, and ensure the chart has an accessible description.

### 8. Timeline draw and node reveal

Draw the connecting line first, then bring in milestone nodes with a short
stagger. The order should match the story's chronology.

```css
.timeline-line {
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 800ms cubic-bezier(.65, 0, .35, 1);
}
.visible .timeline-line { transform: scaleX(1); }
.timeline-node {
    opacity: 0;
    transform: translateY(10px) scale(.94);
    transition: opacity 380ms ease, transform 460ms cubic-bezier(.16, 1, .3, 1);
    transition-delay: calc(420ms + var(--node-index, 0) * 100ms);
}
.visible .timeline-node { opacity: 1; transform: translateY(0) scale(1); }
```

### 9. Layered image parallax (single pass)

For a hero image with foreground and background layers, use small, finite
movement as the slide enters. Keep text outside the moving layers and avoid
continuous loops.

```css
.parallax-back,
.parallax-front {
    opacity: 0;
    transition: opacity 700ms ease, transform 1000ms cubic-bezier(.2, .7, .2, 1);
}
.parallax-back { transform: translateY(14px) scale(1.04); }
.parallax-front { transform: translateY(28px) scale(1.02); transition-delay: 100ms; }
.visible .parallax-back,
.visible .parallax-front { opacity: 1; transform: translateY(0) scale(1); }
```

### 10. Multi-beat hero choreography

Use a short sequence to direct attention from a title to one visual, then to a
single takeaway. Keep the total sequence under roughly two seconds and do not
hide the core message until the last beat.

```css
.hero-title,
.hero-visual,
.hero-takeaway {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 500ms ease, transform 620ms cubic-bezier(.16, 1, .3, 1);
}
.hero-title { transition-delay: 0ms; }
.hero-visual { transition-delay: 180ms; }
.hero-takeaway { transition-delay: 360ms; }
.visible .hero-title,
.visible .hero-visual,
.visible .hero-takeaway {
    opacity: 1;
    transform: translateY(0);
}
```

## Background and ambient effects

Background movement should be subtle and low contrast. Avoid persistent motion
behind dense text, and pause decorative motion under reduced-motion settings.

```css
/* Layered gradient field: depth without a constantly moving background. */
.gradient-bg {
    background:
        radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, .24), transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(0, 255, 200, .16), transparent 50%),
        var(--bg-primary);
}

/* Grid pattern for technical or data-focused slides. */
.grid-bg {
    background-image:
        linear-gradient(rgba(255, 255, 255, .035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, .035) 1px, transparent 1px);
    background-size: 48px 48px;
}

/* One-time ambient glow drift; keep the movement small and brief. */
.glow-drift { animation: glow-drift 5s ease-out both; }
@keyframes glow-drift {
    from { background-position: 45% 50%; }
    to { background-position: 55% 50%; }
}
```

## Interactive motion

Use hover tilt only as optional progressive enhancement. It should not convey
information, should not be required on touch screens, and should respect
reduced-motion preferences.

```javascript
const canTilt = matchMedia('(hover: hover) and (pointer: fine)').matches
  && !matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canTilt) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
```

```css
@media (hover: none), (prefers-reduced-motion: reduce) {
    [data-tilt] { transform: none !important; }
}
```

## Reduced motion and reliable fallbacks

Include a presentation-specific reduced-motion override in addition to the
mandatory base stylesheet. Make content readable immediately; do not leave text
at `opacity: 0`, `clip-path`, or blur when motion is reduced.

```css
@media (prefers-reduced-motion: reduce) {
    .reveal,
    .reveal-scale,
    .reveal-mask,
    .reveal-focus,
    .route-line,
    .chart-bar,
    .timeline-line,
    .timeline-node,
    .parallax-back,
    .parallax-front,
    .hero-title,
    .hero-visual,
    .hero-takeaway {
        animation: none !important;
        transition: none !important;
        opacity: 1 !important;
        filter: none !important;
        clip-path: none !important;
        transform: none !important;
        stroke-dashoffset: 0 !important;
    }

    .deck-stage.transition-push .slide,
    .deck-stage.transition-zoom .slide,
    .deck-stage.transition-hinge .slide {
        transform: none !important;
    }

    .deck-stage.transition-wipe .slide { clip-path: none !important; }
    .deck-stage.transition-curtain .slide::after { display: none !important; }
}
```

Keep the reduced-motion selectors in sync with the effects actually used in the
deck. Avoid global overrides that accidentally remove intentional static visual
states.

## Troubleshooting

| Problem | Fix |
|---|---|
| Fonts not loading | Check the Fontshare/Google Fonts URL and CSS font family name. |
| Slide transitions not triggering | Confirm the controller toggles `.active` / `.visible`; do not use `display: none` for slide changes. |
| Incoming slide appears instantly | Check that the transition class is on `.deck-stage`, and inspect specificity against the base slide rules. |
| Outgoing slide vanishes too early | Keep the base visibility delay; if custom JavaScript is used, retain the outgoing slide until its transition ends. |
| Entrance animations not triggering | Verify `.visible` reaches the slide and reveal selectors match the markup. |
| Content stays hidden with reduced motion | Set visible final states in the reduced-motion override; do not rely on animation completion. |
| Motion feels busy | Remove effects before shortening them; keep one signature transition and one hero reveal per section. |
| Mobile or low-power issues | Remove blur, large clip-paths, hover tilt, and unnecessary layers; test on a touch-sized viewport. |
| Performance issues | Prefer `transform` and `opacity`, avoid animating layout properties, and use `will-change` only after profiling. |
