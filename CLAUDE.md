# Brasilienreise 2026/27 – Hinweise für Claude

Planungs-Repo für die Brasilienreise (27.12.2026 – 20./21.01.2027). Kein Code-Projekt: Inhalt ist die
Reiseübersicht, die bei neuen Infos (Buchungen, Chat-Exporte, Screenshots) aktualisiert wird.

## Dateien

| Datei | Zweck |
|---|---|
| `README.md` | Hauptübersicht (Route, Tag für Tag, Flüge, Unterkünfte, Kosten, offene Punkte, Gesundheit) |
| `web/page_body.html` | Inhalt der Webseite, gleiche Fakten wie README; `%%MAP%%` = Platzhalter für die Karte |
| `web/page_head.html` | Titel + CSS der Webseite (Farb-Tokens, Hell/Dunkel) |
| `web/poster_template.html` | Rahmen für das Reisebild (Titel, Stationsleiste unten) |
| `tools/gen_map.py` | Zeichnet die Karte: Orte, Flugbögen, Beschriftungen, Südost-Ausschnitt |
| `tools/build.py` | Baut `reisebild.svg`, `reisebild.png` und `web/brasilien-reise.html` neu |

Generiert (nicht von Hand bearbeiten): `reisebild.svg`, `reisebild.png`, `web/brasilien-reise.html`.

## Aktualisieren

1. Fakten ändern in **beiden**: `README.md` und `web/page_body.html` (plus ggf. Stationsleiste in
   `web/poster_template.html` und Beschriftungen/Daten in `tools/gen_map.py`).
2. `pip install playwright` (einmalig, für das PNG; Chromium liegt in `/opt/pw-browsers`), dann
   `python3 tools/build.py`. Die Natural-Earth-Daten werden beim ersten Lauf nach `tools/data/` geladen (gitignored).
3. Karte nach Änderungen einmal ansehen (`reisebild.png`), auf überlappende Beschriftungen achten.
4. Webseite neu veröffentlichen: Artifact-Publish von `web/brasilien-reise.html` mit
   `url: https://claude.ai/artifact/3MHzcPCtQJY7Kx5XUHDGZE` (vorher `action: read`), damit der Link gleich bleibt.
5. „Stand“-Datum in README und Webseite anpassen, committen, pushen.

## Regeln

- **Repo ist öffentlich:** keine Roh-Chats, Telefonnummern, IBANs, Nachnamen, Passdaten,
  Buchungsnummern oder Splitwise-Einladungslinks einchecken. Nur Vornamen/Spitznamen.
- Unsichere Angaben kennzeichnen (🟡 prüfen / ❓ unklar) statt raten.
- Personen: Vorhut = Jonas, Patrick, Steini, Lubo (ab 27.12.); Dajo & Greisel stoßen am 06.01. in Rio dazu.
