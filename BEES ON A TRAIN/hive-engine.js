// ══════════════════════════════
// HIVE ENGINE — Agentic Apiary
// ══════════════════════════════

let worlds = [], routes = [], worldByUid = {};
let canvas, ctx, VW, VH;
let camX = 0, camY = 0, camZ = 0.55;
let hexCells = [], selectedCell = null, hoveredCell = null, hoverTimer = null;
let lastHoverTimes = [];
let readingPath = [], flightLog = [], readCount = 0;
let mode = 'manual'; // 'manual' | 'agentic'
let tokensUsed = 0, tokenBudget = 50000;
let lastApiCall = 0;

const HEX_R = 42, HEX_H = HEX_R * Math.sqrt(3), ASSEMBLY_THRESHOLD = 15;
const CHAPTER_NAMES = {'00.md':'Breach','01.md':'Beekeeper','02.md':'Surveillance','03.md':'Bullet Train','04.md':'Snowpiercer','05.md':'Honeyland','06.md':'Wings I','07.md':'Wings II','08.md':'Heist 1855','09.md':'Steam','10.md':'Lumière','11.md':'Bee Movie'};
const ACTOR_COLORS = {catastrophe:{h:0,s:65,l:50},espionage:{h:45,s:70,l:55},thriller:{h:280,s:55,l:55},cinematic:{h:210,s:60,l:55},cultural:{h:140,s:50,l:48},geopolitical:{h:180,s:55,l:48}};
function actorHSL(a,o=1){const c=ACTOR_COLORS[a]||{h:0,s:0,l:50};return `hsla(${c.h},${c.s}%,${c.l}%,${o})`}

const TEMPLATES = {
    director: "You are a documentary filmmaker analyzing POML world data. For each world, describe the cinematic potential — what would this scene look like on screen? What films does it echo? What is the emotional temperature? Keep responses under 150 words.",
    forensic: "You are a forensic analyst examining POML world data. Extract every causal chain — who did what to whom and why? What evidence is missing? What connections link to other worlds? Keep responses under 150 words.",
    cartographer: "You are a cartographer mapping POML world data. Where is this world located — real and imagined? What terrain does it inhabit? How does geography shape the narrative? Keep responses under 150 words.",
    beekeeper: "You are Hatidze — the last beekeeper. Examine this POML world. What is alive here? What is dying? What must not be taken? What is the honey and what is the wax? Keep responses under 150 words.",
    dialectician: "You are a dialectician analyzing POML world data. What contradictions exist within this world? What thesis meets what antithesis? Where is the synthesis hiding? Keep responses under 150 words.",
    custom: ""
};

function assemblyIndex(w) { return (w.entities.length*2)+(w.relations.length*3)+(w.events.length*4)+w.states.length; }

// ══════════════════════════════
// INIT
// ══════════════════════════════
function init() {
    canvas = document.getElementById('hive');
    ctx = canvas.getContext('2d');
    worlds = RouteEngine.parseAll(WORLDS_DATA);
    routes = RouteEngine.computeRoutes(worlds);
    worlds.forEach(w => { worldByUid[w.uid] = w; w.ai = assemblyIndex(w); w.actor = RouteEngine.getActorType(w.genre); });
    document.getElementById('sCells').textContent = worlds.length;
    loadConfig();
    layoutHexGrid();
    buildQueenStrip();
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('wheel', onWheel, {passive:false});
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', resize);
    resize();
    setupDivider();
}

function loadConfig() {
    const k = localStorage.getItem('hive_api_key'); if(k) document.getElementById('opKey').value = k;
    const m = localStorage.getItem('hive_model'); if(m) document.getElementById('opModel').value = m;
    const b = localStorage.getItem('hive_base'); if(b) document.getElementById('opBase').value = b;
    const bud = localStorage.getItem('hive_budget'); if(bud) { document.getElementById('opBudget').value = bud; tokenBudget = parseInt(bud); }
    updateJar();
}
function saveConfig() {
    localStorage.setItem('hive_api_key', document.getElementById('opKey').value);
    localStorage.setItem('hive_model', document.getElementById('opModel').value);
    localStorage.setItem('hive_base', document.getElementById('opBase').value);
    localStorage.setItem('hive_budget', document.getElementById('opBudget').value);
    tokenBudget = parseInt(document.getElementById('opBudget').value) || 50000;
    updateJar();
}

