# Ideen-Speicher für die Webseite

Vorgemerkte und vorgeschlagene Erweiterungen. Wenn Patrick „mach X“ sagt, hier nachsehen und danach den Eintrag
nach „Umgesetzt“ verschieben.

## ⭐ Vorgemerkt (Patrick will das)

- **Seite in zwei Hauptbereiche teilen** (vorgemerkt 07.10., „gerne später“): oben ein großer Umschalter **🧳 Reise** | **🎉 Spaß**,
  darunter die bisherigen Reiter als Unterkategorien. Reise = Übersicht, Tag für Tag, Flüge & Kosten, Praktisches/Gesundheit, Unterwegs & Packen,
  Downloads. Spaß = Crew & Karten, Kino, Vorfreude, Spiele (Gringo Kart), Drinks. Gewählter Bereich pro Handy merken; Themen-Kacheln, Suche und
  „Was ist neu?“-Punkte je Bereich (Punkt auch am Hauptschalter); Kopf mit Heute-Karte bleibt immer sichtbar; unterwegs (27.12.–21.01.)
  Standard = Reise. Im PDF nur der Reise-Teil plus kurzer Spaß-Anhang. Offen: Drinks eher bei Spaß, oder unterwegs auch in Reise?

- **Panini-Sticker-Album „Panini Gringos – Brasil 26/27“** (vorgemerkt 07.10., „die nächsten Tage umsetzen“): ca. 120 Sticker auf Album-Seiten
  (Crew inkl. Glitzer-Wappen und Mannschaftsfoto als 4-Teile-Puzzle · Stationen als 2-Teile-Panoramen · Nebendarsteller (Taxifahrer, Kontrolleur,
  Dona Rosa, Rezeptionistin, Kaiman, rosa Delfin …) · eigene Nasenbär-Seite · Legendäre Momente als Standbilder aus Serie/Porträts · seltene Specials
  (Sonnenbrand-Simon, Silvester-Held, Promille-Lukas, TOTS, Rote Laterne) · ~16 nur unterwegs freischaltbar aus Live-Daten (Check-ins, erster Caipi,
  Trinkkönig, Footvolley-Sieg)). Täglich 1 Tüte à 5 (Aufreißen, Walkout bei Glitzer), Einkleben per Antippen, leere Plätze mit
  Nummer/Umriss, Doppelte, Album-Bestenliste; bis Abflug ca. 85 %, Rest nur in Brasilien. Auf der Seite nur eine Zeile im Kapitel Vorfreude, Album als Vollbild,
  Sticker-Bilder als Artifact-Dateien (nicht im Repo, Gesichter), lazy geladen.
  **Profi-Stufe:** einheitlicher Panini-Rahmen (Nummer, Namensband, Wappen, Flagge) und Farbfilter für alle Motive; Seltenheiten Normal/Glitzer (Holo, Neigen
  bzw. Wischen)/Gold/Retro 1970; Witz-Fehldrucke („Smion“); neu gezeichnete Motive für Nebendarsteller/Nasenbär/Specials; optional echte Fotos von Patrick im
  Comic-/Rasterdruck-Look (Foto-Quartett-Idee mitnutzen); Rückseiten mit Steckbrief/Zitat/Geschichte; Album-Cover, Seiten-Hintergründe, Seite komplett =
  Animation + Bonus-Tüte, Sounds; Druck-PDF (Stickerpapier/Fotodienst) als Erinnerungsheft.
  **Start mit Probe:** 8 Sticker in allen Stufen + 1 Tüte + 1 Album-Seite + Rückseiten.
  **Offen (Patrick entscheidet):** Tauschen a) Crew per E-Mail als Bearbeiter einladen (db: Alben, Tauschbörse, Bestenliste) oder b) Tausch-Codes per WhatsApp
  (Alben nur im localStorage je Handy).

