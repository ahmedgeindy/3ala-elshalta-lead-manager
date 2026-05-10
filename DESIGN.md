---
name: Ala Alshalta Operator Panel
description: A calm, stealth operator tool for campaign leads and WhatsApp outreach.
colors:
  primary: "#E33A52"
  neutral-bg: "#050507"
  neutral-surface: "#0a0a0e"
  success: "#10B981"
  pending: "#F5A623"
  text-primary: "#F3F4F6"
  text-secondary: "#9CA3AF"
  text-muted: "#6B7280"
  border-subtle: "rgba(255, 255, 255, 0.04)"
  border-medium: "rgba(255, 255, 255, 0.08)"
typography:
  body:
    fontFamily: '"Outfit", system-ui, sans-serif'
    fontSize: "14px"
    lineHeight: "1.5"
  label:
    fontFamily: '"Outfit", system-ui, sans-serif'
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.02em"
  mono:
    fontFamily: '"JetBrains Mono", monospace'
    fontSize: "12px"
rounded:
  sm: "8px"
  md: "14px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
---

# Design System: Ala Alshalta Operator Panel

## 1. Overview

**Creative North Star: "The Stealth Dashboard"**

The Ala Alshalta operator panel is a deeply technical, highly efficient, and utterly silent workspace. It relies on a flat, matte charcoal palette and precise typography rather than heavy lighting, blurs, or excessive nesting. It is designed to be stared at for hours without causing fatigue, placing the core action of reviewing and sending WhatsApp campaigns front and center. 

The system explicitly rejects generic SaaS dashboard patterns, cluttered bulk-sender tools, tiny desktop-only controls, and overly dark hacker-style visuals that obscure the workflow. It prioritizes readable text, large touch targets, and clear status feedback above decorative elements.

**Key Characteristics:**
- **Flat surfaces:** Matte dark charcoal backgrounds with no glassmorphism or deep shadows.
- **Utilitarian structure:** Three-column layout to reduce cognitive overload and vertical scrolling.
- **Precise feedback:** Color (ruby, emerald, amber) is reserved exclusively for state and actions.
- **Readable hierarchy:** "Outfit" for clean UI reading, "JetBrains Mono" for technical data.

## 2. Colors

The palette is a highly restrained stealth mode: deep, tintless charcoal carrying the structure, punctuated by precise, highly visible state colors.

### Primary
- **Operator Crimson** (#E33A52): Used sparingly for core calls to action, active states, and focus rings.

### Secondary
- **Success Emerald** (#10B981): Indicates a message has been successfully sent.
- **Pending Amber** (#F5A623): Indicates variables that need filling or queued messages.

### Neutral
- **Base Deep** (#050507): The absolute background of the app shell.
- **Surface Matte** (#0a0a0e): The background for active panels and cards.
- **Text Primary** (#F3F4F6): High-contrast white for core data.
- **Text Secondary** (#9CA3AF): For metadata and supporting info.
- **Text Muted** (#6B7280): For labels and deeply recessed information.
- **Border Medium** (rgba(255, 255, 255, 0.08)): Used to separate regions and flat panels.

### Named Rules
**The Restrained Surface Rule.** The interface background is absolutely matte and flat. No gradients, no glassmorphism, no bright layered cards. The surface is just the canvas.

## 3. Typography

**Display Font:** Outfit (with system-ui fallback)
**Body Font:** Outfit (with system-ui fallback)
**Label/Mono Font:** JetBrains Mono (with monospace fallback)

**Character:** Clean, highly legible geometric sans paired with a strict, tabular monospace font for data points.

### Hierarchy
- **Body** (400, 14px, 1.5): Standard reading text for campaign details and messages.
- **Label** (500, 11px, 0.02em): Small, medium-weight caps or sentence-case for subheadings and metadata.
- **Mono** (400, 12px, tabular-nums): For counts, IDs, phone numbers, and structural data points.

### Named Rules
**The Data Certainty Rule.** Use `JetBrains Mono` and `tabular-nums` for all dynamic statistics, IDs, and counts. The operator must never guess a number's alignment.

## 4. Elevation

The system is flat by default. Surfaces do not lift off the page; they are separated strictly by 1px borders and slight background lightness shifts. Shadows are reserved purely for transient overlays (dropdowns, tooltips, modals) and are deep and tinted.

### Shadow Vocabulary
- **Transient Shadow** (`0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03)`): Used only for floating popovers, never for structural layout cards.

### Named Rules
**The Matte Desk Rule.** If it is a persistent layout element, it is flat. Shadows are only for things that can be dismissed.

## 5. Components

### Cards / Panels
- **Shape:** 14px radius (`var(--radius-md)`).
- **Background:** Flat `var(--bg-surface)` (#0a0a0e).
- **Border:** 1px solid `var(--border-medium)`.
- **Shadow Strategy:** None. Absolutely flat.

### Buttons / Actions
- **Shape:** 8px radius (`var(--radius-sm)`).
- **Primary:** Background `var(--accent)`, text white.
- **Hover:** Slight background shift, NO physical scaling or translation.

### Inputs / Textareas
- **Style:** 1px solid `var(--border-medium)`, background `rgba(255,255,255,0.04)`, 14px radius.
- **Focus:** 2px solid `var(--accent)`, background shifts to `var(--accent-muted)`.

### WhatsApp Preview
- **Style:** Native-matching WhatsApp bubble (#005c4b).
- **Tail:** Implemented via SVG, not CSS border hacks.

## 6. Do's and Don'ts

### Do:
- **Do** rely on subtle tonal contrast and single 1px borders to separate regions.
- **Do** make the primary workflow obvious on every screen size.
- **Do** use large touch targets (at least 44px) and visible focus states.
- **Do** keep campaign setup, message preview, and lead actions readable without visual noise.

### Don't:
- **Don't** use generic SaaS dashboard patterns or excessive card-in-card nesting.
- **Don't** use overly dark hacker-style visuals with neon glows and heavy shadows.
- **Don't** use glassmorphism (backdrop blurs with translucent backgrounds) on structural elements.
- **Don't** use a thick colored border on one side of a card (side-tab styling) as a decorative accent.
