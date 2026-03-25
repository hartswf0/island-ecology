# BEE_SNAKE → BEES ON A TRAIN: Structural Bridge

How the BEE_SNAKE raw material maps onto and extends the existing BEES ON A TRAIN project.

---

## The Two Lineages

| Layer | BEES ON A TRAIN (existing POML) | BEE_SNAKE (raw.md) |
|---|---|---|
| **Genre** | Covert ops / intelligence infrastructure / hive-as-espionage-metaphor | Eco-thriller / speculative fiction / hive-as-literal-organism |
| **"Hive"** | The Beekeeper Hierarchy — human command structure using apiculture as cover | The Gestalt Swarm — bio-engineered insects that physically overwrite machinery |
| **Vessel** | Distributed (safehouses, tarmacs, server farms, penthouses) | Enclosed linear vessel (plane → train → submarine → space elevator) |
| **Fuel** | Institutional betrayal, dormant weapons, jurisdictional conflict | Environmental metamorphosis, containment failure, resource depletion |

---

## Structural Bridge: How BEE_SNAKE Feeds BEES ON A TRAIN

### 1. The Enclosed Ecosystem Thriller Engine as a Twine Branch Layer
The BEE_SNAKE corpus produces a reusable **Twine Cinema Genome** format. This can be ingested by `twine-bridge.html` to:
- Convert each "Passage" in the Twee source into a spatial node
- Map state variables (`$cabin_temp`, `$gestalt_sync`) to Delaunay affinities
- Use the branching film blueprint as the skeleton for the World Text sidebar

### 2. Mapping BEE_SNAKE Scenes to Existing POML Worlds
The existing 12 POML world files (`00.md`–`11.md`) describe espionage infrastructure. The BEE_SNAKE material literalizes the "hive" metaphor. These can be fused:

| BEE_SNAKE Scene | Maps to POML World | Bridge Logic |
|---|---|---|
| "The Dining Car Barricade" (hub) | `SmolderingHiveFrame` (catalyst) | The barricade = the destroyed hive frame that triggers reactivation |
| "The Engine Core" (climax) | `AnisetteTerminal` (cyber-command) | The corrupted train AI = the hacked intelligence terminal |
| "The Wax Wall" (gate) | `FalseBottomHoneyCentrifuge` (concealment) | Organic wax sealing doors = the false bottom concealing the arsenal |
| "The Hallucination" (gestalt sync) | `AudioRecordingCommandDirective` (betrayal) | The Gestalt's voice = the recorded directive turning the system against its protector |
| "The Spacewalk" (EVA) | `RooftopHelicopterExtractionPoint` (threshold) | Exterior exposure at extreme altitude/speed = contested extraction threshold |

### 3. New Data Products for `data.js`
The BEE_SNAKE material can generate new POML world entries to add to `data.js`:
- **MaglevApiary** — The Aethelgard train as a world
- **TartarusDeepTubes** — The subterranean derelict as a world
- **GestaltQueenCPU** — The bio-mechanical train AI as an entity

### 4. The Operative Prompt as a World Generator
The "Enclosed Ecosystem Thriller Engine" operative prompt (Pair 3) can be used as a *recursive world generator*:
- Feed it each existing POML world as a "[Confined Vessel]"
- It will produce branching Twine scenes that expand the world's narrative potential
- Output goes straight into `twine-bridge.html` via the spatial node system

### 5. The `$gestalt_sync` Mechanic as a UI Feature
The deepest BEE_SNAKE layer (Pair 7) describes a mechanic where **the UI itself betrays the player**. This can be implemented in `twine-bridge.html`:
- At low sync: normal interface
- At medium sync: node labels start shifting, percentages become "empathetic"
- At high sync: the sidebar text rewrites itself, choices rename

---

## Recommended Next Steps

1. **Convert Twee Source to POML worlds** — Parse the SugarCube passages from Pairs 1, 2, 5, 6, 7 into POML `world {}` blocks compatible with `data.js`
2. **Feed into Twine Bridge** — Load the new worlds into `twine-bridge.html` for spatial visualization
3. **Implement Gestalt Sync** — Add the UI-betrayal mechanic as an optional mode in the bridge
