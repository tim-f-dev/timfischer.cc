# Reparatur-Melder

Den gesamten Ordner auf einen Webserver kopieren und dessen Adresse mit abschließendem Schrägstrich öffnen. Der Ordner darf beliebig umbenannt und verschachtelt werden. Alle Verweise sind relativ. HTML, CSS und JavaScript genügen; PHP und eine Serverdatenbank werden derzeit nicht benötigt. Das direkte Öffnen als lokale Datei funktioniert wegen des Ladens der JSON-Datei nicht zuverlässig.

Es werden keine Bibliotheken, externen Schriftendienste oder anderen Fremddienste geladen. Quicksand liegt einschließlich Lizenz im Ordner `schriften`. Die Oberfläche ist bewusst schlicht, ohne Kopf- und Fußzeile. Das Button-Menü zeigt jeweils nur eine Frage und nutzt auf kleinen Displays zwei Spalten. Bei sehr geringer Bildschirmhöhe, geöffneter Bildschirmtastatur oder starker Schriftvergrößerung bleibt Scrollen zugunsten der Bedienbarkeit möglich.

## Fragen ändern

`fragenbaum.json` steuert Button-Menü, Formular und Übersicht gemeinsam. Die aktuell enthaltenen bauteilspezifischen Fragen sind Vorschläge und können angepasst werden.

- `bauteile`: feste interne Kennung, sichtbare `bezeichnung` und geordnete Liste der spezifischen `fragen`.
- `gemeinsame_fragen`: Fragen vor den spezifischen Fragen. `standort` steht an zweiter Stelle im gesamten Ablauf, `bilder` an dritter. Die Bauteilauswahl kommt automatisch zuerst.
- `fragen`: einmalige Definition jeder Frage. Dieselbe Frage darf in mehreren Bauteilen referenziert werden.
- `typ`: `text`, `zahl`, `auswahl` oder `bilder`.
- `titel` und `text`: Überschrift und Erklärung im Menü.
- `pflicht`: erforderliche Angabe; Bilder sind aktuell immer optional.
- `antworten`: bei Auswahlfragen jeweils eine stabile Kennung `wert` und den sichtbaren `text` eintragen.
- `einheit`, `minimum`, `maximum`: Eigenschaften von Zahlenfeldern.
- `maximale_laenge`: Zeichenbegrenzung für Textfelder.
- `kurzbezeichnung`, `in_uebersicht`: Bezeichnung und Sichtbarkeit in der Meldungsübersicht.
- `sichtbar_wenn`: Liste von Bedingungen, die alle erfüllt sein müssen. `{"bilder_vorhanden": false}` zeigt eine Frage nur ohne Bilder. `{"frage": "rollladenproblem", "wert": "oben"}` zeigt sie nur bei dieser Antwort. Die Bezugsfrage muss im Ablauf vorher stehen.

JSON erfordert doppelte Anführungszeichen und erlaubt weder Kommentare noch ein Komma nach dem letzten Listenelement. Alle referenzierten Fragen müssen vorhanden sein. Bedingungen gelten gemeinsam für Button-Menü, Bearbeitungsformular und Meldungsübersicht. Ändert sich die maßgebliche Antwort oder werden Bilder hinzugefügt, verschwinden unpassende Fragen und ihre Antworten. Beim Entfernen des letzten Bildes erscheint die Breitenfrage wieder.

Interne Frage- und Antwortkennungen bei bereits verwendeten Fragen beibehalten. Sichtbare Beschriftungen können geändert werden. Bei grundlegenden Änderungen die `version` erhöhen. Eine automatische Migration bereits gespeicherter Meldungen auf einen strukturell anderen Fragenbaum ist noch nicht enthalten.

## Speicherung

Erst „Meldung speichern“ beziehungsweise „Änderungen speichern“ schreibt die Meldung dauerhaft in IndexedDB. „Abbrechen“ verwirft den aktuellen Entwurf und ungespeicherte Änderungen. Bilder werden als Dateiobjekte mit der Meldung gespeichert: maximal fünf Bilder mit jeweils maximal 10 MB, Formate JPG, PNG und WebP. Es erfolgt kein Upload auf einen Server.

Die Datenbank ist je Website-Ursprung und Unterpfad getrennt. Ein Umbenennen oder Verschieben des Website-Ordners zeigt deshalb eine neue, leere Sammlung. Andere Browser, Geräte und private Browsersitzungen teilen die Daten nicht. Das Löschen der Browserdaten beziehungsweise automatische Speicherbereinigung kann die Meldungen entfernen. Es handelt sich aktuell nicht um eine Sicherung oder einen Versand.

`beispiel-meldung.json` zeigt eine menschenlesbare Darstellung der gespeicherten Struktur. In der tatsächlichen IndexedDB steht unter `bilder[].datei` ein echtes `File`-Objekt statt des Beispieltextes. Binäre Bilder werden nicht als Base64 in JSON umgewandelt.

Das Bauteil bleibt beim Bearbeiten fest. Die übrigen Antworten, die freie Problembeschreibung und die Bilder sind änderbar. Löschen entfernt nach Rückfrage die Meldung einschließlich ihrer Bilder. „Meldungen abschicken“ ist bewusst deaktiviert; Kundendaten und Versand sind noch nicht implementiert.
