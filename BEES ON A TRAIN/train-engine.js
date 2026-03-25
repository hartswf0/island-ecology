// ══════════════════════════════
// TRAIN ENGINE — Ring Buffer Circuit
// ══════════════════════════════

let worlds = [], routes = [], worldByUid = {};
let canvas, ctx, VW, VH;
let stations = []; // all 228 worlds as stations on the circular track
let trainPos = 0;  // current station index
let ringBuffer = []; // sliding context window
const RING_SIZE = 8;
let playing = false, playTimer = null, playSpeed = 2000;
let laps = 0, honeyCount = 0;
let mode = 'manual';
let lastApiCall = 0;

const ASSEMBLY_THRESHOLD = 15;
const CHAPTER_NAMES = {'00.md':'Breach','01.md':'Beekeeper','02.md':'Surveillance','03.md':'Bullet Train','04.md':'Snowpiercer','05.md':'Honeyland','06.md':'Wings I','07.md':'Wings II','08.md':'Heist 1855','09.md':'Steam','10.md':'Lumière','11.md':'Bee Movie'};
const ACTOR_COLORS = {catastrophe:{h:0,s:65,l:50},espionage:{h:45,s:70,l:55},thriller:{h:280,s:55,l:55},cinematic:{h:210,s:60,l:55},cultural:{h:140,s:50,l:48},geopolitical:{h:180,s:55,l:48}};
function actorHSL(a,o=1){const c=ACTOR_COLORS[a]||{h:0,s:0,l:50};return `hsla(${c.h},${c.s}%,${c.l}%,${o})`}
function assemblyIndex(w){return(w.entities.length*2)+(w.relations.length*3)+(w.events.length*4)+w.states.length}

const TEMPLATES = {
    conductor: "You are the conductor of this train. At each station, you receive the current ring buffer — the last 8 worlds the train has passed through. Describe what the train is carrying now: what narrative threads connect these worlds? What film is forming in the carriages? What must be dropped at the next stop? Keep responses under 200 words.",
    director: "You are a filmmaker riding this train. The ring buffer shows your rolling context — the worlds streaming past the window. Describe the montage: what sequence of shots is forming? What rhythm connects these stations? Keep responses under 200 words.",
    forensic: "You are a forensic analyst on this train. The ring buffer is your evidence window. What causal chains connect the buffered worlds? What entity appears across multiple stations? What is the dominant thread? Keep responses under 200 words.",
    beekeeper: "You are Hatidze riding this train through the hive. The ring buffer shows the cells you've passed. What honey is accumulating? What is alive in this sequence? What is dying as it leaves the buffer? Keep responses under 200 words.",
    custom: ""
};

// ══════════════════════════════
// INIT
// ══════════════════════════════
function init() {
    canvas = document.getElementById('track');
    ctx = canvas.getContext('2d');
    worlds = RouteEngine.parseAll(WORLDS_DATA);
    routes = RouteEngine.computeRoutes(worlds);
    worlds.forEach(w => { worldByUid[w.uid]=w; w.ai=assemblyIndex(w); w.actor=RouteEngine.getActorType(w.genre); });
    stations = worlds.map((w,i) => ({world:w, idx:i, ai:w.ai, actor:w.actor, source:w.source, honey:null, honeyLoading:false}));
    loadCfg();
    renderRingSlots();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', onTrackClick);
    resize();
    setupDivider();
}

function loadCfg(){const k=localStorage.getItem('hive_api_key');if(k)document.getElementById('opKey').value=k;const m=localStorage.getItem('hive_model');if(m)document.getElementById('opModel').value=m;const b=localStorage.getItem('hive_base');if(b)document.getElementById('opBase').value=b;}
function saveCfg(){localStorage.setItem('hive_api_key',document.getElementById('opKey').value);localStorage.setItem('hive_model',document.getElementById('opModel').value);localStorage.setItem('hive_base',document.getElementById('opBase').value);}

