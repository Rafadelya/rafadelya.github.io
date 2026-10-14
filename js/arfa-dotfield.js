/**
 * Arfa hero — grainy dot-matrix.
 *
 * A fine grid of dots that gently breathes, with a soft spotlight that
 * follows the pointer and a few violet accents. The film grain and edge
 * vignette live in home-en.css (::before / ::after on .arfa-dotfield).
 *
 * Replaces the earlier "harp strings" prototype.
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

  let width = 0;
  let height = 0;
  let dpr = 1;
  let spacing = 18;
  let dots = [];
  let raf = 0;
  let running = false;
  let visible = true;

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
    spacing = Math.max(15, Math.min(25, Math.min(width, height) / 46));
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const marginX = (width - (cols - 1) * spacing) / 2;
    const marginY = (height - (rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
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

  function render(now) {
    const t = now * 0.001;

    if (pointer.active) {
      pointer.x += (pointer.tx - pointer.x) * 0.18;
      pointer.y += (pointer.ty - pointer.y) * 0.18;
    }

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < dots.length; i++) drawDot(dots[i], t);
  }

  function loop(now) {
    render(now);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
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
