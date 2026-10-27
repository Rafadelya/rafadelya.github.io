(function () {
  var btn = document.querySelector('[data-arfa-menu-btn]');
  var drawer = document.getElementById('arfaDrawer');
  var overlay = document.getElementById('arfaOverlay');
  if (!btn || !drawer || !overlay) return;

  function setOpen(open) {
    drawer.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('arfa-menu-open', open);
  }

  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });

  overlay.addEventListener('click', function () {
    setOpen(false);
  });

  drawer.querySelectorAll('a, [data-arfa-menu-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      setOpen(false);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) setOpen(false);
  });
})();

(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof document.startViewTransition === 'function') return;
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('javascript:') === 0) return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    document.body.classList.add('arfa-leaving');
    setTimeout(function () { location.href = url.href; }, 220);
  });
})();
