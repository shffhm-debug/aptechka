/**
 * Меню «Аптечка» в таблице: бэкап, миграция колонок, ИИ-дозаполнение.
 * Ничего не удаляет и не перезаписывает без бэкапа; повторный запуск безопасен.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Аптечка')
    .addItem('1. Сделать бэкап листа', 'backupSheet')
    .addItem('2. Мигрировать колонки', 'migrateSheet')
    .addItem('3. Дозаполнить МНН и категории через ИИ', 'enrichWithAi')
    .addSeparator()
    .addItem('Создать семейный токен', 'createFamilyToken')
    .addItem('Задать ключ Claude', 'setApiKey')
    .addItem('Проверить настройки', 'checkConfig')
    .addToUi();
}

/** Лист «Лекарства», а если его нет — первый лист книги. */
function getSourceSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function isMigrated(sh) {
  var first = sh.getRange(1, 1, 1, Math.max(2, sh.getLastColumn())).getValues()[0]
    .map(function (v) { return String(v).trim(); });
  return first.indexOf('id') >= 0 && first.indexOf('название') >= 0;
}

function hasBackup() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().some(function (s) {
    return s.getName().indexOf('Лекарства_backup') === 0;
  });
}

function backupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = getSourceSheet();
  var base = 'Лекарства_backup_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var name = base, n = 2;
  while (ss.getSheetByName(name)) name = base + '_' + (n++);
  var copy = src.copyTo(ss).setName(name);
  ss.setActiveSheet(src);
  SpreadsheetApp.getUi().alert('Бэкап создан: лист «' + name + '» (' + copy.getLastRow() + ' строк). Его можно не трогать.');
}

var FORM_NORMALIZE = {
  'упаковка таблеток': 'таблетки',
  'таблетки': 'таблетки',
  'пакетик': 'пакетики',
  'пакетики': 'пакетики',
  'ампул': 'ампулы',
  'ампула': 'ампулы',
  'ампулы': 'ампулы',
  'капли': 'капли',
  'спрэй': 'спрей',
  'спрей': 'спрей',
  'мазь': 'мазь',
  'гель': 'гель',
  'свечи': 'свечи',
  'свеча': 'свечи',
  'бутылка': 'сироп',
  'шипучки': 'шипучие таблетки',
  'порошок': 'порошок',
  'флакон': 'флакон'
};

function normalizeForm(v) {
  var s = String(v == null ? '' : v).trim().toLowerCase();
  if (!s) return '';
  return FORM_NORMALIZE[s] || s;
}

/**
 * Старый лист: A=название (латиницей), B=название_рус, C=количество, D=форма.
 * Новый: HEADERS. Требует бэкап. Если заголовки уже есть — ничего не делает.
 */
function migrateSheet() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getSourceSheet();

  if (isMigrated(sh)) {
    ui.alert('Лист «' + sh.getName() + '» уже мигрирован — заголовки на месте. Ничего не менял.');
    return;
  }
  if (!hasBackup()) {
    ui.alert('Сначала сделай бэкап: меню Аптечка → «1. Сделать бэкап листа».');
    return;
  }
  var answer = ui.alert('Миграция',
    'Лист «' + sh.getName() + '» будет переименован в «' + SHEET_NAME + '», добавится строка заголовков,\n' +
    'колонки переставятся: A→название, B→название_рус, C→количество, D→форма (с нормализацией).\n' +
    'Остальные поля останутся пустыми. Продолжить?', ui.ButtonSet.OK_CANCEL);
  if (answer !== ui.Button.OK) return;

  var values = sh.getDataRange().getValues();
  var now = nowIso();
  var rows = [];
  values.forEach(function (r) {
    var name = String(r[0] == null ? '' : r[0]).trim();
    var rus = String(r[1] == null ? '' : r[1]).trim();
    if (!name && !rus) return;
    if (!name) { name = rus; rus = ''; }
    var qty = r[2] === '' || r[2] == null ? 1 : (Number(r[2]) || 0);
    var item = {
      'id': newId(),
      'название': name,
      'название_рус': rus,
      'действующее_вещество': '',
      'форма': normalizeForm(r[3]),
      'дозировка': '',
      'количество': qty,
      'срок_годности': '',
      'категория': '',
      'для_кого': '',
      'место_хранения': '',
      'заметка': '',
      'обновлено': now
    };
    rows.push(itemToRow(item, HEADERS));
  });

  sh.clearContents();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  sh.setFrozenRows(1);
  // текстовый формат для id и дат — чтобы Google не превращал «2027-03-31» в дату, а id из цифр — в число
  var textCols = ['id', 'срок_годности', 'обновлено'];
  textCols.forEach(function (h) {
    sh.getRange(1, HEADERS.indexOf(h) + 1, Math.max(rows.length + 1, 2), 1).setNumberFormat('@');
  });
  if (sh.getName() !== SHEET_NAME) {
    var clash = ss.getSheetByName(SHEET_NAME);
    if (clash) clash.setName(SHEET_NAME + '_old');
    sh.setName(SHEET_NAME);
  }
  ui.alert('Готово: ' + rows.length + ' позиций в листе «' + SHEET_NAME + '».\n' +
    'Дальше: пункт «3. Дозаполнить МНН и категории через ИИ».');
}