- **Strafen-Glücksrad für Verlierer** (vorgemerkt 01.10.): In der Verlierer-Ecke der Spiele ein Knopf „Strafe ziehen“,
  ein Rad mit Strafen dreht sich (z. B. „Caipi exen“, „Einem Fremden auf Portugiesisch ein Kompliment machen“,
  „Nächste Runde zahlen“, „10 Minuten Jonas’ Fischerhut tragen“). Strafen in `trip.json`, eigene über die Seite
  ergänzbar (db), gezogene Strafe pro Partie speichern und im Verlauf zeigen. Kein `confirm()`/`alert()` verwenden.

- **Foto-Quartett der Crew** (vorgemerkt 01.10., wartet auf Bilder): Patrick schickt pro Person 6 Fotos (mit Name, gern
  mit kurzer Geschichte). Daraus 36 Karten, gruppiert nach Person (1A–1F Jonas, 2A–2F Patrick …), je Karte Foto, Nummer,
  lustiger Titel, Spruch und 5–6 Werte (teils aus den FIFA-Karten, teils bildbezogen wie Peinlichkeit, Würde, Pegel im Bild).
  Zwei Varianten: digital auf der Seite spielbar (zwei Spieler auf einem Handy, offline) und Druck-PDF im Kartenformat
  59 × 91 mm. Fotos nur im Artifact (nicht im Repo), Unbeteiligte weichzeichnen, erst eine Musterkarte zeigen.

- **Cartoon-Animationen** (vorgemerkt 02.10., Patrick will alle nach und nach, gleicher Stil wie die Samba-Show: Foto-Köpfe auf
  Cartoon-Körpern, Münder wie die South-Park-Kanadier, Stimmen per `tools/gen_dance_audio.py`):
  1. ✅ **„Gringos – Die Serie“, Folge 1** umgesetzt (02.10., Kino; neu geschnitten: nur 27.–28.12. mit schwarzem Humor, Bar, Turbulenzen, Uber, Strand-Flirt, Sonnenbrand, Caipi-Abend).
     **Geparkt für spätere Folgen** (fertig gebaut, `series.parked`): Silvester mit 7 Wellen (Marco), Buffet-Tetris in Foz, Affe klaut Jonas’ Fischerhut, Footvolley 0:21.
     ✅ Folge 2 „Silvester in Rio“ umgesetzt (02.10.). ✅ Folge 3 „Daijo & Greisel kommen“ umgesetzt (03.10.): Galeão, Boeing mit Klebeband-Tür, Wasserfall-Selfie, Nasenbären, argentinische Grenze, Macuco-Boot, Trinkduell. Wunsch Patrick: nicht mehr als Vielfraß zeigen, lieber andere Gags (Alter, Splitwise-Minus). Offen für Rio-Reste: Maracanã, Lapa-Treppe, Favela-Tour, Praia dos Amores.
     ⏳ **Nach der letzten Folge:** Staffelfinale „Heimflug“ + Jahresrückblick-Special mit den besten Szenen aller Folgen (Wunsch Patrick, 03.10.: erst ganz am Ende).
     Umgesetzt (03.10.): Cold Open, (Titelsong und Kapitel-Knöpfe wieder entfernt, gefielen nicht), eigene Stimmen je Person, Gesichtsausdrücke, harte Schnitte, Lacher vom Band, Fortschrittsleiste zum Ziehen, Weiterschauen, Folgen-Kacheln, ein Audio-Paket pro Folge, Nasenbär als Running Gag.
     Plan: Folge 2 Silvester in Rio · Folge 3 Daijo & Greisel kommen / Iguaçu · Folge 4 Amazonas · Folge 5 Paraty & Ilha Grande (Footvolley) · Finale Heimflug. (Ursprünglich: Sicherheitskontrolle München (Simons Koffer voller Sonnencreme), Flieger
     (Patrick bestellt zum 4. Mal Essen nach), Copacabana-Silvester (7. Welle haut Marco um), Buffet in Foz (Teller-Tetris in
     Zeitlupe), Dschungel (Affe klaut Jonas’ Fischerhut), Footvolley gegen Einheimische 0:21, Abspann.)
  2. **Interaktiver Cartoon „Wähle dein Abenteuer“**: Entscheidungen antippen (Caipi oder Wasser, Kaiman streicheln …), 4–5 Enden.
  3. **Spiel „Gringo Run“** an der Copacabana: Crew-Kopf wählen, über Sandburgen springen, Caipis sammeln, Sonnenbrand-Balken,
     gemeinsame Bestenliste (db), zählt für die FIFA-Karten.
  4. **Wöchentliche Mini-Folgen** bis zum Abflug (je ca. 15 s): Koffer packen, Portugiesisch üben, Bikini-Figur-Training …,
     im Vorfreude-Kalender und als Video für WhatsApp.
  5. **Lebendige Heute-Szene** unterwegs: kleine Endlos-Animation der aktuellen Station im Heute-Kasten.

