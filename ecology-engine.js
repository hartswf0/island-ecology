// ecology-engine.js
// Physical Seamless Voronoi interface for Island Ecology Indexing

class EcologyEngine {
    constructor(containerId, nodesData, navMode = 'EXPAND') {
        // RECURSION GUARD: If we're inside an iframe, do not initialize.
        // This prevents iframe-of-iframe infinite nesting.
        if (window.frameElement) {
            console.log('[EcologyEngine] Skipped: running inside iframe.');
            return;
        }

        this.container = document.getElementById(containerId);
        this.nodesData = nodesData;
        this.navMode = navMode; // 'EXPAND' or 'DESCEND'
        
        // Setup massive local physics arena
        this.AW = 4000;
        this.AH = 3000;
        
        // Camera systems - Pull back initial zoom
        this.cam = { x: 0, y: 0, z: 0.2 };
        this.tCam = { x: 0, y: 0, z: 0.2 };
        this.savedCam = null;
        this.initialized = false;
        
        // Setup DOM
        this.container.innerHTML = `
            <div class="vp" id="eco-vp" style="position:relative; width:100%; height:100%; overflow:hidden; background:#000;">
                <canvas id="eco-vc" style="display:block; position:absolute; inset:0; pointer-events:none; z-index:10;"></canvas>
                <div id="eco-camera" style="position:absolute; left:0; top:0; width:${this.AW}px; height:${this.AH}px; pointer-events:none; transform-origin:0 0; z-index:5;">
                    <div id="eco-nodes" style="position:absolute; inset:0; pointer-events:none;"></div>
                </div>
            </div>
            <!-- Dynamic Navigation HUD - Enlarged for Fitts's Law -->
            <div id="eco-hud" style="position:absolute; bottom:50px; left:50%; transform:translateX(-50%); z-index:50; display:none; background:rgba(5,7,12,0.98); border:1px solid rgba(157,216,232,0.4); padding:16px 32px; border-radius:12px; color:#fff; font-family:'IBM Plex Mono', monospace; align-items:center; gap:30px; pointer-events:auto; box-shadow:0 20px 60px rgba(0,0,0,0.9); backdrop-filter:blur(15px);">
                <button class="nav-prev" style="background:rgba(255,255,255,0.05); border:1px solid rgba(157,216,232,0.2); color:#9dd8e8; cursor:pointer; font-size:24px; transition:all 0.2s; padding:10px 20px; border-radius:8px;">◄</button>
                <div style="display:flex; flex-direction:column; align-items:center; min-width:180px;">
                    <div id="hud-title" style="letter-spacing:0.2em; font-weight:700; text-transform:uppercase; color:#fff; margin-bottom:4px; font-size:14px;">NODE TITLE</div>
                    <div id="hud-region" style="font-size:10px; color:rgba(157,216,232,0.6); letter-spacing:0.3em; text-transform:uppercase; font-weight:600;">REGION NAME</div>
                </div>
                <button class="nav-next" style="background:rgba(255,255,255,0.05); border:1px solid rgba(157,216,232,0.2); color:#9dd8e8; cursor:pointer; font-size:24px; transition:all 0.2s; padding:10px 20px; border-radius:8px;">►</button>
                <div style="width:1px; height:40px; background:rgba(157,216,232,0.1); margin:0 10px;"></div>
                <button class="nav-esc" style="background:rgba(245,101,101,0.1); border:1px solid rgba(245,101,101,0.3); color:#f56565; cursor:pointer; font-size:14px; font-weight:800; letter-spacing:0.15em; transition:all 0.2s; padding:12px 24px; border-radius:8px;">⨯ ESCAPE</button>
            </div>
        `;
        
        this.canvas = document.getElementById('eco-vc');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.cameraDiv = document.getElementById('eco-camera');
        this.nodesContainer = document.getElementById('eco-nodes');
        
        this.VW = 0;
        this.VH = 0;
        
        this.nodes = [];
        this.phRunning = false;
        this.expandedIndex = null;
        
        // Native HUD mapping without global proxies
        this.container.querySelector('.nav-prev').addEventListener('click', () => this.nav(-1));
        this.container.querySelector('.nav-next').addEventListener('click', () => this.nav(1));
        this.container.querySelector('.nav-esc').addEventListener('click', () => this.collapse());
        
        // Hover effects for HUD buttons
        const hudBtns = this.container.querySelectorAll('#eco-hud button');
        hudBtns.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.borderColor = btn.classList.contains('nav-esc') ? 'rgba(245,101,101,0.6)' : 'rgba(157,216,232,0.8)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.borderColor = btn.classList.contains('nav-esc') ? 'rgba(245,101,101,0.3)' : 'rgba(157,216,232,0.2)';
            });
        });
        
        this.initNodes();
        this.initSidebar(); // Redundant Backup Nav
        this.initInput();
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }
    
    initNodes() {
        this.nodesData.forEach((d, i) => {
            const el = document.createElement('div');
            el.className = 'eco-node';
            // Disable clip-path transitions here to prevent severe tweening flicker during 60fps physics
            el.style.position = 'absolute';
            el.style.left = '0';
            el.style.top = '0';
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.pointerEvents = 'auto'; // allow hover only inside polygon bounds
            el.style.transition = 'z-index 0.2s';
            el.style.overflow = 'hidden';
            
            this.nodesContainer.appendChild(el);

            el.addEventListener('mouseenter', () => this.hoverNode(i));
            el.addEventListener('mouseleave', () => this.unhoverNode(i));
            
            const btnTab = el.querySelector('.eco-tab-btn');
            if (btnTab) btnTab.addEventListener('click', (e) => { e.stopPropagation(); window.open(d.url, '_blank'); });
            
            // Click anywhere in the voronoi cell to expand
            el.addEventListener('click', (e) => {
                if (e.target.closest('.eco-btn') || e.target.closest('#eco-hud')) return;
                e.stopPropagation();
                if (this.navMode === 'DESCEND') {
                    this.descend(i, d.url);
                } else {
                    this.toggleExpand(i, e);
                }
            });
            
            // Ordered deterministic spawn based on Territorial Archetype
            let groupAngle = 0;
            if (d.group === 'ROOT') groupAngle = Math.PI * 1.5;
            else if (d.group === 'STAINED CONTEXT') groupAngle = 0;
            else if (d.group === 'BEES ON A TRAIN') groupAngle = Math.PI / 2;
            else if (d.group === 'MCP-RIPPLES') groupAngle = Math.PI;
            
            const localAngle = i * 2.39996;
            const groupOffset = 450;
            const localOffset = 100 + (i * 15);
            
            // Map colors
            let hue = 200;
            if (d.group === 'ROOT') hue = 200;
            else if (d.group === 'STAINED CONTEXT') hue = 350;
            else if (d.group === 'BEES ON A TRAIN') hue = 40;
            else if (d.group === 'MCP-RIPPLES') hue = 280;
            
            // Lightweight placeholder instead of iframe (deferred injection)
            el.innerHTML = `
                <div class="eco-center" style="position:absolute; left:0; top:0; width:0; height:0; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); pointer-events:none;">
                    <div class="eco-label" style="position:absolute; top:-60px; left:-150px; width:300px; text-align:left; font-family:'IBM Plex Mono', monospace; font-size:13px; color:#fff; background:rgba(7,9,14,0.96); padding:12px 16px; border:1px solid hsl(${hue}, 80%, 40%); border-radius:4px; box-shadow:0 10px 30px rgba(0,0,0,0.6); z-index:40; box-sizing:border-box; display:flex; flex-direction:column; gap:8px; opacity:0; pointer-events:none; transition:all 0.2s; backdrop-filter:blur(10px);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="letter-spacing:0.05em; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%; color:hsl(${hue}, 80%, 75%);">${d.title}</span>
                            <div style="display:flex; gap:8px;">
                                <button class="eco-btn eco-tab-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); color:#fff; font-family:inherit; font-size:11px; font-weight:700; cursor:pointer; padding:6px 12px; border-radius:4px; pointer-events:auto; letter-spacing:0.05em; transition:all 0.1s;">↗ TAB</button>
                            </div>
                        </div>
                        <div style="font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.2em; font-weight:700;">REGION: ${d.group}</div>
                    </div>
                    <!-- Stained Frame HUD -->
                    <div class="eco-frame" style="position:absolute; top:-1200px; left:-1600px; width:3200px; height:2400px; border:80px solid hsla(${hue}, 80%, 50%, 0.1); border-style: double; pointer-events:none; z-index:35; box-sizing:border-box; opacity:0; transition:all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); transform:scale(1.1);"></div>
                    <!-- PLACEHOLDER: No iframe loaded until expand. Colored title bar instead. -->
                    <div class="eco-placeholder" style="position:absolute; top:-900px; left:-1200px; width:2400px; height:1800px; background:rgba(5,5,8,0.9); display:flex; align-items:center; justify-content:center; pointer-events:none;">
                        <div style="text-align:center; font-family:'IBM Plex Mono',monospace;">
                            <div style="font-size:48px; color:hsl(${hue},80%,50%); font-weight:900; text-transform:uppercase; letter-spacing:0.1em; opacity:0.3;">${d.title}</div>
                            <div style="font-size:14px; color:rgba(255,255,255,0.15); margin-top:12px; text-transform:uppercase; letter-spacing:0.3em;">${d.group}</div>
                        </div>
                    </div>
                    <!-- Glass interceptor for click/hover (3600x2700 at 1.5x) -->
                    <div class="eco-glass" style="position:absolute; top:-1350px; left:-1800px; width:3600px; height:2700px; z-index:30; cursor:grab; pointer-events:auto;"></div>
                </div>
            `;

            this.nodes.push({
                i: i,
                id: d.id,
                hue: hue,
                group: d.group,
                x: this.AW/2 + Math.cos(groupAngle)*groupOffset + Math.cos(localAngle)*localOffset,
                y: this.AH/2 + Math.sin(groupAngle)*groupOffset + Math.sin(localAngle)*localOffset,
                vx: 0,
                vy: 0,
                el: el
            });
        });
    }

    initSidebar() {
        // MOBILE STRATEGY: Don't show redundant sidebars on small screens to prevent overwhelm
        // The progressive enhancement list (already in HTML) handles mobile.
        if (window.innerWidth < 1000) return;

        // Look for the standard 'axis' or 'left' panel in index files
        const axis = document.querySelector('.axis') || document.querySelector('#grid > div:first-child');
        if (!axis) return;

        const sidebarNav = document.createElement('div');
        sidebarNav.id = 'eco-sidebar-nav';
        sidebarNav.style.cssText = `
            margin-top: 40px;
            border-top: 1px solid rgba(157,216,232,0.2);
            padding-top: 20px;
            max-height: 50vh;
            overflow-y: auto;
            scrollbar-width: none;
        `;
        sidebarNav.innerHTML = `
            <div style="font-size: 10px; color: rgba(157,216,232,0.4); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 20px; font-weight: 800;">Index Redundancy [ List ]</div>
            <div id="sidebar-list" style="display: flex; flex-direction: column; gap: 4px;"></div>
        `;

        const listContainer = sidebarNav.querySelector('#sidebar-list');
        
        this.nodesData.forEach((d, i) => {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.style.cssText = `
                padding: 12px 16px;
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.05);
                color: rgba(255,255,255,0.6);
                font-family: 'IBM Plex Mono', monospace;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                gap: 4px;
            `;
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; flex-direction:column; gap:4px; max-width:75%;">
                        <span>${d.title}</span>
                        <span style="font-size: 8px; opacity: 0.4;">${d.group}</span>
                    </div>
                    <button class="side-btn-ext" title="Open External" style="background:none; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.3); padding:4px 8px; border-radius:3px; cursor:pointer; font-size:10px;">↗</button>
                </div>
            `;
            
            const btnExt = item.querySelector('.side-btn-ext');
            if (btnExt) btnExt.addEventListener('click', (e) => { e.stopPropagation(); window.open(d.url, '_blank'); });

            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(157,216,232,0.1)';
                item.style.borderColor = 'rgba(157,216,232,0.3)';
                item.style.color = '#fff';
                // Trigger map hover
                this.hoverNode(i);
            });

            item.addEventListener('mouseleave', () => {
                item.style.background = 'rgba(255,255,255,0.02)';
                item.style.borderColor = 'rgba(255,255,255,0.05)';
                item.style.color = 'rgba(255,255,255,0.6)';
                // End map hover
                this.unhoverNode(i);
            });

            item.addEventListener('click', (e) => {
                if (this.navMode === 'DESCEND') {
                    this.descend(i, d.url);
                } else {
                    this.toggleExpand(i, e);
                }
            });

            listContainer.appendChild(item);
        });

        axis.appendChild(sidebarNav);
    }

    hoverNode(i) {
        if (this.expandedIndex === i || this.container.classList.contains('is-dragging')) return;
        const el = this.nodes[i].el;
        el.style.zIndex = '100';
        const center = el.querySelector('.eco-center');
        if (center) center.style.transform = `scale(1.05)`;
        const lbl = el.querySelector('.eco-label');
        if (lbl) { lbl.style.opacity = '1'; lbl.style.pointerEvents = 'auto'; }
        const frm = el.querySelector('.eco-frame');
        if (frm) { frm.style.opacity = '1'; frm.style.transform = 'scale(1)'; }
        
        // Highlight Sidebar item
        const sidebarItems = this.container.parentElement.querySelectorAll('.sidebar-item');
        if (sidebarItems[i]) {
            sidebarItems[i].style.background = 'rgba(157,216,232,0.15)';
            sidebarItems[i].style.borderColor = 'rgba(157,216,232,0.4)';
            sidebarItems[i].style.color = '#fff';
            sidebarItems[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        this.hovered = i;
        this.startPhys();
    }

    unhoverNode(i) {
        if (this.expandedIndex === i) return;
        const el = this.nodes[i].el;
        el.style.zIndex = '1';
        const center = el.querySelector('.eco-center');
        if (center) center.style.transform = `scale(1.0)`;
        const lbl = el.querySelector('.eco-label');
        if (lbl) { lbl.style.opacity = '0'; lbl.style.pointerEvents = 'none'; }
        const frm = el.querySelector('.eco-frame');
        if (frm) { frm.style.opacity = '0'; frm.style.transform = 'scale(1.1)'; }

        // Unhighlight Sidebar item
        const sidebarItems = this.container.parentElement.querySelectorAll('.sidebar-item');
        if (sidebarItems[i]) {
            sidebarItems[i].style.background = 'rgba(255,255,255,0.02)';
            sidebarItems[i].style.borderColor = 'rgba(255,255,255,0.05)';
            sidebarItems[i].style.color = 'rgba(255,255,255,0.6)';
        }

        this.hovered = null;
        this.startPhys();
    }

    initInput() {
        let isDragging = false, lx, ly;
        this.container.addEventListener('mousedown', e => {
            if (e.target.closest('.eco-btn') || e.target.closest('#eco-hud')) return;
            if (this.expandedIndex !== null) return;
            isDragging = true; lx = e.clientX; ly = e.clientY;
            this.container.style.cursor = 'grabbing';
            this.container.classList.add('is-dragging');
        });
        window.addEventListener('mousemove', e => {
            if (isDragging && this.expandedIndex === null) {
                const dx = e.clientX - lx;
                const dy = e.clientY - ly;
                this.tCam.x += dx; this.tCam.y += dy;
                lx = e.clientX; ly = e.clientY;
                this.startPhys();
            }
        });
        window.addEventListener('mouseup', () => { 
            isDragging = false; 
            this.container.style.cursor = 'default'; 
            this.container.classList.remove('is-dragging');
        });
        
        this.container.addEventListener('wheel', e => {
            if (this.expandedIndex !== null) return;
            const zoomDelta = e.deltaY * -0.001;
            const newZ = Math.min(Math.max(0.05, this.tCam.z + zoomDelta), 2.0);
            
            const mx = e.clientX;
            const my = e.clientY;
            
            const wx = (mx - this.tCam.x) / this.tCam.z;
            const wy = (my - this.tCam.y) / this.tCam.z;
            
            this.tCam.z = newZ;
            this.tCam.x = mx - (wx * newZ);
            this.tCam.y = my - (wy * newZ);
            this.startPhys();
        });

        window.addEventListener('keydown', e => {
            if (this.expandedIndex !== null) {
                if (e.key === 'ArrowRight') this.nav(1);
                else if (e.key === 'ArrowLeft') this.nav(-1);
                else if (e.key === 'Escape') this.collapse();
            }
        });
    }
    
    resize() {
        this.VW = this.container.clientWidth || window.innerWidth;
        this.VH = this.container.clientHeight || window.innerHeight;
        this.canvas.width = this.VW;
        this.canvas.height = this.VH;
        
        if (!this.initialized) {
            // Updated auto-fit for reduced arena density
            this.tCam.z = Math.min(this.VW / 3000, this.VH / 2200) * 0.85; 
            if (this.tCam.z < 0.1) this.tCam.z = 0.1;
            this.tCam.x = (this.VW - this.AW * this.tCam.z) / 2;
            this.tCam.y = (this.VH - this.AH * this.tCam.z) / 2;
            
            // EASE IN CAMERA: start heavily zoomed out
            this.cam.x = this.tCam.x; 
            this.cam.y = this.tCam.y; 
            this.cam.z = this.tCam.z * 0.4; 
            
            // Fade visual container
            this.cameraDiv.style.transition = 'opacity 2s cubic-bezier(0.2, 0.8, 0.2, 1)';
            this.cameraDiv.style.opacity = '0';
            setTimeout(() => { this.cameraDiv.style.opacity = '1'; }, 50);
            
            this.tickCount = 0;
            this.initialized = true;
        }
        
        this.startPhys();
    }
    
    // ── DEFERRED IFRAME INJECTION ──
    // Anti-metric: ≤ 1 iframe alive at any time. Zero on page load.
    
    injectIframe(i) {
        const n = this.nodes[i];
        const d = this.nodesData[i];
        const center = n.el.querySelector('.eco-center');
        if (!center || center.querySelector('iframe')) return; // already injected
        
        // Hide placeholder
        const ph = center.querySelector('.eco-placeholder');
        if (ph) ph.style.display = 'none';
        
        // Create iframe dynamically
        const iframe = document.createElement('iframe');
        iframe.src = d.url;
        iframe.style.cssText = 'position:absolute; top:-900px; left:-1200px; width:2400px; height:1800px; transform:scale(1.5); transform-origin:center; border:none; background:#050508; pointer-events:auto; transition:opacity 0.3s;';
        iframe.style.opacity = '0';
        
        // Loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'eco-spinner';
        spinner.style.cssText = 'position:absolute; top:0; left:0; width:0; height:0; z-index:36; pointer-events:none;';
        spinner.innerHTML = '<div style="position:absolute;top:-30px;left:-30px;width:60px;height:60px;border:3px solid rgba(157,216,232,0.1);border-top-color:rgba(157,216,232,0.6);border-radius:50%;animation:ecoSpin 0.8s linear infinite"></div>';
        
        // Add spin keyframes if not already
        if (!document.getElementById('eco-spin-style')) {
            const st = document.createElement('style');
            st.id = 'eco-spin-style';
            st.textContent = '@keyframes ecoSpin{to{transform:rotate(360deg)}}';
            document.head.appendChild(st);
        }
        
        center.appendChild(spinner);
        center.insertBefore(iframe, center.querySelector('.eco-glass'));
        
        iframe.addEventListener('load', () => {
            iframe.style.opacity = '1';
            spinner.remove();
        });
        
        // Fallback: remove spinner after 5s regardless
        setTimeout(() => { if (spinner.parentNode) { spinner.remove(); iframe.style.opacity = '1'; } }, 5000);
    }
    
    removeIframe(i) {
        const n = this.nodes[i];
        if (!n) return;
        const center = n.el.querySelector('.eco-center');
        if (!center) return;
        
        const iframe = center.querySelector('iframe');
        const spinner = center.querySelector('.eco-spinner');
        if (spinner) spinner.remove();
        
        if (iframe) {
            // Delay removal slightly so collapse animation plays
            setTimeout(() => {
                iframe.remove();
                // Restore placeholder
                const ph = center.querySelector('.eco-placeholder');
                if (ph) ph.style.display = 'flex';
            }, 600);
        }
    }
    
    toggleExpand(i, e) {
        if (e) e.stopPropagation();
        
        if (this.expandedIndex === i) {
            this.collapse();
        } else {
            // Extending gracefully over another open node
            if (this.expandedIndex !== null) {
                const oldN = this.nodes[this.expandedIndex];
                oldN.el.style.transition = 'z-index 0.2s, background 0.2s';
                oldN.el.style.zIndex = '1';
                oldN.el.style.background = 'transparent';
                // Remove interactive
                const oldGlass = oldN.el.querySelector('.eco-glass');
                if (oldGlass) oldGlass.style.pointerEvents = 'auto';
                // Remove iframe from old node
                this.removeIframe(this.expandedIndex);
                const oldLbl = oldN.el.querySelector('.eco-label');
                if (oldLbl) { oldLbl.style.opacity = '0'; oldLbl.style.pointerEvents = 'none'; }
            } else {
                this.savedCam = { x: this.tCam.x, y: this.tCam.y, z: this.tCam.z };
            }
            
            this.expandedIndex = i;
            const n = this.nodes[i];
            
            // Highlight sidebar item persistently
            const sidebarItems = this.container.parentElement.querySelectorAll('.sidebar-item');
            sidebarItems.forEach((item, idx) => {
                if (idx === i) {
                    item.style.background = 'rgba(157,216,232,0.2)';
                    item.style.borderColor = 'rgba(157,216,232,0.6)';
                    item.style.color = '#fff';
                    item.style.boxShadow = 'inset 3px 0 0 rgba(157,216,232,0.8)';
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    item.style.background = 'rgba(255,255,255,0.02)';
                    item.style.borderColor = 'rgba(255,255,255,0.05)';
                    item.style.color = 'rgba(255,255,255,0.6)';
                    item.style.boxShadow = 'none';
                }
            });
            
            // Allow CSS transition on clipPath only for the explosion/collapse sequence to prevent flicker loops
            n.el.style.transition = 'z-index 0.2s, clip-path 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
            n.el.style.zIndex = '9999';
            n.el.style.clipPath = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`;
            n.el.style.background = 'rgba(5,5,8,0.95)'; // block physics bleed heavily
            
            // DEFERRED IFRAME INJECTION: Create iframe only now
            this.injectIframe(i);
            
            const glass = n.el.querySelector('.eco-glass');
            if (glass) glass.style.pointerEvents = 'none';
            const lbl = n.el.querySelector('.eco-label');
            if (lbl) { 
                // CRITICAL UX FIX: Hide label entirely so it doesn't block the visual center of the operating site
                lbl.style.opacity = '0'; 
                lbl.style.pointerEvents = 'none'; 
            }

            // Zoom the camera into the exact node center — using doubled visual bounds (3600x2700)
            const visualWidth = 3600;
            const visualHeight = 2700;
            const targetZ = Math.min(this.VW / visualWidth, this.VH / visualHeight) * 0.95; 
            this.tCam.z = targetZ;
            this.tCam.x = (this.VW / 2) - n.x * targetZ;
            this.tCam.y = (this.VH / 2) - n.y * targetZ;

            document.getElementById('hud-title').textContent = this.nodesData[i].title;
            document.getElementById('hud-region').textContent = this.nodesData[i].group;
            document.getElementById('hud-title').style.color = `hsl(${n.hue}, 80%, 70%)`;
            document.getElementById('eco-hud').style.display = 'flex';
            
            // Clean up clip-path transition string after settling to ensure future physics drag doesn't flicker
            setTimeout(() => {
                if (this.expandedIndex === i) {
                    n.el.style.transition = 'z-index 0.2s';
                }
            }, 550);
            
            this.startPhys();
        }
    }

    collapse() {
        if (this.expandedIndex === null) return;
        
        const oldIdx = this.expandedIndex;
        const n = this.nodes[oldIdx];
        
        // Clear sidebar highlight
        const sidebarItems = this.container.parentElement.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.style.background = 'rgba(255,255,255,0.02)';
            item.style.borderColor = 'rgba(255,255,255,0.05)';
            item.style.color = 'rgba(255,255,255,0.6)';
            item.style.boxShadow = 'none';
        });
        
        // Temporarily reinstate transition for smooth collapse organically back to specific voronoi shape
        n.el.style.transition = 'z-index 0.2s, clip-path 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.5s';
        n.el.style.zIndex = '1';
        n.el.style.background = 'transparent';
        
        // DEFERRED: Remove iframe, restore placeholder
        this.removeIframe(oldIdx);
        
        const glass = n.el.querySelector('.eco-glass');
        if (glass) glass.style.pointerEvents = 'auto';
        const lbl = n.el.querySelector('.eco-label');
        if (lbl) { 
            lbl.style.opacity = '0'; 
            lbl.style.pointerEvents = 'none'; 
            
            const expandBtn = lbl.querySelector('.eco-expand-btn');
            if (expandBtn) expandBtn.innerHTML = '⛶ FULL';
        }
        
        setTimeout(() => {
            if (this.expandedIndex !== oldIdx) n.el.style.transition = 'z-index 0.2s';
        }, 550);
        
        if (this.savedCam) {
            this.tCam.x = this.savedCam.x;
            this.tCam.y = this.savedCam.y;
            this.tCam.z = this.savedCam.z;
        }
        
        this.expandedIndex = null;
        document.getElementById('eco-hud').style.display = 'none';
        
        this.startPhys();
    }

    nav(dir) {
        if (this.expandedIndex === null) return;
        let next = (this.expandedIndex + dir + this.nodes.length) % this.nodes.length;
        this.toggleExpand(next);
    }
    
    descend(i, url) {
        if (this.isDescending) return;
        this.isDescending = true;
        
        const n = this.nodes[i];
        
        // Disable physics for the cinematic dive
        this.phRunning = false;
        
        // Lock camera for a fast, cinematic lerp
        this.tCam.z = 1.5; // Deep zoom
        this.tCam.x = (this.VW / 2) - n.x * 1.5;
        this.tCam.y = (this.VH / 2) - n.y * 1.5;
        
        // Visual fade out as we "pass through" the threshold
        this.container.style.transition = 'opacity 0.6s ease-in, filter 0.6s ease-in';
        this.container.style.opacity = '0';
        this.container.style.filter = 'blur(20px)';
        
        setTimeout(() => {
            window.location.href = url;
        }, 550);
        
        this.startPhys(); // Kick the loop for the camera lerp
    }
    
    physTick() {
        let dirty = false;
        
        // Lerp camera highly smoothly
        this.cam.x += (this.tCam.x - this.cam.x) * 0.10;
        this.cam.y += (this.tCam.y - this.cam.y) * 0.10;
        this.cam.z += (this.tCam.z - this.cam.z) * 0.08;
        
        if (Math.abs(this.tCam.x - this.cam.x) > 0.5 || Math.abs(this.cam.z - this.tCam.z) > 0.005) {
            dirty = true;
            this.cameraDiv.style.transform = `translate(${this.cam.x}px, ${this.cam.y}px) scale(${this.cam.z})`;
        }
        
        const centerX = this.AW / 2;
        const centerY = this.AH / 2;
        
        this.tickCount = (this.tickCount || 0) + 1;
        // Dampen initial forces linearly over first 60 frames to remove explosive chaos entirely
        const forceMult = Math.min(this.tickCount / 60, 1.0);
        
        for (let i = 0; i < this.nodes.length; i++) {
            const n = this.nodes[i];
            
            // Central gravity towards Arena center
            n.vx += (centerX - n.x) * 0.0001 * forceMult;
            n.vy += (centerY - n.y) * 0.0001 * forceMult;
            
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n2 = this.nodes[j];
                const dx = n.x - n2.x;
                const dy = n.y - n2.y;
                const distSq = dx*dx + dy*dy;
                
                if (n.group === n2.group) {
                    // Same territory: Pull together gently if separated
                    if (distSq > 300000 && distSq < 1500000) {
                        const pull = 0.0002 * forceMult;
                        n.vx -= dx * pull; n.vy -= dy * pull;
                        n2.vx += dx * pull; n2.vy += dy * pull;
                    }
                    // Repel tightly to maintain Voronoi packing
                    if (distSq < 200000) { 
                        const force = (700 / (distSq + 1)) * forceMult;
                        n.vx += dx * force; n.vy += dy * force;
                        n2.vx -= dx * force; n2.vy -= dy * force;
                    }
                } else {
                    // Different territory: Repel strongly at long range to forge distinct islands
                    if (distSq < 1000000) { 
                        const force = (2500 / (distSq + 1)) * forceMult;
                        n.vx += dx * force; n.vy += dy * force;
                        n2.vx -= dx * force; n2.vy -= dy * force;
                    }
                }
            }
            
            // Velocity cap to forbid teleportation/jitter tearing
            const maxV = 25;
            if (n.vx > maxV) n.vx = maxV;
            if (n.vx < -maxV) n.vx = -maxV;
            if (n.vy > maxV) n.vy = maxV;
            if (n.vy < -maxV) n.vy = -maxV;
            
            // Extrema friction kills physics stutter enabling hyper stable d3 tessellations
            n.vx *= 0.60;
            n.vy *= 0.60;
            
            n.x += n.vx;
            n.y += n.vy;
            
            const pad = 200;
            if (n.x < pad) { n.x = pad; n.vx *= -0.5; }
            if (n.x > this.AW - pad) { n.x = this.AW - pad; n.vx *= -0.5; }
            if (n.y < pad) { n.y = pad; n.vy *= -0.5; }
            if (n.y > this.AH - pad) { n.y = this.AH - pad; n.vy *= -0.5; }
            
            if (Math.abs(n.vx) > 0.02 || Math.abs(n.vy) > 0.02) dirty = true;
            
            // Rigid 1-to-1 tracking limits visual tear
            const center = n.el.querySelector('.eco-center');
            if (center) {
                center.style.left = n.x + 'px';
                center.style.top = n.y + 'px';
            }
        }
        
        if (dirty || this.expandedIndex !== null) {
            this.computeAndDrawVoronoi();
        } else {
            if (this.phRunning) this.computeAndDrawVoronoi(); // terminal lock frame
            this.phRunning = false;
        }
    }
    
    startPhys() {
        if (!this.phRunning) {
            this.phRunning = true;
            const loop = () => {
                this.physTick();
                if (this.phRunning) requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        }
    }
    
    computeAndDrawVoronoi() {
        if (!this.nodes.length || typeof d3 === 'undefined') return;
        
        const delaunay = d3.Delaunay.from(this.nodes, d => d.x, d => d.y);
        const voronoi = delaunay.voronoi([0, 0, this.AW, this.AH]);
        
        for (let i = 0; i < this.nodes.length; i++) {
            const n = this.nodes[i];
            const poly = voronoi.cellPolygon(i);
            
            if (poly && this.expandedIndex !== i) {
                // EDGE ALIGNMENT FIX: Add a tiny 0.5px sub-pixel bleed to paths to eliminate hairline gaps
                const pathStr = poly.map(p => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(', ');
                n.el.style.clipPath = `polygon(${pathStr})`;
            }
        }
        
        this._voronoi = voronoi;
        this.redrawV();
    }
    
    redrawV() {
        if (!this._voronoi) return;
        
        this.ctx.clearRect(0, 0, this.VW, this.VH);
        
        this.ctx.save();
        this.ctx.translate(this.cam.x, this.cam.y);
        this.ctx.scale(this.cam.z, this.cam.z);
        
        if (this.expandedIndex === null) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1.5 / this.cam.z;
            this.ctx.beginPath();
            this._voronoi.render(this.ctx);
            // external bounds map edge limit natively
            this.ctx.moveTo(0,0); this.ctx.lineTo(this.AW,0); this.ctx.lineTo(this.AW,this.AH); this.ctx.lineTo(0,this.AH); this.ctx.lineTo(0,0);
            this.ctx.stroke();
            
            if (this.hovered !== null && this.hovered !== undefined) {
                const n = this.nodes[this.hovered];
                this.ctx.beginPath();
                this._voronoi.renderCell(this.hovered, this.ctx);
                this.ctx.strokeStyle = `hsl(${n.hue}, 80%, 65%)`;
                this.ctx.lineWidth = 6 / this.cam.z;
                this.ctx.stroke();
                this.ctx.fillStyle = `hsla(${n.hue}, 80%, 60%, 0.15)`;
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }
}
