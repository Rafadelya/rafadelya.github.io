import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'ai_helper.dart';

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

void main() {
  runApp(const MuraPostApp());
}

class MuraPostApp extends StatelessWidget {
  const MuraPostApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mura Post Creator',
      theme: ThemeData(
        primarySwatch: Colors.purple,
        useMaterial3: true,
        fontFamily: 'Press Start 2P',
      ),
      home: const TemplateUploadScreen(),
    );
  }
}

// Interactive Editor Screen
class InteractiveEditorScreen extends StatefulWidget {
  final String htmlTemplate;
  final String cssTemplate;
  final String jsTemplate;
  final String language;

  const InteractiveEditorScreen({
    super.key,
    required this.htmlTemplate,
    required this.cssTemplate,
    required this.jsTemplate,
    required this.language,
  });

  @override
  State<InteractiveEditorScreen> createState() => _InteractiveEditorScreenState();
}

class _InteractiveEditorScreenState extends State<InteractiveEditorScreen> {
  Map<String, String> _insertionSchema = {};
  List<Map<String, dynamic>> _blocks = [];
  bool _isAnalyzing = false;
  bool _isGenerating = false;
  String? _analyzeError;
  String? _previewHtml;
  final TextEditingController _chatController = TextEditingController();
  final List<ChatMessage> _chatMessages = [];

  final Map<String, String> _defaultSchema = {
    "title": "<h1>{{TITLE}}</h1>",
    "subtitle": "<h2>{{SUBTITLE}}</h2>",
    "content": "<div>{{CONTENT}}</div>",
    "photo": "<img src='{{PHOTO_URL}}' alt=''>",
    "carousel": "<div class='carousel'>{{CAROUSEL}}</div>",
    "video": "<video src='{{VIDEO_URL}}'></video>",
    "audio": "<audio src='{{AUDIO_URL}}'></audio>"
  };

  @override
  void initState() {
    super.initState();
    _insertionSchema = Map<String, String>.from(_defaultSchema);
  }

