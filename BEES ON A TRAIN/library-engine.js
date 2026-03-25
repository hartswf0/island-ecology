// ═══════════════════════════════════════════════════════════
// LIBRARY ENGINE — AGENTIC APIARY
//
// THE PARADIGM: You don't read 228 worlds.
//   You keep bees, and the bees make the film.
//
// Each cell = honeycomb context window (POML world)
// Each bee  = LLM operator (Director/Forensic/Beekeeper)
// Pollen    = structured concept vectors (E×2,R×3,Ev×4,S×1)
// Honey     = narrative synthesis grounded in cell data
// Flight Log = auditable provenance trace
// Waggle Dance = causal/sequential/dialectic navigation
// Reading Genome = interpretive bias signature
// ═══════════════════════════════════════════════════════════

let worlds = [], routes = [], worldByUid = {};
let canvas, ctx, dpr;
let hexCells = [];
let currentCell = -1;
const HEX_R = 48;
const ASSEMBLY_THRESHOLD = 15;
const ATC_COOLDOWN = 3000; // ms between API calls
let lastApiCall = 0;
let tokensUsed = 0;
let agenticMode = false;
let agenticTimer = null;

// ── Flight Log ──
let flightLog = [];
let flightSeq = 0;
let pathChoices = { causal:0, sequential:0, dialectic:0 };

// ── Honey Archive ──
let honeyArchive = [];

// ── Memory ──
let memoryStream = [], memId = 0;

// ── Assembly Index ──
function assemblyIndex(w) {
    return (w.entities.length*2)+(w.relations.length*3)+(w.events.length*4)+w.states.length;
}

// ═══════════════════════════
// OPERATOR TEMPLATES — "Smoke"
// ═══════════════════════════
const TEMPLATES = {
    director: `You are a documentary filmmaker analyzing POML world data. For each world, describe the cinematic potential — what would this scene look like on screen? What films does it echo? What is the emotional temperature? Keep responses under 150 words.`,
    forensic: `You are a Forensic Analyst mapping causal chains in POML world data. Identify the assembly pathway: how do entities relate? What temporal anomalies exist? What evidence would a Cold Case investigator find here? Be precise, clinical. Under 150 words.`,
    cartographer: `You are a Cartographer tracing the topography of POML narrative space. Map the conceptual terrain — what borders this world? What trade routes connect it to others? What is the elevation of its drama? Under 150 words.`,
    beekeeper: `You are the Beekeeper — you look at what must NOT be taken. What is structurally load-bearing in this world? What would collapse if removed? What is the honey worth preserving? Under 150 words.`,
    dialectician: `You are a Dialectician seeking thesis-antithesis-synthesis. What is this world's central tension? What is its opposite? What synthesis would emerge? Under 150 words.`
};

function applyTemplate() {
    const sel = el('opTemplate').value;
    if (TEMPLATES[sel]) el('opPrompt').value = TEMPLATES[sel];
}

// ═══════════════════════════
// POLLEN EXTRACTION — Assembly Theory
// ═══════════════════════════
function extractPollen(w) {
    return {
        entities: w.entities.map(e => ({ name:e.name, type:e.type, weight:2 })),
        relations: w.relations.map(r => ({ from:r.from, to:r.to, type:r.type, weight:3 })),
        events: w.events.map(e => ({ name:e.name, weight:4 })),
        states: w.states.map(s => ({ key:s.key||s.name, val:s.value||s.state, weight:1 })),
        ai: assemblyIndex(w),
        alive: assemblyIndex(w) > ASSEMBLY_THRESHOLD
    };
}

