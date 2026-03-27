# The Epistemic Compiler: Context Engineering and the Spatial Turn in AI-Mediated Humanities

**Abstract.** This paper argues that humanities inquiry remains organized around narrative sequence at a moment when its most productive instruments demand spatial arrangement. Through the design, implementation, and critical analysis of Twine Bridge — a semantic-spatial workbench for compiling unstructured narrative into typed world structure — we identify a shift from authorship to operation, from reading to foraging, and from the finished argument to the configured field. The prototype reveals what we call *thick prompting*: an iterative, multimodal, heterogeneous practice of context construction that cannot be served by the chatbot interface or the text editor. Drawing on Ted Nelson's transclusion, Borges' recursive bifurcation, Geertz's thick description, Benjamin's convolute, and Warburg's atlas, we propose the figure of the *context engineer* — a scholarly posture in which thinking proceeds not by composing sequences but by arranging fragments in space until the unthinkable conclusion becomes visible. The central claim is epistemological: some thoughts require an external geometry before they can occur.

**Keywords:** context engineering, thick prompting, spatial epistemology, Voronoi tessellation, world modeling, digital humanities

---

## 1. Introduction: The Protection of Narrative

Narrative flatters the scholar. It lets the thinker walk forward in time and call that understanding. A line is easier to defend than a space. A paragraph with a topic sentence, supporting evidence, and a concluding transition is a defensible object. It can be cited. It can be refuted. It can be graded.

The finished argument conceals the actual mess of thinking: the obsessions, the redundancies, the weak joints, the private cosmology dressed as method. Drafts are deleted. Sidetracks are pruned. The fractal indecision that characterizes genuine inquiry is smoothed into a voice that sounds as though it always knew where it was going.

This paper is about what happens when that protection is removed.

The prototype described here — Twine Bridge — began as a Garden of Forking Paths. That name was chosen because it sounded literary enough to be forgiven. It referenced Borges, and Borges is the kind of difficulty that humanities departments are trained to admire. But the code refused to stay literary. It grew a REPL (Read-Eval-Print Loop). It grew a command palette. It grew a Voronoi tessellation engine. It grew a type system. It grew a compiler. These are not narrative features. They are workbench features. The tool was becoming what it had always tried to become: a semantic-spatial environment for constructing, operating on, and compiling context.

We name this environment a *contextual ecology* and the practice it supports *thick prompting*. The scholarly posture it demands we call the *context engineer*. None of these terms are decorative. Each corresponds to a specific code structure, a specific interaction pattern, and a specific epistemological commitment that this paper will trace from theory to implementation and back.

---

## 2. Background: The Spatial Possibility

### 2.1 Xanadu and the Demand for Visible Connection

Ted Nelson's Project Xanadu (1960–) made a single demand that hypertext, the web, and every subsequent knowledge system has failed to honor: connections between ideas must be *visible and transclusive* [1]. Not hidden behind blue links. Not collapsed into footnotes. Drawn as material lines in the interface, showing where every fragment came from and where it went.

Nelson understood that knowledge is not a collection of pages but a network of relations, and that any system that hides those relations is lying about the structure of thought. The web solved distribution but abandoned lineage. Modern note-taking tools (Obsidian, Roam) partially recover the graph but still present knowledge as documents to be read rather than structures to be operated on.

Twine Bridge implements transclusion literally. The function `drawTransclusionBeam()` renders Bézier curves in screen space from canvas nodes to their corresponding inspector cards in the side panel. These beams are not decorative. They constitute a visible, computable lineage system: every node knows its parent, its operator, and its spatial neighbors. The "spaghetti" of the murder board is formalized into a traceable graph.

### 2.2 Borges and the Formalization of Divergence

Jorge Luis Borges' "The Garden of Forking Paths" (1941) is routinely cited as a progenitor of hypertext. What is less frequently noted is that Borges' garden is not really about choice. It is about the simultaneous existence of incompatible possibilities — a metaphysics of coexistence rather than a mechanics of branching [2].