// ══════════════════════════════
// HEX LAYOUT
// ══════════════════════════════
function layoutHexGrid() {
    hexCells = [];
    const sources = {};
    worlds.forEach((w,i) => { if(!sources[w.source]) sources[w.source]=[]; sources[w.source].push({world:w,globalIdx:i}); });
    const srcKeys = Object.keys(sources), chCols=4, spacing=HEX_R*14;
    srcKeys.forEach((src,ci) => {
        const cx=(ci%chCols)*spacing+spacing/2, cy=Math.floor(ci/chCols)*spacing+spacing/2;
        const cluster=sources[src], positions=hexSpiral(cluster.length);
        cluster.forEach((entry,wi) => {
            const p=positions[wi];
            hexCells.push({x:cx+p.x,y:cy+p.y,world:entry.world,globalIdx:entry.globalIdx,ai:entry.world.ai,actor:entry.world.actor,source:src,honey:null,honeyLoading:false});
        });
    });
}

function hexSpiral(count) {
    const pos=[{x:0,y:0}]; if(count<=1) return pos;
    const dirs=[{x:HEX_R*1.5,y:-HEX_H/2},{x:0,y:-HEX_H},{x:-HEX_R*1.5,y:-HEX_H/2},{x:-HEX_R*1.5,y:HEX_H/2},{x:0,y:HEX_H},{x:HEX_R*1.5,y:HEX_H/2}];
    let cx=0,cy=0,ring=1;
    while(pos.length<count){
        cx+=HEX_R*1.5; cy+=HEX_H/2;
        for(let d=0;d<6&&pos.length<count;d++){
            const steps=d===0?ring-1:ring;
            for(let s=0;s<steps&&pos.length<count;s++){
                pos.push({x:cx,y:cy}); cx+=dirs[(d+2)%6].x; cy+=dirs[(d+2)%6].y;
            }
        }
        ring++;
    }
    return pos;
}

// ══════════════════════════════
// DRAWING
// ══════════════════════════════
function draw() {
    if(!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(camX,camY); ctx.scale(camZ,camZ);
    const maxAI=Math.max(...hexCells.map(c=>c.ai),1);
    hexCells.forEach(cell => {
        const isSel=selectedCell===cell, isHov=hoveredCell===cell;
        const alive=cell.ai>ASSEMBLY_THRESHOLD, hasHoney=!!cell.honey;
        const r=HEX_R+(isHov?4:0)+(isSel?6:0);
        ctx.beginPath();
        for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;const px=cell.x+r*Math.cos(a),py=cell.y+r*Math.sin(a);i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
        ctx.closePath();
        const density=Math.min(1,cell.ai/maxAI);
        const alpha=0.06+density*0.22+(isSel?.15:0)+(isHov?.08:0);
        ctx.fillStyle=alive?actorHSL(cell.actor,alpha):`rgba(58,62,72,${alpha})`;
        ctx.fill();
        ctx.strokeStyle=isSel?actorHSL(cell.actor,.7):(isHov?actorHSL(cell.actor,.4):`rgba(140,180,210,${alive?.08:.04})`);
        ctx.lineWidth=isSel?2:(isHov?1.5:.5); ctx.stroke();
        // Honey indicator
        if(hasHoney){ctx.beginPath();ctx.arc(cell.x+r*.6,cell.y-r*.5,4,0,Math.PI*2);ctx.fillStyle='rgba(232,168,50,0.7)';ctx.fill();}
        // Center dot
        ctx.beginPath();ctx.arc(cell.x,cell.y-2,isSel?5:3,0,Math.PI*2);
        ctx.fillStyle=alive?actorHSL(cell.actor,isSel?.9:.5):`rgba(58,62,72,.4)`;ctx.fill();
        // Label
        if(isSel||isHov||camZ>.55){
            const fs=Math.max(7,Math.min(11,9/camZ));
            ctx.font=`600 ${fs}px 'IBM Plex Mono',monospace`;ctx.textAlign='center';ctx.textBaseline='top';
            const name=cell.world.name.replace(/([A-Z])/g,' $1').trim();
            ctx.fillStyle=isSel?actorHSL(cell.actor,1):(isHov?'rgba(192,216,232,.8)':'rgba(192,216,232,.4)');
            ctx.fillText(name.length>16?name.slice(0,14)+'…':name,cell.x,cell.y+8);
        }
        if(isSel){ctx.save();ctx.beginPath();ctx.arc(cell.x,cell.y,r+16,0,Math.PI*2);const g=ctx.createRadialGradient(cell.x,cell.y,r*.5,cell.x,cell.y,r+16);g.addColorStop(0,actorHSL(cell.actor,.2));g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fill();ctx.restore();}
    });
    if(selectedCell){const uid=selectedCell.world.uid;routes.filter(r=>r.from===uid||r.to===uid).forEach(r=>{const f=hexCells.find(c=>c.world.uid===r.from),t=hexCells.find(c=>c.world.uid===r.to);if(f&&t){ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(t.x,t.y);ctx.strokeStyle='rgba(212,168,75,.08)';ctx.lineWidth=.5;ctx.stroke();}});}
    ctx.restore();
}

function resize(){const vp=document.getElementById('hiveWrap');VW=vp.clientWidth;VH=vp.clientHeight;canvas.width=VW*devicePixelRatio;canvas.height=VH*devicePixelRatio;canvas.style.width=VW+'px';canvas.style.height=VH+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);draw();}

