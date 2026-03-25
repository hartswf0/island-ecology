// ══════════════════════════════════════════════════════════════
// SIM ENGINE v2 — Longitudinal Biographic Simulation
// Memory-Reflection-Planning Architecture (Stanford Generative Agents)
// Language as Control Surface
// ══════════════════════════════════════════════════════════════

let worlds = [], routes = [], worldByUid = {};
let canvas, ctx, VW, VH;
let hexCells = [];

// ──────────────────────────────
// BEE STATE — the persistent identity
// ──────────────────────────────
const bee = {
    cellIdx: 0,
    pollen: [],        // [{name, source, type}]
    pollenMax: 6,
    honey: [],         // [{text, ingredients, step, cell}]
    energy: 100,
    steps: 0,
    visited: new Set(),
    // Identity seed — the bee's core persona
    persona: {
        name: 'Worker Bee #7',
        trait: 'curious forager with a penchant for the catastrophic',
        goal: 'to discover the latent film hidden in the hive',
        bias: 'drawn to alive cells with high causal depth',
    }
};

// ──────────────────────────────
// MEMORY STREAM — chronologically ordered subjective experiences
// ──────────────────────────────
let memoryStream = [];
let memoryIdCounter = 0;

function createMemory(text, type = 'observation', importance = 5) {
    const mem = {
        id: memoryIdCounter++,
        text,
        type,               // 'observation' | 'action' | 'reflection' | 'plan' | 'honey'
        importance,          // 1-10 poignancy score
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        step: bee.steps,
        cell: hexCells[bee.cellIdx] ? hexCells[bee.cellIdx].world.name.replace(/([A-Z])/g,' $1').trim() : '—',
    };
    memoryStream.push(mem);
    checkReflectionTrigger();
    renderMemoryPanel();
    return mem;
}

// ──────────────────────────────
// RETRIEVAL CALCULUS — Recency × Importance × Relevance
// ──────────────────────────────
const RECENCY_DECAY = 0.995;       // λ₁ — creation decay per step
const ACCESS_DECAY = 0.99;         // λ₂ — access decay per step
const W_RECENCY = 1.0;
const W_IMPORTANCE = 1.0;
const W_RELEVANCE = 1.0;

function recencyScore(mem) {
    const stepsElapsed = bee.steps - mem.step;
    const accessElapsed = bee.steps - (mem.lastAccessStep || mem.step);
    const creationDecay = Math.pow(RECENCY_DECAY, stepsElapsed);
    const accessDecay = Math.pow(ACCESS_DECAY, accessElapsed);
    return 0.6 * creationDecay + 0.4 * accessDecay;
}

function importanceScore(mem) {
    return mem.importance / 10; // normalize to 0-1
}

