/* ═══════════════════════════════════════════════════════
   SHARED MOBILE SUPPORT — Island Ecology Hive
   Drop-in: <script src="../mobile.js"></script> (before </body>)
   ═══════════════════════════════════════════════════════ */
(function() {
    'use strict';

    // ── FULLSCREEN TOGGLE ──
    if (!document.getElementById('fsBtn')) {
        const btn = document.createElement('button');
        btn.id = 'fsBtn';
        btn.textContent = '⛶ Full';
        btn.title = 'Toggle fullscreen';
        btn.onclick = function() {
            const app = document.getElementById('app') || document.body;
            if (app.classList.contains('fullscreen')) {
                app.classList.remove('fullscreen');
                btn.textContent = '⛶ Full';
                if (document.exitFullscreen) document.exitFullscreen().catch(function(){});
            } else {
                app.classList.add('fullscreen');
                btn.textContent = '✕ Exit';
                if (app.requestFullscreen) app.requestFullscreen().catch(function(){});
            }
            if (typeof resize === 'function') setTimeout(resize, 100);
        };
        document.body.appendChild(btn);

        document.addEventListener('fullscreenchange', function() {
            if (!document.fullscreenElement) {
                (document.getElementById('app') || document.body).classList.remove('fullscreen');
                document.getElementById('fsBtn').textContent = '⛶ Full';
                if (typeof resize === 'function') setTimeout(resize, 100);
            }
        });
    }

    // ── MOBILE TAB BAR ──
    if (!document.getElementById('mobTabBar') && window.innerWidth <= 768) {
        const bar = document.createElement('div');
        bar.className = 'mob-tab-bar';
        bar.id = 'mobTabBar';
        bar.innerHTML = '<button class="mob-tab active" data-view="canvas">◉ Map</button>' +
            '<button class="mob-tab" data-view="panel">▤ Panel</button>' +
            '<button class="mob-tab" data-view="input">⌘ Input</button>';
        document.body.appendChild(bar);

        // Find the side panel and canvas in .main
        const main = document.querySelector('.main');
        if (main) {
            const children = Array.from(main.children);
            // Side panel is typically the first non-canvas child with a fixed width
            let sidePanel = null, canvasWrap = null;
            children.forEach(function(ch) {
                const s = getComputedStyle(ch);
                if (ch.tagName === 'CANVAS' || ch.querySelector('canvas') || ch.classList.contains('vp') || ch.classList.contains('field-wrap') || ch.classList.contains('orrery-wrap')) {
                    canvasWrap = ch;
                } else if (parseInt(s.width) < 500 && s.flexShrink === '0') {
                    sidePanel = ch;
                }
            });
            // If no canvas wrap found, pick the flex:1 child
            if (!canvasWrap) {
                children.forEach(function(ch) {
                    if (getComputedStyle(ch).flexGrow === '1') canvasWrap = ch;
                });
            }

            bar.addEventListener('click', function(e) {
                const view = e.target.dataset && e.target.dataset.view;
                if (!view) return;
                bar.querySelectorAll('.mob-tab').forEach(function(t) { t.classList.remove('active'); });
                e.target.classList.add('active');

                if (view === 'canvas') {
                    if (canvasWrap) { canvasWrap.style.display = ''; canvasWrap.style.minHeight = '50vh'; }
                    if (sidePanel) { sidePanel.style.display = 'none'; }
                    document.querySelectorAll('.bot, .bot-panel, #botPanel').forEach(function(b) { b.style.display = 'none'; });
                } else if (view === 'panel') {
                    if (canvasWrap) { canvasWrap.style.display = 'none'; }
                    if (sidePanel) { sidePanel.style.display = ''; sidePanel.style.width = '100%'; sidePanel.style.maxHeight = '100%'; sidePanel.style.minHeight = '60vh'; }
                    document.querySelectorAll('.bot, .bot-panel, #botPanel').forEach(function(b) { b.style.display = 'none'; });
                } else if (view === 'input') {
                    if (canvasWrap) { canvasWrap.style.display = 'none'; }
                    if (sidePanel) { sidePanel.style.display = 'none'; }
                    document.querySelectorAll('.bot, .bot-panel, #botPanel').forEach(function(b) {
                        b.style.display = 'flex';
                        b.style.height = '70vh';
                        b.style.maxHeight = '70vh';
                    });
                    // Also show term body if it's a REPL
                    var termBody = document.getElementById('termBody');
                    if (termBody) { termBody.parentElement.style.display = 'flex'; termBody.parentElement.style.height = '70vh'; }
                    // Focus input
                    var inp = document.querySelector('.bin, .term-input, #termInput, #bIn');
                    if (inp) setTimeout(function() { inp.focus(); }, 100);
                }
                if (typeof resize === 'function') setTimeout(resize, 50);
            });
        }
    }

    // ── TOUCH: Canvas pan/pinch/zoom ──
    var cvs = document.querySelector('canvas');
    if (cvs && typeof window.camX !== 'undefined') {
        var tPanStart = null, tPinchDist = null;

        cvs.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                var t = e.touches[0];
                tPanStart = { x: t.clientX - (window.camX || 0), y: t.clientY - (window.camY || 0) };
                // Also try node selection
                if (typeof toWorld === 'function' && typeof nodeAt === 'function') {
                    var wp = toWorld({ x: t.clientX, y: t.clientY });
                    var n = nodeAt(wp.x, wp.y);
                    if (n && typeof selectNode === 'function') selectNode(n);
                }
            } else if (e.touches.length === 2) {
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                tPinchDist = Math.sqrt(dx * dx + dy * dy);
                tPanStart = null;
            }
        }, { passive: true });

        cvs.addEventListener('touchmove', function(e) {
            e.preventDefault();
            if (e.touches.length === 1 && tPanStart) {
                var t = e.touches[0];
                window.camX = t.clientX - tPanStart.x;
                window.camY = t.clientY - tPanStart.y;
                if (typeof computeV === 'function') computeV();
                if (typeof redrawV === 'function') redrawV();
                else if (typeof redraw === 'function') redraw();
            } else if (e.touches.length === 2 && tPinchDist) {
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var scale = dist / tPinchDist;
                window.camZ = Math.max(0.3, Math.min(5, (window.camZ || 1) * scale));
                tPinchDist = dist;
                if (typeof computeV === 'function') computeV();
                if (typeof redrawV === 'function') redrawV();
                else if (typeof redraw === 'function') redraw();
            }
        }, { passive: false });

        cvs.addEventListener('touchend', function() {
            tPanStart = null;
            tPinchDist = null;
        }, { passive: true });
    }

    // ── ACCESSIBILITY: keyboard shortcut for high contrast ──
    document.addEventListener('keydown', function(e) {
        // Alt+H = toggle high contrast
        if (e.altKey && e.key === 'h') {
            document.body.classList.toggle('a11y-hc');
            var app = document.getElementById('app');
            if (app) app.classList.toggle('a11y-hc');
        }
        // Alt+L = toggle large text
        if (e.altKey && e.key === 'l') {
            document.body.classList.toggle('a11y-lg');
            var app = document.getElementById('app');
            if (app) app.classList.toggle('a11y-lg');
        }
        // Escape = exit fullscreen
        if (e.key === 'Escape') {
            var app = document.getElementById('app') || document.body;
            if (app.classList.contains('fullscreen')) {
                app.classList.remove('fullscreen');
                document.getElementById('fsBtn').textContent = '⛶ Full';
            }
        }
    });

})();