## 🚀 Große Projekte (Ideenliste 07.10., Patrick: „alle super“, wählt eins zum Umsetzen)

**Film & Serie**
- **Kinofilm „Gringos – Der Film“** (ca. 15 min): Nasenbär klaut am ersten Tag Jonas' Pass, Jagd quer durch Brasilien, Showdown auf der Ilha Grande; Kinoplakat, Trailer (auch 9:16), Premiere mit Countdown am Abflugtag, Popcorn-Knopf.
- **Musical „Caipirinha – Das Musical“**: 3–4 gesungene Nummern, Solo-Lied je Person über ihre Macke, Finale als Chor an der Copacabana.
- **Telenovela „Amor em Paraty“**: Seifenoper auf Portugiesisch mit Untertiteln, dramatische Zooms, Simon als tragischer Liebhaber, Dona Rosa kehrt zurück.
- **Doku „Planet Gringo“** (Attenborough-Stil): Tierfilm-Sprecher beobachtet die Crew wie Wildtiere, eine Folge pro Station, Nasenbär und Kaiman als Gegenspieler.
- **Heist-Film „Ocean's Six“**: Coup auf das letzte Picanha-Stück im Rodízio, Spezialrollen (Daijo Planer, Greisel Muskeln, Marco Ablenkung), Lageplan, Split-Screens, Wendung.
- **Parodie-Reihe**: je 1 min im Stil Simpsons-Couch-Gag, Stummfilm, Anime, 8-Bit, Nachrichten, Wetterbericht.
- **Reality-Show „Big Gringo Brasil“**: abends Nominierung per Abstimmung, Auszugs-Animation, am Ende „Gringo des Jahres“.

**Spiele**
- **„Wähle dein Abenteuer“** (interaktiver Cartoon, 6–8 Enden, Sammlung der Enden).
- **„Gringo Run“** (siehe Cartoon-Animationen Nr. 3; Nasenbär als Boss, Rekord = +1 auf der FIFA-Karte).
- **„Gringo Kart“** (⏳ in Arbeit: Stufe 1 Fahrgefühl, Stufe 2 sechs Strecken + Grand Prix, Stufe 3 Persönlichkeit/Spezial-Items/Fahrzeuge umgesetzt 07.10.; Stufe 4 Crew-Bestenliste per Einladung, Geister, Tages-Challenge ebenfalls 07.10.): Rennspiel von oben über die Reiseroute, Uber/Fiat Uno/Boot/Gepäckkarren, Items Caipi-Turbo, Sonnencreme-Öl, Nasenbär-Blitz, Bestenliste je Strecke.
- **„Gringos – Das Brettspiel“**: digital auf einem Handy (2–6), Felder = Stationen, Ereigniskarten aus echten Geschichten, Splitwise-Schulden als Währung, plus Druck-PDF.
- **Escape-Room „Gefangen in der Juma Lodge“**: Hinweise in Fotos, Portugiesisch-Sätzen, Steckbriefen; Codes; Lösungszeit mit Rangliste.
- **„Wer wird Millionär – Gringo-Edition“**: 15 Fragen, Moderator-Stimme, Joker 50:50, Publikum (Crew live), Telefonjoker (Crew-Stimme antwortet frech).
- **„Fußball-Manager Gringos FC“**: Team aus den FIFA-Karten, Taktik, simulierte Spiele mit Live-Kommentar, Werte ändern sich mit Drinks/Siegen.