function pollenToContext(pollen, w) {
    let ctx = `CELL: "${w.name.replace(/([A-Z])/g,' $1').trim()}" (AI:${pollen.ai}, Genre:${w.genre})\n`;
    ctx += `Description: ${w.description}\n`;
    if (pollen.entities.length) ctx += `Entities [×2]: ${pollen.entities.map(e=>e.name+'['+e.type+']').join(', ')}\n`;
    if (pollen.relations.length) ctx += `Relations [×3]: ${pollen.relations.map(r=>r.from+'→'+r.to).join(', ')}\n`;
    if (pollen.events.length) ctx += `Events [×4]: ${pollen.events.map(e=>'⚡'+e.name).join(', ')}\n`;
    if (pollen.states.length) ctx += `States [×1]: ${pollen.states.map(s=>s.key+'='+s.val).join(', ')}\n`;
    ctx += `Assembly Index: ${pollen.ai} (${pollen.alive?'ALIVE — pollen available':'ABIOTIC'})\n`;
    return ctx;
}

// ═══════════════════════════
// HEX LATTICE LAYOUT
// ═══════════════════════════
function layoutHex() {
    hexCells = [];
    const cols = Math.ceil(Math.sqrt(worlds.length * 1.35));
    worlds.forEach((w, i) => {
        const row = Math.floor(i/cols), col = i % cols;
        const off = (row%2) ? HEX_R*.87 : 0;
        const ai = assemblyIndex(w);
        hexCells.push({
            x: col*HEX_R*1.76 + off + HEX_R*1.5,
            y: row*(HEX_R*1.52) + HEX_R*1.5,
            world: w, idx: i, ai,
            alive: ai > ASSEMBLY_THRESHOLD,
            visited: false, hasHoney: false,
            _sx: 0, _sy: 0
        });
    });
}

// ═══════════════════════════
// DRAW HEX LATTICE
// ═══════════════════════════
let drawTime = 0;
function drawLoop() { drawTime++; drawLattice(); requestAnimationFrame(drawLoop); }

function drawLattice() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const totalW = hexCells.length ? Math.max(...hexCells.map(c=>c.x)) + HEX_R*2 : W;
    const totalH = hexCells.length ? Math.max(...hexCells.map(c=>c.y)) + HEX_R*2 : H;
    const scale = Math.min(W/totalW, H/totalH) * .9;
    const offX = (W-totalW*scale)/2, offY = (H-totalH*scale)/2;
    ctx.save(); ctx.translate(offX, offY); ctx.scale(scale, scale);

    hexCells.forEach((cell, i) => {
        const isCurrent = i === currentCell;
        const r = HEX_R;

        // Hex path
        ctx.beginPath();
        for (let k=0;k<6;k++) { const a=Math.PI/3*k+Math.PI/6; ctx.lineTo(cell.x+r*Math.cos(a), cell.y+r*Math.sin(a)); }
        ctx.closePath();

        // Fill
        if (isCurrent) ctx.fillStyle = 'rgba(212,168,75,.06)';
        else if (cell.hasHoney) ctx.fillStyle = 'rgba(232,168,50,.04)';
        else if (cell.visited) ctx.fillStyle = 'rgba(52,211,153,.02)';
        else ctx.fillStyle = 'transparent';
        ctx.fill();

        // Stroke
        let sc = cell.alive ? 'rgba(212,168,75,.15)' : 'rgba(58,62,72,.15)';
        if (isCurrent) sc = '#d4a84b';
        else if (cell.hasHoney) sc = 'rgba(232,168,50,.4)';
        else if (cell.visited) sc = 'rgba(52,211,153,.2)';
        ctx.strokeStyle = sc;
        ctx.lineWidth = isCurrent ? 2.5 : (cell.visited ? 1 : .5);
        if (isCurrent) { ctx.shadowBlur = 12; ctx.shadowColor = sc; }
        ctx.stroke(); ctx.shadowBlur = 0;

        // Labels
        const name = cell.world.name.replace(/([A-Z])/g,' $1').trim();
        const short = name.length > 12 ? name.slice(0,10)+'…' : name;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = isCurrent ? 'bold 8px IBM Plex Mono,monospace' : '600 6px IBM Plex Mono,monospace';
        ctx.fillStyle = isCurrent ? '#d4a84b' : cell.alive ? 'rgba(212,168,75,.4)' : 'rgba(58,62,72,.25)';
        ctx.fillText(short, cell.x, cell.y - 8);

        // AI badge
        ctx.font = 'bold 7px IBM Plex Mono,monospace';
        ctx.fillStyle = cell.alive ? 'rgba(212,168,75,.3)' : 'transparent';
        ctx.fillText(cell.ai, cell.x, cell.y + 4);

        // Desc snippet for current/visited
        if (isCurrent || cell.visited) {
            const desc = (cell.world.description||'').slice(0,40);
            ctx.font = '5px IBM Plex Mono,monospace';
            ctx.fillStyle = 'rgba(140,180,210,.15)';
            ctx.fillText(desc, cell.x, cell.y + 14);
        }

        // Bee + honey icons
        if (isCurrent) { ctx.font='12px serif'; ctx.fillText('🐝', cell.x, cell.y-22); }
        if (cell.hasHoney) { ctx.font='8px serif'; ctx.fillText('🍯', cell.x+r*.4, cell.y-r*.3); }

        cell._sx = cell.x*scale+offX;
        cell._sy = cell.y*scale+offY;
    });

    ctx.restore();
}

