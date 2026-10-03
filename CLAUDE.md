# Brasilienreise 2026/27 – Hinweise für Claude

Planungs-Repo für die Brasilienreise (27.12.2026 – 20./21.01.2027). Kein Code-Projekt: Inhalt ist die
Reiseübersicht, die bei neuen Infos (Buchungen, Chat-Exporte, Screenshots) aktualisiert wird.

## Dateien

| Datei | Zweck |
|---|---|
| `README.md` | Hauptübersicht (Route, Tag für Tag, Flüge, Unterkünfte, Kosten, offene Punkte, Gesundheit) |
| `web/trip.json` | **Datenquelle** für Heute-Ansicht, Tag für Tag und Kalenderdateien (Tage, Termine mit UTC-Zeiten, Unterkünfte, Crew, Drinks, Real-Rechner) |
| `web/trip.json` → `flights`, `costs` | Flüge als Bordkarten (Status `booked`/`open`/`check`, Warnhinweise, Suchlinks für offene Flüge) und Kosten pro Gruppe; auf der Webseite nicht mehr in `page_body.html` pflegen |
| `web/page_body.html` | Statischer Inhalt der Webseite; jede `<section>` hat `data-tab` = Kapitel, zu dem der Reiter oben springt; alles bleibt untereinander sichtbar (Reihenfolge: uebersicht, kino-tab, tage-tab, reise, crew-tab = Crew + Karten, spiele-tab, vorfreude-tab, drinks-tab, unterwegs-tab = Sprache + Real-Rechner, infos = Praktisches, Gesundheit, Packlisten, Downloads; Reiter und Kapitel müssen in derselben Reihenfolge stehen; Reiter mit Emoji). Jede `<section>` hat `data-kind` (start/kino/plan/fun/go/info = Farbe `--k` für Symbol-Kachel `.ico` in der `h2`, Wellenlinie und Trennlinie). Unter den Reitern Themen-Kacheln `#themen` (`.tile`, Live-Hinweise per `data-hint`: Countdown, offene Flüge, heutiges Türchen). Teil-Banner `.divider-scene.part` (Planung, Crew & Spaß, Unterwegs, Infos & Packen) trennen die Bereiche (Stationen, Flüge, Kosten, Praktisches, Packlisten, Downloads); `%%MAP%%` = Karte |
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
5. „Stand“-Datum setzt `build.py` automatisch (Tag des Neubaus, README und Webseite `%%STAND%%`); committen, pushen.

## Kopfbereich (Übersicht)

Kopfbild, Titel, Reisedaten, Gruppen-Umschalter (zeigt auch die Namen), Heute-Karte (`#heute`/`#today`, Countdown bzw.
Tagesprogramm) und Eckdaten (`#hero-facts`, Nächte je Gruppe, offene Flüge live aus `flights`) stecken zusammen im
`<header>`. Unterwegs zeigt das Kopfbild automatisch das Foto der heutigen Station (`setHero`).

**„Ich bin …“** (`#me-box` im Kopf): Person wird pro Gerät gemerkt (localStorage `br26.me`), stellt die Gruppe ein, hebt
eigene Crew- und FIFA-Karte hervor und zeigt eigene Werte (Drinks heute/gesamt/Platz, Gesamtwertung, Marktwert, Siege,
Zeitkapsel-Status). Module melden Werte für alle Personen über `meSet()`.

## Crew-Profile

Steckbriefe stehen in `web/trip.json` → `crew` (ein Eintrag mit `facts`/`quote` wird als große Karte gezeigt).
**Fotos liegen nur im Artifact** (`crew/<id>.jpg` 480×480 fürs runde Profilbild, `crew/<id>-gross.jpg` max. 1200 px für die Vergrößerung per Klick), nicht im öffentlichen Repo
(`web/crew/` ist gitignored). Beim Neuveröffentlichen `crew/...` nicht in `files` auf `null` setzen, dann bleiben sie
erhalten; bei Bedarf mit `Artifact` `action: read` + `path: "crew/<id>.jpg"` zurückholen. Im PDF werden keine Fotos gezeigt. Unbeteiligte Personen im Hintergrund werden weichgezeichnet.
Alle sechs haben der Verwendung ihres Fotos zugestimmt (laut Patrick, 30.09.).

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

