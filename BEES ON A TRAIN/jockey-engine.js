// ══════════════════════════════════════════════════════════════
// JOCKEY ENGINE v2 — Pheromone Chat Lattice
//
// THE PARADIGM: Chat IS Foraging
//   Your words = POLLEN (gold, user input)
//   LLM response = HONEY (teal, synthesized nectar)
//   228 hex cells = CONTEXT WINDOWS showing POML world data
//   Pheromones = MEMORIES drifting across the lattice viewport
//   Traffic Light Cognition = gradient between goals & obstacles
//   Ripples = causal propagation of your intent
//
// Memory-Reflection-Planning Architecture (Stanford Generative Agents)
// ══════════════════════════════════════════════════════════════

let worlds = [], routes = [], worldByUid = {};
let canvas, ctx, dpr;
let hexCells = [];
let focusMode = false;
let audioCtx = null;

const HEX_R = 48;
const ASSEMBLY_THRESHOLD = 15;
const ACTOR_COLORS = {catastrophe:{h:0,s:65,l:50},espionage:{h:45,s:70,l:55},thriller:{h:280,s:55,l:55},cinematic:{h:210,s:60,l:55},cultural:{h:140,s:50,l:48},geopolitical:{h:180,s:55,l:48}};
function actorHSL(a,o=1){const c=ACTOR_COLORS[a]||{h:160,s:50,l:50};return `hsla(${c.h},${c.s}%,${c.l}%,${o})`}
function assemblyIndex(w){return(w.entities.length*2)+(w.relations.length*3)+(w.events.length*4)+w.states.length}

// ──────────────────────────────
// BEE STATE — the persistent identity
// ──────────────────────────────
const bee = {
    cellIdx: 0, pollen: [], pollenMax: 8,
    honey: [], energy: 100, steps: 0, visited: new Set(),
    persona: { name:'Worker Bee #7', trait:'curious forager drawn to causal depth', goal:'discover the latent film hidden in the hive' }
};

// ──────────────────────────────
// MEMORY STREAM — biographic database
// ──────────────────────────────
let memoryStream = [], memIdCounter = 0, unreflectedImp = 0;
const RECENCY_DECAY = 0.995, ACCESS_DECAY = 0.99, REFLECT_THRESHOLD = 25;

function createMemory(text, type='observation', importance=5) {
    memoryStream.push({ id:memIdCounter++, text, type, importance, step:bee.steps, lastAccessStep:bee.steps, cell:hexCells[bee.cellIdx]?hexCells[bee.cellIdx].world.name.replace(/([A-Z])/g,' $1').trim():'—' });
    if(type!=='reflection') { unreflectedImp += importance; if(unreflectedImp >= REFLECT_THRESHOLD) { triggerReflection(); unreflectedImp = 0; } }
    // Emit pheromone for every high-importance memory
    if(importance >= 6 && hexCells[bee.cellIdx]) {
        const c = hexCells[bee.cellIdx];
        emitPheromone(c._sx||c.x*0.5, c._sy||c.y*0.5, text.replace(/\[.*?\]\s*/,'').slice(0,40).toUpperCase().replace(/\s+/g,'_'));
    }
    updateUI();
}

function retrieveMemories(query, k=5) {
    if(!memoryStream.length) return [];
    const qw = new Set(query.toLowerCase().split(/\W+/).filter(w=>w.length>2));
    return memoryStream.map(m => {
        const mw = new Set(m.text.toLowerCase().split(/\W+/).filter(w=>w.length>2));
        let ov=0; qw.forEach(w=>{if(mw.has(w))ov++;});
        const rec = .6*Math.pow(RECENCY_DECAY,bee.steps-m.step)+.4*Math.pow(ACCESS_DECAY,bee.steps-(m.lastAccessStep||m.step));
        return {mem:m, score: rec + m.importance/10 + (qw.size?ov/qw.size:0)};
    }).sort((a,b)=>b.score-a.score).slice(0,k).map(r=>{r.mem.lastAccessStep=bee.steps;return r.mem;});
}

function triggerReflection() {
    const recent = memoryStream.filter(m=>m.type!=='reflection').slice(-8);
    if(recent.length<3) return;
    // Don't generate canned text — let the LLM produce the actual reflection
    // so display matches what was ingested
    llmReflect(recent);
}

