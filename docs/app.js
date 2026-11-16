/**
 * leoram.dev — Smart Floating Header & Restrained Technical Figure (Spikes / Swarm)
 * Crafted for David Leonardo Ramírez Parada
 */
(function () {
  "use strict";

  const root = document.documentElement;
  const header = document.getElementById("floating-header");
  const themeBtn = document.getElementById("theme-toggle");
  const switchLabel = themeBtn ? themeBtn.querySelector(".switch-label") : null;

  // =========================================================================
  // 1. SMART AUTO-HIDING FLOATING HEADER
  //    Hides when scrolling down, reveals when scrolling back up
  // =========================================================================
  let lastScrollY = window.scrollY || 0;
  let ticking = false;

  function updateHeaderOnScroll() {
    const currentY = Math.max(0, window.scrollY || 0);
    const delta = currentY - lastScrollY;

    if (header) {
      if (currentY <= 48) {
        header.classList.remove("is-hidden");
      } else if (delta > 6 && currentY > 72) {
        header.classList.add("is-hidden");
      } else if (delta < -6) {
        header.classList.remove("is-hidden");
      }
    }

    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderOnScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  // Always reveal header if keyboard user focuses inside it
  if (header) {
    header.addEventListener("focusin", () => {
      header.classList.remove("is-hidden");
    });
  }

  // =========================================================================
  // 2. TWO-TONE THEME TOGGLE (PAPER #FAF9F6 <-> MATTE #111111)
  // =========================================================================
  let triggerStaticRender = null;

  function syncThemeUI(theme) {
    const isMatte = theme === "matte";
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", isMatte ? "true" : "false");
    }
    if (switchLabel) {
      switchLabel.textContent = isMatte ? "MATTE" : "PAPER";
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", isMatte ? "#111111" : "#FAF9F6");
    }
  }

  syncThemeUI(root.getAttribute("data-theme") || "paper");

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "matte" ? "paper" : "matte";
      root.setAttribute("data-theme", next);
      syncThemeUI(next);
      try {
        localStorage.setItem("dlr-theme", next);
      } catch (e) {}
      if (triggerStaticRender) triggerStaticRender();
    });
  }

  // =========================================================================
  // 3. CLIPBOARD HELPERS (EMAIL & BIBTEX)
  // =========================================================================
  function copyText(text, onDone) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(() => fallbackCopy(text, onDone));
    } else {
      fallbackCopy(text, onDone);
    }
  }

  function fallbackCopy(text, onDone) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      onDone();
    } catch (e) {}
    document.body.removeChild(ta);
  }

  const copyEmailBtn = document.getElementById("copy-email");
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", () => {
      copyText("deiividramirez@gmail.com", () => {
        copyEmailBtn.textContent = "Copied";
        copyEmailBtn.setAttribute("aria-label", "Email address copied to clipboard");
        setTimeout(() => {
          copyEmailBtn.textContent = "Copy";
          copyEmailBtn.setAttribute("aria-label", "Copy email address to clipboard");
        }, 1800);
      });
    });
  }

  const copyBibBtn = document.getElementById("copy-bibtex");
  const bibLabel = document.getElementById("bibtex-label");
  const BIBTEX = `@article{ramirez2024vision,
  author  = {Ram{\\'i}rez-Parada, David L. and Becerra, H{\\'e}ctor M. and Toro-Arcila, Carlos A. and Arechavaleta, Gustavo},
  title   = {Vision-Based Formation Control of Quadrotors Using a Bearing-Only Approach},
  journal = {Robotics},
  volume  = {13},
  number  = {8},
  pages   = {115},
  year    = {2024},
  doi     = {10.3390/robotics13080115}
}`;

  if (copyBibBtn && bibLabel) {
    copyBibBtn.addEventListener("click", () => {
      copyText(BIBTEX, () => {
        bibLabel.textContent = "BibTeX Copied";
        copyBibBtn.setAttribute("aria-label", "BibTeX citation copied to clipboard");
        setTimeout(() => {
          bibLabel.textContent = "Copy BibTeX Citation";
          copyBibBtn.removeAttribute("aria-label");
        }, 2000);
      });
    });
  }

  // =========================================================================
  // 4. TECHNICAL SIMULATION PLATE (TWO-TONE INK + BURNT SIENNA ACCENT)
  // =========================================================================
  const canvas = document.getElementById("optics-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const telArch = document.getElementById("tel-arch");
  const telRate = document.getElementById("tel-rate");
  const telState = document.getElementById("tel-state");
  const simHeading = document.getElementById("sim-heading");
  const canvasHint = document.getElementById("canvas-hint");
  const modeTabs = document.querySelectorAll(".mode-tab");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mode = "spikes";

  const pointer = { x: 0, y: 0, active: false, lastMove: 0 };

  function getPalette() {
    const isMatte = root.getAttribute("data-theme") === "matte";
    return isMatte
      ? {
          ink: "#E5E5E5",
          inkMuted: "rgba(229, 229, 229, 0.45)",
          edge: "rgba(229, 229, 229, 0.12)",
          grid: "rgba(229, 229, 229, 0.04)",
          accent: "#E06344",
          stripBg: "#181818",
          border: "#2A2A2A",
        }
      : {
          ink: "#1A1A1A",
          inkMuted: "rgba(26, 26, 26, 0.45)",
          edge: "rgba(26, 26, 26, 0.12)",
          grid: "rgba(26, 26, 26, 0.045)",
          accent: "#B84326",
          stripBg: "#FFFFFF",
          border: "#E2E2E2",
        };
  }

  let nodes = [];
  let edges = [];
  let pulses = [];
  let rasterEvents = [];
  let spikeCounter = 0;
  let displayedHz = 136;

  const drones = [
    { id: "L0", x: 0, y: 0, vx: 0, vy: 0, ox: 0, oy: -54 },
    { id: "F1", x: 0, y: 0, vx: 0, vy: 0, ox: -72, oy: 18 },
    { id: "F2", x: 0, y: 0, vx: 0, vy: 0, ox: 72, oy: 18 },
    { id: "F3", x: 0, y: 0, vx: 0, vy: 0, ox: -42, oy: 80 },
    { id: "F4", x: 0, y: 0, vx: 0, vy: 0, ox: 42, oy: 80 },
  ];

  function buildLattice() {
    nodes = [];
    edges = [];
    pulses = [];
    const usableH = height - 46;
    const cols = width < 440 ? 6 : 8;
    const rows = 4;
    const padX = 36;
    const padY = 32;
    const stepX = (width - padX * 2) / (cols - 1);
    const stepY = (usableH - padY * 2) / (rows - 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jx = Math.sin(r * 3.1 + c * 1.7) * 9;
        const jy = Math.cos(r * 2.3 + c * 2.9) * 7;
        nodes.push({
          x: padX + c * stepX + jx,
          y: padY + r * stepY + jy,
          potential: Math.random() * 0.25,
          polarity: (r + c) % 3 === 0 ? -1 : 1,
          refractory: 0,
          neighbors: [],
        });
      }
    }

    const maxDist = Math.hypot(stepX, stepY) * 1.26;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) <= maxDist) {
          edges.push([i, j]);
          nodes[i].neighbors.push(j);
          nodes[j].neighbors.push(i);
        }
      }
    }

    const cx = width * 0.5;
    const cy = height * 0.38;
    drones[0].x = cx;
    drones[0].y = cy;
    drones[0].vx = 0;
    drones[0].vy = 0;
    for (let i = 1; i < drones.length; i++) {
      drones[i].x = cx + drones[i].ox;
      drones[i].y = cy + drones[i].oy + 46;
      drones[i].vx = 0;
      drones[i].vy = 0;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(280, rect.width);
    height = Math.max(240, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildLattice();
  }

  function fireNode(idx, forcedPol) {
    const n = nodes[idx];
    if (!n || n.refractory > 0.16) return;
    n.potential = 1.0;
    n.refractory = 0.55;
    const pol = forcedPol || n.polarity;
    spikeCounter++;

    rasterEvents.push({ x: width - 14, pol, ch: idx % 4 });
    if (rasterEvents.length > 90) rasterEvents.shift();

    const targets = n.neighbors.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    targets.forEach((tIdx) => {
      if (pulses.length < 42) {
        pulses.push({
          from: idx,
          to: tIdx,
          t: 0,
          speed: 0.028 + Math.random() * 0.018,
          pol,
        });
      }
    });
  }

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
    pointer.lastMove = performance.now();

    if (mode === "spikes") {
      for (let i = 0; i < nodes.length; i++) {
        const d = Math.hypot(nodes[i].x - pointer.x, nodes[i].y - pointer.y);
        if (d < 44 && Math.random() < 0.3) {
          fireNode(i, d < 22 ? -1 : 1);
        }
      }
    }
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    if (mode === "spikes") {
      nodes
        .map((n, i) => ({ i, d: Math.hypot(n.x - cx, n.y - cy) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 4)
        .forEach((item, k) => fireNode(item.i, k % 2 === 0 ? -1 : 1));
    }
  });

  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      mode = tab.dataset.mode === "swarm" ? "swarm" : "spikes";
      modeTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (mode === "spikes") {
        if (simHeading) simHeading.textContent = "FIG. 01 — EVENT SPIKE EMBEDDING LATTICE";
        if (canvasHint) canvasHint.textContent = "CURSOR OR CLICK — INJECT ASYNCHRONOUS EVENTS";
        if (telArch) telArch.textContent = "SPARSE SNN / VLA";
        if (telState) telState.textContent = "EVENT Δt";
      } else {
        if (simHeading) simHeading.textContent = "FIG. 02 — BEARING-ONLY QUADROTOR FORMATION";
        if (canvasHint) canvasHint.textContent = "MOVE CURSOR — PILOT LEADER AGENT L₀";
        if (telArch) telArch.textContent = "BEARING RIGIDITY";
        if (telState) telState.textContent = "FOV CONSTRAINED";
      }
      if (triggerStaticRender) triggerStaticRender();
    });
  });

  let lastTel = 0;

  function drawSpikes(now, pal) {
    if (!reducedMotion && (!pointer.active || now - pointer.lastMove > 1400)) {
      if (Math.random() < 0.11 && nodes.length > 0) {
        const idx = Math.floor(((now * 0.0035) % 1) * nodes.length);
        fireNode(idx, Math.random() < 0.38 ? -1 : 1);
      }
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = pal.edge;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
      const a = nodes[edges[i][0]];
      const b = nodes[edges[i][1]];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += reducedMotion ? 0 : p.speed;
      const a = nodes[p.from];
      const b = nodes[p.to];
      const px = a.x + (b.x - a.x) * p.t;
      const py = a.y + (b.y - a.y) * p.t;
      const col = p.pol < 0 ? pal.accent : pal.ink;

      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const tailT = Math.max(0, p.t - 0.22);
      ctx.moveTo(a.x + (b.x - a.x) * tailT, a.y + (b.y - a.y) * tailT);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = col;
      ctx.fillRect(px - 2, py - 2, 4, 4);

      if (p.t >= 1) {
        pulses.splice(i, 1);
        if (Math.random() < 0.38) {
          fireNode(p.to, p.pol);
        } else if (nodes[p.to]) {
          nodes[p.to].potential = Math.min(1, nodes[p.to].potential + 0.4);
        }
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (!reducedMotion) {
        n.potential *= 0.955;
        n.refractory = Math.max(0, n.refractory - 0.016);
      }
      const col = n.polarity < 0 ? pal.accent : pal.ink;

      if (n.potential > 0.14) {
        ctx.strokeStyle = col;
        ctx.globalAlpha = n.potential * 0.45;
        ctx.lineWidth = 1;
        const r = 5 + n.potential * 7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = n.potential > 0.28 ? col : pal.inkMuted;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.8 + n.potential * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom Spike Raster Strip
    const stripTop = height - 42;
    ctx.fillStyle = pal.stripBg;
    ctx.fillRect(0, stripTop, width, 42);
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, stripTop);
    ctx.lineTo(width, stripTop);
    ctx.stroke();

    for (let i = rasterEvents.length - 1; i >= 0; i--) {
      const ev = rasterEvents[i];
      if (!reducedMotion) ev.x -= 1.4;
      if (ev.x < 8) {
        rasterEvents.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = ev.pol < 0 ? pal.accent : pal.ink;
      ctx.lineWidth = 1.6;
      const y0 = stripTop + 7 + ev.ch * 7.5;
      ctx.beginPath();
      ctx.moveTo(ev.x, y0);
      ctx.lineTo(ev.x, y0 + 5);
      ctx.stroke();
    }

    if (now - lastTel > 450) {
      displayedHz = Math.round(108 + spikeCounter * 13 + Math.random() * 10);
      spikeCounter = 0;
      if (telRate && mode === "spikes") telRate.textContent = displayedHz + " Hz";
      lastTel = now;
    }
  }

  function drawSwarm(now, pal) {
    const leader = drones[0];
    let targetX = width * 0.5 + Math.cos(now * 0.001) * (width * 0.2);
    let targetY = height * 0.38 + Math.sin(now * 0.0015) * (height * 0.15);
    if (pointer.active) {
      targetX = Math.max(54, Math.min(width - 54, pointer.x));
      targetY = Math.max(44, Math.min(height - 92, pointer.y));
    }

    const scale = 0.88 + Math.sin(now * 0.0016) * 0.15;

    if (!reducedMotion) {
      leader.vx = (leader.vx + (targetX - leader.x) * 0.042) * 0.82;
      leader.vy = (leader.vy + (targetY - leader.y) * 0.042) * 0.82;
      leader.x += leader.vx;
      leader.y += leader.vy;

      for (let i = 1; i < drones.length; i++) {
        const d = drones[i];
        const desX = leader.x + d.ox * scale;
        const desY = leader.y + (d.oy + 46) * scale;
        d.vx = (d.vx + (desX - d.x) * 0.036) * 0.84;
        d.vy = (d.vy + (desY - d.y) * 0.036) * 0.84;
        d.x += d.vx;
        d.y += d.vy;
      }
    }

    // Subtle Camera FOV Cones
    for (let i = 1; i < drones.length; i++) {
      const f = drones[i];
      const angle = Math.atan2(leader.y - f.y, leader.x - f.x);
      const coneLen = 80;
      const halfFov = 0.3;
      ctx.fillStyle = i % 2 === 0 ? pal.accent : pal.ink;
      ctx.globalAlpha = 0.06;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + Math.cos(angle - halfFov) * coneLen, f.y + Math.sin(angle - halfFov) * coneLen);
      ctx.lineTo(f.x + Math.cos(angle + halfFov) * coneLen, f.y + Math.sin(angle + halfFov) * coneLen);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const graphPairs = [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
      [1, 4],
    ];
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    graphPairs.forEach(([a, b]) => {
      ctx.moveTo(drones[a].x, drones[a].y);
      ctx.lineTo(drones[b].x, drones[b].y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Unit Bearing Vectors g_ij
    for (let i = 1; i < drones.length; i++) {
      const f = drones[i];
      const dx = leader.x - f.x;
      const dy = leader.y - f.y;
      const norm = Math.hypot(dx, dy) || 1;
      ctx.strokeStyle = i % 2 === 0 ? pal.accent : pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + (dx / norm) * 26, f.y + (dy / norm) * 26);
      ctx.stroke();
    }

    ctx.font = '500 10px "JetBrains Mono", monospace';
    drones.forEach((d, idx) => {
      ctx.strokeStyle = pal.inkMuted;
      ctx.lineWidth = 1.2;
      const arm = idx === 0 ? 8 : 6.5;
      ctx.beginPath();
      ctx.moveTo(d.x - arm, d.y - arm);
      ctx.lineTo(d.x + arm, d.y + arm);
      ctx.moveTo(d.x + arm, d.y - arm);
      ctx.lineTo(d.x - arm, d.y + arm);
      ctx.stroke();

      ctx.fillStyle = idx === 0 ? pal.accent : pal.ink;
      if (idx === 0) {
        ctx.fillRect(d.x - 4.5, d.y - 4.5, 9, 9);
      } else {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = pal.ink;
      ctx.fillText(d.id, d.x + 11, d.y + 3.5);
    });

    if (now - lastTel > 300) {
      if (telRate && mode === "swarm") {
        telRate.textContent = "λ = " + scale.toFixed(2) + "x";
      }
      lastTel = now;
    }
  }

  function render(now) {
    ctx.clearRect(0, 0, width, height);
    const pal = getPalette();

    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 44; x < width; x += 44) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 44; y < height; y += 44) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    if (mode === "spikes") {
      drawSpikes(now, pal);
    } else {
      drawSwarm(now, pal);
    }

    if (!reducedMotion) {
      requestAnimationFrame(render);
    }
  }

  triggerStaticRender = function () {
    if (reducedMotion) render(performance.now());
  };

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (reducedMotion) render(performance.now());
  });

  try {
    const qMode = new URLSearchParams(window.location.search).get("mode");
    if (qMode === "swarm") {
      const swarmTab = document.querySelector('.mode-tab[data-mode="swarm"]');
      if (swarmTab) swarmTab.click();
    }
  } catch (e) {}

  for (let k = 0; k < 7 && k < nodes.length; k++) {
    fireNode((k * 5) % nodes.length, k % 2 === 0 ? -1 : 1);
  }
  for (let step = 0; step < 14; step++) {
    pulses.forEach((p) => {
      p.t = Math.min(0.85, p.t + p.speed);
    });
  }

  requestAnimationFrame(render);
})();
