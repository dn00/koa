# Modern Brutalist Design System (v2.0)

This document formalizes the **Modern Brutalist** design system for ThankKit. It represents an evolution of the original "Warm Brutalist" spec, moving away from raw/aggressive elements toward a refined, high-density "technical tool" aesthetic that balances industrial precision with modern usability.

---

## 1. Visual Philosophy: "Functional Honesty"
The system is built on the concept that design should reveal its function rather than hide it.
- **The Machine vs. The Human**: A strict duality in typography. Technical data and labels use monospace; narrative and body content use sans-serif.
- **Physics-Based Elevation**: Depth is achieved through hard, angled offsets (3px to 5px). No blurs, no gradients, no "magic" depth.
- **Intentional Density**: High information density is a feature, not a bug. It signals a professional tool for power users.
- **Monochrome Foundation**: Colors (Coral/Sage) are used sparingly as high-signal accents against a neutral charcoal and off-white base.

---

## 2. Global Style Tokens

### 2.1 Color Palette
| Token | Hex | Tailwind Utility | Usage |
|-------|-----|------------------|-------|
| **Off-White** | `#F9FAFB` | `bg-background` | Primary page backgrounds |
| **Pure White**| `#FFFFFF` | `bg-white` | Card and modal surfaces |
| **Charcoal** | `#2D3142` | `text-foreground` | Text, primary borders, hard shadows |
| **Coral** | `#E07A5F` | `bg-primary` | Primary CTAs, active selection |
| **Sage** | `#81B29A` | `bg-secondary` | Success states, secondary accents |
| **Slate** | `#6B7280` | `text-muted-foreground`| Labels, metadata, inactive icons |

### 2.2 Borders & Radii
- **Border Weight**: Strictly `1px` for all containers and inputs.
- **Primary Radius**: `rounded-[2px]` (Buttons, Inputs, Checkboxes).
- **Secondary Radius**: `rounded-sm` or `rounded-md` (Used only for large containers or specific UI elements like Card frames to keep them from feeling "sharp" but still brutal).

---

## 3. Typography: The Dual-Font Rule

### 3.1 The Machine (Monospace)
Used for data, technical metadata, labels, and "control panel" headers.
- **Font**: `JetBrains Mono`
- **Logic**: If it's a label for something else, or a technical value (Size, ID, Date), it MUST be Mono.
- **Casing**: Uppercase for Headers and Labels.
- **Tracking**: `tracking-wider` (approx 1.5px).
- **Scale**:
  - `text-[10px]`: Labels, Micro-stats.
  - `text-[11px]`: Section Headers.
  - `text-xs`: Standard metadata tags.

### 3.2 The Human (Sans-Serif)
Used for storytelling, human-readable content, and descriptive text.
- **Font**: `Inter`
- **Logic**: If it's a title, a sentence, or a description, it MUST be Sans.
- **Casing**: Natural sentence case.
- **Scale**:
  - `text-sm`: Default body copy.
  - `text-base`: Card titles.
  - `text-2xl+`: Page headers.

---

## 4. Elevation (Hard Shadows)
Shadows follow a 45-degree angle to the bottom-right.

| Token | CSS | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| **Standard** | `3px 3px 0px 0px rgba(0,0,0,0.15)` | `shadow-brutal` | Buttons, Cards, Dropdowns |
| **Large** | `5px 5px 0px 0px rgba(0,0,0,0.15)` | `shadow-brutal-lg` | Modals, Dialogs |
| **Hover** | `4px 4px 0px 0px rgba(0,0,0,0.20)` | `shadow-brutal-hover` | Lifted state |

---

## 5. Components & Implementation Recipes

### 5.1 The "Brutalist Pop" (Interaction Physics)
Interactive elements should feel like they "click" into the page.
- **Standard Button**:
  - **Rest**: `shadow-brutal`, `rounded-[2px]`, `border-border`.
  - **Hover**: `-translate-y-0.5`, `shadow-brutal-hover`.
  - **Active**: `translate-y-0`, `shadow-none` (Simulates being pressed down).
  - **Transition**: `transition-all duration-200`.

### 5.2 The "Control Panel" Sidebar
Sidebars should look like a technical dashboard.
- **Headers**: `text-[11px] font-mono font-bold uppercase text-muted-foreground`.
- **Interactive Rows**: Use `px-3 py-1.5 rounded-md hover:bg-muted transition-colors`.
- **Selected State**: `bg-primary text-primary-foreground font-bold shadow-brutal -translate-y-[1px]`.
- **Spacing**: `space-y-4` between sections; `gap-0.5` between items.

### 5.3 The Gallery Card
Cards must adapt to their content shape.
- **Frame**: `shadow-brutal`, dynamic `aspect-ratio` (no forced 4x6).
- **Meta Alignment**:
  - Content should be perfectly flush with the left edge.
  - The first badge in a row must use `pl-0` and `border-l-0` to align text vertically with the heading.
- **Styles**: Up to 2 visible style badges (`text-[10px] mono`), then a `+N` badge with a `Tooltip`.

### 5.4 High-Density Tables
- **Head**: `font-mono text-[10px] uppercase font-bold tracking-wider`.
- **Cells**: `text-sm font-sans` for names; `text-xs font-mono` for IDs and quantities.
- **Rows**: `border-b border-border`. Hover state: `bg-muted/50`.

---

## 6. Layout Constraints
- **Vertical Spacing**: Avoid "Luxury SaaS" whitespace. Use `space-y-4` or `space-y-6` for primary blocks.
- **Sticky Tracks**: Sidebars use `sticky self-start`. Container must have `min-h-[1200px]` and `content-start` to keep cards grouped at the top.
- **Duality Enforcement**: Never mix Sans and Mono within the same label or value block. Use them to create a clear "Machine vs Human" hierarchy.