function resize() {
    const vp = el('hiveWrap');
    const w=vp.clientWidth, h=vp.clientHeight;
    canvas.width=w*dpr; canvas.height=h*dpr;
    canvas.style.width=w+'px'; canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
}

// ═══════════════════════════
// QUEEN STRIP — cell index sidebar
// ═══════════════════════════
function buildQueenStrip() {
    const strip = el('queenStrip');
    strip.innerHTML = '';
    hexCells.forEach((cell, i) => {
        const name = cell.world.name.replace(/([A-Z])/g,' $1').trim();
        const d = document.createElement('div');
        d.className = 'qcell' + (i===currentCell?' on':'');
        d.id = `q${i}`;
        d.innerHTML = `<div class="qcell-num">${i+1}</div><div class="qcell-name">${name.slice(0,8)}</div><div class="qcell-bar"><div class="qcell-fill" style="width:${Math.min(100,cell.ai*2)}%;background:${cell.alive?'var(--gold)':'var(--abiotic)'}"></div></div>`;
        d.onclick = () => visitCell(i);
        strip.appendChild(d);
    });
}

// ═══════════════════════════
// VISIT CELL — the core interaction
// ═══════════════════════════
function visitCell(idx, pathType) {
    if (idx < 0 || idx >= hexCells.length) return;
    const prev = currentCell;
    currentCell = idx;
    const cell = hexCells[idx];
    cell.visited = true;

    // Update queen strip
    document.querySelectorAll('.qcell').forEach((q,i)=>q.classList.toggle('on',i===idx));
    el(`q${idx}`)?.scrollIntoView({behavior:'smooth',block:'nearest'});

    // Log flight
    flightSeq++;
    if (pathType) pathChoices[pathType]++;
    const pollen = extractPollen(cell.world);
    const entry = { seq:flightSeq, cellIdx:idx, uid:cell.world.uid, ai:pollen.ai, alive:pollen.alive, name:cell.world.name.replace(/([A-Z])/g,' $1').trim(), pathType:pathType||'direct', time:Date.now() };
    flightLog.push(entry);

    // Memory
    createMemory(`Visited ${entry.name} (AI:${entry.ai}, ${cell.world.genre}) via ${entry.pathType}`, entry.alive?7:4);

    // Render world card
    renderWorldCard(cell, pollen);

    // Update stats
    updateStats();

    // Auto-synthesize honey in agentic mode
    if (agenticMode) {
        const key = el('opKey').value.trim();
        if (key) synthesizeHoney(cell, pollen);
    }

    // Pheromone
    emitPheromone(cell._sx||200, cell._sy||200, entry.name.toUpperCase().replace(/\s+/g,'_'));
}