// ══════════════════════════════
// CIRCULAR TRACK DRAWING
// ══════════════════════════════
function draw() {
    if(!ctx) return;
    const w=canvas.width, h=canvas.height;
    ctx.clearRect(0,0,w,h);
    const cx=w/2, cy=h/2;
    const rx=Math.min(cx,cy)*0.82, ry=rx*0.65; // elliptical track

    // Track rail
    ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
    ctx.strokeStyle='var(--track)';ctx.lineWidth=2;ctx.stroke();
    // Inner rail
    ctx.beginPath();ctx.ellipse(cx,cy,rx-18,ry-18,0,0,Math.PI*2);
    ctx.strokeStyle='rgba(140,180,210,.03)';ctx.lineWidth=1;ctx.stroke();

    const n = stations.length;
    const bufUids = new Set(ringBuffer.map(b=>b.world.uid));

    stations.forEach((stn,i) => {
        const angle = (i/n)*Math.PI*2 - Math.PI/2;
        const x = cx + rx*Math.cos(angle);
        const y = cy + ry*Math.sin(angle);
        stn._x = x; stn._y = y;
        const isCurrent = i===trainPos;
        const inBuffer = bufUids.has(stn.world.uid);
        const alive = stn.ai > ASSEMBLY_THRESHOLD;
        const r = isCurrent ? 7 : (inBuffer ? 5 : 3);

        // Station dot
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        if(isCurrent) {
            ctx.fillStyle = 'hsl(15,80%,55%)';
            ctx.fill();
            // Halo
            ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);
            const g=ctx.createRadialGradient(x,y,4,x,y,14);
            g.addColorStop(0,'rgba(220,100,60,.3)');g.addColorStop(1,'transparent');
            ctx.fillStyle=g;ctx.fill();
        } else if(inBuffer) {
            ctx.fillStyle = alive ? actorHSL(stn.actor,.6) : 'rgba(58,62,72,.5)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(212,168,75,.3)';ctx.lineWidth=1;ctx.stroke();
        } else {
            ctx.fillStyle = alive ? actorHSL(stn.actor,.2) : 'rgba(58,62,72,.15)';
            ctx.fill();
        }

        // Honey dot
        if(stn.honey){ctx.beginPath();ctx.arc(x+r+3,y-r-1,2.5,0,Math.PI*2);ctx.fillStyle='rgba(232,168,50,.6)';ctx.fill();}

        // Label for current & buffer
        if(isCurrent || (inBuffer && n < 300)) {
            const name = stn.world.name.replace(/([A-Z])/g,' $1').trim();
            const short = name.length>14?name.slice(0,12)+'…':name;
            ctx.font = isCurrent ? "600 10px 'IBM Plex Mono',monospace" : "500 8px 'IBM Plex Mono',monospace";
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillStyle = isCurrent ? 'rgba(220,100,60,.9)' : 'rgba(192,216,232,.4)';
            ctx.fillText(short, x, y - r - 4);
        }
    });

    // Draw buffer connections (arc between buffered stations)
    if(ringBuffer.length > 1) {
        ctx.beginPath();ctx.strokeStyle='rgba(212,168,75,.1)';ctx.lineWidth=1;
        ringBuffer.forEach((b,i) => {
            const stn = stations[b.idx];
            if(i===0) ctx.moveTo(stn._x, stn._y);
            else ctx.lineTo(stn._x, stn._y);
        });
        ctx.stroke();
    }

    // Center label
    ctx.font = "600 9px 'IBM Plex Mono',monospace";
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(140,180,210,.15)';
    ctx.fillText(`${trainPos+1} / ${n}`, cx, cy-8);
    ctx.font = "italic 14px 'Cormorant Garamond',serif";
    ctx.fillStyle='rgba(212,168,75,.12)';
    ctx.fillText('the circuit', cx, cy+10);
}

function resize(){const vp=document.getElementById('trackWrap');VW=vp.clientWidth;VH=vp.clientHeight;canvas.width=VW*devicePixelRatio;canvas.height=VH*devicePixelRatio;canvas.style.width=VW+'px';canvas.style.height=VH+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);draw();}

function onTrackClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX-rect.left)*devicePixelRatio, my = (e.clientY-rect.top)*devicePixelRatio;
    let closest = -1, closestD = Infinity;
    stations.forEach((s,i) => { const d = Math.hypot(s._x*devicePixelRatio-mx, s._y*devicePixelRatio-my); if(d<20*devicePixelRatio&&d<closestD){closest=i;closestD=d;} });
    if(closest >= 0) { trainPos = closest; arriveAtStation(); }
}

// ══════════════════════════════
// TRAIN MOVEMENT
// ══════════════════════════════
function trainStep(dir) {
    trainPos = (trainPos + dir + stations.length) % stations.length;
    if(trainPos === 0 && dir > 0) { laps++; document.getElementById('sLap').textContent = laps; }
    arriveAtStation();
}

