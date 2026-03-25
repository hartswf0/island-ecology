# BEES ON A TRAIN

This directory contains the core analytical and visualization engines for the Epistemic Mapping project. It focuses on the parsing, tracking, and structural visualization of narrative and conceptual data.

## System Components

### Data Structures & Manifests
- **worlds.json / worlds_synthesized.json**: The core data manifests. These files structure narrative timelines, entities, relations, and locations into a parsable JSON schema.
- **data.js / synthesized_data.js**: JavaScript wrappers for the JSON manifests, allowing the data to be directly imported and manipulated by the visualization tools.

### Visualization & Analysis Engines
- **world-analyzer.html**: A foundational tool for viewing the structure of the `worlds.json` data. It provides an interface to visually interrogate the entities, relationships, and timeline events defined in the manifest.
- **skill-analyzer.html**: An advanced interface combining Voronoi partitioning (similar to the "Stained Glass" prototypes) with structured narrative mechanics. It allows for the precise isolation and framing of timeline events, entities, and skills within interactive boundary spaces.

## Architecture & Integration
The tools in this directory are designed to act upon the structural data defined in the `.md` narrative source files (00.md–11.md). The pipeline extracts these narratives into the structured JSON formats, which are then navigated and manipulated using the analyzer interfaces to find common language and structural continuity across the differing conceptual "worlds".