  Future<void> _analyzeTemplate() async {
    setState(() {
      _isAnalyzing = true;
      _analyzeError = null;
    });

    // Детальный анализ HTML-шаблона
    final htmlContent = widget.htmlTemplate;
    final Map<String, String> localSchema = {};
    
    // Анализируем структуру HTML
    final List<String> foundElements = [];
    
    // Ищем все заголовки
    final titleMatches = RegExp(r'<h1[^>]*>(.*?)</h1>', dotAll: true).allMatches(htmlContent);
    if (titleMatches.isNotEmpty) {
      foundElements.add('Найдены заголовки H1: ${titleMatches.length}');
      localSchema['title'] = titleMatches.first.group(0)!;
    }
    
    final h2Matches = RegExp(r'<h2[^>]*>(.*?)</h2>', dotAll: true).allMatches(htmlContent);
    if (h2Matches.isNotEmpty) {
      foundElements.add('Найдены подзаголовки H2: ${h2Matches.length}');
      localSchema['subtitle'] = h2Matches.first.group(0)!;
    }
    
    final h3Matches = RegExp(r'<h3[^>]*>(.*?)</h3>', dotAll: true).allMatches(htmlContent);
    if (h3Matches.isNotEmpty) {
      foundElements.add('Найдены заголовки H3: ${h3Matches.length}');
      if (!localSchema.containsKey('subtitle')) {
        localSchema['subtitle'] = h3Matches.first.group(0)!;
      }
    }

    // Ищем специальные комментарии AI-EDITABLE
    final aiEditableMatches = RegExp(r'<!-- AI-EDITABLE: ([^>]+) -->', dotAll: true).allMatches(htmlContent);
    for (final match in aiEditableMatches) {
      final comment = match.group(1) ?? '';
      if (comment.contains('TITLE')) {
        foundElements.add('Найден AI-EDITABLE заголовок');
        // Ищем следующий h1 после комментария
        final afterComment = htmlContent.substring(match.end);
        final h1Match = RegExp(r'<h1[^>]*>(.*?)</h1>', dotAll: true).firstMatch(afterComment);
        if (h1Match != null) {
          localSchema['title'] = h1Match.group(0)!;
        }
      } else if (comment.contains('SUBTITLE')) {
        foundElements.add('Найден AI-EDITABLE подзаголовок');
        // Ищем следующий h2 после комментария
        final afterComment = htmlContent.substring(match.end);
        final h2Match = RegExp(r'<h2[^>]*>(.*?)</h2>', dotAll: true).firstMatch(afterComment);
        if (h2Match != null) {
          localSchema['subtitle'] = h2Match.group(0)!;
        }
      } else if (comment.contains('CONTENT')) {
        foundElements.add('Найден AI-EDITABLE контент');
        // Ищем следующий p или div после комментария
        final afterComment = htmlContent.substring(match.end);
        final pMatch = RegExp(r'<p[^>]*>(.*?)</p>', dotAll: true).firstMatch(afterComment);
        if (pMatch != null) {
          localSchema['content'] = pMatch.group(0)!;
        }
      } else if (comment.contains('PHOTO')) {
        foundElements.add('Найден AI-EDITABLE фото');
        // Ищем следующий img после комментария
        final afterComment = htmlContent.substring(match.end);
        final imgMatch = RegExp(r'<img[^>]*>', dotAll: true).firstMatch(afterComment);
        if (imgMatch != null) {
          localSchema['photo'] = imgMatch.group(0)!;
        }
      } else if (comment.contains('CAROUSEL')) {
        foundElements.add('Найден AI-EDITABLE карусель');
        // Ищем следующий div с carousel после комментария
        final afterComment = htmlContent.substring(match.end);
        final carouselMatch = RegExp(r'<div[^>]*class[^>]*carousel[^>]*>(.*?)</div>', dotAll: true).firstMatch(afterComment);
        if (carouselMatch != null) {
          localSchema['carousel'] = carouselMatch.group(0)!;
        }
      } else if (comment.contains('VIDEO')) {
        foundElements.add('Найден AI-EDITABLE видео');
        // Ищем следующий video после комментария
        final afterComment = htmlContent.substring(match.end);
        final videoMatch = RegExp(r'<video[^>]*>(.*?)</video>', dotAll: true).firstMatch(afterComment);
        if (videoMatch != null) {
          localSchema['video'] = videoMatch.group(0)!;
        }
      } else if (comment.contains('AUDIO')) {
        foundElements.add('Найден AI-EDITABLE аудио');
        // Ищем следующий audio после комментария
        final afterComment = htmlContent.substring(match.end);
        final audioMatch = RegExp(r'<audio[^>]*>(.*?)</audio>', dotAll: true).firstMatch(afterComment);
        if (audioMatch != null) {
          localSchema['audio'] = audioMatch.group(0)!;
        }
      }
    }

    // Ищем параграфы и текстовые блоки
    final paragraphMatches = RegExp(r'<p[^>]*>(.*?)</p>', dotAll: true).allMatches(htmlContent);
    if (paragraphMatches.isNotEmpty) {
      foundElements.add('Найдены параграфы: ${paragraphMatches.length}');
      localSchema['content'] = paragraphMatches.first.group(0)!;
    }
    
    // Ищем div с текстовым содержимым
    final divMatches = RegExp(r'<div[^>]*>(.*?)</div>', dotAll: true).allMatches(htmlContent);
    if (divMatches.isNotEmpty) {
      foundElements.add('Найдены div блоки: ${divMatches.length}');
      if (!localSchema.containsKey('content')) {
        // Ищем div с текстом (не только с HTML)
        for (final match in divMatches) {
          final content = match.group(1) ?? '';
          if (content.trim().isNotEmpty && !content.contains('<')) {
            localSchema['content'] = match.group(0)!;
            break;
          }
        }
      }
    }

    // Ищем изображения
    final imageMatches = RegExp(r'<img[^>]*>', dotAll: true).allMatches(htmlContent);
    if (imageMatches.isNotEmpty) {
      foundElements.add('Найдены изображения: ${imageMatches.length}');
      localSchema['photo'] = imageMatches.first.group(0)!;
    }

    // Ищем видео
    final videoMatches = RegExp(r'<video[^>]*>(.*?)</video>', dotAll: true).allMatches(htmlContent);
    if (videoMatches.isNotEmpty) {
      foundElements.add('Найдены видео: ${videoMatches.length}');
      localSchema['video'] = videoMatches.first.group(0)!;
    }

    // Ищем аудио
    final audioMatches = RegExp(r'<audio[^>]*>(.*?)</audio>', dotAll: true).allMatches(htmlContent);
    if (audioMatches.isNotEmpty) {
      foundElements.add('Найдены аудио: ${audioMatches.length}');
      localSchema['audio'] = audioMatches.first.group(0)!;
    }

    // Ищем карусели/слайдеры
    final carouselMatches = RegExp(r'<div[^>]*class[^>]*carousel[^>]*>(.*?)</div>', dotAll: true).allMatches(htmlContent);
    if (carouselMatches.isNotEmpty) {
      foundElements.add('Найдены карусели: ${carouselMatches.length}');
      localSchema['carousel'] = carouselMatches.first.group(0)!;
    }
    
    // Ищем слайдеры
    final sliderMatches = RegExp(r'<div[^>]*class[^>]*slider[^>]*>(.*?)</div>', dotAll: true).allMatches(htmlContent);
    if (sliderMatches.isNotEmpty) {
      foundElements.add('Найдены слайдеры: ${sliderMatches.length}');
      if (!localSchema.containsKey('carousel')) {
        localSchema['carousel'] = sliderMatches.first.group(0)!;
      }
    }

    // Ищем article, section, main для основного контента
    final articleMatches = RegExp(r'<article[^>]*>(.*?)</article>', dotAll: true).allMatches(htmlContent);
    if (articleMatches.isNotEmpty) {
      foundElements.add('Найдены article блоки: ${articleMatches.length}');
      if (!localSchema.containsKey('content')) {
        localSchema['content'] = articleMatches.first.group(0)!;
      }
    }
    
    final sectionMatches = RegExp(r'<section[^>]*>(.*?)</section>', dotAll: true).allMatches(htmlContent);
    if (sectionMatches.isNotEmpty) {
      foundElements.add('Найдены section блоки: ${sectionMatches.length}');
      if (!localSchema.containsKey('content')) {
        localSchema['content'] = sectionMatches.first.group(0)!;
      }
    }

    // Если нашли элементы, используем их
    if (localSchema.isNotEmpty) {
      setState(() {
        _insertionSchema = Map<String, String>.from(_defaultSchema);
        _insertionSchema.addAll(localSchema);
        _isAnalyzing = false;
      });
      
      // Показываем что найдено
      final foundText = foundElements.join('\n');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Шаблон проанализирован!\nНайдено: ${localSchema.length} типов элементов'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
        ),
      );
      