async function llmReflect(recent) {
    const key=el('opKey').value.trim(); if(!key) return;
    const base=el('opBase').value.trim(), model=el('opModel').value.trim();
    const recentCompact = recent.slice(-6).map(m => `[${m.type}] ${m.text.slice(0,60)}`).join('\n');
    const p = `You are ${bee.persona.name}. Reflect on these actions. Output structured lines:
PATTERN: exact world names + entity names that connect these actions
SHIFT: what changed between first and last action
2 lines only. Name specific worlds and entities. Zero metaphors. Zero poetry.\n\n${recentCompact}`;
    try{
        const r=await fetch(`${base}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'user',content:p}],max_tokens:100,temperature:.4})});
        const d=await r.json();
        if(d.choices?.[0]){
            const t=d.choices[0].message.content;
            createMemory(`[REFLECTION] ${t}`,'reflection',8);
            addMsg('reflection',`🪞 ${t}`);
            tokenEstimate += estimateTokens(p) + estimateTokens(t);
            HiveLogger.logLLM({type:'reflect',model,prompt_tokens_est:estimateTokens(p),completion_tokens_est:estimateTokens(t)});
        }
    }catch(e){}
}

// ──────────────────────────────
// PHEROMONE SYSTEM — memories that drift
// ──────────────────────────────
const PHERO_POOL = [
    "NECTAR_PROVENANCE_LOCKED","HIVE_MIND_SYNC","AXIAL_DELEGATION_OK","SWARM_ONTOLOGY_VALID",
    "CONTEXT_WINDOW_OPEN","POLLEN_VECTOR_SET","IDENTITY_FLUID_LOCKED","LATENT_FLUX_DETECTED",
    "ROUTING_CAUSAL_MANIFOLD","ATC_CLEARANCE_GRANTED","REFRACTIVE_GROUNDING","COGNITIVE_TRAFFIC_SURGE",
    "VESSEL_TRAJECTORY_LOCKED","SYZYGY_ALIGNMENT_NOMINAL","INTENT_INJECTION_READY","DELEGATION_FLOW_OK"
];

let pheroTimer = null;
function startPheroEmitter() {
    pheroTimer = setInterval(()=>{
        if(Math.random()>.5) return;
        // Pick a random alive cell
        const alive = hexCells.filter(c=>c.ai>ASSEMBLY_THRESHOLD);
        if(!alive.length) return;
        const c = alive[Math.floor(Math.random()*alive.length)];
        // Emit world data as pheromone
        const texts = [
            c.world.name.replace(/([A-Z])/g,' $1').trim().toUpperCase().replace(/\s+/g,'_'),
            ...c.world.entities.slice(0,2).map(e=>e.name.toUpperCase().replace(/\s+/g,'_')),
            PHERO_POOL[Math.floor(Math.random()*PHERO_POOL.length)]
        ];
        emitPheromone(c._sx||200, c._sy||200, texts[Math.floor(Math.random()*texts.length)]);
    }, 3000);
}

function emitPheromone(x, y, text) {
    const layer = el('pheroLayer');
    const d = document.createElement('div');
    d.className = 'phero';
    d.textContent = text;
    d.style.left = Math.max(10,Math.min(x,layer.clientWidth-100)) + 'px';
    d.style.top = Math.max(20,Math.min(y,layer.clientHeight-30)) + 'px';
    d.style.fontSize = (9 + Math.random()*5) + 'px';
    d.style.letterSpacing = (.1 + Math.random()*.15) + 'em';
    if(focusMode) { d.style.color = 'rgba(15,118,110,.4)'; d.style.fontWeight = '900'; }
    else { d.style.color = `hsla(${150+Math.random()*30},${50+Math.random()*30}%,${55+Math.random()*20}%,.6)`; d.style.textShadow = `0 0 8px rgba(52,211,153,.4)`; }
    layer.appendChild(d);
    setTimeout(()=>d.remove(), 8500);
}

// ──────────────────────────────
// AUDIO — Mechanical Buzz
// ──────────────────────────────
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}

function playBuzz(type='amber',vol=.6){
    if(!audioCtx)return;const now=audioCtx.currentTime;
    const m=audioCtx.createGain();m.gain.setValueAtTime(0,now);m.gain.linearRampToValueAtTime(.15*vol,now+.04);m.gain.exponentialRampToValueAtTime(.0001,now+1.2);m.connect(audioCtx.destination);
    const d=audioCtx.createOscillator(),dg=audioCtx.createGain();d.type='sawtooth';d.frequency.value=type==='red'?45:type==='gold'?65:55;
    const lp=audioCtx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=180;lp.Q.value=12;
    dg.gain.setValueAtTime(.25,now);dg.gain.exponentialRampToValueAtTime(.01,now+.4);
    d.connect(lp);lp.connect(dg);dg.connect(m);d.start(now);d.stop(now+.45);
    const c2=audioCtx.createOscillator(),mod=audioCtx.createOscillator(),mg=audioCtx.createGain(),bg=audioCtx.createGain();
    c2.type='sine';mod.type='square';c2.frequency.value=type==='gold'?880:440;mod.frequency.value=120;
    mg.gain.value=350;bg.gain.setValueAtTime(.08,now);bg.gain.exponentialRampToValueAtTime(.001,now+.25);
    mod.connect(mg);mg.connect(c2.frequency);c2.connect(bg);bg.connect(m);c2.start(now);mod.start(now);c2.stop(now+.3);mod.stop(now+.3);
}

// ──────────────────────────────
// RIPPLE FX
// ──────────────────────────────
function spawnRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'ripple-fx';
    r.style.left = x+'px'; r.style.top = y+'px';
    el('rippleLayer').appendChild(r);
    setTimeout(()=>r.remove(), 1100);
}

// ──────────────────────────────
// PRODUCT OF EXPERTS
// ──────────────────────────────
const EXPERTS = [
    {name:'Energy',test:(a,s)=>s.energy>0,veto:'No energy.'},
    {name:'Cap',test:(a,s)=>!(a==='forage'&&s.pollen.length>=s.pollenMax),veto:'Sacs full.'},
    {name:'Alive',test:(a,s)=>!(a==='forage'&&s.currentAI<=ASSEMBLY_THRESHOLD),veto:'Abiotic cell.'},
    {name:'Pollen',test:(a,s)=>!(a==='synthesize'&&s.pollen.length===0),veto:'No pollen.'},
    {name:'Range',test:(a,s)=>!(a==='fly'&&s.energy<5),veto:'Low energy.'},
];

// ──────────────────────────────
// LATTICE LAYOUT & DRAW
// ──────────────────────────────
function layoutHex() {
    hexCells = [];
    const cols = Math.ceil(Math.sqrt(worlds.length * 1.35));
    worlds.forEach((w,i) => {
        const row = Math.floor(i/cols), col = i % cols;
        const off = (row%2) ? HEX_R*.87 : 0;
        hexCells.push({ x:col*HEX_R*1.76+off+HEX_R*1.5, y:row*(HEX_R*1.52)+HEX_R*1.5, world:w, idx:i, ai:w.ai,
            status:'idle', statusLife:0, nectarLevel:0, cognition:0, _sx:0, _sy:0 });
    });
}

let drawTime = 0;
function drawLoop(){ drawTime++; drawLattice(); requestAnimationFrame(drawLoop); }

function drawLattice() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const totalW = hexCells.length ? Math.max(...hexCells.map(c=>c.x))+HEX_R*2 : W;
    const totalH = hexCells.length ? Math.max(...hexCells.map(c=>c.y))+HEX_R*2 : H;
    const scale = Math.min(W/totalW, H/totalH) * .9;
    const offX = (W-totalW*scale)/2, offY = (H-totalH*scale)/2;
    ctx.save(); ctx.translate(offX, offY); ctx.scale(scale, scale);

    const isFocus = focusMode;

    hexCells.forEach((cell, i) => {
        const isBee = i === bee.cellIdx;
        const visited = bee.visited.has(i);
        const alive = cell.ai > ASSEMBLY_THRESHOLD;
        const r = HEX_R;

        // Hex shape
        ctx.beginPath();
        for(let k=0;k<6;k++){const a=Math.PI/3*k+Math.PI/6;ctx.lineTo(cell.x+r*Math.cos(a),cell.y+r*Math.sin(a));}
        ctx.closePath();

        // Fill — traffic light cognition gradient
        if(isBee) ctx.fillStyle = isFocus ? 'rgba(15,118,110,.08)' : 'rgba(52,211,153,.04)';
        else if(cell.cognition > 5) ctx.fillStyle = `rgba(52,211,153,${Math.min(.12, cell.cognition/100*.12)})`;
        else if(cell.cognition < -5) ctx.fillStyle = `rgba(239,68,68,${Math.min(.1, Math.abs(cell.cognition)/100*.1)})`;
        else if(cell.status==='goal') ctx.fillStyle = 'rgba(251,191,36,.06)';
        else if(cell.status==='obstacle') ctx.fillStyle = 'rgba(239,68,68,.05)';
        else ctx.fillStyle = 'transparent';
        ctx.fill();

        // Stroke
        let sc;
        if(isBee) sc = isFocus ? '#0f766e' : '#34d399';
        else if(cell.status==='goal') sc = '#fbbf24';
        else if(cell.status==='obstacle') sc = '#ef4444';
        else sc = isFocus ? 'rgba(15,118,110,.2)' : 'rgba(20,184,166,.08)';
        ctx.strokeStyle = sc;
        ctx.lineWidth = isBee ? 2.5 : (cell.status!=='idle'?1.5:.5);
        if(!isFocus&&(isBee||cell.status!=='idle')){ctx.shadowBlur=10;ctx.shadowColor=sc;}
        ctx.stroke(); ctx.shadowBlur=0;

        // Nectar pulse
        if(cell.nectarLevel>.05){ctx.beginPath();ctx.arc(cell.x,cell.y,r*.3*cell.nectarLevel,0,Math.PI*2);ctx.fillStyle=sc+'18';ctx.fill();cell.nectarLevel*=.97;}

        // TEXT INSIDE — the context window
        const name = cell.world.name.replace(/([A-Z])/g,' $1').trim();
        const short = name.length>12?name.slice(0,10)+'…':name;
        ctx.textAlign='center';

        // World name
        ctx.font = isBee?`bold 8px ui-monospace,monospace`:`600 6px ui-monospace,monospace`;
        ctx.textBaseline='middle';
        ctx.fillStyle = isBee ? (isFocus?'#0f766e':'#34d399') :
                        alive ? (isFocus?'rgba(15,118,110,.5)':'rgba(52,211,153,.35)') :
                                (isFocus?'rgba(15,118,110,.12)':'rgba(20,184,166,.08)');
        ctx.fillText(short, cell.x, cell.y-10);

        // AI score
        ctx.font = `bold 7px ui-monospace,monospace`;
        ctx.fillStyle = alive?(isFocus?'rgba(15,118,110,.4)':'rgba(52,211,153,.25)'):'transparent';
        ctx.fillText(cell.ai, cell.x, cell.y+2);

        // Description snippet (alive or visited cells)
        if(isBee||visited||alive) {
            const desc = (cell.world.description||'').slice(0,45);
            ctx.font = `5px ui-monospace,monospace`;
            ctx.fillStyle = isFocus?'rgba(15,118,110,.2)':'rgba(20,184,166,.12)';
            const words = desc.split(' ');
            let line='', ly=cell.y+12;
            words.forEach(w=>{const test=line+w+' ';if(ctx.measureText(test).width>r*1.3){ctx.fillText(line.trim(),cell.x,ly);line=w+' ';ly+=6;if(ly>cell.y+28)return;}else line=test;});
            if(ly<=cell.y+28) ctx.fillText(line.trim(),cell.x,ly);
        }

        // Bee emoji
        if(isBee){ctx.font='12px serif';ctx.fillText('🐝',cell.x,cell.y-24);}

        // Decay
        if(cell.status!=='idle'&&cell.status!=='goal'&&cell.status!=='obstacle'){cell.statusLife--;if(cell.statusLife<=0)cell.status='idle';}

        cell._sx = cell.x*scale+offX;
        cell._sy = cell.y*scale+offY;
    });

    ctx.restore();
}

function resize(){const vp=el('latticeWrap');const w=vp.clientWidth,h=vp.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}

// ──────────────────────────────
// TRAFFIC LIGHT COGNITION SOLVER
// ──────────────────────────────
function solveCognition() {
    hexCells.forEach(c=>{
        if(c.status==='goal') c.cognition=100;
        else if(c.status==='obstacle') c.cognition=-100;
        else c.cognition=0;
    });
    const cols=Math.ceil(Math.sqrt(worlds.length*1.35));
    for(let pass=0;pass<4;pass++){
        const snap = hexCells.map(c=>c.cognition);
        hexCells.forEach((c,i)=>{
            if(c.status==='goal'||c.status==='obstacle') return;
            const neighbors=[i-1,i+1,i-cols,i+cols,i-cols+1,i+cols-1].filter(n=>n>=0&&n<hexCells.length);
            let sum=0,cnt=0;
            neighbors.forEach(n=>{sum+=snap[n];cnt++;});
            if(cnt) c.cognition = (sum/cnt)*.82;
        });
    }
}

// ──────────────────────────────
// LATTICE CLICK — Disturb / Goal / Obstacle
// ──────────────────────────────
canvas_onClick = function(e) {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*dpr, my=(e.clientY-rect.top)*dpr;
    let closest=-1, closestD=Infinity;
    hexCells.forEach((c,i)=>{const d=Math.hypot(c._sx*dpr-mx,c._sy*dpr-my);if(d<HEX_R*2&&d<closestD){closest=i;closestD=d;}});
    if(closest<0) return;
    const cell = hexCells[closest];

    spawnRipple(e.clientX, e.clientY);

    if(e.shiftKey) {
        // GOAL vector
        cell.status = cell.status==='goal'?'idle':'goal';
        playBuzz('gold');
        emitPheromone(e.clientX-rect.left, e.clientY-rect.top, 'GOLD_INTENT_VECTOR');
        solveCognition();
    } else if(e.altKey) {
        // OBSTACLE vector
        cell.status = cell.status==='obstacle'?'idle':'obstacle';
        playBuzz('red');
        emitPheromone(e.clientX-rect.left, e.clientY-rect.top, 'OBSTACLE_ISOLATION');
        solveCognition();
    } else {
        // DISTURB — fly to cell or look
        playBuzz('amber',.7);
        cell.nectarLevel = 1;
        cell.statusLife = 40;
        if(closest !== bee.cellIdx) {
            processCommand(`fly to ${cell.world.name.replace(/([A-Z])/g,' $1').trim()}`);
        } else {
            processCommand('look');
        }
    }
}

// ──────────────────────────────
// POLLEN → CHAT → HONEY
// The core paradigm: your words are pollen, LLM responses are honey
// ──────────────────────────────
function sendPollen() {
    const input = el('chatInput'), text = input.value.trim();
    if(!text) return;
    input.value = '';
    processCommand(text);
}

async function processCommand(text) {
    addMsg('pollen', text);
    bee.steps++;
    setStatus('PROCESSING_POLLEN');

    const action = parseAction(text);
    const cell = hexCells[bee.cellIdx];
    const state = {energy:bee.energy,pollen:bee.pollen,pollenMax:bee.pollenMax,currentAI:cell.ai};

    // Special commands
    if(action==='plan'){generatePlan();updateUI();setStatus('_AWAITING_POLLEN');return;}
    if(action==='remember'){showMemories(text);updateUI();setStatus('_AWAITING_POLLEN');return;}
    if(action==='reflect'){triggerReflection();updateUI();setStatus('_AWAITING_POLLEN');return;}

    // Expert veto
    const vetoes = EXPERTS.filter(e=>!e.test(action,state)).map(e=>({expert:e.name,reason:e.veto}));
    if(vetoes.length){vetoes.forEach(v=>addMsg('expert-vote',`✗ ${v.expert}: ${v.reason}`));createMemory(`Vetoed: ${vetoes[0].reason}`,'observation',4);updateUI();setStatus('_AWAITING_POLLEN');return;}

    // Local execution
    const result = executeLocal(action, text, cell);
    if(result.narration) addMsg('honey', result.narration);
    if(result.system) addMsg('system', result.system);

    const imp = action==='synthesize'?8:action==='forage'?6:action==='fly'?4:3;
    createMemory(`${action.toUpperCase()}: ${(result.narration||text).slice(0,180)}`,'action',imp);

    // LLM honey synthesis — the deep response
    const key = el('opKey').value.trim();
    if(key) {
        setStatus('SYNTHESIZING_HONEY');
        await llmHoney(text, action, cell);
    }

    updateUI();
    setStatus('_AWAITING_POLLEN');
}

function parseAction(t){
    t=t.toLowerCase();
    if(t==='plan'||t.startsWith('plan'))return'plan';
    if(t==='remember'||t.startsWith('remember')||t.includes('what do i know'))return'remember';
    if(t==='reflect'||t.includes('who am i'))return'reflect';
    if(t.includes('fly')||t.includes('go')||t.includes('move'))return'fly';
    if(t.includes('forage')||t.includes('collect')||t.includes('gather'))return'forage';
    if(t.includes('synth')||t.includes('honey')||t.includes('brew'))return'synthesize';
    if(t.includes('look')||t.includes('see')||t.includes('examine'))return'look';
    if(t.includes('smell')||t.includes('sense'))return'smell';
    if(t.includes('rest')||t.includes('sleep'))return'rest';
    if(t.includes('dance')||t.includes('waggle'))return'dance';
    return'chat'; // Default: treat as open conversation with the hive
}

function executeLocal(action, text, cell) {
    const w=cell.world, dn=w.name.replace(/([A-Z])/g,' $1').trim();
    switch(action) {
        case 'fly': {
            const t=text.toLowerCase();
            let target=null;
            hexCells.forEach((c,i)=>{if(i!==bee.cellIdx&&c.world.name.replace(/([A-Z])/g,' $1').trim().toLowerCase().includes(t.replace(/fly|go|move|to|the/gi,'').trim()))target=i;});
            if(target===null){let best=-1,bd=Infinity;hexCells.forEach((c,i)=>{if(i!==bee.cellIdx&&c.ai>ASSEMBLY_THRESHOLD&&!bee.visited.has(i)){const d=Math.abs(i-bee.cellIdx);if(d<bd){bd=d;best=i;}}});target=best>=0?best:(bee.cellIdx+1)%hexCells.length;}
            const cost=Math.min(12,Math.max(3,Math.abs(target-bee.cellIdx)));
            bee.energy=Math.max(0,bee.energy-cost); bee.cellIdx=target; bee.visited.add(target);
            hexCells[target].nectarLevel=1; hexCells[target].statusLife=30;
            const tw=hexCells[target].world.name.replace(/([A-Z])/g,' $1').trim();
            return{narration:`You fly → ${tw}. ${hexCells[target].ai>ASSEMBLY_THRESHOLD?'The cell glows — alive with pollen.':'Grey wax. Abiotic.'}`,system:`Cell ${target+1}/${worlds.length}: ${tw} (AI:${hexCells[target].ai})`,outcome:'FLEW'};
        }
        case 'forage': {
            const avail=w.entities.filter(e=>!bee.pollen.some(p=>p.name===e.name));
            if(!avail.length) return{narration:'No new pollen here.',outcome:'EMPTY'};
            const take=avail.slice(0,2);
            take.forEach(e=>bee.pollen.push({name:e.name,type:e.type,source:dn}));
            bee.energy=Math.max(0,bee.energy-3);
            hexCells[bee.cellIdx].nectarLevel=1;
            return{narration:`Foraged: ${take.map(e=>e.name).join(', ')}. Sacs: ${bee.pollen.length}/${bee.pollenMax}.`,outcome:'FORAGED'};
        }
        case 'synthesize': {
            const names=bee.pollen.map(p=>p.name).join(' + ');
            bee.honey.push({text:`Honey from ${names}`,step:bee.steps});
            bee.energy=Math.min(100,bee.energy+15);
            const n=bee.pollen.length; bee.pollen=[];
            createMemory(`Synthesized honey #${bee.honey.length}: ${names}`,'honey',8);
            return{narration:`Synthesized ${n} pollen → honey #${bee.honey.length}. Energy +15.`,outcome:'SYNTHESIZED'};
        }
        case 'look': return{narration:`${dn} (AI:${w.ai}${w.ai>ASSEMBLY_THRESHOLD?' — ALIVE':''})\n${w.genre}\n\n${w.description}\n\nEntities: ${w.entities.map(e=>e.name).join(', ')||'none'}\nEvents: ${w.events.map(e=>'⚡'+e.name).join(', ')||'none'}`,outcome:'LOOKED'};
        case 'smell': {
            const nearby=routes.filter(r=>r.from===w.uid||r.to===w.uid).slice(0,3);
            const scents=nearby.map(r=>{const tid=r.from===w.uid?r.to:r.from;const tw=worldByUid[tid];return tw?tw.name.replace(/([A-Z])/g,' $1').trim():null;}).filter(Boolean);
            return{narration:`Pheromone traces → ${scents.join(', ')||'nothing'}. Dominant: ${w.genre}.`,outcome:'SMELLED'};
        }
        case 'rest':bee.energy=Math.min(100,bee.energy+20);return{narration:'Resting in the cell. Energy +20.',outcome:'RESTED'};
        case 'dance': {
            const d=routes.filter(r=>r.from===w.uid||r.to===w.uid).sort((a,b)=>b.weight-a.weight).slice(0,3);
            const recs=d.map(r=>{const tid=r.from===w.uid?r.to:r.from;const tw=worldByUid[tid];return tw?`→ ${tw.name.replace(/([A-Z])/g,' $1').trim()}`:null;}).filter(Boolean);
            return{narration:`Waggle dance:\n${recs.join('\n')||'No strong connections.'}`,outcome:'DANCED'};
        }
        case 'chat': return{narration:null,system:null,outcome:'CHAT'}; // Passthrough to LLM
        default: return{narration:null,outcome:'UNKNOWN'};
    }
}

