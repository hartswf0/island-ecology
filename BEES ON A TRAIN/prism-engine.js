// ══════════════════════════════
// PRISM ENGINE — Stage/Actor Disentanglement + Glitch Feedback
// ══════════════════════════════

let worlds = [], routes = [], worldByUid = {};
let canvas, ctx, VW, VH;
let hexCells = [];
let currentIdx = 0;
let viewMode = 'both'; // 'stage' | 'actor' | 'both'
let mode = 'manual';
let lastApiCall = 0;
let frameBuffer = null; // for glitch feedback

const ASSEMBLY_THRESHOLD = 15;
const HEX_R = 38, HEX_H = HEX_R * Math.sqrt(3);
const ACTOR_COLORS = {catastrophe:{h:0,s:65,l:50},espionage:{h:45,s:70,l:55},thriller:{h:280,s:55,l:55},cinematic:{h:210,s:60,l:55},cultural:{h:140,s:50,l:48},geopolitical:{h:180,s:55,l:48}};
function actorHSL(a,o=1){const c=ACTOR_COLORS[a]||{h:0,s:0,l:50};return `hsla(${c.h},${c.s}%,${c.l}%,${o})`}
function assemblyIndex(w){return(w.entities.length*2)+(w.relations.length*3)+(w.events.length*4)+w.states.length}

const TEMPLATES = {
    prism: "You are a prism analyst. Given a POML world disentangled into STAGE (static structure — entities, states, geometry) and ACTOR (dynamic motion — relations, events, causal chains), analyze the tension between the two layers. What is the stage holding that the actors are breaking? What motion disturbs the geometry? Keep responses under 200 words.",
    director: "You are a filmmaker examining this world through a prism. STAGE is the set — the physical space, the objects, the boundaries. ACTOR is the performance — the events, the causal chains, the motion. Describe the scene where stage and actor collide. Keep responses under 200 words.",
    custom: ""
};

// ══════════════════════════════
// INIT
// ══════════════════════════════
function init() {
    canvas = document.getElementById('glitchCanvas');
    ctx = canvas.getContext('2d');
    worlds = RouteEngine.parseAll(WORLDS_DATA);
    routes = RouteEngine.computeRoutes(worlds);
    worlds.forEach(w => {wordByUid=worldByUid; worldByUid[w.uid]=w; w.ai=assemblyIndex(w); w.actor_type=RouteEngine.getActorType(w.genre); });
    layoutHex();
    loadCfg();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', onCanvasMove);
    resize();
    setupDivider();
    requestAnimationFrame(glitchLoop);
}

function loadCfg(){const k=localStorage.getItem('hive_api_key');if(k)document.getElementById('opKey').value=k;const m=localStorage.getItem('hive_model');if(m)document.getElementById('opModel').value=m;const b=localStorage.getItem('hive_base');if(b)document.getElementById('opBase').value=b;}
function saveCfg(){localStorage.setItem('hive_api_key',document.getElementById('opKey').value);localStorage.setItem('hive_model',document.getElementById('opModel').value);localStorage.setItem('hive_base',document.getElementById('opBase').value);}

// ══════════════════════════════
// HEX LAYOUT — centered honeycomb
// ══════════════════════════════
function layoutHex() {
    hexCells = [];
    const cols = Math.ceil(Math.sqrt(worlds.length * 1.5));
    worlds.forEach((w, i) => {
        const row = Math.floor(i / cols), col = i % cols;
        const offset = (row % 2) ? HEX_R * 0.87 : 0;
        hexCells.push({
            x: col * HEX_R * 1.74 + offset + HEX_R * 2,
            y: row * HEX_H * 0.87 + HEX_R * 2,
            world: w, idx: i, ai: w.ai,
            actor_type: w.actor_type,
            honey: null, honeyLoading: false
        });
    });
}

