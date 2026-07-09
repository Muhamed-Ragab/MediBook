<!-- SEED: re-run $impeccable document once there's code to capture the actual tokens and components. -->
---
name: MediBook
description: Medical appointment booking system connecting patients with doctors
---

# Design System: MediBook

## 1. Overview

**Creative North Star: "The Calm Clinic"**

A patient booking a doctor's appointment on their phone during a lunch break — they need the interface to be clear, trustworthy, and not add to their stress. The primary color is a calm, professional deep teal-navy that signals reliability without feeling cold or institutional.

The system is **restrained** by design: tinted neutrals carry the vast majority of each surface, and the brand color appears on ≤10% of any given screen. This is not a brand that shouts. It earns trust through clarity, spacing, and predictable behavior.

**Key Characteristics:**
- Clean, airy layouts with generous whitespace
- One primary action per screen
- Color is meaningful, not decorative
- Typography does the heavy lifting

**Rejects:** traditional hospital portal density, crowded dashboards, urgent color schemes, decorative illustrations.

## 2. Colors

**The Restrained Rule.** The brand color (deep teal-navy) covers ≤10% of any surface. Its rarity is what gives it weight. Neutrals carry the rest.

### Primary
- **Deep Teal-Navy** (`[to be resolved during implementation]`): Used for primary buttons, active navigation, key interactive elements only. Never decorative.

### Neutral
- **Background** (`[to be resolved during implementation]`): Pure white or near-white. No hidden warmth or coolness; the surface is a neutral canvas.
- **Surface** (`[to be resolved during implementation]`): Subtle layering for cards and panels. Pulled from bg toward ink with a trace of the brand hue.
- **Ink** (`[to be resolved during implementation]`): Body text. Near-black with a subtle cool trace from the brand hue. ≥7:1 contrast against bg.
- **Muted** (`[to be resolved during implementation]`): Secondary text and metadata. ≥3.5:1 against bg.

### Semantic (Status)
- **Confirmed** (`[to be resolved during implementation]`): Calm green.
- **Cancelled** (`[to be resolved during implementation]`): Muted red, not alarm red.
- **Pending** (`[to be resolved during implementation]`): Warm amber.

## 3. Typography

**Single sans-serif** — one clean family in multiple weights. Efficient, professional, readable at all sizes.

**Character:** Clean and legible without being sterile. The font should feel approachable (humanist or neo-grotesque with warmth) rather than technical (geometric or monospaced).

**Font pairing:** `[font pairing to be chosen at implementation]` — one family across display, body, and label roles.

### Hierarchy
- **Display** (Bold, `[clamp to be resolved]`): Page titles only. `text-wrap: balance`.
- **Headline** (Semibold, `[size to be resolved]`): Section headings.
- **Title** (Medium, `[size to be resolved]`): Card titles, modal headers.
- **Body** (Regular, `[size to be resolved]`): Primary reading text. 65–75ch max line length.
- **Label** (Medium, `[size to be resolved]`, lowercase): Button labels, form labels, metadata.

## 4. Elevation

**Flat by default.** Surfaces are distinguished by tonal layering (background → surface → element), not by shadows. Shadows appear only as a response to state (dropdowns, modals, focused elements) and are subtle when used.

## 5. Components

*No components have been implemented yet. This section will be populated after the initial build — run `$impeccable document` once components exist.*

## 6. Do's and Don'ts

### Do:
- **Do** use generous whitespace — each screen should feel airy and calm.
- **Do** communicate status with both color and text (never color alone).
- **Do** use the deep teal-navy accent sparingly — its rarity is its power.
- **Do** keep one primary action per screen.
- **Do** use `text-wrap: balance` on headings for even line lengths.

### Don't:
- **Don't** use urgent colors (bright reds, flashing elements) for standard UI.
- **Don't** overcrowd screens — medical booking is stressful enough without visual noise.
- **Don't** use decorative color — every colored element should carry meaning.
- **Don't** use side-stripe borders, gradient text, or glassmorphism.
- **Don't** use illustrations or decorative icons — let the interface speak for itself.
- **Don't** make cards the default layout affordance — vary structure by content.