// ──────────────────────────────
// TOKEN EFFICIENCY
// ──────────────────────────────
let tokenEstimate = 0;
function estimateTokens(text) { return Math.ceil((text||'').length / 3.5); }

// ──────────────────────────────
// LLM HONEY SYNTHESIS — token-optimized
// ──────────────────────────────
async function llmHoney(userText, action, cell) {
    const key=el('opKey').value.trim(), base=el('opBase').value.trim(), model=el('opModel').value.trim();
    if(!key) return;
    const w = cell.world;
    const dn = w.name.replace(/([A-Z])/g,' $1').trim();

    // Compact memory retrieval
    const mems = retrieveMemories(`${userText} ${w.name}`, 3);
    const refs = memoryStream.filter(m=>m.type==='reflection').slice(-1);

    const memCtx = mems.length ? '\nMEMORY:'+mems.map(m=>`\n- ${m.text.slice(0,80)}`).join('') : '';
    const idCtx = refs.length ? '\nSELF: '+refs[0].text.slice(0,80) : '';

    // Structured output prompt — no filler, no poetry
    const sysPrompt = `You analyze POML narrative cells. User=${bee.persona.name}. Output structured lines, one fact per line:
ENTITY: Name[Type] — what it does in this cell
RELATION: A→type→B — causal link
STATUS: cell state / pollen observation
You MUST name at least 2 entities by exact NAME[TYPE]. Zero metaphors. Zero poetry. Data-grounded only. 3-5 lines.`;

    // Full world data — no truncation
    const entities = w.entities.map(e=>e.name+'['+e.type+']').join(', ');
    const relations = w.relations.map(r=>r.from+'→'+r.type+'→'+r.to).join(', ');
    const events = w.events.map(e=>e.name).join(', ');
    const states = w.states.map(s=>(s.entity||'')+':'+(s.value||s.state||'')).join(', ');

    const userCtx = `Cell: ${dn} (AI:${w.ai}) Genre:${w.genre}
${w.description}
Entities: ${entities||'none'}
${relations?'Relations: '+relations:''}
${events?'Events: '+events:''}
${states?'States: '+states:''}
Bee: E${bee.energy} P${bee.pollen.length}/${bee.pollenMax} H${bee.honey.length} V${bee.visited.size}
${memCtx}${idCtx}
POLLEN: "${userText}"`;

    const promptTokens = estimateTokens(sysPrompt) + estimateTokens(userCtx);

    try {
        const resp = await fetch(`${base}/chat/completions`, {
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
            body:JSON.stringify({model,messages:[{role:'system',content:sysPrompt},{role:'user',content:userCtx}],max_tokens:180,temperature:.4})
        });
        const data = await resp.json();
        if(data.choices?.[0]) {
            const honey = data.choices[0].message.content;
            addMsg('honey', honey);
            createMemory(`[HONEY] ${honey.slice(0,120)}`, 'observation', 6);
            
            const completionTokens = data.usage?.completion_tokens || estimateTokens(honey);
            const totalUsed = data.usage?.total_tokens || (promptTokens + completionTokens);
            tokenEstimate += totalUsed;
            el('sCog').textContent = (tokenEstimate / 1000).toFixed(3);
            
            HiveLogger.logLLM({type:'honey',model,prompt_tokens:promptTokens,completion_tokens:completionTokens,total:totalUsed});
        }
    } catch(err) {
        addMsg('system', 'Honey synthesis failed — check ⚙ API configuration.');
    }
}

