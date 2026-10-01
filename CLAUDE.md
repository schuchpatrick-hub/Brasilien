# Brasilienreise 2026/27 – Hinweise für Claude

Planungs-Repo für die Brasilienreise (27.12.2026 – 20./21.01.2027). Kein Code-Projekt: Inhalt ist die
Reiseübersicht, die bei neuen Infos (Buchungen, Chat-Exporte, Screenshots) aktualisiert wird.

## Dateien

| Datei | Zweck |
|---|---|
| `README.md` | Hauptübersicht (Route, Tag für Tag, Flüge, Unterkünfte, Kosten, offene Punkte, Gesundheit) |
| `web/trip.json` | **Datenquelle** für Heute-Ansicht, Tag für Tag und Kalenderdateien (Tage, Termine mit UTC-Zeiten, Unterkünfte, Crew, Drinks, Real-Rechner) |
| `web/trip.json` → `flights`, `costs` | Flüge als Bordkarten (Status `booked`/`open`/`check`, Warnhinweise, Suchlinks für offene Flüge) und Kosten pro Gruppe; auf der Webseite nicht mehr in `page_body.html` pflegen |
| `web/page_body.html` | Statischer Inhalt der Webseite; jede `<section>` hat `data-tab` = Kapitel, zu dem der Reiter oben springt; alles bleibt untereinander sichtbar (Reihenfolge: uebersicht, tage-tab, reise, crew-tab, karten-tab, drinks-tab, unterwegs-tab = Sprache + Real-Rechner, infos, vorfreude-tab, spiele-tab, extras; Reiter und Kapitel müssen in derselben Reihenfolge stehen) (Stationen, Flüge, Kosten, Praktisches, Packlisten, Downloads); `%%MAP%%` = Karte |
| `web/page_script.html` | JavaScript der Webseite: Heute/Countdown, Gruppen-Umschalter, Drinks und Check-ins (`db`), Real-Rechner, Packlisten (localStorage), PDF-Download, Vorfreude-Kalender, Zeitkapsel; `%%TRIP%%` = trip.json |
| `web/page_head.html` | Titel + CSS der Webseite (Farb-Tokens, Hell/Dunkel) |
| `web/poster_template.html` | Rahmen für das Reisebild (Titel, Stationsleiste unten) |
| `tools/gen_map.py` | Zeichnet die Karte: Orte, Flugbögen, Beschriftungen, Südost-Ausschnitt |
| `tools/gen_scenes.py` | Selbst gezeichnete SVG-Szenen (Copacabana-Kopfbild mit Tageszeit-Himmel, Bild je Station, Trenner); im HTML als `%%SCENE:name%%` |
| `web/fotos/` | Eigene Fotos (von Patrick): `copacabana.jpg` = Kopfbild, sonst `<szene>.jpg` (guaruja, rio, iguacu, manaus, juma, paraty, ilha; Ausschnitt in `build.py` → `PHOTO_POS`; max. 1600 px breit), `build.py` legt sie automatisch über die Zeichnung (Station, Trenner, Heute-Kasten); fehlt das Foto, bleibt die Zeichnung. Beim Veröffentlichen in `files` mitgeben (`fotos/<name>.jpg`) |
| `tools/gen_audio.py` | Erzeugt `web/audio/*.mp3` (Sprachführer) mit eSpeak NG + MBROLA (erst Deutsch mit de4, dann Portugiesisch mit br3); nur nötig, wenn Sätze in `trip.json` → `phrases` neu/geändert sind (`apt-get install espeak-ng mbrola mbrola-br3 mbrola-de4`, `pip install lameenc`). Beim Veröffentlichen alte MP3-Pfade in `files` auf `null` setzen |
| `IDEEN.md` | Ideen-Speicher: vorgemerkte Wünsche von Patrick (z. B. Strafen-Glücksrad) und Vorschläge; bei „mach X“ hier nachsehen |
| `tools/build.py` | Baut `reisebild.svg`, `reisebild.png` und `web/brasilien-reise.html` neu |

Generiert (nicht von Hand bearbeiten): `reisebild.svg`, `reisebild.png`, `web/brasilien-reise.html`,
`kalender/*.ics`, `brasilien-reise.pdf`.

## Aktualisieren

Hauptversion ist der Branch `main` (Links auf der Webseite zeigen auf `blob/main/...`). Standard-Branch auf GitHub
ist aber weiterhin `claude/brazil-trip-overview-rqdl1r` (Umstellen auf `main` schlug in den Einstellungen fehl).
Deshalb **beide Branches immer gleich halten**: auf `claude/brazil-trip-overview-rqdl1r` arbeiten, per Pull Request
nach `main` mergen, danach den Arbeits-Branch per Fast-Forward auf `main` setzen
(`git fetch origin && git merge --ff-only origin/main && git push origin claude/brazil-trip-overview-rqdl1r`).
Die Webseite erst nach dem Merge neu veröffentlichen.


