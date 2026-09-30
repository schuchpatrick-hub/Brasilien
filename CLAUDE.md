# Brasilienreise 2026/27 – Hinweise für Claude

Planungs-Repo für die Brasilienreise (27.12.2026 – 20./21.01.2027). Kein Code-Projekt: Inhalt ist die
Reiseübersicht, die bei neuen Infos (Buchungen, Chat-Exporte, Screenshots) aktualisiert wird.

## Dateien

| Datei | Zweck |
|---|---|
| `README.md` | Hauptübersicht (Route, Tag für Tag, Flüge, Unterkünfte, Kosten, offene Punkte, Gesundheit) |
| `web/trip.json` | **Datenquelle** für Heute-Ansicht, Tag für Tag, To-do-Liste und Kalenderdateien (Tage, Termine mit UTC-Zeiten, Unterkünfte, To-dos) |
| `web/page_body.html` | Statischer Inhalt der Webseite; jede `<section>` hat `data-tab` = Kapitel, zu dem der Reiter oben springt; alles bleibt untereinander sichtbar ( uebersicht, tage-tab, todos-tab, reise, sprache-tab, infos, extras) (Stationen, Flüge, Kosten, Praktisches, Packlisten, Downloads); `%%MAP%%` = Karte |
| `web/page_script.html` | JavaScript der Webseite: Heute/Countdown, Gruppen-Umschalter, gemeinsame To-dos (`db`), Packlisten (localStorage), PDF-Download, WhatsApp-Text; `%%TRIP%%` = trip.json |
| `web/page_head.html` | Titel + CSS der Webseite (Farb-Tokens, Hell/Dunkel) |
| `web/poster_template.html` | Rahmen für das Reisebild (Titel, Stationsleiste unten) |
| `tools/gen_map.py` | Zeichnet die Karte: Orte, Flugbögen, Beschriftungen, Südost-Ausschnitt |
| `tools/gen_audio.py` | Erzeugt `web/audio/*.mp3` (Sprachführer) mit Piper-Stimme; nur nötig, wenn Sätze in `trip.json` → `phrases` neu/geändert sind (`pip install piper-tts lameenc`) |
| `tools/build.py` | Baut `reisebild.svg`, `reisebild.png` und `web/brasilien-reise.html` neu |

Generiert (nicht von Hand bearbeiten): `reisebild.svg`, `reisebild.png`, `web/brasilien-reise.html`,
`kalender/*.ics`, `brasilien-reise.pdf`.

## Aktualisieren

1. Fakten ändern in `README.md`, `web/page_body.html` **und** `web/trip.json` (plus ggf. Stationsleiste in
   `web/poster_template.html`, Beschriftungen in `tools/gen_map.py`, WhatsApp-Text in `web/page_script.html`).
   Erledigte To-dos nicht aus trip.json löschen, solange die geteilte Liste sie abhakt; neue To-dos mit neuer `id`.
2. `pip install playwright` (einmalig, für das PNG; Chromium liegt in `/opt/pw-browsers`), dann
   `python3 tools/build.py`. Die Natural-Earth-Daten werden beim ersten Lauf nach `tools/data/` geladen (gitignored).
3. Karte nach Änderungen einmal ansehen (`reisebild.png`), auf überlappende Beschriftungen achten.
4. Webseite neu veröffentlichen: Artifact-Publish von `web/brasilien-reise.html` mit
   `url: https://claude.ai/artifact/3MHzcPCtQJY7Kx5XUHDGZE` (vorher `action: read`), damit der Link gleich bleibt,
   und `files`: `brasilien-reise.pdf` plus alle `audio/<name>.mp3` → `web/audio/<name>.mp3` (Sprachführer). `capabilities` weglassen, dann bleiben
   `db`, `user`, `downloads` erhalten. Stand der geteilten To-dos: `ArtifactData` `list` auf Collection `todos`
   (Dokument-ID = To-do-`id`, Felder `done`, `who`; eigene Punkte mit `custom: true`, `title`).
5. „Stand“-Datum in README und Webseite anpassen, committen, pushen.

## Crew-Profile

Steckbriefe stehen in `web/trip.json` → `crew` (ein Eintrag mit `facts`/`quote` wird als große Karte gezeigt).
**Fotos liegen nur im Artifact** (`crew/<id>.jpg` 480×480 fürs runde Profilbild, `crew/<id>-gross.jpg` max. 1200 px für die Vergrößerung per Klick), nicht im öffentlichen Repo
(`web/crew/` ist gitignored). Beim Neuveröffentlichen `crew/...` nicht in `files` auf `null` setzen, dann bleiben sie
erhalten; bei Bedarf mit `Artifact` `action: read` + `path: "crew/<id>.jpg"` zurückholen. Im PDF werden keine Fotos gezeigt. Unbeteiligte Personen im Hintergrund werden weichgezeichnet.
Alle sechs haben der Verwendung ihres Fotos zugestimmt (laut Patrick, 30.09.).

## Drinks-Counter

Kapitel „Drinks“ (`#drinks`). Daten in der Artifact-Datenbank: Collection `drinks` (ein Dokument pro Getränk:
`who` = Crew-`id`, `cat`, `name`, `ml`, `abv`, `ts` = Millisekunden UTC) und `people/<id>` (`kg`, `sex` für die
Promille-Schätzung, Standardwerte in `trip.json` → `drinks.body`). Getränke-Vorlagen und Kategorien in
`trip.json` → `drinks`. Auswertung (Ranking, Pegel nach Widmark, Tage, Gesamtstatistik) passiert im Browser.
Lesen/Korrigieren: `ArtifactData` `list`/`delete` auf `drinks`. Schreiben dürfen nur Owner und per E-Mail
eingeladene Editoren (nicht, solange ein öffentlicher Link aktiv ist). Ohne Schreibrecht bleibt die
Eingabemaske sichtbar, aber gesperrt, mit Hinweis „Eintragen nur durch den Admin (Patrick)“.

## Karte: Fortschritt und Check-ins

Routenlinien und Stopps in `tools/gen_map.py` tragen Daten (`data-d`, `data-from`/`data-to`); die Seite färbt
Erledigtes gelb und lässt den heutigen Stopp pulsieren. Check-ins (Koordinaten aus Google Maps) liegen in der
Collection `checkins` (`lat`, `lon`, `label`, `ts`) und erscheinen als rote Pins. Echtes GPS-Tracking ist im
claude.ai-Viewer nicht möglich (Standortzugriff gesperrt), daher manuelles Einchecken durch den Admin.

## Regeln

- **Repo ist öffentlich:** keine Roh-Chats, Telefonnummern, IBANs, Nachnamen, Passdaten,
  Buchungsnummern oder Splitwise-Einladungslinks einchecken. Nur Vornamen/Spitznamen.
- Unsichere Angaben kennzeichnen (🟡 prüfen / ❓ unklar) statt raten.
- Personen: Gringos plus 1 Cevapi = Jonas, Patrick, Simon, Marco (ab 27.12.); Dajo & Greisel stoßen am 06.01. in Rio dazu.
  Echte Vornamen verwenden (nicht die Chat-Spitznamen Steini = Simon, Lubo = Marco). Greisel und Dajo bleiben so.