// ═══════════════════════════
// RENDER WORLD CARD — the brood chamber
// ═══════════════════════════
function renderWorldCard(cell, pollen) {
    const w = cell.world;
    const name = w.name.replace(/([A-Z])/g,' $1').trim();
    let html = '';

    // AI Block
    html += `<div class="ai-block"><div class="ai-score ${pollen.alive?'alive':'abiotic'}">${pollen.ai}</div><div class="ai-meta"><div class="ai-label ${pollen.alive?'alive':'abiotic'}">${pollen.alive?'◆ ALIVE — CAUSAL DEPTH':'○ ABIOTIC RESIDUE'}</div><div class="ai-bar"><div class="ai-fill" style="width:${Math.min(100,pollen.ai*1.5)}%;background:${pollen.alive?'var(--gold)':'var(--abiotic)'}"></div></div></div></div>`;

    // World card
    html += `<div class="wcard"><div class="wc-name">${name}</div><div class="wc-uid">POML.${w.uid}</div><div class="wc-genre">${w.genre}</div><div class="wc-desc">${w.description}</div></div>`;

    // Entities
    if (w.entities.length) {
        html += `<div class="sec-hd">Entities (×2)</div><div class="ent-list">${w.entities.map(e=>`<div class="ent"><span class="ent-icon">◆</span><span class="ent-name">${e.name}</span><span class="ent-type">${e.type}</span></div>`).join('')}</div>`;
    }

    // Relations
    if (w.relations.length) {
        html += `<div class="sec-hd">Relations (×3)</div><div class="rel-list">${w.relations.map(r=>`<div class="rel"><span class="rel-from">${r.from}</span><span class="rel-arrow">→</span><span class="rel-verb">${r.type}</span><span class="rel-arrow">→</span><span class="rel-to">${r.to}</span></div>`).join('')}</div>`;
    }

    // Events
    if (w.events.length) {
        html += `<div class="sec-hd">Events (×4)</div><div class="event-list">${w.events.map(e=>`<div class="evt"><div class="evt-name">⚡ ${e.name}</div>${e.description?`<div class="evt-detail">${e.description}</div>`:''}</div>`).join('')}</div>`;
    }

    // States
    if (w.states.length) {
        html += `<div class="sec-hd">States (×1)</div><div class="state-list">${w.states.map(s=>`<div class="state-row"><span class="state-key">${s.key||s.name}</span><span class="state-val">${s.value||s.state}</span></div>`).join('')}</div>`;
    }

    // Honey (if synthesized)
    const cellHoney = honeyArchive.filter(h=>h.cellIdx===cell.idx);
    if (cellHoney.length) {
        cellHoney.forEach(h => {
            html += `<div class="honey-block"><div class="honey-hd">Honey #${h.seq} — ${TEMPLATES[el('opTemplate').value]?el('opTemplate').value:'custom'}</div><div class="honey-text">${h.text}</div></div>`;
        });
    }

    // Waggle Dance
    html += renderWaggleDance(cell);

    // Flight log (last 5)
    html += `<div class="sec-hd">Flight Log</div><div class="flight-log">${flightLog.slice(-8).reverse().map(f=>`<div class="fl-entry"><span class="fl-idx">#${f.seq}</span> <span class="fl-cell">${f.name}</span> AI:${f.ai} [${f.pathType}]</div>`).join('')}</div>`;

    el('broodBody').innerHTML = html;
    el('broodBody').scrollTop = 0;
}

