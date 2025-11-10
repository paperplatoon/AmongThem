# Layout System

- The ship layout is defined on a cell grid. Each cell is tagged as wall, corridor (perimeter, center, connector), room interior, or vent.
- Rendering, collision, AI, props, and interactions derive their world rectangles from these tags, ensuring the layout seen on screen always matches movement rules.
- Center corridors form a fixed grid inside the main square; connector corridors are tagged to line up exactly with room doors.
- When adding new geometry (center spokes, maintenance vents, future hazards), tag cells first and let the renderer/collision consume those tags—no hand-tuned pixel offsets.
