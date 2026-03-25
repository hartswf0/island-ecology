// ════════════════════════════════════════════════
// HIVE LOGGER — Shared Session Log & Recording Harness
//
// Drop into any hive interface via <script src="hive-logger.js"></script>
// Provides:
//   • Session logging (LLM calls, navigation, events)
//   • JSON session download
//   • Screen recording (MediaRecorder API)
//   • Basic TTS for LLM responses (Web Speech API)
//   • Floating control panel
//
// Usage:
//   HiveLogger.init('hive-control-tower')  // pass interface name
//   HiveLogger.logLLM(prompt, response, model, meta)
//   HiveLogger.logNav(fromId, toId, method)
//   HiveLogger.logEvent(type, data)
//   HiveLogger.speak(text)
// ════════════════════════════════════════════════

const HiveLogger = (() => {
    let interfaceName = 'unknown';
    let sessionId = '';
    let sessionStart = 0;
    let entries = [];
    let recording = false;
    let mediaRecorder = null;
    let recordedChunks = [];
    let ttsEnabled = false;
    let ttsVoice = null;
    let panelEl = null;
    let saveTimer = null;
    let lastSaveCount = 0;
    let zoomLevel = 100;

    // ── Init ──
    function init(name) {
        interfaceName = name || 'hive';
        sessionId = `${name}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
        sessionStart = Date.now();
        entries = [];

        logEvent('session_start', { interface: interfaceName, timestamp: new Date().toISOString() });

        // Load TTS voices
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = () => {
                const voices = speechSynthesis.getVoices();
                ttsVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
                    || voices.find(v => v.lang.startsWith('en'))
                    || voices[0];
            };
            speechSynthesis.getVoices(); // trigger load
        }

        createPanel();

        // Auto-persist to localStorage on unload
        window.addEventListener('beforeunload', () => { persistSession(); });
        // Also auto-save periodically (every 30s)
        saveTimer = setInterval(() => { if (entries.length > lastSaveCount) persistSession(); }, 30000);

        console.log(`[HiveLogger] Session ${sessionId} started for ${interfaceName}`);
    }

    // ── Logging ──
    function logLLM(prompt, response, model, meta = {}) {
        const entry = {
            type: 'llm_call',
            ts: Date.now(),
            elapsed: Date.now() - sessionStart,
            model: model || 'unknown',
            prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
            response: typeof response === 'string' ? response : JSON.stringify(response),
            promptTokensEst: Math.ceil((typeof prompt === 'string' ? prompt.length : JSON.stringify(prompt).length) / 4),
            responseTokensEst: Math.ceil((typeof response === 'string' ? response.length : JSON.stringify(response).length) / 4),
            ...meta
        };
        entries.push(entry);
        updatePanel();

        // Auto-persist after every LLM call (these are high-value)
        persistSession();

        // Auto TTS
        if (ttsEnabled && typeof response === 'string') {
            speak(response);
        }
    }

    function logNav(fromId, toId, method = 'click', meta = {}) {
        entries.push({
            type: 'navigation',
            ts: Date.now(),
            elapsed: Date.now() - sessionStart,
            from: fromId,
            to: toId,
            method,
            ...meta
        });
        updatePanel();
    }

    function logEvent(eventType, data = {}) {
        entries.push({
            type: 'event',
            ts: Date.now(),
            elapsed: Date.now() - sessionStart,
            event: eventType,
            ...data
        });
        updatePanel();
    }

    // ── TTS ──
    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        // Clean markup
        const clean = text.replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').trim();
        if (!clean) return;

        speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(clean.slice(0, 300));
        utt.rate = 1.05;
        utt.pitch = 0.95;
        utt.volume = 0.8;
        if (ttsVoice) utt.voice = ttsVoice;
        speechSynthesis.speak(utt);
    }

    // ── Session Export ──
    function getSessionData() {
        return {
            sessionId,
            interface: interfaceName,
            startTime: new Date(sessionStart).toISOString(),
            endTime: new Date().toISOString(),
            durationMs: Date.now() - sessionStart,
            totalEntries: entries.length,
            llmCalls: entries.filter(e => e.type === 'llm_call').length,
            navigations: entries.filter(e => e.type === 'navigation').length,
            events: entries.filter(e => e.type === 'event').length,
            entries
        };
    }

    function downloadSession() {
        const data = getSessionData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        logEvent('session_downloaded');
    }

    // ── Auto-persist to localStorage ──
    function persistSession() {
        try {
            const data = getSessionData();
            // Keep only last 100 entries to avoid localStorage overflow
            const trimmed = { ...data, entries: data.entries.slice(-100) };
            localStorage.setItem('hivelog_' + sessionId, JSON.stringify(trimmed));
            lastSaveCount = entries.length;
        } catch (e) {
            // localStorage full — try to clear old sessions
            const keys = Object.keys(localStorage).filter(k => k.startsWith('hivelog_')).sort();
            if (keys.length > 10) {
                keys.slice(0, keys.length - 10).forEach(k => localStorage.removeItem(k));
                try { localStorage.setItem('hivelog_' + sessionId, JSON.stringify(getSessionData())); } catch (e2) {}
            }
        }
    }

    // ── Screen Recording ──
    async function startRecording() {
        if (recording) return;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: true
            });
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${sessionId}_recording.webm`;
                a.click();
                URL.revokeObjectURL(url);
                stream.getTracks().forEach(t => t.stop());
                recording = false;
                updatePanel();
                logEvent('recording_saved');
            };
            mediaRecorder.start();
            recording = true;
            updatePanel();
            logEvent('recording_started');
        } catch (e) {
            console.warn('[HiveLogger] Recording failed:', e);
        }
    }

    function stopRecording() {
        if (mediaRecorder && recording) {
            mediaRecorder.stop();
        }
    }

    // ── Floating Panel (collapsed by default) ──
    function createPanel() {
        if (panelEl) panelEl.remove();

        // Restore saved zoom
        const savedZoom = localStorage.getItem('hivelogger_zoom');
        if (savedZoom) { zoomLevel = parseInt(savedZoom) || 100; applyZoom(); }

        panelEl = document.createElement('div');
        panelEl.id = 'hive-logger-panel';
        panelEl.innerHTML = `
            <style>
                #hive-logger-panel{position:fixed;bottom:6px;left:6px;z-index:9999;font-family:'IBM Plex Mono',monospace;font-size:8px}
                #hive-logger-panel .hl-toggle{width:18px;height:18px;border-radius:2px;background:rgba(6,10,20,.82);border:1px solid rgba(140,180,210,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(212,168,75,.4);font-size:8px;transition:all .2s;backdrop-filter:blur(4px)}
                #hive-logger-panel .hl-toggle:hover{border-color:rgba(212,168,75,.3);color:rgba(212,168,75,.7);background:rgba(6,10,20,.95)}
                #hive-logger-panel .hl-toggle.rec{color:rgba(239,68,68,.7);animation:hlBlink 1s infinite}
                #hive-logger-panel .hl-expanded{display:none;background:rgba(6,10,20,.94);border:1px solid rgba(140,180,210,.08);padding:4px 6px;border-radius:3px;backdrop-filter:blur(8px);margin-bottom:3px}
                #hive-logger-panel.open .hl-expanded{display:flex;gap:3px;align-items:center;flex-wrap:wrap}
                #hive-logger-panel .hl-stat{color:rgba(140,180,210,.4);letter-spacing:.06em}
                #hive-logger-panel .hl-stat b{color:rgba(140,180,210,.7)}
                #hive-logger-panel .hl-btn{background:none;border:1px solid rgba(140,180,210,.08);color:rgba(140,180,210,.4);font-family:inherit;font-size:6px;padding:2px 5px;cursor:pointer;border-radius:1px;transition:all .15s;letter-spacing:.08em;text-transform:uppercase}
                #hive-logger-panel .hl-btn:hover{border-color:rgba(34,211,238,.3);color:rgba(34,211,238,.6)}
                #hive-logger-panel .hl-btn.active{border-color:rgba(239,68,68,.4);color:rgba(239,68,68,.6)}
                #hive-logger-panel .hl-btn.on{border-color:rgba(74,246,38,.3);color:rgba(74,246,38,.5)}
                #hive-logger-panel .hl-bottom{display:flex;gap:2px;align-items:center}
                #hive-logger-panel .hl-zoom{display:flex;gap:1px;align-items:center;margin-left:3px}
                #hive-logger-panel .hl-zbtn{width:16px;height:16px;border-radius:2px;background:rgba(6,10,20,.82);border:1px solid rgba(140,180,210,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(140,180,210,.5);font-size:10px;font-weight:700;transition:all .15s;font-family:'IBM Plex Mono',monospace;line-height:1}
                #hive-logger-panel .hl-zbtn:hover{border-color:rgba(34,211,238,.3);color:rgba(34,211,238,.7);background:rgba(6,10,20,.95)}
                #hive-logger-panel .hl-zlabel{font-size:7px;color:rgba(140,180,210,.35);min-width:22px;text-align:center;letter-spacing:0}
                @keyframes hlBlink{0%,100%{opacity:1}50%{opacity:.3}}
                #hive-logger-panel .hl-entries{max-height:160px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(140,180,210,.1) transparent;margin-top:3px;display:none}
                #hive-logger-panel.open .hl-entries{display:block}
                #hive-logger-panel .hl-entry{padding:3px 5px;border-bottom:1px solid rgba(140,180,210,.04);cursor:pointer;transition:background .1s;font-size:7px;line-height:1.3}
                #hive-logger-panel .hl-entry:hover{background:rgba(34,211,238,.06)}
                #hive-logger-panel .hl-entry-model{color:rgba(34,211,238,.5);font-weight:600;letter-spacing:.05em}
                #hive-logger-panel .hl-entry-prompt{color:rgba(140,180,210,.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
                #hive-logger-panel .hl-entry-resp{color:rgba(212,168,75,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
                #hive-logger-panel .hl-entries::-webkit-scrollbar{width:3px}
                #hive-logger-panel .hl-entries::-webkit-scrollbar-thumb{background:rgba(140,180,210,.1);border-radius:2px}
            </style>
            <div class="hl-expanded">
                <span class="hl-stat">LOG:<b id="hlCount">0</b></span>
                <span class="hl-stat">LLM:<b id="hlLLM">0</b></span>
                <span class="hl-stat" id="hlTime">0:00</span>
                <button class="hl-btn" onclick="HiveLogger.downloadSession()" title="Download session JSON">↓ LOG</button>
                <button class="hl-btn" id="hlRecBtn" onclick="HiveLogger._toggleRec()" title="Screen record">● REC</button>
                <button class="hl-btn" id="hlTtsBtn" onclick="HiveLogger._toggleTTS()" title="Toggle TTS">🔊</button>
                <button class="hl-btn" onclick="window.open('hive-manifest.html','_blank')" title="Metahive" style="color:rgba(212,168,75,.4);border-color:rgba(212,168,75,.1)">◆</button>
            </div>
            <div class="hl-bottom">
                <div class="hl-toggle" id="hlToggle" onclick="HiveLogger._togglePanel()" title="Session Logger">◆</div>
                <div class="hl-zoom">
                    <div class="hl-zbtn" onclick="HiveLogger._zoom(-1)" title="Zoom out">−</div>
                    <span class="hl-zlabel" id="hlZoom">${zoomLevel}%</span>
                    <div class="hl-zbtn" onclick="HiveLogger._zoom(1)" title="Zoom in">+</div>
                </div>
            </div>
            <div class="hl-entries" id="hlEntries"></div>
        `;
        document.body.appendChild(panelEl);

        // Timer update
        setInterval(() => {
            const s = Math.floor((Date.now() - sessionStart) / 1000);
            const m = Math.floor(s / 60);
            const el = document.getElementById('hlTime');
            if (el) el.textContent = `${m}:${String(s % 60).padStart(2, '0')}`;
        }, 1000);
    }

    function updatePanel() {
        const c = document.getElementById('hlCount');
        const l = document.getElementById('hlLLM');
        const entriesEl = document.getElementById('hlEntries');
        if (c) c.textContent = entries.length;
        if (l) l.textContent = entries.filter(e => e.type === 'llm_call').length;
        
        // Update recent entries list
        if (entriesEl) {
            const llmEntries = entries.filter(e => e.type === 'llm_call').slice(-5).reverse();
            entriesEl.innerHTML = llmEntries.map((e, i) => {
                const promptSnip = (typeof e.prompt === 'string' ? e.prompt : '').slice(0, 50).replace(/[\n\r]/g, ' ');
                const respSnip = (typeof e.response === 'string' ? e.response : '').slice(0, 60).replace(/[\n\r]/g, ' ');
                return `<div class="hl-entry" onclick="navigator.clipboard.writeText(${JSON.stringify(e.response || '').replace(/'/g, '\\&#39;')})" title="Click to copy full response">`
                    + `<span class="hl-entry-model">${e.model || '?'}</span> `
                    + `<span class="hl-entry-prompt">⇐ ${promptSnip}</span><br>`
                    + `<span class="hl-entry-resp">⇒ ${respSnip}</span>`
                    + `</div>`;
            }).join('');
        }
    }

    function _toggleRec() {
        if (recording) {
            stopRecording();
            const btn = document.getElementById('hlRecBtn');
            if (btn) { btn.classList.remove('active'); btn.textContent = '● REC'; }
            const tog = document.getElementById('hlToggle');
            if (tog) tog.classList.remove('rec');
        } else {
            startRecording();
            const btn = document.getElementById('hlRecBtn');
            if (btn) { btn.classList.add('active'); btn.textContent = '■ STOP'; }
            const tog = document.getElementById('hlToggle');
            if (tog) tog.classList.add('rec');
        }
    }

    function _toggleTTS() {
        ttsEnabled = !ttsEnabled;
        const btn = document.getElementById('hlTtsBtn');
        if (btn) {
            btn.classList.toggle('on', ttsEnabled);
            btn.textContent = ttsEnabled ? '🔊 ON' : '🔇 TTS';
        }
        if (!ttsEnabled && 'speechSynthesis' in window) speechSynthesis.cancel();
    }

    function _togglePanel() {
        if (panelEl) panelEl.classList.toggle('open');
    }

    // ── Zoom ──
    function applyZoom() {
        document.documentElement.style.zoom = (zoomLevel / 100);
        // Keep the logger panel itself at inverse zoom so it stays readable
        if (panelEl) panelEl.style.zoom = (100 / zoomLevel);
    }

    function _zoom(dir) {
        const step = 10;
        zoomLevel = Math.min(200, Math.max(70, zoomLevel + dir * step));
        applyZoom();
        localStorage.setItem('hivelogger_zoom', zoomLevel);
        const lbl = document.getElementById('hlZoom');
        if (lbl) lbl.textContent = zoomLevel + '%';
        logEvent('zoom_changed', { level: zoomLevel });
    }

    return {
        init, logLLM, logNav, logEvent, speak,
        getSessionData, downloadSession,
        startRecording, stopRecording,
        _toggleRec, _toggleTTS, _togglePanel, _zoom,
        get ttsEnabled() { return ttsEnabled; },
        get entries() { return entries; },
        get sessionId() { return sessionId; }
    };
})();
