# Project Aletheia — Agent Notes

## Vision Snapshot
- Solo sci-fi detective roguelike set on the derelict U.S.S. Aletheia.
- Each run randomizes victim, killer, weapon/method, motive, and clue distribution to keep investigations fresh.
- Player immersion hinges on piecing together ambiguous evidence under escalating time pressure.

## Core Pillars
- **Replayable Cases:** Procedural case generator seeds every run with new role assignments, clue layouts, and fake vs. true motives.
- **Detective Immersion:** Clues demand interpretation; the notebook organizes data but never solves the mystery for the player.
- **Constant Momentum:** Exploration always reveals a lead, log, or room to chase next; no dead-time.
- **Time-Driven Tension:** Oxygen and system stability degrade across secure → unstable → critical phases, pushing decisions.
- **Meaningful Forks:** Safe corridors vs. risky shortcuts, evidence focus vs. motive digging, early accusation vs. extended inquiry.

## Gameplay Loop Essentials
1. **Explore** eight interconnected rooms (Bridge, Medbay, Kitchen, Engineering, Hydroponics, Maintenance, AI Core, Quarters) via safe corridors or hazardous shafts.
2. **Discover** victim and evidence, especially the body sample needed for Medbay autopsy.
3. **Analyze** collected clues inside the notebook split by Method/Motive categories.
4. **Accuse** a crew role from the Bridge console using your assembled theory.
5. **Resolve** with either a correct accusation (win), or a critical-phase escape/hunt rush if wrong.

- **Notebook Tabs:** Method vs. Motive cards auto-sorted and reviewable at any time.
- **Motive Axes:** Romantic, Professional, Ideological, Criminal, Psychological; only one is correct per run, others act as red herrings.
- **Weapon/Method Categories:** Knife, Blunt, Poison, Fire, Gun, Decompression, Acid, Electrocution; autopsy reveals category only.
- **Time Phases:** Secure (safe), Unstable (vents risky, lights flicker), Critical (rapid oxygen loss forcing resolution).
- **Accusation Outcomes:** Correct = success; Wrong = oxygen crunch with choice to flee or hunt via Bridge console overlay.
- **Clue Placement:** Victim computers store innocence logs, suspect computers can contain motive/innocence evidence, and lockers store weapon-category clues that must be inspected to log them in the journal.

## Content & Data Model Guidelines
- Represent runs with a case-seed object containing roles, victim, killer, murder room, weapon, true motive, false motives, clue packs, and phase timings.
- Maintain clear mappings: each crew role ties to a primary room, typical weapon access, and log types to feed clue generation.
- Store clue definitions (room, type, description) so placement logic can mix guaranteed leads with flavor misdirection.
- Villain flow: chance to escape inner corridors scales with O2 dropping below 90%. When escaped, villain roams perimeter; AI Core lockdown resets villain to the inner ring and applies an escape lockout. Villain movement/pathing is door-aware (cannot open closed doors).
- Inner corridor caches: 20 deterministic caches placed on inner fast-lane cells (non-perimeter), each giving credits (20–30) with small chances of energy/oxygen.
- Villain flow: chance to escape inner corridors scales with O2 dropping below 90%; when escaped, villain roams perimeter; AI Core lockdown resets villain to inner ring and applies an escape lockout timer.

## Implementation Priorities (MVP)
1. Movement across rooms with safe vs. unsafe paths.
2. Interactive clues collectible into the notebook (include locker/computer logs).
3. Notebook UI that separates Method/Motive evidence with manual status toggles.
4. Medbay autopsy flow returning method category and logging it once identified.
5. Oxygen/time management driving phase shifts.
6. Bridge accusation interface with success/failure logic and visible console.
7. Critical-phase escape/hunt state after wrong accusation.
8. Procedural case generator to randomize each loop, including motive/innocence/weapon evidence placement.

### Upcoming Engineering Tasks
- Route all pointer/click events through a buffered `gameState.input` queue so interactions resolve during the main update tick instead of DOM timing.
- Derive prop/keycard generation from a stored case seed (including RNG state) so runs are deterministic and replayable.
- Keep collision masks in sync with live prop state—either dynamically flip grid cells when props change or query prop occupancy alongside `gridState`.
- Villain escape/lockdown loop: O2-driven escape into perimeter, AI Core lockdown to reset villain to inner ring with lockout; ensure door-aware movement (villain never opens doors, blocked by closed states).
- Inner caches: 20 deterministic caches on inner fast-lane cells with credits (20–30) + small chances of energy/oxygen; keep placement trait/grid-driven.
- Add seeded RNG wrapper for villain escape rolls, perimeter targeting, and loot so runs replay identically.
- Make LoS aware of dynamic doors/props during chase/escape.

