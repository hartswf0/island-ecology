# Twine Bridge: Epistemic Operator Interface

A spatial instrument for navigating, forking, and compiling narrative worlds.

---

## What This Is

Twine Bridge is a canvas-based interface where **narrative text becomes spatial topology**. You load structured world data (written in WorldText), place it on a Voronoi canvas, and operate on it with LLM-powered analytical instruments to generate, fork, compile, and decompose narrative structures.

It is not a text editor. It is not a chatbot wrapper. It is a **world compiler** — a tool for turning raw narrative into typed, navigable, operable structure.

The core thesis: **narrative is not linear text. It is a graph of entities, locations, relations, states, and events. The interface should make that graph visible and manipulable.**

---

## The Stack

```
WorldText (DSL)          → The language worlds are written in
  ↓
data.js (228 worlds)     → Parsed POML world entries
  ↓
Voronoi Canvas           → Spatial layout with physics + edges
  ↓
Operators (LLM prompts)  → Fork, Surface, Zoom, Limits, etc.
  ↓
Inspector Cards          → Per-section text with Spawn/Fork/Copy
  ↓
WorldText Compiler (/wt) → Any text → back to typed W/L/E/S nodes
```

---

## WorldText: The Source Language

Every world is written in WorldText, a declarative DSL:

```
world <AgriDyneBreach> {

  meta {
    genre: "catastrophic science fiction"
    description: "The exact point where pollinator drones
                  overwrote their safety constraints."
  }

  locations {
    location <LockedServerRoom> {
      description: "AgriDyne Robotics, Level -3, Geneva"
      coordinates: "46.2044° N, 6.1432° E"
    }
  }

  entities {
    entity <PollinatorDrones> : autonomous_swarm {
      traits: [experimental, adaptive_learning]
      location: <LockedServerRoom>
    }
    entity <SafetyConstraints> : software_module {
      traits: [security_protocol]
    }
  }

  relations {
    rel [overwrote](<PollinatorDrones> -> <SafetyConstraints>)
  }

  states {
    state <SafetyConstraints.active> = false
    state <PollinatorDrones.network_access> = unrestricted
  }

  events {
    event <ProtocolOverride> {
      actors: [<PollinatorDrones>, <SafetyConstraints>]
      effects: [<SafetyConstraints.active> = false]
    }
  }
}
```

**WorldText is not YAML, JSON, or Markdown.** It uses:
- `<AngleBrackets>` for named entities and locations
- `[SquareBrackets]` for typed relations (verbs)
- Directed morphisms: `<A> -> <B>` for causal/structural links
- Dot notation for state properties: `<Entity.property> = value`

The 228 worlds in `data.js` are all written in this format. Each file (`00.md` through `11.md`) contains ~20 worlds that form a continuous narrative across timeline phases.

---

## WLES Type System

Every node on the canvas has a type. The WLES system classifies nodes into four fundamental categories:

| Filter | Type | Internal Op | What It Represents |
|--------|------|-------------|-------------------|
| **W** | World | `site` | Root narrative containers. A world is a self-contained scene with its own location, cast, and mechanics. |
| **L** | Location | `inverter` | Spatial or structural nodes. Physical places, environments, containment regions. |
| **E** | Entity | `aphorist` | Characters, objects, forces, creatures, concepts, systems — discrete things that exist and act. |
| **S** | State | `analyst` | Properties, conditions, values — measurable attributes of entities or worlds. |

The filter bar (`All | W | L | E | S`) isolates visibility to one type. When you use `/wt` (WorldText compiler), generated nodes are automatically assigned WLES types.

---

## Operators

Operators are LLM-powered analytical instruments. Each takes a source node's text and produces structured output through a specific analytical lens.

### Generation Operators

| Operator | Key | What It Does |
|----------|-----|-------------|
| **FORK** | `/fork` | Generates 3 branching narrative paths. Each fork diverges on a different axis: spatial, temporal, or causal. |
| **HONEY** | `/honey` | Deep single-path elaboration. Takes the source text and produces a dense, extended continuation. |