      // Показываем детали анализа
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Результат анализа шаблона'),
          content: SizedBox(
            width: 400,
            height: 300,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Найденные элементы:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...foundElements.map((element) => Text('• $element')),
                  const SizedBox(height: 16),
                  const Text('Схема вставки:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...localSchema.entries.map((entry) => Text('• ${entry.key}: ${entry.value.length} символов')),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    // Если локальный анализ не дал результатов, используем AI
    final prompt = '''
Проанализируй HTML-шаблон и найди существующие элементы для вставки контента.
Верни ТОЛЬКО JSON без дополнительного текста.

Ищи следующие элементы:
1. Заголовки (h1, h2, h3) - для title и subtitle
2. Параграфы (p) - для content  
3. Изображения (img) - для photo
4. Видео (video) - для video
5. Аудио (audio) - для audio
6. Карусели/слайдеры (div с классом carousel/slider) - для carousel

Если элемент найден, используй его HTML-структуру с плейсхолдерами.
Если элемент не найден, используй стандартную структуру.

Пример ответа:
{
  "title": "<h1 class='post-title'>{{TITLE}}</h1>",
  "subtitle": "<h2 class='post-subtitle'>{{SUBTITLE}}</h2>", 
  "content": "<p class='post-text'>{{CONTENT}}</p>",
  "photo": "<img src='{{PHOTO_URL}}' alt='' class='post-image'>",
  "carousel": "<div class='carousel'>{{CAROUSEL}}</div>",
  "video": "<video src='{{VIDEO_URL}}' controls></video>",
  "audio": "<audio src='{{AUDIO_URL}}' controls></audio>"
}

HTML шаблон:
${widget.htmlTemplate}
''';

    String aiResponse = '';
    await AIHelper.generateContentStream(
      prompt: prompt,
      template: widget.htmlTemplate,
      onPartial: (partial, done) {
        if (done) {
          try {
            // Ищем JSON в ответе
            final jsonStart = aiResponse.indexOf('{');
            final jsonEnd = aiResponse.lastIndexOf('}');
            if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
              final jsonString = aiResponse.substring(jsonStart, jsonEnd + 1);
              final Map<String, dynamic> schema = jsonDecode(jsonString);
              setState(() {
                _insertionSchema = schema.map((k, v) => MapEntry(k, v.toString()));
                _isAnalyzing = false;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Шаблон проанализирован AI!'), backgroundColor: Colors.green),
              );
            } else {
              setState(() {
                _analyzeError = 'AI не вернул корректный JSON. Используем стандартную схему.';
                _isAnalyzing = false;
              });
            }
          } catch (e) {
            setState(() {
              _analyzeError = 'Ошибка парсинга JSON: $e. Используем стандартную схему.';
              _isAnalyzing = false;
            });
          }
        } else {
          aiResponse += partial;
        }
      },
    );
  }

  void _sendMessage([String? message]) {
    final text = message ?? _chatController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _chatMessages.add(ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _isGenerating = true;
    });
    _chatController.clear();

    AIHelper.generateContentStream(
      prompt: text,
      template: widget.htmlTemplate,
      onPartial: (partial, done) {
        if (done) {
          setState(() {
            _isGenerating = false;
          });
        } else {
          setState(() {
            if (_chatMessages.isNotEmpty && !_chatMessages.last.isUser) {
              _chatMessages.last = ChatMessage(
                text: _chatMessages.last.text + partial,
                isUser: false,
                timestamp: _chatMessages.last.timestamp,
              );
            } else {
              _chatMessages.add(ChatMessage(
                text: partial,
                isUser: false,
                timestamp: DateTime.now(),
              ));
            }
          });
        }
      },
    );
  }

