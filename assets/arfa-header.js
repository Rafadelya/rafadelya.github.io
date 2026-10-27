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

