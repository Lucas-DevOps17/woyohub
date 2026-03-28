# Design System Specification

## 1. Overview & Creative North Star: "The Intellectual Ascent"
This design system rejects the cluttered, "dashboard-heavy" aesthetic of traditional Learning Management Systems. Instead, it adopts the Creative North Star of **"The Intellectual Ascent."** 

The experience is designed to feel like an editorial gallery of one's own mind. We achieve this through **high-contrast typography scales**, **intentional asymmetry**, and **layered depth**. By breaking the rigid 12-column grid with overlapping elements and generous whitespace, we create a "tech-forward" environment that feels premium, calm, and deeply motivating. We don't just track data; we curate progress.

---

## 2. Color Strategy & Surface Logic
The palette moves beyond flat fills, utilizing a sophisticated spectrum of indigos and emeralds to represent the transition from "Focus" to "Growth."

### Core Palette
*   **Primary (Focus):** `primary (#0049db)` — Used for the core mental "work" and primary actions.
*   **Secondary (Momentum):** `secondary (#4355b9)` — Used for navigation and supportive interactive elements.
*   **Tertiary (Achievement):** `tertiary (#006631)` — Reserved for milestones, XP gains, and completion states.

### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** To define boundaries, designers must use background tonal shifts. For example, a global `background (#faf8ff)` page should contain sections in `surface_container_low (#f3f2ff)`. This creates a seamless, organic flow that mimics high-end editorial print.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent layers:
1.  **Base:** `surface` (#faf8ff)
2.  **Sectioning:** `surface_container_low` (#f3f2ff)
3.  **Active Cards:** `surface_container_lowest` (#ffffff)
4.  **Overlays/Modals:** `surface_bright` with Glassmorphism.

### The "Glass & Gradient" Rule
To convey "progression," use subtle linear gradients (135°) transitioning from `primary (#0049db)` to `primary_container (#2962ff)`. Use `backdrop-blur` (12px–20px) on floating navigation bars to allow the vibrant colors of progress charts to bleed through.

---

## 3. Typography: The Editorial Voice
We use a dual-typeface system to balance technical precision with human accessibility.

*   **Display & Headlines (Manrope):** This is our "Brand Voice." It is bold, geometric, and authoritative. Use `display-lg` (3.5rem) for massive achievement milestones to make the user feel the weight of their growth.
*   **Body & Labels (Inter):** This is our "Utility Voice." It is highly legible even at small sizes (`label-sm` 0.6875rem), ensuring that complex course metadata remains accessible.

**Key Rule:** Never center-align long-form text. Maintain a strong left-aligned axis to create an "Editorial Column" feel, utilizing the `spacing-24` scale for dramatic margins.

---

## 4. Elevation & Tonal Depth
In this system, depth is a function of light and layering, not heavy drop shadows.

*   **The Layering Principle:** Achieve lift by stacking. Place a `surface_container_lowest` card atop a `surface_container` background. The subtle shift in hex code provides enough contrast for the human eye without visual "noise."
*   **Ambient Shadows:** For floating elements (e.g., a "Start Learning" FAB), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 73, 219, 0.06)`. Note the tint—shadows should pull from the `on_surface` color, never pure black.
*   **The "Ghost Border" Fallback:** If a container requires definition against an identical background, use a 1px stroke of `outline_variant` at **15% opacity**.

---

## 5. Signature Components

### Cards (The Progression Vessel)
*   **Styling:** Radius `xl (1.5rem)`. No borders.
*   **Layout:** Use asymmetrical padding. Top-heavy titles with `headline-sm` and ample bottom whitespace for the progress bar.
*   **Interaction:** On hover, the card should scale (1.02x) and transition from `surface_container_low` to `surface_container_lowest`.

### Progress Indicators
*   **The Signature Gradient:** Use a gradient from `tertiary (#006631)` to `tertiary_fixed (#62ff96)` for progress bars.
*   **Forbid Dividers:** Do not use horizontal rules. Separate course modules using `spacing-6` (2rem) of vertical whitespace.

### Buttons
*   **Primary:** High-gloss `primary` fill. Radius `full (9999px)` for a modern, tech-forward feel.
*   **Secondary:** Glassmorphic. Semi-transparent `primary_fixed_dim` with a 20px blur.
*   **States:** On press, the button should "sink" (0.98x scale) rather than just changing color.

### Achievement Chips
*   **Styling:** Use `tertiary_container` for the background and `on_tertiary_container` for text.
*   **Visuals:** Always accompany with a high-fidelity icon (e.g., a 3D-rendered gold medal or a crisp SVG streak icon).

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Whitespace:** If a layout feels "empty," add more space, not more elements.
*   **Use Tonal Transitions:** Transition the background color of the page as the user moves deeper into a course (e.g., getting darker/richer as they approach completion).
*   **Asymmetric Grids:** Offset images or charts by `spacing-4` to create a dynamic, custom feel.

### Don’t:
*   **No 1px Solid Borders:** Never use `#CCCCCC` or standard grey borders to separate content.
*   **No Standard Shadows:** Avoid the "fuzzy grey" shadow. Use the ambient tinted shadow logic.
*   **No Generic Icons:** Avoid generic "Folder" or "File" icons. Use platform-specific branding (YouTube, Coursera) to maintain a premium, integrated feel.
*   **No Crowding:** Do not place text within `spacing-1` of a card edge. Minimum internal padding for cards is `spacing-4`.