// ══════════════════════════════
// INTERACTION
// ══════════════════════════════
function hitTest(mx,my){const wx=(mx-camX)/camZ,wy=(my-camY)/camZ;let cl=null,cd=Infinity;hexCells.forEach(c=>{const d=Math.hypot(c.x-wx,c.y-wy);if(d<HEX_R+6&&d<cd){cl=c;cd=d;}});return cl;}
function onMouseMove(e){const r=canvas.getBoundingClientRect();const cell=hitTest(e.clientX-r.left,e.clientY-r.top);if(cell!==hoveredCell){hoveredCell=cell;clearTimeout(hoverTimer);if(cell){lastHoverTimes.push(Date.now());if(lastHoverTimes.length>8)lastHoverTimes.shift();checkAgitation();hoverTimer=setTimeout(()=>{if(hoveredCell===cell)selectCell(cell);},800);}draw();}}
function onCanvasClick(e){const r=canvas.getBoundingClientRect();const cell=hitTest(e.clientX-r.left,e.clientY-r.top);if(cell)selectCell(cell);}
function checkAgitation(){if(lastHoverTimes.length<6)return;if(lastHoverTimes[lastHoverTimes.length-1]-lastHoverTimes[0]<1500){document.getElementById('hiveWrap').classList.add('agitated');setTimeout(()=>document.getElementById('hiveWrap').classList.remove('agitated'),500);}}
function onWheel(e){e.preventDefault();const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;const dz=e.deltaY>0?.9:1.1,nz=Math.max(.1,Math.min(2.5,camZ*dz));camX=mx-(mx-camX)*(nz/camZ);camY=my-(my-camY)*(nz/camZ);camZ=nz;draw();}
let dragging=false,dragX,dragY;
function onMouseDown(e){dragging=true;dragX=e.clientX;dragY=e.clientY;const mv=ev=>{camX+=ev.clientX-dragX;camY+=ev.clientY-dragY;dragX=ev.clientX;dragY=ev.clientY;draw();};const up=()=>{dragging=false;document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}

// ══════════════════════════════
// POLLEN EXTRACTOR
// ══════════════════════════════
function extractPollen(w) {
    let pollen = `CELL: ${w.name.replace(/([A-Z])/g,' $1').trim()}\nUID: ${w.uid} | SOURCE: ${w.source} | GENRE: ${w.genre}\nASSEMBLY INDEX: ${w.ai} (${w.ai>ASSEMBLY_THRESHOLD?'ALIVE':'ABIOTIC'})\n\nDESCRIPTION: ${w.description}\n`;
    if(w.entities.length) pollen+=`\nENTITIES:\n${w.entities.map(e=>`  - ${e.name} [${e.type}]${e.traits.length?' ('+e.traits.join(', ')+')':''}`).join('\n')}\n`;
    if(w.relations.length) pollen+=`\nRELATIONS:\n${w.relations.map(r=>`  - ${r.from} → ${r.verb} → ${r.to}`).join('\n')}\n`;
    if(w.states.length) pollen+=`\nSTATES:\n${w.states.map(s=>`  - ${s.target}.${s.key} = ${s.value}`).join('\n')}\n`;
    if(w.events.length) pollen+=`\nEVENTS:\n${w.events.map(ev=>`  - ⚡ ${ev.name}${ev.actors.length?' (actors: '+ev.actors.join(', ')+')':''}${ev.effects.length?' → effects: '+ev.effects.join(', '):''}`).join('\n')}\n`;
    return pollen;
}

// ══════════════════════════════
// HONEY SYNTHESIS + BIOGRAPHIC MEMORY STREAM
// ══════════════════════════════

// Build memory stream from flight log — last N entries as accumulated context
function buildMemoryStream(maxEntries = 5) {
    if (!flightLog.length) return '';
    const recent = flightLog.slice(-maxEntries);
    let stream = '\n\nMEMORY STREAM — previous cells visited this session:\n';
    recent.forEach((entry, i) => {
        stream += `\n[${i+1}] ${entry.name} (AI:${entry.ai})\n`;
        stream += `    Honey: ${entry.honey.slice(0, 200)}${entry.honey.length > 200 ? '…' : ''}\n`;
    });
    stream += '\n---\nUse the memory stream to build on previous observations. Draw connections. Identify emerging threads. Each cell is a new context window but your accumulated memory persists.\n';
    return stream;
}

// Build delegation chain header — provenance trace for this operation
function buildDelegationChain(cell) {
    const op = document.getElementById('opTemplate').selectedOptions[0].text;
    return `DELEGATION CHAIN: Beekeeper → ${op} → Cell ${cell.world.uid}\n` +
           `SESSION: ${readCount} cells visited | ${tokensUsed} tokens consumed | ${flightLog.length} honey produced\n` +
           `TRUST SCORE: Assembly Index ${cell.ai} (${cell.ai > ASSEMBLY_THRESHOLD ? 'ALIVE — high trust' : 'ABIOTIC — low trust'})\n---\n`;
}

async function synthesizeHoney(cell) {
    const now = Date.now();
    if(now - lastApiCall < 3000) return; // ATC rate limit — 3s minimum
    lastApiCall = now;
    const key = document.getElementById('opKey').value.trim();
    const base = document.getElementById('opBase').value.trim();
    const model = document.getElementById('opModel').value.trim();
    const prompt = document.getElementById('opPrompt').value.trim();
    if(!key||!prompt) { cell.honey='⚠ Configure API key and operator prompt above.'; renderBrood(cell.world,cell); return; }
    if(tokensUsed >= tokenBudget) { cell.honey='⚠ Token budget exhausted. Hive at capacity.'; renderBrood(cell.world,cell); return; }
    cell.honeyLoading = true;
    renderBrood(cell.world, cell);

    // Compose the full context: delegation chain + pollen + memory stream
    const delegation = buildDelegationChain(cell);
    const pollen = extractPollen(cell.world);
    const memory = buildMemoryStream(5);
    const fullContext = delegation + pollen + memory;

    try {
        const resp = await fetch(`${base}/chat/completions`, {
            method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
            body: JSON.stringify({model, messages:[
                {role:'system', content:prompt},
                {role:'user', content:fullContext}
            ], max_tokens:512, temperature:0.7})
        });
        const data = await resp.json();
        if(data.error) throw new Error(data.error.message||'API error');
        const usage = data.usage || {};
        tokensUsed += (usage.total_tokens||0);
        updateJar();
        cell.honey = data.choices[0].message.content;
        cell.honeyLoading = false;
        flightLog.push({uid:cell.world.uid, name:cell.world.name.replace(/([A-Z])/g,' $1').trim(), ai:cell.ai, honey:cell.honey, tokens:usage.total_tokens||0, time:new Date().toISOString()});
    } catch(err) {
        cell.honey = `⚠ ${err.message}`;
        cell.honeyLoading = false;
    }
    renderBrood(cell.world, cell);
    draw();
}

// ══════════════════════════════
// SELECT CELL
// ══════════════════════════════
function selectCell(cell) {
    selectedCell = cell;
    const w = cell.world;
    if(!readingPath.length || readingPath[readingPath.length-1].uid!==w.uid){
        readingPath.push({uid:w.uid,ai:cell.ai,actor:cell.actor,source:w.source,name:w.name,choice:null});
        readCount++;document.getElementById('sRead').textContent=readCount;
    }
    document.getElementById('sScene').textContent=`${cell.globalIdx+1}/${worlds.length}`;
    renderBrood(w, cell);
    panTo(cell);
    draw();
    if(mode==='agentic' && !cell.honey && !cell.honeyLoading) synthesizeHoney(cell);
}

function panTo(cell){const eX=VW/2-cell.x*camZ,eY=VH/2-cell.y*camZ,sX=camX,sY=camY,dur=500,t0=performance.now();function a(n){const t=Math.min(1,(n-t0)/dur),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;camX=sX+(eX-sX)*e;camY=sY+(eY-sY)*e;draw();if(t<1)requestAnimationFrame(a);}requestAnimationFrame(a);}
function navigateTo(uid,choiceType){const cell=hexCells.find(c=>c.world.uid===uid);if(!cell)return;if(readingPath.length>0)readingPath[readingPath.length-1].choice=choiceType;selectCell(cell);}

// ══════════════════════════════
// BROOD CHAMBER RENDERER
// ══════════════════════════════
function renderBrood(w, cell) {
    const body=document.getElementById('broodBody');
    const alive=cell.ai>ASSEMBLY_THRESHOLD, maxAI=Math.max(...worlds.map(x=>x.ai),1);
    const dn=w.name.replace(/([A-Z])/g,' $1').trim();
    let h='';
    // Assembly Index
    h+=`<div class="ai-block"><div class="ai-score ${alive?'alive':'abiotic'}">${cell.ai}</div><div class="ai-meta"><div class="ai-label ${alive?'alive':'abiotic'}">${alive?'● ALIVE — causal depth detected':'○ ABIOTIC — below threshold'}</div><div class="ai-bar"><div class="ai-fill" style="width:${(cell.ai/maxAI*100).toFixed(1)}%;background:${alive?'var(--alive)':'var(--abiotic)'}"></div></div></div></div>`;
    // World Card
    h+=`<div class="wcard"><div class="wc-name">${esc(dn)}</div><div class="wc-uid">${w.uid} · ${w.source}</div><div class="wc-genre">${esc(w.genre)}</div><p class="wc-desc">${esc(w.description)}</p></div>`;
    // Entities
    if(w.entities.length){h+=`<div class="sec-hd">Entities (×2 = ${w.entities.length*2})</div><div class="ent-list">${w.entities.map(e=>`<div class="ent"><span class="ent-icon">▸</span><span class="ent-name">${esc(e.name)}</span><span class="ent-type">${esc(e.type)}</span></div>`).join('')}</div>`;}
    // Relations
    if(w.relations.length){h+=`<div class="sec-hd">Relations (×3 = ${w.relations.length*3})</div><div class="rel-list">${w.relations.map(r=>`<div class="rel"><span class="rel-from">${esc(r.from)}</span><span class="rel-arrow">→</span><span class="rel-verb">${esc(r.verb)}</span><span class="rel-arrow">→</span><span class="rel-to">${esc(r.to)}</span></div>`).join('')}</div>`;}
    // States
    if(w.states.length){h+=`<div class="sec-hd">State (×1 = ${w.states.length})</div><div class="state-list">${w.states.map(s=>`<div class="state-row"><span class="state-key">${esc(s.target)}.${esc(s.key)}</span><span class="state-val">${esc(s.value)}</span></div>`).join('')}</div>`;}
    // Events
    if(w.events.length){h+=`<div class="sec-hd">Events (×4 = ${w.events.length*4})</div><div class="event-list">${w.events.map(ev=>`<div class="evt"><div class="evt-name">⚡ ${esc(ev.name)}</div><div class="evt-detail">${ev.actors.length?'actors: '+ev.actors.map(esc).join(', ')+'<br>':''}${ev.effects.length?'effects: '+ev.effects.map(esc).join(', '):''}</div></div>`).join('')}</div>`;}
    // Balance
    const shared=countShared(w),total=w.entities.length,pct=total>0?Math.round(shared/total*100):0;
    h+=`<div class="balance"><div class="balance-hd">Half for me, half for them — ${pct}% shared</div><div class="balance-bar"><div class="balance-used" style="width:${pct}%"></div><div class="balance-reserved" style="width:${100-pct}%"></div></div></div>`;
    // Honey
    if(mode==='agentic'){
        h+=`<div class="honey-block"><div class="honey-hd">Honey — synthesized by ${document.getElementById('opTemplate').selectedOptions[0].text}</div>`;
        if(cell.honeyLoading) h+=`<div class="honey-loading">Bee is foraging</div>`;
        else if(cell.honey) h+=`<div class="honey-text">${esc(cell.honey)}</div>`;
        else h+=`<div class="honey-loading" style="animation:none;color:var(--ink3)">Awaiting bee visit...</div>`;
        h+=`</div>`;
    }
    // Waggle Dance
    const dances=computeWaggle(w);
    if(dances.length){h+=`<div class="waggle"><div class="waggle-hd">Waggle Dance — where next?</div>${dances.map(d=>`<button class="wdance" onclick="navigateTo('${d.uid}','${d.type}')"><span>${esc(d.name)}</span><span class="wd-reason">${d.reason}</span></button>`).join('')}</div>`;}
    body.innerHTML=h; body.scrollTop=0;
}

function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';}
function countShared(w){const my=new Set(w.entities.map(e=>e.name.toLowerCase()));let s=0;my.forEach(n=>{if(worlds.some(ow=>ow.uid!==w.uid&&ow.entities.some(e=>e.name.toLowerCase()===n)))s++;});return s;}

// ══════════════════════════════
// WAGGLE DANCE
// ══════════════════════════════
function computeWaggle(w) {
    const dances=[], visited=new Set(readingPath.map(p=>p.uid));
    // Causal
    const cr=routes.filter(r=>r.from===w.uid||r.to===w.uid).sort((a,b)=>b.weight-a.weight);
    for(const r of cr){const tid=r.from===w.uid?r.to:r.from;const tw=worldByUid[tid];if(tw){dances.push({uid:tid,name:tw.name.replace(/([A-Z])/g,' $1').trim(),type:'causal',reason:r.type.replace(/_/g,' ')});break;}}
    // Sequential
    const gi=worlds.findIndex(x=>x.uid===w.uid);
    if(gi>=0){for(let i=gi+1;i<worlds.length;i++){if(worlds[i].source===w.source){dances.push({uid:worlds[i].uid,name:worlds[i].name.replace(/([A-Z])/g,' $1').trim(),type:'sequential',reason:'next scene'});break;}}
    if(dances.length<2){for(let i=gi+1;i<worlds.length;i++){if(worlds[i].source!==w.source){dances.push({uid:worlds[i].uid,name:worlds[i].name.replace(/([A-Z])/g,' $1').trim(),type:'sequential',reason:'next chapter'});break;}}}}
    // Contrastive
    const myEnts=new Set(w.entities.map(e=>e.name.toLowerCase())),myActor=w.actor;
    let best=null,bs=-1;
    worlds.forEach(ow=>{if(ow.uid===w.uid)return;const oa=ow.actor;if(oa===myActor)return;const ol=ow.entities.filter(e=>myEnts.has(e.name.toLowerCase())).length;const sc=ol*10+(oa!==myActor?5:0)+Math.abs(ow.ai-w.ai);if(sc>bs){bs=sc;best=ow;}});
    if(best)dances.push({uid:best.uid,name:best.name.replace(/([A-Z])/g,' $1').trim(),type:'contrastive',reason:'dialectic'});
    return dances.slice(0,3);
}

// ══════════════════════════════
// QUEEN STRIP
// ══════════════════════════════
function buildQueenStrip() {
    const strip=document.getElementById('queenStrip'),sources={};
    worlds.forEach((w,i)=>{if(!sources[w.source])sources[w.source]={start:i,count:0,totalAI:0};sources[w.source].count++;sources[w.source].totalAI+=w.ai;});
    const maxAvg=Math.max(...Object.values(sources).map(s=>s.totalAI/s.count),1);
    Object.keys(sources).forEach(src=>{
        const s=sources[src],avg=(s.totalAI/s.count).toFixed(0),pct=((s.totalAI/s.count)/maxAvg*100).toFixed(0),alive=avg>ASSEMBLY_THRESHOLD;
        const d=document.createElement('div');d.className='qcell';d.dataset.source=src;
        d.innerHTML=`<div class="qcell-num">${src.replace('.md','')}</div><div class="qcell-name">${CHAPTER_NAMES[src]||src}</div><div class="qcell-bar"><div class="qcell-fill" style="width:${pct}%;background:${alive?'var(--alive)':'var(--abiotic)'}"></div></div>`;
        d.onclick=()=>{const c=hexCells.find(c=>c.source===src);if(c)selectCell(c);document.querySelectorAll('.qcell').forEach(q=>q.classList.remove('on'));d.classList.add('on');};
        strip.appendChild(d);
    });
}

// ══════════════════════════════
// MODE / CONFIG
// ══════════════════════════════
function setMode(m){mode=m;document.getElementById('modeManual').classList.toggle('on',m==='manual');document.getElementById('modeAgentic').classList.toggle('on',m==='agentic');if(selectedCell)renderBrood(selectedCell.world,selectedCell);}
function toggleOp(){const c=document.getElementById('opConfig'),a=document.getElementById('opArrow');c.classList.toggle('collapsed');c.classList.toggle('expanded');a.textContent=c.classList.contains('collapsed')?'▸':'▾';}
function applyTemplate(){const t=document.getElementById('opTemplate').value;if(TEMPLATES[t])document.getElementById('opPrompt').value=TEMPLATES[t];}
function updateJar(){const pct=Math.max(0,Math.min(100,(1-tokensUsed/tokenBudget)*100));document.getElementById('jarFill').style.width=pct+'%';document.getElementById('jarText').textContent=`${Math.round((tokenBudget-tokensUsed)/1000)}k`;}
function setupDivider(){const div=document.getElementById('divider'),br=document.getElementById('brood');div.addEventListener('mousedown',e=>{e.preventDefault();const sx=e.clientX,sw=br.offsetWidth;const mv=ev=>{br.style.width=Math.max(240,Math.min(700,sw-(ev.clientX-sx)))+'px';resize();};const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});}

// ══════════════════════════════
// READING GENOME
// ══════════════════════════════
function showGenome(){document.getElementById('genomeOverlay').classList.add('show');document.getElementById('genomeYaml').textContent=generateGenome();}
function hideGenome(){document.getElementById('genomeOverlay').classList.remove('show');}

function generateGenome() {
    if(readingPath.length<3) return 'Navigate at least 3 worlds to generate your reading genome.';
    const chapters=[...new Set(readingPath.map(p=>p.source))];
    const choices=readingPath.filter(p=>p.choice);
    const cN=choices.filter(c=>c.choice==='causal').length,sN=choices.filter(c=>c.choice==='sequential').length,xN=choices.filter(c=>c.choice==='contrastive').length;
    const tot=cN+sN+xN||1;
    const avgAI=(readingPath.reduce((s,p)=>s+p.ai,0)/readingPath.length).toFixed(1);
    const maxAI=Math.max(...readingPath.map(p=>p.ai)),minAI=Math.min(...readingPath.map(p=>p.ai));
    const maxW=readingPath.find(p=>p.ai===maxAI),minW=readingPath.find(p=>p.ai===minAI);
    const op=document.getElementById('opTemplate').selectedOptions[0].text;
    const pathNames=readingPath.map(p=>p.name.replace(/([A-Z])/g,' $1').trim());

    let yaml=`# YOUR READING GENOME
operator: "${op}"
mode: "${mode}"
total_scenes_read: ${readingPath.length}
chapters_visited: [${chapters.map(c=>c.replace('.md','')).join(', ')}]
tokens_consumed: ${tokensUsed}

interpretive_bias:
  causal_follows: ${(cN/tot*100).toFixed(0)}%
  sequential_follows: ${(sN/tot*100).toFixed(0)}%
  contrastive_follows: ${(xN/tot*100).toFixed(0)}%

assembly_exposure:
  avg_index: ${avgAI}
  max_index: ${maxAI}  # ${maxW?maxW.name.replace(/([A-Z])/g,' $1').trim():'—'}
  min_index: ${minAI}  # ${minW?minW.name.replace(/([A-Z])/g,' $1').trim():'—'}

flight_path:
${pathNames.map((n,i)=>`  ${i+1}. ${n}${readingPath[i].choice?' ['+readingPath[i].choice+']':''}`).join('\n')}`;

    if(flightLog.length){
        yaml+=`\n\nhoney_archive:`;
        flightLog.forEach(l=>{yaml+=`\n  - cell: "${l.name}"\n    ai: ${l.ai}\n    tokens: ${l.tokens}\n    honey: "${l.honey.slice(0,120).replace(/"/g,"'")}${l.honey.length>120?'…':''}"`;});
    }
    return yaml;
}

document.addEventListener('keydown',e=>{if(!selectedCell)return;const g=selectedCell.globalIdx;if(e.key==='ArrowRight'&&g<worlds.length-1){e.preventDefault();selectCell(hexCells.find(c=>c.globalIdx===g+1));}if(e.key==='ArrowLeft'&&g>0){e.preventDefault();selectCell(hexCells.find(c=>c.globalIdx===g-1));}});

init();
