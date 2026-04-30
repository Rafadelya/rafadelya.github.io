const CHECKLIST_COOKIE_NAME = 'design_debt_checklist_v1';

function setFont(type) {
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;
  if (type === 'pixel') {
    postContent.style.fontFamily = "'Press Start 2P', monospace";
  } else {
    postContent.style.fontFamily = "'Manrope', sans-serif";
  }
  document.querySelectorAll('.font-pixel').forEach((btn) => {
    btn.classList.toggle('active', type === 'pixel');
  });
  document.querySelectorAll('.font-manrope').forEach((btn) => {
    btn.classList.toggle('active', type === 'manrope');
  });
}
function setTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    body.classList.remove('light-theme');
  } else {
    body.classList.add('light-theme');
    body.classList.remove('dark-theme');
  }
  document.querySelectorAll('.theme-dark').forEach((btn) => {
    btn.classList.toggle('active', theme === 'dark');
  });
  document.querySelectorAll('.theme-light').forEach((btn) => {
    btn.classList.toggle('active', theme === 'light');
  });
}

function setMobileMenuState(isOpen) {
  const body = document.body;
  const menuBtn = document.getElementById('mobileMenuBtn');
  const menuDrawer = document.getElementById('mobileMenuDrawer');
  if (!menuBtn || !menuDrawer) return;

  body.classList.toggle('mobile-menu-open', isOpen);
  menuBtn.setAttribute('aria-expanded', String(isOpen));
  menuDrawer.setAttribute('aria-hidden', String(!isOpen));
}

function toggleMobileMenu(forceState) {
  const shouldOpen = typeof forceState === 'boolean'
    ? forceState
    : !document.body.classList.contains('mobile-menu-open');
  setMobileMenuState(shouldOpen);
}

function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const menuClose = document.getElementById('mobileMenuClose');
  const menuOverlay = document.getElementById('mobileMenuOverlay');
  const menuDrawer = document.getElementById('mobileMenuDrawer');
  if (!menuBtn || !menuOverlay || !menuDrawer) return;
  if (menuBtn.dataset.mobileMenuBound === 'true') return;
  menuBtn.dataset.mobileMenuBound = 'true';

  menuBtn.addEventListener('click', () => toggleMobileMenu());
  menuOverlay.addEventListener('click', () => toggleMobileMenu(false));
  if (menuClose) {
    menuClose.addEventListener('click', () => toggleMobileMenu(false));
  }

  menuDrawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleMobileMenu(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      toggleMobileMenu(false);
    }
  });
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
}

function getCookie(name) {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  return '';
}

function updateChecklistRowState(checkbox) {
  const row = checkbox.closest('.check-item');
  if (!row) return;
  if (checkbox.checked) {
    row.classList.add('is-checked');
  } else {
    row.classList.remove('is-checked');
  }
}

function saveChecklistState() {
  const checkedIds = Array.from(document.querySelectorAll('#designDebtChecklist .check-item-input:checked'))
    .map((el) => el.id);
  setCookie(CHECKLIST_COOKIE_NAME, JSON.stringify(checkedIds), 365);
}

function loadChecklistState() {
  const raw = getCookie(CHECKLIST_COOKIE_NAME);
  if (!raw) return;

  try {
    const checkedIds = JSON.parse(raw);
    if (!Array.isArray(checkedIds)) return;
    checkedIds.forEach((id) => {
      const box = document.getElementById(id);
      if (box) box.checked = true;
    });
  } catch (err) {
    return;
  }
}

function initDesignDebtChecklist() {
  const checklist = document.getElementById('designDebtChecklist');
  if (!checklist) return;

  loadChecklistState();
  const boxes = checklist.querySelectorAll('.check-item-input');
  boxes.forEach((box) => {
    updateChecklistRowState(box);
    box.addEventListener('change', () => {
      updateChecklistRowState(box);
      saveChecklistState();
    });
  });
}

function bootDesignDebtPage() {
  initDesignDebtChecklist();
  initMobileMenu();
}

bootDesignDebtPage();