The `FORK` operator in Twine Bridge takes this further than branching allows. Each fork generates three paths, each on a different axis: spatial (what changes in the environment), temporal (what changes in the timeline), and causal (what changes in the rules). This is not "choose your own adventure." It is the systematic decomposition of narrative into its geometric components. The fork proves that a single text contains at least three texts, and that these texts are not alternatives but orthogonal dimensions of the same situation.

### 2.3 Benjamin and the Convolute

Walter Benjamin's *Arcades Project* (1927–1940) is the great unfinished monument to anti-narrative scholarship [3]. Benjamin collected quotations, observations, and fragments, organized them into thematic "convolutes," and refused to compose them into a linear argument. The method was the juxtaposition. The claim was that meaning emerges from arrangements of material, not from the transitions between them.

The Twine Bridge canvas is a computational convolute. Nodes are placed in 2D space. Their proximity is not sequential (this comes after that) but spatial (this is near that). The Voronoi tessellation assigns each node a territory — a cell whose shape is determined entirely by the positions of its neighbors. This is Benjamin's method made geometric: the convolute as tessellation, the fragment as nucleus, the arrangement as argument.

### 2.4 Warburg and the Atlas

Aby Warburg's *Mnemosyne Atlas* (1924–1929) arranged photographs of artworks, manuscripts, and objects on large black panels, without captions [4]. The point was to let visual proximity do the work that text usually does — to produce meaning through juxtaposition rather than explanation.

The atlas is the interface model that Twine Bridge most closely resembles. The canvas is a black field. The nodes are nuclei. The relationships are visible (edges, beams, Voronoi boundaries) but not narrated. The user does not read the canvas. The user *perceives* it — as one perceives a gallery wall, taking in the arrangement before reading any individual label.

### 2.5 Geertz and Thick Description

Clifford Geertz's concept of "thick description" (1973) argued that ethnographic interpretation must be *maximally contextual* — that a wink is not a wink without the social, cultural, and situational layers that distinguish it from a twitch [5].

We extend this concept to prompting. A *thick prompt* is not a single natural-language instruction. It is a situated, iteratively constructed, multimodally composed configuration of context. The context includes: the source text, the spatial neighbors, the operator's system prompt, the banned-word list, the WLES type constraints, the user's preceding operations, and the physical arrangement of nodes on the canvas. All of these are literally assembled by the function `buildCtx()` and passed to the LLM. The prompt is thick because everything around it — everything *near* it — is part of it.

---

## 3. The System: Twine Bridge

### 3.1 Architecture

Twine Bridge is a single-file HTML application (~5,200 lines) that implements a spatial workbench for operating on narrative structure. Its architecture consists of five components:

1. **The Voronoi Canvas** — a 2D spatial engine where each text node occupies a cell in a Delaunay-computed tessellation. The cell's shape and neighbors are determined by `d3.Delaunay.from(pts)`. Spatial proximity is computable via the neighbor map `nbMap`.

2. **The Operator System** — nine LLM-backed analytical instruments (FORK, SURFACE, LIMITS, MODES, MANIP, ZOOM, PLAY, HOLISTIC, WORLDTEXT), each with a constrained system prompt, a specific hue, and a defined category (Narrative, Reveal, Structure, Manipulate, Meta).

3. **The WorldText Compiler** (`/wt`) — takes any unstructured text and sends it through an LLM with a system prompt that enforces the WorldText declarative grammar, then parses the output into typed WLES nodes (World, Location, Entity, State) and places them on the canvas.

4. **The Inspector Panel** — a side panel that renders inspector cards for each operation result. Generated text is parsed by `parseSections()` into individually selectable sections, each with action buttons (Spawn, Fork, Copy, WorldText).

5. **The REPL** — a command-line interface with 25+ commands for navigation, generation, graph manipulation, and analysis. The REPL log constitutes an epistemic accounting trail.

### 3.2 The Metabolic Loop

The critical architectural feature is the *compiler loop*. Generated text — the output of any operator — can be fed back into the `/wt` compiler, which decomposes it into typed WLES structure:

```
Load world → Select node → Fork → Read sections → 
Spawn a section → Compile with /wt → Typed WLES nodes
```

This loop is what distinguishes the system from a chatbot wrapper or a mind map. The system is *closed under compilation*: any output can be reprocessed into the type system that generated it. In ecological terms, the field's nectar (raw LLM output) is refined into the hive's honey (typed, durable, filterable structure). The work is not in the generation. The work is in the refining.

### 3.3 Spatial Context Assembly

The function `buildCtx(opNode)` implements a principle that is architectural, not cosmetic: *the arrangement of nodes on the canvas is part of the prompt*. When an operator fires, the system assembles:

1. The operator's system prompt (`baseSys` + operator-specific directive)
2. The source node's text
3. The texts of all Voronoi-adjacent nodes (the neighbor map)

This means that moving a node on the canvas changes what the LLM produces. Proximity is not a metaphor. It is a variable in the function.

### 3.4 The Ontological Constraint

The WLES type system is not a metadata tag. It is an ontological commitment:

- **W (World):** A self-contained scene with its own cast, location, and rules. The fundamental unit of narrative containment.
- **L (Location):** Spatial, environmental, or structural regions. Where events occur.
- **E (Entity):** Discrete things that exist and act — characters, objects, forces, systems.
- **S (State):** Mutable properties of entities or locations. What changes when events occur.

The WorldText grammar enforces this decomposition: `location <Name>`, `entity <Name> : type`, `rel [verb](<A> -> <B>)`, `state <Entity.prop> = value`. Any text that cannot be decomposed into these types is not yet a world. It is still raw material.

### 3.5 The Banned-Word List

The system prompt (`baseSys`) contains an explicit prohibition:

> *Never use: "whispers," "beckons," "tapestry," "labyrinthine," "ethereal," "enigmatic," "cryptic," "eldritch."*

This is not a stylistic preference. It is an epistemic instrument. These words are the tropes through which generative language models produce the *appearance* of meaning without its substance. "A mysterious tapestry of enigmatic whispers" parses as meaningful prose but communicates nothing. The banned-word list forces the LLM past comfortable literary convention toward the specific, the measurable, and the concrete.

What remains after the filler is cleared is, we argue, closer to what was previously unthinkable — the thought that comfortable language was trained to avoid.

---

## 4. Thick Prompting

### 4.1 The Concept

Advanced prompting is not a single linguistic act. It is an iterative, multimodal, heterogeneous, and itinerant practice in which prompts are refined, translated, reformatted, tested, and redeployed across systems. We call this *thick prompting* — a term that extends Geertz's thick description from ethnographic observation to generative AI practice.

Thick prompting names the actual conditions of contemporary promptcraft:

1. **Iterative revision.** Prompts are never finished. They are thickened through successive passes. Each REPL command (`/fork → /wt → /fork`) adds a layer.
2. **Metaprompting.** The system prompt constrains the operator. The operator constrains the output. The output is compiled into types that constrain the next operator. Prompts generate their own constraints recursively.
3. **Multimodal movement.** The same content exists as: canvas node, inspector card, REPL output, Markdown export, Twee (Twine) export, WorldText script. Each representation affords different operations.
4. **Cross-platform migration.** WorldText files (`.md`) can be imported from external editors. Exports can be loaded into Twine. The prompt ecology is not confined to one interface.
5. **Heterogeneous composition.** A "prompt" in this system consists of: natural language, a system prompt, a banned-word list, spatial coordinates, type constraints, neighbor texts, and a JSON schema. It is not a sentence. It is a configuration.
6. **Performative unfolding.** The REPL log records the dance between human and system. Fork, read, spawn section, compile, fork again. The work is dialogic.

### 4.2 Interface Implementation

The interface gives form to thick prompting by turning promptcraft into a visible spatial process rather than a hidden sequence of retries:

