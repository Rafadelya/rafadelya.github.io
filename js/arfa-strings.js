(function () {
  const canvas = document.getElementById("arfaStrings");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let scrollY = 0;

  const mouse = { x: 0.55, y: 0.35, tx: 0.55, ty: 0.35 };

  const strings = [
    { a: { x: -0.05, y: 0.18 }, b: { x: 1.05, y: 0.42 }, pull: 0.14, width: 1.4, alpha: 0.45 },
    { a: { x: -0.08, y: 0.72 }, b: { x: 1.08, y: 0.28 }, pull: 0.2, width: 2.1, alpha: 0.75 },
    { a: { x: 0.15, y: -0.05 }, b: { x: 0.82, y: 1.08 }, pull: 0.12, width: 1.15, alpha: 0.32 },
    { a: { x: 0.05, y: 0.92 }, b: { x: 0.95, y: 0.55 }, pull: 0.16, width: 1.25, alpha: 0.4 }
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const drift = scrollY * 0.00035;
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;

    strings.forEach(function (s, i) {
      const ax = s.a.x * width;
      const ay = (s.a.y + drift * (i % 2 === 0 ? 1 : -0.6)) * height;
      const bx = s.b.x * width;
      const by = (s.b.y + drift * (i % 2 === 0 ? -0.5 : 0.8)) * height;

      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const cx = mx + (mouse.x * width - mx) * s.pull;
      const cy = my + (mouse.y * height - my) * s.pull;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx, cy, bx, by);
      ctx.strokeStyle = "rgba(180, 130, 255, " + s.alpha + ")";
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(155, 92, 255, 0.85)";
      ctx.shadowBlur = i === 1 ? 22 : 14;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.fillStyle = "rgba(220, 190, 255, " + Math.min(1, s.alpha + 0.15) + ")";
      ctx.shadowColor = "rgba(155, 92, 255, 0.9)";
      ctx.shadowBlur = 12;
      ctx.arc(cx, cy, i === 1 ? 2.8 : 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function tick() {
    draw();
    raf = window.requestAnimationFrame(tick);
  }

  function onPointerMove(e) {
    mouse.tx = e.clientX / width;
    mouse.ty = e.clientY / height;
  }

  function onScroll() {
    scrollY = window.scrollY || 0;
    if (reduceMotion || !isFinePointer) draw();
  }

  resize();
  mouse.x = 0.55;
  mouse.y = 0.35;
  mouse.tx = mouse.x;
  mouse.ty = mouse.y;
  draw();

  window.addEventListener("resize", function () {
    resize();
    draw();
  });
  window.addEventListener("scroll", onScroll, { passive: true });

  if (!reduceMotion && isFinePointer) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    raf = window.requestAnimationFrame(tick);
  }
})();
