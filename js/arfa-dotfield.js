/**
 * Harp strings — animated lines like a harp.
 * Multiple curves that glow and wave.
 */
(function () {
  const container = document.querySelector(".arfa-dotfield");
  if (!container) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let time = 0;

  // Mouse
  let mouseX = -9999;
  let mouseY = -9999;

  // Strings (harp lines)
  const STRINGS = 28;
  const strings = [];

  // Particles riding strings
  const PARTICLE_COUNT = 40;
  const particles = [];

  function seedStrings() {
    strings.length = 0;
    const margin = 80;
    const leftX = width * 0.15;
    const rightX = width * 0.85;
    const topY = height * 0.05;
    const bottomY = height * 0.95;
    const rangeX = rightX - leftX;
    const rangeY = bottomY - topY;

    for (let i = 0; i < STRINGS; i++) {
      const t = i / (STRINGS - 1);
      const x1 = leftX + t * rangeX + (Math.random() - 0.5) * 30;
      const x2 = leftX + t * rangeX + (Math.random() - 0.5) * 30;
      // Catmull-rom / sine-based curve points
      strings.push({
        t,
        x1, x2,
        y1: topY,
        y2: bottomY,
        // wave parameters
        amplitude: 3 + Math.random() * 7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.4,
        freq: 0.008 + t * 0.006,
        thickness: 0.5 + Math.random() * 1.5,
        hue: Math.random() > 0.8 ? "violet" : (Math.random() > 0.3 ? "white" : "cyan"),
        points: [],
        glow: 0, // 0-1, how much glow
        isGlowing: false,
      });
    }
  }

  function seedParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = {};
      spawnParticle(p);
      particles.push(p);
    }
  }

  function spawnParticle(p) {
    const si = Math.floor(Math.random() * strings.length);
    const s = strings[si];
    const progress = Math.random();
    p.stringIdx = si;
    p.progress = progress;
    p.targetProgress = progress;
    p.speed = 0.0008 + Math.random() * 0.0012;
    p.size = 0.6 + Math.random() * 1.2;
    p.baseAlpha = 0.3 + Math.random() * 0.4;
    p.alpha = p.baseAlpha;
    p.hue = Math.random() > 0.85 ? "violet" : "white";
    p.trail = [];
    p.trailLen = 6 + Math.floor(Math.random() * 6);
  }

  function getPointOnString(s, progress, time) {
    const t = progress;
    const x = s.x1 + (s.x2 - s.x1) * t;
    const wave = Math.sin(s.phase + s.freq * (width * t) + time * s.speed) * s.amplitude;
    // mouse influence
    let mx = 0;
    if (mouseX > -1000) {
      const dmx = mouseX - x;
      const dmy = mouseY - (s.y1 + (height - 2*70) * t);
      if (Math.abs(dmx) < 100) {
        mx = Math.sin(Math.PI * Math.max(0, 1 - Math.abs(dmx)/100)) * 4;
      }
    }
    const y = s.y1 + (height - 2*70) * t + wave + mx;
    return { x, y };
  }

  // Grain layer — subtle noise
  const GRAIN_COUNT = 200;
  const grains = []
  function seedGrain() {
    grains.length = 0;
    for (let i=0;i<GRAIN_COUNT;i++){
      grains.push({
        x: Math.random()*width,
        y: Math.random()*height,
        a: Math.random()*2-1,
        size: 0.3+Math.random()*0.8
      });
    }
  }
  // call after seedStrings(seed)
  const origSeed = seed;
  // stash for later
  let grainSeeded = false;
  function updGrain(){ if (!grainSeeded){ seedGrain(); grainSeeded=true; } }
  function drawGrain() {
    if (!grains.length) seedGrain();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    grains.forEach(g => {
      ctx.globalAlpha = 0.03 + Math.random()*0.04;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size*dpr, 0, Math.PI*2);
      ctx.fill();
      // drift
      g.x += (Math.random()-0.5)*0.5;
      g.y += (Math.random()-0.5)*0.5;
      if (g.x<0||g.x>width||g.y<0||g.y>height) {
        g.x = Math.random()*width; g.y = Math.random()*height;
      }
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawString(s, time) {
    const pts = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      pts.push(getPointOnString(s, progress, time));
    }

    // Main line
    const isViolet = s.hue === "violet";
    const glow = s.glow;
    ctx.lineWidth = s.thickness * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Glow pass
    if (glow > 0.05) {
      ctx.globalAlpha = glow * 0.4;
      ctx.strokeStyle = isViolet ? "#D4B8FF" : "#FFFFFF";
      ctx.lineWidth = (s.thickness + 4) * glow * dpr;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }

    // Core line
    ctx.globalAlpha = 0.18 + glow * 0.5;
    ctx.strokeStyle = isViolet ? "#B890E8" : "rgba(255,255,255,0.5)";
    ctx.lineWidth = s.thickness * dpr;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Points at intervals (harp "strings" nodes)
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = isViolet ? "#D4B8FF" : "rgba(255,255,255,0.6)";
    const nodeCount = 5;
    for (let i = 0; i <= nodeCount; i++) {
      const progress = i / nodeCount;
      const pt = getPointOnString(s, progress, time);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, s.thickness * 0.8 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - (time || now)) * 0.001);
    time = now;

    ctx.clearRect(0, 0, width, height);

    // Trigger glows on strings near mouse
    strings.forEach(s => {
      if (mouseX > -1000) {
        const pts = [];
        for (let i = 0; i <= 80; i++) {
          pts.push(getPointOnString(s, i/80, time));
        }
        let minDist = Infinity;
        pts.forEach(pt => {
          const d = Math.hypot(pt.x - mouseX, pt.y - mouseY);
          minDist = Math.min(minDist, d);
        });
        const targetGlow = minDist < 80 ? (1 - minDist/80) * 0.7 : 0;
        s.glow += (targetGlow - s.glow) * 0.1;
      } else {
        s.glow *= 0.95;
      }

      // Occasional activation (harp "plays")
      if (Math.random() < 0.0003) {
        s.glow = 0.8;
      }

      s.glow *= 0.97;

      drawString(s, time);
    });

    // Update particles
    particles.forEach(p => {
      const s = strings[p.stringIdx];
      p.progress += p.speed;
      if (p.progress > 1) {
        p.progress = 0;
        p.stringIdx = Math.floor(Math.random() * strings.length);
        s.glow = 0.6;
      }
      const pt = getPointOnString(strings[p.stringIdx], p.progress, time);
      p.x = pt.x;
      p.y = pt.y;

      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > p.trailLen) p.trail.pop();

      p.alpha = p.baseAlpha * (0.6 + 0.4 * Math.abs(Math.sin(p.progress * Math.PI * 5)));
      drawParticle(p, strings[p.stringIdx].hue);
    });

    // Pluck strings (random)
    if (Math.random() < 0.004) {
      const si = Math.floor(Math.random() * strings.length);
      strings[si].glow = 1.0;
      spawnPluckParticle(si);
    }
    // Draw grain
    drawGrain();


    // Keep particle count bounded
    if (particles.length > PARTICLE_COUNT + 20) {
      particles.splice(0, 5);
    }

    raf = requestAnimationFrame(frame);
  }

  function drawParticle(p, stringHue) {
    const r = p.size * dpr * 0.5;
    if (r < 0.3) return;

    const isViolet = p.hue === "violet";
    const coreColor = isViolet ? "#D4B8FF" : "#FFFFFF";
    const glowColor = isViolet ? "rgba(180,140,255,0.4)" : "rgba(255,255,255,0.3)";

    // Trail
    if (p.trail.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(p.trail[p.trail.length-1].x, p.trail[p.trail.length-1].y);
      for (let i = p.trail.length - 2; i >= 0; i--) {
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
      }
      const grad = ctx.createLinearGradient(
        p.trail[p.trail.length-1].x, p.trail[p.trail.length-1].y,
        p.trail[0].x, p.trail[0].y
      );
      const c1 = isViolet ? "rgba(180,140,255,0)" : "rgba(255,255,255,0)";
      const c2 = isViolet ? "rgba(180,140,255,0.3)" : "rgba(255,255,255,0.25)";
      grad.addColorStop(0, c2);
      grad.addColorStop(1, c1);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(0.5, r * 0.3);
      ctx.globalAlpha = p.alpha * 0.7;
      ctx.stroke();
    }

    // Glow
    const glowR = r * 5;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
    const g1 = glowColor;
    const g2 = "rgba(0,0,0,0)";
    glow.addColorStop(0, g1);
    glow.addColorStop(1, g2);
    ctx.fillStyle = glow;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowR, 0, Math.PI*2);
    ctx.fill();

    // Core
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI*2);
    ctx.fill();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    updGrain();
  }

  container.addEventListener("mousemove", e => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, { passive: true });

  container.addEventListener("touchmove", e => {
    const rect = container.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
    mouseY = e.touches[0].clientY - rect.top;
  }, { passive: true });

  container.addEventListener("mouseleave", () => { mouseX = -9999; mouseY = -9999; });
  container.addEventListener("touchend", () => { mouseX = -9999; mouseY = -9999; });

  resize();
  if (reduceMotion) {
    seed();
    // static version
    ctx.clearRect(0,0,width,height);
    drawStatic();
  } else {
    raf = requestAnimationFrame(frame);
  }

  function drawStatic() {
    time = 0;
    strings.forEach(s => drawString(s, time));
  }

  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    resize();
    if (reduceMotion) drawStatic();
    else raf = requestAnimationFrame(frame);
  }, { passive: true });
})();