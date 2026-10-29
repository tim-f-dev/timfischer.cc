'use strict';

const wurzel = document.querySelector('#anwendung');
let baum, datenbank, meldungen = [], entwurf = null, schritt = 0;
let objektUrls = [], beschaeftigt = false;
const MAX_BILDER = 5;
const MAX_DATEIGROESSE = 10 * 1024 * 1024;

function element(tag, text, klasse) {
  const knoten = document.createElement(tag);
  if (text !== undefined) knoten.textContent = text;
  if (klasse) knoten.className = klasse;
  return knoten;
}
function knopf(text, aktion, klasse) {
  const k = element('button', text, klasse);
  k.type = 'button';
  k.addEventListener('click', aktion);
  return k;
}
function leeren() {
  objektUrls.forEach(url => URL.revokeObjectURL(url));
  objektUrls = [];
  wurzel.replaceChildren();
  window.scrollTo(0, 0);
}
function fehler(text) {
  let platz = wurzel.querySelector('.fehler');
  if (!platz) { platz = element('p', '', 'fehler'); platz.setAttribute('role', 'alert'); wurzel.append(platz); }
  platz.textContent = text;
}
function fokus() { const h = wurzel.querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({preventScroll:true}); } }
function fragenFuer(bauteil, daten) {
  const alle = [...baum.gemeinsame_fragen, ...baum.bauteile[bauteil].fragen];
  if (!daten) return alle;
  const sichtbar = [];
  for (const id of alle) {
    const passt = (baum.fragen[id].sichtbar_wenn || []).every(bedingung => {
      if ('bilder_vorhanden' in bedingung) return (daten.bilder.length > 0) === bedingung.bilder_vorhanden;
      return sichtbar.includes(bedingung.frage) && daten.antworten[bedingung.frage] === bedingung.wert;
    });
    if (passt) sichtbar.push(id);
  }
  return sichtbar;
}
function antwortenBereinigen() {
  const sichtbar = new Set(fragenFuer(entwurf.bauteil, entwurf));
  for (const id of Object.keys(entwurf.antworten)) if (!sichtbar.has(id)) delete entwurf.antworten[id];
}
function antwortText(id, wert) {
  const frage = baum.fragen[id];
  if (frage.typ === 'auswahl') return [...frage.antworten, ...(frage.fruehere_antworten || [])].find(a => a.wert === wert)?.text || String(wert);
  return `${wert}${frage.einheit ? ' ' + frage.einheit : ''}`;
}
function oeffnen() {
  return new Promise((resolve, reject) => {
    const anfrage = indexedDB.open('reparatur-melder:' + new URL('.', location.href).pathname, 1);
    anfrage.onupgradeneeded = () => anfrage.result.createObjectStore('meldungen', {keyPath:'id'});
    anfrage.onsuccess = () => resolve(anfrage.result);
    anfrage.onerror = () => reject(anfrage.error);
    anfrage.onblocked = () => reject(new Error('Speicher blockiert'));
  });
}
function lesen() {
  return new Promise((resolve, reject) => {
    const anfrage = datenbank.transaction('meldungen').objectStore('meldungen').getAll();
    anfrage.onsuccess = () => resolve(anfrage.result.sort((a,b) => a.erstellt_am.localeCompare(b.erstellt_am)));
    anfrage.onerror = () => reject(anfrage.error);
  });
}
function schreiben(aktion) {
  return new Promise((resolve, reject) => {
    const vorgang = datenbank.transaction('meldungen', 'readwrite');
    aktion(vorgang.objectStore('meldungen'));
    vorgang.oncomplete = resolve;
    vorgang.onerror = () => reject(vorgang.error);
    vorgang.onabort = () => reject(vorgang.error);
  });
}
function neueMeldung() {
  entwurf = {id:crypto.randomUUID(), fragenbaum_version:baum.version, erstellt_am:new Date().toISOString(), bauteil:'', antworten:{}, problembeschreibung:'', bilder:[]};
  schritt = 0;
  zeigeSchritt();
}
function bildListe(ziel, bearbeitbar, beiAenderung) {
  const liste = element('div', undefined, 'bilder');
  ziel.bilder.forEach((bild, index) => {
    const rahmen = element('div', undefined, 'bild');
    const foto = element('img');
    const url = URL.createObjectURL(bild.datei);
    objektUrls.push(url);
    foto.src = url; foto.alt = bild.name || `Bild ${index+1}`;
    rahmen.append(foto);
    if (bearbeitbar) rahmen.append(knopf('Entfernen', () => { ziel.bilder.splice(index,1); beiAenderung(); }));
    liste.append(rahmen);
  });
  return liste;
}
function bildEingabe(beiAenderung = () => {}) {
  const bereich = element('div');
  const label = element('label', undefined, 'feld');
  label.append(element('span', 'Bilder auswählen (optional)'));
  const eingabe = element('input'); eingabe.type = 'file'; eingabe.multiple = true;
  eingabe.accept = 'image/jpeg,image/png,image/webp';
  const status = element('p', '', 'status'); status.setAttribute('role','status');
  const vorschau = element('div');
  function aktualisieren() { vorschau.replaceChildren(bildListe(entwurf, true, () => { aktualisieren(); beiAenderung(); })); }
  eingabe.addEventListener('change', async () => {
    if (beschaeftigt) return;
    beschaeftigt = true; status.textContent = 'Bilder werden geprüft …';
    const fehlertexte = [];
    try {
      for (const datei of eingabe.files) {
        if (entwurf.bilder.length >= MAX_BILDER) { fehlertexte.push('Maximal 5 Bilder pro Meldung.'); break; }
        if (!['image/jpeg','image/png','image/webp'].includes(datei.type)) { fehlertexte.push(`${datei.name}: Bitte JPG, PNG oder WebP wählen.`); continue; }
        if (datei.size > MAX_DATEIGROESSE) { fehlertexte.push(`${datei.name}: Die Datei ist größer als 10 MB.`); continue; }
        try {
          const bitmap = await createImageBitmap(datei);
          bitmap.close();
          entwurf.bilder.push({id:crypto.randomUUID(), name:datei.name, datei});
        } catch { fehlertexte.push(`${datei.name}: Das Bild konnte nicht gelesen werden.`); }
      }
      aktualisieren();
      beiAenderung();
      status.textContent = fehlertexte.join(' ') || `${entwurf.bilder.length} von 5 Bildern ausgewählt.`;
    } finally { beschaeftigt = false; eingabe.value = ''; }
  });
  label.append(eingabe); bereich.append(label, element('p','Bis zu 5 Bilder, jeweils höchstens 10 MB. JPG, PNG oder WebP.','hinweis'), status, vorschau);
  aktualisieren(); return bereich;
}
function eingabeFuer(id) {
  const frage = baum.fragen[id];
  const label = element('label', undefined, 'feld');
  label.append(element('span', frage.titel + (frage.einheit ? ` (${frage.einheit})` : '') + (frage.pflicht ? ' *' : '')));
  let eingabe;
  if (frage.typ === 'auswahl') {
    eingabe = element('select'); eingabe.append(new Option('Bitte auswählen', ''));
    frage.antworten.forEach(a => eingabe.append(new Option(a.text,a.wert)));
  } else {
    eingabe = element('input'); eingabe.type = frage.typ === 'zahl' ? 'number' : 'text';
    if (frage.typ === 'zahl') { eingabe.min = frage.minimum ?? 0; eingabe.max = frage.maximum ?? 100000; eingabe.step = 'any'; eingabe.inputMode = 'decimal'; }
    else eingabe.maxLength = frage.maximale_laenge || 1000;
  }
  eingabe.name = id; eingabe.required = !!frage.pflicht; eingabe.value = entwurf.antworten[id] ?? '';
  label.append(eingabe); return {label, eingabe};
}
function wertUebernehmen(id, eingabe) {
  if (eingabe.type === 'text') eingabe.value = eingabe.value.trim();
  if (!eingabe.reportValidity()) return false;
  if (eingabe.value === '') delete entwurf.antworten[id];
  else entwurf.antworten[id] = baum.fragen[id].typ === 'zahl' ? Number(eingabe.value) : eingabe.value;
  return true;
}
function zeigeSchritt() {
  leeren();
  const bereich = element('section', undefined, 'schritt');
  const fragen = entwurf.bauteil ? fragenFuer(entwurf.bauteil, entwurf) : [];
  const kopf = element('div', undefined, 'schritt-kopf');
  kopf.append(element('span', schritt ? `${baum.bauteile[entwurf.bauteil].bezeichnung} · Schritt ${schritt+1} von ${fragen.length+1}` : 'Neue Meldung', 'fortschritt'), knopf('Abbrechen', () => { if (!beschaeftigt) { entwurf=null; uebersicht(); } }, 'klein'));
  bereich.append(kopf); wurzel.append(bereich);
  if (schritt === 0) {
    bereich.append(element('h1','Welches Bauteil ist betroffen?'));
    const auswahl = element('div', undefined, 'auswahl');
    Object.entries(baum.bauteile).forEach(([id,teil]) => auswahl.append(knopf(teil.bezeichnung, () => {
      if (entwurf.bauteil !== id) { entwurf.bauteil=id; entwurf.antworten={}; }
      schritt=1; zeigeSchritt();
    })));
    bereich.append(auswahl); fokus(); return;
  }
  const id = fragen[schritt-1], frage = baum.fragen[id];
  bereich.append(element('h1', frage.titel), element('p',frage.text));
  let eingabe;
  if (frage.typ === 'auswahl') {
    const auswahl = element('div', undefined, 'auswahl');
    frage.antworten.forEach(a => auswahl.append(knopf(a.text, () => { entwurf.antworten[id]=a.wert; weiter(); })));
    bereich.append(auswahl);
  } else if (frage.typ === 'bilder') bereich.append(bildEingabe(() => {
    antwortenBereinigen();
    kopf.firstChild.textContent = `${baum.bauteile[entwurf.bauteil].bezeichnung} · Schritt ${schritt+1} von ${fragenFuer(entwurf.bauteil, entwurf).length+1}`;
  }));
  else { const feld = eingabeFuer(id); eingabe=feld.eingabe; bereich.append(feld.label); }
  const aktionen = element('div',undefined,'aktionen');
  aktionen.append(knopf('Zurück', () => { if(beschaeftigt)return; if(eingabe && eingabe.value) entwurf.antworten[id] = frage.typ === 'zahl' ? Number(eingabe.value) : eingabe.value; schritt--; zeigeSchritt(); }));
  function weiter() {
    if (beschaeftigt) return;
    if (eingabe && !wertUebernehmen(id,eingabe)) return;
    antwortenBereinigen();
    const aktuell = fragenFuer(entwurf.bauteil, entwurf);
    const naechsterIndex = aktuell.indexOf(id) + 1;
    if (naechsterIndex >= aktuell.length) formular(false);
    else { schritt = naechsterIndex + 1; zeigeSchritt(); }
  }
  if (frage.typ !== 'auswahl') aktionen.append(knopf(schritt === fragen.length ? 'Angaben prüfen' : 'Weiter',weiter,'primaer'));
  bereich.append(aktionen); fokus();
}
function formular(bestehend) {
  antwortenBereinigen();
  leeren();
  wurzel.append(element('h1', bestehend ? 'Meldung bearbeiten' : 'Angaben prüfen'), element('p','Passen Sie Ihre Angaben bei Bedarf an. Mit * markierte Felder sind erforderlich.','hinweis'));
  const form = element('form');
  form.append(element('div',baum.bauteile[entwurf.bauteil].bezeichnung + ' · Bauteil ist festgelegt','fester-wert'));
  const felder = [];
  function sichtbarkeitAktualisieren() {
    antwortenBereinigen();
    const sichtbar = new Set(fragenFuer(entwurf.bauteil, entwurf));
    for (const [id, eingabe, label] of felder) {
      const aktiv = sichtbar.has(id);
      label.hidden = !aktiv;
      eingabe.disabled = !aktiv;
      eingabe.required = aktiv && !!baum.fragen[id].pflicht;
      if (!aktiv) eingabe.value = '';
    }
  }
  fragenFuer(entwurf.bauteil).forEach(id => {
    if (baum.fragen[id].typ === 'bilder') { form.append(bildEingabe(sichtbarkeitAktualisieren)); return; }
    const feld = eingabeFuer(id); form.append(feld.label); felder.push([id,feld.eingabe,feld.label]);
    feld.eingabe.addEventListener('input', () => {
      if (feld.eingabe.value === '') delete entwurf.antworten[id];
      else entwurf.antworten[id] = baum.fragen[id].typ === 'zahl' ? Number(feld.eingabe.value) : feld.eingabe.value;
      sichtbarkeitAktualisieren();
    });
  });
  sichtbarkeitAktualisieren();
  const label = element('label',undefined,'feld'); label.append(element('span','Freie Problembeschreibung (optional)'));
  const beschreibung = element('textarea'); beschreibung.maxLength = 4000; beschreibung.value=entwurf.problembeschreibung;
  label.append(beschreibung); form.append(label);
  const aktionen = element('div',undefined,'aktionen');
  aktionen.append(knopf('Abbrechen',() => { if(!beschaeftigt){entwurf=null;uebersicht();} }));
  const speichern = element('button',bestehend ? 'Änderungen speichern' : 'Meldung speichern','primaer'); speichern.type='submit'; aktionen.append(speichern); form.append(aktionen);
  form.addEventListener('submit',async ereignis => {
    ereignis.preventDefault(); if(beschaeftigt)return;
    for(const [id,eingabe] of felder) if(!eingabe.disabled && !wertUebernehmen(id,eingabe))return;
    antwortenBereinigen(); entwurf.fragenbaum_version = baum.version;
    entwurf.problembeschreibung=beschreibung.value.trim(); entwurf.geaendert_am=new Date().toISOString();
    beschaeftigt=true; speichern.disabled=true;
    try { await schreiben(speicher => speicher.put(entwurf)); meldungen=await lesen(); entwurf=null; uebersicht('Meldung wurde auf diesem Gerät gespeichert.'); }
    catch { fehler('Die Meldung konnte nicht gespeichert werden. Bitte prüfen Sie den verfügbaren Browserspeicher und versuchen Sie es erneut.'); }
    finally {beschaeftigt=false;speichern.disabled=false;}
  });
  wurzel.append(form); fokus();
}
function loeschen(meldung) {
  const dialog=element('dialog',undefined,'dialog');
  dialog.append(element('h2','Meldung löschen?'),element('p',`Die Meldung „${baum.bauteile[meldung.bauteil].bezeichnung}“ und die zugehörigen Bilder werden von diesem Gerät entfernt.`));
  const aktionen=element('div',undefined,'aktionen');
  aktionen.append(knopf('Abbrechen',()=>dialog.close()),knopf('Löschen',async()=>{
    if(beschaeftigt)return;beschaeftigt=true;
    try{await schreiben(speicher=>speicher.delete(meldung.id));meldungen=await lesen();dialog.close();uebersicht('Meldung wurde gelöscht.');}
    catch{dialog.close();fehler('Die Meldung konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');}
    finally{beschaeftigt=false;}
  },'primaer'));
  dialog.append(aktionen);dialog.addEventListener('close',()=>dialog.remove());wurzel.append(dialog);dialog.showModal();
}
function uebersicht(nachricht='') {
  leeren();wurzel.append(element('h1','Ihre Reparaturmeldungen'),element('p','Sammeln Sie hier die Reparaturen für Ihren nächsten Termin.'));
  const status=element('p',nachricht,'status');status.setAttribute('role','status');wurzel.append(status,knopf('Neue Meldung erstellen',neueMeldung,'primaer'));
  if(!meldungen.length)wurzel.append(element('p','Noch keine Meldungen vorhanden.','leer'));
  meldungen.forEach(meldung=>{
    const titel=[baum.bauteile[meldung.bauteil].bezeichnung, meldung.antworten.standort].filter(Boolean).join(' ');
    const karte=element('article',undefined,'meldung');karte.append(element('h2',titel));
    const liste=element('dl');
    fragenFuer(meldung.bauteil, meldung).forEach(id=>{
      const frage=baum.fragen[id],wert=meldung.antworten[id];
      if(id==='standort'||!frage.in_uebersicht||wert===undefined||wert==='')return;
      const zeile=element('div');zeile.append(element('dt',(frage.kurzbezeichnung||frage.titel)+':'),element('dd',antwortText(id,wert)));liste.append(zeile);
    });
    karte.append(liste);
    if(meldung.problembeschreibung)karte.append(element('p',meldung.problembeschreibung,'beschreibung'));
    if(meldung.bilder.length)karte.append(bildListe(meldung,false));
    const aktionen=element('div',undefined,'aktionen');aktionen.append(knopf('Bearbeiten',()=>{entwurf=structuredClone(meldung);formular(true);}),knopf('Löschen',()=>loeschen(meldung)));karte.append(aktionen);wurzel.append(karte);
  });
  const ende=element('div',undefined,'aktionen');const abschicken=knopf('Meldungen abschicken',()=>{},'primaer');abschicken.disabled=true;ende.append(abschicken);wurzel.append(ende,element('p','Das Abschicken ist noch nicht verfügbar. Ihre gespeicherten Meldungen bleiben in diesem Browser erhalten. Beim Löschen der Browserdaten gehen sie verloren.','hinweis'));fokus();
}
async function starten(){
  try{
    const antwort=await fetch('fragenbaum.json');if(!antwort.ok)throw new Error('Fragenbaum fehlt');baum=await antwort.json();
    for(const teil of Object.values(baum.bauteile))for(const id of [...baum.gemeinsame_fragen,...teil.fragen])if(!baum.fragen[id])throw new Error('Unbekannte Frage');
    datenbank=await oeffnen();meldungen=await lesen();wurzel.setAttribute('aria-busy','false');uebersicht();
  }catch{wurzel.setAttribute('aria-busy','false');wurzel.replaceChildren(element('h1','Reparatur-Melder konnte nicht geladen werden'),element('p','Bitte öffnen Sie die Seite über einen Webserver und erlauben Sie lokalen Browserspeicher. Prüfen Sie auch, ob fragenbaum.json erreichbar und gültig ist.'));}
}
starten();