/** Заполняет ТОЛЬКО пустые ячейки действующее_вещество / категория / для_кого / дозировка, пачками по 25. */
function enrichWithAi() {
  var ui = SpreadsheetApp.getUi();
  var all;
  try { all = readAll(); } catch (e) { ui.alert(String(e.message || e)); return; }
  var todo = all.items.filter(function (it) {
    return !it.действующее_вещество || !it.категория || !it.для_кого;
  });
  if (!todo.length) { ui.alert('Все позиции уже заполнены.'); return; }
  var batches = Math.ceil(todo.length / 25);
  var answer = ui.alert('ИИ-дозаполнение',
    'Позиций без МНН/категории: ' + todo.length + '. Заполняются только пустые ячейки, ничего не перезаписывается.\n' +
    'Займёт около ' + (batches * 20) + ' секунд. Продолжить?', ui.ButtonSet.OK_CANCEL);
  if (answer !== ui.Button.OK) return;

  var col = {};
  all.headers.forEach(function (h, i) { col[h] = i + 1; });
  var done = 0, failed = 0;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  for (var i = 0; i < todo.length; i += 25) {
    var batch = todo.slice(i, i + 25);
    ss.toast('Пачка ' + (Math.floor(i / 25) + 1) + ' из ' + batches + '…', 'ИИ-дозаполнение', 30);
    var res;
    try {
      res = aiEnrich(batch.map(function (it) {
        return { id: it.id, 'название': it.название, 'название_рус': it.название_рус, 'форма': it.форма };
      }));
    } catch (e) {
      failed += batch.length;
      Logger.log('enrich batch failed: ' + e);
      continue;
    }
    var byId = {};
    (res.items || []).forEach(function (r) { byId[r.id] = r; });
    batch.forEach(function (it) {
      var r = byId[it.id];
      if (!r) { failed++; return; }
      var note = it.заметка || '';
      var updates = {};
      if (!it.действующее_вещество && r.действующее_вещество) updates['действующее_вещество'] = r.действующее_вещество;
      if (!it.категория && r.категория) updates['категория'] = r.категория;
      if (!it.для_кого && r.для_кого) updates['для_кого'] = r.для_кого;
      if (!it.дозировка && r.дозировка) updates['дозировка'] = r.дозировка;
      if (r.уверенность != null && r.уверенность < 0.6 && note.indexOf('ИИ не уверен') < 0) {
        updates['заметка'] = (note ? note + '; ' : '') + 'ИИ не уверен — проверь';
      }
      Object.keys(updates).forEach(function (h) {
        all.sheet.getRange(it._row, col[h]).setValue(updates[h]);
      });
      if (Object.keys(updates).length) all.sheet.getRange(it._row, col['обновлено']).setValue(nowIso());
      done++;
    });
    SpreadsheetApp.flush();
  }
  ui.alert('Заполнено: ' + done + '. Не удалось: ' + failed + '.\nПозиции с низкой уверенностью помечены в колонке «заметка».');
}

function createFamilyToken() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var cur = props.getProperty('FAMILY_TOKEN');
  if (cur) {
    ui.alert('Семейный токен уже задан:\n\n' + cur + '\n\nЕго нужно ввести в приложении на каждом телефоне.');
    return;
  }
  var token = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
  props.setProperty('FAMILY_TOKEN', token);
  ui.alert('Семейный токен создан и сохранён в Script Properties:\n\n' + token + '\n\nВведи его в приложении на каждом телефоне.');
}

/** Ключ вводится в диалоге прямо в таблице — не нужно лезть в редактор скриптов. */
function setApiKey() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Ключ Claude', 'Вставь ключ из console.anthropic.com (начинается с sk-ant-). Он сохранится только в Script Properties этого скрипта.', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var key = String(res.getResponseText() || '').trim();
  if (key.indexOf('sk-ant-') !== 0) { ui.alert('Не похоже на ключ Claude: должен начинаться с sk-ant-. Ничего не сохранил.'); return; }
  PropertiesService.getScriptProperties().setProperty('ANTHROPIC_API_KEY', key);
  ui.alert('Ключ сохранён. Теперь «Проверить настройки» сделает тестовый запрос.');
}

function checkConfig() {
  var ui = SpreadsheetApp.getUi();
  var lines = [];
  lines.push('FAMILY_TOKEN: ' + (getProp('FAMILY_TOKEN') ? 'задан' : 'НЕ задан → «Создать семейный токен»'));
  lines.push('ANTHROPIC_API_KEY: ' + (getProp('ANTHROPIC_API_KEY') ? 'задан' : 'НЕ задан → Project Settings → Script Properties'));
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) lines.push('Лист «' + SHEET_NAME + '»: НЕТ → запусти миграцию');
  else lines.push('Лист «' + SHEET_NAME + '»: ' + (isMigrated(sh) ? 'мигрирован, строк: ' + (sh.getLastRow() - 1) : 'без заголовков → запусти миграцию'));
  lines.push('Бэкап: ' + (hasBackup() ? 'есть' : 'нет'));
  if (getProp('ANTHROPIC_API_KEY')) {
    try {
      var r = aiEnrich([{ id: 'test', 'название': 'paracetamol', 'название_рус': 'парацетамол', 'форма': 'таблетки' }]);
      lines.push('Claude: OK (' + ((r.items[0] || {}).действующее_вещество || '?') + ')');
    } catch (e) {
      lines.push('Claude: ОШИБКА — ' + String(e.message || e));
    }
  }
  ui.alert(lines.join('\n'));
}