// Lightweight semantic relevance — keyword overlap (no embeddings needed)
function relevanceScore(query, mem) {
    const qWords = new Set(query.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const mWords = new Set(mem.text.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    let overlap = 0;
    qWords.forEach(w => { if(mWords.has(w)) overlap++; });
    return qWords.size > 0 ? overlap / qWords.size : 0;
}

function retrieveMemories(query, k = 6) {
    if(!memoryStream.length) return [];
    const scored = memoryStream.map(mem => ({
        mem,
        score: W_RECENCY * recencyScore(mem) +
               W_IMPORTANCE * importanceScore(mem) +
               W_RELEVANCE * relevanceScore(query, mem)
    }));
    scored.sort((a, b) => b.score - a.score);
    const retrieved = scored.slice(0, k);
    // Mark as accessed
    retrieved.forEach(r => { r.mem.lastAccessed = Date.now(); r.mem.lastAccessStep = bee.steps; });
    return retrieved.map(r => r.mem);
}

// ──────────────────────────────
// REFLECTION MODULE — periodic identity synthesis
// ──────────────────────────────
let unreflectedImportance = 0;
const REFLECTION_THRESHOLD = 30;  // trigger reflection when sum > 30

function checkReflectionTrigger() {
    const lastMem = memoryStream[memoryStream.length - 1];
    if(lastMem && lastMem.type !== 'reflection') {
        unreflectedImportance += lastMem.importance;
    }
    if(unreflectedImportance >= REFLECTION_THRESHOLD) {
        triggerReflection();
        unreflectedImportance = 0;
    }
}

function triggerReflection() {
    // Gather recent non-reflection memories
    const recent = memoryStream.filter(m => m.type !== 'reflection').slice(-12);
    if(recent.length < 3) return;

    // Local reflection: synthesize patterns without LLM
    const cells = [...new Set(recent.map(m => m.cell))];
    const actions = recent.filter(m => m.type === 'action');
    const observations = recent.filter(m => m.type === 'observation');

    let reflectionText = '';

    // What cells has the bee been drawn to?
    if(cells.length > 1) {
        reflectionText += `I have been traveling through ${cells.join(', ')}. `;
    }

    // What patterns in foraging?
    const pollenMemories = recent.filter(m => m.text.includes('forage') || m.text.includes('pollen'));
    if(pollenMemories.length > 1) {
        reflectionText += 'I am becoming a regular forager — the rhythm of collect-and-synthesize is becoming second nature. ';
    }

    // Any high-importance events?
    const highImportance = recent.filter(m => m.importance >= 7);
    if(highImportance.length) {
        reflectionText += `Something significant happened: ${highImportance[0].text.slice(0, 80)}. This changes my understanding of the hive. `;
    }

    // Identity drift detection
    const aliveVisits = recent.filter(m => m.text.includes('alive') || m.text.includes('ALIVE'));
    const abioticVisits = recent.filter(m => m.text.includes('abiotic') || m.text.includes('Abiotic'));
    if(aliveVisits.length > abioticVisits.length * 2) {
        reflectionText += 'I am consistently drawn to alive cells — my bias toward causal depth is confirmed. ';
    } else if(abioticVisits.length > aliveVisits.length) {
        reflectionText += 'I have been wandering through abiotic territory. I should recalibrate toward alive cells. ';
    }

    // Honey synthesis patterns
    const honeyMems = recent.filter(m => m.text.includes('synthesize') || m.text.includes('honey'));
    if(honeyMems.length > 0) {
        reflectionText += `I have synthesized ${bee.honey.length} honeys so far. Each batch teaches me something about the hive's structure. `;
    }

    if(!reflectionText) reflectionText = 'I am still learning the topology of this hive. Every cell reveals something new.';

    // Create reflection as high-importance memory
    createMemory(`[REFLECTION] ${reflectionText.trim()}`, 'reflection', 8);
    addMsg('reflection', `🪞 ${reflectionText.trim()}`);

    // Try LLM reflection if available
    llmReflect(recent);
}

async function llmReflect(recentMemories) {
    const key = document.getElementById('opKey').value.trim();
    if(!key) return;
    const base = document.getElementById('opBase').value.trim();
    const model = document.getElementById('opModel').value.trim();

    const memTexts = recentMemories.map((m,i) => `[${m.step}] ${m.text}`).join('\n');
    const reflections = memoryStream.filter(m => m.type === 'reflection').slice(-3);
    const priorReflections = reflections.length ? '\n\nPRIOR REFLECTIONS:\n' + reflections.map(r => r.text).join('\n') : '';

    const prompt = `You are the inner voice of ${bee.persona.name}, a ${bee.persona.trait}. Your goal: ${bee.persona.goal}.

RECENT MEMORIES:
${memTexts}
${priorReflections}

BEE STATE: energy ${bee.energy}/100, pollen ${bee.pollen.length}/${bee.pollenMax}, honey ${bee.honey.length}, cells visited ${bee.visited.size}/${worlds.length}

Based on these memories, generate ONE deep reflection about who you are becoming. What patterns do you see? What is the hive teaching you? What should you do next? Respond in first person, 2-3 sentences. Be introspective and poetic.`;

    try {
        const resp = await fetch(`${base}/chat/completions`, {
            method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
            body:JSON.stringify({model,messages:[{role:'user',content:prompt}],max_tokens:150,temperature:0.85})
        });
        const data = await resp.json();
        if(data.choices && data.choices[0]) {
            const text = data.choices[0].message.content;
            createMemory(`[DEEP REFLECTION] ${text}`, 'reflection', 9);
            addMsg('reflection', `🧠 ${text}`);
        }
    } catch(err) { /* local reflection already stored */ }
}

// ──────────────────────────────
// RECURSIVE PLANNING — macro → meso → micro
// ──────────────────────────────
let currentPlan = null;

function generatePlan() {
    // Macro plan: what is the bee trying to do today?
    const aliveCells = hexCells.filter(c => c.ai > ASSEMBLY_THRESHOLD && !bee.visited.has(c.idx));
    const nearestAlive = aliveCells.sort((a,b) => Math.abs(a.idx - bee.cellIdx) - Math.abs(b.idx - bee.cellIdx)).slice(0, 3);

    // Retrieve identity-relevant memories to inform planning
    const relevantMems = retrieveMemories('plan forage synthesize honey goal', 4);

    currentPlan = {
        macro: `Forage from ${Math.min(3, nearestAlive.length)} alive cells, synthesize honey, explore the hive`,
        meso: nearestAlive.map(c => ({
            cell: c.idx,
            name: c.world.name.replace(/([A-Z])/g,' $1').trim(),
            ai: c.ai,
            actions: ['fly', 'look', 'forage']
        })),
        micro: null, // generated on arrival
        step: 0,
        complete: false,
        informed_by: relevantMems.map(m => m.text.slice(0, 50))
    };

    createMemory(`[PLAN] Macro: ${currentPlan.macro}. Targeting: ${currentPlan.meso.map(m=>m.name).join(', ')}`, 'plan', 6);
    addMsg('system', `📋 Plan generated: ${currentPlan.macro}`);
    currentPlan.meso.forEach((m, i) => {
        addMsg('system', `  ${i+1}. Fly to ${m.name} (AI:${m.ai}) → look → forage`);
    });
    return currentPlan;
}

function advancePlan() {
    if(!currentPlan || currentPlan.complete) return null;
    if(currentPlan.step >= currentPlan.meso.length) {
        currentPlan.complete = true;
        createMemory('[PLAN COMPLETE] Foraging circuit finished. Assess honey quality and plan next circuit.', 'plan', 5);
        addMsg('system', '📋 Plan complete. Type "plan" for a new circuit.');
        return null;
    }
    const next = currentPlan.meso[currentPlan.step];
    return next;
}

// ──────────────────────────────
// PRODUCT OF EXPERTS — causal rules
// ──────────────────────────────
const ASSEMBLY_THRESHOLD = 15;
const HEX_R = 36, HEX_H = HEX_R * Math.sqrt(3);
const ACTOR_COLORS = {catastrophe:{h:0,s:65,l:50},espionage:{h:45,s:70,l:55},thriller:{h:280,s:55,l:55},cinematic:{h:210,s:60,l:55},cultural:{h:140,s:50,l:48},geopolitical:{h:180,s:55,l:48}};
function actorHSL(a,o=1){const c=ACTOR_COLORS[a]||{h:0,s:0,l:50};return `hsla(${c.h},${c.s}%,${c.l}%,${o})`}
function assemblyIndex(w){return(w.entities.length*2)+(w.relations.length*3)+(w.events.length*4)+w.states.length}

const EXPERTS = [
    { name: 'Energy Gate', test: (action, state) => state.energy > 0, veto: 'You have no energy left. Rest or synthesize honey to recover.' },
    { name: 'Pollen Capacity', test: (action, state) => !(action==='forage' && state.pollen.length >= state.pollenMax), veto: 'Pollen sacs are full. Synthesize honey first.' },
    { name: 'Alive Cell', test: (action, state) => !(action==='forage' && state.currentAI <= ASSEMBLY_THRESHOLD), veto: 'This cell is abiotic — no viable pollen. Fly to an alive cell (AI > 15).' },
    { name: 'Has Pollen', test: (action, state) => !(action==='synthesize' && state.pollen.length === 0), veto: 'No pollen to synthesize. Forage first.' },
    { name: 'Flight Range', test: (action, state) => !(action==='fly' && state.energy < 5), veto: 'Not enough energy to fly. Rest first.' },
];

function evaluateExperts(action, state) {
    const vetoes = [];
    EXPERTS.forEach(expert => { if(!expert.test(action, state)) vetoes.push({ expert: expert.name, reason: expert.veto }); });
    return vetoes;
}

// ──────────────────────────────
// GLASS MAP — forensic decision trace
// ──────────────────────────────
let glassLog = [];

function logGlass(command, action, outcome, vetoedBy) {
    const cell = hexCells[bee.cellIdx];
    glassLog.push({
        time: new Date().toLocaleTimeString(), step: bee.steps,
        cell: cell.world.name.replace(/([A-Z])/g,' $1').trim(), ai: cell.ai,
        command, action, outcome, vetoedBy,
        energy: bee.energy, pollenCount: bee.pollen.length, honeyCount: bee.honey.length,
        memoryCount: memoryStream.length,
        reflectionCount: memoryStream.filter(m=>m.type==='reflection').length
    });
    renderGlass();
}

function renderGlass() {
    const el = document.getElementById('glassEntries');
    if(!el) return;
    el.innerHTML = glassLog.slice(-30).reverse().map(g =>
        `<div class="glass-entry"><span class="ge-time">${g.time} [#${g.step}]</span><br><span class="ge-action">${g.command}</span> → <span class="ge-result">${g.outcome}</span>${g.vetoedBy?` <span style="color:var(--actor)">(vetoed: ${g.vetoedBy})</span>`:''}<br><span class="ge-time">cell: ${g.cell} (AI:${g.ai}) | E:${g.energy} P:${g.pollenCount} H:${g.honeyCount} | mem:${g.memoryCount} refl:${g.reflectionCount}</span></div>`
    ).join('');
}

// ──────────────────────────────
// INIT
// ──────────────────────────────
function init() {
    canvas = document.getElementById('terrain');
    ctx = canvas.getContext('2d');
    worlds = RouteEngine.parseAll(WORLDS_DATA);
    routes = RouteEngine.computeRoutes(worlds);
    worlds.forEach(w => { worldByUid[w.uid]=w; w.ai=assemblyIndex(w); w.actor_type=RouteEngine.getActorType(w.genre); });
    layoutHex();
    loadCfg();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', onCanvasClick);
    resize();
    setupDivider();

    // Seed identity memories
    createMemory(`I am ${bee.persona.name}, a ${bee.persona.trait}. My goal: ${bee.persona.goal}.`, 'reflection', 10);
    createMemory(`I begin at the center of the hive. 228 cells surround me. Some glow gold (AI > 15) — alive with pollen. The grey cells are abiotic.`, 'observation', 6);

    addMsg('system', 'HIVE SIM v2 — Longitudinal Biographic Simulation');
    addMsg('narrator', `You are ${bee.persona.name}. You begin at the center of the hive, surrounded by 228 cells — each a world of pollen. You are ${bee.persona.trait}.\n\nYour goal: ${bee.persona.goal}.\n\nCommands: fly, forage, look, smell, synthesize, rest, dance, plan, remember, reflect.\n\nThe Memory Stream records everything. The Reflection module synthesizes your identity. The Plan module organizes foraging circuits. The Glass Map traces every decision.\n\nType "plan" to generate your first foraging circuit.`);
    addMsg('system', `Cell 1/${worlds.length}: ${worlds[0].name.replace(/([A-Z])/g,' $1').trim()} (AI: ${worlds[0].ai})`);
    updateUI();
    requestAnimationFrame(drawLoop);
}

function loadCfg(){const k=localStorage.getItem('hive_api_key');if(k)document.getElementById('opKey').value=k;const m=localStorage.getItem('hive_model');if(m)document.getElementById('opModel').value=m;const b=localStorage.getItem('hive_base');if(b)document.getElementById('opBase').value=b;}
function saveCfg(){localStorage.setItem('hive_api_key',document.getElementById('opKey').value);localStorage.setItem('hive_model',document.getElementById('opModel').value);localStorage.setItem('hive_base',document.getElementById('opBase').value);}

// ──────────────────────────────
// HEX LAYOUT
// ──────────────────────────────
function layoutHex() {
    hexCells = [];
    const cols = Math.ceil(Math.sqrt(worlds.length * 1.5));
    worlds.forEach((w, i) => {
        const row = Math.floor(i / cols), col = i % cols;
        const offset = (row % 2) ? HEX_R * 0.87 : 0;
        hexCells.push({ x: col*HEX_R*1.74+offset+HEX_R*2, y: row*HEX_H*0.87+HEX_R*2, world: w, idx: i, ai: w.ai });
    });
}

// ──────────────────────────────
// ATC TERRAIN DRAWING
// ──────────────────────────────
let drawTime = 0;
function drawLoop() { drawTime++; drawTerrain(); requestAnimationFrame(drawLoop); }

function drawTerrain() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(7,9,15,0.15)';
    ctx.fillRect(0, 0, w, h);
    const totalW = hexCells.length ? Math.max(...hexCells.map(c=>c.x))+HEX_R*2 : w;
    const totalH = hexCells.length ? Math.max(...hexCells.map(c=>c.y))+HEX_R*2 : h;
    const scale = Math.min(w/totalW, h/totalH) * 0.88;
    const offX = (w-totalW*scale)/2, offY = (h-totalH*scale)/2;
    ctx.save(); ctx.translate(offX, offY); ctx.scale(scale, scale);

    // Flight path
    if(bee.visited.size > 1) {
        const visitedArr = [...bee.visited];
        ctx.beginPath(); ctx.strokeStyle = 'rgba(232,200,50,0.06)'; ctx.lineWidth = 1;
        visitedArr.forEach((idx,i) => { const c = hexCells[idx]; if(i===0) ctx.moveTo(c.x,c.y); else ctx.lineTo(c.x,c.y); });
        ctx.stroke();
    }

    // Plan path overlay
    if(currentPlan && !currentPlan.complete) {
        ctx.beginPath(); ctx.strokeStyle = 'rgba(100,200,255,0.08)'; ctx.lineWidth = 2;
        ctx.setLineDash([6,4]);
        const start = hexCells[bee.cellIdx];
        ctx.moveTo(start.x, start.y);
        currentPlan.meso.forEach(m => { const c = hexCells[m.cell]; ctx.lineTo(c.x, c.y); });
        ctx.stroke(); ctx.setLineDash([]);
    }

    hexCells.forEach((cell, i) => {
        const isBee = i === bee.cellIdx;
        const visited = bee.visited.has(i);
        const alive = cell.ai > ASSEMBLY_THRESHOLD;
        const isPlanTarget = currentPlan && !currentPlan.complete && currentPlan.meso.some(m => m.cell === i);
        const r = HEX_R * (isBee ? 1.15 : 1);

        ctx.beginPath();
        for(let k=0;k<6;k++){const a=Math.PI/3*k-Math.PI/6;ctx.lineTo(cell.x+r*Math.cos(a),cell.y+r*Math.sin(a));}
        ctx.closePath();

        const density = Math.min(1, cell.ai / 40);
        if(isBee) ctx.fillStyle = 'rgba(232,200,50,0.15)';
        else if(isPlanTarget) ctx.fillStyle = 'rgba(100,200,255,0.08)';
        else if(visited) ctx.fillStyle = actorHSL(cell.world.actor_type, 0.08 + density * 0.12);
        else ctx.fillStyle = alive ? actorHSL(cell.world.actor_type, 0.03 + density * 0.06) : 'rgba(68,74,84,0.03)';
        ctx.fill();

        ctx.strokeStyle = isBee ? 'rgba(232,200,50,0.5)' : (isPlanTarget ? 'rgba(100,200,255,0.2)' : (visited ? 'rgba(212,168,75,0.12)' : `rgba(160,196,216,${alive?.05:.02})`));
        ctx.lineWidth = isBee ? 2 : (isPlanTarget ? 1.5 : 0.5);
        ctx.stroke();

        if(isBee) {
            ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🐝', cell.x, cell.y - 2);
            ctx.beginPath(); ctx.arc(cell.x, cell.y, r+12, 0, Math.PI*2);
            const g = ctx.createRadialGradient(cell.x,cell.y,r*0.3,cell.x,cell.y,r+12);
            g.addColorStop(0,'rgba(232,200,50,0.12)');g.addColorStop(1,'transparent');
            ctx.fillStyle = g; ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(cell.x, cell.y-1, 2.5, 0, Math.PI*2);
            ctx.fillStyle = alive ? actorHSL(cell.world.actor_type, visited?.4:.15) : 'rgba(68,74,84,0.15)';
            ctx.fill();
        }

        if(isBee || (scale > 0.3 && alive)) {
            const name = cell.world.name.replace(/([A-Z])/g,' $1').trim();
            const short = name.length>13?name.slice(0,11)+'…':name;
            ctx.font = isBee ? "600 11px 'IBM Plex Mono'" : "500 7px 'IBM Plex Mono'";
            ctx.textAlign='center';ctx.textBaseline='top';
            ctx.fillStyle = isBee ? 'rgba(232,200,50,.8)' : 'rgba(160,196,216,.2)';
            ctx.fillText(short, cell.x, cell.y + (isBee ? 12 : 6));
        }
        cell._sx = cell.x*scale+offX; cell._sy = cell.y*scale+offY;
    });
    ctx.restore();
}

function resize(){const vp=document.getElementById('terrainWrap');VW=vp.clientWidth;VH=vp.clientHeight;canvas.width=VW*devicePixelRatio;canvas.height=VH*devicePixelRatio;canvas.style.width=VW+'px';canvas.style.height=VH+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);}

