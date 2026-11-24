(() => {
  const messages = {
    ios: 'Пока нельзя скачать для iOS и iPadOS, но мы скоро исправим.',
    googlePlay: 'Пока нельзя скачать из Google Play, мы это скоро исправим. Пока можете скачать из RuStore.'
  };

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
      notice.innerHTML = '<span class="store-notice__icon" aria-hidden="true">i</span><span class="store-notice__text"></span><button class="store-notice__close" type="button" aria-label="Закрыть">&times;</button>';
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
    show(messages[trigger.dataset.storeNotice] || messages.ios);
  });
})();
