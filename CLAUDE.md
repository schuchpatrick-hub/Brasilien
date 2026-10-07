# Brasilienreise 2026/27 – Hinweise für Claude

Planungs-Repo für die Brasilienreise (27.12.2026 – 20./21.01.2027). Kein Code-Projekt: Inhalt ist die
Reiseübersicht, die bei neuen Infos (Buchungen, Chat-Exporte, Screenshots) aktualisiert wird.

## Dateien

| Datei | Zweck |
|---|---|
| `README.md` | Hauptübersicht (Route, Tag für Tag, Flüge, Unterkünfte, Kosten, offene Punkte, Gesundheit) |
| `web/trip.json` | **Datenquelle** für Heute-Ansicht, Tag für Tag und Kalenderdateien (Tage, Termine mit UTC-Zeiten, Unterkünfte, Crew, Drinks, Real-Rechner) |
| `web/trip.json` → `flights`, `costs` | Flüge als Bordkarten (Status `booked`/`open`/`check`, Warnhinweise, Suchlinks für offene Flüge) und Kosten pro Gruppe (`cat` flug/stay = Block „Flüge“ bzw. „Unterkünfte“ mit Zwischensumme, `sub` = Erklärzeile, je Gruppe überschreibbar, `k` fix/ca/open/split, `url` = Buchungsseite, macht den Namen antippbar); auf der Webseite nicht mehr in `page_body.html` pflegen |
| `web/page_body.html` | Statischer Inhalt der Webseite; jede `<section>` hat `data-tab` = Kapitel, zu dem der Reiter oben springt; alles bleibt untereinander sichtbar (Reihenfolge seit 05.10.: erst alles Reale zur Reise, dann der Spaß: uebersicht, tage-tab, reise, infos = Praktisches + Gesundheit & Einreise, unterwegs-tab „Unterwegs & Packen“ = Sprache + Real-Rechner + Packlisten (seit 06.10. kompakt: Packlisten als aufklappbare Kästen `details.pk` mit Fortschritt, Sprachführer zeigt je Thema 6 Sätze + „weitere Sätze“ `.ph-more`, Faustregeln eingeklappt), dann crew-tab = Crew + Karten, kino-tab, vorfreude-tab, spiele-tab, drinks-tab, ganz unten downloads = Downloads & Kalender mit eigenem Reiter; Reiter und Kapitel müssen in derselben Reihenfolge stehen; Reiter mit Emoji). Jede `<section>` hat `data-kind` (start/kino/plan/fun/go/info = Farbe `--k` für Symbol-Kachel `.ico` in der `h2`, Wellenlinie und Trennlinie). Unter den Reitern Themen-Kacheln `#themen` (`.tile`, Live-Hinweise per `data-hint`: Countdown, offene Flüge, heutiges Türchen). Teil-Banner `.divider-scene.part` (Planung, Unterwegs, Infos & Packen, Crew & Spaß) trennen die Bereiche (Stationen, Flüge, Kosten, Praktisches, Packlisten, Downloads); `%%MAP%%` = Karte |
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
4. Webseite neu veröffentlichen: Artifact-Publish von `web/private/brasilien-reise.html` (vollständige Fassung mit den privaten
   Porträts; nur wenn es sie nicht gibt, `web/brasilien-reise.html`) mit
   `url: https://claude.ai/artifact/3MHzcPCtQJY7Kx5XUHDGZE` (vorher `action: read`), damit der Link gleich bleibt,
   und `files`: `brasilien-reise.pdf`, `audio/sfx.mp3`, alle `fotos/<name>.jpg` → `web/fotos/<name>.jpg`, plus alle `audio/<name>.mp3` → `web/audio/<name>.mp3` (Sprachführer). `capabilities` weglassen, dann bleiben
   `db`, `user`, `downloads` erhalten.
5. „Stand“-Datum setzt `build.py` automatisch (Tag des Neubaus, README und Webseite `%%STAND%%`); committen, pushen.

## Kopfbereich (Übersicht)

Kopfbild, Titel, Reisedaten, Gruppen-Umschalter (zeigt auch die Namen), Heute-Karte (`#heute`/`#today`, Countdown bzw.
Tagesprogramm) und Eckdaten (`#hero-facts`, Nächte je Gruppe, offene Flüge live aus `flights`) stecken zusammen im
`<header>`. Unterwegs zeigt das Kopfbild automatisch das Foto der heutigen Station (`setHero`). Den Gruppen-Umschalter gibt es nur noch
im Kopf; Tage und Flüge zeigen per `[data-g-note]` nur, welche Ansicht gilt. Themen-Kacheln schmal (5 Spalten, Hinweise unter 900 px ausgeblendet).

**Tag für Tag nach Stationen** (seit 05.10.): `renderDays()` packt die Tage in Stations-Tafeln (`.st-panel`, Zuordnung `stopOfDay(d)`
wie die Karte, Kopf aus `mapinfo.stops`), Zeilen unverändert; Chips + Wischen über den Helfer `slider(track, chips, opt)` (Start =
heutige bzw. nächste Station). Flüge ebenso als Karussell (Start = nächster Flug). Im PDF bleibt alles untereinander. `track.__go(i)`
und `track.__idx(el)` springen von außen (Suche).
Der Abschnitt `#stationen` bleibt in `page_body.html` (fürs PDF), wird auf der Webseite aber versteckt: `stationNodes()` hängt jede
`.stop` (Bild, Unterkunft, Links, Tipps als `<details class="st-tips">`, Status-Pill in den Tafel-Kopf) oben in die passende Tafel
(Zuordnung über den Namen aus `mapinfo.stops`), „Heimreise“ ans Ende der Ilha-Tafel.

**Fahrer-Karten** (`DRV`, `drvShow(key)`, Knopf `drvBtn`): Ziel groß auf Portugiesisch („Por favor, me leve para …“) mit Adresse,
Kopieren, Maps, Uber. Daten in `trip.json` → `mapinfo.stops[].stays[].drv` (`name`, `addr`, `area`, `cep`, `hint`; Adressen aus
Booking 🟡, Hinweis `mapinfo.drvNote`), Flughäfen automatisch aus `mapinfo.airports`. Knöpfe in den Stations-Tafeln, in der
Karten-Infokarte („Zeigen“) und im Heute-Kasten bei „Schlafen“. Im PDF stehen alle Karten am Ende der Stationen.

**Offline:** Der claude.ai-Viewer braucht Netz, echtes Offline geht nicht. `wrapCol()` speichert jeden Datenbank-Stand im
localStorage (`br26.cache.<collection>`) und zeigt ihn beim nächsten Laden sofort, bis die Live-Daten kommen. `#off-hint` im
Heute-Kasten: bei fehlendem Netz bzw. vor Abflug (20.–27.12.), Dschungel (08.–10.01.) und Ilha Grande (14.–16.01.) mit
„PDF speichern“ (Reise-Mappe), pro Tag ausblendbar (`br26.offHide`).

**Schnellsuche** (`#q-open` 🔍 rechts in der Reiterleiste): Overlay `.q-box`, Index wird bei jedem Öffnen aus der Seite gebaut (Tage, Flüge,
Stationen, Kosten, Sprachführer, Praktisches, Gesundheit, Packlisten, Crew, Kapitelüberschriften; Liste `SRC`), Akzente egal, alle
Wörter müssen passen. Treffer öffnen `<details>`, das Sprachführer-Thema, die Karussell-Seite bzw. den Crew-Steckbrief und blinken (`.q-flash`).

**Begriffe erklären** (seit 07.10.): `trip.json` → `glossary` [{`t`, `x`}]; `glossApply()` unterstreicht je Kapitel das erste Vorkommen gepunktet (`.gl`, nicht in Knöpfen, Links, Überschriften, Filmen, Karten), Antippen zeigt `.gl-pop`; `renderDays()` ruft es nach jedem Neuaufbau.
**Willkommen** (seit 07.10.): einmaliger Kasten `.welcome` nur beim allerersten Besuch auf einem Gerät (`FIRST_VISIT` = noch kein `br26.*`-Eintrag im localStorage).

**„Ich bin …“** (`#me-box` im Kopf, nach der Wahl nur ein kleiner Chip `.me-mini`, aufklappbar, localStorage `br26.meOpen`): Person wird pro Gerät gemerkt (localStorage `br26.me`), stellt die Gruppe ein, hebt
eigene Crew- und FIFA-Karte hervor und zeigt eigene Werte (Drinks heute/gesamt/Platz, Gesamtwertung, Marktwert, Siege,
Zeitkapsel-Status). Module melden Werte für alle Personen über `meSet()`.

## Was ist neu?

