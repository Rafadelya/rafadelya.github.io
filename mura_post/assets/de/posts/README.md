# Шаблон постов блога R&A Studio

## Структура файлов

```
blog/ru/posts/
├── sample-post.html          # Пример поста с медиа элементами
├── post-style.css           # Стили для постов
├── post-interactive.js      # JavaScript для интерактивности
├── assets/                  # Медиа файлы
│   ├── sample-audio.mp3     # Аудио файл
│   ├── sample-video.mp4     # Видео файл
│   ├── video-poster.jpg     # Постер для видео
│   ├── sample-image-1.jpg   # Изображения для галереи
│   ├── sample-image-2.jpg
│   └── sample-image-3.jpg
└── README.md               # Этот файл
```

## Как создать новый пост

### 1. Создание HTML файла

1. Скопируйте `sample-post.html` и переименуйте в нужное название
2. Обновите метаданные в `<head>`:
   - `<title>` - заголовок страницы
   - `<meta>` теги для SEO

### 2. Обновление контента

#### Заголовок поста
```html
<h1 class="post-title text-4xl md:text-5xl font-bold mb-6">
  НАЗВАНИЕ ВАШЕГО ПОСТА
</h1>
```

#### Метаданные
```html
<div class="post-meta mb-4">
  <span class="blog-pixel-meta">2025-01-15</span>
  <span class="blog-pixel-meta mx-2">•</span>
  <span class="blog-pixel-meta">5 мин чтения</span>
  <span class="blog-pixel-meta mx-2">•</span>
  <span class="blog-pixel-meta">Категория</span>
</div>
```

#### Подзаголовок
```html
<p class="post-subtitle text-lg md:text-xl text-center max-w-2xl mx-auto">
  Краткое описание поста
</p>
```

### 3. Структура контента

#### Обычный текст
```html
<p class="post-text">
  Ваш текст здесь...
</p>
```

#### Заголовки разделов
```html
<h2 class="post-heading">ЗАГОЛОВОК РАЗДЕЛА</h2>
```

#### Выделенные блоки
```html
<div class="post-highlight">
  <p class="highlight-text">
    Важная цитата или выделенный текст
  </p>
</div>
```

#### Списки
```html
<div class="post-list">
  <div class="list-item">
    <span class="list-marker">■</span>
    <span class="list-text">Элемент списка</span>
  </div>
</div>
```

#### Код
```html
<div class="post-code">
  <pre class="code-block">
// Ваш код здесь
function example() {
  return "Hello World";
}</pre>
</div>
```

#### Теги
```html
<div class="post-tags mt-12">
  <span class="tag">#тег1</span>
  <span class="tag">#тег2</span>
</div>
```

### 5. Медиа элементы

#### Аудио плеер
```html
<div class="media-container audio-player-container">
  <div class="audio-player">
    <div class="audio-header">
      <div class="audio-info">
        <h3 class="audio-title">Название трека</h3>
        <p class="audio-artist">Исполнитель</p>
      </div>
      <div class="audio-controls">
        <button class="audio-btn play-btn" onclick="toggleAudio()">
          <i class="fas fa-play"></i>
        </button>
        <button class="audio-btn volume-btn" onclick="toggleMute()">
          <i class="fas fa-volume-up"></i>
        </button>
      </div>
    </div>
    <div class="audio-progress">
      <div class="progress-bar">
        <div class="progress-fill" id="audioProgress"></div>
      </div>
      <div class="time-display">
        <span id="currentTime">0:00</span>
        <span>/</span>
        <span id="totalTime">3:45</span>
      </div>
    </div>
    <audio id="audioPlayer" preload="metadata">
      <source src="assets/your-audio.mp3" type="audio/mpeg">
    </audio>
  </div>
</div>
```

#### Видео плеер
```html
<div class="media-container video-player-container">
  <div class="video-player">
    <div class="video-wrapper">
      <video id="videoPlayer" poster="assets/video-poster.jpg">
        <source src="assets/your-video.mp4" type="video/mp4">
      </video>
      <div class="video-overlay" id="videoOverlay">
        <button class="play-button" onclick="toggleVideo()">
          <i class="fas fa-play"></i>
        </button>
      </div>
    </div>
    <div class="video-controls">
      <div class="video-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="videoProgress"></div>
        </div>
      </div>
      <div class="control-buttons">
        <button class="control-btn" onclick="toggleVideo()">
          <i class="fas fa-play" id="videoPlayIcon"></i>
        </button>
        <button class="control-btn" onclick="toggleVideoMute()">
          <i class="fas fa-volume-up" id="videoVolumeIcon"></i>
        </button>
        <button class="control-btn" onclick="toggleFullscreen()">
          <i class="fas fa-expand"></i>
        </button>
      </div>
      <div class="time-display">
        <span id="videoCurrentTime">0:00</span>
        <span>/</span>
        <span id="videoTotalTime">2:30</span>
      </div>
    </div>
  </div>
</div>
```

