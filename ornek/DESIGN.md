# Design System Strategy: Medical Management Dashboard

## 1. Overview & Creative North Star
The visual identity of this design system is anchored in a concept we call **"The Clinical Curator."** 

In a high-stakes medical environment, cognitive load is the enemy. While traditional medical software is cluttered and rigid, this system adopts a **High-End Editorial** approach. We treat data with the same reverence a gallery curator treats art—giving every element breathing room, utilizing intentional asymmetry to guide the eye, and replacing harsh structural lines with soft tonal shifts. 

By prioritizing "intentional silence" (whitespace) and sophisticated layering, we create a tool that feels high-tech and efficient, yet remains human-centric and calming. We move beyond the "template" look by using a dual-font strategy: the architectural precision of **Manrope** for headlines and the functional clarity of **Inter** for data.

---

## 2. Colors & Tonal Depth
Our palette is rooted in a professional Deep Teal, balanced by a clinical, airy Blue-Gray. To maintain a premium feel, we strictly avoid "flat" design in favor of "chromatic depth."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. 
Boundaries must be created through:
- **Background Color Shifts:** Placing a `surface-container-low` (#f2f4f6) element against a `surface` (#f8f9fb) background.
- **Tonal Transitions:** Using depth and elevation rather than strokes to indicate containment.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
1. **Base Layer:** `surface` (#f8f9fb)
2. **Structural Sections (Sidebar/Nav):** `surface-container` (#eceef0)
3. **Primary Content Cards:** `surface-container-lowest` (#ffffff)
4. **Interactive Overlays:** Semi-transparent `surface-container-highest` with backdrop-blur.

### The Glass & Gradient Rule
To prevent the teal from feeling "heavy," use the **Signature Texture**:
- **CTAs & Heroes:** Apply a subtle linear gradient from `primary` (#00685d) to `primary-container` (#008376) at a 135-degree angle.
- **Floating Elements:** Use "Glassmorphism" for temporary states (like tooltips or flyouts). Use a 60% opacity version of the surface token combined with a `12px` backdrop-blur to allow underlying colors to bleed through softly.

---

## 3. Typography
We use a high-contrast typography scale to create a clear information hierarchy, blending a "humanist" display font with a "technical" body font.

- **Display & Headlines (Manrope):** These are our "Editorial" anchors. They should be used for page titles and high-level stats. Use `display-lg` to `headline-sm`. The wide apertures of Manrope convey a modern, high-tech authority.
- **Titles & Body (Inter):** The "Workhorse." Use `title-md` for card headings and `body-md` for all staff data. Inter’s tall x-height ensures maximum readability for medical IDs and shift times.
- **Labels (Inter):** Use `label-md` and `label-sm` in `on-surface-variant` (#3d4946) for secondary metadata, ensuring it recedes visually compared to primary data.

---

## 4. Elevation & Depth
In this system, depth is a functional tool used to signify importance and interactivity.

### The Layering Principle
Achieve a "soft lift" without heavy shadows. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural, crisp distinction that feels more premium than a shadowed box on a white background.

### Ambient Shadows
Shadows should feel like natural ambient light, not digital artifacts.
- **Token:** Use `on-surface` (#191c1e) at **4% to 8% opacity**.
- **Specs:** Large blur values (20px - 40px) with 0px or 4px Y-offset.
- **Tonal Tinting:** Ensure shadows are slightly tinted with the background hue to maintain a cohesive "atmospheric" feel.

### The "Ghost Border" Fallback
If accessibility requirements demand a border (e.g., in high-contrast modes), use a **Ghost Border**: the `outline-variant` (#bcc9c5) token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `xl` (1.5rem) roundedness.
- **Secondary:** `surface-container-highest` fill with `primary` text. No border.
- **States:** On hover, increase the gradient intensity. On press, use a subtle inner shadow to simulate physical depression.

### Staff Cards & Lists
- **Rule:** **Forbid dividers.** Use vertical whitespace (1.5rem - 2rem) or a subtle shift to `surface-container-low` on hover to separate staff members.
- **Layout:** Use asymmetric layouts within cards. Place the avatar (`rounded-full`) off-center to the left, with text grouped tightly to its right, leaving the right 30% of the card for "Status Chips."

### Status Indicators (Chips)
- **Active:** Background `primary-fixed` (#8df5e4) with `on-primary-fixed-variant` (#005048) text.
- **Urgent/Error:** Background `error-container` (#ffdad6) with `on-error-container` (#93000a) text.
- **Visual Style:** Use `full` (9999px) roundedness and `label-md` bold typography.

### Input Fields
- **Style:** "Soft Inset" style. Use `surface-container-highest` (#e0e3e5) with a `none` border and `md` (0.75rem) roundedness. 
- **Focus State:** Instead of a thick border, use a 2px `primary` "glow" (shadow) with 20% opacity.

---

## 6. Do’s and Don’ts

### Do
- **Do** use `xl` (1.5rem) corner radius for main dashboard containers to evoke a friendly, modern feel.
- **Do** lean into asymmetrical layouts for the Profile View, allowing the "Active Status" to float in the top right, detached from the main content grid.
- **Do** use `surface-bright` for the main canvas to keep the interface feeling energetic and clean.

### Don’t
- **Don't** use pure black (#000000) for text. Always use `on-surface` (#191c1e) to maintain a soft, premium contrast.
- **Don't** use standard 8px grid spacing for everything. Use exaggerated whitespace (32px, 48px, 64px) to separate major functional areas like the Staff List from the Detail Profile.
- **Don't** place primary teal text on a white background without checking contrast; favor `on-primary-fixed-variant` for high-readability teal elements.