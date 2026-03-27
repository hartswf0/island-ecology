# TWINE-BRIDGE: Four Papers from Four Genomes

Each genome is not a variant of one paper. Each is a **different paper** aimed at a different audience, venue, and contribution. They share a common codebase (`twine-bridge.html`) but make different claims about what that codebase means.

This document maps each genome to: a paper title, a thesis, a venue, a structural outline, the specific code evidence it draws on, and the theoretical machinery it deploys.

---

## The Shared Codebase as Evidence

Before the papers diverge, they share a common evidentiary base. Every paper must reference concrete code structures, not just describe ideas:

| Code Structure | What It Proves |
|---|---|
| `d3.Delaunay.from(pts)` → `voronoi.cellPolygon(i)` | Spatial proximity is computable, not metaphorical |
| `buildCtx(opNode)` | The neighbor map feeds spatial context into every LLM call — arrangement is literally part of the prompt |
| `parseSections()` | Text is decomposed into granular operable units, not read linearly |
| `/wt` compiler loop | Generated prose → typed WLES structure. The system is closed under compilation |
| `FORK` on three axes | Narrative is explicitly decomposed into spatial, temporal, and causal dimensions |
| `baseSys` banned-word list | The system forcibly suppresses vague literary tropes to reach specificity |
| `drawTransclusionBeam()` | Visible causal lineage between fragments — Xanadu's transclusion made literal |
| WLES filter bar | Ontological commitment: all world-content decomposes into {W, L, E, S} |
| REPL command history | Procedural thought is logged — the epistemic accounting trail |
| `mkNode()` `.cat` assignment | Auto-classification enforces type discipline on generated content |

---

## Paper 1: The R&D Program
**Genome:** `ce-00.md` — *Epistemic Context Engineering*

### Thesis
Generative AI needs to be transformed from a conversational black box into an operable spatial workbench. The unit of work should not be the prompt but the **context configuration**.

### Venue
**CHI, DIS, or UIST** — HCI systems paper. Contribution: a novel interface architecture.

### Structure

1. **Problem Statement:** Current AI interfaces (chatbots, prompt boxes) flatten the actual practice of prompt engineering into a submission-response loop. Advanced users already do something much richer — iterative revision, metaprompting, cross-platform migration — but no interface supports this.
   - Evidence: The epistemic accounting logs show 30+ sessions of multi-step foraging, not single-prompt usage.

2. **Related Work:** Prompt engineering tools (PromptIDE, Langchain, DSPy), creative AI (Wordcraft, AI Dungeon), spatial knowledge management (Obsidian Canvas, Miro), hypertext systems (Xanadu, Twine).
   - Gap: None of these have a compiler loop. None treat spatial proximity as prompt context.

3. **System Design:** The Twine Bridge architecture.
   - The Voronoi canvas as spatial context engine
   - The operator taxonomy (Fork, Surface, Limits, Modes, Manip, Zoom, Play, Holistic)
   - The `/wt` compiler loop as metabolic closure
   - The WLES type system as ontological constraint
   - Interface from code: toolbar groups, command palette, inspector cards, section-level actions

4. **Usage Scenarios:**
   - Loading 5 worlds → forking → compiling back to WLES → observing emergent structure
   - Using SURFACE to reveal hidden causality in generated text
   - Cross-world comparison via WLES filters

5. **Evaluation:**
   - Reification fidelity: how accurately does `/wt` recover typed structure from generated prose?
   - Context quality: does `buildCtx()` neighbor-based context improve LLM output specificity?
   - Token efficiency: does structured operator usage reduce token waste vs. freeform chat?

6. **Discussion:** The behavioral shift from "chat with AI" to "operate on a field." The concept of the Context Engineer.

### Key Figures
- Architecture diagram: Field → Forage → Compile → Honey pipeline
- The Voronoi canvas screenshot with WLES filter states
- Before/after: raw LLM output vs. post-`/wt` typed nodes
- Token burn comparison: chatbot vs. operator workflow

---

## Paper 2: The Formal System
**Genome:** `ce-01.md` — *Geometric Context Optimization*

### Thesis
Semantic proximity can be formalized as a computable coordinate system for LLM context assembly using Voronoi tessellation. This produces measurably better context than sequential retrieval.

### Venue
**AAAI, NeurIPS Workshop, or ACL** — a formal/technical paper. Contribution: a method.

### Structure

1. **Formal Problem:** Given a set of text nodes N with positions P ∈ ℝ², define a context function C(n) that assembles spatially proximate content for an LLM call. Evaluate whether geometric proximity produces more relevant context than sequential (chronological) or graph-based (edge-walking) alternatives.

