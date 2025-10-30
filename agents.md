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

## Key Systems to Preserve
- **Notebook Tabs:** Method vs. Motive cards auto-sorted and reviewable at any time.
- **Motive Axes:** Romantic, Professional, Ideological, Criminal, Psychological; only one is correct per run, others act as red herrings.
- **Weapon/Method Categories:** Knife, Blunt, Poison, Fire, Gun, Decompression, Acid, Electrocution; autopsy reveals category only.
- **Time Phases:** Secure (safe), Unstable (vents risky, lights flicker), Critical (rapid oxygen loss forcing resolution).
- **Accusation Outcomes:** Correct = success; Wrong = oxygen crunch with choice to flee or hunt.

## Content & Data Model Guidelines
- Represent runs with a case-seed object containing roles, victim, killer, murder room, weapon, true motive, false motives, clue packs, and phase timings.
- Maintain clear mappings: each crew role ties to a primary room, typical weapon access, and log types to feed clue generation.
- Store clue definitions (room, type, description) so placement logic can mix guaranteed leads with flavor misdirection.

## Implementation Priorities (MVP)
1. Movement across rooms with safe vs. unsafe paths.
2. Interactive clues collectible into the notebook.
3. Notebook UI that separates Method/Motive evidence.
4. Medbay autopsy flow returning method category.
5. Oxygen/time management driving phase shifts.
6. Bridge accusation interface with success/failure logic.
7. Critical-phase escape/hunt state after wrong accusation.
8. Procedural case generator to randomize each loop.

## Engineering Preferences
- Favor many tiny, single-purpose functions (≈5 lines or fewer) over monolithic routines for readability.
- Centralize tunable values (walk speed, oxygen drain rates, phase triggers, etc.) in shared state/config so tweaks propagate globally.
- Keep modules declarative where possible: data tables + lean functions that consume state/config to produce outcomes.

