// post-interactive.js — JavaScript для интерактивных элементов постов

// ===== АУДИО ПЛЕЕР =====
let audioPlayer = null;
let isAudioPlaying = false;
let isAudioMuted = false;

function initAudioPlayer() {
    audioPlayer = document.getElementById('audioPlayer');
    if (!audioPlayer) return;

    // Обработчики событий
    audioPlayer.addEventListener('loadedmetadata', updateAudioDuration);
    audioPlayer.addEventListener('timeupdate', updateAudioProgress);
    audioPlayer.addEventListener('ended', audioEnded);
    
    // Клик по прогресс-бару
    const progressBar = document.querySelector('.audio-progress .progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', seekAudio);
    }
}

function toggleAudio() {
    if (!audioPlayer) return;
    
    const playBtn = document.querySelector('.play-btn i');
    
    if (isAudioPlaying) {
        audioPlayer.pause();
        playBtn.className = 'fas fa-play';
        isAudioPlaying = false;
    } else {
        audioPlayer.play();
        playBtn.className = 'fas fa-pause';
        isAudioPlaying = true;
    }
}

function toggleMute() {
    if (!audioPlayer) return;
    
    const volumeBtn = document.querySelector('.volume-btn i');
    
    if (isAudioMuted) {
        audioPlayer.muted = false;
        volumeBtn.className = 'fas fa-volume-up';
        isAudioMuted = false;
    } else {
        audioPlayer.muted = true;
        volumeBtn.className = 'fas fa-volume-mute';
        isAudioMuted = true;
    }
}

function updateAudioProgress() {
    if (!audioPlayer) return;
    
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    const progressFill = document.getElementById('audioProgress');
    const currentTimeSpan = document.getElementById('currentTime');
    
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    
    if (currentTimeSpan) {
        currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    }
}

function updateAudioDuration() {
    if (!audioPlayer) return;
    
    const totalTimeSpan = document.getElementById('totalTime');
    if (totalTimeSpan) {
        totalTimeSpan.textContent = formatTime(audioPlayer.duration);
    }
}

function seekAudio(e) {
    if (!audioPlayer) return;
    
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * audioPlayer.duration;
    
    audioPlayer.currentTime = seekTime;
}

function audioEnded() {
    const playBtn = document.querySelector('.play-btn i');
    if (playBtn) {
        playBtn.className = 'fas fa-play';
    }
    isAudioPlaying = false;
}

// ===== ВИДЕО ПЛЕЕР =====
let videoPlayer = null;
let isVideoPlaying = false;
let isVideoMuted = false;

function initVideoPlayer() {
    videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) return;

    // Обработчики событий
    videoPlayer.addEventListener('loadedmetadata', updateVideoDuration);
    videoPlayer.addEventListener('timeupdate', updateVideoProgress);
    videoPlayer.addEventListener('ended', videoEnded);
    videoPlayer.addEventListener('play', videoStarted);
    videoPlayer.addEventListener('pause', videoPaused);
    
    // Клик по прогресс-бару
    const videoProgressBar = document.querySelector('.video-progress .progress-bar');
    if (videoProgressBar) {
        videoProgressBar.addEventListener('click', seekVideo);
    }
}

function toggleVideo() {
    if (!videoPlayer) return;
    
    const playIcon = document.getElementById('videoPlayIcon');
    const overlay = document.getElementById('videoOverlay');
    
    if (isVideoPlaying) {
        videoPlayer.pause();
        if (playIcon) playIcon.className = 'fas fa-play';
        if (overlay) overlay.style.display = 'flex';
        isVideoPlaying = false;
    } else {
        videoPlayer.play();
        if (playIcon) playIcon.className = 'fas fa-pause';
        if (overlay) overlay.style.display = 'none';
        isVideoPlaying = true;
    }
}

function toggleVideoMute() {
    if (!videoPlayer) return;
    
    const volumeIcon = document.getElementById('videoVolumeIcon');
    
    if (isVideoMuted) {
        videoPlayer.muted = false;
        if (volumeIcon) volumeIcon.className = 'fas fa-volume-up';
        isVideoMuted = false;
    } else {
        videoPlayer.muted = true;
        if (volumeIcon) volumeIcon.className = 'fas fa-volume-mute';
        isVideoMuted = true;
    }
}

function updateVideoProgress() {
    if (!videoPlayer) return;
    
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    const progressFill = document.getElementById('videoProgress');
    const currentTimeSpan = document.getElementById('videoCurrentTime');
    
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    
    if (currentTimeSpan) {
        currentTimeSpan.textContent = formatTime(videoPlayer.currentTime);
    }
}