`trip.json` → `news` (`id` eindeutig, `d` Datum, `tab` = Reiter-`data-tab`, `to` = Sprungziel-id, `e` Emoji, `t` Text). Seit 07.10. **kein Kasten mehr**
(Wunsch Patrick: zu groß), nur rote Punkte an Reitern/Kacheln mit Ungesehenem; Reiter/Kachel antippen = gesehen, gemerkt pro Handy im localStorage
`br26.newsSeen` (erster Besuch: alles gilt als gesehen). **Bei jeder sichtbaren Neuerung (Buchung, neue Folge,
neue Funktion) einen Eintrag vorne ergänzen.** Die Kino-Kachel nennt automatisch die neueste freigegebene Folge.

## Crew-Profile

Steckbriefe stehen in `web/trip.json` → `crew` (ein Eintrag mit `facts`/`quote` wird als große Karte gezeigt).
**Fotos liegen nur im Artifact** (`crew/<id>.jpg` 480×480 fürs runde Profilbild, `crew/<id>-gross.jpg` max. 1200 px für die Vergrößerung per Klick), nicht im öffentlichen Repo
(`web/crew/` ist gitignored). Beim Neuveröffentlichen `crew/...` nicht in `files` auf `null` setzen, dann bleiben sie
erhalten; bei Bedarf mit `Artifact` `action: read` + `path: "crew/<id>.jpg"` zurückholen. Im PDF werden keine Fotos gezeigt. Unbeteiligte Personen im Hintergrund werden weichgezeichnet.
Alle sechs haben der Verwendung ihres Fotos zugestimmt (laut Patrick, 30.09.).
Steckbriefe als Karussell (`#crew-list.crew-car`, eine Person pro Ansicht, Pfeile + Mini-Fotos `.crew-nav`, Höhe passt sich der aktuellen Karte an; `crewShow(id)` dreht hin, Köpfe in der Übersicht nutzen das; darunter Chips `.ov-links`: „📋 Profil“ = Steckbrief, „⚽ Karte“, „🎬 Film“ = Spielerporträt, nur mit `port-p<id>` sichtbar). Je Steckbrief 3 Fakten sichtbar, Rest in „Alle n Fakten ▾“ (im PDF alles).

## Crew-Karten (FIFA-Stil)

Kapitel `#karten`, direkt nach Crew, gemeinsamer Reiter „Crew & Karten“ (`crew-tab`). Basiswerte, Position, Flagge, Verein, Spezialwert, schwacher Fuß/Tricks, PlayStyles
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

## Schreibrechte

Patrick lädt die Crew per E-Mail als Bearbeiter ein (Wunsch 07.10.): alle Eingeladenen dürfen dasselbe wie der Admin (Drinks, Spiele, Check-ins, Kartenwerte, Zeitkapsel, Kart-Bestenliste). Sperr-Hinweise lauten daher „nur für Eingeladene (Patrick lädt ein)“, nicht mehr „nur Admin“.

## Gast-Ansicht

Alle Schreibrecht-Prüfungen laufen über `canWrite()` in `page_script.html`. Wer Schreibrechte hat, sieht unter
Downloads den Kasten „Gast-Ansicht“ (`#guest-box`); „👁 Als Gast ansehen“ setzt localStorage `br26.guest` = 1 und lädt neu,
dann verhält sich die Seite wie für Mitreisende ohne Schreibrecht (Leiste unten „Beenden“). Ändert keine echten Rechte.

## Eingaben ohne Handy-Tastatur, Rückgängig

Zahlenfelder (`type=number`) ließen die Seite im claude.ai-Viewer hängen. Deshalb gibt es keine mehr: `stepper()` in
`page_script.html` baut Plus/Minus-Knöpfe mit verstecktem `<input>` (feuert `input`/`change`), der Real-Rechner hat ein eigenes
Tastenfeld (`#fx-pad`). Nach dem Speichern von Drinks, Partien und Karten-Ereignissen erscheint `undoToast()` mit „Rückgängig“
(löscht die eben angelegten Dokumente). Drinks: „⚡ Nochmal dasselbe“ (`#dr-again`, letzte 4 Kombinationen im localStorage
`br26.drinkRecent`) und Schnellwahl Alle / Keiner. Admin-Knopf „＋“ unten rechts (`showFab()`, nur mit Schreibrecht, nicht in der Gast-Ansicht): springt zu Drink, Spiel, Check-in, Kartenwert und zeigt die „Nochmal“-Drinks.
Sprachführer: Handy-Stimme (pt-BR, bevorzugt Premium/Natural) ist Standard, wenn vorhanden; sonst MP3.
Sprachführer kompakt (`#phrases.compact`): Themen-Chips `.ph-cats` (immer nur ein Thema offen, Notfall rot, zuletzt gewähltes im localStorage `br26.phCat`; unterwegs 27.12.–21.01. ohne eigene Wahl am selben Tag automatisch nach Uhrzeit in Rio: abends Party, mittags/abends Restaurant, nachmittags Strand), Aussprache erst beim Antippen des Satzes (`.say-on`), „Satz des Tages“ (`.ph-day`, wechselt täglich), Karteikarten „🎴 Üben“ (`.ph-learn`, gelernt im localStorage `br26.phLearned`). Im PDF alles untereinander.

## Offline-Warteschlange und Live-Anzeige

Alle Module holen die Datenbank über `getDb()` (nicht direkt `claude.use('db')`). Schreibzugriffe (`set`/`delete`) laufen über
`guarded()`: ohne Netz oder nach 10 s ohne Antwort landen sie im localStorage `br26.outbox` und werden bei `online`, beim Laden
und alle 20 s nachgeschickt (`flush()`, gleiche Dokument-ID, daher keine Doppelten). Unten links `#net`: „● live“ (nur Admin),
„○ offline“, „⏳ n Einträge warten“.

## Drinks-Counter

Kapitel „Drinks“ (`#drinks`). Daten in der Artifact-Datenbank: Collection `drinks` (ein Dokument pro Getränk:
`who` = Crew-`id`, `cat`, `name`, `ml`, `abv`, `ts` = Millisekunden UTC) und `people/<id>` (`kg`, `sex` für die
Promille-Schätzung, Standardwerte in `trip.json` → `drinks.body`). Getränke-Vorlagen und Kategorien in
`trip.json` → `drinks`. Auswertung (Ranking, Pegel nach Widmark, Tage, Gesamtstatistik) passiert im Browser.
Ohne Einträge zeigt `#dr-empty` statt der Statistik-Karten einen Witz-Kasten („Noch n Tage Trockenzeit“, Experten-Prognose aus TRI der Crew-Karten); vor dem 27.12. sind Eingabe und Gewichte eingeklappt. Lesen/Korrigieren: `ArtifactData` `list`/`delete` auf `drinks`. Schreiben dürfen nur Owner und per E-Mail
eingeladene Editoren (nicht, solange ein öffentlicher Link aktiv ist). Ohne Schreibrecht bleibt die
Eingabemaske sichtbar, aber gesperrt, mit Hinweis „Eintragen nur durch den Admin (Patrick)“.

## Vorfreude: Kalender und Zeitkapsel

Reiter „Vorfreude“ (`vorfreude-tab`). **Kalender** (`#kalender`): 88 Türchen vom 01.10. bis Abflug 27.12. in `trip.json` → `advent`
(`d` Datum, `cat` fact/word/song/crew/food/task/place/special, `e` Emoji, `t` Titel, `x` Text, optional `pt`/`say`
Portugiesisch mit Aussprache, `link` Spotify-Suche oder `#anker`). Datum nach Berliner Zeit, geöffnete Türchen pro Handy im
localStorage. **Zeitkapsel** (`#kapsel`): Fragen in `trip.json` → `kapsel.questions` (Typen crew, number, choice, yesno, text).
Abgabe für alle sechs bis 27.12.; alle Fragen zählen über die ganze Reise (optional `from` = Frage zählt erst ab Datum).
Eingabe Schritt für Schritt (eine Frage pro Karte, Punkte-Leiste `.ka-dots` zum Springen, Ja/Nein und Auswahl springen
automatisch weiter, am Ende Übersicht `.ka-sum` mit „Versiegeln“; Formular nach dem Versiegeln zugeklappt, ohne Schreibrecht zu).
Tipps in db-Collection `kapsel` (Dokument-ID = Crew-`id`, `a` = {Frage-id: Antwort}, `ts`), eintragen nur Admin; bis
`revealAt` (19.01.2027 20 Uhr Rio) zeigt die Seite nur, wer getippt hat. Danach Antworten, Auflösung durch den Admin in
`kapselres/solution` (`s`). Auswertung: Punkte nach `kapsel.points` (Treffer 3; Zahlen genau 5, am nächsten 3,
Zweitnächster 1), Podest + Tabelle „Hellseher der Reise“ (Letzter = „Blindgänger“), Stimmenverteilung je Frage und
„Was die Crew über sich denkt“ (Titel aus `title` je Crew-Frage, meistgetippte Person).

## Spiele