1. Fakten ändern in `README.md`, `web/page_body.html` **und** `web/trip.json` (plus ggf. Stationsleiste in
   `web/poster_template.html`, Beschriftungen in `tools/gen_map.py`). Offene Punkte stehen nur in der README (eine To-do-Liste gibt es auf der Webseite nicht mehr).
2. `pip install playwright` (einmalig, für das PNG; Chromium liegt in `/opt/pw-browsers`), dann
   `python3 tools/build.py`. Die Natural-Earth-Daten werden beim ersten Lauf nach `tools/data/` geladen (gitignored).
3. Karte nach Änderungen einmal ansehen (`reisebild.png`), auf überlappende Beschriftungen achten.
4. Webseite neu veröffentlichen: Artifact-Publish von `web/brasilien-reise.html` mit
   `url: https://claude.ai/artifact/3MHzcPCtQJY7Kx5XUHDGZE` (vorher `action: read`), damit der Link gleich bleibt,
   und `files`: `brasilien-reise.pdf`, alle `fotos/<name>.jpg` → `web/fotos/<name>.jpg`, plus alle `audio/<name>.mp3` → `web/audio/<name>.mp3` (Sprachführer). `capabilities` weglassen, dann bleiben
   `db`, `user`, `downloads` erhalten.
5. „Stand“-Datum in README und Webseite anpassen, committen, pushen.

## Kopfbereich (Übersicht)

Kopfbild, Titel, Reisedaten, Gruppen-Umschalter (zeigt auch die Namen), Heute-Karte (`#heute`/`#today`, Countdown bzw.
Tagesprogramm) und Eckdaten (`#hero-facts`, Nächte je Gruppe, offene Flüge live aus `flights`) stecken zusammen im
`<header>`. Unterwegs zeigt das Kopfbild automatisch das Foto der heutigen Station (`setHero`).

## Crew-Profile

Steckbriefe stehen in `web/trip.json` → `crew` (ein Eintrag mit `facts`/`quote` wird als große Karte gezeigt).
**Fotos liegen nur im Artifact** (`crew/<id>.jpg` 480×480 fürs runde Profilbild, `crew/<id>-gross.jpg` max. 1200 px für die Vergrößerung per Klick), nicht im öffentlichen Repo
(`web/crew/` ist gitignored). Beim Neuveröffentlichen `crew/...` nicht in `files` auf `null` setzen, dann bleiben sie
erhalten; bei Bedarf mit `Artifact` `action: read` + `path: "crew/<id>.jpg"` zurückholen. Im PDF werden keine Fotos gezeigt. Unbeteiligte Personen im Hintergrund werden weichgezeichnet.
Alle sechs haben der Verwendung ihres Fotos zugestimmt (laut Patrick, 30.09.).

## Crew-Karten (FIFA-Stil)

Kapitel `#karten`, eigener Reiter „Karten“ (`karten-tab`) direkt nach Crew. Basiswerte, Position, Flagge, Verein, Spezialwert, schwacher Fuß/Tricks, PlayStyles
und Scout-Bericht in `trip.json` → `crew[].card`. Zwölf Werte (TTP, TRI, FLI, ORI, BUF, PÜN, KAT, SMB, KAR, GRI, SCH, MEK; `cardsInfo.worse` = GRI/SCH/MEK rot, höher = schlimmer).
Live: TRI + 1 je 6 Drinks (max +6), KAT − (Drinks der letzten 14 h − 5, max −15), Gesamtwertung = Schnitt aller zwölf Werte (rote `worse` als 100 − Wert) + 16 (`OVR_PLUS`)
± (Siege − letzte Plätze, max ±5) ± Ereignisse. Beste Karte (wenn schon gespielt) = blaue TOTS-Karte, meiste letzte Plätze = rote
Laterne. Marktwert vorne unten: Grundwert 0,5 Mio. € · 2^((Gesamtwertung ohne Siege/Ereignisse − 60)/5), täglich neu ab 01.10. (Tageslaune ±6 %
fest pro Tag und Person, Siege +6 %, letzte Plätze −5 %, Drinks bis +4 % pro Tag, dauerhaft; Rückkehr Richtung Grundwert),
mit Pfeil zur Vortagsveränderung und Rekordwert auf der Rückseite. Antippen dreht die Karte (Rückseite scrollbar: Scout-Bericht, PlayStyles, Spielerakte `card.file` mit Ablöse-Klausel, Vertrag, Verletzungen, Torjubel, Transfergerücht; unten Drinks, Siege, Form).

