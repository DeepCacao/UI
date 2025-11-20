Act as a senior frontend architect specialized in Next.js, Tailwind CSS, and minimalist (Swiss style) design systems.

My goal is to define a strict set of rules and patterns for developing landing page components. I want all components to follow a consistent, grid-based spacing system.

## Project Requirements
* **Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS 4.1.
* **Design Style:** Minimalist, clean, "Swiss Grid Design".

## The Layout Rule (CRITICAL)
The objective is to control all spacing at the *container* level, not the *element* level.
1.  **PROHIBITED:** It is strictly forbidden to use margin utilities (`m-`, `mx-`, `my-`, `mt-`, etc.) or space-between utilities (`space-x-`, `space-y-`) on any element.
2.  **MANDATORY:** All spacing between elements must be managed **exclusively** using the `gap` utility (e.g., `gap-4`, `gap-8`) applied to a parent container (using `flex` or `grid`).
3.  **Layouts:** All layouts must use CSS Grid (`grid`) and/or Flexbox (`flex`).