function updateVideoDuration() {
    if (!videoPlayer) return;
    
    const totalTimeSpan = document.getElementById('videoTotalTime');
    if (totalTimeSpan) {
        totalTimeSpan.textContent = formatTime(videoPlayer.duration);
    }
}

function seekVideo(e) {
    if (!videoPlayer) return;
    
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * videoPlayer.duration;
    
    videoPlayer.currentTime = seekTime;
}

function videoStarted() {
    const overlay = document.getElementById('videoOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    isVideoPlaying = true;
}

function videoPaused() {
    const overlay = document.getElementById('videoOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
    isVideoPlaying = false;
}

function videoEnded() {
    const playIcon = document.getElementById('videoPlayIcon');
    const overlay = document.getElementById('videoOverlay');
    
    if (playIcon) playIcon.className = 'fas fa-play';
    if (overlay) overlay.style.display = 'flex';
    isVideoPlaying = false;
}

function toggleFullscreen() {
    if (!videoPlayer) return;
    
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        videoPlayer.requestFullscreen();
    }
}

// ===== КАРУСЕЛЬ =====
let currentSlide = 0;
let totalSlides = 0;
const slideCaptions = [
    'Пиксельный дизайн в современном вебе',
    'Ретро-эстетика в цифровом мире',
    'Уникальный пользовательский опыт'
];

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    totalSlides = track.children.length;
    updateCarousel();
}

function nextSlide() {
    if (totalSlides <= 0) return;
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

function prevSlide() {
    if (totalSlides <= 0) return;
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
}

function goToSlide(index) {
    if (totalSlides <= 0) return;
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    const caption = document.getElementById('carouselCaption');
    
    if (track) {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    // Обновляем точки
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    // Обновляем подпись
    if (caption && slideCaptions[currentSlide]) {
        caption.textContent = slideCaptions[currentSlide];
    }
}

// ===== ИНТЕРАКТИВНЫЕ ЭЛЕМЕНТЫ =====
function generatePixelCSS() {
    const pixelBox = document.getElementById('pixelBox');
    const generatedCode = document.getElementById('generatedCode');
    
    if (!pixelBox || !generatedCode) return;
    
    // Генерируем случайные стили
    const colors = ['#a78bfa', '#7c3aed', '#2d014d', '#f472b6', '#10b981'];
    const borders = ['2px solid', '3px solid', '1px solid', '4px solid'];
    const shadows = ['2px 2px 0px', '4px 4px 0px', '1px 1px 0px', '3px 3px 0px'];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomBorder = borders[Math.floor(Math.random() * borders.length)];
    const randomShadow = shadows[Math.floor(Math.random() * shadows.length)];
    
    // Применяем стили к элементу
    pixelBox.style.background = randomColor;
    pixelBox.style.border = `${randomBorder} #2d014d`;
    pixelBox.style.boxShadow = `${randomShadow} #a78bfa`;
    
    // Генерируем CSS код
    const cssCode = `/* Сгенерированный пиксельный CSS */
.pixel-element {
  background: ${randomColor};
  border: ${randomBorder} #2d014d;
  box-shadow: ${randomShadow} #a78bfa;
  border-radius: 0.3em;
  padding: 1em 2em;
  font-family: 'Press Start 2P', monospace;
  color: #fff;
  transition: all 0.3s;
}

.pixel-element:hover {
  transform: scale(1.05);
  box-shadow: ${randomShadow.replace('0px', '4px')} #a78bfa;
}`;
    
    generatedCode.textContent = cssCode;
    
    // Добавляем анимацию
    pixelBox.style.animation = 'none';
    setTimeout(() => {
        pixelBox.style.animation = 'pixelPop 0.5s ease-out';
    }, 10);
}

// ===== УТИЛИТЫ =====
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    initAudioPlayer();
    initVideoPlayer();
    initCarousel();
    
    // Добавляем CSS анимацию для пиксельного эффекта
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pixelPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Автоматическое переключение карусели
    setInterval(() => {
        if (totalSlides > 0) {
            nextSlide();
        }
    }, 5000);
});

// ===== КЛАВИАТУРНЫЕ СОКРАЩЕНИЯ =====
document.addEventListener('keydown', function(e) {
    // Пробел для воспроизведения/паузы видео
    if (e.code === 'Space' && videoPlayer) {
        e.preventDefault();
        toggleVideo();
    }
    
    // Стрелки для карусели
    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
    }
    if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
    }
    
    // F для полноэкранного режима
    if (e.code === 'KeyF' && videoPlayer) {
        e.preventDefault();
        toggleFullscreen();
    }
}); 
// ===== Shared Design Debt Layer =====
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

document.addEventListener('DOMContentLoaded', () => {
  initDesignDebtChecklist();
  initMobileMenu();
});