function togglePlay() {
    playing = !playing;
    document.getElementById('btnPlay').classList.toggle('on', playing);
    document.getElementById('btnPlay').textContent = playing ? '⏸ STOP' : '▶ AUTO';
    if(playing) scheduleNext();
    else clearTimeout(playTimer);
}
function setSpeed() { playSpeed = parseInt(document.getElementById('speedSel').value); }
function scheduleNext() { if(!playing) return; playTimer = setTimeout(() => { trainStep(1); if(playing) scheduleNext(); }, playSpeed); }

// ══════════════════════════════
// RING BUFFER
// ══════════════════════════════
function pushToBuffer(station) {
    // Check if already in buffer
    if(ringBuffer.some(b => b.world.uid === station.world.uid)) return;
    // Evict if full
    if(ringBuffer.length >= RING_SIZE) ringBuffer.shift(); // FIFO eviction
    ringBuffer.push(station);
}

function renderRingSlots() {
    const container = document.getElementById('ringSlots');
    let html = '';
    for(let i = 0; i < RING_SIZE; i++) {
        const entry = ringBuffer[i];
        if(entry) {
            const name = entry.world.name.replace(/([A-Z])/g,' $1').trim();
            const short = name.length>18?name.slice(0,16)+'…':name;
            const isCurrent = entry.idx === trainPos;
            html += `<div class="ring-slot ${isCurrent?'current':'filled'}" onclick="jumpToBuffered(${entry.idx})"><span class="rs-idx">${i}</span><span class="rs-name">${esc(short)}</span><span class="rs-ai">${entry.ai}</span></div>`;
        } else {
            html += `<div class="ring-slot empty"><span class="rs-idx">${i}</span><span class="rs-name">—</span></div>`;
        }
    }
    container.innerHTML = html;
    document.getElementById('sBuf').textContent = `${ringBuffer.length}/${RING_SIZE}`;
}

function jumpToBuffered(idx) { trainPos = idx; arriveAtStation(); }

// ══════════════════════════════
// ARRIVE AT STATION
// ══════════════════════════════
function arriveAtStation() {
    const stn = stations[trainPos];
    pushToBuffer(stn);
    renderRingSlots();
    document.getElementById('sStn').textContent = `${trainPos+1}/${stations.length}`;
    renderStationPanel(stn);
    draw();
    if(mode === 'agentic' && !stn.honey && !stn.honeyLoading) synthesizeHoney(stn);
}

// ══════════════════════════════
// POLLEN EXTRACTOR — for ring buffer
// ══════════════════════════════
function extractPollen(w) {
    let p = `CELL: ${w.name.replace(/([A-Z])/g,' $1').trim()}\nUID: ${w.uid} | SOURCE: ${w.source} | GENRE: ${w.genre}\nASSEMBLY INDEX: ${w.ai} (${w.ai>ASSEMBLY_THRESHOLD?'ALIVE':'ABIOTIC'})\nDESCRIPTION: ${w.description}\n`;
    if(w.entities.length) p+=`ENTITIES: ${w.entities.map(e=>e.name+' ['+e.type+']').join(', ')}\n`;
    if(w.relations.length) p+=`RELATIONS: ${w.relations.map(r=>r.from+' → '+r.verb+' → '+r.to).join(' | ')}\n`;
    if(w.events.length) p+=`EVENTS: ${w.events.map(e=>'⚡'+e.name).join(', ')}\n`;
    return p;
}

function buildRingContext() {
    if(!ringBuffer.length) return '';
    let ctx = 'RING BUFFER — current context window (oldest → newest):\n\n';
    ringBuffer.forEach((entry,i) => {
        ctx += `[SLOT ${i}] ` + extractPollen(entry.world) + '\n';
    });
    ctx += `---\nThe buffer holds ${ringBuffer.length}/${RING_SIZE} worlds. Analyze the full buffer as a rolling sequence. What threads persist? What was just loaded? What is about to be evicted?\n`;
    return ctx;
}

// ══════════════════════════════
// HONEY SYNTHESIS
// ══════════════════════════════
async function synthesizeHoney(stn) {
    const now = Date.now();
    if(now - lastApiCall < 3000) return;
    lastApiCall = now;
    const key = document.getElementById('opKey').value.trim();
    const base = document.getElementById('opBase').value.trim();
    const model = document.getElementById('opModel').value.trim();
    const prompt = document.getElementById('opPrompt').value.trim();
    if(!key||!prompt){stn.honey='⚠ Configure API key and operator prompt.';renderStationPanel(stn);return;}
    stn.honeyLoading = true;
    renderStationPanel(stn);
    const ringCtx = buildRingContext();
    try {
        const resp = await fetch(`${base}/chat/completions`, {
            method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
            body:JSON.stringify({model,messages:[{role:'system',content:prompt},{role:'user',content:ringCtx}],max_tokens:512,temperature:0.7})
        });
        const data = await resp.json();
        if(data.error) throw new Error(data.error.message||'API error');
        stn.honey = data.choices[0].message.content;
        stn.honeyLoading = false;
        honeyCount++;
        document.getElementById('sHon').textContent = honeyCount;
    } catch(err) {
        stn.honey = `⚠ ${err.message}`;
        stn.honeyLoading = false;
    }
    renderStationPanel(stn);
    draw();
}