### Analytical Operators

| Operator | Key | What It Does |
|----------|-----|-------------|
| **SURFACE** | Aim+fire | Traces hidden causal chains between entities. Maps event sequences and relations not visible from names alone. |
| **LIMITS** | Aim+fire | Finds narrative bottlenecks — entities that concentrate the most relations, chokepoints where story flow narrows. |
| **MODES** | Aim+fire | Identifies parallel storylines. Which entities appear in multiple threads? Which events unfold independently? |
| **MANIP** | Aim+fire | Traces action→reaction chains. For each entity action: what event triggers? What state changes? |
| **ZOOM** | Aim+fire | Decomposes world hierarchy. Level 1: genre. Level 2: entity groups. Level 3: individual states and events. |
| **PLAY** | Aim+fire | Identifies counterfactuals. What if a key entity is removed? What cascades? What becomes impossible? |
| **HOLISTIC** | Aim+fire | Full world audit. Entity census, relation graph, event timeline, state inventory, bottleneck analysis. |

### Compilation Operators

| Operator | Key | What It Does |
|----------|-----|-------------|
| **WorldText** | `/wt` | Compiles any raw text into typed WLES nodes. Sends text through the WorldText Generator prompt, parses the output, and creates properly-typed nodes on the canvas. This is the bridge between unstructured narrative and structured world data. |

### Using Operators

**REPL commands:** Type `/fork`, `/honey`, or `/wt` in the bottom panel. These operate on the currently selected node.

**Aim mode:** Click `⊙ Aim` in the toolbar (or use the command palette). Then shift+drag from a source node to a target node. The operator fires from source → target.

**Inspector buttons:** Select any node → the side panel shows its inspector card with `⑂ Fork`, `🍯 Honey`, and `⟩ WorldText` buttons.

**Section-level:** Click any section in a completion → action bar with `⊙ Spawn`, `⑂ Fork`, `Copy`, `⟩WT`.

---

## The Canvas

The left panel is a Voronoi-tessellated canvas. Each node occupies a cell. The spatial layout carries meaning:

- **Proximity = narrative affinity.** Nodes that are close share spatial context. Each operator receives the nearby nodes as additional context.
- **Edges = explicit connections.** Parent→child relationships from forking, world loading, and manual `/connect`.
- **Color = operator type.** Each operator has a hue. Node cells are tinted by their origin operator.
- **Transclusion beams.** Lines connecting canvas nodes to their corresponding cards in the side panel. These draw in screen space from the visible node position to the card's vertical midpoint.

### Camera Controls

- **Drag** to pan
- **Scroll** to zoom
- **Click** a node to select it (inspector card appears)
- **Shift+drag** from node A to node B to fire the current operator

---

## The Side Panel

The right panel shows **inspector cards** — one per generation operation. Each card contains:

1. **Header:** Source node, operator applied, result node ID
2. **Body:** The generated text, parsed through `parseSections`:
   - Bold titles (`**Title**: body`) rendered as gold headings
   - Numbered items split into individual sections
   - Each section is independently clickable → shows `⊙ Spawn | ⑂ Fork | Copy | ⟩WT`
3. **Lineage:** Parent and child links (clickable)
4. **Neighbors:** Spatially adjacent nodes
5. **Quick Actions:** Fork, Honey, Full Text, Neighbors, WorldText

The panel also supports:
- **Reader mode** (`▤`) — document-style linear reading
- **Export** — Markdown or Twee (Twine) format
- **Zoom** — independent text size control

---

## The REPL

The bottom panel is a command-line interface. All operations are available as typed commands.

### Navigation
| Command | Description |
|---------|-------------|
| `/fly [id]` | Pan camera to center on node |
| `/cat [id]` | Display full text of a node |
| `/grep [term]` | Search all nodes by text content |
| `/find [term]` | Fuzzy search node titles |

