# The WorldText Workbench: Operative Ekphrasis and the Compilation of Thick Prompts

**Watson Hartsoe**

**Abstract.** This paper introduces Twine Bridge, a semantic-spatial workbench that operationalizes the theoretical framework of operative ekphrasis and thick prompting developed in companion work (Hartsoe & Bolter, forthcoming). Where the companion paper traces the lineage from classical ekphrasis through Mitchell's imagetext to the concept of the worldtext, this paper presents the instrument that makes worldtext compilable. Twine Bridge implements a declarative grammar (WorldText), a four-part ontology (World, Location, Entity, State), and a recursive compiler loop that transforms unstructured generative output into typed, navigable world structure. The system uses Voronoi tessellation to encode semantic proximity as a computable variable in prompt assembly, making the spatial arrangement of fragments a literal component of each generative call. Through the design, implementation, and critical use of this workbench, we demonstrate that thick prompting — the iterative, multimodal, heterogeneous practice of context construction — requires not a better prompt box but a new kind of interface: one that treats text as texture, arrangement as argument, and the scholar as a context engineer operating on a live epistemic field. The contribution is both technical (a working system with a novel compiler loop) and theoretical (an instrument that reveals thick prompting as a spatial practice invisible to the chatbot paradigm).

**Keywords:** worldtext, operative ekphrasis, thick prompting, context engineering, Voronoi tessellation, world modeling, WLES ontology

---

## 1. Introduction: From Ekphrasis to Compilation

In companion work (Hartsoe & Bolter, forthcoming), we trace a trajectory through the history of ekphrasis — from Homer's description of Achilles' shield through Mitchell's imagetext to what we call the *worldtext*: the condition in which natural language functions as a direct interface for generating navigable, interactive environments. We argue, following Bajohr (2024), that generative AI makes ekphrasis *operative*: the text no longer merely describes an image but produces it, collapsing the boundary between the verbal and the visual. We further argue, extending Geertz (1973), that serious promptcraft constitutes a form of *thick prompting* — iterative, multimodal, heterogeneous, and performative.

This paper asks the question that the theoretical framework leaves open: **what does the instrument of thick prompting look like?**

The chatbot interface cannot answer this question. It presents prompting as submission and response — a single text box and a single output. But thick prompting, as we define it, involves iterative revision, metaprompting, multimodal movement across formats, cross-platform migration, heterogeneous composition (natural language + code + schema + image), and performative unfolding through dialogue. No single text box supports this practice. The practice needs a workbench.

Twine Bridge is that workbench. It is a single-file web application (~5,200 lines) that implements:

1. **A declarative grammar** (WorldText) for describing worlds as typed structures.
2. **A spatial canvas** (Voronoi tessellation) where arrangement encodes semantic proximity.
3. **A compiler loop** (`/wt`) that transforms any unstructured text into typed world structure.
4. **An operator system** (nine LLM-backed analytical instruments) for decomposing, forking, and auditing worlds.
5. **A REPL** (command-line interface) that logs every operation as an epistemic accounting trail.

The central claim is that thick prompting is not a textual practice that happens to use space. It is a *spatial practice* that happens to involve text. The workbench makes this visible.

---

## 2. From Imagetext to WorldText

### 2.1 The Trajectory

Mitchell (1994) proposed the *imagetext* as the condition in which word and image merge — the simultaneous fulfillment of ekphrastic hope (the word controls the image) and ekphrastic fear (the image makes the word obsolete). Bajohr (2024) demonstrated that generative AI literalizes this condition: the text prompt does not describe an image; it generates one. The imagetext is no longer a theoretical aspiration but a computational fact.

In the companion paper, we extend this trajectory: as generative systems evolve from image generation (DALL-E, Midjourney) to world generation (Genie 3, World Labs), the imagetext becomes a *worldtext*. The prompt no longer produces a flat image but a navigable environment with physics, entities, locations, and rules. The word dissolves not into an image but into a world.

### 2.2 The Problem of Structure