// ──────────────────────────────
// PLANNING
// ──────────────────────────────
function generatePlan() {
    const alive=hexCells.filter(c=>c.ai>ASSEMBLY_THRESHOLD&&!bee.visited.has(c.idx)).sort((a,b)=>Math.abs(a.idx-bee.cellIdx)-Math.abs(b.idx-bee.cellIdx)).slice(0,3);
    if(!alive.length){addMsg('system','All alive cells visited.');return;}
    alive.forEach(c=>{c.status='goal';c.statusLife=999;});
    solveCognition();
    createMemory(`[PLAN] Targeting: ${alive.map(c=>c.world.name.replace(/([A-Z])/g,' $1').trim()).join(', ')}`,'plan',6);
    addMsg('system',`📋 Plan: forage from ${alive.length} alive cells`);
    alive.forEach((c,i)=>addMsg('system',`  ${i+1}. → ${c.world.name.replace(/([A-Z])/g,' $1').trim()} (AI:${c.ai})`));
}

function showMemories(q){
    q=q.replace(/remember|what do i know/gi,'').trim()||'forage honey fly';
    const mems=retrieveMemories(q,6);
    addMsg('system',`🧠 Memory query: "${q.slice(0,25)}"`);
    mems.forEach(m=>{
        const ic={observation:'👁',action:'⚡',reflection:'🪞',plan:'📋',honey:'🍯'}[m.type]||'·';
        addMsg('system',`${ic} [step ${m.step}, -${bee.steps-m.step}, imp:${m.importance}] ${m.text.slice(0,90)}`);
    });
}

