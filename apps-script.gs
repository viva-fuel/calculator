/**
 * Viva Aerobus · Fuel Loading Calculator
 * Apps Script backend para sincronizar registros con Google Sheets.
 *
 * INSTRUCCIONES DE INSTALACIÓN: ver CONFIGURAR_SHEETS.md
 *
 * Este script va asociado a un Google Sheet (no es standalone).
 * - doGet  → devuelve todos los registros como JSON
 * - doPost → agrega un registro nuevo (deduplicando por id)
 */

const SHEET_NAME = 'Registros';
const HEADERS = [
  'id', 'iso', 'dateTime', 'flight',
  'frKg', 'fobKg', 'totalKg', 'density',
  'totalL', 'lowL', 'highL', 'status'
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonOut_({ records: [] });
    const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const records = data
      .filter(row => row[0] !== '' && row[0] != null)
      .map(row => ({
        id: row[0],
        iso: row[1],
        dateTime: row[2],
        flight: row[3],
        frKg: row[4] === '' ? null : Number(row[4]),
        fobKg: row[5] === '' ? null : Number(row[5]),
        totalKg: row[6] === '' ? null : Number(row[6]),
        density: row[7] === '' ? null : Number(row[7]),
        totalL: row[8] === '' ? null : Number(row[8]),
        lowL: row[9] === '' ? null : Number(row[9]),
        highL: row[10] === '' ? null : Number(row[10]),
        status: row[11] || 'OK'
      }));
    return jsonOut_({ records: records });
  } catch (err) {
    return jsonOut_({ records: [], error: String(err) });
  }
}

function doPost(e) {
  try {
    const sheet = getSheet_();
    const body = (e && e.postData && e.postData.contents) || '{}';
    const payload = JSON.parse(body);
    const r = payload.record || payload;

    if (!r || r.id == null) {
      return jsonOut_({ ok: false, error: 'missing id' });
    }

    // Dedupe por id (no agregar dos veces el mismo registro)
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
      if (ids.indexOf(String(r.id)) !== -1) {
        return jsonOut_({ ok: true, dedup: true });
      }
    }

    sheet.appendRow([
      r.id,
      r.iso || '',
      r.dateTime || '',
      r.flight || '',
      r.frKg != null ? r.frKg : '',
      r.fobKg != null ? r.fobKg : '',
      r.totalKg != null ? r.totalKg : '',
      r.density != null ? r.density : '',
      r.totalL != null ? r.totalL : '',
      r.lowL != null ? r.lowL : '',
      r.highL != null ? r.highL : '',
      r.status || 'OK'
    ]);
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}