### Structure
| Command | Description |
|---------|-------------|
| `/tree` | Display node hierarchy as indented tree |
| `/stats` | Scene statistics: node count, edge count, depth |
| `/roots` | List nodes with no parents |
| `/leaves` | List nodes with no children |
| `/neighbors [id]` | List spatially adjacent nodes |
| `/sort [name\|depth\|id]` | Reorder side panel cards |

### World Management
| Command | Description |
|---------|-------------|
| `/worlds` | List all 228 POML worlds (clickable) |
| `/add [n\|name]` | Load a world onto canvas (additive) |
| `/load [n\|name]` | Same as `/add` |
| `/clear` | Remove all nodes and edges |

### Generation
| Command | Description |
|---------|-------------|
| `/fork [id]` | Fork selected node into 3 paths |
| `/honey [id]` | Deep analysis of selected node |
| `/wt [id]` | Compile text → typed W/L/E/S nodes |
| `/push [text]` | Create a new node from arbitrary text |
| `/drill [id]` | Fork + auto-chain to children |
| `/compile [query]` | Natural language → REPL command (LLM) |

### Graph Operations
| Command | Description |
|---------|-------------|
| `/connect [id1] [id2]` | Create an edge between two nodes |
| `/ripple [id]` | Visual cascade from node to neighbors |
| `/ops` | List all operators with descriptions |

---

## The WorldText Pipeline

This is the core loop that makes the tool useful:

```
1. Load a world          /add AgriDyneBreach
2. Select a node         (click on canvas)
3. Fork it               /fork
4. Read the output       (side panel, parsed into sections)
5. Spawn a section       (click ⊙ on a specific paragraph)
6. Compile it back       /wt
7. Now you have typed    W/L/E/S nodes from generated text
   nodes that filter
   and connect properly
```

**Step 6 is the critical one.** Without `/wt`, generated text is just text — it lives on the canvas but has no type structure. The WorldText compiler closes the loop: it sends the text through an LLM with the WorldText Generator system prompt, parses the output for `location <Name>`, `entity <Name> : type`, `rel [verb](<A> -> <B>)`, `state <Entity.prop> = value`, and creates properly-typed nodes.

This means any text — from any source, any fork, any operator output — can be compiled back into the structured type system that the filters and spatial logic operate on.

---

## Command Palette

Press `⌘K` (or `Ctrl+K`) to open the command palette. Type to fuzzy-search across all available commands. Arrow keys to navigate, Enter to execute, Escape to close.

---

## Setup

### API Key
Paste your OpenAI API key in the top-right input field. It's saved to localStorage. Without it, navigation and canvas operations work, but all LLM-powered operators (fork, honey, surface, worldtext, compile) are disabled.

### Local Server
Run from a local HTTP server to avoid `file://` security restrictions:
```bash
cd island-ecology
python3 -m http.server 8000
# Open http://localhost:8000/BEES%20ON%20A%20TRAIN/twine-bridge.html
```

### Token Tracking
The `⊘` counter in the top bar shows cumulative token burn for the session. Color shifts green→yellow→red as usage increases. Hover for exact count.

---

## File Structure

```
BEES ON A TRAIN/
├── 00.md – 11.md          WorldText source files (228 worlds)
├── data.js                 Parsed world data (JS)
├── twine-bridge.html       The interface (single file, ~5000 lines)
├── worldtext-gen.md        WorldText Generator system prompt
├── worldtext.md            WorldModel Compiler system prompt
└── README.md               Project overview
```

---

## Design Principles

1. **Text is structure.** Every piece of narrative contains entities, locations, relations, and states. The tool makes this structure explicit.
2. **Operations, not chat.** The LLM is a function, not a conversationalist. Each operator has a specific analytical purpose with constrained output format.
3. **Spatial proximity carries context.** Nearby nodes inform each other. The Voronoi tessellation makes spatial relationships visible.
4. **Everything is compilable.** Any text on the canvas can be compiled back to typed structure via `/wt`. The pipeline is circular, not linear.
5. **Sections, not blobs.** Generated text is parsed into individually actionable sections. You can spawn, fork, copy, or compile any paragraph independently.