#### Одиночное изображение
```html
<div class="media-container">
  <div class="image-container">
    <img src="assets/your-image.jpg" alt="Описание" class="post-image">
    <div class="image-caption">
      <p>Подпись к изображению</p>
    </div>
  </div>
</div>
```

#### Карусель изображений
```html
<div class="media-container">
  <div class="carousel-container">
    <div class="carousel-wrapper">
      <div class="carousel-track" id="carouselTrack">
        <div class="carousel-slide">
          <img src="assets/image-1.jpg" alt="Изображение 1" class="carousel-image">
        </div>
        <div class="carousel-slide">
          <img src="assets/image-2.jpg" alt="Изображение 2" class="carousel-image">
        </div>
        <div class="carousel-slide">
          <img src="assets/image-3.jpg" alt="Изображение 3" class="carousel-image">
        </div>
      </div>
    </div>
    <div class="carousel-controls">
      <button class="carousel-btn prev-btn" onclick="prevSlide()">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="carousel-dots" id="carouselDots">
        <span class="dot active" onclick="goToSlide(0)"></span>
        <span class="dot" onclick="goToSlide(1)"></span>
        <span class="dot" onclick="goToSlide(2)"></span>
      </div>
      <button class="carousel-btn next-btn" onclick="nextSlide()">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    <div class="carousel-caption">
      <p id="carouselCaption">Подпись к карусели</p>
    </div>
  </div>
</div>
```

#### Интерактивный элемент
```html
<div class="interactive-demo">
  <div class="demo-header">
    <h3 class="demo-title">Название демо</h3>
    <button class="demo-btn" onclick="yourFunction()">Действие</button>
  </div>
  <div class="demo-content">
    <div class="demo-preview" id="demoPreview">
      <!-- Ваш интерактивный контент -->
    </div>
    <div class="demo-code">
      <pre class="code-block" id="generatedCode">
// Результат будет здесь</pre>
    </div>
  </div>
</div>
```

### 4. Навигация

Обновите ссылки в навигации:
```html
<div class="post-navigation mt-16">
  <div class="nav-links flex justify-between items-center">
    <a href="предыдущий-пост.html" class="nav-prev">
      <span class="nav-arrow">←</span>
      <span class="nav-text">Предыдущий пост</span>
    </a>
    <a href="../blog.ru.html" class="nav-back">
      <span class="nav-text">К списку постов</span>
    </a>
    <a href="следующий-пост.html" class="nav-next">
      <span class="nav-text">Следующий пост</span>
      <span class="nav-arrow">→</span>
    </a>
  </div>
</div>
```

## Стили и классы

### Основные классы
- `.post-text` - основной текст
- `.post-heading` - заголовки разделов
- `.post-highlight` - выделенные блоки
- `.post-list` - списки
- `.post-code` - блоки кода
- `.tag` - теги

### Цветовая схема
- Основной цвет: `#2d014d` (темно-фиолетовый)
- Акцентный цвет: `#a78bfa` (светло-фиолетовый)
- Текст: `#374151` (серый)
- Фон: `#fafafa` (светло-серый)

### Шрифты
- Основной: `'Press Start 2P', monospace` (пиксельный)
- Код: `'Courier New', monospace`

## Медиа файлы

### Поддерживаемые форматы
- **Аудио**: MP3, WAV, OGG
- **Видео**: MP4, WebM, OGV
- **Изображения**: JPG, PNG, GIF, WebP

### Рекомендации по файлам
- **Аудио**: Максимум 10MB, длительность до 30 минут
- **Видео**: Максимум 50MB, длительность до 10 минут
- **Изображения**: Максимум 2MB, рекомендуемое разрешение 1200x800px
- **Постеры видео**: 16:9 соотношение, 1920x1080px

### Оптимизация
- Сжимайте аудио до 128kbps
- Сжимайте видео до 720p
- Оптимизируйте изображения для веба
- Используйте WebP для изображений где возможно

## Рекомендации

1. **Длина поста**: 5-10 минут чтения
2. **Структура**: Используйте заголовки для разделения на логические части
3. **Изображения**: Добавляйте в папку `assets/` рядом с постом
4. **SEO**: Используйте описательные заголовки и мета-теги
5. **Теги**: 3-5 релевантных тегов на пост
6. **Медиа**: Размещайте медиа файлы в папке `assets/`
7. **Интерактивность**: Используйте JavaScript для создания интерактивных элементов

## Примеры использования

Смотрите `sample-post.html` для полного примера использования всех элементов дизайна. 