**Erinnerung & Mitmachen**
- **Interaktives Comic-Heft** (Asterix-Stil, unterwegs täglich eine Seite, am Ende PDF).
- **„Gringo-Radio“**: 24/7-Sender mit Morgenshow, Nachrichten aus Live-Daten, Werbespots (Splitwise, Sonnencreme), mischt sich neu.
- **3D-Globus-Reise**: Route abfliegen, Fotos, Check-ins, Kilometer, zum Drehen/Zoomen.
- **Reise-Tagebuch mit Erzähler**: Sprecher fasst jeden Tag aus den Live-Daten zusammen, ergibt ein Hörbuch der Reise.

**Kleinere aus derselben Liste**
- „Wer war's?“-Quiz (Zitate/Geschichten raten), Nasenbär-Jagd (10 versteckte Nasenbären auf der Seite → Bonus-Clip), Cevapi-Coins-Wettbüro (Quoten aus den Karten),
  Crew-Aktienmarkt (Marktwert als Börsenticker), Brasilien-Bingo (eigene Karte je Person), Soundboard (beste Sprüche), „O Diário dos Gringos“ (tägliche Boulevard-Titelseite aus Live-Daten),
  Tagesheld & Tagesdepp mit Urkunde, Wanted-Plakate aus Ereignissen, Footvolley-Live-Ticker, Sprüche-Wand, „Brasilien Wrapped“ (Swipe-Statistik), Brasilien-Oscars als Cartoon-Verleihung.

## 🏎️ Gringo Kart: Ideen-Analyse (09.10., Vergleich mit Mario Kart, Diddy Kong Racing, Crash Team Racing & Co.)

Stand: Beim Fahren ist Gringo Kart schon auf Mario-Kart-8-Niveau (Drift + Mini-Turbo, Raketenstart, Tricks, Mehrfach-Items, Münzen, Geister,
Pokale, Live-Rennen, Spezial-Items je Fahrer wie Double Dash, Fahrzeuge/Tuning/Teile, Takedowns wie Burnout, Schleichwege, Wetter).
Es fehlen vor allem Spielmodi außer Rennen, Langzeit-Ziele, Gruppen-Funktionen für unterwegs und Präsentation.

**Im Rennen**
- 🎈 **Ballon-Schlacht / Caipi-Klau** (Battle-Modus Mario Kart): Strand-Arena, live mit der Crew, 3 Ballons bzw. goldenen Caipi 20 s halten.
- ⚽ **Kart-Fußball im Maracanã** (Rocket League): 3 gegen 3 live, großer Ball, Tore, Torjubel mit Crew-Stimmen; passt zu den FIFA-Karten.
- 🥁 **Samba-Drift im Takt** (CTR-Turbo-Kette): während des Drifts im Takt der Surdo tippen, jede Stufe stärkerer Turbo.
- 🔁 **Strecke ändert sich je Runde** (Sonic Transformed): Copacabana Runde 3 Flut, Cristo Nebel dichter, Brücke Stau auf einer Spur, Réveillon Feuerwerk ab Runde 2.
- 💣 **Fallen selbst auslösen** (Split/Second): Leiste durch Drift/Windschatten füllen, an markierten Stellen Container, Welle oder Obststand auf Gegner loslassen.
- 🆕 **Neue Items**: 🚌 Ônibus-Express (Autopilot für Hintere, Bullet Bill), ⚡ Cristo-Blitz (alle anderen schrumpfen), 🟣 Açaí-Spritzer (Bild der Vorderen voll, Blooper), 🦅 Urubu (sucht den Führenden, Blue Shell), 📯 Apito (Pfeife gegen den Urubu).
- 🪂 **Asa-Delta** (Mario Kart 7): Drachenflieger von der Pedra Bonita, nach großen Schanzen gleiten und in der Luft lenken.
- 🎬 **Takedown-Zeitlupe** (Burnout-Crash-Cam): 0,6 s Zeitlupe mit Zoom aufs Opfer.
- 🔤 **G-R-I-N-G-O sammeln** (CTR-Buchstaben): sechs Buchstaben je Strecke versteckt, alle in einem Rennen = Belohnung.
- 🗣️ **Brasilianischer Kommentator** (Galvão-Bueno-Stil): „Haja coração!“, „É campeão!“ zusätzlich zum Ansager.
- 🤖 KI-Gegner fahren auch mal die neuen Fahrzeuge (Trio-Bass von vorne, Kokosnüsse vom Gegner).

