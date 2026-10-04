# Changelog

## v2.1.0 — Pixel-Perfect Update

This update is a big push toward exports that match your Figma design pixel-for-pixel, plus some quality-of-life additions to the plugin panel.

### ✨ What's New
- **New `TXT` tag** — force any layer to export as a native TextLabel, so it's never turned into an image (handy for text layers that would otherwise get flattened).
- **`IMG BTN` tag now flattens** — just like the `IMG` tag, an Image Button now bakes its text and child layers into a single image, so buttons come through exactly as designed.
- **Resize the layer panel** — drag the divider next to the layer tree to make it wider. No more long layer names getting cut off.
- **Shift-click range select** — click one layer in the tree, then Shift-click another to select everything in between (just like Figma's layer list).
- **Outlines now scale with the screen** — strokes and text outlines stay the right thickness at any resolution instead of looking too thick or too thin when the screen size changes.

### 🐛 Bug Fixes
- Fixed images coming through **stretched or slightly deformed** — exports now match the exact bounds of the design, including shadows and outside strokes.
- Fixed **rounded corners being about twice as round** as in Figma.
- Fixed **panels and backgrounds showing up blank/black** when several layers shared the same name.
- Fixed **bars and colored fills turning grey or nearly invisible** on layers that used more than one fill (e.g. a color plus a gradient, or an overlay).
- Fixed **text appearing twice and slightly offset** when it sat inside an image layer.
- Fixed **mirrored/rotated icons showing the wrong direction** (e.g. an up arrow using the down arrow's image).
- Fixed a crash ("node does not exist") that could interrupt an export when the **same image was reused** across several layers.
- Fixed short **text labels rendering at inconsistent sizes** — labels now size uniformly and scale correctly on any screen.
- Fixed circles (ellipses) being **nudged off-center**.

### 🔧 Tweaks & Improvements
- Text outlines now use a cleaner corner style, removing the spiky edges that could appear on letters.
- The layer tree now **keeps its scroll position** after tagging, renaming, or expanding/collapsing — it no longer jumps back to the top.
- Selecting a layer on the Figma canvas (or clicking an element in the preview) now **scrolls the tree straight to that layer**, expanding it if it was hidden inside a collapsed group.
- Higher position precision for more accurate placement of elements.
- Reused images across multiple layers are now handled more reliably and only uploaded once.