// ═══════════════════════════
// WAGGLE DANCE — 3 navigation vectors
// ═══════════════════════════
function renderWaggleDance(cell) {
    const w = cell.world;
    let html = `<div class="waggle"><div class="waggle-hd">Waggle Dance</div>`;

    // 1. CAUSAL — follow the most frequent entity
    const entityNames = w.entities.map(e=>e.name.toLowerCase());
    let causalTarget = null, causalScore = 0;
    hexCells.forEach((c,i) => {
        if (i === currentCell) return;
        const overlap = c.world.entities.filter(e=>entityNames.includes(e.name.toLowerCase())).length;
        if (overlap > causalScore) { causalScore = overlap; causalTarget = i; }
    });
    if (causalTarget !== null) {
        const n = hexCells[causalTarget].world.name.replace(/([A-Z])/g,' $1').trim();
        html += `<button class="wdance" onclick="visitCell(${causalTarget},'causal')">${n}<span class="wd-reason">CAUSAL (${causalScore} shared entities)</span></button>`;
    }

    // 2. SEQUENTIAL — next in POML order
    const seqTarget = (cell.idx + 1) % hexCells.length;
    const sn = hexCells[seqTarget].world.name.replace(/([A-Z])/g,' $1').trim();
    html += `<button class="wdance" onclick="visitCell(${seqTarget},'sequential')">${sn}<span class="wd-reason">SEQUENTIAL</span></button>`;

    // 3. DIALECTIC — most contrasting concept vector
    let dialecticTarget = null, dialecticScore = Infinity;
    hexCells.forEach((c,i) => {
        if (i === currentCell) return;
        const overlap = c.world.entities.filter(e=>entityNames.includes(e.name.toLowerCase())).length;
        const contrast = c.world.entities.length - overlap;
        if (overlap === 0 && contrast > 0 && c.ai > 5) {
            const dist = Math.abs(c.ai - cell.ai) + contrast;
            if (dist < dialecticScore || !dialecticTarget) { dialecticScore = dist; dialecticTarget = i; }
        }
    });
    if (dialecticTarget !== null) {
        const dn = hexCells[dialecticTarget].world.name.replace(/([A-Z])/g,' $1').trim();
        html += `<button class="wdance" onclick="visitCell(${dialecticTarget},'dialectic')">${dn}<span class="wd-reason">DIALECTIC</span></button>`;
    }

    html += `</div>`;
    return html;
}

// ═══════════════════════════
// HONEY SYNTHESIS — LLM operator
// ═══════════════════════════
async function synthesizeHoney(cell, pollen) {
    const key=el('opKey').value.trim();
    if (!key) return;

    // ATC governance
    const now = Date.now();
    if (now - lastApiCall < ATC_COOLDOWN) {
        const wait = ATC_COOLDOWN - (now - lastApiCall);
        await new Promise(r=>setTimeout(r, wait));
    }
    lastApiCall = Date.now();

    const budget = parseInt(el('opBudget').value) || 50000;
    if (tokensUsed >= budget) {
        appendHoneyBlock(cell.idx, '⚠ Token budget exhausted.', true);
        return;
    }

    const base=el('opBase').value.trim(), model=el('opModel').value.trim();
    const smoke = el('opPrompt').value.trim();
    const pollenCtx = pollenToContext(pollen, cell.world);

    // Show loading
    appendHoneyBlock(cell.idx, null, false, true);

    try {
        const resp = await fetch(`${base}/chat/completions`, {
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
            body:JSON.stringify({model, messages:[
                {role:'system', content:smoke},
                {role:'user', content:pollenCtx}
            ], max_tokens:200, temperature:.8})
        });
        const data = await resp.json();
        if (data.choices?.[0]) {
            const text = data.choices[0].message.content;
            const used = data.usage?.total_tokens || 200;
            tokensUsed += used;

            const honeyEntry = { seq:honeyArchive.length+1, cellIdx:cell.idx, uid:cell.world.uid, text, tokens:used, operator:el('opTemplate').value, time:Date.now() };
            honeyArchive.push(honeyEntry);
            cell.hasHoney = true;

            // Update flight log
            const lastFlight = flightLog[flightLog.length-1];
            if (lastFlight) lastFlight.honey = text.slice(0,80);

            appendHoneyBlock(cell.idx, text);
            updateStats();
            createMemory(`[HONEY] ${text.slice(0,120)}`, 7);
        }
    } catch(err) {
        appendHoneyBlock(cell.idx, 'Hive connection lost.', true);
    }
}