  void _addBlock(String type) {
    setState(() {
      _blocks.add({"type": type, "content": ""});
    });
  }

  void _removeBlock(int index) {
    setState(() {
      _blocks.removeAt(index);
    });
  }

  void _updateBlockContent(int index, String value) {
    setState(() {
      _blocks[index]["content"] = value;
    });
  }

  void _reorderBlock(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex--;
      final item = _blocks.removeAt(oldIndex);
      _blocks.insert(newIndex, item);
    });
  }

  String _generateHtmlFromBlocks() {
    String html = '';
    for (final block in _blocks) {
      final type = block["type"];
      final content = block["content"] ?? "";
      final template = _insertionSchema[type] ?? _defaultSchema[type] ?? "<div>{{CONTENT}}</div>";
      
      String blockHtml = template;
      
      switch (type) {
        case "title":
          // Заменяем содержимое h1, сохраняя атрибуты
          if (template.contains('<h1')) {
            blockHtml = template.replaceAll(RegExp(r'>.*?<'), '>{{TITLE}}<');
            blockHtml = blockHtml.replaceAll("{{TITLE}}", content);
          } else {
            blockHtml = '<h1>$content</h1>';
          }
          break;
        case "subtitle":
          // Заменяем содержимое h2/h3, сохраняя атрибуты
          if (template.contains('<h2') || template.contains('<h3')) {
            blockHtml = template.replaceAll(RegExp(r'>.*?<'), '>{{SUBTITLE}}<');
            blockHtml = blockHtml.replaceAll("{{SUBTITLE}}", content);
          } else {
            blockHtml = '<h2>$content</h2>';
          }
          break;
        case "content":
          // Заменяем содержимое p/div/article/section, сохраняя атрибуты
          if (template.contains('<p') || template.contains('<div') || 
              template.contains('<article') || template.contains('<section')) {
            blockHtml = template.replaceAll(RegExp(r'>.*?<'), '>{{CONTENT}}<');
            blockHtml = blockHtml.replaceAll("{{CONTENT}}", content);
          } else {
            blockHtml = '<p>$content</p>';
          }
          break;
        case "photo":
          // Заменяем src в img, сохраняя остальные атрибуты
          if (template.contains('<img')) {
            blockHtml = template.replaceAll(RegExp(r'src="[^"]*"'), 'src="$content"');
          } else {
            blockHtml = '<img src="$content" alt="">';
          }
          break;
        case "carousel":
          // Заменяем содержимое карусели
          if (template.contains('carousel') || template.contains('slider')) {
            blockHtml = template.replaceAll(RegExp(r'>.*?<'), '>{{CAROUSEL}}<');
            blockHtml = blockHtml.replaceAll("{{CAROUSEL}}", content);
          } else {
            blockHtml = '<div class="carousel">$content</div>';
          }
          break;
        case "video":
          // Заменяем src в video, сохраняя остальные атрибуты
          if (template.contains('<video')) {
            blockHtml = template.replaceAll(RegExp(r'src="[^"]*"'), 'src="$content"');
          } else {
            blockHtml = '<video src="$content" controls></video>';
          }
          break;
        case "audio":
          // Заменяем src в audio, сохраняя остальные атрибуты
          if (template.contains('<audio')) {
            blockHtml = template.replaceAll(RegExp(r'src="[^"]*"'), 'src="$content"');
          } else {
            blockHtml = '<audio src="$content" controls></audio>';
          }
          break;
        default:
          blockHtml = content;
      }
      
      html += blockHtml + "\n";
    }
    return html;
  }

  void _previewPost() async {
    final htmlBlocks = _generateHtmlFromBlocks();
    final bodyReg = RegExp(r'<body[^>]*>(.*?)</body>', dotAll: true);
    String fullHtml;
    final match = bodyReg.firstMatch(widget.htmlTemplate);
    if (match != null) {
      final openTag = RegExp(r'<body[^>]*>').stringMatch(match.group(0)!);
      fullHtml = widget.htmlTemplate.replaceRange(
        match.start,
        match.end,
        '$openTag\n$htmlBlocks\n</body>'
      );
    } else {
      fullHtml = widget.htmlTemplate + '\n' + htmlBlocks;
    }
    
    try {
      // Создаем временный файл для предпросмотра
      final tempDir = await getTemporaryDirectory();
      final tempFile = File('${tempDir.path}/preview_${DateTime.now().millisecondsSinceEpoch}.html');
      await tempFile.writeAsString(fullHtml);
      
      // Открываем в браузере
      final uri = Uri.file(tempFile.path);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Предпросмотр открыт в браузере'), backgroundColor: Colors.green),
        );
      } else {
        // Fallback - показываем в диалоге
        setState(() {
          _previewHtml = fullHtml;
        });
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Предпросмотр HTML'),
            content: SizedBox(
              width: 600,
              height: 400,
              child: SingleChildScrollView(
                child: SelectableText(_previewHtml ?? ''),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Закрыть'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка предпросмотра: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _savePost() async {
    final htmlBlocks = _generateHtmlFromBlocks();
    final bodyReg = RegExp(r'<body[^>]*>(.*?)</body>', dotAll: true);
    String fullHtml;
    final match = bodyReg.firstMatch(widget.htmlTemplate);
    if (match != null) {
      final openTag = RegExp(r'<body[^>]*>').stringMatch(match.group(0)!);
      fullHtml = widget.htmlTemplate.replaceRange(
        match.start,
        match.end,
        '$openTag\n$htmlBlocks\n</body>'
      );
    } else {
      fullHtml = widget.htmlTemplate + '\n' + htmlBlocks;
    }
    final saveResult = await FilePicker.platform.saveFile(
      dialogTitle: 'Сохранить пост',
      fileName: 'post_${DateTime.now().millisecondsSinceEpoch}.html',
      allowedExtensions: ['html', 'htm'],
      type: FileType.custom,
    );
    if (saveResult != null) {
      final file = File(saveResult);
      await file.writeAsString(fullHtml);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Пост сохранен: ${file.path.split('/').last}'), backgroundColor: Colors.green),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mura Post Editor'),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics),
            onPressed: _isAnalyzing ? null : _analyzeTemplate,
            tooltip: 'Анализировать шаблон',
          ),
          IconButton(
            icon: const Icon(Icons.remove_red_eye),
            onPressed: _previewPost,
            tooltip: 'Предпросмотр',
          ),
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _savePost,
            tooltip: 'Сохранить',
          ),
        ],
      ),
      body: Row(
        children: [
          // Левая панель — шаблонные элементы
          Container(
            width: 180,
            color: Colors.grey[100],
            child: ListView(
              padding: const EdgeInsets.all(8),
              children: [
                const Text('Блоки', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                _BlockTile(label: 'Заголовок', icon: Icons.title, onTap: () => _addBlock('title')),
                _BlockTile(label: 'Подзаголовок', icon: Icons.subtitles, onTap: () => _addBlock('subtitle')),
                _BlockTile(label: 'Абзац', icon: Icons.notes, onTap: () => _addBlock('content')),
                _BlockTile(label: 'Фото', icon: Icons.image, onTap: () => _addBlock('photo')),
                _BlockTile(label: 'Карусель', icon: Icons.view_carousel, onTap: () => _addBlock('carousel')),
                _BlockTile(label: 'Видео', icon: Icons.videocam, onTap: () => _addBlock('video')),
                _BlockTile(label: 'Аудио', icon: Icons.audiotrack, onTap: () => _addBlock('audio')),
              ],
            ),
          ),
          // Центральная панель — рабочая область
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_isAnalyzing) ...[
                    const LinearProgressIndicator(),
                    const SizedBox(height: 8),
                    const Text('Анализируем шаблон...'),
                  ],
                  if (_analyzeError != null) ...[
                    Text('Ошибка анализа: $_analyzeError', style: const TextStyle(color: Colors.red)),
                  ],
                  Expanded(
                    child: ReorderableListView(
                      onReorder: _reorderBlock,
                      children: [
                        for (int i = 0; i < _blocks.length; i++)
                          Card(
                            key: ValueKey('block_$i'),
                            margin: const EdgeInsets.symmetric(vertical: 6),
                            child: ListTile(
                              leading: Icon(_blockIcon(_blocks[i]['type'])),
                              title: _blockEditor(_blocks[i], i),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _removeBlock(i),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Правая панель — чат с AI
          Expanded(
            flex: 1,
            child: Card(
              margin: const EdgeInsets.all(8),
              child: Column(
                children: [
                  const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text(
                      'AI Ассистент',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      itemCount: _chatMessages.length,
                      itemBuilder: (context, index) {
                        final message = _chatMessages[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          child: Row(
                            mainAxisAlignment: message.isUser 
                                ? MainAxisAlignment.end 
                                : MainAxisAlignment.start,
                            children: [
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: message.isUser ? Colors.purple[100] : Colors.grey[100],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(message.text),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _chatController,
                            decoration: const InputDecoration(
                              hintText: 'Задайте вопрос AI...',
                              border: OutlineInputBorder(),
                            ),
                            onSubmitted: _sendMessage,
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: _isGenerating ? null : _sendMessage,
                          icon: _isGenerating 
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.send),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _blockIcon(String type) {
    switch (type) {
      case 'title': return Icons.title;
      case 'subtitle': return Icons.subtitles;
      case 'content': return Icons.notes;
      case 'photo': return Icons.image;
      case 'carousel': return Icons.view_carousel;
      case 'video': return Icons.videocam;
      case 'audio': return Icons.audiotrack;
      default: return Icons.extension;
    }
  }

  Widget _blockEditor(Map<String, dynamic> block, int index) {
    switch (block['type']) {
      case 'photo':
      case 'video':
      case 'audio':
        return TextField(
          decoration: const InputDecoration(hintText: 'URL'),
          onChanged: (v) => _updateBlockContent(index, v),
        );
      default:
        return TextField(
          decoration: const InputDecoration(hintText: 'Текст'),
          onChanged: (v) => _updateBlockContent(index, v),
        );
    }
  }
}

class _BlockTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _BlockTile({required this.label, required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(label),
        onTap: onTap,
      ),
    );
  }
}

class TemplateUploadScreen extends StatefulWidget {
  const TemplateUploadScreen({super.key});
  @override
  State<TemplateUploadScreen> createState() => _TemplateUploadScreenState();
}

class _TemplateUploadScreenState extends State<TemplateUploadScreen> {
  String? _htmlTemplate;
  String? _cssTemplate;
  String? _jsTemplate;
  final List<Map<String, String>> _languages = [
    {'code': 'ru', 'name': 'Русский', 'flag': '🇷🇺'},
    {'code': 'en', 'name': 'English', 'flag': '🇬🇧'},
    {'code': 'de', 'name': 'Deutsch', 'flag': '🇩🇪'},
    {'code': 'fr', 'name': 'Français', 'flag': '🇫🇷'},
  ];
  String _selectedLanguage = 'ru';
  List<Map<String, dynamic>> _savedTemplates = [];
  List<Map<String, dynamic>> _editableBlocks = [];
  int? _selectedBlockIndex;

  @override
  void initState() {
    super.initState();
    _loadSavedTemplates();
  }

  Future<void> _loadSavedTemplates() async {
    final prefs = await SharedPreferences.getInstance();
    final templatesJson = prefs.getStringList('saved_templates') ?? [];
    setState(() {
      _savedTemplates = templatesJson
          .map((json) => Map<String, dynamic>.from(jsonDecode(json)))
          .toList();
    });
  }

  Future<void> _saveCurrentTemplate() async {
    if (_htmlTemplate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Сначала загрузите HTML шаблон'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    final nameController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Сохранить шаблон'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'Название шаблона',
            hintText: 'Например: Базовый шаблон',
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, nameController.text.trim()),
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
    if (result != null && result.isNotEmpty) {
      final template = {
        'name': result,
        'html': _htmlTemplate,
        'css': _cssTemplate ?? '',
        'js': _jsTemplate ?? '',
        'language': _selectedLanguage,
        'date': DateTime.now().toIso8601String(),
      };
      final prefs = await SharedPreferences.getInstance();
      final templatesJson = prefs.getStringList('saved_templates') ?? [];
      templatesJson.add(jsonEncode(template));
      await prefs.setStringList('saved_templates', templatesJson);
      await _loadSavedTemplates();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Шаблон "$result" сохранен')),
      );
    }
  }

  Future<void> _loadSavedTemplate(Map<String, dynamic> template) async {
    setState(() {
      _htmlTemplate = template['html'];
      _cssTemplate = template['css'];
      _jsTemplate = template['js'];
      _selectedLanguage = template['language'] ?? 'ru';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Шаблон "${template['name']}" загружен')),
    );
  }

  Future<void> _deleteSavedTemplate(int index) async {
    final template = _savedTemplates[index];
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Удалить шаблон'),
        content: Text('Удалить шаблон "${template['name']}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Удалить'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final prefs = await SharedPreferences.getInstance();
      final templatesJson = prefs.getStringList('saved_templates') ?? [];
      templatesJson.removeAt(index);
      await prefs.setStringList('saved_templates', templatesJson);
      await _loadSavedTemplates();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Шаблон "${template['name']}" удален')),
      );
    }
  }

  Future<void> _pickHtmlFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['html', 'htm'],
      );
      if (result != null) {
        File file = File(result.files.single.path!);
        String content = await file.readAsString();
        setState(() {
          _htmlTemplate = content;
          _editableBlocks = AIHelper.extractEditableBlocks(content);
          _selectedBlockIndex = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('HTML шаблон загружен')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка загрузки HTML: $e')),
      );
    }
  }

  Future<void> _pickCssFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['css'],
      );
      if (result != null) {
        File file = File(result.files.single.path!);
        String content = await file.readAsString();
        setState(() {
          _cssTemplate = content;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('CSS шаблон загружен')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка загрузки CSS: $e')),
      );
    }
  }

  Future<void> _pickJsFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['js'],
      );
      if (result != null) {
        File file = File(result.files.single.path!);
        String content = await file.readAsString();
        setState(() {
          _jsTemplate = content;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('JS шаблон загружен')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка загрузки JS: $e')),
      );
    }
  }

  void _proceedToEditor() {
    if (_htmlTemplate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Пожалуйста, загрузите HTML шаблон'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InteractiveEditorScreen(
          htmlTemplate: _htmlTemplate!,
          cssTemplate: _cssTemplate ?? '',
          jsTemplate: _jsTemplate ?? '',
          language: _selectedLanguage,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Загрузка шаблонов'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        actions: [
          if (_htmlTemplate != null)
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: _saveCurrentTemplate,
              tooltip: 'Сохранить шаблон',
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_savedTemplates.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.bookmark, color: Colors.purple),
                          const SizedBox(width: 8),
                          const Text(
                            'Сохраненные шаблоны',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ...(_savedTemplates.asMap().entries.map((entry) {
                        final index = entry.key;
                        final template = entry.value;
                        final date = DateTime.parse(template['date']);
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: const Icon(Icons.description, color: Colors.blue),
                            title: Text(template['name']),
                            subtitle: Text(
                              '${_languages.firstWhere((lang) => lang['code'] == template['language'])['name']} • ${DateFormat('dd.MM.yyyy').format(date)}',
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _deleteSavedTemplate(index),
                                  tooltip: 'Удалить',
                                ),
                                IconButton(
                                  icon: const Icon(Icons.download, color: Colors.green),
                                  onPressed: () => _loadSavedTemplate(template),
                                  tooltip: 'Загрузить',
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList()),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Язык поста',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _languages.map((lang) {
                        final isSelected = _selectedLanguage == lang['code'];
                        return ChoiceChip(
                          label: Text('${lang['flag']} ${lang['name']}'),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedLanguage = lang['code']!;
                              });
                            }
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.html, color: Colors.orange),
                        const SizedBox(width: 8),
                        const Text(
                          'HTML шаблон',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const Spacer(),
                        if (_htmlTemplate != null)
                          const Icon(Icons.check_circle, color: Colors.green),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: _pickHtmlFile,
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Загрузить HTML файл'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange[100],
                        foregroundColor: Colors.orange[900],
                      ),
                    ),
                    if (_htmlTemplate != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Размер: ${_htmlTemplate!.length} символов',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_editableBlocks.isNotEmpty) ...[
                        const Text('Найденные блоки для редактирования:', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        ListView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          itemCount: _editableBlocks.length,
                          itemBuilder: (context, index) {
                            final block = _editableBlocks[index];
                            return Card(
                              color: _selectedBlockIndex == index ? Colors.purple[50] : null,
                              child: ListTile(
                                title: Text('${block['type'].toString().toUpperCase()}'),
                                subtitle: Text(
                                  block['content'].toString().replaceAll(RegExp(r'\s+'), ' ').trim(),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                trailing: IconButton(
                                  icon: const Icon(Icons.edit, color: Colors.purple),
                                  onPressed: () {
                                    setState(() {
                                      _selectedBlockIndex = index;
                                    });
                                    _editSelectedBlock();
                                  },
                                ),
                                onTap: () {
                                  setState(() {
                                    _selectedBlockIndex = index;
                                  });
                                  _editSelectedBlock();
                                },
                                selected: _selectedBlockIndex == index,
                              ),
                            );
                          },
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.style, color: Colors.blue),
                        const SizedBox(width: 8),
                        const Text(
                          'CSS шаблон (опционально)',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const Spacer(),
                        if (_cssTemplate != null)
                          const Icon(Icons.check_circle, color: Colors.green),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: _pickCssFile,
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Загрузить CSS файл'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[100],
                        foregroundColor: Colors.blue[900],
                      ),
                    ),
                    if (_cssTemplate != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Размер: ${_cssTemplate!.length} символов',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.code, color: Colors.yellow),
                        const SizedBox(width: 8),
                        const Text(
                          'JS шаблон (опционально)',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const Spacer(),
                        if (_jsTemplate != null)
                          const Icon(Icons.check_circle, color: Colors.green),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: _pickJsFile,
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Загрузить JS файл'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.yellow[100],
                        foregroundColor: Colors.yellow[900],
                      ),
                    ),
                    if (_jsTemplate != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Размер: ${_jsTemplate!.length} символов',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _proceedToEditor,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Перейти к редактору',
                style: TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _editSelectedBlock() async {
    if (_selectedBlockIndex == null) return;
    final block = _editableBlocks[_selectedBlockIndex!];
    String? newContent = block['content'];
    String? newFullBlock;
    final controller = TextEditingController(text: block['content']);

    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: MediaQuery.of(context).viewInsets,
          child: Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Редактировать блок',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller,
                  maxLines: null,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Введите текст...',
                  ),
                  autofocus: true,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: Navigator.of(context).pop,
                      child: const Text('Отмена'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop(controller.text);
                      },
                      child: const Text('Сохранить'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );

    if (result != null && result != newContent) {
      newContent = result;
      newFullBlock = result; // Для простоты - обновляем полный блок
      setState(() {
        _editableBlocks[_selectedBlockIndex!] = {
          ...block,
          'content': newContent,
          'full': newFullBlock,
        };
        // Обновляем HTML-шаблон
        final oldBlock = block['full'] as String;
        _htmlTemplate = _htmlTemplate!.replaceFirst(oldBlock, newFullBlock!);
      });
    }
  }
} 