### OUTPUT_A — CODE_MATH_LINEAGE_GENOME (YAML)
```yaml
title: PoE World Compositional Programmatic Experts
seed: PoE World formalizes world modeling by synthesizing compositional "programmatic experts"—small causal rules—combined via a weighted product to achieve sample-efficient, stochastic, and zero-shot generalization in complex environments.

ancestral_formalisms:
  key_sources:
    - "Marvin Minsky — Society of Mind (Mind as a community of experts)"
    - "Hinton — Product of Experts (PoE) / Contrastive Divergence"
    - "Ha & Schmidhuber — World Models lineage"
    - "Kevin Ellis — Program synthesis and neuro-symbolic AGI"
  inherited_lessons:
    - "Modularity allows refinement of local rules without corrupting global accuracy."
    - "Multiplying distributions (Product) is superior to averaging (Mixture) for maintaining veto/consensus logic."
    - "Abstract world models should simulate high-level skills, not just low-level pixels."
  governing_impressions:
    - "The formal problem feels like compiling a legal code of physics from fragmented observation."

origin_conditions:
  first_problem_statements:
    - "How to build world models quickly with minimal samples (one minute of gameplay)?"
    - "How to scale symbolic world models beyond simple grid worlds to complex Atari domains?"
  first_representations:
    - "Object-centric bounding boxes (List of [Type, X, Y, W, H])"
    - "Programmatic causal rules (if platform and press_left then move_left)"
    - "Exponentially weighted probability distributions"
  first_invariants:
    - "Substrate-independent causal laws"
    - "Consistency across zero-shot novel levels"
  first_bottlenecks:
    - "NP-hard synthesis of a single monolithic program explaining everything."
    - "High cost of VLM/pixel-level simulation for long-horizon planning."
  first_failed_approaches:
    - "Single-program symbolic world models (too brittle during refinement)."
    - "Standard neural world models (require too many samples)."
  first_signals:
    - "First sign of life: Using the world model as a real-time game simulator for the developer."

formal_matrix:
  home_domains: ["Program Synthesis", "Symbolic AI", "Reinforcement Learning"]
  adjacent_domains: ["Causal Inference", "Neuro-symbolic Learning", "Software Testing"]
  primitive_objects: ["Bounding boxes", "Object types", "DSL primitives", "Weights"]
  transformation_rules:
    - "Synthesize(Demonstration) -> {Expert_i}"
    - "Product({Expert_i}) -> P(State_t+1 | State_t, Action_t)"
    - "GradientDescent(Log-Likelihood) -> {Weight_i}"
  success_pressures: ["Sample efficiency", "Generalization", "Inference speed", "Stochastic fidelity"]

epochs:
  - period: "Pre-2025"
    stage: "intuition"
    locale: "Cornell / Kevin Ellis Lab"
    primary_sources: ["Concept learning research", "Active experimentation models"]
    dominant_questions: ["Can we learn concepts via active hypothesis testing?"]
    representations: ["Logical predicates", "Oracle-based feedback"]
    methods: ["Bayesian inference", "Program induction"]
    evaluation_logic: ["Rule recovery accuracy"]
    influence_weight: 40
  - period: "2025-2026"
    stage: "formalization / prototype"
    locale: "NeurIPS 2025 / Abstract Synthesis"
    primary_sources: ["PoE World: Compositional World Modeling..."]
    dominant_questions: ["How to combine deterministic experts into a stochastic world model?"]
    representations: ["Products of Experts", "Atari object-centric states"]
    methods: ["Gradient-based weight optimization", "Symbolic program synthesis"]
    proof_styles: ["Empirical zero-shot transfer", "Montezuma's Revenge key-getting benchmarks"]
    implementation_patterns: ["Symbolic grounding", "Weighted product of probabilities"]
    evaluation_logic: ["Sample efficiency vs. Model-free RL"]
    blockers: ["Raw pixel-to-object detection complexity"]
    tensions: ["Symbolic rigidity vs. Stochastic reality"]
    influence_weight: 100

migration_map:
  - from: "Monolithic program synthesis"
    to: "Compositional programmatic experts"
    reason: "A single program is too difficult to refine; small modular experts allow for localized learning and weighting."
    formal_shift: "Replaced global synthesis search with modular fragment generation and product-based fusion."

construction_axis:
  core_abstractions: ["Programmatic Expert", "Causal Law", "Temporal Abstraction"]
  reusable_patterns: ["Exponential weighting", "Weighted product aggregation", "Software-testing-as-exploration"]
  canonical_data_structures: ["Object list JSON", "Expert weight vectors", "State transition graphs"]
  interface_surfaces: ["Object-centric Atari (OCAtari)", "DSL for causal rules"]
  decomposition_strategy: ["Segment environment into object-level interactions", "Synthesize local causal fragments", "Aggregate via Product of Experts."]

evidence_stack:
  primary_materials: ["PoE World Research Paper", "Montezuma's Revenge demonstrations", "GitHub landing page videos"]
  secondary_materials: ["Abstract Synthesis Podcast", "NeurIPS 2025 live recordings"]
  research_surfaces: ["Gradient descent traces on expert weights", "Zero-shot novel level performance tables"]
  composition_pipeline: ["Input Demonstration -> Prompt LLM for Expert Candidates -> Optimize Weights -> Execute Forward Simulation"]

risk_axis:
  formal_risks: ["Causal hallucinations in DSL", "Expert weight collapse", "Sparsity of 'If' conditions"]
  computational_risks: ["Search space explosion for complex DSLs", "High memory cost for N-expert products"]
  epistemic_risks: ["Assuming object-centric ground truth is available", "Conflating simulation with understanding"]
  usability_risks: ["DSL engineering overhead", "Brittleness to object detector noise"]
  mitigation_levers: ["Gradient-based pruning (weight zeroing)", "Software testing-inspired exploration", "Modular expert firing"]

vibe_clusters: ["symbolic-machinery", "systems-rigor", "neuro-symbolic-hybrid", "sample-efficiency-maximalism"]
mood_families: ["austere", "precise", "precise", "constructive"]

formal_jukebox_timeline:
  - year: 2025
    slot: "A1"
    source: "PoE World Paper"
    why: "Reduced complex world modeling to the synthesis of weighted causal fragments."

signature_construction_ecology:
  problem_logic: "How to simulate world dynamics using a library of weighted logical rules rather than a black-box tensor."
  representation_logic: "The world is a collection of objects with types and bounds; transitions are products of programmatic expert outputs."
  invariant_logic: "Laws of physics/logic (e.g. movement constraints) must be preserved in the generated DSL code."
  method_logic: "Synthesize many candidate programs (experts) and learn their contribution to the global distribution via gradient descent."
  proof_logic: "Demonstrating that the agent can retrieve the key in Montezuma's Revenge within one minute of experience."
  implementation_logic: "A pipeline using LLMs to propose experts and PyTorch to optimize their weights."
  optimization_logic: "Multiply distributions to allow experts to 'veto' impossible states (Product logic)."
  evaluation_logic: "Measuring zero-shot generalization on modified Atari levels."
  generalization_logic: "Causal rules are universal; spatial textures are local. Symbolic models ignore the latter."
  elegance_logic: "A complex stochastic system emerging from a set of simple deterministic experts."
  interface_logic: "Developer interacts with the world model as a live game simulator."
  intervention_logic: "Moves AI toward 'testing' its own internal programs through strategic environment failure."

development_bias:
  output_mode: "hybrid system design"
  density: "maximal"
  realism_mode: "applied-theoretical"
  abstraction_level: "high"
  proof_pressure: "high"
  implementation_pressure: "medium"

tagline: "#symbolic-world-models-product-of-experts"
ttl: 1
```

