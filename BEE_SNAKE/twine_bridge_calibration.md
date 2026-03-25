# Twine Bridge Calibration: The BEE_SNAKE Framework Applied

The BEE_SNAKE corpus produced three reusable systems: **Fuel**, **Engine**, and **Shock Absorber**. Below, each is mapped directly onto the navigational fuel-burn experience flow of `twine-bridge.html`.

---

## 1. THE FUEL — What Burns Inside the Bridge

**BEE_SNAKE definition**: The most reusable energy in the input — recurring tensions, motifs, constraints, obsessions.

**In `twine-bridge.html`**: The FUEL is the **POML world text** loaded from `data.js`. Each node carries a world's compressed narrative energy. The bridge doesn't generate from nothing — it **burns existing world material** through operators.

| BEE_SNAKE Fuel Concept | Bridge Equivalent | Code Location |
|---|---|---|
| Recurring Tensions | `buildCtx()` — spatial neighbors bleed context into each generation | Line ~1785 |
| Carryover Entities | Node `.text` and `.ctx` — the raw world content carried forward | `mkNode()` line 2389 |
| Atmospheric Pressure | `OPS[key].sys` — each operator's system prompt applies a specific epistemic pressure | Lines 1273–1307 |
| Fuel Extraction | `fireTo()` → `runOp()` — the act of "aiming" one node at another extracts the combinatorial fuel | Lines 2370–2478 |

### Calibration Principle
> **The bridge is a refinery, not a factory.** It does not invent material. It combusts the tension between adjacent worlds. The quality of the output is bounded by the density of the fuel (world text) and the precision of the operator (system prompt).

---

## 2. THE ENGINE — The Combustion Cycle

**BEE_SNAKE definition**: The smallest generative system that can repeatedly turn fuel into good outputs.

**In `twine-bridge.html`**: The ENGINE is the **aim → fire → fork → place → recompute** cycle.

```
SELECT node (fuel source)
  → AIM via shift+drag (choose operator + target)
    → FIRE (fireTo: shootArr → hapHit → runOp)
      → COMBUST (runOp: buildCtx injects neighbor fuel + OPS[key].sys applies pressure)
        → FORK (LLM generates 2–4 new passages)
          → PLACE (new nodes positioned radially around target)
            → RECOMPUTE (computeV → Delaunay recalculates → new affinities emerge)
              → SETTLE (physics tick → nodes drift → new spatial context forms)
```

### The 3 State Variables (from BEE_SNAKE Engine Schema)

| BEE_SNAKE Variable Pattern | Bridge Implementation | Current State |
|---|---|---|
| **Agent Growth** (spore count, colony mass, cabin temp) | **Node count** (`nodes.length` displayed in `#sN`) | Tracked ✓ |
| **Vessel Integrity** (hull, tether, barricade) | **Spatial coherence** — how meaningful the Delaunay affinities are as node density changes | **Not tracked** — candidate for new mechanic |
| **Player Contamination** (venom, sync, toxin) | **Operator heat** (`usageCount` → heat bar in quiver) | Tracked ✓, but passive |

### Calibration Principle
> **The engine's clock is spatial, not temporal.** Unlike BEE_SNAKE's vessels (planes, trains, submarines) where the clock is the trajectory, the bridge's clock is **node density**. As more forks are generated, the Delaunay mesh becomes denser, affinities shift, and the semantic neighborhood compresses. This is the bridge's version of "the swarm expanding."

---

## 3. THE SHOCK ABSORBER — Handling Messy Input

**BEE_SNAKE definition**: The interpretive layer that prevents messy input from breaking the engine.

**In `twine-bridge.html`**: The SHOCK ABSORBER is the **`buildCtx()` function + the OPS system prompt layer**.

| BEE_SNAKE Absorber Rule | Bridge Mapping |
|---|---|
| "If input is too broad, extract underlying physics" | `buildCtx()` reduces all neighbor relationships to a single `pct` affinity score |
| "If contradictory, assign to different systems" | Multiple OPS categories (Reveal, Structure, Manipulate, Meta) let contradictory intents coexist |
| "Merge antagonist biology with setting engineering" | `spCtx` string appends spatial neighbor context to the operator's system prompt — world content merges with epistemic pressure |
| "Ask for clarification only if fundamentally incompatible" | The bridge **never asks** — it fires and absorbs the result. Draft/Try mode is the only safety valve |

### What's Missing (Calibration Gap)
The bridge currently has **no stabilization for fuel quality**. If a node's `.text` is empty or generic, `buildCtx()` still injects it as spatial context, diluting the generation. The BEE_SNAKE framework prescribes:
- **Noise separation**: Tag low-energy nodes so they reduce their influence on neighbors
- **Contradiction preservation**: When two neighboring nodes carry opposing tensions, amplify that in the system prompt rather than averaging it away

---

## 4. THE NAVIGATIONAL FUEL BURN — The User's Experience Path

Mapping the BEE_SNAKE 3-Act progression onto how a user actually navigates the bridge:

### Act I: Ignition (Discovery)
- User loads POML worlds → initial nodes placed spatially
- User browses the **Intelligent Quiver** → selects an operator
- First `fireTo()` call → first fork generation
- **BEE_SNAKE parallel**: "The AC fails in Car 4; a sweet heavy smell fills the vents" — the first sign that the world is alive

### Act II: Combustion (Expansion)
- Repeated fire cycles → node count grows → Delaunay mesh densifies
- `buildCtx()` starts injecting rich spatial context → generations become increasingly cross-contaminated by neighbors
- Operator **heat bars** rise → the quiver becomes a visible fuel gauge
- User begins **pruning** (removing nodes) and **rearranging** (dragging) to control the narrative ecology
- **BEE_SNAKE parallel**: "The swarm generates heat. The wax seals the doors." — the environment is being rewritten by the process

### Act III: Convergence (Saturation)
- The graph reaches a density where every new fork is deeply inflected by its neighbors
- The **World Text sidebar** becomes a dense narrative log — a chronicle of the entire exploration
- The user shifts from generating to **reading and accounting** — entering Document Mode
- **BEE_SNAKE parallel**: "The Queen is the CPU. The train is the hive." — the bridge has become the story

---

## 5. IMMEDIATE CALIBRATION ACTIONS

These are concrete adjustments to `twine-bridge.html` that would bring it into alignment with the BEE_SNAKE framework:

1. **Fuel Quality Indicator**: Add a visual cue (opacity, border weight) to nodes based on their `.text` length/density, so the user can see which nodes are "high-octane" vs. "fumes"
2. **Spatial Coherence Meter**: Track the average Delaunay edge length. As density increases, display a "mesh pressure" readout — the bridge's equivalent of `$cabin_temp`
3. **Contradiction Amplifier in `buildCtx()`**: When two neighbors have opposing operator types (e.g., SURFACE vs. PLAY), inject that tension explicitly into the system prompt
4. **Operator Burnout**: After an operator's `usageCount` crosses a threshold, its effectiveness drops (system prompt gets diluted) — forcing the user to switch operators, mimicking the BEE_SNAKE resource depletion mechanic
