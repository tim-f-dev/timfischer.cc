# Deutsche Website

Statische Website ohne Build-Schritt oder lokale Abhängigkeiten. `public/index.html` im Browser öffnen. Die Startseite ist bis auf die rechtliche Navigation leer.

## Lokal starten und auf Cloudflare Workers deployen

Node.js mit npm installieren, dann im Projektordner:

```sh
npx wrangler login
npx wrangler dev
```

Deployment prüfen und anschließend veröffentlichen:

```sh
npx wrangler deploy --dry-run
npx wrangler deploy
```

Wrangler wird bei Bedarf durch `npx` heruntergeladen. Nur der Ordner `public/` wird hochgeladen. Die Website benötigt kein eigenes Worker-Skript. Der Worker heißt `timfischer-cc` (änderbar in `wrangler.jsonc`). Eine eigene Domain kann anschließend im Cloudflare-Dashboard unter den Worker-Einstellungen verbunden werden.

## Vor Veröffentlichung

- Platzhalter in `public/impressum.html` und `public/datenschutz.html` vervollständigen.
- Geplantes Hosting: Cloudflare Workers. Vom Betreiber festgelegte Speicherdauer für Workers Logs: drei Tage. Die Datenschutzerklärung ist entsprechend angepasst; am Cloudflare-Konto wurden keine Einstellungen verändert. Protokolldaten, Tarif und tatsächliche Aufbewahrung vor Veröffentlichung abgleichen. Geltung des Cloudflare-DPA für das Konto sicherstellen. Im Text ist kein bereits abgeschlossener AV-Vertrag behauptet.
- Cloudflare-Funktionen auf Cookies, automatisch eingefügte Skripte und Analytics prüfen; den entsprechenden Platzhalter in der Datenschutzerklärung auflösen.
- Betreiberabhängige Pflichtangaben prüfen. Die Rechtstexte sind ein Entwurf.
- Nach Fertigstellung die `noindex`-Angabe auf den Rechtsseiten nach Wunsch entfernen.

## Anwaltliche Vorlagen

- Impressum: SQR Rechtsanwälte, https://www.sqr-law.de/muster-impressum (kostenlose Übernahme ausdrücklich gestattet). Anbieter-/Kontaktstruktur übernommen; überholte TMG-/RStV-Verweise nicht übernommen. Keine redaktionellen Inhalte vorhanden.
- Datenschutz: Rechtsanwalt Dr. Sebastian Conrad, https://muster-impressum.de/vorlagen/muster-fuer-eine-datenschutzerklaerung-gemaess-dsgvo/ (kostenlose Nutzung mit Quellenlink gestattet; Link auf der Rechtsseite vorhanden). Für einfache Websites vorgesehen. Gekürzt und angepasst; Kontakt- und technische Hinweise ergänzt. Die Vorlage behauptet eine Anonymisierung spätestens nach sieben Tagen sowie einen Auftragsverarbeiter im Inland. Beides mangels Hosting-Informationen ausdrücklich nicht übernommen.

Quellen abgerufen am 25.10.2026. Es handelt sich um angepasste anwaltliche Muster, nicht um eine individuelle anwaltliche Prüfung dieser Website. Die verbleibenden Platzhalter sind vor Veröffentlichung zu vervollständigen; insbesondere auch die Verarbeitung beim verwendeten E-Mail-Dienst prüfen.

Cloudflare-Ergänzung anhand offizieller Anbieterinformationen, nicht als Bestandteil der anwaltlichen Originalvorlage: https://www.cloudflare.com/cloudflare-customer-dpa/ (Version 6.4), https://www.cloudflare.com/cloudflare-customer-scc/ und https://www.cloudflare.com/privacypolicy/; geprüft am 25.10.2026. Die vom Betreiber gewählten drei Tage gelten nur für Workers Logs, nicht pauschal für alle Cloudflare-Daten.

Workers Logs: https://developers.cloudflare.com/workers/observability/logs/workers-logs/ (geprüft am 25.10.2026). Laut Dokumentation ist Observability bei neuen Workers standardmäßig aktiviert; gespeicherte Workers Logs werden derzeit im Free-Tarif 3 Tage und im Paid-Tarif 7 Tage aufbewahrt. Diese Fristen gelten nicht pauschal für alle Cloudflare-Daten oder exportierte Logs. Die Dokumentation kündigt Änderungen zum 01.12.2026 an. Vor Veröffentlichung die tatsächlichen Einstellungen und dann gültigen Fristen prüfen.
