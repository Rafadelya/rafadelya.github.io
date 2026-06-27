/* Blizko — minimal interactions */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth-scroll for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  // Subtle reveal on scroll
  var revealEls = document.querySelectorAll(
    '.section-label, .h2, .lede, .display, .fade-prose p, .timecard, .feature, .preview-window, .preview-caption, .philosophy-grid p, .editorial-line, .editorial-cite, .col-left, .col-right, .prose, .pullquote, .join-form'
  );

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    revealEls.forEach(function (el, index) {
      el.classList.add('reveal');
      el.style.setProperty('--i', index);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Canvas grain overlay
  (function () {
    var overlay = document.querySelector('.grain-overlay');
    if (!overlay) return;
    var canvas = document.createElement('canvas');
    overlay.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var w, h;
    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    function resize() {
      w = canvas.width = canvas.offsetWidth || window.innerWidth;
      h = canvas.height = canvas.offsetHeight || window.innerHeight;
      draw();
    }

    function draw() {
      var imageData = ctx.createImageData(w, h);
      var data = imageData.data;
      for (var i = 0; i < data.length; i += 4) {
        var v = Math.random() * 255;
        data[i] = isDark ? v : 0;
        data[i + 1] = isDark ? v : 0;
        data[i + 2] = isDark ? v : 0;
        data[i + 3] = v;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    if (prefersReducedMotion) {
      resize();
      window.addEventListener('resize', resize);
    } else {
      function loop() {
        draw();
        requestAnimationFrame(loop);
      }
      resize();
      loop();
      window.addEventListener('resize', resize);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      isDark = e.matches;
    });
  })();

  // Join form
  var form = document.getElementById('joinForm');
  var status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var value = (input && input.value || '').trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      status.classList.remove('success', 'error');
      if (!ok) {
        status.textContent = 'Пожалуйста, введите корректный email.';
        status.classList.add('error');
        return;
      }
      status.textContent = 'Вы в списке. Мы напишем, когда откроемся.';
      status.classList.add('success');
      input.value = '';
    });
  }
})();