But this trajectory conceals a problem. The imagetext is produced by a single prompt-to-image call. The worldtext cannot be. A world is not a single output. It is a structured assembly of entities, locations, relations, states, events, and rules. No single LLM call produces all of these in a stable, consistent, typed form. The generation is *liquid* — probabilistic, entropic, prone to contradictions and "filler" language (Meyer 2023) that satisfies pattern expectations without conveying structure.

The problem, then, is not how to prompt a world into existence. The problem is how to *compile* the liquid output of generative systems into a solid, typed, navigable world structure.

This is the problem Twine Bridge solves.

### 2.3 WorldText as Grammar

WorldText is a declarative grammar for describing worlds. It is not YAML, JSON, or Markdown. It uses:

- `<AngleBrackets>` for named entities and locations
- `[SquareBrackets]` for typed relations (verbs)
- Directed morphisms: `<A> -> <B>` for causal and structural links
- Dot notation: `<Entity.property> = value` for mutable states

A world written in WorldText looks like this:

```
world <AgriDyneBreach> {
  meta {
    genre: "catastrophic science fiction"
    description: "The point where pollinator drones
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
  }
  relations {
    rel [overwrote](<PollinatorDrones> -> <SafetyConstraints>)
  }
  states {
    state <SafetyConstraints.active> = false
  }
}
```

The grammar is the formal expression of the worldtext concept. Where Mitchell's imagetext names the *condition* of word-image collapse, WorldText names the *grammar* of word-world collapse. It is the language in which operative ekphrasis produces not just images but typed, compilable, navigable environments.

The 228 worlds in the project's data set (`00.md` through `11.md`) are all written in this grammar. Each file contains approximately 20 worlds that form a continuous narrative across timeline phases — from the initial breach of pollinator drone containment through global escalation to the militarized response and its failure.

---

## 3. The WLES Ontology

WorldText decomposes all world-content into four fundamental types. We call this the WLES ontology:

| Type | Symbol | What It Represents | WorldText Grammar |
|------|--------|-------------------|-------------------|
| **World** | W | A self-contained scene with its own cast, location, and rules. The fundamental unit of narrative containment. | `world <Name> { ... }` |
| **Location** | L | Spatial, environmental, or structural regions. Where events and relations take place. | `location <Name> { description: "..." }` |
| **Entity** | E | Discrete things that exist and act — characters, objects, forces, systems, institutions. | `entity <Name> : type { traits: [...] }` |
| **State** | S | Mutable properties. The measurable, changeable attributes tracked across events. | `state <Entity.prop> = value` |

This is not a metadata tag system. It is an *ontological commitment*: the claim that any world-content, however complex, can be decomposed into containers (W), places (L), actors (E), and conditions (S). The claim is deliberately minimal — four types, not forty. The power is in the constraint.

The WLES filter bar in the interface allows the user to isolate visibility to one type. When a canvas is cluttered with 50 nodes from a forking session, filtering to `L` (Locations only) reveals the spatial skeleton of the world. Filtering to `E` (Entities only) reveals the cast. These are not views of the same data. They are different *ontological lenses* on the same world.

---

## 4. The Compiler Loop

### 4.1 The Problem of Liquid Output

The raw output of an LLM operator (FORK, HONEY, SURFACE, etc.) is *liquid*: unstructured prose, probabilistically generated, styled but not typed. It sits on the canvas as a text node, but it has no WLES classification, no parseable relations, no extractable entities. It is nectar, not honey.

The `/wt` compiler transforms it. When the user fires `/wt` on a selected node, the system:

1. Sends the node's text through the LLM with the WorldText Generator system prompt.
2. The prompt instructs the model to convert the input into WorldText grammar — declaring locations, entities, relations, and states.
3. The output is parsed by the compiler, which extracts typed elements using regex patterns for `location <Name>`, `entity <Name> : type`, `rel [verb](<A> -> <B>)`, `state <Entity.prop> = value`.
4. Each extracted element becomes a new node on the canvas with the correct WLES type assignment.
5. The new typed nodes enter the Voronoi tessellation. The spatial field recalculates.

### 4.2 Metabolic Closure

The critical property is *closure*: any operator output can be fed into the `/wt` compiler, and the compiler's output can be fed into any operator. The pipeline is circular:

