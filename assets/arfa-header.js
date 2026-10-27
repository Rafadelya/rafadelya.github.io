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
  function initLegoReveal() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var nodes = document.querySelectorAll('section:not(:first-of-type), .card, .photo-block, .social-item, .contact-item, .milestone, .value-card, article');
    if (!nodes.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (el, i) {
      if (el.classList.contains('reveal')) return;
      el.classList.add('arfa-reveal');
      el.style.transitionDelay = (i % 5) * 0.04 + 's';
      io.observe(el);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLegoReveal);
  } else {
    initLegoReveal();
  }
})();
