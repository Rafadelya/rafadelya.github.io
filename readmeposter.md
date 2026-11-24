# README Poster

## Публикация: полный порядок

1. Создайте файл поста в нужной языковой папке:
- `blog/ru/posts/`
- `blog/en/posts/`
- `blog/de/posts/`
- `blog/fr/posts/`
2. Заполните `front matter` (см. ниже).
3. Проверьте, что `permalink` уникальный и ведет на правильный язык.
4. Добавьте карточку поста в `_data/blog_posts.yml` в соответствующую языковую секцию.
5. Если есть переводы, создайте версии поста на других языках.
6. Обновите языковые ссылки внутри шапки поста (если пост не на layout и имеет кастомный HTML).
7. Проверьте пост локально:
- десктоп;
- мобильный вид;
- светлая тема;
- тёмная тема.
8. Проверьте нижнюю навигацию (`prev_post_url` / `next_post_url`).
9. После проверки публикуйте изменения.

## Где создавать посты

- Путь для русских markdown-постов: `blog/ru/posts/`
- Layout поста: `layout: post`
- Пример permalink: `/blog/ru/posts/my-post.html`

## Структура по языкам

- RU: `blog/ru/posts/...` и список в `_data/blog_posts.yml -> ru`
- EN: `blog/en/posts/...` и список в `_data/blog_posts.yml -> en`
- DE: `blog/de/posts/...` и список в `_data/blog_posts.yml -> de`
- FR: `blog/fr/posts/...` и список в `_data/blog_posts.yml -> fr`

Для каждого языка:
- свой `title`;
- свой `excerpt` в `_data/blog_posts.yml`;
- свой URL в карточке;
- свой контент поста.

## Минимальный front matter

```yaml
---
title: "Заголовок поста"
date: 2026-04-30
category: "Категория"
tags:
  - тег1
  - тег2
prev_post_url: /blog/ru/posts/previous-post.html
next_post_url: /blog/ru/posts/next-post.html
lang: ru
layout: post
permalink: /blog/ru/posts/my-post.html
---
```

## Front matter для других языков

### Английский
```yaml
lang: en
permalink: /blog/en/posts/my-post.html
```

### Немецкий
```yaml
lang: de
permalink: /blog/de/posts/my-post.html
```

### Французский
```yaml
lang: fr
permalink: /blog/fr/posts/my-post.html
```

## Важно по текущему шаблону

- Если `reading_time` не задан, минуты чтения считаются автоматически.
- Для нижнего блока хэштегов указывайте `tags`.
- Для кнопок навигации указывайте `prev_post_url` и `next_post_url` (можно оставить пустым).
- Для обычных изображений используйте `class="post-image"` (сохраняет исходные пропорции).
- Если нужен фиксированный кадр, добавляйте `post-image-fixed`.

## Как добавить пост в список блога

Файл: `_data/blog_posts.yml`

В нужной языковой секции добавьте элемент:

```yaml
ru:
  - date: "2026-04-30"
    title: "Заголовок поста"
    excerpt: "Краткое описание поста для карточки."
    url: /blog/ru/posts/my-post.html
```

Аналогично для `en`, `de`, `fr`.

## Как работать с переводами одного поста

Рекомендуемый порядок:

1. Сначала подготовьте RU-версию как базовую.
2. Скопируйте в `en/de/fr` и переведите:
- `title`
- `subtitle` (если есть)
- текст поста
- `tags` (можно локализовывать)
3. Проверьте, что у каждой версии:
- правильный `lang`;
- правильный `permalink`;
- карточка добавлена в соответствующую секцию `_data/blog_posts.yml`.
4. Проверьте, что в языковых версиях одинаковая логика навигации между постами (при необходимости разные `prev/next` для каждого языка).

## Навигация между постами

- `prev_post_url` - ссылка на предыдущий пост.
- `next_post_url` - ссылка на следующий пост.
- Если ссылки нет, оставьте пусто:

```yaml
next_post_url:
```

## Рекомендации по slug и именам

- Используйте короткие понятные slug.
- Для мультиязычных версий сохраняйте один и тот же slug, меняйте только языковую папку:
- `/blog/ru/posts/design-system.html`
- `/blog/en/posts/design-system.html`
- `/blog/de/posts/design-system.html`
- `/blog/fr/posts/design-system.html`

## Проверка перед публикацией (обязательно)

1. Открыть страницу поста напрямую по `permalink`.
2. Проверить карточку на странице блога нужного языка:
- `/blog/blog.ru.html`
- `/blog/blog.en.html`
- `/blog/blog.de.html`
- `/blog/blog.fr.html`
3. Проверить переносы слов в карточке.
4. Проверить карусель и изображения на мобильном.
5. Проверить бургер-меню на мобильном.
6. Проверить тёмную тему.
7. Проверить, что кнопки `Предыдущий пост` / `Следующий пост` ведут корректно.

## Шаблон тестового поста

```md
---
title: "Тестовый пост"
date: 2026-04-30
category: "Тест"
tags:
  - markdown
  - тест
  - дизайн
prev_post_url: /blog/ru/posts/marketing/name_changing/index.html
next_post_url:
lang: ru
layout: post
permalink: /blog/ru/posts/test-post.html
---

# Тестовый пост

Это проверка markdown-поста в Jekyll.

## Что проверяем

- что markdown компилируется;
- что permalink работает;
- что пост можно добавить в список блога.

Если эта страница открылась по адресу `/blog/ru/posts/test-post.html`, значит пайплайн работает.

> Дизайн - это не украшение интерфейса, а способ уменьшить когнитивную нагрузку и ускорить принятие решений.

## Одиночное изображение

<div class="media-container">
  <div class="image-container">
    <img src="/blog/ru/posts/marketing/name_changing/do.png" alt="До редизайна" class="post-image post-image-fixed">
    <div class="image-caption">
      <p>Пример одного изображения в markdown-посте</p>
    </div>
  </div>
</div>

## Галерея

<div class="media-container">
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="image-container">
      <img src="/blog/ru/posts/marketing/name_changing/do.png" alt="До" class="post-image">
      <div class="image-caption">
        <p>До</p>
      </div>
    </div>
    <div class="image-container">
      <img src="/blog/ru/posts/marketing/name_changing/posle.png" alt="После" class="post-image">
      <div class="image-caption">
        <p>После</p>
      </div>
    </div>
    <div class="image-container">
      <img src="/blog/ru/posts/design/DesignDebt.png" alt="Третий пример" class="post-image">
      <div class="image-caption">
        <p>Третий пример</p>
      </div>
    </div>
  </div>
</div>

## Листаемая галерея

<div class="media-container">
  <div class="carousel-container">
    <div class="carousel-wrapper">
      <div class="carousel-track" id="carouselTrack">
        <div class="carousel-slide">
          <img src="/blog/ru/posts/design/2-post/Cats/purple_cat.png" alt="Кот 1" class="carousel-image">
        </div>
        <div class="carousel-slide">
          <img src="/blog/ru/posts/design/2-post/Cats/flower_cat.png" alt="Кот 2" class="carousel-image">
        </div>
        <div class="carousel-slide">
          <img src="/blog/ru/posts/design/2-post/Cats/developer_cat.png" alt="Кот 3" class="carousel-image">
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
      <p id="carouselCaption">Листаемая карусель с котами</p>
    </div>
  </div>
</div>
```

## Чеклист перед публикацией

- Проверить `permalink`.
- Проверить ссылки `prev_post_url` / `next_post_url`.
- Проверить отображение в светлой и тёмной теме.
- Проверить мобилку (карусель и меню).
- Добавить пост в `_data/blog_posts.yml`.