// ──────────────────────────────
// UI & INIT
// ──────────────────────────────
function el(id){return document.getElementById(id);}
function addMsg(type,text){
    if(!text)return;
    const b=el('chatBody'),d=document.createElement('div');
    d.className=`msg ${type}`;
    const content = esc(text).replace(/\n/g,'<br>');
    d.innerHTML = content+'<button class="copy-btn" onclick="copyMsg(this)">&#x1F4CB;</button>';
    b.appendChild(d);b.scrollTop=b.scrollHeight;
}
function copyMsg(btn){
    const msg = btn.parentElement;
    const clone = msg.cloneNode(true);
    clone.querySelector('.copy-btn')?.remove();
    const text = clone.textContent.trim();
    navigator.clipboard.writeText(text).then(()=>{
        btn.classList.add('copied');btn.textContent='\u2713';
        setTimeout(()=>{btn.classList.remove('copied');btn.innerHTML='&#x1F4CB;';},1500);
    });
}
function copyLog(){
    const msgs = el('chatBody').querySelectorAll('.msg');
    const lines = Array.from(msgs).map(m => {
        const type = m.classList.contains('pollen')?'[POLLEN]':m.classList.contains('honey')?'[HONEY]':m.classList.contains('reflection')?'[REFLECT]':m.classList.contains('system')?'[SYS]':'[MSG]';
        const clone = m.cloneNode(true);
        clone.querySelector('.copy-btn')?.remove();
        return type+' '+clone.textContent.trim();
    });
    navigator.clipboard.writeText(lines.join('\n\n')).then(()=>{
        const btn = document.querySelector('.copy-log-btn');
        if(btn){btn.textContent='\u2713 COPIED';setTimeout(()=>{btn.innerHTML='&#x1F4CB; COPY LOG';},2000);}
    });
}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';}
function setStatus(s){el('statusPulse').textContent=s;}
function updateUI(){el('sCell').textContent=`${bee.cellIdx+1}/${worlds.length}`;el('sPollen').textContent=`${bee.pollen.length}/${bee.pollenMax}`;el('sHoney').textContent=bee.honey.length;el('sEnergy').textContent=bee.energy;el('sSteps').textContent=bee.steps;el('sMemory').textContent=memoryStream.length;el('sReflect').textContent=memoryStream.filter(m=>m.type==='reflection').length;}
function toggleFocus(){focusMode=!focusMode;document.body.className=focusMode?'light':'dark';el('focusLabel').textContent=focusMode?'ON':'OFF';}