**Menü und drumherum**
- 🗺️ **Abenteuer „Die Reise“** (Diddy Kong Racing): Brasilien-Karte als Oberwelt, Strecken in Reise-Reihenfolge, Bossrennen (Nasenbär-König, Kaiman, Kontrolleur), Endboss.
- 🥇 **Medaillen** (CTR-Relikte, Mario-Kart-Entwicklergeister): Bronze/Silber/Gold/Platin je Strecke gegen feste Geister, Platin = Geist vom Taxifahrer.
- ⚔️ **Duell-Herausforderung** (asynchron): eigene Zeit + Geist an jemanden aus der Crew schicken, Münz-Einsatz, Hinweis auf der Seite.
- 🍻 **Party-Modus „Handy rumreichen“** (Micro Machines/Hot Seat) für die Bar: jeder fährt eine Runde, Verlierer dreht das Strafen-Glücksrad.
- 🏆 **Turnier-Baum** für Crew + Gäste (K.-o.-System) und 👥 **Team-Rennen** (Schwaben Augsburg mit Jonas, Greisel, Marco, Erich, Rasmus gegen den Rest).
- ✏️ **Streckenbauer** (ModNation/Trackmania): Strecke mit dem Finger malen, Thema wählen, mit der Crew teilen, eigene Bestzeiten.
- 📸 **Siegerfoto** zum Speichern/Teilen (Podest mit Köpfen, Zeit, Strecke) und 🎞️ **Wiederholung** mit TV-Kameras.
- 🪪 **Karriere/Führerschein** (Gran Turismo): Fahrschüler → Uber-Fahrer → Taxi-Profi → Ayrton, Statistik je Person.
- 🔗 **Mit der Seite verknüpfen**: Kart-Siege/Bestzeiten wirken auf den FIFA-Marktwert, unterwegs doppelte Münzen auf der Strecke der heutigen Station, Check-in schaltet Bonus-Variante frei.
- 🏁 **Interlagos** (F1-Strecke in São Paulo mit dem „S do Senna“) als Bonusstrecke.

**Aus der Gesamtprüfung 2 (09.10. spät), nach Nutzen sortiert**
1. 📶 **Datensparmodus Live** (Patrick gefragt, wartet auf Ja): 10 statt 20 Meldungen/s, halbe Datenmenge, Handys rechnen dazwischen weiter.
2. 📊 **Rennbericht nach dem Rennen**: Rundenzeiten, Takedowns, wer dich am häufigsten abgeschossen hat („Erzfeind des Rennens“), Drift-Zeit, Münzen, Abstürze – mit schwarzem Kommentar.
3. 👀 **Zuschauen im Live-Raum**: wer die Seite offen hat, empfängt die Live-Rennen sowieso schon mit; daraus ein Zuschauer-Bild (Kamera springt zwischen den Fahrern, Emoji-Jubel) ohne zusätzliches Datenvolumen.
4. ⏳ **Live-Nachzügler**: statt „Warte auf die anderen … 18 s“ die Namen zeigen („Warte auf Simon, Marco“), Wartezeit 30 → 20 s; wer schon im Ziel ist, kann Emojis schicken.
5. 🔄 **Bestenliste nach jedem Rennen neu laden**, damit Rekorde anderer sofort im Ergebnis stehen (heute erst beim nächsten Öffnen).
6. 📱 **ITEM-Knopf**: halbdurchsichtig, solange ein Kart direkt dahinter fährt (verdeckt im Hochformat die Verfolger), Sprechblasen/Texte nicht mehr über Tacho und ITEM-Knopf.
7. 🧭 **Kipp-Lenkung** (Handy neigen) ❓ ob der claude.ai-Viewer die Lagesensoren freigibt, erst testen.
8. 🎬 **Fotofinish-Wiederholung**: bei unter 0,15 s die letzten 2 s in Zeitlupe von der Seite.