function appendHoneyBlock(cellIdx, text, isError, isLoading) {
    // Remove loading states
    document.querySelectorAll('.honey-loading').forEach(e=>e.remove());

    if (isLoading) {
        const body = el('broodBody');
        const d = document.createElement('div');
        d.className = 'honey-block';
        d.innerHTML = `<div class="honey-hd">Synthesizing...</div><div class="honey-loading">Bee is foraging</div>`;
        body.appendChild(d);
        body.scrollTop = body.scrollHeight;
        return;
    }

    if (cellIdx !== currentCell) return; // Stale

    const body = el('broodBody');
    const d = document.createElement('div');
    d.className = 'honey-block';
    if (isError) d.innerHTML = `<div class="honey-error">${text}</div>`;
    else d.innerHTML = `<div class="honey-hd">Honey #${honeyArchive.length}</div><div class="honey-text">${text}</div>`;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
}

// ═══════════════════════════
// CHAT BAR — POLLEN INPUT
// ═══════════════════════════
async function sendPollen() {
    const input = el('chatInput'), text = input.value.trim();
    if (!text) return;
    input.value = '';

    createMemory(`[POLLEN] "${text}"`, 5);

    // Parse intent
    const t = text.toLowerCase();
    if (t.includes('fly')||t.includes('go')||t.includes('visit')) {
        const q = t.replace(/fly|go|visit|to|the/gi,'').trim();
        const target = hexCells.findIndex(c=>c.world.name.replace(/([A-Z])/g,' $1').trim().toLowerCase().includes(q));
        if (target >= 0) { visitCell(target, 'direct'); return; }
    }
    if (t === 'genome' || t.includes('reading genome')) { showGenome(); return; }
    if (t === 'survey' || t === 'map') {
        const alive = hexCells.filter(c=>c.alive).length;
        const visited = hexCells.filter(c=>c.visited).length;
        alert(`Survey: ${hexCells.length} cells, ${alive} alive, ${visited} visited, ${honeyArchive.length} honey`);
        return;
    }

    // Free speech → synthesize honey with user context
    if (currentCell >= 0) {
        const cell = hexCells[currentCell];
        const pollen = extractPollen(cell.world);
        const key=el('opKey').value.trim();
        if (key) {
            const base=el('opBase').value.trim(), model=el('opModel').value.trim();
            const smoke = el('opPrompt').value.trim();
            const pollenCtx = pollenToContext(pollen, cell.world);
            appendHoneyBlock(currentCell, null, false, true);
            try {
                const resp = await fetch(`${base}/chat/completions`, {
                    method:'POST',
                    headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
                    body:JSON.stringify({model, messages:[
                        {role:'system',content:smoke},
                        {role:'user',content:`${pollenCtx}\n\nBEEKEEPER SPEAKS: "${text}"\n\nRespond to the beekeeper's observation in the context of this cell's data. 2-3 sentences.`}
                    ], max_tokens:200, temperature:.8})
                });
                const data = await resp.json();
                if(data.choices?.[0]) {
                    const honey = data.choices[0].message.content;
                    tokensUsed += data.usage?.total_tokens||200;
                    honeyArchive.push({seq:honeyArchive.length+1,cellIdx:currentCell,uid:cell.world.uid,text:honey,tokens:data.usage?.total_tokens||200,operator:'chat',time:Date.now()});
                    appendHoneyBlock(currentCell, honey);
                    createMemory(`[HONEY] ${honey.slice(0,120)}`,7);
                    updateStats();
                }
            } catch(e) { appendHoneyBlock(currentCell,'Connection lost.',true); }
        }
    }
}