| Dimension | How It Appears in the Interface |
|---|---|
| Iterative revision | Section-level spawn/fork. Individual paragraphs extracted, re-operated, recompiled. |
| Metaprompting | `baseSys` constrains every operator. Operators constrain LLM output. Users constrain operators through node selection and spatial arrangement. |
| Multimodal movement | Canvas ↔ inspector cards ↔ REPL ↔ Markdown ↔ Twee ↔ WorldText. Same content, six representations. |
| Heterogeneous composition | Each LLM call receives: text + system prompt + spatial neighbors + type constraints + banned words. A thick configuration, not a thin instruction. |
| Performative unfolding | The REPL log. Every `/fork`, `/wt`, `/connect`, `/ripple` is timestamped and visible. |

The problem thick prompting solves is not "how to write a better prompt." The problem is: *how do I navigate a field of uneven affordances and gather the right material for cognition and making?*

---

## 5. The Context Engineer

### 5.1 Not an Author

The context engineer is not an author, a writer, or even a prompter. The context engineer is a figure who arranges conditions. The product of their labor is not a text but a *configured field* — a spatial arrangement of typed fragments whose proximity and connectivity allows certain thoughts to emerge that no single fragment could produce alone.

The behavioral shift is recorded in the interface itself. In Explore mode, the user clicks nodes to read them — the posture of the reader. In Aim mode (`setMode('fire')`), the user drags between nodes to fire operators — the posture of the operator. The mode switch is the interface admitting what the scholar has become.

The REPL history is the method section of the context engineer's work:

```
/add AgriDyneBreach
/add NozomiBreach
/fork 3
/wt 7
/connect 7 12
/ripple 12
/stats
```

This is not writing. It is a sequence of operations on a knowledge structure. Each command changes the topology of the field. Each change produces new adjacencies. Each adjacency produces new context for the next operation.

### 5.2 Not a Gardener

The metaphor of the Garden of Forking Paths implies a designed space with authored paths. The gardener plants, prunes, and maintains. But the practice we observe in the epistemic accounting logs is not gardening. It is foraging.

The forager does not design the field. The forager navigates an uneven terrain of signal — some flowers productive, some barren, some toxic. The forager scouts, gathers, evaluates, and returns to the hive to refine what was collected. The product is not the flower. It is the honey.

This is why the Twine Bridge metaphor shifted from garden to hive. The code structure mirrors the ecology:

| Ecological Role | Code Implementation |
|---|---|
| Forager | `mkNode()` — creates a new node carrying signal from the field |
| Waggle dance | `buildCtx()` — communicates the productive region to the next operation |
| Refining enzyme | `/wt` compiler — transforms raw nectar into typed honey |
| Pheromone trail | REPL history — each command marks a path for subsequent operations |
| Territory | Voronoi cell — the space each node claims and defends |
| Hive memory | Canvas state — the accumulated arrangement of all nodes and edges |

### 5.3 The Dignity of the Unfinished

The context engineer does not produce finished arguments. The context engineer produces thick configurations that make certain arguments *available*. The difference matters.

A finished argument closes a line of inquiry. A configured field opens it. The canvas, at the end of a session, is not a conclusion. It is a set of conditions — a spatial arrangement whose juxtapositions suggest relationships that no single node states explicitly.

This is what Benjamin's convolutes were trying to be. This is what Warburg's atlas panels achieved. The reluctance to narrate is not laziness. It is the recognition that some structures of meaning are destroyed by the act of linearizing them.

---

## 6. The Unthinkable Thought

### 6.1 The Central Claim

The strongest claim this paper makes is epistemological, not technical:

> *Some thoughts require an external geometry before they can occur.*

This is not a claim about AI generating surprising ideas. It is a claim about the conditions under which a human mind can perceive relationships that were always present in the material but invisible under narrative organization.

When five POML worlds are loaded onto the Voronoi canvas, the Delaunay triangulation creates adjacencies that the author of those worlds did not intend. `AgriDyneBreach` (pollinator drones in Geneva) and `SeoulStationMisdiagnosis` (nanobot stings misdiagnosed as anaphylaxis) may end up as Voronoi neighbors. Their texts are then jointly assembled by `buildCtx()` into the spatial context of the next operator call. The LLM, receiving both texts as context, may produce a synthesis — a connection between autonomous pollination and medical misrecognition — that neither text implies alone but that the spatial arrangement makes available.

