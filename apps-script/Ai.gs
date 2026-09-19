/**
 * Вызовы Claude API. Ключ ANTHROPIC_API_KEY — только в Script Properties.
 * Модель: claude-sonnet-5. Ответы — structured outputs (гарантированный JSON по схеме).
 */

var CLAUDE_MODEL = 'claude-sonnet-5';
var CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

function callClaude(opts) {
  var key = getProp('ANTHROPIC_API_KEY');
  if (!key) throw new Error('no_api_key: добавь ANTHROPIC_API_KEY в Script Properties');

  var body = {
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens || 6000,
    system: opts.system,
    messages: opts.messages,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: opts.effort || 'medium',
      format: { type: 'json_schema', schema: opts.schema }
    }
  };

  var res = UrlFetchApp.fetch(CLAUDE_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code !== 200) {
    var msg = text;
    try { msg = JSON.parse(text).error.message; } catch (e) { /* оставить как есть */ }
    throw new Error('claude_' + code + ': ' + msg);
  }
  var data = JSON.parse(text);
  if (data.stop_reason === 'refusal') throw new Error('claude_refusal: модель отказалась отвечать');
  if (data.stop_reason === 'max_tokens') throw new Error('claude_truncated: ответ обрезан, попробуй короче');
  var block = (data.content || []).filter(function (b) { return b.type === 'text'; })[0];
  if (!block) throw new Error('claude_empty');
  return JSON.parse(block.text);
}

// ---------- роутер ai ----------

function handleAi(p) {
  switch (p.mode) {
    case 'extract':      return aiExtract(p);
    case 'symptoms':     return aiSymptoms(p);
    case 'prescription': return aiPrescription(p);
    case 'enrich':       return aiEnrich(p.items || []);
    default: throw new Error('unknown_ai_mode');
  }
}

function imageBlock(img) {
  if (!img || !img.data) throw new Error('image_required');
  var mt = img.media_type || 'image/jpeg';
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].indexOf(mt) < 0) throw new Error('bad_image_type');
  return { type: 'image', source: { type: 'base64', media_type: mt, data: img.data } };
}

/** Годные позиции для ИИ: количество > 0 и срок не истёк. */
function usableItems() {
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return readAll().items.filter(function (it) {
    if (!(Number(it.количество) > 0)) return false;
    if (it.срок_годности && it.срок_годности < today) return false;
    return true;
  });
}

function itemsAsText(items) {
  return items.map(function (it) {
    var name = it.название + (it.название_рус ? ' (' + it.название_рус + ')' : '');
    return [it.id, name, it.действующее_вещество || '—', it.форма || '—', it.дозировка || '—',
      it.количество, it.срок_годности || 'срок не указан', it.категория || '—', it.для_кого || '—'].join(' | ');
  }).join('\n');
}

// ---------- режимы ----------

function aiExtract(p) {
  var content = [imageBlock(p.image)];
  var text = 'Распознай упаковку лекарства и заполни поля.';
  if (p.text) text += ' Подсказка от пользователя: ' + p.text;
  content.push({ type: 'text', text: text });
  var out = callClaude({
    system: SYSTEM_EXTRACT,
    messages: [{ role: 'user', content: content }],
    schema: EXTRACT_SCHEMA,
    effort: 'medium',
    maxTokens: 3000
  });
  if (!out.количество || out.количество < 1) out.количество = 1;
  out.срок_годности = toDateString(out.срок_годности || '');
  return out;
}

function aiSymptoms(p) {
  var symptoms = String(p.symptoms || '').trim();
  if (!symptoms) throw new Error('symptoms_required');
  var who = p.who === 'ребёнок' ? 'ребёнок' : 'взрослый';
  var age = p.age ? String(p.age) : '';
  var items = usableItems();
  var user = [
    'АПТЕЧКА (только годное):',
    items.length ? itemsAsText(items) : '(пусто)',
    '',
    'ДЛЯ КОГО: ' + who + (age ? ', возраст: ' + age : ''),
    'СИМПТОМЫ: ' + symptoms
  ].join('\n');
  var out = callClaude({
    system: SYSTEM_SYMPTOMS,
    messages: [{ role: 'user', content: user }],
    schema: SYMPTOMS_SCHEMA,
    effort: 'high',
    maxTokens: 6000
  });
  out.disclaimer = DISCLAIMER;
  return out;
}

function aiPrescription(p) {
  var content = [];
  if (p.image && p.image.data) content.push(imageBlock(p.image));
  var text = String(p.text || '').trim();
  if (!content.length && !text) throw new Error('prescription_required');
  var items = usableItems();
  var user = [
    'АПТЕЧКА (только годное):',
    items.length ? itemsAsText(items) : '(пусто)',
    '',
    'РЕЦЕПТ' + (content.length ? ' (см. фото)' : '') + ':',
    text || '(только фото)'
  ].join('\n');
  content.push({ type: 'text', text: user });
  var out = callClaude({
    system: SYSTEM_PRESCRIPTION,
    messages: [{ role: 'user', content: content }],
    schema: PRESCRIPTION_SCHEMA,
    effort: 'high',
    maxTokens: 8000
  });
  out.disclaimer = DISCLAIMER;
  return out;
}

/** Пачка ≤ 30 позиций {id, название, название_рус, форма} → МНН/категория/для_кого/дозировка. */
function aiEnrich(items) {
  if (!items.length) return { items: [] };
  if (items.length > 30) throw new Error('enrich_batch_too_big');
  var text = items.map(function (it) {
    return it.id + ' | ' + it.название + (it.название_рус ? ' (' + it.название_рус + ')' : '') + ' | ' + (it.форма || '—');
  }).join('\n');
  return callClaude({
    system: SYSTEM_ENRICH,
    messages: [{ role: 'user', content: 'ПОЗИЦИИ (id | название | форма):\n' + text }],
    schema: ENRICH_SCHEMA,
    effort: 'low',
    maxTokens: 8000
  });
}
