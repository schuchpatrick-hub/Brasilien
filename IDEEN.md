# Ideen-Speicher für die Webseite

Vorgemerkte und vorgeschlagene Erweiterungen. Wenn Patrick „mach X“ sagt, hier nachsehen und danach den Eintrag
nach „Umgesetzt“ verschieben.

## ⭐ Vorgemerkt (Patrick will das)

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
- **„Gringo Kart“** (⏳ Prototyp 07.10. umgesetzt: Copacabana, 3 Runden, Items; wartet auf Patricks Test): Rennspiel von oben über die Reiseroute, Uber/Fiat Uno/Boot/Gepäckkarren, Items Caipi-Turbo, Sonnencreme-Öl, Nasenbär-Blitz, Bestenliste je Strecke.
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
