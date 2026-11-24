/**
 * Arfa hero — grainy dot-matrix with electric currents.
 *
 * A fine grid of dots that gently breathes, with a soft spotlight that
 * follows the pointer, a few violet accents, and occasional lightning
 * bolts that jump between neighbouring dots with a bright travelling
 * current. Film grain and edge vignette live in home-en.css
 * (::before / ::after on .arfa-dotfield).
 */
(function () {
  const container = document.querySelector(".arfa-dotfield");
  if (!container) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });

  const SPOTLIGHT_RADIUS = 175;
  const MAX_DPR = 2;
  const MAX_ARCS = 7;
  const SEGMENTS = 9;

  const NEIGHBOURS = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [2, 0], [-2, 0], [0, 2], [0, -2],
    [2, 2], [-2, -2], [2, -2], [-2, 2],
  ];

  const SPARK_COLOURS = [
    "155,92,255",   // violet
    "178,150,255",  // periwinkle
    "134,214,255",  // electric cyan (rare)
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let spacing = 18;
  let gridCols = 0;
  let gridRows = 0;
  let dots = [];
  let arcs = [];
  let arcTimer = 0;
  let raf = 0;
  let running = false;
  let visible = true;
  let lastNow = 0;

  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

  /* Pre-rendered radial glow sprites (cheap halos without per-frame gradients). */
  function makeGlowSprite(rgb) {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(" + rgb + ",0.9)");
    grad.addColorStop(0.4, "rgba(" + rgb + ",0.32)");
    grad.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  const whiteGlow = makeGlowSprite("230,237,247");
  const violetGlow = makeGlowSprite("201,168,255");

  function buildGrid() {
    dots = [];
    arcs = [];
    spacing = Math.max(15, Math.min(25, Math.min(width, height) / 46));
    gridCols = Math.ceil(width / spacing) + 1;
    gridRows = Math.ceil(height / spacing) + 1;
    const marginX = (width - (gridCols - 1) * spacing) / 2;
    const marginY = (height - (gridRows - 1) * spacing) / 2;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        dots.push({
          bx: marginX + c * spacing,
          by: marginY + r * spacing,
          x: 0,
          y: 0,
          r: 0.9 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          speed: 0.32 + Math.random() * 0.5,
          bob: 0.5 + Math.random() * 0.9,
          sway: 0.5 + Math.random() * 0.8,
          base: 0.1 + Math.random() * 0.16,
          violet: Math.random() < 0.07,
          glow: 0,
        });
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid();
    if (reduceMotion) render(0);
  }

  /* ---- Dot field ---------------------------------------------------- */

  function drawGlow(sprite, x, y, radius, alpha) {
    const size = radius * 2;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - radius, y - radius, size, size);
    ctx.globalAlpha = 1;
  }

  function drawDot(d, t) {
    const bob = Math.sin(t * d.speed + d.phase) * d.bob;
    const sway = Math.cos(t * d.speed * 0.6 + d.phase) * d.sway;
    d.x = d.bx + sway;
    d.y = d.by + bob;

    let target = 0;
    if (pointer.active) {
      const dist = Math.hypot(d.bx - pointer.x, d.by - pointer.y);
      if (dist < SPOTLIGHT_RADIUS) {
        target = Math.pow(1 - dist / SPOTLIGHT_RADIUS, 2);
      }
    }
    d.glow += (target - d.glow) * 0.12;

    const alpha = Math.min(1, d.base + d.glow * 0.85);
    const radius = d.r + d.glow * 1.2;

    if (d.violet) {
      drawGlow(violetGlow, d.x, d.y, radius * 7, 0.28 + d.glow * 0.45);
    } else if (d.glow > 0.03) {
      drawGlow(whiteGlow, d.x, d.y, radius * 8, d.glow * 0.6);
    }

    ctx.fillStyle = d.violet
      ? "rgba(212,184,255," + alpha + ")"
      : "rgba(230,237,247," + alpha + ")";
    ctx.beginPath();
    ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- Electric currents ------------------------------------------- */

  // Build a jagged lightning path between two points. Endpoints stay glued
  // to the dots; interior points are pushed along the normal and taper off
  // toward the ends so the bolt reads as a discharge between the nodes.
  function buildBolt(ax, ay, bx, by, amp) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const pts = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const taper = Math.sin(Math.PI * t);
      const off = (Math.random() * 2 - 1) * amp * taper;
      pts.push({ x: ax + dx * t + nx * off, y: ay + dy * t + ny * off });
    }
    return pts;
  }

  function spawnArc(big) {
    if (dots.length === 0 || arcs.length >= MAX_ARCS) return;

    const [dc, dr] = NEIGHBOURS[(Math.random() * NEIGHBOURS.length) | 0];
    let from;

    // Bias discharges toward the cursor when the pointer is on the panel.
    if (pointer.active && Math.random() < 0.45) {
      from = nearestDot(pointer.x, pointer.y);
    } else {
      from = (Math.random() * dots.length) | 0;
    }

    const chain = big ? 2 + ((Math.random() * 2) | 0) : 1;
    let prev = from;
    let c = from % gridCols;
    let r = (from / gridCols) | 0;

    for (let s = 0; s < chain; s++) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= gridCols || nr < 0 || nr >= gridRows) break;
      const to = nr * gridCols + nc;
      pushArc(prev, to);
      prev = to;
      c = nc;
      r = nr;
    }
  }

  function pushArc(ai, bi) {
    const a = dots[ai];
    const b = dots[bi];
    const dist = Math.hypot(a.bx - b.bx, a.by - b.by);
    const near =
      pointer.active && Math.hypot(a.bx - pointer.x, a.by - pointer.y) < SPOTLIGHT_RADIUS * 1.4;
    const colour = SPARK_COLOURS[Math.random() < 0.15 ? 2 : (Math.random() < 0.5 ? 0 : 1)];

    arcs.push({
      ai,
      bi,
      amp: Math.min(28, dist * 0.5) * (near ? 1.25 : 1),
      life: 0,
      duration: 0.36 + Math.random() * 0.4,
      width: 1 + Math.random() * 0.7,
      peak: (near ? 0.95 : 0.7) * (0.85 + Math.random() * 0.15),
      colour,
      seed: (Math.random() * 1000) | 0,
    });
  }

  function nearestDot(x, y) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < dots.length; i++) {
      const d = (dots[i].bx - x) * (dots[i].bx - x) + (dots[i].by - y) * (dots[i].by - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function pointAtLength(pts, cum, target) {
    if (target <= 0) return pts[0];
    if (target >= cum[cum.length - 1]) return pts[pts.length - 1];
    for (let i = 1; i < cum.length; i++) {
      if (cum[i] >= target) {
        const t = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
        return {
          x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
          y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
        };
      }
    }
    return pts[pts.length - 1];
  }

  function strokePath(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  function drawArc(arc) {
    const a = dots[arc.ai];
    const b = dots[arc.bi];
    const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, arc.life)));
    const flicker = 0.75 + Math.random() * 0.25;
    const alpha = envelope * arc.peak * flicker;
    if (alpha <= 0.01) return;

    const pts = buildBolt(a.x, a.y, b.x, b.y, arc.amp);
    const cum = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      cum.push(total);
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Wide soft glow.
    ctx.strokeStyle = "rgba(" + arc.colour + ",1)";
    ctx.globalAlpha = alpha * 0.3;
    ctx.lineWidth = arc.width + 4;
    strokePath(pts);

    // Thin core.
    ctx.globalAlpha = alpha * 0.75;
    ctx.lineWidth = arc.width;
    strokePath(pts);

    // Travelling current: a bright streak shot from a to b.
    const head = Math.pow(arc.life, 0.65) * (total + 30) - 30;
    const tailLen = Math.min(total * 0.4, 34);
    const steps = 7;
    const streak = [];
    for (let i = 0; i <= steps; i++) {
      const dist = head - tailLen + (tailLen * i) / steps;
      streak.push(pointAtLength(pts, cum, dist));
    }
    ctx.globalAlpha = Math.min(1, alpha * 1.5);
    ctx.strokeStyle = "rgba(244,240,255,1)";
    ctx.lineWidth = arc.width + 0.4;
    strokePath(streak);

    // Hot head.
    const tip = pointAtLength(pts, cum, head);
    drawGlow(whiteGlow, tip.x, tip.y, 14, alpha * 0.8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, arc.width * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function updateArcs(dt, t) {
    // Spawn cadence — a touch busier while the cursor is energising the field.
    const busy = pointer.active && Math.hypot(pointer.x - pointer.tx, pointer.y - pointer.ty) > 2;
    arcTimer -= dt * (busy ? 2.6 : 1);
    if (arcTimer <= 0) {
      const big = Math.random() < 0.16;
      spawnArc(big);
      arcTimer = 0.32 + Math.random() * (busy ? 0.35 : 0.75);
    }

    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i];
      arc.life += dt / arc.duration;
      if (arc.life >= 1) arcs.splice(i, 1);
    }
  }

  /* ---- Frame -------------------------------------------------------- */

  function render(now) {
    const t = now * 0.001;
    const dt = lastNow ? Math.min(0.05, (now - lastNow) * 0.001) : 0;
    lastNow = now;

    if (pointer.active) {
      pointer.x += (pointer.tx - pointer.x) * 0.18;
      pointer.y += (pointer.ty - pointer.y) * 0.18;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < dots.length; i++) drawDot(dots[i], t);

    if (!reduceMotion) {
      updateArcs(dt, t);
      for (let i = 0; i < arcs.length; i++) drawArc(arcs[i]);
    }
  }

  function loop(now) {
    render(now);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    lastNow = 0;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function sync() {
    if (visible && !document.hidden) start();
    else stop();
  }

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    pointer.tx = e.clientX - rect.left;
    pointer.ty = e.clientY - rect.top;
    if (!pointer.active) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
      pointer.active = true;
    }
  }

  function onPointerLeave() {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
  }

  if (finePointer) {
    const surface = container.closest(".arfa-hero") || container;
    surface.addEventListener("pointermove", onPointerMove, { passive: true });
    surface.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      },
      { threshold: 0 },
    ).observe(container);
  }

  document.addEventListener("visibilitychange", sync);

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 140);
    },
    { passive: true },
  );

  resize();
  if (reduceMotion) {
    render(0);
  } else {
    sync();
  }
})();
