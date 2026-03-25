Here are concrete operator examples for each major lever in this file.

**GENERATE — instantiate**

* Input: `drowned switchyard monastery`
* What you do: type that in the top concept field and hit **GENERATE**.
* What happens: the file either builds a fresh topology from that concept or, in real mode without a valid live result, leaves the field blank rather than faking it. The UI itself uses `drowned switchyard monastery` as the example concept placeholder.

**DEMO — bootstrap**

* Input: click **DEMO** with no key.
* What happens: the system boots local fallback minds and local image synthesis, then auto-drops the first seed stone. In demo mode the file can build a six-site local topology from theme banks like `Switchyard`, `Turbine Well`, `Fuse Chapel`, `Iron Dormitory`, `Cooling Reef`, and `Conveyor Mouth`.

**INTEGRATE — inject**

* Input: `The primary structural beam snaps above the flooded fuse chapel.`
* What you do: put that in the bottom stone input and press **INTEGRATE**.
* What happens: the text is sent into the selected site as a stone; the file logs it as `STONE`, updates source trace/frontier behavior, and pushes the site forward under the currently selected mode. The bottom bar is explicitly labeled `Inject vector into selected site...` and the button handler routes the text to `processStone(...)`.

**Mode = SHIFT — classify as state change**

* Example stone: `The waterline climbs two feet overnight.`
* Use this when you want a condition change, drift, mood shift, or environmental tilt rather than a hard objective or barrier. The mode cycle starts at `∫ IMPLICIT: SHIFT` and rotates through the three classes.

**Mode = GOAL — classify as target**

* Example stone: `Route power from the signal tower back into the dock ring.`
* Use this when the event should act like a directed aim or task pressure. The UI labels this mode `Δ EXPLICIT: GOAL`. 

**Mode = OBSTACLE — classify as blockage**

* Example stone: `The causeway collapses; no one crosses without entering the reeds.`
* Use this when the stone should function as a constraint, failure, or boundary. The UI labels this `∞ BOUNDARY: OBSTACLE`. 

**CONJURE — append**

* Input: `Refueling Depot`
* What you do: type that in the right-panel **CONJURE ENTITY** input and press **CONJURE**.
* What happens: the file attempts to graft a new site into the live field. The UI literally frames this as `Forge a new site...`, and the handler sends the text to `conjureEntity(text)`.

**MAKE — materialize**

* Example use: select `Fuse Chapel`, then hit **MAKE** after you have at least one active gallery line.
* What happens: the file forces image creation for the selected site by calling `ensureNodeImage(node, true)`. In demo mode that can become local image synthesis; in real mode it uses the photosphere image path. The global image preprompt demands one coherent, seamless equirectangular 360 photosphere with grounded materials and no collage/UI/text junk.

**VIEW — inspect**

* Example use: after MAKE finishes on `Cooling Reef`, press **VIEW**.
* What happens: the file opens the **IMAGE VIEWER** dock for the selected node so you can inspect the image, the chosen line, and the scene brief. The handler calls `openImageDock(node.id)`.

**SCOUT — capture**

* Example use: frame the site the way you want, then press **SCOUT**.
* What happens: the file captures a scout frame from the current view via `captureScoutFrame`. This is the “take the still” operator, separate from MAKE. 

**SITE - / SITE + — traverse nodes**

* Example use: tap **SITE +** until you move from `Switchyard` to `Fuse Chapel`, then inject the next stone there.
* What happens: these buttons step the selected node backward or forward through active sites. The handlers call `stepSelectedNode(-1)` and `stepSelectedNode(1)`.

**LINE - / LINE + — traverse variants**

* Example use: after a node speaks multiple lines, use **LINE +** to move from one gallery line to the next.
* What happens: these buttons step through the selected node’s gallery entries, not through different sites. The handlers call `stepSelectedGallery(-1)` and `stepSelectedGallery(1)`.

**EXIT 360 — reframe**

* Example use: enter a site image, scout inside it, then hit **EXIT 360** to return to the outer orbit camera.
* What happens: the file clears immersive node state and resets the camera target back toward the selected node’s mesh. 

**ZEN — strip interface**

* Example use: once the field is running, press **ZEN** to hide the heavy chrome and keep a leaner bottom control strip.
* What happens: header, left panel, right panel, overlay strip, and legend fade out; the bottom bar becomes a compact floating control surface. 

**RING BUFFER — rewind**

* Example use: let the field evolve for a while, then drag the timeline scrubber back to an earlier tick.
* What happens: the UI exposes a bottom `RING BUFFER` scrubber tied to tick history, so you can move backward through stored simulation state rather than only looking at the live present. 

A clean example session would be:

1. **GENERATE** with `drowned switchyard monastery`.
2. **SITE +** until `Fuse Chapel` is selected.
3. Set mode to **OBSTACLE**.
4. **INTEGRATE**: `The primary structural beam snaps above the flooded fuse chapel.`
5. **CONJURE**: `Emergency Pump House`
6. **MAKE** on the active site.
7. **VIEW** the image.
8. **LINE +** through variants.
9. **SCOUT** the frame you want.

If you want, I’ll do the next layer: **example JSON-ish payloads** for one GENERATE, one INTEGRATE, one CONJURE, and one MAKE cycle, translated into plain English.
