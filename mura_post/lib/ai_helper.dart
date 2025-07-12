import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;

// Chat Message Model
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

// AI Helper Class
class AIHelper {
  static const String _ollamaUrl = 'http://localhost:11434';

  // Проверка работы Ollama
  static Future<bool> isOllamaRunning() async {
    try {
      print('Checking Ollama at: $_ollamaUrl/api/tags');
      final response = await http.get(
        Uri.parse('$_ollamaUrl/api/tags'),
        headers: {'Content-Type': 'application/json'},
      );
      print('Ollama response status: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      print('Ollama check error: $e');
      return false;
    }
  }

  // Получение доступных моделей
  static Future<List<String>> getAvailableModels() async {
    try {
      final response = await http.get(
        Uri.parse('$_ollamaUrl/api/tags'),
        headers: {'Content-Type': 'application/json'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final models = data['models'] as List;
        return models.map((model) => model['name'] as String).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Генерация улучшенных предложений
  static Future<List<String>> getSmartSuggestions(String currentContent) async {
    final suggestions = <String>[];
    if (!currentContent.contains('<h1')) {
      suggestions.add('Добавить главный заголовок');
    }
    if (!currentContent.contains('<img')) {
      suggestions.add('Добавить изображения');
    }
    if (!currentContent.contains('<ul') && !currentContent.contains('<ol')) {
      suggestions.add('Добавить списки');
    }
    if (!currentContent.contains('<blockquote')) {
      suggestions.add('Добавить цитаты');
    }
    return suggestions;
  }

  // Стриминговый метод для AI чата
  static Future<void> generateContentStream({
    required String prompt,
    required String template,
    required void Function(String partial, bool done) onPartial,
  }) async {
    try {
      // Логируем prompt и HTML
      print('AI PROMPT:');
      print(prompt);
      print('AI HTML (template):');
      print(template.length > 1000 ? template.substring(0, 1000) + '... [truncated]' : template);

      String optimizedHtml = HTMLStructureAnalyzer.createOptimizedHTMLForAI(template);
      final templateAnalysis = await analyzeTemplateStructure(template);
      bool isEditingRequest = AIHelper.isEditingRequest(prompt);
      String enhancedPrompt;
      if (isEditingRequest) {
        enhancedPrompt = '''
Ты — AI-ассистент для редактирования HTML-контента блога.
ВАЖНО: Ты редактируешь только содержимое поста, НЕ весь HTML-файл!
ПРАВИЛА РЕДАКТИРОВАНИЯ:
- НЕ изменяй структуру HTML-файла
- НЕ изменяй CSS стили, классы, id
- НЕ изменяй шрифты, цвета, размеры
- НЕ изменяй head, meta, title, script теги
- НЕ изменяй layout, навигацию, footer
- Редактируй ТОЛЬКО содержимое поста (текст, заголовки, изображения внутри поста)
- Сохраняй  стиль оформления:
  * Цветовая палитра: ${templateAnalysis['styles']['colors'].join(', ')}
  * Шрифты: ${templateAnalysis['styles']['fonts'].join(', ')}
  * Классы Tailwind CSS
  * Медиа-элементы: ${templateAnalysis['elements'].keys.where((k) => templateAnalysis['elements'][k].isNotEmpty).join(', ')}
  * Интерактивные элементы
<BEGIN_POST_CONTENT>
$optimizedHtml
<END_POST_CONTENT>
Запрос пользователя: $prompt
Если редактируешь, верни ТОЛЬКО отредактированное содержимое поста (без HTML-структуры).
Если не уверен — спроси уточняющий вопрос.
''';
      } else {
        enhancedPrompt = '''
Ты — AI-ассистент для работы с HTML-контентом.
Если пользователь задаёт обычный вопрос, отвечай как дружелюбный чат-бот.
Если пользователь просит изменить HTML - объясни, что нужно уточнить, что именно изменить.
Вопрос пользователя: $prompt
Отвечай кратко и по делу.
''';
      }

      final client = http.Client();
      final request = http.Request('POST', Uri.parse('$_ollamaUrl/api/generate'));
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'model': 'deepseek-coder:6.7b',
        'prompt': enhancedPrompt,
        'stream': true,
      });
      final responseFuture = client.send(request);
      final response = await Future.any([
        responseFuture,
        Future.delayed(const Duration(seconds: 10), () => throw TimeoutException('AI timeout')),
      ]);
      String buffer = '';
      String fullResponse = '';
      await for (var chunk in response.stream.transform(utf8.decoder)) {
        buffer += chunk;
        for (var line in buffer.split(RegExp(r'\r?\n'))) {
          if (line.trim().isEmpty) continue;
          try {
            final data = jsonDecode(line);
            if (data.containsKey('response')) {
              final responseText = data['response'].toString();
              fullResponse += responseText;
              onPartial(responseText, false);
            }
            if (data['done'] == true) {
              onPartial('', true);
              return;
            }
          } catch (e) {
            // Игнорируем ошибки парсинга отдельных строк
            print('Ошибка парсинга JSON: $e');
          }
        }
        buffer = buffer.endsWith('\n') ? '' : buffer.split(RegExp(r'\r?\n')).last;
      }
      onPartial('', true);
    } on TimeoutException {
      onPartial('❌ Ошибка: AI не ответил вовремя (таймаут 10 секунд)', true);
    } catch (e) {
      onPartial('❌ Ошибка: $e', true);
    }
  }

  // Проверка, является ли запрос редактированием
  static bool isEditingRequest(String prompt) {
    final editingKeywords = [
      'измени', 'изменить', 'добавь', 'добавить', 'удали', 'удалить',
      'замени', 'заменить', 'обнови', 'обновить', 'редактируй', 'редактировать',
      'change', 'add', 'remove', 'edit', 'update', 'modify',
      'заголовок', 'текст', 'картинка', 'изображение', 'ссылка',
      'title', 'text', 'image', 'link', 'content'
    ];
    final lowerPrompt = prompt.toLowerCase();
    return editingKeywords.any((keyword) => lowerPrompt.contains(keyword));
  }

  // Добавление маркеров редактируемого контента
  static String addContentMarkers(String html) {
    // Проверяем, есть ли уже маркеры
    if (html.contains('<!-- BEGIN POST CONTENT -->')) {
      return html;
    }
    // Ищем подходящие места для добавления маркеров
    final patterns = [
      RegExp(r'(<article[^>]*>)(.*?)(</article>)', dotAll: true),
      RegExp(r'(<main[^>]*>)(.*?)(</main>)', dotAll: true),
      RegExp(r'(<div[^>]*class="[^"]*content[^"]*"[^>]*>)(.*?)(</div>)', dotAll: true),
      RegExp(r'(<div[^>]*class="[^"]*post[^"]*"[^>]*>)(.*?)(</div>)', dotAll: true),
    ];
    for (final pattern in patterns) {
      final match = pattern.firstMatch(html);
      if (match != null) {
        final openTag = match.group(1)!;
        final content = match.group(2)!;
        return html.replaceRange(
          match.start + openTag.length,
          match.start + openTag.length + content.length,
          '''
    <!-- BEGIN POST CONTENT -->
    $content
    <!-- END POST CONTENT -->
  ''',
        );
      }
    }
    // Если не нашли подходящих тегов, добавляем маркеры в body
    final bodyMatch = RegExp(r'(<body[^>]*>)(.*?)(</body>)', dotAll: true).firstMatch(html);
    if (bodyMatch != null) {
      final openTag = bodyMatch.group(1)!;
      final content = bodyMatch.group(2)!;
      return html.replaceRange(
        bodyMatch.start + openTag.length,
        bodyMatch.start + openTag.length + content.length,
        '''
  <!-- BEGIN POST CONTENT -->
  $content
  <!-- END POST CONTENT -->
''',
      );
    }
    return html; // Fallback
  }

  // Расширенный анализ HTML-структуры
  static Future<Map<String, dynamic>> analyzeTemplateStructure(String html) async {
    final structure = <String, dynamic>{
      'elements': <String, dynamic>{},
      'styles': <String, dynamic>{},
      'layout': <String, dynamic>{},
    };
    // Анализ мультимедийных элементов
    structure['elements']!['audio'] = _findAudioElements(html);
    structure['elements']!['video'] = _findVideoElements(html);
    structure['elements']!['images'] = _findImageElements(html);
    structure['elements']!['carousels'] = _findCarouselElements(html);
    // Анализ структурных блоков
    structure['elements']!['lists'] = _findListElements(html);
    structure['elements']!['quotes'] = _findQuoteElements(html);
    // Анализ стилей и цветовой палитры
    structure['styles']!['colors'] = _extractColors(html);
    structure['styles']!['fonts'] = _extractFonts(html);
    return structure;
  }

  // Поиск аудиоэлементов
  static List<String> _findAudioElements(String html) {
    final matches = RegExp(r'<audio.*?</audio>', dotAll: true).allMatches(html);
    return matches.map((m) => m.group(0)!).toList();
  }

  // Поиск видеоэлементов
  static List<String> _findVideoElements(String html) {
    final matches = RegExp(r'<video.*?</video>', dotAll: true).allMatches(html);
    return matches.map((m) => m.group(0)!).toList();
  }

  // Поиск изображений
  static List<String> _findImageElements(String html) {
    final matches = RegExp(r'<img.*?>').allMatches(html);
    return matches.map((m) => m.group(0)!).toList();
  }

  // Поиск каруселей
  static List<String> _findCarouselElements(String html) {
    final carouselPatterns = [
      RegExp(r'<div.*?class=".*?carousel.*?".*?</div>', dotAll: true),
      RegExp(r'<div.*?id=".*?carousel.*?".*?</div>', dotAll: true),
    ];
    final result = <String>[];
    for (var pattern in carouselPatterns) {
      result.addAll(pattern.allMatches(html).map((m) => m.group(0)!));
    }
    return result;
  }

  // Поиск списков
  static List<String> _findListElements(String html) {
    final matches = RegExp(r'<ul.*?</ul>|<ol.*?</ol>', dotAll: true).allMatches(html);
    return matches.map((m) => m.group(0)!).toList();
  }

  // Поиск цитат
  static List<String> _findQuoteElements(String html) {
    final matches = RegExp(r'<blockquote.*?</blockquote>', dotAll: true).allMatches(html);
    return matches.map((m) => m.group(0)!).toList();
  }

  // Извлечение цветовой палитры
  static List<String> _extractColors(String html) {
    final colorRegex = RegExp(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})');
    final matches = colorRegex.allMatches(html);
    return matches.map((m) => m.group(0)!).toSet().toList();
  }

  // Извлечение шрифтов
  static List<String> _extractFonts(String html) {
    final fontRegex = RegExp("font-family:\\s*['\"](.*?)['\"]");
    final matches = fontRegex.allMatches(html);
    return matches.map((m) => m.group(1)!).toSet().toList();
  }

  // Возвращает список блоков, которые можно вставить в шаблон
  static Future<List<Map<String, String>>> getInsertableBlocks(String html) async {
    final structure = await analyzeTemplateStructure(html);
    final available = <Map<String, String>>[];
    if ((structure['elements']?['images'] as List).isEmpty) {
      available.add({
        'label': 'Добавить изображение',
        'html': '<img src="https://via.placeholder.com/600x400 " alt="Placeholder Image" />'
      });
    }
    if ((structure['elements']?['lists'] as List).isEmpty) {
      available.add({
        'label': 'Добавить список',
        'html': '''
<ul>
  <li>Пункт 1</li>
  <li>Пункт 2</li>
  <li>Пункт 3</li>
</ul>'''
      });
    }
    if ((structure['elements']?['quotes'] as List).isEmpty) {
      available.add({
        'label': 'Добавить цитату',
        'html': '''
<blockquote>
  <p>Это пример вдохновляющей цитаты.</p>
</blockquote>'''
      });
    }
    if ((structure['elements']?['video'] as List).isEmpty) {
      available.add({
        'label': 'Добавить видео',
        'html': '''
<video controls width="100%">
  <source src="video.mp4" type="video/mp4">
  Ваш браузер не поддерживает тег видео.
</video>'''
      });
    }
    if ((structure['elements']?['audio'] as List).isEmpty) {
      available.add({
        'label': 'Добавить аудио',
        'html': '''
<audio controls>
  <source src="audio.mp3" type="audio/mpeg">
  Ваш браузер не поддерживает аудио.
</audio>'''
      });
    }
    return available;
  }

  // Возвращает список изменяемых блоков с их позицией и типом
  static List<Map<String, dynamic>> extractEditableBlocks(String html) {
    final blocks = <Map<String, dynamic>>[];
    // Текстовые блоки
    final textPattern = RegExp(r'<p.*?>(.*?)</p>', dotAll: true);
    for (final match in textPattern.allMatches(html)) {
      blocks.add({
        'type': 'text',
        'content': match.group(1),
        'full': match.group(0),
        'start': match.start,
        'end': match.end,
      });
    }
    // Изображения
    final imgPattern = RegExp(r'<img.*?>', dotAll: true);
    for (final match in imgPattern.allMatches(html)) {
      blocks.add({
        'type': 'image',
        'content': match.group(0),
        'full': match.group(0),
        'start': match.start,
        'end': match.end,
      });
    }
    // Видео
    final videoPattern = RegExp(r'<video.*?>.*?</video>', dotAll: true);
    for (final match in videoPattern.allMatches(html)) {
      blocks.add({
        'type': 'video',
        'content': match.group(0),
        'full': match.group(0),
        'start': match.start,
        'end': match.end,
      });
    }
    // Аудио
    final audioPattern = RegExp(r'<audio.*?>.*?</audio>', dotAll: true);
    for (final match in audioPattern.allMatches(html)) {
      blocks.add({
        'type': 'audio',
        'content': match.group(0),
        'full': match.group(0),
        'start': match.start,
        'end': match.end,
      });
    }
    // Карусели (пример для div с классом carousel)
    final carouselPattern = RegExp(r'<div[^>]*class="[^"]*carousel[^"]*"[^>]*>.*?</div>', dotAll: true);
    for (final match in carouselPattern.allMatches(html)) {
      blocks.add({
        'type': 'carousel',
        'content': match.group(0),
        'full': match.group(0),
        'start': match.start,
        'end': match.end,
      });
    }
    return blocks;
  }
}

// HTML Structure Analyzer
class HTMLStructureAnalyzer {
  // Анализирует структуру HTML и возвращает редактируемую часть
  static Map<String, dynamic> analyzeStructure(String html) {
    final result = {
      'header': '',
      'footer': '',
      'connections': '', // scripts, styles, meta
      'editable': '',
      'hasMarkers': false,
    };
    // Проверяем наличие маркеров
    if (html.contains('<!-- BEGIN POST CONTENT -->')) {
      result['hasMarkers'] = true;
      final markersMatch = RegExp(r'<!-- BEGIN POST CONTENT -->(.*?)<!-- END POST CONTENT -->', dotAll: true).firstMatch(html);
      if (markersMatch != null) {
        result['editable'] = markersMatch.group(1)?.trim() ?? '';
      }
      return result;
    }
    // Извлекаем head (все подключения)
    final headMatch = RegExp(r'<head[^>]*>(.*?)</head>', dotAll: true).firstMatch(html);
    if (headMatch != null) {
      result['connections'] = headMatch.group(1)?.trim() ?? '';
    }
    // Извлекаем header
    final headerPatterns = [
      RegExp(r'<header[^>]*>(.*?)</header>', dotAll: true),
      RegExp(r'<div[^>]*class="[^"]*header[^"]*"[^>]*>(.*?)</div>', dotAll: true),
      RegExp(r'<div[^>]*id="[^"]*header[^"]*"[^>]*>(.*?)</div>', dotAll: true),
      RegExp(r'<nav[^>]*>(.*?)</nav>', dotAll: true),
    ];
    for (final pattern in headerPatterns) {
      final match = pattern.firstMatch(html);
      if (match != null) {
        result['header'] = match.group(1)?.trim() ?? '';
        break;
      }
    }
    // Извлекаем footer
    final footerPatterns = [
      RegExp(r'<footer[^>]*>(.*?)</footer>', dotAll: true),
      RegExp(r'<div[^>]*class="[^"]*footer[^"]*"[^>]*>(.*?)</div>', dotAll: true),
      RegExp(r'<div[^>]*id="[^"]*footer[^"]*"[^>]*>(.*?)</div>', dotAll: true),
    ];
    for (final pattern in footerPatterns) {
      final match = pattern.firstMatch(html);
      if (match != null) {
        result['footer'] = match.group(1)?.trim() ?? '';
        break;
      }
    }
    // Извлекаем редактируемую часть (все, что не header/footer/connections)
    String editableContent = html;
    // Убираем head
    if (headMatch != null) {
      editableContent = editableContent.replaceAll(headMatch.group(0)!, '');
    }
    // Убираем header
    for (final pattern in headerPatterns) {
      final match = pattern.firstMatch(editableContent);
      if (match != null) {
        editableContent = editableContent.replaceAll(match.group(0)!, '');
        break;
      }
    }
    // Убираем footer
    for (final pattern in footerPatterns) {
      final match = pattern.firstMatch(editableContent);
      if (match != null) {
        editableContent = editableContent.replaceAll(match.group(0)!, '');
        break;
      }
    }
    // Очищаем от лишних тегов, оставляем только содержимое body
    editableContent = editableContent
        .replaceAll(RegExp(r'<!DOCTYPE[^>]*>'), '')
        .replaceAll(RegExp(r'<html[^>]*>'), '')
        .replaceAll(RegExp(r'</html>'), '')
        .replaceAll(RegExp(r'<body[^>]*>'), '')
        .replaceAll(RegExp(r'</body>'), '')
        .trim();
    result['editable'] = editableContent;
    return result;
  }

  // Создает оптимизированный HTML для AI (только редактируемая часть)
  static String createOptimizedHTMLForAI(String html) {
    final structure = analyzeStructure(html);
    if (structure['hasMarkers']) {
      // Если есть маркеры, возвращаем только содержимое между ними
      return structure['editable'];
    }
    // Создаем минимальную структуру для AI
    return '''
<!-- РЕДАКТИРУЕМАЯ ЧАСТЬ ПОСТА -->
${structure['editable']}
<!-- КОНЕЦ РЕДАКТИРУЕМОЙ ЧАСТИ -->
''';
  }

  // Вставляет отредактированное содержимое обратно в полный HTML
  static String insertEditedContent(String originalHtml, String editedContent) {
    final structure = analyzeStructure(originalHtml);
    if (structure['hasMarkers']) {
      // Если есть маркеры, заменяем содержимое между ними
      return originalHtml.replaceAll(
        RegExp(r'<!-- BEGIN POST CONTENT -->.*?<!-- END POST CONTENT -->', dotAll: true),
        '''<!-- BEGIN POST CONTENT -->
$editedContent
<!-- END POST CONTENT -->''',
      );
    }
    // Иначе заменяем всю редактируемую часть
    String result = originalHtml;
    // Убираем head
    final headMatch = RegExp(r'<head[^>]*>.*?</head>', dotAll: true).firstMatch(originalHtml);
    if (headMatch != null) {
      result = result.replaceAll(headMatch.group(0)!, '');
    }
    // Убираем header
    final headerPatterns = [
      RegExp(r'<header[^>]*>.*?</header>', dotAll: true),
      RegExp(r'<div[^>]*class="[^"]*header[^"]*"[^>]*>.*?</div>', dotAll: true),
      RegExp(r'<div[^>]*id="[^"]*header[^"]*"[^>]*>.*?</div>', dotAll: true),
      RegExp(r'<nav[^>]*>.*?</nav>', dotAll: true),
    ];
    for (final pattern in headerPatterns) {
      final match = pattern.firstMatch(result);
      if (match != null) {
        result = result.replaceAll(match.group(0)!, '');
        break;
      }
    }
    // Убираем footer
    final footerPatterns = [
      RegExp(r'<footer[^>]*>.*?</footer>', dotAll: true),
      RegExp(r'<div[^>]*class="[^"]*footer[^"]*"[^>]*>.*?</div>', dotAll: true),
      RegExp(r'<div[^>]*id="[^"]*footer[^"]*"[^>]*>.*?</div>', dotAll: true),
    ];
    for (final pattern in footerPatterns) {
      final match = pattern.firstMatch(result);
      if (match != null) {
        result = result.replaceAll(match.group(0)!, '');
        break;
      }
    }
    // Очищаем от лишних тегов
    result = result
        .replaceAll(RegExp(r'<!DOCTYPE[^>]*>'), '')
        .replaceAll(RegExp(r'<html[^>]*>'), '')
        .replaceAll(RegExp(r'</html>'), '')
        .replaceAll(RegExp(r'<body[^>]*>'), '')
        .replaceAll(RegExp(r'</body>'), '')
        .trim();
    // Заменяем на отредактированное содержимое
    result = originalHtml.replaceAll(result, editedContent);
    return result;
  }
}