function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*devicePixelRatio, my=(e.clientY-rect.top)*devicePixelRatio;
    let closest=-1, closestD=Infinity;
    hexCells.forEach((c,i)=>{const d=Math.hypot(c._sx*devicePixelRatio-mx,c._sy*devicePixelRatio-my);if(d<HEX_R*2&&d<closestD){closest=i;closestD=d;}});
    if(closest>=0 && closest!==bee.cellIdx) {
        processCommand(`fly to ${hexCells[closest].world.name.replace(/([A-Z])/g,' $1').trim()}`);
    }
}

// ──────────────────────────────
// COMMAND PROCESSOR — memory-augmented
// ──────────────────────────────
function sendCommand() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text) return;
    input.value = '';
    processCommand(text);
}

async function processCommand(text) {
    addMsg('user-msg', `> ${text}`);
    bee.steps++;
    const action = parseAction(text);
    const cell = hexCells[bee.cellIdx];
    const state = { energy:bee.energy, pollen:bee.pollen, pollenMax:bee.pollenMax, currentAI:cell.ai };

    // Special commands
    if(action === 'plan') { generatePlan(); updateUI(); return; }
    if(action === 'remember') { showMemories(text); updateUI(); return; }
    if(action === 'reflect') { triggerReflection(); updateUI(); return; }
    if(action === 'next') { executeNextPlanStep(); updateUI(); return; }

    // Product of Experts validation
    const vetoes = evaluateExperts(action, state);
    if(vetoes.length > 0) {
        vetoes.forEach(v => addMsg('expert-vote', `✗ ${v.expert}: ${v.reason}`));
        createMemory(`Expert vetoed my attempt to ${action}: ${vetoes[0].reason}`, 'observation', 4);
        logGlass(text, action, 'VETOED', vetoes.map(v=>v.expert).join(', '));
        updateUI();
        return;
    }

    // Execute action
    const result = executeLocal(action, text, cell);
    if(result.narration) addMsg('narrator', result.narration);
    if(result.system) addMsg('system', result.system);

    // Record to memory stream
    const importance = estimateImportance(action, result);
    createMemory(`${action.toUpperCase()}: ${result.narration || text}`.slice(0, 200), 'action', importance);

    // Advance plan if active
    if(currentPlan && !currentPlan.complete && (action === 'fly' || action === 'forage')) {
        const planTarget = currentPlan.meso[currentPlan.step];
        if(planTarget && bee.cellIdx === planTarget.cell) {
            currentPlan.step++;
            addMsg('system', `📋 Plan step ${currentPlan.step}/${currentPlan.meso.length} complete`);
            advancePlan();
        }
    }

    // LLM narration with memory context
    const key = document.getElementById('opKey').value.trim();
    if(key && ['look','smell','forage','synthesize','unknown'].includes(action)) {
        await llmNarrate(text, action, cell);
    }

    logGlass(text, action, result.outcome||'OK', '');
    updateUI();
}

