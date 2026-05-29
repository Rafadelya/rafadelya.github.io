(function () {
  function initMobileHeader() {
    var header = document.querySelector('.glass-header');
    if (!header || header.dataset.mobileHeaderReady === 'true') return;

    var nav = header.querySelector('nav');
    var langGroup = Array.prototype.find.call(header.children, function (child) {
      return child !== nav && child.querySelector && child.querySelector('.lang-flag');
    });
    if (!nav && !langGroup) return;

    header.dataset.mobileHeaderReady = 'true';
    header.classList.add('mobile-header-enabled');

    var button = document.createElement('button');
    button.className = 'mobile-header-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Открыть меню');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span></span><span></span><span></span>';

    var overlay = document.createElement('div');
    overlay.className = 'mobile-header-overlay';

    var drawer = document.createElement('aside');
    drawer.className = 'mobile-header-drawer t-dropdown';
    drawer.setAttribute('data-origin', 'top-right');
    drawer.setAttribute('aria-hidden', 'true');

    var title = document.createElement('div');
    title.className = 'mobile-header-title';
    title.textContent = 'Меню';
    drawer.appendChild(title);

    if (nav) {
      var menuNav = document.createElement('nav');
      menuNav.className = 'mobile-header-links';
      Array.prototype.forEach.call(nav.querySelectorAll('a'), function (link) {
        menuNav.appendChild(link.cloneNode(true));
      });
      drawer.appendChild(menuNav);
    }

    if (langGroup) {
      var langWrap = document.createElement('div');
      langWrap.className = 'mobile-header-langs';
      Array.prototype.forEach.call(langGroup.querySelectorAll('a, button'), function (item) {
        langWrap.appendChild(item.cloneNode(true));
      });
      drawer.appendChild(langWrap);
    }

    var closeTimer = null;

    function getCloseDelay() {
      var raw = getComputedStyle(document.documentElement).getPropertyValue('--dropdown-close-dur');
      return parseFloat(raw) || 150;
    }

    function setOpen(isOpen) {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      if (isOpen) {
        document.body.classList.add('mobile-header-open');
        drawer.classList.remove('is-closing');
        drawer.classList.add('is-open');
      } else {
        drawer.classList.remove('is-open');
        drawer.classList.add('is-closing');
        closeTimer = setTimeout(function () {
          drawer.classList.remove('is-closing');
          document.body.classList.remove('mobile-header-open');
        }, getCloseDelay());
      }

      button.setAttribute('aria-expanded', String(isOpen));
      button.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      drawer.setAttribute('aria-hidden', String(!isOpen));
    }

    button.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('mobile-header-open'));
    });
    overlay.addEventListener('click', function () {
      setOpen(false);
    });
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1100) setOpen(false);
    });

    header.appendChild(button);
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileHeader);
  } else {
    initMobileHeader();
  }
})();