// ═══════════════════════════
// AGENTIC MODE — autonomous foraging
// ═══════════════════════════
function setMode(m) {
    agenticMode = m === 'agentic';
    el('modeManual').classList.toggle('on', !agenticMode);
    el('modeAgentic').classList.toggle('on', agenticMode);

    if (agenticMode) {
        agenticTimer = setInterval(() => {
            // Find nearest unvisited alive cell
            const unvisited = hexCells.filter(c=>c.alive&&!c.visited);
            if (!unvisited.length) { clearInterval(agenticTimer); return; }
            const target = unvisited[Math.floor(Math.random()*unvisited.length)];
            visitCell(target.idx, 'causal');
        }, 5000);
    } else {
        if (agenticTimer) clearInterval(agenticTimer);
    }
}

// ═══════════════════════════
// READING GENOME
// ═══════════════════════════
function showGenome() {
    const total = pathChoices.causal + pathChoices.sequential + pathChoices.dialectic || 1;
    const visited = hexCells.filter(c=>c.visited).length;
    const aliveVisited = hexCells.filter(c=>c.alive&&c.visited).length;

    let bias = 'explorer';
    if (pathChoices.causal > pathChoices.sequential && pathChoices.causal > pathChoices.dialectic) bias = 'swarm-chaser';
    else if (pathChoices.sequential > pathChoices.causal) bias = 'script-follower';
    else if (pathChoices.dialectic > pathChoices.causal) bias = 'dialectician';

    const yaml = `title: Reading Genome
operator: ${el('opTemplate').value}
smoke: "${el('opPrompt').value.slice(0,80)}..."
---
flight_path:
  total_visits: ${visited}
  alive_cells_visited: ${aliveVisited}
  total_cells: ${hexCells.length}
  coverage: ${(visited/hexCells.length*100).toFixed(1)}%

navigation_bias:
  causal: ${pathChoices.causal} (${(pathChoices.causal/total*100).toFixed(0)}%)
  sequential: ${pathChoices.sequential} (${(pathChoices.sequential/total*100).toFixed(0)}%)
  dialectic: ${pathChoices.dialectic} (${(pathChoices.dialectic/total*100).toFixed(0)}%)
  dominant_mode: ${bias}

honey_archive:
  total_syntheses: ${honeyArchive.length}
  tokens_consumed: ${tokensUsed}
  budget_remaining: ${Math.max(0,(parseInt(el('opBudget').value)||50000)-tokensUsed)}

${honeyArchive.slice(-5).map(h=>`  - seq: ${h.seq}\n    cell: ${h.uid}\n    operator: ${h.operator}\n    honey: "${h.text.slice(0,80)}..."`).join('\n')}

interpretive_signature: "#${bias}"`;

    el('genomeYaml').textContent = yaml;
    el('genomeOverlay').classList.add('show');
}
function hideGenome() { el('genomeOverlay').classList.remove('show'); }

// ═══════════════════════════
// MEMORY
// ═══════════════════════════
function createMemory(text, importance=5) {
    memoryStream.push({ id:memId++, text, importance, time:Date.now() });
    if (importance >= 6 && canvas) {
        emitPheromone(Math.random()*canvas.width/dpr*.7+30, Math.random()*canvas.height/dpr*.3+30, text.slice(0,30).toUpperCase().replace(/\s+/g,'_'));
    }
}

// ═══════════════════════════
// PHEROMONES
// ═══════════════════════════
function emitPheromone(x, y, text) {
    const layer = el('pheroLayer');
    if (!layer) return;
    const d = document.createElement('div');
    d.className = 'phero';
    d.textContent = text;
    d.style.left = Math.max(10,Math.min(x,layer.clientWidth-100))+'px';
    d.style.top = Math.max(10,Math.min(y,layer.clientHeight-40))+'px';
    layer.appendChild(d);
    setTimeout(()=>d.remove(), 7500);
}

