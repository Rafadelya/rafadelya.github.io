(() => {
  const messages = {
    ru: {
      ios: 'Пока нельзя скачать для iOS и iPadOS, но мы скоро исправим.',
      googlePlay: 'Пока нельзя скачать из Google Play, мы это скоро исправим. Пока можете скачать из RuStore.',
      close: 'Закрыть'
    },
    en: {
      ios: 'The iOS and iPadOS version is not available yet, but we are fixing it soon.',
      googlePlay: 'Google Play download is not available yet, we are fixing it soon. For now you can download from RuStore.',
      close: 'Close'
    },
    de: {
      ios: 'Die iOS- und iPadOS-Version ist noch nicht verfügbar, wir beheben das bald.',
      googlePlay: 'Der Download über Google Play ist noch nicht verfügbar, wir beheben das bald. Bis dahin kannst du über RuStore herunterladen.',
      close: 'Schließen'
    },
    fr: {
      ios: 'La version iOS et iPadOS n’est pas encore disponible, nous y travaillons.',
      googlePlay: 'Le téléchargement via Google Play n’est pas encore disponible, nous y travaillons. En attendant, tu peux télécharger depuis RuStore.',
      close: 'Fermer'
    }
  };
  const lang = (document.documentElement.lang || 'ru').toLowerCase().slice(0, 2);
  const t = messages[lang] || messages.ru;

  let notice;
  let timer;

  function hide() {
    if (notice) notice.classList.remove('is-visible');
  }

  function show(text) {
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'store-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      notice.innerHTML = '<span class="store-notice__icon" aria-hidden="true">i</span><span class="store-notice__text"></span><button class="store-notice__close" type="button">&times;</button>';
      notice.querySelector('.store-notice__close').setAttribute('aria-label', t.close);
      notice.querySelector('.store-notice__close').addEventListener('click', hide);
      document.body.append(notice);
    }
    notice.querySelector('.store-notice__text').textContent = text;
    notice.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(hide, 6000);
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hide();
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-store-notice]');
    if (!trigger) return;
    event.preventDefault();
    show(t[trigger.dataset.storeNotice] || t.ios);
  });
})();