## 💡 Vorgeschlagen, noch nicht beauftragt

- Silvester-Special „Réveillon“ (Countdown, Bräuche, Ablauf, Treffpunkt, Sicherheit)
- Notfall-Karte (Notrufnummern, Botschaft, Adressen auf Portugiesisch, Diebstahl-Tipps)
- Willkommens-Kasten für die anderen (was die Seite kann, als App speichern)
- Gringo-Punkte (Touristen-Fails zählen, „Größter Gringo der Reise“)
- Runden-Zähler „Wer hat geschmissen?“
- Tagesheld & Tagesdepp, Reise-Horoskop
- Reise-Türchen während der Reise, Sonnenuntergang-Countdown, Rechnung teilen, Carioca-Namen
- „O Diário dos Gringos“ (tägliche Boulevard-Titelseite), Probier-Liste, Brasilien-Bingo
- „Brasilien Wrapped“, Brasilien-Oscars, Foto des Tages, Sprüche-Wand, Regelbuch der Spiele
- Telenovela der Reise, Wanted-Plakate, Crew-Aktienmarkt, Erfolge/Badges,
  Wettbüro mit Cevapi-Coins, Radio Gringo, Ehrenurkunden, Rubbel-Karte, Soundboard, Live-Ticker beim Footvolley

- **Vorschläge vom 02.10.** (Patrick wählt Nummern): „Jetzt buchen“-Hinweis ab 19.10. mit offenen Buchungen · Doppelungen
  Route/Stationen/Tage abbauen · Reisemodus ab 27.12. (Heute, Drinks, Karte, Spiele nach oben) · Notfall-Karte (Notrufe 🟡 prüfen,
  Konsulat Rio, Adressen auf Portugiesisch, Boletim de Ocorrência) · Wochen-Teaser-Bild für WhatsApp · „Gut zu wissen“: Strom
  (Typ N, 127/220 V 🟡), Bezahlen (Pix, serviço 10 %), Strand-Knigge, Silvester-Bräuche, Caipi-Kunde · Tages-Briefing am Morgen ·
  Gepäck-Check vor Weiterreise · Rechnung teilen (Ausgleichsliste) · Abstimmungen · Zitate-Wand · Schritte-Ranking ·
  Rückblick-Seite „So war’s“ ab 21.01. · Rückblick-Film mit echten Daten · Urkunden als Bild
- **Film-Ideen:** Regisseur-Modus (Crew schlägt Sprüche vor), „Wer ist es?“-Teaser, Wetter-Effekte, Hochkant-Version 9:16,
  Fotos als Polaroid bei Aufenthalten, Abspann mit Statistik/Credits, Film-Download auf der Seite

## 🕒 Später vielleicht

- **Eigene App (PWA) / Offline-Modus** (besprochen 01.10., erstmal nicht): Offline für Dschungel/Boot, Benachrichtigungen,
  eigene Adresse. Bräuchte Hosting + eigene Datenbank (z. B. Firebase), Crew-Fotos nicht ins öffentliche Repo.
  Kleinere Variante: Offline-Speicher der Inhalte im jetzigen Artifact (erst testen, ob der Viewer das erlaubt).

## ✅ Umgesetzt

Fotos und Zeichnungen, App auf dem Startbildschirm, Real-Rechner, Flüge als Bordkarten, Vorfreude-Kalender,
Zeitkapsel mit Auswertung, Spiele mit Ranglisten, Verlierer-Sprüchen und Löschen, FIFA-Karten der Crew.