// ── AUTOPILOT ──
let autopilotOn = false, autopilotTimer = null;
function toggleAutopilot(){
    autopilotOn = !autopilotOn;
    el('autoLabel').textContent = autopilotOn ? 'ON' : 'OFF';
    el('autoBtn').classList.toggle('active', autopilotOn);
    if(autopilotOn){
        addMsg('system','AUTOPILOT engaged \u2014 auto-foraging high-AI cells.');
        autopilotStep();
        autopilotTimer = setInterval(autopilotStep, 6000);
    } else {
        clearInterval(autopilotTimer);
        addMsg('system','AUTOPILOT disengaged.');
    }
}
function autopilotStep(){
    if(bee.energy < 10){ addMsg('system','Autopilot: low energy, resting.'); processCommand('rest'); return; }
    const targets = hexCells.filter(c=>c.ai>ASSEMBLY_THRESHOLD && !bee.visited.has(c.idx)).sort((a,b)=>b.ai-a.ai);
    if(!targets.length){
        addMsg('system','Autopilot: all high-AI cells visited. Disengaging.');
        toggleAutopilot(); return;
    }
    const target = targets[0];
    const name = target.world.name.replace(/([A-Z])/g,' $1').trim();
    processCommand('fly to ' + name);
    setTimeout(()=>{ if(bee.pollen.length < bee.pollenMax) processCommand('forage'); }, 1500);
    setTimeout(()=>{ if(bee.pollen.length >= bee.pollenMax) processCommand('synthesize'); }, 3000);
}
function toggleOp(){const c=el('opConfig'),a=el('opArrow');c.classList.toggle('collapsed');c.classList.toggle('expanded');a.textContent=c.classList.contains('collapsed')?'▸':'▾';}
function loadCfg(){['opKey','opModel','opBase'].forEach(id=>{const v=localStorage.getItem('hive_'+id);if(v)el(id).value=v;});}
function saveCfg(){['opKey','opModel','opBase'].forEach(id=>localStorage.setItem('hive_'+id,el(id).value));}