Reiter „Spiele“ (`spiele-tab`, `#spiele`, nach Crew & Karten). Spiele in `trip.json` → `games.types` (Blacky Jacky = `rank`, nur Platzierung, `places` = {id: Platz}; Wizard = `wizard`,
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

Im eigenen Kapitel „🎬 Kino“ (`#kino`, Reiter `kino-tab`, direkt nach der Übersicht; dunkler Bühnen-Kasten) mit großem Start-Knopf `#samba-big` über der Bühne (nur im Ruhezustand, Klasse `.idle`) und Kasten „Reise-Film“ (`#kino-film` springt zur Karte und startet `#map-play`) (`#samba`, SVG `#samba-svg`, Knöpfe `#samba-play`/`#samba-sound`). Crew-Köpfe (Fotos) auf
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
Folge 3 „Daijo & Greisel kommen“ (06.–08.01.): Ankunft Galeão (`gig`, Greisel schläft auf dem Gepäckwagen, Rechnung vs. Pivot-Tabelle), Boeing nach Iguaçu (`boe`, Patrick erschleicht sich Rollstuhl-Boarding, Tür mit Klebeband), Wasserfälle (`falls`, Fotos als Standbild mit Polaroid-Rahmen über umgerechnetes `L`, Simon fällt rein), Nasenbären (`quati`, Zeichnung `coati()`), Grenze (`grenze`, Pass mit Foto, Zelle 3), Bootstour (`boot`), Trinkduell (`duel`, Kreideumriss).
Patrick dort bewusst nicht als Vielfraß (Wunsch Patrick), sondern Alter/Splitwise. Je Folge optional `recapBadge`, `badge` (Hinweis-Kasten im Intro), Zeilen-`name` (Rollenname im Untertitel); Pose `hush` = Mund still (Standbild); ab Folge 3 stehen alle sechs im Intro/Abspann.
Qualität: Stimmen nachbearbeitet (`POLISH` in `gen_dance_audio.py`: Stille weg, EQ, Kompressor, −16 LUFS, 128 kbit/s), Musik duckt unter Sprache, Atmo je Szene (`META.amb` → `E.amb()` in `Music()`: hall, bar, cabin, traffic, sea, night, crowd, room, wind, restaurant, falls, forest), Kreisblende + `swish` an Szenenübergängen, Kamera zeitbasiert geglättet mit leichtem Handkamera-Atmen, Mund folgt der Lautstärke stufenlos, Sprechgesten.
**Stimmen der Serie:** `series.voices` überschreibt `dance.voices` für die Crew (Jonas = Pavoque, Patrick = thorsten_emotional sid 2 tiefer, Greisel = sid 5 „verschlafen“, Daijo = Eva K; Marco und Simon wie in der Samba-Show), damit man alle blind unterscheidet.
**Ein Paket pro Folge:** `python3 tools/build_series_audio.py` packt die Einzelaufnahmen `web/audio/epN-<key>.mp3` in `web/audio/epN.mp3` und schreibt den Versatz nach `voice[key].o`. Veröffentlicht wird nur `audio/epN.mp3` (Einzeldateien in `files` auf `null`), wegen des Limits von 511 Dateien pro Artifact-Version. Nach jeder neuen Stimme das Paket neu bauen.
**Gesamtzeit vs. Folgenzeit:** Player rechnet in Gesamtzeit `g` (mit Cold Open vorne), `storyT(g)` = Zeit in der Folge; `frame(g)` → `frame0(t, g)`. `TOTAL` = Länge inkl. Cold Open.
**Cold Open** (`epN.cold`: `from`/`to` = [Zeile, Versatz], `label`): Gag aus der Folge vorab, dann Standbild mit Bildstörung „⏪ … früher“ (`FRZ`), Geräusche `scratch`/`rewind`; Ton der Folge wird dafür in `program()` ein zweites Mal im Fenster geplant (`story()`).
Kein Titelsong (auf Wunsch wieder entfernt, 03.10.).
**Gesichtsausdrücke** je Zeile: `face` (Sprecher) und `react` ({id: Ausdruck}) mit shock, heart, dizzy, angry, cash (Overlay `o.fx` über dem Foto). **Schnitte:** `close: 1` = harte Großaufnahme des Sprechers, `rshot: id` = danach 1,2 s Reaktionsgesicht. **Lacher vom Band:** `laugh: 1` (Geräusch `laugh`, dosiert an Pointen).
**Running Gags:** Nasenbär als Erzfeind in jeder Folge (`epN.cameo`: `sc`, `key`, `d`, `dur`, Weg `x`→`x2`, `y`, Beute `prop`, Größe `s`), außerdem Greisel schläft immer irgendwo, Patricks Tattoo, Marcos Zahnbürste. Witze pro Person abwechseln (Daijo nicht nur Excel, Jonas nicht nur Splitwise, Patrick nicht als Vielfraß).
**Player:** Fortschrittsleiste zum Ziehen/Tippen mit Kapitelmarken (`#ser-track`, Pointer-Events, Pfeiltasten ±10 s), darunter der Name des aktuellen Kapitels (`#ser-chap`, aus `CHAPS`; Kapitel-Knöpfe auf Wunsch entfernt), „⏭ Intro überspringen“ (`#ser-skip`), Weiterschauen (localStorage `br26.serPos.epN`, „↺ Von vorn“ `#ser-restart`), gesehen (`br26.serSeen.epN`). Folgen-Kacheln (`.ser-tile`) mit `epN.thumb` (Emojis) und `epN.color`, Dauer, Fortschritt, ✓ gesehen. Springen = `seek(g)` → `start(g)`, `program(m, t0, lo)` plant nichts vor `lo`.
Nur-Kopf-Figuren (`headOnly`, Hilfsfunktion `headAt`) für Fenster, Gondel und Handy-Bildschirm. Lange Untertitel brechen in zwei Zeilen um.
Neue Folge: Zeilen in `series.epN` (mit `scenes`, `credits`, `next`), Stimmen per `--series epN`, Szenen-Code in `frame()` ergänzen, `META` erweitern.

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
- Unsichere Angaben kennzeichnen (🟡 prüfen / ❓ unklar) statt raten.
- Personen: Gringos plus 1 Cevapi = Jonas, Patrick, Simon, Marco (ab 27.12.); Daijo & Greisel stoßen am 06.01. in Rio dazu.
  Schreibweise **Daijo** (nicht „Dajo“); die interne Crew-`id` bleibt `dajo` (Datenbank, Foto `crew/dajo.jpg`).
  Echte Vornamen verwenden (nicht die Chat-Spitznamen Steini = Simon, Lubo = Marco). Greisel und Daijo bleiben so.
