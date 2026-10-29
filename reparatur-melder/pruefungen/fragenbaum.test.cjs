const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ordner = path.join(__dirname, '..');
const fragenbaum = JSON.parse(fs.readFileSync(path.join(ordner, 'fragenbaum.json'), 'utf8'));
const quelltext = fs.readFileSync(path.join(ordner, 'anwendung.js'), 'utf8').replace(/starten\(\);\s*$/, '');
function umgebung(meldung) {
  const kontext = vm.createContext({document: {querySelector: () => ({})}, fragenbaum, meldung});
  vm.runInContext(quelltext + '\nbaum = fragenbaum; entwurf = meldung;', kontext);
  return ausdruck => vm.runInContext(ausdruck, kontext);
}

test('Bei jedem Bauteil entfällt die Breite mit Bild und kehrt ohne Bild zurück', () => {
  for (const bauteil of Object.keys(fragenbaum.bauteile)) {
    const meldung = {bauteil, antworten: {standort:'Bad', breite:120}, bilder:[]};
    const ausfuehren = umgebung(meldung);
    assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).includes("breite")'), true);
    meldung.bilder.push({id:'testbild'});
    ausfuehren('antwortenBereinigen()');
    assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).includes("breite")'), false);
    assert.equal('breite' in meldung.antworten, false);
    meldung.bilder.length = 0;
    assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).includes("breite")'), true);
  }
});

test('Ein Wechsel des Rollladenproblems wechselt die Folgefrage und entfernt alte Antworten', () => {
  const meldung = {bauteil:'rollladen', antworten:{standort:'Bad', rollladenproblem:'oben', reaktion_abwaerts:'fest'}, bilder:[]};
  const ausfuehren = umgebung(meldung);
  assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).includes("reaktion_abwaerts")'), true);
  assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).includes("reaktion_aufwaerts")'), false);
  meldung.antworten.rollladenproblem = 'unten';
  ausfuehren('antwortenBereinigen()');
  assert.equal('reaktion_abwaerts' in meldung.antworten, false);
  assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).includes("reaktion_abwaerts")'), false);
  assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).includes("reaktion_aufwaerts")'), true);
  assert.equal(meldung.antworten.standort, 'Bad');
});

test('Ohne passende Problemantwort erscheinen keine Folgefragen', () => {
  for (const antwort of ['', 'bewegung']) {
    const ausfuehren = umgebung({bauteil:'rollladen', antworten:{rollladenproblem:antwort}, bilder:[]});
    assert.equal(ausfuehren('fragenFuer(entwurf.bauteil, entwurf).some(id => id.startsWith("reaktion_"))'), false);
  }
});

test('Alle Bedingungen beziehen sich auf vorhergehende Fragen im jeweiligen Ablauf', () => {
  for (const teil of Object.values(fragenbaum.bauteile)) {
    const vorher = new Set();
    for (const id of [...fragenbaum.gemeinsame_fragen, ...teil.fragen]) {
      assert.ok(fragenbaum.fragen[id], id);
      for (const bedingung of fragenbaum.fragen[id].sichtbar_wenn || []) {
        if (bedingung.frage) {
          assert.ok(vorher.has(bedingung.frage), id);
          assert.ok(fragenbaum.fragen[bedingung.frage].antworten.some(a => a.wert === bedingung.wert), id);
        }
      }
      vorher.add(id);
    }
  }
});