// ══════════════════════════════
// STATION PANEL RENDERER
// ══════════════════════════════
function renderStationPanel(stn) {
    const body = document.getElementById('panelBody');
    const w = stn.world, alive = stn.ai > ASSEMBLY_THRESHOLD;
    const dn = w.name.replace(/([A-Z])/g,' $1').trim();
    let h = '';
    // AI score
    h += `<div class="sc-ai"><div class="sc-ai-num ${alive?'alive':'abiotic'}">${stn.ai}</div><div class="sc-ai-label ${alive?'alive':'abiotic'}">${alive?'● ALIVE':'○ ABIOTIC'}</div></div>`;
    // Card
    h += `<div class="scard"><div class="sc-name">${esc(dn)}</div><div class="sc-meta">${w.uid} · ${w.source} · ch ${w.source.replace('.md','')}</div><div class="sc-genre">${esc(w.genre)}</div><p class="sc-desc">${esc(w.description)}</p></div>`;
    // Entities
    if(w.entities.length){h+=`<div class="sec-hd">Entities (${w.entities.length})</div>`;w.entities.forEach(e=>{h+=`<div class="ent"><span class="ent-icon">▸</span><span class="ent-name">${esc(e.name)}</span><span class="ent-type">${esc(e.type)}</span></div>`;});}
    // Relations
    if(w.relations.length){h+=`<div class="sec-hd">Relations (${w.relations.length})</div>`;w.relations.forEach(r=>{h+=`<div class="rel"><span class="rel-from">${esc(r.from)}</span> <span class="rel-verb">${esc(r.verb)}</span> <span class="rel-to">${esc(r.to)}</span></div>`;});}
    // Events
    if(w.events.length){h+=`<div class="sec-hd">Events (${w.events.length})</div>`;w.events.forEach(ev=>{h+=`<div class="evt"><span class="evt-name">⚡ ${esc(ev.name)}</span> <span class="evt-detail">${ev.actors.length?ev.actors.join(', '):''}</span></div>`;});}
    // Honey
    if(mode==='agentic'){
        h+=`<div class="honey-block"><div class="honey-hd">Honey — Ring Buffer Synthesis</div>`;
        if(stn.honeyLoading) h+=`<div class="honey-loading">Train is processing buffer</div>`;
        else if(stn.honey) h+=`<div class="honey-text">${esc(stn.honey)}</div>`;
        else h+=`<div class="honey-loading" style="animation:none;color:var(--ink3)">Awaiting synthesis...</div>`;
        h+=`</div>`;
    }
    body.innerHTML = h;
    body.scrollTop = 0;
}

function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';}

// ══════════════════════════════
// CONFIG / MODE
// ══════════════════════════════
function setMode(m){mode=m;document.getElementById('modeManual').classList.toggle('on',m==='manual');document.getElementById('modeAgentic').classList.toggle('on',m==='agentic');if(stations[trainPos])renderStationPanel(stations[trainPos]);}
function toggleOp(){const c=document.getElementById('opConfig'),a=document.getElementById('opArrow');c.classList.toggle('collapsed');c.classList.toggle('expanded');a.textContent=c.classList.contains('collapsed')?'▸':'▾';}
function applyTpl(){const t=document.getElementById('opTemplate').value;if(TEMPLATES[t])document.getElementById('opPrompt').value=TEMPLATES[t];}
function setupDivider(){const div=document.getElementById('divider'),p=document.getElementById('panel');div.addEventListener('mousedown',e=>{e.preventDefault();const sx=e.clientX,sw=p.offsetWidth;const mv=ev=>{p.style.width=Math.max(240,Math.min(700,sw-(ev.clientX-sx)))+'px';resize();};const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});}

// Keyboard
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();trainStep(1);}if(e.key==='ArrowLeft'){e.preventDefault();trainStep(-1);}if(e.key===' '){e.preventDefault();togglePlay();}});

init();