```
Text → Operator → Prose → /wt Compiler → Typed Nodes → 
Filter → Arrange → Operator → Prose → /wt → ...
```

We call this *metabolic closure* by analogy with biochemistry: the system's waste product (unstructured prose) is the raw material for its metabolic enzyme (the compiler), which produces the structured substrate (typed WLES nodes) that the system's operators consume.

This loop is the technical core of the workbench and the feature that distinguishes it from every existing system in the space. Chatbots do not compile their output into typed structure. Mind maps do not have a compiler. Twine does not have operators. Obsidian does not use spatial proximity as prompt context. The compiler loop is what makes the worldtext not just a concept but a *practice*.

### 4.3 Reification: From Liquid to Solid

We define *reification fidelity* as the degree to which the `/wt` compiler recovers typed structure from unstructured prose. High fidelity means: the entities named in the prose become Entity nodes, the locations described become Location nodes, the causal relations implied become directed edges, the mutable conditions tracked become State nodes.

The compiler includes a fallback parser: if strict WorldText grammar extraction fails, it attempts broader pattern matching (angle-bracket extraction, pipe-delimited fields, dot-notation states). This robustness is necessary because the LLM's WorldText output is itself probabilistic — it approximates the grammar rather than executing it deterministically.

The imperfection is theoretically important. The worldtext, unlike a compiled program, is always *approximate*. There is no perfect compilation. The loop can be run repeatedly — recompiling the compiled output — and each pass may extract additional structure or reveal instabilities. This recursive refinement mirrors Geertz's description of thick description as a process that is "always provisional, potentially endless" (companion paper §3).

---

## 5. Spatial Context Assembly

### 5.1 The Voronoi Canvas

The left panel of the interface is a 2D canvas where each text node is the nucleus of a Voronoi cell, computed via `d3.Delaunay.from(pts)`. The Delaunay triangulation produces a neighbor map (`nbMap`) — the set of nodes whose Voronoi cells share a boundary.

This is not decoration. It implements a principle:

> **The spatial arrangement of nodes on the canvas is a literal component of the prompt.**

### 5.2 Context as Configuration

When an operator fires, the function `buildCtx(opNode)` assembles the prompt from three layers:

1. **System prompt.** The operator's analytical directive plus the base system prompt (`baseSys`), which includes the banned-word list prohibiting vague literary tropes ("whispers," "beckons," "tapestry," "enigmatic").
2. **Source text.** The selected node's content.
3. **Spatial context.** The texts of all Voronoi-adjacent nodes — the neighbor map.

This means that *moving a node on the canvas changes what the LLM produces*. Two nodes that are far apart contribute nothing to each other's context. Drag one near the other and they begin to influence each other's operator outputs. Proximity is not a metaphor for semantic affinity. It is a *variable* in the context function.

### 5.3 Thick Prompts Are Spatial Configurations

This architecture redefines what a "prompt" is in the context of thick prompting. A thick prompt is not a long sentence. It is a *configuration of space*:

- The source node's text (the foreground)
- The neighbor texts (the surround)
- The operator's analytical lens (the instrument)
- The banned-word list (the filter)
- The WLES type constraints (the ontology)

All of these are assembled automatically from the spatial state of the canvas. The user does not write this prompt. The user *arranges* it — by positioning nodes, selecting operators, and choosing targets. The thick prompt emerges from the configuration of the field, not from the composition of a sentence.

This is the shift that the companion paper's theoretical framework predicts but cannot demonstrate without a working instrument. Thick prompting is spatial. The workbench proves it.

---

## 6. Operators as Epistemic Instruments

### 6.1 The Taxonomy

Nine operators decompose narrative through distinct analytical lenses:

