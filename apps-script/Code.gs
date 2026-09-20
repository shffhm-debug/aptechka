/**
 * Аптечка — Google Apps Script Web App.
 * Привязан к таблице. Эндпоинты: list, add, update, delete, ai.
 * Запросы: POST, Content-Type: text/plain, тело — JSON { token, action, payload }.
 * Ответ: { ok: true, data } | { ok: false, error }.
 */

var SHEET_NAME = 'Лекарства';
var HEADERS = [
  'id', 'название', 'название_рус', 'действующее_вещество', 'форма', 'дозировка',
  'количество', 'срок_годности', 'категория', 'для_кого', 'место_хранения', 'заметка', 'обновлено'
];

// ---------- HTTP ----------

function doPost(e) {
  var req;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return jsonOut({ ok: false, error: 'bad_json' });
  }
  return jsonOut(handleRequest(req));
}

// GET — только проверка «жив ли скрипт» с ?ping=1. Обычный GET отвечает ошибкой:
// иначе POST, превращённый редиректом в GET, выглядел бы для клиента как пустой успех.
function doGet(e) {
  if (e && e.parameter && e.parameter.ping) return jsonOut({ ok: true, data: { app: 'aptechka', version: 2 } });
  return jsonOut({ ok: false, error: 'method_get' });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(req) {
  try {
    var token = getProp('FAMILY_TOKEN');
    if (!token) return { ok: false, error: 'server_not_configured' };
    if (!req.token || String(req.token) !== token) return { ok: false, error: 'unauthorized' };

    var p = req.payload || {};
    switch (req.action) {
      case 'list':   return { ok: true, data: listItems() };
      case 'add':    return { ok: true, data: withLock(function () { return addItem(p); }) };
      case 'update': return { ok: true, data: withLock(function () { return updateItem(p); }) };
      case 'delete': return { ok: true, data: withLock(function () { return deleteItem(p); }) };
      case 'ai':     return { ok: true, data: handleAi(p) };
      default:       return { ok: false, error: 'unknown_action' };
    }
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

// ---------- helpers ----------

function getProp(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function getSheet() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('sheet_missing: запусти миграцию из меню «Аптечка»');
  return sh;
}

function newId() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 8);
}

function nowIso() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
}

function toDateString(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var s = String(v == null ? '' : v).trim();
  // «03.2027» / «03/2027» → последний день месяца
  var m = s.match(/^(\d{1,2})[./](\d{4})$/);
  if (m) {
    var last = new Date(Number(m[2]), Number(m[1]), 0).getDate();
    return m[2] + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + last).slice(-2);
  }
  // «12.03.2027»
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  // «2027-03» → последний день месяца
  m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    var d = new Date(Number(m[1]), Number(m[2]), 0).getDate();
    return s + '-' + ('0' + d).slice(-2);
  }
  return s;
}

function rowToItem(row, headers) {
  var item = {};
  headers.forEach(function (h, i) {
    var v = row[i];
    if (h === 'количество') {
      item[h] = v === '' || v == null ? 0 : Number(v) || 0;
    } else if (h === 'срок_годности') {
      item[h] = toDateString(v);
    } else if (h === 'обновлено') {
      item[h] = v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss") : String(v == null ? '' : v);
    } else {
      item[h] = String(v == null ? '' : v).trim();
    }
  });
  return item;
}

function itemToRow(item, headers) {
  return headers.map(function (h) {
    var v = item[h];
    if (h === 'количество') return v === '' || v == null ? 0 : Number(v) || 0;
    if (h === 'срок_годности') return toDateString(v || '');
    return v == null ? '' : String(v);
  });
}

function readAll() {
  var sh = getSheet();
  var values = sh.getDataRange().getValues();
  if (!values.length) throw new Error('sheet_empty: запусти миграцию из меню «Аптечка»');
  var headers = values[0].map(function (h) { return String(h).trim(); });
  if (headers.indexOf('id') < 0 || headers.indexOf('название') < 0) {
    throw new Error('sheet_not_migrated: запусти миграцию из меню «Аптечка»');
  }
  var items = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var it = rowToItem(row, headers);
    if (!it.id && !it.название) continue;
    it._row = r + 1; // 1-based номер строки в листе
    items.push(it);
  }
  return { sheet: sh, headers: headers, items: items };
}

function stripInternal(item) {
  var out = {};
  Object.keys(item).forEach(function (k) { if (k.charAt(0) !== '_') out[k] = item[k]; });
  return out;
}

// ---------- CRUD ----------

function listItems() {
  var all = readAll();
  return { items: all.items.map(stripInternal), updatedAt: nowIso() };
}

function addItem(p) {
  var all = readAll();
  var item = {};
  all.headers.forEach(function (h) { item[h] = p[h] != null ? p[h] : ''; });
  if (!String(item.название).trim()) throw new Error('name_required');
  item.id = (p.id && String(p.id)) || newId();
  // если id уже есть (undo после удаления) — не дублировать
  var exists = all.items.some(function (it) { return it.id === item.id; });
  if (exists) return updateItem(p);
  item.обновлено = nowIso();
  all.sheet.appendRow(itemToRow(item, all.headers));
  return item;
}

function updateItem(p) {
  if (!p.id) throw new Error('id_required');
  var all = readAll();
  var cur = null;
  for (var i = 0; i < all.items.length; i++) if (all.items[i].id === String(p.id)) { cur = all.items[i]; break; }
  if (!cur) throw new Error('not_found');
  var next = {};
  all.headers.forEach(function (h) { next[h] = p[h] !== undefined ? p[h] : cur[h]; });
  next.id = cur.id;
  next.обновлено = nowIso();
  all.sheet.getRange(cur._row, 1, 1, all.headers.length).setValues([itemToRow(next, all.headers)]);
  return next;
}

function deleteItem(p) {
  if (!p.id) throw new Error('id_required');
  var all = readAll();
  for (var i = 0; i < all.items.length; i++) {
    if (all.items[i].id === String(p.id)) {
      all.sheet.deleteRow(all.items[i]._row);
      return { id: p.id, deleted: stripInternal(all.items[i]) };
    }
  }
  throw new Error('not_found');
}