// ══════════════════════════════
// GLITCH FEEDBACK CANVAS
// ══════════════════════════════
let mouseX = 0, mouseY = 0, glitchTime = 0;

function glitchLoop() {
    glitchTime++;
    drawHexGrid();
    // Feedback: read back and blend
    if(frameBuffer && glitchTime % 3 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.globalCompositeOperation = 'screen';
        // Slight offset for feedback trail
        const dx = Math.sin(glitchTime * 0.01) * 1.5;
        const dy = Math.cos(glitchTime * 0.013) * 1;
        ctx.drawImage(canvas, dx, dy);
        ctx.restore();
    }
    // Store frame
    frameBuffer = true;
    requestAnimationFrame(glitchLoop);
}

function drawHexGrid() {
    const w = canvas.width, h = canvas.height;
    // Subtle fade instead of full clear — creates trails
    ctx.fillStyle = 'rgba(7,9,15,0.12)';
    ctx.fillRect(0, 0, w, h);

    // Viewport transform
    const totalW = hexCells.length > 0 ? Math.max(...hexCells.map(c=>c.x)) + HEX_R * 2 : w;
    const totalH = hexCells.length > 0 ? Math.max(...hexCells.map(c=>c.y)) + HEX_R * 2 : h;
    const scale = Math.min(w / totalW, h / totalH) * 0.9;
    const offX = (w - totalW * scale) / 2;
    const offY = (h - totalH * scale) / 2;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    hexCells.forEach((cell, i) => {
        const isCurrent = i === currentIdx;
        const alive = cell.ai > ASSEMBLY_THRESHOLD;
        const r = HEX_R * (isCurrent ? 1.12 : 1);

        // Glitch: slight position jitter near mouse
        const distToMouse = Math.hypot(cell.x * scale + offX - mouseX * devicePixelRatio, cell.y * scale + offY - mouseY * devicePixelRatio);
        const glitchInfluence = Math.max(0, 1 - distToMouse / (150 * devicePixelRatio));
        const jx = glitchInfluence * Math.sin(glitchTime * 0.1 + i) * 2;
        const jy = glitchInfluence * Math.cos(glitchTime * 0.13 + i) * 1.5;

        const cx = cell.x + jx, cy = cell.y + jy;

        // Draw hex
        ctx.beginPath();
        for(let k=0;k<6;k++){const a=Math.PI/3*k-Math.PI/6;ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));}
        ctx.closePath();

        // Fill: stage = blue channel, actor = red channel
        const stageWeight = (cell.world.entities.length + cell.world.states.length) / Math.max(cell.ai, 1);
        const actorWeight = (cell.world.relations.length + cell.world.events.length) / Math.max(cell.ai, 1);
        const density = Math.min(1, cell.ai / 40);

        if(viewMode === 'stage') {
            ctx.fillStyle = `hsla(210,55%,50%,${0.05 + stageWeight * density * 0.3})`;
        } else if(viewMode === 'actor') {
            ctx.fillStyle = `hsla(15,75%,55%,${0.05 + actorWeight * density * 0.3})`;
        } else {
            const r2 = Math.round(actorWeight * density * 80);
            const b2 = Math.round(stageWeight * density * 120);
            ctx.fillStyle = `rgba(${r2},${Math.round(density*30)},${b2},${0.08 + density * 0.2})`;
        }
        ctx.fill();

        // Stroke
        ctx.strokeStyle = isCurrent ? 'rgba(212,168,75,0.6)' : (glitchInfluence > 0.3 ? `rgba(180,100,220,${glitchInfluence * 0.3})` : `rgba(160,196,216,${alive ? 0.06 : 0.03})`);
        ctx.lineWidth = isCurrent ? 2 : (glitchInfluence > 0.3 ? 1.5 : 0.5);
        ctx.stroke();

        // Label
        if(isCurrent || scale > 0.3) {
            const name = cell.world.name.replace(/([A-Z])/g,' $1').trim();
            const short = name.length > 14 ? name.slice(0,12)+'…' : name;
            ctx.font = isCurrent ? `600 12px 'IBM Plex Mono'` : `500 8px 'IBM Plex Mono'`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillStyle = isCurrent ? 'rgba(212,168,75,0.85)' : 'rgba(160,196,216,0.25)';
            ctx.fillText(short, cx, cy + 6);
        }

        // Center dot — color shows stage/actor balance
        ctx.beginPath(); ctx.arc(cx, cy - 2, isCurrent ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? 'rgba(212,168,75,0.8)' : (alive ? actorHSL(cell.actor_type, 0.35) : 'rgba(68,74,84,0.3)');
        ctx.fill();

        // Halo for current
        if(isCurrent) {
            ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
            const g = ctx.createRadialGradient(cx, cy, r*0.4, cx, cy, r+14);
            g.addColorStop(0, 'rgba(212,168,75,0.15)');
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.fill();
        }

        // Honey indicator
        if(cell.honey){ctx.beginPath();ctx.arc(cx+r*0.6,cy-r*0.5,3,0,Math.PI*2);ctx.fillStyle='rgba(232,168,50,0.6)';ctx.fill();}

        cell._sx = cx * scale + offX;
        cell._sy = cy * scale + offY;
    });

    ctx.restore();
}

function onCanvasMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * devicePixelRatio;
    const my = (e.clientY - rect.top) * devicePixelRatio;
    let closest = -1, closestD = Infinity;
    hexCells.forEach((c, i) => {
        const d = Math.hypot(c._sx * devicePixelRatio - mx, c._sy * devicePixelRatio - my);
        if(d < HEX_R * 2 && d < closestD) { closest = i; closestD = d; }
    });
    if(closest >= 0) selectCell(closest);
}

function resize() {
    const vp = document.getElementById('glitchWrap');
    VW = vp.clientWidth; VH = vp.clientHeight;
    canvas.width = VW * devicePixelRatio;
    canvas.height = VH * devicePixelRatio;
    canvas.style.width = VW + 'px';
    canvas.style.height = VH + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

// ══════════════════════════════
// CELL SELECTION & DISENTANGLEMENT
// ══════════════════════════════
function selectCell(idx) {
    currentIdx = idx;
    const cell = hexCells[idx];
    document.getElementById('sStn').textContent = `${idx+1}/${worlds.length}`;
    document.getElementById('sAI').textContent = cell.ai;
    renderPrism(cell);
    if(mode === 'agentic' && !cell.honey && !cell.honeyLoading) synthesizeHoney(cell);
}

function step(dir) {
    currentIdx = (currentIdx + dir + worlds.length) % worlds.length;
    selectCell(currentIdx);
}

// ══════════════════════════════
// PRISM PANEL — disentangled render
// ══════════════════════════════
function renderPrism(cell) {
    const body = document.getElementById('prismBody');
    const w = cell.world, alive = cell.ai > ASSEMBLY_THRESHOLD;
    const dn = w.name.replace(/([A-Z])/g,' $1').trim();
    const maxAI = Math.max(...worlds.map(x=>x.ai),1);
    let h = '';

    // World header (always shown)
    h += `<div class="world-hdr"><div class="wh-name">${esc(dn)}</div><div class="wh-meta">${w.uid} · ${w.source} · ch ${w.source.replace('.md','')}</div><div class="wh-genre">${esc(w.genre)}</div><p class="wh-desc">${esc(w.description)}</p><div class="wh-ai"><div class="wh-ai-num ${alive?'alive':'abiotic'}">${cell.ai}</div><div class="wh-ai-bar"><div class="wh-ai-fill" style="width:${(cell.ai/maxAI*100).toFixed(1)}%;background:${alive?'var(--alive)':'var(--abiotic)'}"></div></div></div></div>`;

    // STAGE layer (entities + states)
    if(viewMode === 'stage' || viewMode === 'both') {
        const stageWeight = w.entities.length * 2 + w.states.length;
        h += `<div class="sec-hd stage-hd">◆ Stage — Static Geometry <span class="sec-badge">weight: ${stageWeight}</span></div>`;
        if(w.entities.length) {
            h += `<div class="item-list">`;
            w.entities.forEach(e => {
                h += `<div class="item"><span class="item-icon stage-icon">◆</span><span class="item-name">${esc(e.name)}</span><span class="item-type">${esc(e.type)}</span></div>`;
            });
            h += `</div>`;
        }
        if(w.states.length) {
            h += `<div class="item-list">`;
            w.states.forEach(s => {
                h += `<div class="item"><span class="item-icon stage-icon">▪</span><span class="item-state-key">${esc(s.target)}.${esc(s.key)}</span><span style="flex:1"></span><span class="item-state-val">${esc(s.value)}</span></div>`;
            });
            h += `</div>`;
        }
        if(!w.entities.length && !w.states.length) h += `<div class="item-list"><div class="item" style="color:var(--ink3)">No static geometry</div></div>`;
    }

    // ACTOR layer (relations + events)
    if(viewMode === 'actor' || viewMode === 'both') {
        const actorWeight = w.relations.length * 3 + w.events.length * 4;
        h += `<div class="sec-hd actor-hd">⚡ Actor — Dynamic Motion <span class="sec-badge">weight: ${actorWeight}</span></div>`;
        if(w.relations.length) {
            h += `<div class="item-list">`;
            w.relations.forEach(r => {
                h += `<div class="item"><span class="item-icon actor-icon">→</span><span class="item-name">${esc(r.from)}</span><span class="item-arrow">──</span><span class="item-verb">${esc(r.verb)}</span><span class="item-arrow">──▸</span><span class="item-name">${esc(r.to)}</span></div>`;
            });
            h += `</div>`;
        }
        if(w.events.length) {
            h += `<div class="item-list">`;
            w.events.forEach(ev => {
                h += `<div class="evt-block"><div class="evt-name">⚡ ${esc(ev.name)}</div><div class="evt-detail">${ev.actors.length?'actors: '+ev.actors.map(esc).join(', ')+'<br>':''}${ev.effects.length?'effects: '+ev.effects.map(esc).join(', '):''}</div></div>`;
            });
            h += `</div>`;
        }
        if(!w.relations.length && !w.events.length) h += `<div class="item-list"><div class="item" style="color:var(--ink3)">No dynamic motion</div></div>`;
    }

    // Honey
    if(mode === 'agentic') {
        h += `<div class="honey-block"><div class="honey-hd">Honey — Prism Synthesis</div>`;
        if(cell.honeyLoading) h += `<div class="honey-loading">Analyzing through the prism</div>`;
        else if(cell.honey) h += `<div class="honey-text">${esc(cell.honey)}</div>`;
        else h += `<div class="honey-loading" style="animation:none;color:var(--ink3)">Select agentic mode and click a cell</div>`;
        h += `</div>`;
    }

    body.innerHTML = h;
    body.scrollTop = 0;
}

function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';}

// ══════════════════════════════
// POLLEN — disentangled
// ══════════════════════════════
function extractDisentangledPollen(w) {
    let p = `WORLD: ${w.name.replace(/([A-Z])/g,' $1').trim()}\nGENRE: ${w.genre} | AI: ${w.ai}\nDESCRIPTION: ${w.description}\n\n`;
    p += `=== STAGE (Static Geometry) ===\n`;
    if(w.entities.length) p += `ENTITIES:\n${w.entities.map(e=>`  ◆ ${e.name} [${e.type}]`).join('\n')}\n`;
    if(w.states.length) p += `STATES:\n${w.states.map(s=>`  ▪ ${s.target}.${s.key} = ${s.value}`).join('\n')}\n`;
    if(!w.entities.length && !w.states.length) p += '  (empty stage)\n';
    p += `\n=== ACTOR (Dynamic Motion) ===\n`;
    if(w.relations.length) p += `RELATIONS:\n${w.relations.map(r=>`  → ${r.from} ──${r.verb}──▸ ${r.to}`).join('\n')}\n`;
    if(w.events.length) p += `EVENTS:\n${w.events.map(e=>`  ⚡ ${e.name}${e.actors.length?' ('+e.actors.join(', ')+')':''}${e.effects.length?' → '+e.effects.join(', '):''}`).join('\n')}\n`;
    if(!w.relations.length && !w.events.length) p += '  (no motion)\n';
    return p;
}

// ══════════════════════════════
// HONEY SYNTHESIS
// ══════════════════════════════
async function synthesizeHoney(cell) {
    const now = Date.now();
    if(now - lastApiCall < 3000) return;
    lastApiCall = now;
    const key = document.getElementById('opKey').value.trim();
    const base = document.getElementById('opBase').value.trim();
    const model = document.getElementById('opModel').value.trim();
    const prompt = document.getElementById('opPrompt').value.trim();
    if(!key||!prompt){cell.honey='⚠ Configure API key and operator.';renderPrism(cell);return;}
    cell.honeyLoading = true;
    renderPrism(cell);
    const pollen = extractDisentangledPollen(cell.world);
    try {
        const resp = await fetch(`${base}/chat/completions`, {
            method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
            body:JSON.stringify({model,messages:[{role:'system',content:prompt},{role:'user',content:pollen}],max_tokens:512,temperature:0.7})
        });
        const data = await resp.json();
        if(data.error) throw new Error(data.error.message||'API error');
        cell.honey = data.choices[0].message.content;
        cell.honeyLoading = false;
    } catch(err) {
        cell.honey = `⚠ ${err.message}`;
        cell.honeyLoading = false;
    }
    renderPrism(cell);
}

// ══════════════════════════════
// VIEW / MODE
// ══════════════════════════════
function setView(v) {
    viewMode = v;
    document.getElementById('sView').textContent = v === 'both' ? 'Both' : v === 'stage' ? 'Stage' : 'Actor';
    ['vStage','vBoth','vActor'].forEach(id => document.getElementById(id).classList.remove('on','stage-on','actor-on'));
    document.getElementById('tabStage').classList.toggle('on', v==='stage'||v==='both');
    document.getElementById('tabBoth').classList.toggle('on', v==='both');
    document.getElementById('tabActor').classList.toggle('on', v==='actor'||v==='both');
    if(v==='stage') document.getElementById('vStage').classList.add('stage-on');
    else if(v==='actor') document.getElementById('vActor').classList.add('actor-on');
    else document.getElementById('vBoth').classList.add('on');
    if(hexCells[currentIdx]) renderPrism(hexCells[currentIdx]);
}

function setMode(m){mode=m;document.getElementById('mManual').classList.toggle('on',m==='manual');document.getElementById('mAgent').classList.toggle('on',m==='agentic');if(hexCells[currentIdx])renderPrism(hexCells[currentIdx]);}
function toggleOp(){const c=document.getElementById('opConfig'),a=document.getElementById('opArrow');c.classList.toggle('collapsed');c.classList.toggle('expanded');a.textContent=c.classList.contains('collapsed')?'▸':'▾';}
function applyTpl(){const t=document.getElementById('opTemplate').value;if(TEMPLATES[t])document.getElementById('opPrompt').value=TEMPLATES[t];}
function setupDivider(){const div=document.getElementById('divider'),p=document.getElementById('prismPanel');div.addEventListener('mousedown',e=>{e.preventDefault();const sx=e.clientX,sw=p.offsetWidth;const mv=ev=>{p.style.width=Math.max(280,Math.min(700,sw-(ev.clientX-sx)))+'px';resize();};const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});}

// Keyboard
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});

init();
