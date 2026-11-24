# PDF VC для фестиваля

В этой папке есть два print-шаблона:

- `Rafael_vc_pdf.html`
- `Adelya_vc_pdf.html`

И два итоговых файла после генерации:

- `Rafael_vc.pdf`
- `Adelya_vc.pdf`

## Фото

Для обновления фото положите файлы так:

- `фото Рафаэль/photo.jpg`
- `Фото Аделя/photo.jpg`

Также поддерживаются `photo.png` и `photo.jpeg`.

Сейчас шаблоны дополнительно умеют использовать уже лежащие в папке файлы:

- `photo_Rafael.jpg`
- `photo_Adelya.jpg`

## Генерация PDF

Из корня репозитория:

```bash
node VC/generate-pdf.mjs
```

Скрипт использует Playwright через `npx`, устанавливает Chromium при необходимости и пересобирает оба PDF.