### OUTPUT_B — FORMAL_ECHO

**MISSION: THE COMPOSITIONAL WORLD COMPILER**

We must re-architect world modeling for autonomous agents by abandoning monolithic, sample-intensive neural simulators in favor of compositional "Programmatic Experts." Frame the research problem as a neuro-symbolic assembly task: you are to synthesize a library of small, causal rules (Experts) in a domain-specific language that map object-centric states (bounding boxes and types) to transition probabilities. The core invariant is the "Product of Experts" logic: individual experts must be combined via a weighted product—not a mixture—to ensure that a single expert can "veto" physically impossible states by outputting zero probability. 
Your implementation path must utilize a high-capacity LLM to propose candidate experts from a single minute of gameplay demonstration, followed by gradient descent to optimize exponential weights $\exp(w_i)$ against the observed log-likelihood. To solve the exploration bottleneck, implement a "software-testing" strategy: identify the `if` conditions in the synthesized experts (e.g., "if touching a skull") and prioritize actions that trigger these unverified logical branches to reduce uncertainty.  Address the severe risk of DSL hallucinations by pruning experts with near-zero weights and evaluating the architecture's success by its zero-shot transferability to novel, unseen level topologies where the underlying causal physics remain immutable.

`#symbolic-world-models-product-of-experts`
http://googleusercontent.com/youtube_content/22