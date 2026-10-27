(() => {
      const btn = document.getElementById('siteMenuBtn');
      const drawer = document.getElementById('siteMenuDrawer');
      const overlay = document.getElementById('siteMenuOverlay');
      const close = document.getElementById('siteMenuClose');
      if (!btn || !drawer || !overlay || !close) return;
      const setOpen = (open) => {
        document.body.classList.toggle('site-menu-open', open);
        btn.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
      };
      btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
      overlay.addEventListener('click', () => setOpen(false));
      close.addEventListener('click', () => setOpen(false));
      drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
      window.addEventListener('resize', () => { if (window.innerWidth > 850) setOpen(false); });
    })();

(() => {
    const root = document.querySelector('[data-carousel]');
    if (!root) return;
    const stage = root.querySelector('[data-stage]');
    const items = Array.from(root.querySelectorAll('.carousel-item'));
    const title = root.querySelector('[data-current-title]');
    const kind = root.querySelector('[data-current-kind]');
    const description = root.querySelector('[data-current-description]');
    const count = root.querySelector('[data-count]');
    const progress = root.querySelector('[data-progress]');
    const pauseButton = root.querySelector('[data-pause]');
    const currentLink = root.querySelector('[data-current-link]');
    const catalogGrid = document.querySelector('[data-catalog-grid]');
    const catalogSearch = document.querySelector('[data-catalog-search]');
    const catalogResult = document.querySelector('[data-catalog-result]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const links = Object.fromEntries(items.map(item => [item.dataset.title, item.dataset.link]));
    const lang = (document.documentElement.lang || 'ru').toLowerCase().slice(0,2);
    const locale = lang === 'ru' ? 'ru' : lang === 'de' ? 'de' : lang === 'fr' ? 'fr' : 'en';
    const t = {
      ru: { features:'Возможности приложения', publisher:'Проект Арфы', open:'Подробнее', empty:'Не нашлось приложения по этому запросу.', play:'Пуск', pause:'Пауза', app:'приложение', apps:'приложения', noApp:'Не нашлось приложения по этому запросу.' },
      en: { features:'App features', publisher:'Arfa Project', open:'Details', empty:'No app found for this query.', play:'Play', pause:'Pause', app:'app', apps:'apps', noApp:'No app found for this query.' },
      de: { features:'App-Funktionen', publisher:'Arfa Projekt', open:'Details', empty:'Keine App für diese Suche gefunden.', play:'Start', pause:'Pause', app:'App', apps:'Apps', noApp:'Keine App für diese Suche gefunden.' },
      fr: { features:'Fonctionnalités de l’app', publisher:'Projet Arfa', open:'Détails', empty:'Aucune app trouvée pour cette recherche.', play:'Lecture', pause:'Pause', app:'app', apps:'apps', noApp:'Aucune app trouvée pour cette recherche.' }
    }[locale];
    const appInfoByCategory = {
      ru: {
        auto: { subtitle: 'Автомобиль под контролем', features: ['Уход', 'Расходы', 'Напоминания'], asset: 'car' },
        organize: { subtitle: 'Планы и заметки в одном месте', features: ['Задачи', 'Заметки', 'Локальные данные'], asset: '../assets/AppIcon~todoolico.png' },
        city: { subtitle: 'Городские прогулки с историями', features: ['Маршруты', 'Истории', 'Город'], asset: '../assets/adiguide/1.jpg' },
        money: { subtitle: 'Денежные договорённости без неловкости', features: ['Долги', 'Расчёты', 'Напоминания'], asset: '../assets/Forseta/Форсета_Logo.png' }
      },
      en: {
        auto: { subtitle: 'Car under control', features: ['Care', 'Expenses', 'Reminders'], asset: 'car' },
        organize: { subtitle: 'Plans and notes in one place', features: ['Tasks', 'Notes', 'Local data'], asset: '../assets/AppIcon~todoolico.png' },
        city: { subtitle: 'City walks with stories', features: ['Routes', 'Stories', 'City'], asset: '../assets/adiguide/1.jpg' },
        money: { subtitle: 'Money agreements without awkwardness', features: ['Debts', 'Settlements', 'Reminders'], asset: '../assets/Forseta/Forseta_Logo.png' }
      },
      de: {
        auto: { subtitle: 'Auto unter Kontrolle', features: ['Pflege', 'Kosten', 'Erinnerungen'], asset: 'car' },
        organize: { subtitle: 'Pläne und Notizen an einem Ort', features: ['Aufgaben', 'Notizen', 'Lokale Daten'], asset: '../assets/AppIcon~todoolico.png' },
        city: { subtitle: 'Stadtspaziergänge mit Geschichten', features: ['Routen', 'Geschichten', 'Stadt'], asset: '../assets/adiguide/1.jpg' },
        money: { subtitle: 'Geldabsprachen ohne Unbehagen', features: ['Schulden', 'Abrechnungen', 'Erinnerungen'], asset: '../assets/Forseta/Forseta_Logo.png' }
      },
      fr: {
        auto: { subtitle: 'Voiture sous contrôle', features: ['Entretien', 'Dépenses', 'Rappels'], asset: 'car' },
        organize: { subtitle: 'Plans et notes au même endroit', features: ['Tâches', 'Notes', 'Données locales'], asset: '../assets/AppIcon~todoolico.png' },
        city: { subtitle: 'Balades urbaines avec histoires', features: ['Itinéraires', 'Histoires', 'Ville'], asset: '../assets/adiguide/1.jpg' },
        money: { subtitle: 'Accords d’argent sans gêne', features: ['Dettes', 'Règlements', 'Rappels'], asset: '../assets/Forseta/Forseta_Logo.png' }
      }
    }[locale];
    const cardClasses = { auto: 'store-card--car', organize: 'store-card--todo', city: 'store-card--adi', money: 'store-card--forseta' };
    const catalogCards = [];
    const storeInfo = {};
    items.forEach(item => { storeInfo[item.dataset.title] = appInfoByCategory[item.dataset.category]; });
    items.forEach((item, index) => {
      const info = storeInfo[item.dataset.title];
      const card = document.createElement('article');
      card.className = `store-card ${cardClasses[item.dataset.category]}`;
      card.dataset.category = item.dataset.category;
      card.dataset.searchText = `${item.dataset.title} ${item.dataset.kind} ${item.dataset.description} ${info.features.join(' ')}`.toLocaleLowerCase(locale);

      const media = document.createElement('div'); media.className = 'store-card-media';
      const number = document.createElement('span'); number.className = 'store-card-index'; number.textContent = String(index + 1).padStart(2, '0');
      const icon = document.createElement('span'); icon.className = 'store-app-icon';
      if (info.asset === 'car') {
        const emoji = document.createElement('span'); emoji.className = 'car-emoji'; emoji.setAttribute('aria-hidden', 'true'); emoji.textContent = '🚗'; icon.append(emoji);
      } else {
        const image = document.createElement('img'); image.src = info.asset; image.alt = item.dataset.title; image.loading = 'lazy';
        if (item.dataset.category === 'money') image.classList.add('contain');
        icon.append(image);
      }
      media.append(number, icon);

      const details = document.createElement('div'); details.className = 'store-card-info';
      const category = document.createElement('span'); category.className = 'store-card-category'; category.textContent = item.dataset.kind.split(' · ')[0];
      const titleEl = document.createElement('h3'); titleEl.textContent = item.dataset.title;
      const subtitle = document.createElement('p'); subtitle.className = 'store-card-subtitle'; subtitle.textContent = info.subtitle;
      const description = document.createElement('p'); description.className = 'store-card-description'; description.textContent = item.dataset.description;
      const features = document.createElement('div'); features.className = 'store-features'; features.setAttribute('aria-label', t.features);
      info.features.forEach(feature => { const chip = document.createElement('span'); chip.textContent = feature; features.append(chip); });
      const bottom = document.createElement('div'); bottom.className = 'store-card-bottom';
      const publisher = document.createElement('span'); publisher.className = 'store-publisher'; publisher.textContent = t.publisher;
      const open = document.createElement('a'); open.className = 'store-open'; open.href = `app-details-alternative.html?app=${encodeURIComponent(item.dataset.title)}`; open.innerHTML = `${t.open} <span aria-hidden="true">↗</span>`;
      bottom.append(publisher, open);
      details.append(category, titleEl, subtitle, description, features, bottom);
      card.append(media, details);
      catalogGrid.append(card);
      catalogCards.push(card);
    });
    let selectedCategory = 'all';
    function filterCatalog() {
      const query = catalogSearch.value.trim().toLocaleLowerCase(locale);
      let visibleCount = 0;
      catalogCards.forEach(tile => {
        const visible = (selectedCategory === 'all' || tile.dataset.category === selectedCategory) && (!query || tile.dataset.searchText.includes(query));
        tile.hidden = !visible;
        if (visible) visibleCount++;
      });
      catalogResult.textContent = `${visibleCount} ${visibleCount === 1 ? t.app : t.apps}`;
      let empty = catalogGrid.querySelector('.catalog-empty');
      if (!visibleCount && !empty) { empty = document.createElement('p'); empty.className = 'catalog-empty'; empty.textContent = t.noApp; catalogGrid.append(empty); }
      if (visibleCount && empty) empty.remove();
    }
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      selectedCategory = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(filter => { const active = filter === button; filter.classList.toggle('is-active', active); filter.setAttribute('aria-pressed', String(active)); });
      filterCatalog();
    }));
    catalogSearch.addEventListener('input', filterCatalog);
    filterCatalog();
    let active = 0, timer = 0, paused = reduced.matches, hoverPaused = false, pointerStart = null;
    const mod = (n, total) => (n + total) % total;
    function paint() {
      const compact = innerWidth < 620;
      const step = compact ? Math.min(152, innerWidth * .39) : Math.min(258, innerWidth * .19);
      items.forEach((item, index) => {
        let offset = index - active;
        if (offset > items.length / 2) offset -= items.length;
        if (offset < -items.length / 2) offset += items.length;
        const distance = Math.abs(offset);
        item.classList.toggle('is-active', offset === 0);
        item.style.zIndex = String(items.length - distance);
        item.style.pointerEvents = distance > 3 ? 'none' : 'auto';
        item.style.opacity = distance > 3 ? '0' : String(1 - distance * .18);
        item.style.filter = distance > 2 ? 'saturate(.78)' : 'none';
        item.style.transform = `translate(-50%,0) translate3d(${offset * step}px,${distance * 8}px,${-distance * 42}px) rotateY(${-offset * 13}deg) scale(${1 - distance * .085})`;
        item.querySelector('.carousel-card').setAttribute('aria-current', String(offset === 0));
        item.querySelector('.carousel-card').tabIndex = distance > 3 ? -1 : 0;
        item.setAttribute('aria-hidden', String(distance > 3));
      });
      const item = items[active];
      title.textContent = item.dataset.title;
      kind.textContent = item.dataset.kind;
      description.textContent = item.dataset.description;
      currentLink.href = `app-details-alternative.html?app=${encodeURIComponent(item.dataset.title)}`;
      currentLink.innerHTML = `${t.open} <span aria-hidden="true">↗</span>`;
      count.textContent = `${String(active + 1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
      progress.style.transform = `scaleX(${(active + 1) / items.length})`;
      pauseButton.setAttribute('aria-pressed', String(paused));
      pauseButton.textContent = paused ? t.play : t.pause;
    }
    function go(n) { active = mod(n, items.length); paint(); }
    function stop() { clearInterval(timer); timer = 0; }
    function start() { stop(); if (!paused && !hoverPaused && !reduced.matches) timer = setInterval(() => go(active + 1), 4600); }
    root.querySelector('[data-prev]').addEventListener('click', () => { go(active - 1); start(); });
    root.querySelector('[data-next]').addEventListener('click', () => { go(active + 1); start(); });
    pauseButton.addEventListener('click', () => { paused = !paused; paint(); start(); });
    items.forEach((item, index) => item.querySelector('.carousel-card').addEventListener('click', () => { go(index); start(); }));
    root.addEventListener('mouseenter', () => { hoverPaused = true; stop(); });
    root.addEventListener('mouseleave', () => { hoverPaused = false; start(); });
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', () => setTimeout(() => { if (!root.contains(document.activeElement)) start(); }, 0));
    root.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1); start(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1); start(); }
    });
    stage.addEventListener('pointerdown', event => { pointerStart = event.clientX; stage.setPointerCapture(event.pointerId); });
    stage.addEventListener('pointerup', event => {
      if (pointerStart === null) return;
      const delta = event.clientX - pointerStart;
      if (Math.abs(delta) > 36) { go(active + (delta < 0 ? 1 : -1)); start(); }
      pointerStart = null;
    });
    stage.addEventListener('pointercancel', () => { pointerStart = null; });
    window.addEventListener('resize', paint, { passive:true });
    reduced.addEventListener?.('change', event => { if (event.matches) { paused = true; stop(); paint(); } });
    paint(); start();
  })();