This is not the AI "hallucinating" a connection. It is the geometry of the table surfacing a relationship that was latent in the material but suppressed by the linear order in which the worlds were originally written.

### 6.2 The Hermeneutic Loop

The `/wt` compiler makes this process recursive. The synthesized output is compiled back into typed WLES structure. The new nodes enter the Voronoi field. The tessellation recalculates. New adjacencies appear. New context is assembled. The process repeats.

```
Interpret (read) → Compile (/wt) → Arrange (canvas) → 
Reinterpret (new adjacencies) → Recompile → Rearrange → …
```

This is the hermeneutic circle — the foundational method of humanistic interpretation — implemented as a spatial-computational loop. The circle is no longer a metaphor for the relationship between part and whole. It is a function that converts text into structure, places structure in space, reads the space, and generates new text.

### 6.3 What Was Unthinkable

What was unthinkable under narrative organization? We suggest three categories:

1. **Cross-domain resonance.** Linear narrative files (00.md through 11.md) separate worlds by temporal phase. Spatial arrangement juxtaposes worlds across phases, revealing structural echoes (the same entity type appearing in different contexts, the same causal pattern recurring in different locations) that the filing system suppresses.

2. **Structural bottlenecks.** The LIMITS operator identifies entities that concentrate relations — load-bearing nodes through which narrative flow is forced to narrow. These bottlenecks are invisible in linear reading but visible in the Voronoi topology as cells with many Delaunay neighbors.

3. **Counterfactual fragility.** The PLAY operator removes key entities and traces cascades. "What if the NanobotSwarm entity is removed?" reveals which other entities depend on it, which events become impossible, which states become undetermined. This is not a thought that linear reading produces. It is a thought that requires the graph.

---

## 7. Text as Texture

The phrase "text is texture" names the principle that language in this system is not content to be read but material to be operated on.

The function `parseSections()` enacts this principle by decomposing generated text into individually actionable units. Each section — a paragraph, a numbered item, a bold-titled block — is rendered with its own action bar:

`⊙ Spawn` | `⑂ Fork` | `Copy` | `⟩WT`

These buttons treat the paragraph not as a thing to be read but as a material to be: detached from its context (Spawn), multiplied into alternatives (Fork), transferred elsewhere (Copy), or compiled into typed structure (WorldText). The text is a texture — something the hand must move across, selecting, cutting, reattaching.

This is a departure from what Nelson called "the tyranny of the file" [1] and what we might call *the tyranny of the blob*: the assumption that a generated completion is a single object. `parseSections()` proves it is not. A completion is a composite — a bundle of fragments that arrived together but that may be more productive when separated, rearranged, and individually compiled.

---

## 8. Discussion: What the Prototype Reveals

### 8.1 The Interface Is Not a Tool

One kept saying "interface" when one meant discipline. The argument is not really about screens. It is about what kind of intellectual posture a screen trains into the body.

The chatbot posture is: submit and receive. The knowledge management posture is: file and retrieve. The context engineering posture is: arrange, operate, compile, rearrange. These are different disciplines, and they produce different kinds of thought.

Twine Bridge trains the third posture. The user who has spent an hour loading worlds, forking paths, compiling sections, filtering by WLES type, and observing emergent clusters is not the same thinker they were before the session. They have learned to see relationships that are produced by arrangement, not by argument.

### 8.2 The Aesthetic Trap

The prototype is most dishonest where it is most beautiful. A canvas full of color-coded Voronoi cells, with golden transclusion beams arcing between nodes, is visually striking. But beauty is not truth. A beautiful arrangement may be structurally empty — nodes placed for visual balance rather than semantic necessity.

The "aesthetic trap" is the danger that the interface teaches the user to prefer satisfying spatial arrangements over rigorous analytical ones. The countermeasure is the `/wt` compiler: if a cluster of nodes cannot be compiled into stable WLES structure, its beauty is exposed as hollow. Reification fidelity — the degree to which generated prose decomposes into typed structure — is the system's built-in honesty check.