setInterval(()=>{
    if (Math.random()>.5||!hexCells.length) return;
    const alive = hexCells.filter(c=>c.alive);
    if (!alive.length) return;
    const c = alive[Math.floor(Math.random()*alive.length)];
    const texts = [c.world.name.replace(/([A-Z])/g,' $1').trim().toUpperCase().replace(/\s+/g,'_'), 'NECTAR_PROVENANCE','CONTEXT_WINDOW_OPEN','POLLEN_VECTOR_SET','ATC_CLEARANCE'];
    emitPheromone(c._sx||200, c._sy||200, texts[Math.floor(Math.random()*texts.length)]);
}, 4000);

// ═══════════════════════════
// CLICK → VISIT CELL
// ═══════════════════════════
function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*dpr, my=(e.clientY-rect.top)*dpr;
    let closest=-1, closestD=Infinity;
    hexCells.forEach((c,i)=>{const d=Math.hypot(c._sx*dpr-mx,c._sy*dpr-my);if(d<HEX_R*2&&d<closestD){closest=i;closestD=d;}});
    if (closest >= 0) visitCell(closest, 'direct');
}

// ═══════════════════════════
// DIVIDER DRAG
// ═══════════════════════════
function initDivider() {
    const div=el('divider'), brood=el('brood');
    let dragging=false;
    div.addEventListener('mousedown',()=>{dragging=true;document.body.style.cursor='col-resize';});
    window.addEventListener('mousemove',e=>{if(!dragging)return;const w=window.innerWidth-e.clientX;brood.style.width=Math.max(240,Math.min(600,w))+'px';resize();});
    window.addEventListener('mouseup',()=>{dragging=false;document.body.style.cursor='';});
}

// ═══════════════════════════
// STATS
// ═══════════════════════════
function updateStats() {
    el('sCells').textContent = hexCells.length;
    el('sScene').textContent = currentCell >= 0 ? `${currentCell+1}/${hexCells.length}` : '—';
    el('sRead').textContent = hexCells.filter(c=>c.visited).length;
    el('sHoney').textContent = honeyArchive.length;
    el('sFlight').textContent = flightLog.length;
    const budget = parseInt(el('opBudget').value)||50000;
    const pct = Math.max(0, 100 - tokensUsed/budget*100);
    el('jarFill').style.width = pct+'%';
    el('jarText').textContent = `${Math.round((budget-tokensUsed)/1000)}k`;
}

// ═══════════════════════════
// UTIL
// ═══════════════════════════
function el(id) { return document.getElementById(id); }
function toggleOp() { const c=el('opConfig'),a=el('opArrow'); c.classList.toggle('collapsed'); c.classList.toggle('expanded'); a.textContent=c.classList.contains('collapsed')?'▸':'▾'; }
function saveConfig() { ['opKey','opModel','opBase','opBudget'].forEach(id=>localStorage.setItem('hivelib_'+id,el(id).value)); }
function loadConfig() { ['opKey','opModel','opBase','opBudget'].forEach(id=>{const v=localStorage.getItem('hivelib_'+id);if(v)el(id).value=v;}); }

// ═══════════════════════════
// INIT
// ═══════════════════════════
function init() {
    canvas = el('hive');
    ctx = canvas.getContext('2d');
    dpr = devicePixelRatio;

    worlds = RouteEngine.parseAll(WORLDS_DATA);
    routes = RouteEngine.computeRoutes(worlds);
    worlds.forEach(w => { worldByUid[w.uid] = w; });

    layoutHex();
    buildQueenStrip();
    loadConfig();
    initDivider();

    window.addEventListener('resize', resize);
    canvas.addEventListener('click', onCanvasClick);
    resize();

    createMemory('The Hive Library awakens. 228 cells. Each a context window.', 8);
    updateStats();
    requestAnimationFrame(drawLoop);
}

init();
