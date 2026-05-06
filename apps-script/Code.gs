/**
 * Porra Mundial 2026 — Google Apps Script
 *
 * Deploy: Extensions > Apps Script > Deploy > New deployment
 *   Type: Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * After deploy, copy the URL to VITE_APPS_SCRIPT_URL in .env.local
 */

const SS_ID = PropertiesService.getScriptProperties().getProperty('SS_ID');
const ADMIN_PASSWORD = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');

function getSheet(name) {
  return SpreadsheetApp.openById(SS_ID).getSheetByName(name);
}

function generateToken() {
  return Utilities.getUuid();
}

function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = JSON.parse(e.postData.contents);
    const { action } = body;

    let result;
    if (action === 'createBet')  result = createBet(body);
    else if (action === 'updateBet')  result = updateBet(body);
    else if (action === 'updateMatch') result = updateMatch(body);
    else if (action === 'togglePaid')  result = togglePaid(body);
    else throw new Error('Acción desconocida: ' + action);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, ...result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createBet({ nombre, apellido, alias, paises }) {
  if (!nombre || !alias) throw new Error('Nombre y alias obligatorios');
  if (!Array.isArray(paises) || paises.length !== 13) throw new Error('Debes elegir exactamente 13 países');

  const config = getConfig();
  if (Date.now() > new Date(config.fecha_cierre).getTime()) {
    throw new Error('Las apuestas están cerradas');
  }

  const sheet = getSheet('apuestas');
  const token = generateToken();
  const now = new Date().toISOString();

  sheet.appendRow([
    token,
    nombre,
    apellido || '',
    alias,
    paises.join(','),
    now,
    'FALSE', // pagado
  ]);

  return { token };
}

function updateBet({ token, nombre, apellido, alias, paises }) {
  if (!token) throw new Error('Token requerido');

  const config = getConfig();
  if (Date.now() > new Date(config.fecha_cierre).getTime()) {
    throw new Error('Las apuestas están cerradas');
  }

  const sheet = getSheet('apuestas');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      sheet.getRange(i + 1, 2).setValue(nombre || data[i][1]);
      sheet.getRange(i + 1, 3).setValue(apellido !== undefined ? apellido : data[i][2]);
      sheet.getRange(i + 1, 4).setValue(alias || data[i][3]);
      if (Array.isArray(paises) && paises.length === 13) {
        sheet.getRange(i + 1, 5).setValue(paises.join(','));
      }
      return { updated: true };
    }
  }

  throw new Error('Token no encontrado');
}

function updateMatch({ adminPassword, matchId, golesLocal, golesVisitante, tarjetasRojas }) {
  if (adminPassword !== ADMIN_PASSWORD) throw new Error('Contraseña incorrecta');

  const sheet = getSheet('partidos');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(matchId)) {
      sheet.getRange(i + 1, 5).setValue(golesLocal !== undefined ? golesLocal : data[i][4]);
      sheet.getRange(i + 1, 6).setValue(golesVisitante !== undefined ? golesVisitante : data[i][5]);
      if (tarjetasRojas !== undefined) {
        sheet.getRange(i + 1, 7).setValue(tarjetasRojas);
      }
      return { updated: true };
    }
  }

  throw new Error('Partido no encontrado: ' + matchId);
}

function togglePaid({ adminPassword, token }) {
  if (adminPassword !== ADMIN_PASSWORD) throw new Error('Contraseña incorrecta');

  const sheet = getSheet('apuestas');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      const current = data[i][6] === true || data[i][6] === 'TRUE';
      sheet.getRange(i + 1, 7).setValue(!current ? 'TRUE' : 'FALSE');
      return { paid: !current };
    }
  }

  throw new Error('Token no encontrado');
}

function getConfig() {
  const sheet = getSheet('config');
  if (!sheet) return { fecha_cierre: '2026-06-11T14:00:00-05:00' };
  const data = sheet.getDataRange().getValues();
  const cfg = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) cfg[data[i][0]] = data[i][1];
  }
  return cfg;
}

// GET — health check
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'porra-mundial-2026' }))
    .setMimeType(ContentService.MimeType.JSON);
}