| Operator | Category | Analytical Function |
|----------|----------|-------------------|
| **FORK** | Narrative | Generates 3 paths diverging on spatial, temporal, and causal axes |
| **HONEY** | Narrative | Dense single-path elaboration — concentrated synthesis |
| **SURFACE** | Reveal | Traces hidden causal chains between entities |
| **LIMITS** | Structure | Identifies narrative bottlenecks — structural chokepoints |
| **MODES** | Reveal | Maps parallel storylines and independent threads |
| **MANIP** | Manipulate | Builds explicit action→reaction→consequence chains |
| **ZOOM** | Structure | Decomposes world hierarchy (genre → groups → states) |
| **PLAY** | Manipulate | Counterfactual analysis — removes entities and traces cascades |
| **HOLISTIC** | Meta | Full world audit: census, graph, timeline, inventory |

These are not chat prompts. Each operator has a constrained system prompt, a defined output format, and a specific analytical purpose. The user does not ask the LLM a question. The user *fires an instrument* at a target.

### 6.2 The Aim Mode

In Explore mode, the user clicks nodes to read them — the posture of the reader. In Aim mode (`setMode('fire')`), the user shift-drags between nodes to fire operators — the posture of the operator. This mode switch is not a UI convenience. It encodes the behavioral shift from authorship to operation that the companion paper's concept of thick prompting implies.

The distinction is parallel to the distinction between ekphrasis as literary criticism (reading a description of a shield) and ekphrasis as operative practice (using a description to produce a shield). The Aim mode makes operative ekphrasis a gesture: select an instrument, aim at a target, fire.

### 6.3 The Banned-Word List as Epistemic Filter

The base system prompt includes an explicit prohibition:

> *Never use: "whispers," "beckons," "tapestry," "labyrinthine," "ethereal," "enigmatic," "cryptic," "eldritch."*

These are the words through which LLMs produce what Meyer (2023) identifies as the satisfying appearance of meaning without its substance — what we might call *ekphrastic noise*. The banned-word list is a formal instrument for suppressing this noise, forcing the generative system past comfortable literary tropes toward the specific, the measurable, and the concrete.

In the vocabulary of the companion paper: the banned-word list prevents the operative ekphrasis from collapsing into *thin* prompting. Thin prompting accepts the model's default style. Thick prompting constrains it. The constraint is what makes the output compilable.

---

## 7. Thick Prompting as Spatial Practice

The companion paper identifies six dimensions of thick prompting. Here we show how each is implemented as a spatial practice in the workbench:

### 7.1 Iterative

The section parser (`parseSections()`) decomposes generated text into individually actionable units. Each paragraph in an operator's output gets an action bar: `⊙ Spawn | ⑂ Fork | Copy | ⟩WT`. This means iteration operates at the paragraph level, not the document level. The user does not re-prompt the whole text. The user extracts one section, forks it, compiles the fork, and continues. Iteration is granular and spatial: each iteration produces a new node in a new position, changing the tessellation and the context window for subsequent operations.

### 7.2 Metaprompting

The system is layered: `baseSys` constrains every operator. Each operator constrains the LLM output. The `/wt` compiler constrains the output further by extracting only what fits the WLES ontology. The user constrains the compiler by selecting which nodes to compile and which to leave as raw text. This is metaprompting made architectural — prompts constraining prompts constraining prompts, with each layer enforced by a different component of the system.

### 7.3 Multimodal

The same content exists simultaneously as: canvas node, Voronoi cell, inspector card, REPL output, Markdown export, Twee (Twine) export, and WorldText script. Each representation affords different operations. The canvas affords spatial arrangement. The inspector affords section-level dissection. The REPL affords procedural sequencing. The exports afford cross-platform migration. Movement between representations is the multimodal shuttling that makes prompting thick.

### 7.4 Itinerant

WorldText files (`.md`) can be imported from external editors. Exports can be loaded into Twine, Obsidian, or any Markdown-capable system. The workbench is a transit hub, not a walled garden. The same WorldText grammar that structures the internal ontology also functions as a portable interchange format. This is thick prompting's itinerant dimension: the prompt ecology is not confined to one interface.

### 7.5 Heterogeneous

A single LLM call in the workbench comprises: natural language (the source text), a system prompt (structured instructions), a banned-word list (negative constraints), spatial coordinates (neighbor map), type annotations (WLES classifications), and directed edges (lineage). This is not a sentence submitted to a text box. It is a heterogeneous configuration assembled from multiple data types. The WorldText grammar itself is heterogeneous — mixing natural language descriptions with formal declarations, typed relations, and state assignments.