function parseAction(text) {
    const t = text.toLowerCase();
    if(t === 'plan' || t === 'make a plan' || t.startsWith('plan')) return 'plan';
    if(t === 'remember' || t.startsWith('remember') || t.includes('what do i know')) return 'remember';
    if(t === 'reflect' || t.startsWith('reflect') || t.includes('who am i')) return 'reflect';
    if(t === 'next' || t === 'continue' || t === 'follow plan') return 'next';
    if(t.includes('fly')||t.includes('go')||t.includes('move')||t.includes('travel')) return 'fly';
    if(t.includes('forage')||t.includes('collect')||t.includes('gather')||t.includes('harvest')) return 'forage';
    if(t.includes('synthesize')||t.includes('honey')||t.includes('make')||t.includes('brew')) return 'synthesize';
    if(t.includes('look')||t.includes('see')||t.includes('observe')||t.includes('examine')||t.includes('inspect')) return 'look';
    if(t.includes('smell')||t.includes('sense')||t.includes('feel')||t.includes('taste')) return 'smell';
    if(t.includes('rest')||t.includes('sleep')||t.includes('wait')) return 'rest';
    if(t.includes('dance')||t.includes('waggle')) return 'dance';
    return 'unknown';
}

function estimateImportance(action, result) {
    if(result.outcome === 'SYNTHESIZED') return 8;
    if(result.outcome === 'FORAGED') return 6;
    if(result.outcome === 'FLEW' && result.narration.includes('alive')) return 5;
    if(result.outcome === 'FLEW') return 3;
    if(result.outcome === 'LOOKED') return 4;
    if(result.outcome === 'DANCED') return 5;
    if(result.outcome === 'RESTED') return 2;
    return 3;
}