function init() {
    canvas = el('lattice');
    ctx = canvas.getContext('2d');
    dpr = devicePixelRatio;
    worlds = RouteEngine.parseAll(WORLDS_DATA);
    routes = RouteEngine.computeRoutes(worlds);
    worlds.forEach(w=>{worldByUid[w.uid]=w;w.ai=assemblyIndex(w);w.actor_type=RouteEngine.getActorType(w.genre);});
    layoutHex();
    loadCfg();
    window.addEventListener('resize',resize);
    canvas.addEventListener('click', function(e){ canvas_onClick(e); });
    resize();

    // Seed identity
    createMemory(`I am ${bee.persona.name}, a ${bee.persona.trait}. Goal: ${bee.persona.goal}.`,'reflection',10);
    createMemory(`228 context windows surround me. Each cell a world of pollen.`,'observation',5);

    addMsg('system','HIVE_JOCKEY v2 // POLLEN → CHAT → HONEY');
    addMsg('honey','Welcome to the hive, forager. You are surrounded by 228 context windows — each cell holds a narrative world encoded in POML.\n\nYour words are pollen. My responses are honey. Speak anything — observations, questions, commands — and the hive will synthesize.\n\nClick a cell on the lattice to fly there. Shift+click to mark a gold goal. Alt+click to mark a red obstacle. The traffic light cognition gradient will propagate across the lattice.\n\nOr just speak. The hive is listening.');
    updateUI();
    startPheroEmitter();
    requestAnimationFrame(drawLoop);
}

init();