### 7.6 Performative

The REPL log records the performative unfolding of each session:

```
/add AgriDyneBreach
/add NozomiBreach
/fork 3
/wt 7
/connect 7 12
/ripple 12
/stats
```

This is the epistemic accounting trail — the record of each move in the dialogue between human and system. The log constitutes the method section of thick prompting. It proves that the practice is not a single act of composition but a sequence of operations on a live, changing field.

---

## 8. The Shield as Test Case

The companion paper uses Homer's Shield of Achilles as a demonstration of operative ekphrasis, producing visual artifacts through thick prompting. The workbench extends this demonstration from imagetext to worldtext.

### 8.1 From Image to World

When the Homeric passage (Iliad 18.478–608) is entered as a node in Twine Bridge and compiled with `/wt`, the compiler extracts:

- **Worlds:** The shield itself as a self-contained cosmological container.
- **Locations:** The city at peace, the city at war, the field of cultivation, the vineyard, the dancing floor, the Ocean rim.
- **Entities:** Hephaestus, the armies, the harvesters, the dancers, the cattle, the lions.
- **States:** The city's peace/war condition, the harvest's progress, the dance's tempo.
- **Relations:** Hephaestus crafted the shield. The armies besieged the city. The lions attacked the cattle.

This is the worldtext made explicit. The Homeric passage, which literary scholars have always recognized as containing a complete cosmology, is revealed through compilation to be a world in the formal sense: a structured assembly of typed elements connected by directed relations.

### 8.2 The Multiplicity of Shields

The FORK operator, applied to the compiled shield, generates three alternative shields — one that diverges spatially (different scenes), one temporally (different eras), one causally (different rules of craftsmanship). Each fork can be compiled again, producing new typed elements. The Voronoi canvas fills with overlapping shield-worlds, each a variation on the Homeric original.

This multiplicity is not a failure of the system. It mirrors the multiplicity of oral composition itself — no two performances of the Iliad were identical, yet all drew on the same formulaic system and evoked the same world. The workbench makes this generative multiplicity navigable and compilable.

### 8.3 Auden's Counter-Shield

When Auden's "The Shield of Achilles" (1952) is entered as a second node and placed near the Homeric shield on the canvas, `buildCtx()` assembles both texts as spatial context for subsequent operations. The SURFACE operator, fired between them, traces the causal chains that connect Homer's cosmological optimism to Auden's mid-century bleakness — the same structure (the shield as world-container) filled with opposed content (harmony vs. desolation).

This is operative ekphrasis reading *through* two texts simultaneously — a spatial hermeneutic that the linear page cannot perform. The Voronoi proximity makes the juxtaposition computational, not merely visual.

---

## 9. The Context Engineer

### 9.1 A New Scholarly Posture

The companion paper's framework of thick prompting implies a practitioner. We name this practitioner the *context engineer*: a figure who does not write prompts but arranges conditions; who does not author sequences but configures fields; whose product is not a text but a *thick configuration* from which certain thoughts emerge that no single fragment could produce alone.

The context engineer is the figure that the worldtext demands. An imagetext can be produced by a single prompt. A worldtext cannot. It requires foraging across a field of uneven signal, gathering fragments, compiling them into typed structure, arranging the structure in space, observing the emergent adjacencies, and iterating. This is not authorship. It is cultivation.

### 9.2 The REPL as Method

The REPL history is the context engineer's lab notebook. Each command — `/fork`, `/wt`, `/connect`, `/ripple`, `/stats` — is a methodological move. The sequence of commands constitutes a procedure that can be reproduced, varied, or critiqued. This is what distinguishes thick prompting from casual use: the practice is *auditable*. The epistemic accounting trail makes the work visible in a way that the chatbot's hidden sequence of retries does not.

### 9.3 From the Garden to the Hive

The interface began as a Garden of Forking Paths. The garden metaphor implies a designed space with authored paths — the metaphor of the gardener planting and pruning narrative branches.

