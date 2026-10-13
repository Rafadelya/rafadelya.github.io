/**
 * Bold shiny star sparkles for the Arfa stage (not delicate).
 */
(function () {
  const canvas = document.getElementById("arfaSparkles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let stars = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    // Sparse: only a handful of little sparkles
    const count = Math.round(Math.min(14, Math.max(8, (width * height) / 140000)));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.7 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        speed: 1.1 + Math.random() * 1.8,
        spike: 0.35 + Math.random() * 0.45,
        hue: Math.random() > 0.55 ? "violet" : "white",
        flash: Math.random() * 8,
      });
    }
  }

  function drawStar(x, y, r, spike, alpha, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;

    // Glow core
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4.5);
    glow.addColorStop(0, color);
    glow.addColorStop(0.35, color.replace(/[\d.]+\)$/, "0.45)"));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Cross flare (bedazzle)
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.1, r * 0.45);
    ctx.lineCap = "round";
    const arm = r * (3.2 + spike * 2.2);
    ctx.beginPath();
    ctx.moveTo(-arm, 0);
    ctx.lineTo(arm, 0);
    ctx.moveTo(0, -arm);
    ctx.lineTo(0, arm);
    ctx.stroke();

    // Diagonal spark
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth = Math.max(0.8, r * 0.28);
    const d = arm * 0.62;
    ctx.beginPath();
    ctx.moveTo(-d, -d);
    ctx.lineTo(d, d);
    ctx.moveTo(d, -d);
    ctx.lineTo(-d, d);
    ctx.stroke();

    // Hot center
    ctx.globalAlpha = Math.min(1, alpha + 0.2);
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function frame(now) {
    const t = now * 0.001;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      // Punchy twinkle: sharp peaks, not soft breathing
      const wave = Math.sin(t * s.speed + s.phase);
      const pulse = Math.pow(Math.max(0, wave), 6);
      const burst = Math.pow(Math.max(0, Math.sin(t * s.speed * 0.35 + s.flash)), 12);
      const alpha = 0.18 + pulse * 0.55 + burst * 0.35;
      const scale = 0.7 + pulse * 0.45 + burst * 0.5;
      const color =
        s.hue === "violet"
          ? "rgba(220, 180, 255, 1)"
          : "rgba(255, 250, 255, 1)";
      drawStar(s.x, s.y, s.size * scale, s.spike, Math.min(1, alpha), color);
    }

    if (!reduceMotion) raf = requestAnimationFrame(frame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const color =
        s.hue === "violet"
          ? "rgba(220, 180, 255, 1)"
          : "rgba(255, 250, 255, 1)";
      drawStar(s.x, s.y, s.size * 1.1, s.spike, 0.7, color);
    }
  }

  resize();
  if (reduceMotion) {
    drawStatic();
  } else {
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener(
    "resize",
    function () {
      cancelAnimationFrame(raf);
      resize();
      if (reduceMotion) drawStatic();
      else raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
})();