function executeNextPlanStep() {
    if(!currentPlan || currentPlan.complete) {
        addMsg('system', '📋 No active plan. Type "plan" to generate one.');
        return;
    }
    const next = advancePlan();
    if(next) {
        processCommand(`fly to ${next.name}`);
    }
}

function showMemories(query) {
    const q = query.replace(/remember|what do i know about/gi, '').trim() || 'forage synthesize fly';
    const mems = retrieveMemories(q, 8);
    addMsg('system', `🧠 Memory retrieval (query: "${q.slice(0,30)}"):`);
    mems.forEach(m => {
        const age = bee.steps - m.step;
        const typeIcon = {observation:'👁',action:'⚡',reflection:'🪞',plan:'📋',honey:'🍯'}[m.type] || '·';
        addMsg('log', `${typeIcon} [step ${m.step}, -${age} ago, imp:${m.importance}] ${m.text.slice(0,120)}`);
    });
}

function executeLocal(action, text, cell) {
    const w = cell.world, dn = w.name.replace(/([A-Z])/g,' $1').trim();
    switch(action) {
        case 'fly': {
            const t = text.toLowerCase();
            let target = null;
            hexCells.forEach((c,i)=>{ if(i!==bee.cellIdx && c.world.name.replace(/([A-Z])/g,' $1').trim().toLowerCase().includes(t.replace(/fly|go|move|travel|to|the/gi,'').trim())) target=i; });
            if(!target && target !== 0) {
                let best=-1,bd=Infinity;
                hexCells.forEach((c,i)=>{if(i!==bee.cellIdx&&c.ai>ASSEMBLY_THRESHOLD&&!bee.visited.has(i)){const d=Math.abs(i-bee.cellIdx);if(d<bd){bd=d;best=i;}}});
                target = best>=0 ? best : (bee.cellIdx+1)%hexCells.length;
            }
            const dist = Math.abs(target - bee.cellIdx);
            const cost = Math.min(15, Math.max(3, dist));
            bee.energy = Math.max(0, bee.energy - cost);
            bee.cellIdx = target;
            bee.visited.add(target);
            const tc = hexCells[target], tw = tc.world, tdn = tw.name.replace(/([A-Z])/g,' $1').trim();
            createMemory(`Arrived at ${tdn}. AI: ${tw.ai}. ${tw.ai>ASSEMBLY_THRESHOLD?'Cell is ALIVE — glowing with pollen.':'Cell is abiotic — grey wax.'}`, 'observation', tw.ai > ASSEMBLY_THRESHOLD ? 6 : 3);
            return { narration: `You fly ${cost} energy. You arrive at ${tdn}. ${tw.ai>ASSEMBLY_THRESHOLD ? 'The cell glows gold — alive with pollen.' : 'Grey wax. Abiotic. Nothing to forage here.'}`, system: `Cell ${target+1}/${worlds.length}: ${tdn} (AI:${tw.ai})`, outcome:'FLEW' };
        }
        case 'forage': {
            const available = w.entities.filter(e => !bee.pollen.some(p=>p.name===e.name));
            if(!available.length) return { narration:'You search the cell but find no new pollen — you have already collected everything here.', outcome:'EMPTY' };
            const take = available.slice(0, 2);
            take.forEach(e => bee.pollen.push({ name:e.name, type:e.type, source:dn }));
            bee.energy = Math.max(0, bee.energy - 3);
            return { narration:`You forage carefully. Collected: ${take.map(e=>`${e.name} (${e.type})`).join(', ')}. Pollen sacs: ${bee.pollen.length}/${bee.pollenMax}.`, outcome:'FORAGED' };
        }
        case 'synthesize': {
            const pollenNames = bee.pollen.map(p=>p.name).join(' + ');
            const honeyObj = { text:`Honey from ${pollenNames}`, ingredients:bee.pollen.slice(), step:bee.steps, cell:dn };
            bee.honey.push(honeyObj);
            bee.energy = Math.min(100, bee.energy + 15);
            const cleared = bee.pollen.length;
            bee.pollen = [];
            createMemory(`Synthesized honey from ${cleared} pollen grains: ${pollenNames}. This is honey #${bee.honey.length}.`, 'honey', 8);
            return { narration:`You synthesize ${cleared} pollen grains into honey. Energy +15. Honey #${bee.honey.length}.\n\nIngredients: ${pollenNames}`, outcome:'SYNTHESIZED' };
        }
        case 'look': {
            const alive = w.ai > ASSEMBLY_THRESHOLD;
            return { narration:`${dn} (AI: ${w.ai}${alive?' — ALIVE':''})\n${w.genre}\n\n${w.description}\n\nEntities: ${w.entities.map(e=>e.name).join(', ')||'none'}\nEvents: ${w.events.map(e=>'⚡'+e.name).join(', ')||'none'}`, outcome:'LOOKED' };
        }
        case 'smell': {
            const nearby = routes.filter(r=>r.from===w.uid||r.to===w.uid).slice(0,3);
            const scents = nearby.map(r=>{const tid=r.from===w.uid?r.to:r.from;const tw=worldByUid[tid];return tw?tw.name.replace(/([A-Z])/g,' $1').trim():null;}).filter(Boolean);
            return { narration:`You extend your antennae. Pheromone traces lead to: ${scents.join(', ')||'nothing nearby'}. The dominant scent is ${w.genre}.`, outcome:'SMELLED' };
        }
        case 'rest': {
            bee.energy = Math.min(100, bee.energy + 20);
            return { narration:'You rest in the cell. Energy +20.', outcome:'RESTED' };
        }
        case 'dance': {
            const dances = routes.filter(r=>r.from===w.uid||r.to===w.uid).sort((a,b)=>b.weight-a.weight).slice(0,3);
            const recs = dances.map(r=>{const tid=r.from===w.uid?r.to:r.from;const tw=worldByUid[tid];return tw?`→ ${tw.name.replace(/([A-Z])/g,' $1').trim()} (${r.type.replace(/_/g,' ')})`:null;}).filter(Boolean);
            return { narration:`You perform the waggle dance. The swarm responds:\n${recs.join('\n')||'No strong connections from this cell.'}`, outcome:'DANCED' };
        }
        default:
            return { narration:`You try to "${text}" but aren't sure how. Try: fly, forage, look, smell, synthesize, rest, dance, plan, remember, reflect, next.`, outcome:'UNKNOWN' };
    }
}

