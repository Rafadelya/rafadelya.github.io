/**
 * Boots home-stage visuals: Grainy Image.
 * See THIRD_PARTY_NOTICES.md for licenses.
 */
(function () {
  function sizeGrainy() {
    const el = document.querySelector("grainy-image.arfa-grainy-stage");
    if (!el) return;
    const w = Math.max(320, Math.round(window.innerWidth));
    const h = Math.max(320, Math.round(window.innerHeight));
    el.setAttribute("width", String(w));
    el.setAttribute("height", String(h));
  }

  function boot() {
    sizeGrainy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeGrainy, 120);
    },
    { passive: true },
  );
})();