2. **Definitions:**
   - Node: `n = (id, text, type ∈ {W,L,E,S}, position ∈ ℝ²)`
   - Voronoi cell: `V(n) = {p ∈ ℝ² : ||p - n.pos|| ≤ ||p - m.pos|| ∀m ≠ n}`
   - Neighbor map: `nbMap(n) = {m : V(n) ∩ V(m) ≠ ∅}` (Delaunay adjacency)
   - Context function: `C(n) = baseSys ⊕ n.text ⊕ Σ{m.text : m ∈ nbMap(n)}`
   - Compiler: `COMPILE: string → {W, L, E, S}*` (the `/wt` operator)
   - Closure property: `∀ operator O, COMPILE(O(n)) ⊆ {W,L,E,S}*`

3. **The Metabolic Loop:**
   - Prove that the system is closed under compilation: any operator output can be recompiled into typed nodes.
   - Formalize "reification fidelity" as the structural preservation between input text and compiled WLES output.

4. **Experiments:**
   - Compare context assembled via `nbMap` (spatial) vs. edge-walking (graph) vs. chronological (sequence)
   - Measure: operator output specificity (proper noun density, causal link count), type recovery rate under `/wt`
   - Dataset: the 228 POML worlds as ground truth typed structure

5. **Results:** Spatial context assembly produces X% higher entity specificity because semantically related nodes cluster naturally.

6. **Analysis:** 
   - When does spatial proximity fail as a proxy for semantic affinity?
   - The false proximity equivalence problem
   - Dimensionality collapse: 2D canvas loses high-dimensional semantic distinctions

### Key Figures
- Delaunay triangulation with labeled neighbor map
- Context window composition diagram (base + source + spatial neighbors)
- Reification fidelity scores across operator types
- Comparison table: spatial vs. sequential vs. graph context retrieval

---

## Paper 3: The World Ecology
**Genome:** `ce-02.md` — *The Epistemic Hive*

### Thesis
Generative AI workspaces should be modeled as **stigmergic ecologies** — hive-like systems where agents leave traces that structure subsequent foraging. The Voronoi canvas is a formal implementation of this ecology.

### Venue
**C&C (Creativity & Cognition), Leonardo, or Design Studies** — a design/theory paper. Contribution: a conceptual framework.

### Structure

1. **The Metaphor and Why It Works:**
   - The field: unstructured signal of varying quality (not all flowers produce usable nectar)
   - The swarm: nodes as foragers carrying signal from the field
   - The waggle dance: the REPL log, where operators communicate productive paths
   - The honey: compiled WLES structure — concentrated, durable, typed
   - The hive: the canvas itself, a shared spatial memory
   - Evidence: `mkNode()` acts as the forager; `buildCtx()` is the waggle dance; `/wt` is the refining enzyme

2. **Stigmergy as Interface Principle:**
   - Each operation leaves a spatial trace (a new node, a new edge) that structures subsequent operations
   - The Voronoi tessellation physically reshapes in response — adding a node changes every existing cell
   - This is indirect coordination through environmental modification: stigmergy
   - The REPL history is the pheromone trail
   - Evidence: `computeV()` recalculates the entire Voronoi on every node addition

3. **Liquid ↔ Solid Metabolism:**
   - Raw LLM output = liquid nectar (cheap, entropic, unsorted)
   - Compiled WLES structure = crystalline honey (expensive, stable, typed)
   - The `/wt` compiler is the metabolic enzyme that transforms one into the other
   - The "Aesthetic Trap": the danger of confusing a beautiful spatial arrangement with a rigorous one
   - Evidence: `/wt` parser with fallback (if strict parsing fails, try angle-bracket extraction)

4. **The Context Engineer as Forager:**
   - Not an author (who produces sequence) but a forager (who navigates a field)
   - Not a gardener (who designs paths) but a beekeeper (who cultivates conditions)
   - The command palette is the forager's toolkit; the REPL is the field notebook
   - Evidence: `setMode('fire')` literally rebrands the cursor from pointer to instrument

5. **Case Study:** Loading 5 related worlds, forking them to generate 15 new nodes, filtering by WLES type, identifying emergent entity clusters through spatial proximity, compiling the cluster back into a new world. The entire process as a foraging run.

6. **What the Metaphor Reveals:**
   - Nectar is cheap. Honey is rare. The work is in the refining, not the generation.
   - The field has seasons — some prompt strategies are productive at certain model temperatures, not others.
   - The swarm is smarter than any individual bee — the canvas accumulates intelligence across sessions.

### Key Figures
- Diagram: Field → Forage → Gather → Compile → Honey lifecycle
- The Voronoi canvas annotated as hive ecology (cells = territory, edges = flight paths, beams = pheromone trails)
- Before/after: raw fork output vs. post-`/wt` typed structure
- The "aesthetic trap" — two canvas arrangements, one beautiful but structurally empty, one ugly but analytically rich

---

## Paper 4: The Scholarly Intervention
**Genome:** `ce-03.md` — *The Epistemic Compiler*

### Thesis
Humanities inquiry is trapped in narrative sequence. AI-mediated spatial interfaces reveal that **some thoughts require an external geometry before they can occur**. The scholar must become a context engineer.

