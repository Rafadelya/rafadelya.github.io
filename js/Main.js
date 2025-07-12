// main.js — инициализация языка и взаимодействие

document.addEventListener('DOMContentLoaded', () => {
  const defaultLang = localStorage.getItem('preferredLang') || 'en';
  loadLang(defaultLang);

  // Назначаем обработчики всем флаг-кнопкам
  document.querySelectorAll('.lang-flag').forEach(btn => {
    const lang = Array.from(btn.classList).find(c => c.startsWith('lang-') && c.length === 7)?.slice(5);
    btn.addEventListener('click', () => {
      if (!lang) return;
      loadLang(lang);
      localStorage.setItem('preferredLang', lang);
      document.querySelectorAll('.lang-flag').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  // При загрузке страницы выделяем активную кнопку
  document.querySelectorAll('.lang-flag').forEach(btn => {
    if (btn.classList.contains('lang-' + defaultLang)) {
      btn.classList.add('selected');
    }
  });
});

// === Neon Custom Cursor ===
// Удалено: document.body.classList.add('neon-cursor');
// Удалено: const neonCursor = document.getElementById('neon-cursor');
// Удалено: обработчики mousemove, mouseenter, mouseleave для neonCursor

// === Parallax Effect ===
window.addEventListener('scroll', () => {
  const parallaxEls = document.querySelectorAll('.parallax');
  parallaxEls.forEach((el, i) => {
    const speed = 0.2 + i * 0.1;
    el.style.transform = `translateY(${window.scrollY * speed}px)`;
  });
});

// === Glitch Animation for Title (random shift) ===
const glitchTitle = document.querySelector('.glitch');
if (glitchTitle) {
  setInterval(() => {
    glitchTitle.style.transform = `translate(${Math.random()*4-2}px, ${Math.random()*2-1}px) skew(${Math.random()*2-1}deg)`;
  }, 120);
}

// === Animated Gradient Dynamic (optional, for .neon-bg) ===
// Already handled by CSS, but you can add more JS-driven effects here if needed.

// Neon Slogan: Star Dust Animation
window.addEventListener('DOMContentLoaded', () => {
  const slogan = document.querySelector('.neon-slogan .wave');
  if (slogan) {
    const text = slogan.textContent;
    slogan.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      span.className = 'dust';
      span.style.animationDelay = (0.03 * i + 0.2) + 's';
      slogan.appendChild(span);
    }
  }
});

// Дуэт-переключатель
window.addEventListener('DOMContentLoaded', () => {
  const intuitionBtn = document.getElementById('intuition-btn');
  const logicBtn = document.getElementById('logic-btn');
  const intuitionSide = document.getElementById('intuition-side');
  const logicSide = document.getElementById('logic-side');
  if (!intuitionBtn || !logicBtn || !intuitionSide || !logicSide) return;
  intuitionBtn.addEventListener('click', () => {
    intuitionBtn.classList.add('active');
    logicBtn.classList.remove('active');
    intuitionSide.style.opacity = '1';
    intuitionSide.style.zIndex = '10';
    logicSide.style.opacity = '0';
    logicSide.style.zIndex = '0';
  });
  logicBtn.addEventListener('click', () => {
    logicBtn.classList.add('active');
    intuitionBtn.classList.remove('active');
    logicSide.style.opacity = '1';
    logicSide.style.zIndex = '10';
    intuitionSide.style.opacity = '0';
    intuitionSide.style.zIndex = '0';
  });
});

// === Mobile language flag switch ===
const mobileLangFlag = document.getElementById('mobileLangFlag');
if (mobileLangFlag) {
  const flags = [
    { code: 'ru', emoji: '🇷🇺' },
    { code: 'en', emoji: '🇬🇧' },
    { code: 'de', emoji: '🇩🇪' },
    { code: 'fr', emoji: '🇫🇷' }
  ];
  let current = 0;
  function setLang(idx) {
    current = idx;
    mobileLangFlag.textContent = flags[current].emoji;
    document.body.setAttribute('data-lang', flags[current].code);
    if (typeof window.loadLang === 'function') window.loadLang(flags[current].code);
  }
  mobileLangFlag.addEventListener('click', () => {
    setLang((current + 1) % flags.length);
  });
  // Показывать только на мобильных
  function updateFlagVisibility() {
    if (window.innerWidth <= 600) {
      mobileLangFlag.style.display = 'flex';
    } else {
      mobileLangFlag.style.display = 'none';
    }
  }
  window.addEventListener('resize', updateFlagVisibility);
  updateFlagVisibility();
  setLang(0);
}

// === Mobile burger menu ===
const mobileBurger = document.getElementById('mobileBurger');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileBurger && mobileMenu) {
  function openMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }
  mobileBurger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  mobileMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target === mobileMenu) closeMenu();
  });
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && e.target !== mobileBurger) closeMenu();
  });
  // Показывать бургер только на мобильных
  function updateBurgerVisibility() {
    if (window.innerWidth <= 600) {
      mobileBurger.style.display = 'flex';
    } else {
      mobileBurger.style.display = 'none';
      closeMenu();
    }
  }
  window.addEventListener('resize', updateBurgerVisibility);
  updateBurgerVisibility();
}
// === Mobile language flag in menu ===
const mobileLangFlagMenu = document.getElementById('mobileLangFlagMenu');
if (mobileLangFlagMenu) {
  const flags = [
    { code: 'ru', emoji: '🇷🇺' },
    { code: 'en', emoji: '🇬🇧' },
    { code: 'de', emoji: '🇩🇪' },
    { code: 'fr', emoji: '🇫🇷' }
  ];
  let current = 0;
  function setLang(idx) {
    current = idx;
    mobileLangFlagMenu.textContent = flags[current].emoji;
    document.body.setAttribute('data-lang', flags[current].code);
    if (typeof window.loadLang === 'function') window.loadLang(flags[current].code);
  }
  mobileLangFlagMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    setLang((current + 1) % flags.length);
  });
  setLang(0);
}