**Werte anpassen** (nur Admin, „✏️ Werte anpassen“ unter den Karten): Ereignisse in db-Collection `cardlog`
(`who`, `stat`, `d` = Änderung, `why`, `ts`), werden dauerhaft auf die Basiswerte addiert (1–99); Vorlagen in
`trip.json` → `cardsInfo.presets` (zu spät PÜN −5, geschnarcht SCH +5 …). Heutige Änderungen stehen als kleines +/− am Wert,
Liste „📰 Transfer-News“ mit Löschen (zweimal tippen).
Ereignisse wirken auf **Gesamtwertung** (Summe „gut“ / 3, max ±8; bei GRI/SCH/MEK zählt + als schlecht; Grundwert aus den
unveränderten Basiswerten) und **Marktwert** (am Tag des Ereignisses dauerhaft ±0,8 % je Punkt, max ±15 % pro Tag).

## Gast-Ansicht

Alle Schreibrecht-Prüfungen laufen über `canWrite()` in `page_script.html`. Wer Schreibrechte hat, sieht unter
Downloads den Kasten „Gast-Ansicht“ (`#guest-box`); „👁 Als Gast ansehen“ setzt localStorage `br26.guest` = 1 und lädt neu,
dann verhält sich die Seite wie für Mitreisende ohne Schreibrecht (Leiste unten „Beenden“). Ändert keine echten Rechte.

## Eingaben ohne Handy-Tastatur, Rückgängig

Zahlenfelder (`type=number`) ließen die Seite im claude.ai-Viewer hängen. Deshalb gibt es keine mehr: `stepper()` in
`page_script.html` baut Plus/Minus-Knöpfe mit verstecktem `<input>` (feuert `input`/`change`), der Real-Rechner hat ein eigenes
Tastenfeld (`#fx-pad`). Nach dem Speichern von Drinks, Partien und Karten-Ereignissen erscheint `undoToast()` mit „Rückgängig“
(löscht die eben angelegten Dokumente). Drinks: „⚡ Nochmal dasselbe“ (`#dr-again`, letzte 4 Kombinationen im localStorage
`br26.drinkRecent`) und Schnellwahl Gringos / Daijo & Greisel / Alle.

## Drinks-Counter

Kapitel „Drinks“ (`#drinks`). Daten in der Artifact-Datenbank: Collection `drinks` (ein Dokument pro Getränk:
`who` = Crew-`id`, `cat`, `name`, `ml`, `abv`, `ts` = Millisekunden UTC) und `people/<id>` (`kg`, `sex` für die
Promille-Schätzung, Standardwerte in `trip.json` → `drinks.body`). Getränke-Vorlagen und Kategorien in
`trip.json` → `drinks`. Auswertung (Ranking, Pegel nach Widmark, Tage, Gesamtstatistik) passiert im Browser.
Lesen/Korrigieren: `ArtifactData` `list`/`delete` auf `drinks`. Schreiben dürfen nur Owner und per E-Mail
eingeladene Editoren (nicht, solange ein öffentlicher Link aktiv ist). Ohne Schreibrecht bleibt die
Eingabemaske sichtbar, aber gesperrt, mit Hinweis „Eintragen nur durch den Admin (Patrick)“.

## Vorfreude: Kalender und Zeitkapsel

Reiter „Vorfreude“ (`vorfreude-tab`). **Kalender** (`#kalender`): 88 Türchen vom 01.10. bis Abflug 27.12. in `trip.json` → `advent`
(`d` Datum, `cat` fact/word/song/crew/food/task/place/special, `e` Emoji, `t` Titel, `x` Text, optional `pt`/`say`
Portugiesisch mit Aussprache, `link` Spotify-Suche oder `#anker`). Datum nach Berliner Zeit, geöffnete Türchen pro Handy im
localStorage. **Zeitkapsel** (`#kapsel`): Fragen in `trip.json` → `kapsel.questions` (Typen crew, number, choice, yesno, text).
Abgabe für alle sechs bis 27.12.; alle Fragen zählen über die ganze Reise (optional `from` = Frage zählt erst ab Datum).
Tipps in db-Collection `kapsel` (Dokument-ID = Crew-`id`, `a` = {Frage-id: Antwort}, `ts`), eintragen nur Admin; bis
`revealAt` (19.01.2027 20 Uhr Rio) zeigt die Seite nur, wer getippt hat. Danach Antworten, Auflösung durch den Admin in
`kapselres/solution` (`s`). Auswertung: Punkte nach `kapsel.points` (Treffer 3; Zahlen genau 5, am nächsten 3,
Zweitnächster 1), Podest + Tabelle „Hellseher der Reise“ (Letzter = „Blindgänger“), Stimmenverteilung je Frage und
„Was die Crew über sich denkt“ (Titel aus `title` je Crew-Frage, meistgetippte Person).