### Venue
**DIS (Design of Interactive Systems), or a humanities journal: Digital Scholarship in the Humanities, Configurations, New Media & Society** — a critical/theoretical paper. Contribution: a new scholarly posture.

### Structure

1. **The Protection of Narrative:**
   - Narrative flatters the scholar. A line is easier to defend than a space.
   - The finished argument conceals the actual mess of thinking: the obsessions, redundancies, weak joints, private cosmology dressed as method.
   - Evidence: the interface was called "Garden of Forking Paths" because that was literary enough to be forgivable. The code wanted something less forgivable.
   - Lineage: Benjamin's Arcades Project (the convolute as anti-narrative), Warburg's Mnemosyne Atlas (juxtaposition without caption)

2. **The Spatial Turn in AI-Mediated Thought:**
   - The board is more humiliating than the page. Everything lies there at once.
   - The Voronoi canvas is this humiliation made computational.
   - Spatial arrangement asks meaning to appear from juxtaposition without the courtesy of plot.
   - Evidence: `drawTransclusionBeam()` makes the spaghetti visible. The murder board is formalized.

3. **Text as Texture:**
   - `parseSections()` enacts this principle: text is not content to be read but material to be dissected.
   - Per-section action bars (`⊙ Spawn | ⑂ Fork | Copy | ⟩WT`) treat paragraphs as operable units.
   - The banned-word list in `baseSys` is the critical move: by prohibiting "whispers," "beckons," "tapestry," the system strips away comfortable literary tropes. What remains is what was previously unthinkable.
   - Lineage: Nelson's demand for transclusive visible connection; Geertz's thick description as maximal contextual density.

4. **The Unthinkable Thought:**
   - The central claim: perhaps some thoughts require an external arrangement before they can even occur.
   - The Voronoi neighbor map is this arrangement. `buildCtx()` assembles what is near, not what is narratively next.
   - The `/wt` compiler closes the loop: any thought, once generated, can be compiled back into the type system that generated it. The system is recursive.
   - The question is not what AI writes. The question is what thoughts were unthinkable before the table was arranged this way.

5. **The Context Engineer:**
   - Not a new job title. A new intellectual posture.
   - One is engineering context only because context no longer stays still long enough to be inherited.
   - The REPL log is the scholarly notebook of this figure. The command history is the method section.
   - Evidence: `/fork → /wt → /add → /connect → /ripple` — this is not writing. This is a sequence of operations on a knowledge structure.

6. **Conclusion: The Dignity of the Unfinished:**
   - The paper should end where the pride gives out.
   - We called it interpretation when, for a long time, we were only following the path that had already been cleared for us.
   - Project Xanadu keeps returning not because the old dream was correct, but because we are still ashamed that thought might need a different geometry than the page allows.

### Key Figures
- Warburg's Mnemosyne Atlas panel alongside a Twine Bridge canvas screenshot
- The banned-word list as a formal constraint on epistemic output
- A REPL session annotated as scholarly method: each command is a methodological move
- The `/wt` loop as hermeneutic circle: interpret → compile → reinterpret → recompile

---

## Cross-Paper Architecture

The four papers share evidence but not argument. They can cite each other:

```
Paper 4 (Theory, "why")
    ↓ grounds
Paper 1 (System, "what")
    ↓ formalizes
Paper 2 (Method, "how")
    ↓ metaphorizes
Paper 3 (Ecology, "feels like")
```

### Common Evidence, Different Framings

| Code structure | Paper 1 (System) | Paper 2 (Formal) | Paper 3 (Ecology) | Paper 4 (Theory) |
|---|---|---|---|---|
| `buildCtx()` | "spatial context assembly" | "context function C(n)" | "waggle dance" | "the arrangement that makes thoughts thinkable" |
| `/wt` compiler | "metabolic closure feature" | "closure property proof" | "refining enzyme" | "hermeneutic circle made procedural" |
| banned-word list | "output quality constraint" | "noise reduction parameter" | "nectar filter" | "the suppression of comfortable tropes to reach the unthinkable" |
| Voronoi cells | "spatial UI for context" | "geometric territory partition" | "foraging territories" | "the humiliation of the board" |
| REPL history | "operation log" | "execution trace" | "pheromone trail" | "scholarly method section" |

---

## Next Moves

1. **Write a shared Methods/System section** that all four papers reference — a technical description of the codebase that each paper then reinterprets through its lens.

2. **Capture evaluation data** by running a structured session:
   - Load 10 worlds → fork each → compile with `/wt` → measure reification fidelity
   - Log the REPL history as both a usage study (Paper 1) and a methodological record (Paper 4)

3. **Build the missing features** identified in the genomes:
   - Lineage metadata on nodes (for Paper 4's genealogy argument)
   - Reification fidelity scoring in `/wt` (for Paper 2's formal evaluation)
   - Session export as structured data (for Paper 1's user study)

4. **Write Paper 4 first.** It is the most dangerous and the most honest. The other three papers are respectable. Paper 4 is the one that says something.
