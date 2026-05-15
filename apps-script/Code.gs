var TEAM_NAME_MAP = {
  'Brazil': 'Brasil', 'Spain': 'España', 'England': 'Inglaterra',
  'France': 'Francia', 'Netherlands': 'Países Bajos', 'Germany': 'Alemania',
  'Portugal': 'Portugal', 'Argentina': 'Argentina', 'Italy': 'Italia',
  'Norway': 'Noruega', 'Belgium': 'Bélgica', 'Canada': 'Canadá',
  'Switzerland': 'Suiza', 'Mexico': 'México', 'Japan': 'Japón',
  'United States': 'EEUU', 'Turkey': 'Turquía', 'Sweden': 'Suecia',
  'Croatia': 'Croacia', 'Morocco': 'Marruecos', 'South Korea': 'Corea del Sur',
  'Egypt': 'Egipto', 'Algeria': 'Argelia', 'DR Congo': 'Rep. Dem. del Congo',
  'Tunisia': 'Túnez', 'Colombia': 'Colombia', 'Ecuador': 'Ecuador',
  'Senegal': 'Senegal', 'Ghana': 'Ghana', 'Cameroon': 'Camerún',
  'Scotland': 'Escocia', 'Iran': 'Irán', 'Czech Republic': 'Chequia',
  "Ivory Coast": 'Costa de Marfil', 'New Zealand': 'Nueva Zelanda',
  'Curacao': 'Curaçao', 'Jordan': 'Jordania', 'South Africa': 'Sudáfrica',
  'Uzbekistan': 'Uzbekistán', 'Haiti': 'Haití', 'Qatar': 'Catar',
  'Iraq': 'Irak', 'Panama': 'Panamá', 'Cabo Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arabia Saudí', 'Australia': 'Australia', 'Chile': 'Chile',
  'Venezuela': 'Venezuela', 'Peru': 'Perú', 'Uruguay': 'Uruguay',
};

var ROUND_MAP = {
  'Round of 32': 'r32',
  'Round of 16': 'r16',
  'Quarter-finals': 'qf',
  'Semi-finals': 'sf',
  '3rd Place Final': '3rd',
  'Final': 'final',
};

function normalizeRound(round) {
  if (!round) return 'group';
  if (ROUND_MAP[round]) return ROUND_MAP[round];
  if (round.indexOf('Group Stage') === 0) return 'group';
  return round.toLowerCase().replace(/\s+/g, '_');
}

function normalizeTeam(name) {
  return TEAM_NAME_MAP[name] || name;
}

function fetchResults() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('FOOTBALL_API_KEY');
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  var sheetName = props.getProperty('RESULTS_SHEET_NAME') || 'Resultados';

  if (!apiKey || !spreadsheetId) {
    Logger.log('ERROR: FOOTBALL_API_KEY or SPREADSHEET_ID not set in Script Properties');
    return;
  }

  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  var existingData = sheet.getDataRange().getValues();
  var idToRow = {};
  for (var i = 0; i < existingData.length; i++) {
    var matchId = existingData[i][0];
    if (matchId) idToRow[String(matchId)] = i;
  }

  var url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026';
  var response = UrlFetchApp.fetch(url, {
    headers: { 'x-apisports-key': apiKey },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('API error: ' + response.getContentText());
    return;
  }

  var json = JSON.parse(response.getContentText());
  var fixtures = json.response || [];
  Logger.log('Fixtures fetched: ' + fixtures.length);

  var allowedStatuses = { 'FT': true, 'NS': true, 'LIVE': true, '1H': true, 'HT': true, '2H': true };

  for (var j = 0; j < fixtures.length; j++) {
    var f = fixtures[j];
    var status = f.fixture.status.short;
    if (!allowedStatuses[status]) continue;

    var matchId = f.fixture.id;
    var homeTeam = normalizeTeam(f.teams.home.name);
    var awayTeam = normalizeTeam(f.teams.away.name);
    var homeGoals = f.goals.home !== null && f.goals.home !== undefined ? f.goals.home : '';
    var awayGoals = f.goals.away !== null && f.goals.away !== undefined ? f.goals.away : '';
    var normalStatus = (status === '1H' || status === 'HT' || status === '2H') ? 'LIVE' : status;
    var round = normalizeRound(f.league.round);
    var date = f.fixture.date || '';

    var row = [matchId, homeTeam, awayTeam, homeGoals, awayGoals, normalStatus, round, date];
    var key = String(matchId);

    if (idToRow.hasOwnProperty(key)) {
      var rowIdx = idToRow[key];
      for (var c = 0; c < row.length; c++) {
        existingData[rowIdx][c] = row[c];
      }
    } else {
      idToRow[key] = existingData.length;
      existingData.push(row);
    }
  }

  if (existingData.length > 0) {
    try {
      sheet.clearContents();
      sheet.getRange(1, 1, existingData.length, 8).setValues(existingData);
      Logger.log('Done. Rows in sheet: ' + existingData.length);
    } catch (e) {
      Logger.log('ERROR writing to sheet: ' + e.message);
    }
  }
}

function setupTrigger() {
  clearTriggers();
  ScriptApp.newTrigger('fetchResults')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('Hourly trigger created for fetchResults');
}

function clearTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log('All triggers cleared');
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, ts: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}