## Spiele

Reiter „Spiele“ (`spiele-tab`, `#spiele`). Spiele in `trip.json` → `games.types` (Blacky Jacky = `rank`, nur Platzierung, `places` = {id: Platz}; Wizard = `wizard`,
Footvolley = `teams`), unterwegs neue Spiele über die Seite (db-Collection `gametypes`: `name`, `emoji`, `mode`
rank/points/winner/teams, `higher`). Partien in db-Collection `games` (`game`, `mode`, `ts`, `players`, je nach Modus `scores`,
`winners`, `teams` {a, b, sa, sb, loc = gegen Einheimische}, Wizard `rounds` [{id: {a: Ansage, s: Stiche}}] und `done`).
Wizard-Punkte: richtig 20 + 10 je Stich, sonst −10 je Stich daneben; Runden = 60 / Spielerzahl. Rangliste nach Siegen
(Gleichstand: Siegquote), Filter pro Spiel, Bilanz Crew gegen Einheimische, Rote Laterne (meiste letzte Plätze). Eintragen nur Admin.
Löschen (nur Admin): einzelne Partien im Verlauf (🗑), laufenden Wizard-Block, unter „Spiele verwalten“ ganze Spiele samt
Partien (eigene: Dokument in `gametypes` löschen; Standardspiele werden nur ausgeblendet über db-Dokument `gamecfg/hidden` `ids`).
Verlierer bekommen derbe Sprüche aus `games.roasts` (`person` je Crew-`id`, `game` je Spiel, `generic`, `locals` bei Niederlage gegen
Einheimische; `{n}` = Name, `{n}s` = Genitiv), pro Partie fest, „Anderer Spruch“ würfelt neu. Hintergrund: Szene `spiele` in `gen_scenes.py`.

## Real-Rechner

Kapitel „Real-Rechner“ (`#rechner`, Reiter „Unterwegs“ `unterwegs-tab` zusammen mit dem Sprachführer). Kurs und lustige Vergleiche in `trip.json` → `money`
(`rate` = R$ pro €, `compare`: `brl` = Richtpreis pro Stück, `t` = Text mit `{n}`, `always` = auch bei winzigen
Anteilen zeigen). Eigener Kurs wird pro Handy im localStorage gespeichert. Vergleiche werden gemischt, ohne direkte Wiederholung.

## Karte: Fortschritt und Check-ins

Routenlinien und Stopps in `tools/gen_map.py` tragen Daten (`data-d`, `data-from`/`data-to`); die Seite färbt
Erledigtes gelb und lässt den heutigen Stopp pulsieren. Check-ins (Koordinaten aus Google Maps) liegen in der
Collection `checkins` (`lat`, `lon`, `label`, `ts`) und erscheinen als rote Pins. Echtes GPS-Tracking ist im
claude.ai-Viewer nicht möglich (Standortzugriff gesperrt), daher manuelles Einchecken durch den Admin.

## Karte: Infokarten

Stopps (`data-stop`) und Flughäfen GRU/CGH (`data-ap`) in `tools/gen_map.py` sind antippbar; darunter Stations-Chips und
`#mi-card` mit Unterkunft (Maps-/Uber-Knöpfe), Anreise, Highlights (Google-Maps-Links), Warnhinweis und Flughäfen samt
Flügen aus `flights`. Daten in `trip.json` → `mapinfo` (`stops`, `airports`; `q` = Suchbegriff). Fahrzeiten-Liste im
Südost-Ausschnitt, Zeitzone Manaus und Pass-Hinweis Iguaçu direkt in `gen_map.py`. Flugbögen lesen den Status aus
`trip.json` → `flights` (`open` = orange, nur Daijo & Greisel = lila `flB`), ☾ = Nachtflug, Flugdauer an den Bögen.
GIG/SDU im Ausschnitt leicht versetzt neben Rio.

## Regeln

- **Repo ist öffentlich:** keine Roh-Chats, Telefonnummern, IBANs, Nachnamen, Passdaten,
  Buchungsnummern oder Splitwise-Einladungslinks einchecken. Nur Vornamen/Spitznamen.
- Unsichere Angaben kennzeichnen (🟡 prüfen / ❓ unklar) statt raten.
- Personen: Gringos plus 1 Cevapi = Jonas, Patrick, Simon, Marco (ab 27.12.); Daijo & Greisel stoßen am 06.01. in Rio dazu.
  Schreibweise **Daijo** (nicht „Dajo“); die interne Crew-`id` bleibt `dajo` (Datenbank, Foto `crew/dajo.jpg`).
  Echte Vornamen verwenden (nicht die Chat-Spitznamen Steini = Simon, Lubo = Marco). Greisel und Daijo bleiben so.
