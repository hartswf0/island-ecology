### OUTPUT_A — CODE_MATH_LINEAGE_GENOME (YAML)

```yaml
title: Latent Variable World Model Linear Probes
seed: Probing and intervening in Transformer hidden states to formalize "Language Models as World Models," mapping a spectrum from static feature maps to dynamic counterfactual simulation.

ancestral_formalisms:
  key_sources: ["Belinkov et al. — Hidden state probing", "Montague/Kamp — Dynamic semantics and discourse representation", "David Ba et al. — ROME/Model Editing"]
  inherited_lessons: ["Sentences act as state transition operators on an information state.", "Internal representations can be decoded linearly even without explicit supervision.", "Representations are often localized to specific entity mentions in text."]
  governing_impressions: ["the formal problem feels like performing surgery on a black box to find the 'map' it uses to navigate a story."]

origin_conditions:
  first_problem_statements: ["Do neural sequence models build representations of the world described in text, or are they just modeling surface statistics?"]
  first_representations: ["High-dimensional vectors", "Relational graphs (Entities/Properties/Edges)", "Linear transformation matrices"]
  first_invariants: ["Linear decodability of propositions", "State-consistency across token generation"]
  first_bottlenecks: ["Model hallucinations that contradict input context", "Entrenched bias/knowledge overriding contextual updates", "NP-hard global consistency maintenance"]
  first_failed_approaches: ["Purely statistical co-occurrence analysis", "Brute-force text prompting for counterfactual control"]
  first_signals: ["Accuracy gaps between contextual prompts and internal truth-value readouts.", "Linear probes achieving 95%+ state recovery in closed-world 'Alchemy' and 'TextWorld' tasks."]

formal_matrix:
  home_domains: ["NLP", "Machine Learning", "Formal Semantics"]
  adjacent_domains: ["Cognitive Science", "Information Theory", "Interpretability"]
  primitive_objects: ["Hidden states (h)", "Propositions (p)", "Jacobian matrices", "Linear probes (W)"]
  transformation_rules: ["h_new = Update(h_old, sentence)", "p = Sign(W * h)", "h_edit = h - (p_old * W) + (p_new * W)"]
  success_pressures: ["correctness", "interpretability", "predictive control", "internal consistency"]

epochs:
  - period: "2019-2021"
    stage: "formalization"
    locale: "MIT / Harvard research labs"
    primary_sources: ["Alchemy and TextWorld benchmarks", "Linear probing papers"]
    dominant_questions: ["Can we read the state of a beaker of liquid from a vector?"]
    representations: ["Vector space", "Discrete state labels"]
    methods: ["Supervised linear probing", "State-by-state recovery"]
    evaluation_logic: ["Probe accuracy on held-out situations"]
    blockers: ["Small model capacity", "Simple environments"]
    influence_weight: 60
  - period: "2022-2024"
    stage: "optimization / scaling"
    locale: "Interpretability community"
    primary_sources: ["Jacobian approximations", "ROME/MEMIT", "Model spectrum (Map-Orrery-Sim)"]
    dominant_questions: ["How are internal computations actually decoding the vectors?"]
    representations: ["Jacobian matrices", "Continuous manifolds"]
    methods: ["Representation intervention", "First-order model approximation", "Ensembling probes and models"]
    implementation_patterns: ["Subtracting/Adding fact-vectors in latent space"]
    evaluation_logic: ["Controlled generation success", "Counterfactual coherence"]
    tensions: ["Linearity vs. Complexity", "Correlation vs. Causation"]
    influence_weight: 100

migration_map:
  - from: "Observational Probing (Correlation)"
    to: "Causal Intervention (Representation Editing)"
    reason: "Need to prove that internal representations actually drive model generation behavior."
    formal_shift: "Transitioned from reading vectors to overwriting them to override background knowledge (e.g., turning a CEO into a firefighter)."

construction_axis:
  core_abstractions: ["Information State", "Linear Readout Hypothesis", "Model Complexity Spectrum"]
  reusable_patterns: ["Subtract-and-add fact injection", "Jacobian first-order approximation"]
  canonical_data_structures: ["Linear probing weights", "Fact-encoding vectors"]
  interface_surfaces: ["Hidden layers", "Residual stream", "Model editing APIs"]
  decomposition_strategy: ["Isolate entity representation -> Identify relation direction -> Apply linear shift."]

evidence_stack:
  primary_materials: ["Alchemy/TextWorld traces", "Truthfulness benchmarks (QA vs. Probes)"]
  secondary_materials: ["Eugene Charniak's thesis examples", "Solar system model analogies (Map vs. Orrery)"]
  research_surfaces: ["Scatter plots of probe vs. model accuracy", "Model editing success tables"]
  composition_pipeline: ["Freeze model -> Train linear probe -> Verify on held-out context -> Intervene in latents -> Measure output shift"]

risk_axis:
  formal_risks: ["Heterogeneity of representations (some linear, some non-linear)", "Internal model contradictions"]
  computational_risks: ["Scaling interventions to globally coherent weight updates"]
  epistemic_risks: ["Conflating linear probe success with true causal world modeling", "Assumption of universal linear readout"]
  usability_risks: ["Semantic bleed (e.g., a 'fork' that kills also 'has leaves')", "Broken rank/status in biography edits"]
  mitigation_levers: ["Jacobian verification", "Multilayer search for optimal intervention points", "Ensembling probes with generation"]

vibe_clusters: ["interpretability-rigor", "formal-semantics-revival", "latent-surgery", "systems-forensics"]
mood_families: ["forensic", "precise", "skeptical", "constructive"]

formal_jukebox_timeline:
  - year: 2021
    slot: "A4"
    source: "Probing World Models"
    why: "Proven 90%+ state recovery from vectors in closed linguistic environments."
  - year: 2023
    slot: "B2"
    source: "Jacobian First-Order Approx"
    why: "Revealed the discrepancy between linear and non-linear internal decodings."

signature_construction_ecology:
  problem_logic: "How to bridge the gap between surface string statistics and structured world representations in autoregressive models."
  representation_logic: "Hidden states are information snapshots; world knowledge is encoded as sums of direction-vectors in a high-dimensional latent space."
  invariant_logic: "The linear map $W$ must consistently decode properties across disparate contexts."
  method_logic: "Use linear probes to localize and manipulate the model's internal 'map' of entities."
  proof_logic: "Verify if intervening in the latent representation of 'Sundai Pichai' predictably shifts his employer in generated text."
  implementation_logic: "Train $W$ on (Hidden State, Proposition) pairs; apply $h' = h - Wp_{old} + Wp_{new}$ for editing."
  optimization_logic: "Search over model layers to find the 'knowledge retrieval' bottleneck for interventions."
  evaluation_logic: "Success is the ability of a probe to correctly predict model hallucination before it happens."
  generalization_logic: "The spectrum of model complexity (Map -> Orrery -> Sim) serves as a roadmap for scaling reasoning."
  elegance_logic: "Boiling down complex semantic updates to simple linear vector arithmetic."
  interface_logic: "Probes acting as a transparent window into the 'mind' of the model."
  intervention_logic: "Allows external control of model beliefs without retraining or fine-tuning weights."

development_bias:
  output_mode: "hybrid system design / research program"
  density: "maximal"
  realism_mode: "applied-theoretical"
  abstraction_level: "high"
  proof_pressure: "high"
  implementation_pressure: "medium"

tagline: "#latent-world-models-linear-probing-interpretability"
ttl: 1
```