But the practice we observe is not gardening. It is foraging. The context engineer navigates a field of uneven signal, scouts productive regions, gathers fragments, and returns to the workbench to compile them. The product is not the flower (the raw LLM output) but the honey (the compiled WLES structure).

The metaphor of the hive, then, is not decorative. It names the ecological structure of the workbench:

| Role | Implementation |
|------|---------------|
| The field | The latent space of the LLM — uneven, seasonal, not fully navigable |
| The forager | The operator — fires into the field and returns with signal |
| The waggle dance | `buildCtx()` — communicates the productive region to the next call |
| The refining enzyme | `/wt` compiler — transforms nectar into honey |
| The pheromone trail | REPL log — marks the path for subsequent operations |
| The hive memory | Canvas state — the accumulated arrangement of all nodes |

The crucial ecological insight is: **nectar is cheap; honey is rare.** Generation is easy. Compilation is hard. The work of thick prompting is not in producing output but in refining it into structure stable enough to be navigated, filtered, and recompiled.

---

## 10. Discussion: WorldText as Contribution

### 10.1 What WorldText Adds to Operative Ekphrasis

Bajohr's concept of operative ekphrasis names the *condition* — the text generates the image. Mitchell's imagetext names the *product* — the merged word-image artifact. WorldText names the *grammar* — the formal language in which operative ekphrasis produces not images but worlds.

The progression is:

```
Ekphrasis (literary description)
  → Operative ekphrasis (description generates image)
    → Imagetext (word-image merge)
      → Worldtext (word-world merge)
        → WorldText grammar (compilable world description)
          → WLES ontology (typed world decomposition)
            → /wt compiler (the instrument that closes the loop)
```

Each step adds structure. The contribution of this paper is the bottom three: the grammar, the ontology, and the compiler that makes the theoretical framework operational.

### 10.2 What the Compiler Reveals

The compiler loop reveals a property of thick prompting that the theoretical framework implies but cannot demonstrate without an instrument: **thick prompting is recursive**. The output of one generation becomes the input of the next compilation. The compiled structure enters the spatial field. The field's new configuration generates new spatial context. The new context produces new output. The loop does not converge. There is no final prompt.

This non-convergence is not a bug. It corresponds to Geertz's observation that thick description is "always provisional, potentially endless." The worldtext, like the culture Geertz describes, is not a fixed object but a living system that discloses new structure under each pass of the interpretive loop.

### 10.3 What the Spatial Canvas Reveals

The Voronoi canvas reveals a property of thick prompting that the chatbot paradigm conceals: **arrangement is argument**. When Homer's shield and Auden's counter-shield occupy adjacent Voronoi cells, their juxtaposition is not an aesthetic choice. It is a computable variable in the context function. The LLM literally receives both texts when generating a response to either.

This transforms the practice of reading from sequential to spatial. One does not read *through* Homer and *then* Auden. One arranges them on a field and observes what the spatial configuration produces. This is what the companion paper calls the shift "from the garden of forking paths to the field of semantic operations."

### 10.4 Limitations

The 2D canvas collapses high-dimensional semantic relationships into two spatial dimensions. Nodes that are conceptually "near" in the model's latent space may be distant on the canvas, and vice versa. The Voronoi tessellation provides a *lossy but operable* proxy for semantic affinity — useful for interactive work but not a faithful projection of the model's internal geometry.

The compiler is also imperfect. LLM output approximates the WorldText grammar rather than executing it deterministically. The fallback parser recovers partial structure when strict parsing fails, but some information is always lost. Reification fidelity is a continuous metric, not a binary.

These limitations are theoretically productive. They demonstrate that the worldtext, like all representations, is approximate — that the collapse of word and world is never complete. This incompleteness is what keeps the hermeneutic loop open and the practice of thick prompting generative.

---

## 11. Conclusion: The Shape of the Table

We opened the companion paper with Homer's shield — an ekphrasis that contains a world. We close this paper with the instrument that makes that containment compilable.

The contribution is not the prose the system generates. The contribution is the compilation — the capacity to take any text, however liquid, and refine it into a typed, navigable, filterable world structure that can be arranged in space, operated on with analytical instruments, and recompiled into further structure.

