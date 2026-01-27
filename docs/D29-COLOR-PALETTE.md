# D29 - Color Palette & Visual Tokens

**Status:** Final
**Based on:** D27-VISUAL-STYLE-SPEC

## 1. Core Palette (Light Mode Default)

We use a "Premium Wellness" aesthetic similar to iOS/Apple Health.

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `bg.base` | `#F2F2F7` | Main app background (System Gray 6) |
| `bg.panel` | `#FFFFFF` | Cards, Modals, Bottom Sheet (White) |
| `bg.subtle` | `#E5E5EA` | Secondary pills, inputs (System Gray 5) |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `text.primary` | `#000000` | Main headings, body text |
| `text.secondary` | `#3C3C43` | (60% opacity) Subtitles, meta data |
| `text.tertiary` | `#3C3C43` | (30% opacity) Placeholders, disabled |
| `text.inverse` | `#FFFFFF` | Text on filled buttons/badges |

### Semantic Accents
| Token | Hex | Color Name | Usage |
|-------|-----|------------|-------|
| `accent.calm` | `#34C759` | **System Green** | Verified, Success, "You're you", Safe |
| `accent.warn` | `#FF9500` | **System Orange** | Sketchy, Warning, Unexpected |
| `accent.danger` | `#FF3B30` | **System Red** | Audit, Failure, Critical Contradiction |
| `accent.info` | `#007AFF` | **System Blue** | System info, routine chips, selection |
| `accent.brand` | `#5856D6` | **System Indigo** | KOA Primary (The Daemon), Magic |

### Borders & Separators
| Token | Hex | Usage |
|-------|-----|-------|
| `border.faint` | `#C6C6C8` | Subtle dividers |
| `border.strong` | `#3C3C43` | (18% opacity) Input borders, card outlines |

---

## 2. Gradients & Effects

### KOA Daemon (The Orb)
- **Neutral/Calm:** Radial gradient from `#F2F2F7` to `#D1D1D6` with a soft `#007AFF` glow.
- **Suspicious:** Inner glow shifts to `#FF9500`.
- **Hostile:** Core shifts to `#FF3B30` with chromatic aberration.

### Card Elevations
- **Resting:** `0px 2px 8px rgba(0, 0, 0, 0.04)`
- **Lifted/Selected:** `0px 8px 16px rgba(0, 0, 0, 0.08)`
- **Snap/Insert:** `0px 1px 2px rgba(0, 0, 0, 0.1)`

---

## 3. Dark Mode Equivalents (Calculated)
*If requested, map `bg.base` to `#000000` and `bg.panel` to `#1C1C1E`.*
