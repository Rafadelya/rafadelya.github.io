// i18n.js — простой движок локализации

const translations = {};
let animatedWordInterval = null;
let animatedWords = [];
let animatedIndex = 0;

async function loadLang(lang) {
  const res = await fetch(`lang/${lang}.json`);
  if (!res.ok) return;
  translations[lang] = await res.json();
  applyLang(lang);
  localStorage.setItem('preferredLang', lang);
}

function applyLang(lang) {
  const t = translations[lang];
  if (!t) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerHTML = t[key];
  });

  // --- Animated word support ---
  document.querySelectorAll('[data-i18n-animated]').forEach(el => {
    const key = el.getAttribute('data-i18n-animated');
    if (Array.isArray(t[key])) {
      animatedWords = t[key];
      animatedIndex = 0;
      el.textContent = animatedWords[0];
      el.style.opacity = 1;
      if (animatedWordInterval) clearInterval(animatedWordInterval);
      animatedWordInterval = setInterval(() => {
        el.style.opacity = 0;
        setTimeout(() => {
          animatedIndex = (animatedIndex + 1) % animatedWords.length;
          el.textContent = animatedWords[animatedIndex];
          el.style.opacity = 1;
        }, 500);
      }, 2200);
    }
  });
}

// Ensure i18n does not interfere with custom cursor or parallax
// No changes needed unless you dynamically add .parallax or .neon-cursor classes

window.loadLang = loadLang;
window.applyLang = applyLang;

m