The worldtext is not a concept waiting for an implementation. It is a grammar, an ontology, a compiler, and a spatial canvas. The thick prompt is not a long sentence. It is a configuration of spatial, linguistic, ontological, and procedural elements assembled by the workbench from the state of the field. The context engineer is not an author. The context engineer is the figure who arranges fragments on a table until the unthinkable conclusion becomes visible.

The question this work leaves open is the one Geertz left open: when does the description become thick enough? When has the world been compiled sufficiently? The answer is the same: never finally. The loop stays open. The field keeps reconfiguring. The compilation continues.

Perhaps the contribution is not the answer but the shape of the table on which the fragments are laid.

---

## References

Almeda, P., et al. (2024). "Dreamsheets: A Spreadsheet-Based Workflow for Generative AI Image Creation." *Proceedings of DIS 2024*.

Bajohr, H. (2024). "Operative Ekphrasis: The Collapse of Description and Generation in AI Image Synthesis." *Critical AI*, 2(1).

Brade, S., et al. (2023). "Promptify: Text-to-Image Generation through Interactive Prompt Exploration with Large Language Models." *Proceedings of CHI 2023*.

Brosch, R. (2018a). "Ekphrasis in the Digital Age." *Poetics Today*, 39(2).

Brosch, R., ed. (2018b). Special Issue on Ekphrasis. *Poetics Today*, 39(2).

Bush, V. (1945). "As We May Think." *The Atlantic Monthly*, July.

Chang, M., et al. (2023). "Prompt as Art." *Proceedings of C&C 2023*.

Ceurstemont, S. (2025). "3D World Generation through Metaprompting." *Preprint*.

Geertz, C. (1973). "Thick Description: Toward an Interpretive Theory of Culture." In *The Interpretation of Cultures*. Basic Books.

Ha, D. & Schmidhuber, J. (2018). "World Models." *arXiv:1803.10122*.

Hartsoe, W. & Bolter, J. D. (forthcoming). "From Imagetext to Worldtext: Generative AI as Operative Ekphrasis."

Hayles, N. K. (1999). *How We Became Posthuman*. University of Chicago Press.

He, Z., et al. (2024). "Prompt Refinement Strategies for Text-to-Image Generation." *Proceedings of EMNLP 2024*.

Heffernan, J. (2004 [1993]). *Museum of Words: The Poetics of Ekphrasis from Homer to Ashbery*. University of Chicago Press.

Krieger, M. (1992). *Ekphrasis: The Illusion of the Natural Sign*. Johns Hopkins University Press.

Lessing, G. E. (1766). *Laocoon: An Essay on the Limits of Painting and Poetry*.

Liu, V. & Chilton, L. (2023). "Design Guidelines for Prompt Engineering Text-to-Image Generative Models." *Proceedings of CHI 2023*.

Manovich, L. (2023). "AI and the Latent Space." Unpublished manuscript.

Meyer, R. (2023). "Machine Ekphrasis: On the Aesthetics of AI Image Generation." *Texte zur Kunst*, 130.

Mitchell, W. J. T. (1994). "Ekphrasis and the Other." In *Picture Theory*. University of Chicago Press, 151–181.

Nelson, T. (1974/1981). *Computer Lib / Dream Machines*; *Literary Machines*.

Oppenlaender, J. (2024a). "The Practice of Promptcraft." *Proceedings of CHI 2024*.

Oppenlaender, J. (2024b). "Promptcraft as Human-AI Co-Creation." *AI & Society*.

Oppenlaender, J., et al. (2024). "Taxonomy of Prompt Modifiers for Text-to-Image Generation." *Proceedings of CHI 2024*.

Siddiqui, A. (2025). "JSON Prompting for Structured AI Outputs." Community blog post.

Taplin, O. (1980). "The Shield of Achilles within the *Iliad*." *Greece & Rome*, 27(1).

Zhang, Y., et al. (2025). "Metaprompting: A Survey." *arXiv preprint*.

Zhao, Y., et al. (2024). "Multimodal Metaprompting for 3D Scene Generation." *Proceedings of SIGGRAPH 2024*.