### 8.3 What Is Missing

The prototype does not yet carry: lineage metadata (ancestral thinkers, disciplinary matrix, citation axis), evidence surfaces (the distinction between "I found this" and "I generated this"), vibe or mood (the tonal character of a cluster), migration paths (the intellectual shifts that drove a node's creation), or intervention logic (what a node is *for*). These additions would transform the canvas from a narrative map into a *research ecology* — a workspace where every node carries not just content but intellectual posture, genealogy, and methodological intent.

---

## 9. Conclusion: Where the Pride Gives Out

The enemy is not narrative. The enemy is the superstition that every serious thing must arrive in order.

A scholar may spend years discovering that the answer was hidden less in the machine than in the shape of the table on which the fragments were laid.

Project Xanadu keeps returning not because the old dream was correct, but because we are still ashamed that thought might need a different geometry than the page allows. The interface described in this paper is a small act of architectural penance: an admission that the tools of thought matter more than we were trained to believe, and that the posture of the scholar — standing before a spatial field rather than sitting behind a linear draft — is not a convenience but a condition of possibility.

We called it interpretation when, for a long time, we were only following the path that had already been cleared for us. The configured field does not clear paths. It presents everything at once: the obsession, the redundancy, the weak joints, the private cosmology. This is the humiliation of the board. It is also, we believe, the beginning of something more honest than narrative was willing to allow.

---

## References

[1] T. Nelson, *Computer Lib / Dream Machines*. Self-published, 1974. See also: *Literary Machines*, 1981.

[2] J. L. Borges, "The Garden of Forking Paths," in *Ficciones*, 1941. Trans. A. Hurley, Penguin, 1998.

[3] W. Benjamin, *The Arcades Project*. Trans. H. Eiland and K. McLaughlin. Harvard University Press, 1999.

[4] A. Warburg, *Mnemosyne Atlas*, 1924–1929. See: C. Naber, "Aby Warburg's Mnemosyne Atlas," in *The Archive*, MIT Press, 2002.

[5] C. Geertz, "Thick Description: Toward an Interpretive Theory of Culture," in *The Interpretation of Cultures*. Basic Books, 1973.

[6] V. Bush, "As We May Think," *The Atlantic Monthly*, July 1945.

[7] N. K. Hayles, *How We Became Posthuman: Virtual Bodies in Cybernetics, Literature, and Informatics*. University of Chicago Press, 1999.

[8] B. Latour, *Reassembling the Social: An Introduction to Actor-Network Theory*. Oxford University Press, 2005.

[9] L. Manovich, *The Language of New Media*. MIT Press, 2001.

[10] P.-P. Grassé, "La reconstruction du nid et les coordinations interindividuelles chez Bellicositermes natalensis et Cubitermes sp.," *Insectes Sociaux*, 6(1), 1959. (Origin of the term "stigmergy.")

---

## Appendix A: Code-Theory Correspondence

| Theoretical Concept | Code Implementation | Section |
|---|---|---|
| Transclusion (Nelson) | `drawTransclusionBeam()` | §2.1 |
| Recursive bifurcation (Borges) | `FORK` on three axes | §2.2 |
| Convolute (Benjamin) | Voronoi canvas as spatial arrangement | §2.3 |
| Atlas panel (Warburg) | Canvas nodes without narrative connection | §2.4 |
| Thick description (Geertz) | `buildCtx()` spatial context assembly | §2.5 |
| Metabolic closure | `/wt` compiler loop | §3.2 |
| Epistemic suppression | `baseSys` banned-word list | §3.5 |
| Text as texture | `parseSections()` + action bars | §7 |
| Hermeneutic circle | Interpret → Compile → Rearrange → Reinterpret loop | §6.2 |
| Stigmergy | `computeV()` recalculation + REPL trail | §5.2 |
| Context engineer | `setMode('fire')` posture shift | §5.1 |
| Ontological commitment | WLES type system + filter bar | §3.4 |