### Things to Implement Later
*(Low-priority improvements that would increase robustness but aren't critical)*

**Red Herring Door Log Placement (doorLogState.js:120-141)**
- **Current:** Uses retry loop (up to 100 attempts) to place red herring "inside 8h window but outside 4h window". Has console.error fallback if placement fails.
- **Issue:** Probabilistic approach with edge case fallback that doesn't guarantee correct placement (though probability of failure is ~10^-30).
- **Better Solution:** Calculate non-overlapping ranges explicitly:
  ```javascript
  const findGapBetweenWindows = (window8h, window4h) => {
    // Calculate portions of 8h window NOT in 4h window
    // Handle midnight wrapping correctly
    // Return array of valid time ranges
  };
  const gaps = findGapBetweenWindows(window8h, window4h);
  const randomGap = gaps[Math.floor(Math.random() * gaps.length)];
  const redHerringTime = randomTimeBetween(randomGap.start, randomGap.end);
  ```
- **Effort:** 30-40 minutes (need to handle midnight wrapping edge cases)
- **Priority:** LOW - current implementation works fine in practice, fallback includes diagnostic logging

**Seeded RNG Conversion**
- **Current:** Heavy use of `Math.random()` throughout caseState.js, timeWindowState.js, doorLogState.js prevents deterministic/replayable runs.
- **Better Solution:** Hash-based randomness like weaponTestingState.js uses
- **Effort:** High (would require refactoring case generation)
- **Priority:** MEDIUM - needed for deterministic runs, but not blocking current gameplay

### System Design Guideline
- Route every major interaction through a single helper (e.g., hacking, vending pricing, lockpicking). These gate functions read the current state and expose deterministic controls (like "Use Virus" buttons) so cheats/testing toggles can add modifiers without permanently mutating game data. Keeping these gates centralized ensures new upgrades and testing tools layer cleanly without scattering special cases across the codebase.

### Collaboration Preferences
- For large or multi-layered features, don’t jump straight into implementation. First, pause to reason through the requirements, propose the architecture (functions, state, modules to touch), and confirm it aligns with the project’s declarative/state-driven philosophy before writing code. This keeps future changes predictable and aligns with the way I like to iterate.
  
### Notes from Recent Implementation
- Track `player.lastMoveDirection` for any directional logic (e.g., taser arcs, future cones) so abilities remain deterministic even when the player is stationary.
- Treat unique upgrades (taser, future tools, Efficient Hack, Fast Lockpick, Skeleton Key) as stateful flags rather than inventory items and reflect ownership in vending UI to avoid duplicate purchases.
- Testing mode auto-enables key upgrades (Efficient Hack, Fast Lockpick, Skeleton Key) for rapid iteration.
- Vending stock can include rare upgrades (e.g., Skeleton Key) based on RNG; rare flags determine appearance per run.
- HUD includes a “View Upgrades” overlay; all overlays (hacking, lockpick, accusation, upgrades) follow the same state-driven hitbox pattern.
- Villain notice/accel: on first detect, villain pauses and animates a jump (config-driven), then ramps chase speed over a short accel window.
- Pathfinding: chase uses door-aware BFS steps; add stuck detection/fallback to roaming when targets are blocked by closed doors, invoking the same state transitions (enter lost state or escaped roam) so behavior stays consistent.

### Upcoming Engineering Tasks
- Route all pointer/click events through a buffered `gameState.input` queue so interactions resolve during the main update tick instead of DOM timing.
- Derive prop/keycard generation from a stored case seed (including RNG state) so runs are deterministic and replayable.
- Keep collision masks in sync with live prop state—either dynamically flip grid cells when props change or query prop occupancy alongside `gridState`.
- Tune villain escape + lockdown loop: escaped state roams perimeter corridors after an O2-driven escape chance; AI Core lockdown resets villain to inner ring and applies a lockout timer.
- Add seeded RNG wrapper for villain escape rolls and perimeter targeting so runs replay identically.
- Make LoS aware of dynamic doors/props during chase/escape.

## Engineering Preferences
- Favor many tiny, single-purpose functions (≈5 lines or fewer) over monolithic routines for readability.
- Centralize tunable values (walk speed, oxygen drain rates, phase triggers, etc.) in shared state/config so tweaks propagate globally.
- Keep modules declarative where possible: data tables + lean functions that consume state/config to produce outcomes.

## Implementation Style Notes
- Maintain a single authoritative `gameState` object (grid, rooms, doors, items, player, UI). Treat the screen as a pure projection of that state every frame.
- Drive collision, rendering, AI, and future hazards from the same grid mask; cells carry explicit enums (wall, floor, door, item, etc.) so everything mutates the same data.
- Avoid geometry math scattered across modules: use shared world↔grid helpers, and keep door/room data cached in state to prevent duplication.
- Keep doors, items, and future hazards state-driven; visuals should reflect state rather than manage gameplay indirectly.
- **Grid-Driven Layout:** Every corridor, room, connector, and future feature is described by tagging cells in a shared layout grid. Rendering, collision, AI, and prop placement must derive from those tags so nothing drifts out of sync.
- **Terminology:**
  - **Outer Hallway** – the green square of corridors the rooms connect to (corridor entries tagged as `type: 'perimeter'`).
  - **Central Inner Maintenance Corridors** – the dangerous fast lanes that form the inner grid across the central square (corridor entries tagged as `type: 'fast_lane'`).
  - **Vents** – the purple ring running behind the rooms (exported as `mapState.vents` and tagged via `CellType.VENT`).
  - These corridor/vent categories are available both as world rectangles (`mapState.corridors`/`mapState.vents`) and as carved cell masks (`gridState.cells`, `mapState.ventCells`) so movement, rendering, and spawning stay in sync.
- **Module initialization order:** keep helper declarations (functions/constants) above any top-level code that uses them so we avoid temporal-dead-zone errors when the module is evaluated.

## Temporary Implementations
*(These are stopgap solutions to facilitate testing; they should be revisited when the full systems arrive.)*
- **Crew Identity Discovery:** Keycards and computer searches currently flip a flag that reveals an NPC’s name and highlights their journal tab. This is a provisional shortcut until the broader clue/evidence loop is built out.
- **Killer Proof Item:** The murderer’s locker always spawns a generic “Incriminating Evidence” item that marks them as the killer when collected. It’s a temporary win-condition proxy ahead of nuanced motive/method deduction.
- **Keycard Prop Highlighting:** (Removed) props no longer glow by default; use the Keycard Locator upgrade to surface keycard containers.

## Notes from Current Implementation
- Victim computers now spawn scripted “Death Threat” evidence pointing to three suspects (always including the killer). Collecting a threat marks that role as a suspect (yellow tab).
- Suspect terminals spawn either “Clean Alibi” (non-killer) or “Incriminating Evidence” (killer). Clean alibis mark a role as cleared (green tab); incriminating evidence flips the role to killer (red tab).
- `player.upgrades` tracks gameplay modifiers. Current upgrades:
  - **Keycard Locator:** highlights any prop containing a keycard (no more per-locker debug highlight).
  - **Faster Hack:** halves all hacking intervals once purchased (reflected on the HUD with a ⏩ icon).
- Journal tabs are color-coded by `entry.status`: victim (white), suspect (yellow), cleared (green), killer (red), unknown (blue-grey). Status strings are now authoritative for both color and dossier text.

## Role Reference
- Captain (Bridge) — Methods: Baton (blunt), Sidearm (impact)
- Medic (Medbay) — Methods: Sedatives (poison), Scalpel (stab)
- Cook (Kitchen) — Methods: Knife (stab), Rat Poison (poison)
- Engineer (Engineering) — Methods: Wrench (blunt), Life Support Override (oxygen loss)
- Farmer (Hydroponics) — Methods: Fertilizer (poison), Shears (stab)
- Janitor (Maintenance) — Methods: Hammer (blunt), Solvent (poison)
- AI Core (AI Core) — Methods: Life Support Override (oxygen loss), Internal Defenses (impact)
- Counselor (Quarters) — Methods: Defense Rifles (impact), Pillow Strangulation (oxygen loss)

Each body scan reveals the broad category first (blunt, impact, poison, stab, oxygen loss). A secondary scan—unlocked after finding corroborating evidence—reveals the exact weapon.