// ──────────────────────────────
// LLM NARRATION — memory-augmented
// ──────────────────────────────
async function llmNarrate(command, action, cell) {
    const key = document.getElementById('opKey').value.trim();
    const base = document.getElementById('opBase').value.trim();
    const model = document.getElementById('opModel').value.trim();
    if(!key) return;
    const w = cell.world;

    // Retrieve relevant memories for this context
    const query = `${action} ${w.name} ${w.genre} ${w.description.slice(0, 50)}`;
    const relevantMems = retrieveMemories(query, 4);
    const reflections = memoryStream.filter(m => m.type === 'reflection').slice(-2);

    const memoryContext = relevantMems.length ?
        '\n\nRELEVANT MEMORIES:\n' + relevantMems.map(m => `[${m.type}] ${m.text.slice(0,100)}`).join('\n') : '';
    const identityContext = reflections.length ?
        '\n\nIDENTITY (recent reflections):\n' + reflections.map(r => r.text.slice(0,120)).join('\n') : '';

    const systemPrompt = `You are the inner narrator of ${bee.persona.name}, a ${bee.persona.trait}. Narrate in first person, 2-3 sentences of rich sensory prose. You remember your past. Reference memories when relevant. Never break character.`;

    const context = `BEE STATE: energy ${bee.energy}/100, pollen ${bee.pollen.length}/${bee.pollenMax} [${bee.pollen.map(p=>p.name).join(', ')}], honey ${bee.honey.length}, cells visited ${bee.visited.size}

CURRENT CELL: ${w.name.replace(/([A-Z])/g,' $1').trim()} (AI: ${w.ai})
Genre: ${w.genre}
Description: ${w.description}
Entities: ${w.entities.map(e=>e.name+' ['+e.type+']').join(', ')}
Events: ${w.events.map(e=>'⚡'+e.name).join(', ')}
${memoryContext}${identityContext}

COMMAND: "${command}" (action: ${action})

Narrate what I experience. Be sensory and specific. Draw on my memories.`;

    try {
        const resp = await fetch(`${base}/chat/completions`, {
            method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
            body:JSON.stringify({model,messages:[{role:'system',content:systemPrompt},{role:'user',content:context}],max_tokens:200,temperature:0.8})
        });
        const data = await resp.json();
        if(data.choices && data.choices[0]) {
            const narration = data.choices[0].message.content;
            addMsg('narrator', narration);
            createMemory(`[LLM NARRATION at ${w.name.replace(/([A-Z])/g,' $1').trim()}] ${narration.slice(0,150)}`, 'observation', 5);
        }
    } catch(err) { /* silent — local narration already shown */ }
}

