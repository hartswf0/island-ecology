/**
 * ROUTE ENGINE — BEES ON A TRAIN
 * Parses all WORLDS_DATA into typed records, computes 6 types of inter-world routes.
 * Consumed by skill-analyzer.html and twine-bridge.html.
 */

const RouteEngine = (() => {

  // ═══════════════════════════════
  // TIMELINE PHASE ORDERING
  // ═══════════════════════════════
  const PHASE_ORDER = [
    'CreationPhase', 'PreProduction', 'PreFreeze',
    'Infiltration', 'StandbyPhase', 'CoverPhase', 'OperationalPhase',
    'InsertionPhase', 'InvestigationPhase', 'OperationalNight',
    'RapidOnset', 'SurveillancePhase', 'ContinuousMonitoring',
    'Escalation', 'AssaultPhase', 'DiplomaticStalemate',
    'Desperation', 'StoragePhase', 'TurningPoint',
    'ExtractionWindow', 'CatalystMoment', 'ClimaxPhase',
    'PostEngagement', 'FinalRevolt', 'PostFreeze',
    'PerpetualJourney', 'EternalJourney', 'AnnualPassage'
  ];

  // ═══════════════════════════════
  // COORDINATE PARSER
  // ═══════════════════════════════
  function parseCoords(str) {
    if (!str) return null;
    // Match patterns like "46.2044° N, 6.1432° E" or "46.2044°N, 6.1432°E"
    const m = str.match(/([\d.]+)°?\s*([NS])\s*[,;]?\s*([\d.]+)°?\s*([EW])/);
    if (!m) return null;
    let lat = parseFloat(m[1]) * (m[2] === 'S' ? -1 : 1);
    let lon = parseFloat(m[3]) * (m[4] === 'W' ? -1 : 1);
    return { lat, lon };
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 +
              Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  // ═══════════════════════════════
  // POML PARSER — Extract typed record from raw POML
  // ═══════════════════════════════
  function parseWorld(w) {
    const raw = w.raw || '';
    const rec = {
      uid: w.uid,
      name: w.name,
      source: w.source,
      genre: w.meta?.genre || 'unknown',
      description: w.meta?.description || '',
      timeline_phase: null,
      coords: null,
      locations: [],
      entities: [],
      relations: [],
      states: [],
      events: [],
      entity_types: new Set(),
      trait_set: new Set()
    };

    // Timeline phase
    const tm = raw.match(/time\s+<([^>]+)>/);
    if (tm) rec.timeline_phase = tm[1];

    // Locations
    const locRe = /location\s+<([^>]+)>\s*\{([^}]*)\}/g;
    let m;
    while ((m = locRe.exec(raw)) !== null) {
      const block = m[2];
      const coordM = block.match(/coordinates:\s*"([^"]+)"/);
      const parentM = block.match(/(?:parent|within):\s*<([^>]+)>/);
      const descM = block.match(/description:\s*"([^"]+)"/);
      const coords = coordM ? parseCoords(coordM[1]) : null;
      if (coords && !rec.coords) rec.coords = coords; // first coord wins for world
      rec.locations.push({
        name: m[1],
        coords,
        parent: parentM ? parentM[1] : null,
        description: descM ? descM[1] : ''
      });
    }

    // Entities
    const entRe = /entity\s+<([^>]+)>\s*:\s*(\w+)\s*\{([^}]*)\}/g;
    while ((m = entRe.exec(raw)) !== null) {
      const block = m[3];
      const locM = block.match(/location:\s*<([^>]+)>/);
      const traitsM = block.match(/traits:\s*\[([^\]]*)\]/);
      const traits = traitsM ? traitsM[1].split(',').map(t => t.trim().replace(/"/g, '')) : [];
      rec.entities.push({
        name: m[1],
        type: m[2],
        location: locM ? locM[1] : null,
        traits
      });
      rec.entity_types.add(m[2]);
      traits.forEach(t => rec.trait_set.add(t));
    }

    // Relations
    const relRe = /rel\s+\[([^\]]+)\]\(([^)]+)\)/g;
    while ((m = relRe.exec(raw)) !== null) {
      const chain = m[2].split(/\s*->\s*/).map(s => s.replace(/[<>]/g, '').trim());
      for (let i = 0; i < chain.length - 1; i++) {
        rec.relations.push({ verb: m[1], from: chain[i], to: chain[i + 1] });
      }
    }

    // States
    const stRe = /state\s+<([^>]+)\.(\w+)>\s*=\s*"?([^"\n]+)"?/g;
    while ((m = stRe.exec(raw)) !== null) {
      rec.states.push({ target: m[1], key: m[2], value: m[3].trim() });
    }

    // Events
    const evRe = /event\s+<([^>]+)>\s*\{([^}]*)\}/g;
    while ((m = evRe.exec(raw)) !== null) {
      const actorsM = m[2].match(/actors:\s*\[([^\]]*)\]/);
      const effectsM = m[2].match(/effects:\s*\[([^\]]*)\]/);
      rec.events.push({
        name: m[1],
        actors: actorsM ? actorsM[1].split(',').map(s => s.replace(/[<>\s]/g, '')) : [],
        effects: effectsM ? effectsM[1].split(',').map(s => s.trim()) : []
      });
    }

    return rec;
  }

  // ═══════════════════════════════
  // ROUTE COMPUTATION
  // ═══════════════════════════════
  function computeRoutes(parsedWorlds) {
    const routes = [];
    const n = parsedWorlds.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = parsedWorlds[i];
        const b = parsedWorlds[j];

        // 1. CHAPTER ROUTE — same source file
        if (a.source === b.source) {
          routes.push({
            from: a.uid, to: b.uid,
            type: 'chapter_route',
            weight: 0.9,
            label: `Ch. ${a.source}`
          });
        }

        // 2. ENTITY BRIDGE — shared entity types
        const sharedTypes = [...a.entity_types].filter(t => b.entity_types.has(t));
        if (sharedTypes.length > 0) {
          routes.push({
            from: a.uid, to: b.uid,
            type: 'entity_bridge',
            weight: Math.min(1, sharedTypes.length * 0.3),
            label: sharedTypes.join(', ')
          });
        }

        // 3. GEO ROUTE — within 500km
        if (a.coords && b.coords) {
          const dist = haversineKm(a.coords, b.coords);
          if (dist < 500) {
            routes.push({
              from: a.uid, to: b.uid,
              type: 'geo_route',
              weight: 1 - (dist / 500),
              label: `${Math.round(dist)}km`
            });
          }
        }

        // 4. TIMELINE ROUTE — adjacent phases
        if (a.timeline_phase && b.timeline_phase) {
          const ai = PHASE_ORDER.indexOf(a.timeline_phase);
          const bi = PHASE_ORDER.indexOf(b.timeline_phase);
          if (ai >= 0 && bi >= 0 && Math.abs(ai - bi) === 1) {
            routes.push({
              from: ai < bi ? a.uid : b.uid,
              to: ai < bi ? b.uid : a.uid,
              type: 'timeline_route',
              weight: 0.7,
              label: `${a.timeline_phase} → ${b.timeline_phase}`
            });
          }
        }

        // 5. GENRE CORRIDOR — same genre
        if (a.genre === b.genre && a.genre !== 'unknown') {
          routes.push({
            from: a.uid, to: b.uid,
            type: 'genre_corridor',
            weight: 0.5,
            label: a.genre
          });
        }

        // 6. CAUSAL ROUTE — event effect in A matches rule condition entity in B
        for (const ev of a.events) {
          for (const eff of ev.effects) {
            // Check if any entity in B appears in this effect
            for (const ent of b.entities) {
              if (eff.includes(ent.name) || eff.includes(ent.type)) {
                routes.push({
                  from: a.uid, to: b.uid,
                  type: 'causal_route',
                  weight: 0.8,
                  label: `${ev.name} → ${ent.name}`
                });
                break;
              }
            }
          }
        }
        // Reverse causal check
        for (const ev of b.events) {
          for (const eff of ev.effects) {
            for (const ent of a.entities) {
              if (eff.includes(ent.name) || eff.includes(ent.type)) {
                routes.push({
                  from: b.uid, to: a.uid,
                  type: 'causal_route',
                  weight: 0.8,
                  label: `${ev.name} → ${ent.name}`
                });
                break;
              }
            }
          }
        }
      }
    }

    // Deduplicate same-type routes between same pair
    const seen = new Set();
    return routes.filter(r => {
      const key = `${r.from}-${r.to}-${r.type}`;
      const rev = `${r.to}-${r.from}-${r.type}`;
      if (seen.has(key) || (r.type !== 'causal_route' && r.type !== 'timeline_route' && seen.has(rev))) return false;
      seen.add(key);
      return true;
    });
  }

  // ═══════════════════════════════
  // ACT CLASSIFICATION
  // ═══════════════════════════════
  const ACT_MAP = {
    // Act I — Setup / Infiltration
    'CreationPhase': 1, 'PreProduction': 1, 'PreFreeze': 1,
    'Infiltration': 1, 'StandbyPhase': 1, 'CoverPhase': 1,
    'OperationalPhase': 1, 'InsertionPhase': 1,
    // Act II — Escalation / Confrontation
    'InvestigationPhase': 2, 'OperationalNight': 2,
    'RapidOnset': 2, 'SurveillancePhase': 2, 'ContinuousMonitoring': 2,
    'Escalation': 2, 'AssaultPhase': 2, 'DiplomaticStalemate': 2,
    'Desperation': 2, 'StoragePhase': 2,
    // Act III — Climax / Resolution
    'TurningPoint': 3, 'ExtractionWindow': 3, 'CatalystMoment': 3,
    'ClimaxPhase': 3, 'PostEngagement': 3, 'FinalRevolt': 3,
    'PostFreeze': 3,
    // Eternal — all acts
    'PerpetualJourney': 0, 'EternalJourney': 0, 'AnnualPassage': 0
  };

  function getAct(phase) {
    return ACT_MAP[phase] || 0;
  }

  // ═══════════════════════════════
  // GENRE CLASSIFICATION FOR ACTORS
  // ═══════════════════════════════
  const GENRE_ACTORS = {
    'catastrophic science fiction': 'catastrophe',
    'cyber-intelligence infrastructure': 'espionage',
    'covert infrastructure': 'espionage',
    'covert military insertion': 'espionage',
    'institutional conflict': 'espionage',
    'systemic corruption': 'espionage',
    'digital intelligence artifact': 'espionage',
    'forensic residue': 'espionage',
    'domestic concealment': 'espionage',
    'extraction threshold': 'espionage',
    'surveillance vantage': 'espionage',
    'physical infrastructure attack': 'espionage',
    'catalyst artifact': 'espionage',
    'vulnerability manifestation': 'espionage',
    'digital asset storage': 'espionage',
    'incriminating evidence': 'espionage',
    'contested threshold': 'espionage',
    'concealed infrastructure': 'espionage',
    'geopolitical': 'geopolitical',
    'supply chain': 'geopolitical',
    'academic research': 'geopolitical',
    'military research': 'geopolitical',
    'military-industrial': 'geopolitical',
    'data infrastructure': 'geopolitical',
    'intelligence infrastructure': 'geopolitical',
    'academic ethics': 'geopolitical',
    'academic advocacy': 'geopolitical',
    'physical security': 'geopolitical',
    'software development': 'geopolitical',
    'technology demonstration': 'geopolitical',
    'environmental constraint': 'cultural',
    'architectural surveillance': 'geopolitical',
    'speculative fiction': 'catastrophe',
    'thriller': 'thriller',
    'crime thriller': 'thriller',
    'action thriller': 'thriller',
    'psychological thriller': 'thriller',
    'historical/creative origin': 'cinematic',
    'cinematic production': 'cinematic',
    'cinematic commerce': 'cinematic',
    'cinematic finance': 'cinematic',
    'cinematic pre-production': 'cinematic',
    'cinematic geography': 'cinematic',
    'cultural reception': 'cinematic',
    'cultural ecology': 'cultural',
    'historical infrastructure': 'cultural',
    'industrial ecology': 'cultural',
    'historical/technological': 'cinematic',
    'technological infrastructure / animation history': 'cinematic',
    'fictional/climate catastrophe': 'catastrophe',
    'industrial/resource extraction': 'cultural',
    'infrastructure/endurance': 'cultural',
    'ecological/closed-loop': 'cultural',
    'biological/punitive': 'cultural',
    'ecological recovery': 'cultural',
    'chemical/hazardous': 'thriller',
    'sociopolitical/containment': 'cultural',
    'educational/ideological': 'cultural',
    'material/status': 'cultural',
    'incendiary/structural': 'thriller',
    'cultural/extractive': 'cultural',
    'resource/scarcity': 'cultural',
    'mechanical/religious': 'cultural',
    'exploitative/mechanical': 'cultural',
    'historical/memorial': 'cultural',
    'agricultural/solar': 'cultural',
    'tactical/technology': 'thriller'
  };

  function getActorType(genre) {
    return GENRE_ACTORS[genre] || 'cultural';
  }

  // ═══════════════════════════════
  // ROUTE STATISTICS
  // ═══════════════════════════════
  function routeStats(routes) {
    const byType = {};
    routes.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });
    return byType;
  }

  // ═══════════════════════════════
  // ROUTE COLORS
  // ═══════════════════════════════
  const ROUTE_COLORS = {
    chapter_route:  { h: 45,  s: 70, l: 55 },   // gold
    entity_bridge:  { h: 280, s: 65, l: 60 },   // purple
    geo_route:      { h: 140, s: 60, l: 50 },   // green
    timeline_route: { h: 200, s: 70, l: 55 },   // blue
    genre_corridor: { h: 30,  s: 70, l: 55 },   // orange
    causal_route:   { h: 0,   s: 70, l: 55 }    // red
  };

  function routeColor(type, alpha = 0.6) {
    const c = ROUTE_COLORS[type] || { h: 0, s: 0, l: 50 };
    return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${alpha})`;
  }

  // ═══════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════
  return {
    parseWorld,
    computeRoutes,
    routeStats,
    routeColor,
    getAct,
    getActorType,
    PHASE_ORDER,
    ACT_MAP,
    ROUTE_COLORS,
    parseAll(worldsData) {
      return worldsData.map(parseWorld);
    }
  };

})();

// Export for Node.js testing
if (typeof module !== 'undefined') module.exports = RouteEngine;
