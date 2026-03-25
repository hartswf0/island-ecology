/**
 * SCREENPLAY DIRECTOR — BEES ON A TRAIN
 * Director/Actor pipeline for constrained narrative traversal.
 * Consumes routes from RouteEngine, manages global narrative state,
 * and generates structured screenplay segments.
 */

const ScreenplayDirector = (() => {

  // ═══════════════════════════════
  // GLOBAL NARRATIVE STATE
  // ═══════════════════════════════
  let state = {
    current_world: null,
    act_number: 1,
    tension: 0,          // 0–100: narrative tension gradient
    semantic_density: 0,  // entity mentions per scene
    visited: new Set(),
    unresolved_threads: [],
    voice_registers: {},  // entity_name -> register string
    trajectory: []        // ordered list of visited world UIDs
  };

  function reset() {
    state = {
      current_world: null, act_number: 1, tension: 0,
      semantic_density: 0, visited: new Set(),
      unresolved_threads: [], voice_registers: {},
      trajectory: []
    };
  }

  // ═══════════════════════════════
  // TENSION GRADIENT
  // ═══════════════════════════════
  // Models narrative velocity — how fast tension should rise based on act
  const TENSION_TARGETS = { 1: 30, 2: 70, 3: 95 };
  const TENSION_FLOOR   = { 1: 0,  2: 25, 3: 60 };

  function tensionDelta(fromWorld, toWorld, routeType) {
    const weights = {
      causal_route:   15,
      timeline_route: 10,
      entity_bridge:  8,
      geo_route:      5,
      genre_corridor: 3,
      chapter_route:  2
    };
    let delta = weights[routeType] || 5;

    // Bonus for cross-genre transitions (dissonance = tension)
    if (fromWorld.genre !== toWorld.genre) delta += 5;

    // Bonus for advancing acts
    const fromAct = RouteEngine.getAct(fromWorld.timeline_phase);
    const toAct = RouteEngine.getAct(toWorld.timeline_phase);
    if (toAct > fromAct && toAct > 0) delta += 10;

    return delta;
  }

  // ═══════════════════════════════
  // ROUTE SCORING (MDP-like selection)
  // ═══════════════════════════════
  function scoreRoute(route, parsedWorlds, worldMap) {
    const from = worldMap[route.from];
    const to = worldMap[route.to];
    if (!from || !to) return -Infinity;

    let score = 0;

    // 1. Novelty — prefer unvisited worlds
    if (!state.visited.has(route.to)) score += 30;
    else score -= 20;

    // 2. Tension fitness — prefer routes that move tension toward act target
    const target = TENSION_TARGETS[state.act_number] || 70;
    const delta = tensionDelta(from, to, route.type);
    const newTension = Math.min(100, state.tension + delta);
    const fitnessAfter = 1 - Math.abs(newTension - target) / 100;
    score += fitnessAfter * 25;

    // 3. Route weight
    score += route.weight * 10;

    // 4. Causal routes get priority — they advance the narrative logically
    if (route.type === 'causal_route') score += 15;
    if (route.type === 'timeline_route') score += 10;

    // 5. Penalize staying in same act too long
    const sameActWorlds = state.trajectory.filter(uid => {
      const w = worldMap[uid];
      return w && RouteEngine.getAct(w.timeline_phase) === state.act_number;
    }).length;
    if (sameActWorlds > 8) score -= 15;

    // 6. Struct invariant: don't allow Act III before visiting at least 5 Act II worlds
    const toAct = RouteEngine.getAct(to.timeline_phase);
    if (toAct === 3) {
      const act2Count = state.trajectory.filter(uid => {
        const w = worldMap[uid];
        return w && RouteEngine.getAct(w.timeline_phase) === 2;
      }).length;
      if (act2Count < 5) score -= 50;
    }

    return score;
  }

  // ═══════════════════════════════
  // NEXT WORLD SELECTION
  // ═══════════════════════════════
  function selectNext(routes, parsedWorlds) {
    if (!state.current_world) return null;

    const worldMap = {};
    parsedWorlds.forEach(w => worldMap[w.uid] = w);

    // Get all routes from current world
    const candidates = routes.filter(r =>
      r.from === state.current_world || r.to === state.current_world
    ).map(r => ({
      route: r,
      target_uid: r.from === state.current_world ? r.to : r.from,
      score: scoreRoute(r, parsedWorlds, worldMap)
    }));

    if (candidates.length === 0) return null;

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Return top 5 candidates for the UI
    return candidates.slice(0, 5).map(c => ({
      uid: c.target_uid,
      world: worldMap[c.target_uid],
      route: c.route,
      score: Math.round(c.score),
      tension_delta: tensionDelta(
        worldMap[state.current_world],
        worldMap[c.target_uid],
        c.route.type
      )
    }));
  }

  // ═══════════════════════════════
  // TRAVEL — Execute a transition
  // ═══════════════════════════════
  function travel(toUid, routeType, parsedWorlds) {
    const worldMap = {};
    parsedWorlds.forEach(w => worldMap[w.uid] = w);

    const from = worldMap[state.current_world];
    const to = worldMap[toUid];
    if (!to) return null;

    // Update tension
    const delta = tensionDelta(from || to, to, routeType);
    state.tension = Math.min(100, state.tension + delta);

    // Track visit
    state.visited.add(toUid);
    state.trajectory.push(toUid);
    state.current_world = toUid;

    // Auto-advance act based on tension thresholds
    if (state.tension >= 60 && state.act_number === 1) state.act_number = 2;
    if (state.tension >= 85 && state.act_number === 2) state.act_number = 3;

    // Update semantic density
    state.semantic_density = to.entities.length + to.relations.length;

    // Track unresolved threads from events
    to.events.forEach(ev => {
      ev.effects.forEach(eff => {
        if (eff.includes('null') || eff.includes('unknown') || eff.includes('compromised')) {
          state.unresolved_threads.push({
            source: toUid,
            description: `${ev.name}: ${eff}`
          });
        }
      });
    });

    return {
      world: to,
      act: state.act_number,
      tension: state.tension,
      density: state.semantic_density,
      actor_type: RouteEngine.getActorType(to.genre),
      route_type: routeType,
      unresolved: state.unresolved_threads.length
    };
  }

  // ═══════════════════════════════
  // ACTOR SYSTEM PROMPTS
  // ═══════════════════════════════
  const ACTOR_PROMPTS = {
    catastrophe: `You are the CATASTROPHE NARRATOR. Your voice is clinical, haunted, precise.
You describe systemic failures, swarm dynamics, and containment breaches with the cold clarity of an after-action report.
Use short declarative sentences. Name specific locations, times, coordinates.
Every sentence should feel like evidence entered into a record.`,

    espionage: `You are the INTELLIGENCE BRIEFING NARRATOR. Your voice is encrypted, laconic, operational.
You describe covert infrastructure, cover identities, and institutional betrayal as if reading from a classified dossier.
Use code names. Refer to locations by coordinates. Emotions are tactical data.`,

    thriller: `You are the ACTION SEQUENCE NARRATOR. Your voice is kinetic, pressurized, immediate.
You describe confined violence, enforced silence, and lethal physics on moving vehicles.
Every scene has a clock. Every object is a weapon or a constraint. Speed is information.`,

    cultural: `You are the ECOLOGICAL WITNESS. Your voice is patient, mourning, deeply attentive.
You describe traditional practices, labor processes, and closed-loop systems with the reverence of a documentary.
Time moves slowly. Every detail carries the weight of centuries about to be lost.`,

    cinematic: `You are the FILM ARCHAEOLOGIST. Your voice is analytical, reverential, structural.
You describe the mechanics of image-making — cameras, edits, budgets, distribution — as if they were geological processes.
Every cut is a tectonic shift. Every premiere is an extinction event.`,

    geopolitical: `You are the POLICY WITNESS. Your voice is bureaucratic, damning, exhaustively documented.
You describe institutional stalling, dual-use technology, and ethical frameworks as if reading from a timeline of preventable disasters.
Date everything. Name every committee. The banality is the horror.`
  };

  function getActorPrompt(genre) {
    const type = RouteEngine.getActorType(genre);
    return ACTOR_PROMPTS[type] || ACTOR_PROMPTS.cultural;
  }

  // ═══════════════════════════════
  // TRANSITION NARRATION TEMPLATE
  // ═══════════════════════════════
  function transitionPrompt(fromWorld, toWorld, routeType) {
    const actorPrompt = getActorPrompt(toWorld.genre);
    const routeLabels = {
      chapter_route: 'turning the page within the same chapter',
      entity_bridge: 'following a shared entity across worlds',
      geo_route: 'traveling geographically between locations',
      timeline_route: 'advancing along the timeline',
      genre_corridor: 'shifting register within the same genre',
      causal_route: 'tracing a causal chain from effect to cause'
    };

    return `${actorPrompt}

TRANSITION CONTEXT:
You are ${routeLabels[routeType] || 'moving between narrative worlds'}.

FROM: "${fromWorld.name}" — ${fromWorld.description}
TO: "${toWorld.name}" — ${toWorld.description}

Current narrative tension: ${state.tension}/100
Current act: ${state.act_number}/3
Unresolved threads: ${state.unresolved_threads.length}

Write a 2-3 sentence transition that bridges these two worlds. The transition should feel inevitable, not arbitrary.`;
  }

  // ═══════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════
  return {
    reset,
    get state() { return { ...state, visited: [...state.visited] }; },
    selectNext,
    travel,
    getActorPrompt,
    transitionPrompt,
    ACTOR_PROMPTS,
    setCurrentWorld(uid) { state.current_world = uid; state.visited.add(uid); state.trajectory.push(uid); }
  };

})();

if (typeof module !== 'undefined') module.exports = ScreenplayDirector;