// ──────────────────────────────
// MEMORY PANEL RENDERER
// ──────────────────────────────
function renderMemoryPanel() {
    const el = document.getElementById('memoryEntries');
    if(!el) return;
    const recent = memoryStream.slice(-15).reverse();
    el.innerHTML = recent.map(m => {
        const typeIcon = {observation:'👁',action:'⚡',reflection:'🪞',plan:'📋',honey:'🍯'}[m.type] || '·';
        const age = bee.steps - m.step;
        const decayOpacity = Math.max(0.3, Math.pow(RECENCY_DECAY, age));
        return `<div class="mem-entry" style="opacity:${decayOpacity.toFixed(2)}"><span class="mem-icon">${typeIcon}</span><span class="mem-imp">${m.importance}</span><span class="mem-text">${esc(m.text.slice(0,100))}</span><span class="mem-age">-${age}</span></div>`;
    }).join('');
    document.getElementById('sMemory').textContent = memoryStream.length;
    document.getElementById('sReflect').textContent = memoryStream.filter(m=>m.type==='reflection').length;
}

// ──────────────────────────────
// UI HELPERS
// ──────────────────────────────
function addMsg(type, text) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = esc(text).replace(/\n/g, '<br>');
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';}

function updateUI() {
    document.getElementById('sCell').textContent = `${bee.cellIdx+1}/${worlds.length}`;
    document.getElementById('sPollen').textContent = `${bee.pollen.length}/${bee.pollenMax}`;
    document.getElementById('sHoney').textContent = bee.honey.length;
    document.getElementById('sEnergy').textContent = bee.energy;
    document.getElementById('sSteps').textContent = bee.steps;
    document.getElementById('energyFill').style.width = bee.energy+'%';
    document.getElementById('pollenFill').style.width = (bee.pollen.length/bee.pollenMax*100)+'%';
    document.getElementById('honeyFill').style.width = Math.min(100, bee.honey.length*10)+'%';
}

function toggleGlass(){document.getElementById('glassPanel').classList.toggle('show');}
function toggleMemory(){document.getElementById('memoryPanel').classList.toggle('show');}
function toggleOp(){const c=document.getElementById('opConfig'),a=document.getElementById('opArrow');c.classList.toggle('collapsed');c.classList.toggle('expanded');a.textContent=c.classList.contains('collapsed')?'▸':'▾';}
function setupDivider(){const div=document.getElementById('divider'),p=document.getElementById('panel');div.addEventListener('mousedown',e=>{e.preventDefault();const sx=e.clientX,sw=p.offsetWidth;const mv=ev=>{p.style.width=Math.max(260,Math.min(700,sw-(ev.clientX-sx)))+'px';resize();};const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});}

init();