Reiter „Spiele“ (`spiele-tab`, `#spiele`, nach Kino und Vorfreude). Spiele in `trip.json` → `games.types` (Blacky Jacky = `rank`, nur Platzierung, `places` = {id: Platz}; Wizard = `wizard`,
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

## Karte: Reise-Animation

Knopf „✈️ Reise abspielen“ (`#map-play`) unter der Karte: Flugzeug, Auto und Boot mit runden Crew-Köpfen fahren die
gezeichneten Pfade ab (`getPointAtLength` auf den Pfaden mit `data-d`), Bildunterschriften oben, Ablauf in `play()`.
Dazu: Kamera-Zoom in den Südost-Ausschnitt (viewBox, `camTo`), leuchtende Spur, Nacht mit Sternen bei Nachtflügen,
Feuerwerk zu Silvester, Tageszähler mit Kilometern, Wackelköpfe und Sprechblasen (`say`), Gags (Kaiman, Footvolley-Ball). Vorne Nachrichten-Intro „Gringo-Schau“ (`intro()`, Sprecher `web/audio/intro-nachrichten.mp3`, erzeugt mit Piper-Stimme de-thorsten-low, spielt nur mit Ton an; fürs Video liefert `window.__tripVoice()` die Startzeit, MP3 per ffmpeg `adelay` dazumischen), Koffer am Fallschirm, Sonnenbrand (`burn`) wird von Station zu Station röter, Silvester mit weißen Hüten und 7 Wellen. Am Ende „Pannen vom Dreh“ (Filmklappe `klappe()`, rotes „CUT!“ `cut()`: Flieger in die falsche Richtung, Marco in Manaus vergessen, Boot kentert).
**Musik** (`Music()` im selben Modul, Web Audio, keine Dateien): `mus('mode', 'travel'|'stay')` (Reise-Melodie bzw. Samba mit Tusch), `mus('night', …)` dämpft, Effekte `boom`/`splash`/`kick`; Knopf `#map-sound` (localStorage `br26.sound`). Fürs Video rendert `window.__tripAudio(ms)` dieselbe Musik offline als WAV (base64), mit ffmpeg unterlegen.
Video: Zeit über `window.__tripT` steuern, Bilder mit Playwright aufnehmen und mit ffmpeg (`pip install imageio-ffmpeg`)
zu MP4 machen. Das Video enthält Crew-Fotos, also **nicht** ins Repo legen.

## Samba-Show (Cartoon)

Im eigenen Kapitel „🎬 Kino“ (`#kino`, Reiter `kino-tab`, nach Crew & Karten; dunkler Bühnen-Kasten) mit großem Start-Knopf `#samba-big` über der Bühne (nur im Ruhezustand, Klasse `.idle`) und Kasten „Reise-Film“ (`#kino-film` springt zur Karte und startet `#map-play`) (`#samba`, SVG `#samba-svg`, Knöpfe `#samba-play`/`#samba-sound`). Crew-Köpfe (Fotos) auf
gezeichneten Körpern; Münder wie die South-Park-Kanadier (Foto auf Mundhöhe geteilt, Oberkopf klappt nach der Lautstärkekurve),
Schweißtropfen über dem Foto (Augenbrauen auf Wunsch entfernt). Daten in `trip.json` → `dance`: `look` je Person (Stil, Shirt, Hose, `face`
= Ausschnitt x/y/z, Mundhöhe m, Augenlinie e, Augenabstand ex), `voices` (Stimme je Person), `melodies` (gesungene Chöre: ole, brasil, gringos, caipi; je Durchgang `grp` c1/c2 eine andere, alle singen dieselbe),
`lines` (Zeitpunkt `at`, `alts` = Varianten, pro Abspielen zufällig; `src` = Aufnahme einer anderen Zeile, `mute` = nur Mund bewegen, Ton spielt die Quelle (Schlusschor „Tschau, Brasil!“ = eine klare Stimme mit Chor-Effekt); `vo` = Stimm-Einstellungen nur für diese Zeile (Patrick bei „Büfett“ ohne Tonhöhenverschiebung, sonst unverständlich); Verständlichkeit lässt sich mit Whisper (sherpa-onnx-whisper-small aus den sherpa-onnx-Releases) prüfen; `sing` = gesungen),
`voice` wird erzeugt. Ablauf in `frame(t)`, Zeitfenster in `T`: Ansage, Solos mit Kamera-Zoom, Patrick aus dem Takt (Freeze,
Hähnchen), La Ola, Kostümwechsel mit Blitz + „Olê, olê“ gesungen, Polonaise, Daijo-Solo, Tanz-Duell Simon gegen Greisel mit
Applaus-Meter (Sieger = mehr Siege, bei Gleichstand Tageslaune), Sprung, Ananas auf Jonas, Pyramide, Vorhang, Pannen vom Dreh.
Live-Daten (`MEHUB`): 👑 meiste Siege, 🤡 meiste letzte Plätze, schief und rot = meiste Drinks heute (ab 3). Schatten und
Spiegelung (`<use>` der Figuren) auf nassem Boden. Musik = Modus `show` in `Music()` (`m.drums` = nur Trommeln, `m.music` = Lautstärke
ohne Effekte), Effekte applause/whoo/ding/munch/feedback/crash/thud/flash.
Stimmen: `tools/gen_dance_audio.py` (sherpa-onnx, Stimmen aus den sherpa-onnx-Releases, siehe Kopf der Datei) →
`web/audio/samba-*.mp3`; beim Veröffentlichen alle in `files` mitgeben, nicht mehr benutzte auf `null`.
Interaktiv: Figur antippen (`tapPerson`: Spruch mit Stimme, Sprung, Drehung; Patrick lässt das Hähnchen fallen), Knöpfe
`#samba-clap`/`#samba-cheer` (Publikum klatscht/jubelt, Licht blitzt), nach dem Ende „🎉 Zugabe!“ (`TENC`, kurze Bonus-Runde).
Nach der Polonaise „Tanzschule“ (`T.moves`, 8 s): Moonwalk, Floss, Passinho, Limbo (Patrick bleibt unter der Stange hängen);
am Ende Abspann mit Credits (`T.credits`, `CRED`). Tempo: `SLOW` = 1/0,9 (Show 10 % langsamer; Showzeit = echte Zeit / SLOW, Musik über `E.slow`, Stimmen-MP3s von `gen_dance_audio.py` mit `TEMPO` 0,9 gedehnt, `dur`/`env` bleiben in Showzeit; `__danceAudio`/`__danceVoices` liefern echte Zeit). Knöpfe Klatschen/Jubeln: Effekte `handclaps`/`cheer`. Stimmen laufen über dieselbe Audio-Uhr wie die Musik (`playVoice`: vorgeladen per
`fetch`, dekodiert, mit `start(when)` geplant; die Animation nimmt dann `clock()` = Audiozeit), Vorladen beim Hinscrollen.
Einblendungen skalieren auf schmalen Bildschirmen mit (`UI`). Knopf `#samba-play` startet, pausiert (`ctx.suspend()`, Musik und Stimmen hängen an derselben Audio-Uhr) und setzt fort; `#samba-stop` (nur sichtbar, solange die Show läuft oder pausiert) stoppt ganz und setzt zurück. Tempo: Breite (`UI`) nur per ResizeObserver messen, Sprechblasen nur bei neuem Text neu bauen, im Vollbild und bei längerem Ruckeln Sparmodus `.sb-lite` (ohne Spiegelung/Nebel `.sb-heavy`, Lichtkegel ohne Mischmodus); nach dem Vollbild wird die Bühne neu vermessen und wieder ins Bild gescrollt. Im Vollbild hängt `#samba` direkt unter `<body>` (Platzhalter-Kommentar), der Rest der Seite ist nur unsichtbar (`visibility`, nicht `display:none`: sonst schrumpft die Seitenhöhe und der claude.ai-Viewer zeigt die Bühne zu klein/abgeschnitten). Elemente aus `mk()` schreiben Attribute/Text nur bei geändertem Wert (`fastSet`), `opacity` 0 setzt zusätzlich `display:none`. Knopf `#samba-full`: Vollbild (echt, wo erlaubt, sonst CSS
`.samba.full`), Querformat-Sperre wenn möglich, Hinweis zum Drehen im Hochformat.
Zufalls-Ereignis pro Abspielen während der Polonaise (`EVENT`: rain, monkey, police, waiter). Bühne passend zur Reise
(`buildStage`/`stageToday` aus `trip.json` → `stays`, Zeitzone Rio; guaruja, rio, silvester am 31.12./01.01., iguacu, jungle,
paraty, ilha; sonst default = Copacabana).
Video: `window.__danceT`, `__danceAudio(ms)`, `__danceVoices()`, `__danceLive({...})`, `__danceEvent`, `__danceStage`, `__danceTap(id)`, `__danceBoost('clap'|'cheer')` zum Ausprobieren; enthält Gesichter, nicht ins Repo.

## Serie „Gringos – Die Serie“ (Cartoon-Folgen)

Im Kapitel Kino unter der Samba-Show (`#series`, SVG `#ser-svg` 800×450, Knöpfe `#ser-play`/`#ser-stop`/`#ser-sound`/`#ser-full`, großer Start-Knopf `#ser-big`).
Eigenes Modul in `page_script.html` („Gringos – Die Serie“), gleicher Stil wie die Samba-Show (Foto-Köpfe, Kanadier-Münder; Nebenfiguren
Kontrolleur, Flugbegleiterin, Einheimische gezeichnet). Drehbuch in `trip.json` → `series.ep1` (`lines` mit `who`, `at`, `say` = gesprochen,
`text` = Untertitel, optional `vo`), Stimmen der Nebenfiguren in `series.voices`, `voice` wird erzeugt. Szenen und Zeiten in `SC`
aus `series.ep1.scenes` (Folge 1 = nur die ersten Tage: Intro, Sicherheitskontrolle, Flughafen-Bar, Flieger, Uber, Strand Guarujá, Caipi-Abend, Abspann;
Beginn/Ende der Szenen aus den Sprechzeiten berechnet), Musik/Ort-Einblendung je Szene in `META`, Gags in `frame(t)` je Szene über `A('key')` = Startzeit
einer Zeile relativ zur Szene (Zeiten in den Daten verschieben reicht); Effekte in `program()`. Humor: bewusst derb und schwarz (Kotzen, Furz/Hose, Saufen, Knutschen, Abblitzen; alle Beteiligten einverstanden, laut Patrick), Effekte `pukeAt`, `stinkAt`, Herzen/`kissM`, Geräusche `puke`/`fart`/`kiss` in `Music()`.
**Geparkt für spätere Folgen:** fertige Szenen Silvester (`ny`), Buffet (`buf`), Dschungel (`jg`), Footvolley (`fv`) im Modul, Zeilen in `series.parked`,
Aufnahmen in `web/audio/parked/` (nicht veröffentlichen; für eine neue Folge neu timen, auf `A()` umstellen und nach `web/audio/` holen). Untertitel unten immer an. Stimmen: `python3 tools/gen_dance_audio.py --series ep1 [key …]` → `web/audio/ep1-*.mp3`
(beim Veröffentlichen in `files` mitgeben); Verständlichkeit mit Whisper prüfen, unklare Zeilen mehrfach erzeugen und die beste behalten.
Startet eine Show, pausiert die andere (Ereignis `br26-kino`). Video: `window.__serT`, `__serFrame(g)`, `__serAudio(ms)`, `__serVoices()` (Datei, Versatz, Zeit, Länge, Lautstärke je Stimme), `__serLen()`.
**Mehrere Folgen:** alle `series.epN` erscheinen als Auswahl über der Bühne (`#ser-eps`, zuletzt gewählte im localStorage `br26.serEp`, Standard = neueste);
`setEp()` lädt Zeilen/Szenen, `epTexts()` Titel, Abspann (`epN.credits`) und Vorschau (`epN.next`). Audio-Dateien `web/audio/epN-<key>.mp3`.
Folge 2 „Silvester in Rio“ (31.12.–03.01.): Rückblick, Landung Santos Dumont (`land`), Silvester mit Handy in der Unterhose, Kuss-Verwechslung, 7 Wünsche (`ny`),
Kater mit Tattoo „Pastel de Frango“ (`kat`), Christus im Nebel + Taube (`cristo`), Rodízio (`rod`, Bauch über `pose.fat`), Seilbahn-Beichte (`zucker`), Videocall-Cliffhanger (`call`).
Folge 3 „Daijo & Greisel kommen“ (06.–08.01.): Ankunft Galeão (`gig`, Greisel schläft auf dem Gepäckwagen, Rechnung vs. nie gemachtes Hochzeitsgeschenk), Boeing nach Iguaçu (`boe`, Patrick erschleicht sich Rollstuhl-Boarding, Tür mit Klebeband, Beichte Bonusmeilen/Fensterplatz), Wasserfälle (`falls`, Fotos als Standbild mit Polaroid-Rahmen über umgerechnetes `L`, Simon fällt rein), Nasenbären (`quati`, Zeichnung `coati()`), Grenze (`grenze`, Pass mit Foto, Zelle 3), Bootstour (`boot`), Trinkduell (`duel`, Kreideumriss).
Patrick dort bewusst nicht als Vielfraß (Wunsch Patrick), sondern Alter/Splitwise.
Folge 4 „Ab in den Dschungel“ (09.–13.01., bewusst derber, Wunsch Patrick): Manaus-Hostel (`hos`, Simon geknutscht und ausgeraubt, fremder Tanga, Chat „von seinem Handy“), Encontro das Águas (`rio`, rosa Delfine, Marcos Blasen, Simon küsst den Delfin, Greisel kotzt brav nicht in den Fluss, sondern auf Daijo), Lodge-Klo ohne Tür (`cab`, Marco (`V` im Code) mit Durchfall vom Flusswasser-Eis, Spur am Boden, Seismograf 4,2, Nasenbär klaut Klopapier, Feuerblatt), Piranha-Angeln (`pir`, Greisels Fuß als Köder, er ist wach: „Kitzelt ein bisschen“, Patricks Gebiss aus Folge 3 kommt zurück), Lodge-Bar (`jbar`, Rülps-Duell mit Rülps-O-Meter und Greisel als Schiedsrichter, Jonas betrunken für Demokratie, Stromausfall-Kuss Simon/Patrick), Kaiman-Safari (`kai`, Glatze als Leuchtturm, Kaiman schnappt den Fischerhut, Abstimmung über die Rettung des Guides, Greisel als Einziger sofort dafür), Hängematten (`ham`, Greisel fällt raus: Boden hält, Rücken nicht). Wunsch Patrick: Greisel nicht mehr nur schlafend, Pech gemischt verteilen (nicht immer Patrick). Sprecher in Folge 4 per `ep4.comedy.narrator` schneller (Tempo 1,28, `tight` = Pausen auf ~70 ms), Daijo ebenso (`ep4.comedy.dajo`, Tempo 1,42). XTTS liest Satzpunkte manchmal als „Punkt“/Füllsilbe mit (Whisper hört z. B. „Pumpt“, „Mons“, „Omt“): betroffene Zeilen satzweise **ohne** Satzpunkt erzeugen. Neue Nebenfigur `guide` (XTTS-Sprecher, portugiesische Ausrufe lautschriftlich: „Olja“, „Nau“, „Sokorro“). Drehbuch-Werkzeug: Zeilen mit Pausen in einer Liste, Zeiten daraus berechnen (Pausen bleiben bei neuen Aufnahmen gleich). Zeilen-Keys je Folge eindeutig halten (die Geräuschliste in `story()` ist schlüsselbasiert; Bar-Zeilen daher `j1…`).
Folge 5 „Das große Finale“ (14.–21.01., Staffelfinale): roter Faden = die sieben Silvester-Wünsche aus Folge 2 (HUD-Liste `wish5`/`wishList()`, Einblendung „✅/❌ Wunsch n“ per `popWish()`, Bilanz 2 von 7 am letzten Abend). Uber im Fiat Uno (`van`, sechs Köpfe, Koffer-Turm, Greisel freiwillig im Kofferraum), Paraty bei Flut (`pty`, Dreierregel Stolpern, Greisel läuft mit geschlossenen Augen `eyesShut`, Daijos Plan „Ebbe“, „Gabriela“ ist ein Getränk), Bootstour (`schoon`, Open Bar + Splitwise, Marco „ertrinkt“ im hüfthohen Wasser, Greisel als Held mit Umhang in Zeitlupe = Cold Open), Vila do Abraão (`abr`, Gepäckkarren statt Autos, Patrick fährt im Karren mit (Rollstuhl-Rückgriff Folge 3), Dona Rosa: „Que gatinho!“ = Wunsch „Irgendeine Frau“ ✅), Lopes Mendes (`lopes`, Footvolley 1:20, der Punkt mit Simons rotem Gesicht), letzter Abend (`fest`, Patricks Kuss-Foto aus Folge 4 (`photoHead()` für Foto-Köpfe im HUD), Nasenbär klaut Jonas’ Handy, Daijos Rülpser, Handy fliegt ins Meer), Abschied am Steg (`pier`, Daijo & Greisel bleiben, Fähre legt ab). Abspann mit `epN.cont` (sonst „Fortsetzung folgt …“) und Teaser Staffel 2 (Nasenbär mit Koffer, Flieger GIG → MUC). Neue Nebenfigur `dona` (Dona Rosa, XTTS portugiesisch, Comedy-Stil `opa`).
**Spielerporträts** (seit 06.10., Test mit Jonas): Fußball-Doku pro Person (~1:45 min), Drehbuch `series.p<id>` mit `portrait: <crew-id>`
(Szenen `pintro` Stadion + Titel, `ppitch` Vereinsplatz mit Kopfball-Zähler und Mitspieler-Interviews, `paw1`/`paw2` zwei
Auslandsstationen mit Nebenrollen `aw1`/`aw2`, `pcard` FIFA-Karte mit Live-Werten aus `MEHUB.card`, `pint` Interview vor Sponsorenwand, dann `end`).
Zweites Porträt Simon (`psimon`, Keys `ps…`): Szenen `plost` (Fundbüro mit Zähler), `pphone` (Strandbar, `beachBar()` geteilt mit `paw1`),
`pshoe` (Marktstand, Verkäufer = Rolle `local` mit englischer Stimme per `psimon.xtts`), `pfest`/`pmorn` (Abend und Morgen danach, Nebenrollen `aw2`/`aw3`,
Zwischentitel als `card`-Zeile). Die gemeinsamen Szenen `pintro`/`pcard`/`pint` greifen über `PL(i)`/`PD(i)` auf die i-te Sprechzeile der Szene zu
(kein fester Key), Kartenwerte über `tx.stats`/`tx.hi`. Je Porträt eigener Key-Präfix (`pj`, `ps` …), Geräusche in `story()` je Präfix.
Drittes Porträt Patrick (`ppatrick`, Keys `pp…`): Szenen `pmatch` (Spiel mit Mitspieler `local2`, Lautstärke-Zähler), `pzerr` (Zerrung mit Röntgen-Einblendung),
`pabroad` (Strandbar, Nebenrollen `aw1`/`girl2`/`aw2`), `pdisc` (Kneipe mit Diskussions-Pegel); Fußballplatz als `pitchBg()` geteilt mit `ppitch`.
Hysterische Zeilen per Zeilen-`comedy` (höher, schneller).
Viertes Porträt Marco (`pmarco`, Keys `pm…`): Szenen `plong` (Fernschuss mit Aufsetzer-Zähler, Mitspieler Jonas, Greisel auf der Bank, Torwart `local3`), `pital` (drei Lokale, Crew-Köpfe im Fenster, Telefonat),
`plis` (Auslandsstation bei Nacht mit Straßenbahn, Zähler „Geteilt“), `pcouch` (Hotel-Lobby, Strohhalm-Losen, Couch, Rezeptionistin `aw1` portugiesisch).
Fünftes Porträt Greisel (`pgreisel`, Keys `pg…`): Szenen `pcome` (Einwechslung 90. Minute, Spielstand-Zähler), `pcut` (Kopfballduell bei Flutlicht), `pfair` (Volksfest mit Riesenrad, Dosenwerfen, Sani-Zelt `aw3`),
`pzelt` (Bierzelt mit „Promille-Lukas“ `PJ.luk`, Glocke `PJ.lbell` fliegt, Uhr, Heimreise, Morgen danach mit `PJ.dawn`), `pjga` (Tafel „unter den Ball“, Flugball-Höhe). Pflaster/Cut am Kopf: `gband`/`gblood` (in `P.greisel.acc`, jedes Bild erst aus). Vereinstrikots lila (`#5b2a86`).
Sechstes Porträt Daijo (`pdajo`, Keys `pd…`): Szenen `phost` (Wohnzimmer, Daijo pendelt Küche ↔ Tisch, Zähler „Nachgefüllt“/„Sitzdauer“), `pbuy` (Büro mit Excel, Telefonat, Lieferant `local2` im Anruf-Kasten, Rabatt-Zähler, Ticket),
`pczech` (Flaggen-Tafel, Zähler „Zum … Mal“), `pparty` (Disco mit Lichtkegeln). `tx.runOff`: Porträtierte läuft nach der Interview-Antwort aus dem Bild.
Alle persönlichen Texte im Bild kommen aus den privaten Daten: `tx` (Bandenwerbung, Schilder, Banner, Stärken/Schwächen …) und `caps` (Ort-Einblendung je Szene); im öffentlichen Code nur neutrale Platzhalter.
Keine Kachel im Kino: Start über „🎬 Spielerporträt ansehen“ (`.port-btn[data-port]`) im Steckbrief und auf der Kartenrückseite,
`window.serPortrait(id)` lädt das Porträt im Vollbild und kehrt danach zur vorherigen Folge und zur Karte zurück. Knöpfe sind per CSS-Klasse
`port-p<id>` am `<html>` sichtbar (alle sechs seit 06.10. für alle freigegeben). Zeilen-Keys `pj1…` (eindeutig gegenüber den Folgen).
**Privat:** Porträts enthalten echte Geschichten, deshalb nicht im öffentlichen Repo: `web/private/series.json` und `web/audio/p*.mp3` sind
gitignored, `build.py` mischt die Datei beim Bauen ein. Für die Werkzeuge `python3 tools/private.py in` (nach trip.json holen), danach
`gen_series_xtts.py pjonas`, `relayout.py pjonas`, `build_series_audio.py pjonas`, dann **`python3 tools/private.py out`** vor jedem Commit.
Veröffentlichen: `audio/pjonas.mp3` in `files` mitgeben. Nach einem neuen Container: Drehbuch aus dem Seitenquelltext des Artifacts
(`TRIP.series.pjonas`) und `audio/pjonas.mp3` per `Artifact` `read` + `path` zurückholen.
**Noch nicht freigegebene Folgen:** `epN.admin: true` → Kachel/Folge erscheint nur, wenn `canWrite()` Schreibrechte meldet (nicht in der Gast-Ansicht), mit „🔒 nur Admin“. Das ist nur ausgeblendet, nicht geschützt: Drehbuch steht im öffentlichen Repo und im Seitenquelltext, `audio/epN.mp3` ist per Pfad abrufbar. Freigeben = `admin` entfernen. Je Folge optional `recapBadge`, `badge` (Hinweis-Kasten im Intro), Zeilen-`name` (Rollenname im Untertitel); Pose `hush` = Mund still (Standbild); ab Folge 3 stehen alle sechs im Intro/Abspann.
Qualität: Stimmen nachbearbeitet (`POLISH` in `gen_dance_audio.py`: Stille weg, EQ, Kompressor, −16 LUFS, 128 kbit/s), Musik duckt unter Sprache, Atmo je Szene (`META.amb` → `E.amb()` in `Music()`: hall, bar, cabin, traffic, sea, night, crowd, room, wind, restaurant, falls, forest), Kreisblende + `swish` an Szenenübergängen, Kamera zeitbasiert geglättet mit leichtem Handkamera-Atmen, Mund folgt der Lautstärke stufenlos, Sprechgesten.
**Stimmen der Serie (seit 03.10.): XTTS v2** statt Piper, natürlicher: `tools/gen_series_xtts.py epN [key …]` (eigene Python-Umgebung mit coqui-tts, torch, torchcodec, sherpa-onnx, scipy, imageio-ffmpeg; Modell von huggingface.co, in der Cloud-Umgebung als erlaubte Domain eingetragen; `WHISPER` = Pfad zu sherpa-onnx-whisper-small). Sprecher je Rolle in `series.xtts` ({who: [XTTS-Sprecher, Sprache]}, Einheimische/Kellner auf Portugiesisch). XTTS hängt gern Fantasiewörter an und macht lange Pausen zwischen Sätzen: Sätze einzeln erzeugen, Pausen auf 0,16 s kürzen (`squeeze`), bis zu `TRIES` Versuche, an Pausen kürzen (gleich gut verstanden → kürzeste Fassung, bei kurzen Zeilen nur wenn klar besser), deutlich zu lange Fassungen abwerten; Whisper wählt. Verschluckt XTTS trotzdem Teile (z. B. „Drei! Zwei! Eins!“), die Teile einzeln erzeugen und zusammensetzen. Ca. 30 s Rechenzeit pro Zeile (CPU). **Comedy-Klang** (Wunsch Patrick: XTTS allein zu ernst, zu langsam, zu tief): `series.comedy` {who: {tempo, pitch, style}} (je Folge überschreibbar mit `epN.comedy`, je Zeile mit `comedy`, z. B. Jonas in Folge 3 schneller) per rubberband (Formanten mitverschoben = Cartoon) plus Klangfarbe `style` (nasal/nasal2 = Terrance & Phillip, opa = Zittern bei Patrick, sleepy = Wabern bei Greisel, mega = Megafon beim Kontrolleur), Sprecher fast unverändert, Marco am höchsten; nach Änderungen Whisper-Probe machen; saubere XTTS-Fassungen in `tools/data/xtts/` (gitignored), `python3 tools/gen_series_xtts.py --comedy ep1 ep2 ep3` wendet die Werte neu an (Sekunden statt Stunden), danach Zeiten anpassen und Paket bauen. Danach Zeiten anpassen (Pausen zwischen den Zeilen gleich lassen) und `build_series_audio.py`. `gen_dance_audio.py --series` (Piper) geht weiterhin als schneller Ersatz; `series.voices` gilt dort, `fx` (z. B. Funk beim Kapitän) wird in beiden Wegen angewendet.
**Echte Geräusche** (05.10.): `tools/build_sfx.py` holt freie Aufnahmen (nur CC0, FSD50K/Freesound über huggingface.co), schneidet sie zu (bestes Fenster per AudioSet-Klassifikator AST ausgesucht), gleicht die Lautheit an und packt sie in `web/audio/sfx.mp3`; Ausschnitte in `trip.json` → `sfx` {Name: [[Start, Länge, Lautstärke], …]}. `Music()` spielt dann die Aufnahme (`SFXLIB`, `loadSfx`), sonst den Synth-Klang (gilt für Serie, Samba-Show und Reise-Film). Beim Veröffentlichen `audio/sfx.mp3` mitgeben. Fürs Video vorher `await window.__sfxLoad()`.
**Satzenden** (06.10.): XTTS-Aufnahmen werden am Ende großzügig geschnitten (leise Endlaute bleiben), die Auswahl wertet Fassungen ohne letztes Wort ab, `comedy()` hängt vor der Bearbeitung Stille an (rubberband/silenceremove schnitten sonst das Ende ab). Prüfen: alle Zeilen mit Whisper abhören und das letzte Wort vergleichen.
**Ein Paket pro Folge:** `python3 tools/build_series_audio.py` packt die Einzelaufnahmen `web/audio/epN-<key>.mp3` in `web/audio/epN.mp3` und schreibt den Versatz nach `voice[key].o`. Veröffentlicht wird nur `audio/epN.mp3` (Einzeldateien in `files` auf `null`), wegen des Limits von 511 Dateien pro Artifact-Version. Nach jeder neuen Stimme das Paket neu bauen.
**Gesamtzeit vs. Folgenzeit:** Player rechnet in Gesamtzeit `g` (mit Cold Open vorne), `storyT(g)` = Zeit in der Folge; `frame(g)` → `frame0(t, g)`. `TOTAL` = Länge inkl. Cold Open.
**Cold Open** (ab Folge 2 und bei jeder neuen Folge, Folge 1 bewusst ohne; `epN.cold`: `from`/`to` = [Zeile, Versatz], `label`): Gag aus der Folge vorab, dann Standbild mit Bildstörung „⏪ … früher“ (`FRZ`), Geräusche `scratch`/`rewind`; Ton der Folge wird dafür in `program()` ein zweites Mal im Fenster geplant (`story()`).
Kein Titelsong (auf Wunsch wieder entfernt, 03.10.).
**Gesichtsausdrücke** je Zeile: `face` (Sprecher) und `react` ({id: Ausdruck}) mit shock, heart, dizzy, angry, cash (Overlay `o.fx` über dem Foto). **Schnitte:** `close: 1` = harte Großaufnahme des Sprechers, `rshot: id` = danach 1,2 s Reaktionsgesicht. **Lacher vom Band:** `laugh: 1` (Geräusch `laugh`), Wunsch Patrick 06.10.: nur noch ca. 3 pro Folge an den stärksten Pointen, leiser; `lol` löst keinen Lacher mehr aus. **Reaktionen statt Tröte** (Wunsch Patrick 05.10.: keine Posaune/„Wah-wah“ mehr, Effekt `wah` gelöscht): je Zeile `lol` (1 = alle außer Sprecher und `mad` lachen sich kaputt: Lach-Augen, Tränen, „HAHA“, Kopf wackelt; oder Liste von ids) und `mad` (id/Liste: regt sich auf, Wutgesicht + Kopfschütteln), ab Zeilenende + `rxd` (Standard 250 ms) für `rxl` (1900 ms). Außerdem `palm` (Hand vors Gesicht) und `roll` (Augenrollen), je id/Liste.
**Leben in den Figuren** (05.10.): Blinzeln (Lider in Hautfarbe, aus der Wange im Foto gemessen, `o.lid`), Zuhörer schauen zum Sprecher, Schulterzucken bei Fragen und Arm hoch bei Ausrufen (nur wenn die Szene die Arme nicht selbst steuert, `armsFree`); beim Auslachen zeigen sie auf das Opfer (`mad`), das Opfer schüttelt die Fäuste.
**Pausen vor Pointen:** Zeiten nur in den Daten verschoben (Szenen-Code arbeitet relativ über `A(key)`), Ziel ca. 0,6–0,75 s vor der Pointe.
**Zwischentitel** (Stummfilm): Zeilen mit `who: 'card'`, `text` (Zeilenumbruch mit ` | `), `cdur` (ms, Standard 2600); schwarze Tafel mit Zierrahmen, Kratzern und Flackern (`silentCard`), Projektor-Rattern `reel` + Klavier `piano`, Musik leiser, keine Untertitel.
**Musik-Stiche:** je Zeile `sting` (tusch, drama, slowmo), `stingAt: 'start'` = am Zeilenanfang (sonst Zeilenende + `stingD`). **Durchsage:** Zeile mit `chime: 1` (Flughafen-Gong `gate` vorher), Sprecherin mit `comedy.style` mega.
**Musik je Ort:** `META.mus` außer travel/stay/show auch `bossa` (Rio), `jungle` (Iguaçu-Wald, Amazonas) und `lounge` (Fahrstuhlmusik im Flieger); alle im selben 120-BPM-Raster in `Music()`.
**Übergänge:** `META.tr` der neuen Szene: `leaf` (Palmenblatt wischt), `splash` (Wasserwand), `plane` (Flugzeug mit Wolkenband), sonst Kreisblende (`wipe()`).
**Wetter/Tageszeit:** `META.wx`: rain (mit Regen-Atmo), heat, dusk, dawn, mist, rays, morning (= Nebel + Strahlen), im HUD über dem Bild (`weather()`).
**Raumklänge:** echte Schleifen im Geräusche-Paket (`sfx.amb_<Art>`, `build_sfx.py` → `AMB`, nahtlos überblendet); `E.amb` spielt sie als Loop, sonst Rauschen.
**Drehbuch-Runde 2** (05.10.): Dreierregel (Folge 1: Pasta/Chicken/Beides, Runden 10–12; Folge 2: sieben Wünsche gesprochen, Picanha/Mais/Ambulância; Folge 3: Nasenbär klaut Sandwich/Sonnenbrille/Handy, Shots; Folge 4: Rülps-Duell mit Greisels Hicks), frecher Erzähler, Zwischentitel je Folge.
**Zeiten = Pausen + Sprechlängen** (seit 06.10.): jede Zeile hat `sc` (Szene) und `gap` (Pause davor, bei der ersten Zeile = Vorlauf), jede Szene `tail` (Nachlauf); Überlauf-Zeilen `anchor: [key, ms]`. `python3 tools/relayout.py` berechnet daraus `at` und `scenes[].t` (nach jeder neuen Stimme, beim Streichen/Einfügen nur Liste + `gap` anpassen). Nicht mehr von Hand in `at` schieben (sonst Überlappungen).
**Regeln nach dem Außen-Feedback (06.10.):** Erzähler sparsam (nur trockene Pointen, kein Erklären dessen, was man sieht; Ort/Zeit steht in der Einblendung), kein gesprochener Rückblick mehr (nur Emoji-Zeile `recapBadge`), jede Folge mit Cold Open (Folge 1: Kotz-Gag im Flieger), roter Faden mit Auflösung (Folge 1 Sonnencreme → Simon leuchtet, Folge 2 Jonas' Handy → Unterhosen-Foto an Greisel, Folge 3 Jonas/Splitwise → Nasenbär-Rechnung, Folge 4 Simons Handy → 400 € an „Gatinha“) und Teaser auf die nächste Folge, je Figur ein großer Moment und höchstens 2× Opfer, höchstens 3 Musik-Stiche und 1–2 Zwischentitel pro Folge, Lacher vom Band nur ~3×, Länge ca. 3–4 min. Gestrichene Zeilen, auf die der Szenen-Code zeigt, über Ersatz-Anker abfangen (z. B. `F4`, `B7`, `C3`, `P8`, `E6`).
**Versteckte Gags:** Schilder/Plakate je Szene und ein versteckter Nasenbär (`sign()`, `peek()` im Block „Versteckte Gags im Hintergrund“).
**Running Gags:** Nasenbär als Erzfeind in jeder Folge (`epN.cameo`: `sc`, `key`, `d`, `dur`, Weg `x`→`x2`, `y`, Beute `prop`, Größe `s`), außerdem Greisel schläft gern (ab Folge 4 sparsamer, er soll aktiv mitspielen; Wunsch Patrick 06.10.: in neuen Inhalten keine Schlaf-Gags mehr, KAT auf der Karte heißt **Katerresistenz** = kaum Kater nach Alkohol, nicht „viel Schlaf“; in den Porträts sitzt er mit Weißbier auf der Bank, Stimme dort ohne `sleepy` per `p<id>.comedy.greisel`), Patricks Tattoo, Marcos Zahnbürste. Witze pro Person abwechseln (Daijo nicht nur Excel, Jonas nicht nur Splitwise, Patrick nicht als Vielfraß).
**Player:** Fortschrittsleiste zum Ziehen/Tippen mit Kapitelmarken (`#ser-track`, Pointer-Events, Pfeiltasten ±10 s), darunter der Name des aktuellen Kapitels (`#ser-chap`, aus `CHAPS`; Kapitel-Knöpfe auf Wunsch entfernt), „⏭ Intro überspringen“ (`#ser-skip`), Weiterschauen (localStorage `br26.serPos.epN`, „↺ Von vorn“ `#ser-restart`), gesehen (`br26.serSeen.epN`). Folgen-Kacheln (`.ser-tile`) mit `epN.thumb` (Emojis) und `epN.color`, Dauer, Fortschritt, ✓ gesehen. Springen = `seek(g)` → `start(g)`, `program(m, t0, lo)` plant nichts vor `lo`.
**Tempo der Serie:** Chrome setzt bei jeder Zoom-Änderung der Kamera alle SVG-Texte (auch Emojis) der Szene neu, selbst wenn nur eine Elterngruppe `display:none` ist. Deshalb nimmt `fastSet`/`shown()` im Serien-Modul unsichtbare (`opacity` 0) und leere Texte ganz aus dem Dokument (Platzhalter-Kommentar hält die Stelle); `mk()` hängt erst ein, dann setzt es Attribute. Schwere Geräusche (`laugh`, `applause`) rendert `Music()` einmal offline vor (`BAKE`, 3 Varianten) und spielt sie als fertigen Klang. Ruckeln messen: echte Wiedergabe mit Playwright an vielen Stellen, Bildrate per `requestAnimationFrame` zählen.
Nur-Kopf-Figuren (`headOnly`, Hilfsfunktion `headAt`) für Fenster, Gondel und Handy-Bildschirm. Lange Untertitel brechen in zwei Zeilen um.
Neue Folge: Zeilen in `series.epN` (mit `scenes`, `credits`, `next`), Stimmen per `--series epN`, Szenen-Code in `frame()` ergänzen, `META` erweitern.

## Gringo Kart (seit 07.10., Ausbau in Stufen: 1 Fahrgefühl ✅, 2 sechs Strecken + Grand Prix ✅, 3 Persönlichkeit/Items je Person ✅, 4 Bestenliste/Geister/Tages-Challenge ✅)

Rennspiel im Kapitel Spiele: Knopf `#kart-open` (`.kart-teaser`) öffnet `#kart` als Vollbild-Overlay (wird beim Öffnen unter `<body>` gehängt, Kapitel hat content-visibility).
Eigenes Modul „Gringo Kart“ am Ende von `page_script.html`, Canvas von oben, Kamera dreht mit (Fahrtrichtung oben), zoomt bei hohem Tempo leicht raus. Strecke Copacabana: Kontrollpunkte `CP` → Catmull-Rom,
alle 6 px abgetastet (`P`, Normalen `NX`/`NY`, Index-Helfer `at(i, lat)`/`nearest`), Breite `TW`; Hintergrund (Sand, Meer `shore()`, Stadt, Calçadão-Wellen, Palmen, Schirme, Boost-Pfeile `PADS`, Schanze `RAMP`) einmal in `BG` vorgezeichnet; außerhalb der Karte Sand/Meer.
6 Fahrer = Crew (Kart in Shirt-Farbe aus `dance.look`, Foto-Kopf mit `face`-Ausschnitt als Sprite `HEAD`), 3 Runden, Gas automatisch, Daumen links/rechts lenkt (weich, Stärke Sanft/Mittel/Stark `STEERS`, localStorage `br26.kartSteer`).
**Fahrgefühl (Stufe 1):** lange in eine Richtung halten (> 0,38 s, Tempo > 190) = Drift (`k.dr`, Rutschen, Funken weiß → blau → orange, Anzeige unten), Loslassen = Mini-Turbo (> 0,75 s) bzw. Super-Turbo (> 1,5 s); auch die KI driftet.
Raketenstart: erster Tipper während der „1“ (`S.press` zwischen −0,62 und −0,04 s) = Boost, Tipper schon bei der „3“ = abgewürgt. Boost-Pfeile, Schanze (Flug `k.air`, in der Luft tippen = Trick, Landung mit Boost).
Leben: Zuschauer `SPECT` (winken, hüpfen beim Vorbeifahren), Caipi-Verkäufer `S.ven` läuft quer (Zusammenstoß = Dreher), Tauben fliegen auf, Welle `S.wave` schwappt alle 12–18 s über die Uferstraße (`WAVE`, bremst, Warnung 2 s vorher).
Effekte: Reifenspuren `S.marks`, Funken `S.sp`, Staub, Wackel-Kamera, schwebende Texte (`floatTxt`), Zeitlupe im Ziel (`S.slow`), Feuerwerk (`fireworks`, Bildschirm-Teilchen `S.fw`).
Items aus ?-Kisten nach Platz gewichtet (`rollItem`): 🍹 Turbo, 🧴 Öl-Pfütze, 🦝 Nasenbär jagt den Vordermann; Kokosnüsse/Sand bremsen; KI fährt Ideallinie mit Spur-Wechsel, nimmt Pfeile/Kisten, weicht aus, Gummiband.
**Ton:** Samba-Rennmusik per Web Audio (`MUS`, `musNote`: Surdo, Tamborim, Ganzá, Agogô, Bass; letzte Runde schneller), echte Geräusche aus `audio/sfx.mp3` (`real(name)`, sonst Synth), Motor.
**Ansager** (`say(key, text)`): rote Zeile im Bild + Stimme aus `audio/kart.mp3` (XTTS-Sprecher, Ausschnitte in `TRIP.kartvo` {key: {o, dur}}; erzeugt über eine vorübergehende Folge `series.kart` mit `gen_series_xtts.py kart` + `build_series_audio.py kart`, danach nach `kartvo` verschoben). Musik duckt, Schalter im Pause-Menü (`br26.kartAnn`).
Pause-Knopf `.kr-pbtn` oben links (nur im Rennen, Klasse `.racing`) öffnet `.kr-pm`: Weiter, Neustart, Fahrer wechseln, Lenkung, Ansager, Ton, Beenden (auch Esc/P; App-Wechsel pausiert, AudioContext wird angehalten).
Sprüche beim Treffer je Person (`LINES`), Bestzeit im localStorage `br26.kartBest`. Klassen mit Präfix `kr-` (`k-` ist schon belegt). Beim Veröffentlichen `audio/kart.mp3` (und `audio/sfx.mp3`) in `files`.
**Strecken (Stufe 2):** `TRACKS` (Daten je Strecke: `cp`, `tw`, `ww`/`wh`, `sea` = Uferlinie oder null, `off` = Tempo neben der Strecke, `grip` = Haftung (klein = rutschig, Bewegungsrichtung `k.mv` folgt der Nase träge), `veh` kart/boat/cart, `laps`,
`pads`, `ramp`, `boxes`, `obst` [Anteil, Versatz, Art] = feste Hindernisse (Anprall `k.bump`: zurückschieben, bremsen, wackeln, kein Dreher), `movers` = Querläufer (vendor, corn, coati, caiman, horse, dog → Dreher), `puddles`, `music` {bpm, root}, Extras `wave`, `rain`, `mist`/`falls`, `dolphins` (Turbo), `flood` (Pfützen wachsen/schrumpfen)).
`loadTrack(id)` setzt `T`, `P`, `N`, `TW`, `WW`, `WH`, `PADS`, `RAMP`, `SPECT`, zeichnet `BG` je Strecke neu (`drawBG`: Strand/Stadt, Dschungel-Kronen, Kolonialhäuser, Fluss in zwei Farben, Wasserfall) und die Fahrzeuge `VEH` (Kart, Boot, Gepäckkarren).
Guarujá (Einsteiger, Sonnenschirme, Maisverkäufer), Copacabana (Welle, Caipi-Verkäufer), Iguaçu (Regen, rutschig, Wasserfall-Gischt, Nasenbären, 2 Runden), Amazonas (Bootsrennen, Kaimane, Baumstämme, Delfin-Turbo, 2 Runden), Paraty (Kopfsteinpflaster, Flut, Pferdekutsche, 2 Runden), Ilha Grande (Gepäckkarren, Koffer, Hund).
Menü: Einzelrennen (Strecke wählen, `br26.kartTrack`, Bestzeit je Strecke) oder Grand Prix (`br26.kartMode`, `CUP` {i, pts, races}, Punkte `PTS` 10-8-6-5-4-3, Zwischenstand `.kr-stand`, `ceremony()` mit Podest `.kr-podium`, Siege im localStorage `br26.kartCups`).
Ansager Stufe 2 (Begrüßung je Strecke `t_<id>`, caiman, dolphin, flood, coatis, cupnext, cupwin, cupend) in `audio/kart2.mp3` (`kartvo[key].f = 2`); beim Veröffentlichen `audio/kart2.mp3` mitgeben. Neue Sätze: vorübergehende `series.kart`, danach `build_series_audio.py kart` schreibt `kart.mp3` → als `kartN.mp3` umbenennen und alte `kart.mp3` zurücklegen.
**Persönlichkeit (Stufe 3):** Fahrer-Werte `CS` aus den FIFA-Karten (normiert 0–1 in der Crew): Tempo = TTP, Lenkung = ORI, Start/Beschleunigung = PÜN, Nehmer (kürzere Dreher) = KAT, Wirkung je ±3–6 %; Anzeige als Balken `.kr-bars` im Menü.
Pegel: Drinks von heute (`MEHUB.drinks[id].today`, ab 8 voll) lassen die Lenkung wackeln (`pegel()`, rosa Schimmer). Spezial-Item je Person `SPECIAL` (22 % Chance statt normalem Item): Jonas 🧾 Splitwise-Rechnung (alle vor ihm gebremst `slowT`),
Simon ☀️ Sonnenbrand-Blitz (blendet Nahe `blind`, Bildschirm-Blitz), Patrick ♿ Rollstuhl-Boost (langer Turbo, unverwundbar `inv`), Marco ⚽ Fernschuss (schnelles Geschoss auf den Nächsten vor ihm, `coatis` mit `ball`), Greisel 🍺 Bierdusche (große Schaumpfütze `oils` mit `beer`),
Daijo 🥟 Snack-Runde (alle knapp hinter ihr halten an, sie bekommt Turbo). Persönliche Sprüche mit den Serien-Stimmen (`voice(k, over|hit|sp)`, Texte `VTXT`, Ton `audio/kart3.mp3`, `kartvo[v_<id>_<art>].f = 3`): beim Überholen, Treffer, Spezial-Item.
Fahrzeuge `VEHS` (Gringo-Kart, Uber nach 3 Rennen, Fiat Uno nach 1 Sieg, Gepäckkarren nach Ilha Grande, Rollstuhl nach 5 Super-Turbos, Goldenes Kart nach Grand-Prix-Sieg), Wahl `br26.kartVeh`, Statistik `br26.kartStats` {races, wins, ilha, supers, cups},
Feinwerte `VTUNE` (Tempo, Lenkung, Beschleunigung, ±2–20 %), Freischalt-Hinweis `.kr-unlock` in der Siegerliste; auf Amazonas (Boote) und Ilha Grande (Gepäckkarren) fahren alle das Strecken-Fahrzeug.
**Fahrphysik (Level-up 07.10.):** Vorwärtstempo `k.v` plus Quertempo `k.vr`: beim Einlenken bleibt der Schwung (`vr -= v·dA`), die Haftung baut ihn ab (`T.grip`, im Drift höchstens 2,4, Iguaçu/Rutschpartie wenig) → echtes Rutschen; Fahrtrichtung `k.mv`. Lenkung tempoabhängig (`sf`).
Sand bremst stufenlos (`deep`), Randsteine rütteln (Kamera, Ton, −1,5 %), weit weg/festgefahren/im Meer > 2,2 s = zurück auf die Strecke (`k.lost`, Blende `S.fade`). Kart gegen Kart mit seitlichem Stoß, Funken, Ton. Landung staucht (`k.squash`), Neigung in Kurven, Reifenqualm, schönere Boost-Flamme, Tempo-Linien am Rand.
KI: Ideallinie `LINE` (Kurveninnenseite aus der Krümmung `CURV`), bremst vor engen Kurven; Gegner-Stärke `DIFFS` Leicht/Normal/Schwer (Tempo, Gummiband, Linientreue; Menü `.kr-diff`, localStorage `br26.kartDiff`).
Kamera: Blick zwischen Nase und Fahrtrichtung, Vorausblick, bildratenunabhängig geglättet, Zoom nach Tempo (`S.zoom`). Ton: Motor aus zwei Oszillatoren + Sub mit Gängen und Filter, Rutsch-Quietschen als Rauschschleife (`eng.sg`). Vibration (`vib`) bei Treffern, Pads, Landung.
HUD: Startampel, Tacho unten links (km/h = v·0,45), Rundenzeit mit Abstand zur besten Runde (localStorage `br26.kartLap.<strecke>`).
**Gemeinsam (Stufe 4, Weg „Einladen“, Wunsch Patrick 07.10.):** Crew-Bestenliste in db `kartbest/<strecke>__<person>` {track, who, drv, veh, ms, ts}, Geister-Fahrt dazu in `kartghost/<…>` {g: [[x, y, a·100] alle 0,1 s], ms}; Tageswertung `kartdaily/<datum>__<person>`.
Schreiben nur mit Schreibrecht (`canWrite()`, also Patrick und per E-Mail eingeladene Bearbeiter), sonst bleiben die Zeiten lokal (Hinweis `.kr-wr`). Person = „Ich bin …“ (`ME`), sonst gewählter Fahrer (`player()`); `drv` = gefahrene Figur.
Geist (`GHOST.mode` off/mine/crew, localStorage `br26.kartGhost`, eigene Bestfahrt `br26.kartGhost.<strecke>`): halbdurchsichtig mit 👻, ohne Zusammenstoß, auch auf der Minikarte. Ergebniszeile `.kr-crew` (neuer Crew-Rekord bzw. aktueller Rekord).
Tages-Challenge (Modus `daily`): `daily()` wählt aus dem Datum (Berlin) Strecke + Regel aus `RULES` (night = Scheinwerfer, rev = Strecke rückwärts `loadTrack(id, true)`, slip, turbo = nur Turbos, coati = Nasenbär-Chaos, mirror = Lenkung vertauscht); aktive Regel `RULE`, Bestzeit lokal unter `<strecke>@<regel>`.
Test: `window.__kart` (`open`, `pause`, `resume`, `state`, `step(dt)`, `draw`, `finish`, `say`, `load(id)`, `cup()`, `lb()`, `daily()`); `S.hl` zählt Treffer je Ursache. Beim Veröffentlichen `audio/kart3.mp3` mitgeben.

## Karte: Infokarten

Stopps (`data-stop`) und Flughäfen GRU/CGH (`data-ap`) in `tools/gen_map.py` sind antippbar; darunter Stations-Chips und
`#mi-card` mit Unterkunft (Maps-/Uber-Knöpfe), Anreise, Highlights (Google-Maps-Links), Warnhinweis und Flughäfen samt
Flügen aus `flights`. Daten in `trip.json` → `mapinfo` (`stops`, `airports`; `q` = Suchbegriff). Fahrzeiten-Liste im
Südost-Ausschnitt, Zeitzone Manaus und Pass-Hinweis Iguaçu direkt in `gen_map.py`. Flugbögen lesen den Status aus
`trip.json` → `flights` (`open` = orange, nur Daijo & Greisel = lila `flB`), ☾ = Nachtflug, Flugdauer an den Bögen.
GIG/SDU im Ausschnitt leicht versetzt neben Rio.

## Tempo und Bedienung

- Kapitel außer Kopf und Karte haben `content-visibility:auto` (werden erst beim Hinscrollen gezeichnet). Vor programmatischem
  Springen `document.body.classList.add('cv-all')` setzen (macht `jump()` schon), sonst stimmt die Zielposition nicht.
- Küstenlinien in `gen_map.py` per Douglas-Peucker vereinfacht (`rdp`, Toleranz ≈ 0,5 px) und als relative Pfade geschrieben.
- Kleine Knöpfe/Links haben einen unsichtbaren `::before`-Rand als größere Tippfläche (Liste am Ende von `page_head.html`);
  neue kleine Bedienelemente dort ergänzen, dafür kein `::before` verwenden.

## Regeln

- **Repo ist öffentlich:** keine Roh-Chats, Telefonnummern, IBANs, Nachnamen, Passdaten,
  Buchungsnummern oder Splitwise-Einladungslinks einchecken. Nur Vornamen/Spitznamen.
- **Neue Videos, Folgen, Porträts und Funktionen sofort für alle freigeben** (kein `admin: true`), außer Patrick sagt ausdrücklich etwas anderes (Wunsch 06.10.).
- Unsichere Angaben kennzeichnen (🟡 prüfen / ❓ unklar) statt raten.
- Personen: Gringos plus 1 Cevapi = Jonas, Patrick, Simon, Marco (ab 27.12.); Daijo & Greisel stoßen am 06.01. in Rio dazu.
  Schreibweise **Daijo** (nicht „Dajo“); die interne Crew-`id` bleibt `dajo` (Datenbank, Foto `crew/dajo.jpg`).
  Echte Vornamen verwenden (nicht die Chat-Spitznamen Steini = Simon, Lubo = Marco). Greisel und Daijo bleiben so.