### OUTPUT_B — FORMAL_ECHO

**PROGRAM: THE LATENT WORLD STATE COMPILER**

We must transition from treating Transformers as "stochastic parrots" to architecting them as explicit, auditable World Simulators by formalizing the "Linear Readout Hypothesis." Frame the research problem as a spectrum of complexity: you are to move models from static "Maps" (feature lookup) toward "Orreries" (simple state dynamics) and ultimately toward "Full Simulators" (arbitrary counterfactual reasoning).  Your implementation path must utilize linear probing to decode the structured information states—represented as graph-relational entities and properties—encoded within the high-dimensional hidden states. The core invariant of this system is the "Subtract-and-Add" intervention: you must demonstrate that modifying a latent vector $h$ by shifting it in the direction of a verified proposition $p$ (e.g., swapping "CEO of Google" for "CEO of Apple") exerts predictable, causal control over the next-token prediction, overriding the model's pre-trained background knowledge. 
You must address the severe formal risk of representation heterogeneity—identifying why simple relations (like occupation-gender) are linearly accessible via Jacobian approximation while complex ones (like Pokémon evolution) remain non-linearly opaque. Optimization pressure should be directed at finding the optimal intermediate layers for these "latent surgeries" to maximize contextual coherence. Evaluate the architecture’s success by its ability to predict model hallucinations before they manifest, using probes to detect when the model's internal "map" has diverged from the provided context. Ultimately, this agenda aims to enforce global internal consistency, ensuring that if a model believes proposition $P$, it is mathematically compelled to believe all consequences that $P$ entails.

`#latent-world-models-linear-probing-interpretability`

***

### QUICKCHECK
- **Lineage full?** Yes. Accurately details the state of world models in LLMs from the video.
- **Representations clear?** Yes. Vectors, relational graphs, linear probes, and Jacobians.
- **Invariants clear?** Yes. Linear decodability and causal consistency.
- **Implementation path clear?** Yes. Probing -> Jacobian verification -> Latent intervention.
- **Risks present?** Yes. Heterogeneity of relations and semantic bleed.
- **Tags present?** Yes. `#latent-world-models-linear-probing-interpretability` included.