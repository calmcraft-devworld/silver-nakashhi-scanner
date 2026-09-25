/**
 * Card → WhatsApp: visitor log receiver.
 *
 * Paste this into the Google Sheet via Extensions → Apps Script, set SECRET,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access:
 * Anyone). See apps-script/README.md for the full steps.
 *
 * The page sends batches of visitors; each has an id, so a retry after a
 * flaky connection updates the same row instead of adding a duplicate.
 */

// Change this to any long random phrase, and enter the same phrase in the
// page's "Google Sheet sync" settings. Stops strangers adding rows.
const SECRET = 'CHANGE-ME-to-a-long-random-phrase';

// Tab to write to. Leave blank to use the first tab.
const SHEET_NAME = '';

const HEADERS = [
  'Saved at',
  'Visitor ID',
  'Phone',
  'Name / company',
  'Interested in',
  'Requirements / notes',
  'WhatsApp opened',
  'Scanned at (phone time)',
  'Stall phone',
  'Text read from card',
];

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad-json' });
  }
  if (!body || body.key !== SECRET) return json_({ ok: false, error: 'bad-key' });

  const records = Array.isArray(body.records) ? body.records.slice(0, 200) : [];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    // Map existing visitor ids to row numbers so retries update in place.
    const rowById = {};
    const last = sheet.getLastRow();
    if (last > 1) {
      const ids = sheet.getRange(2, 2, last - 1, 1).getValues();
      ids.forEach((r, i) => { if (r[0]) rowById[String(r[0])] = i + 2; });
    }

    const saved = [];
    records.forEach((rec) => {
      if (!rec || !rec.id) return;
      const id = String(rec.id).slice(0, 64);
      const existing = rowById[id];
      const row = [
        existing ? sheet.getRange(existing, 1).getValue() : new Date(),
        id,
        text_(rec.phone),
        text_(rec.name),
        text_((rec.interests || []).join(', ')),
        text_(rec.notes),
        rec.whatsapp ? 'Yes' : 'No',
        text_(rec.createdAt),
        text_(rec.device),
        text_(rec.ocrText, 2000),
      ];
      if (existing) {
        sheet.getRange(existing, 1, 1, row.length).setValues([row]);
      } else {
        sheet.appendRow(row);
        rowById[id] = sheet.getLastRow();
      }
      saved.push(id);
    });
    return json_({ ok: true, saved: saved });
  } finally {
    lock.releaseLock();
  }
}

// Lets the page's "Test connection" button check the URL without a key.
function doGet() {
  return json_({ ok: true, app: 'card-to-whatsapp' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return (SHEET_NAME && ss.getSheetByName(SHEET_NAME)) || ss.getSheets()[0];
}

function ensureHeaders_(sheet) {
  const first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (first.every((v) => v === '')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

// Store as plain text: keeps "+91…" intact and stops card text such as
// "=…" or "+…" being treated as a formula.
function text_(v, max) {
  const s = String(v == null ? '' : v).slice(0, max || 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
