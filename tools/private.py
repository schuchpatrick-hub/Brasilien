#!/usr/bin/env python3
"""Private Serien-Teile (Spieler-Porträts mit echten Geschichten) außerhalb des öffentlichen Repos halten.

web/private/series.json (gitignored) enthält trip.json-Einträge unter `series`, z. B. `pjonas`. build.py mischt sie beim Bauen
in die Webseite. Die Werkzeuge (gen_series_xtts.py, relayout.py, build_series_audio.py) arbeiten auf trip.json, deshalb:
  python3 tools/private.py in    → private Einträge vorübergehend nach trip.json holen
  python3 tools/private.py out   → wieder zurück nach web/private/series.json (vor jedem Commit!)
Audio: web/audio/p<name>*.mp3 ist ebenfalls gitignored und liegt nur im Artifact (audio/p<name>.mp3).
Wiederherstellen nach neuem Container: Artifact lesen und den Eintrag aus TRIP.series im Seitenquelltext übernehmen.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRIP, PRIV = os.path.join(ROOT, 'web', 'trip.json'), os.path.join(ROOT, 'web', 'private', 'series.json')
is_priv = lambda k, v: isinstance(v, dict) and v.get('portrait')


def load_private():
    return json.load(open(PRIV, encoding='utf-8')) if os.path.exists(PRIV) else {}


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    t = json.load(open(TRIP, encoding='utf-8')); pv = load_private()
    if cmd == 'in':
        t['series'].update(pv)
    elif cmd == 'out':
        for k in [k for k, v in t['series'].items() if is_priv(k, v)]: pv[k] = t['series'].pop(k)
        os.makedirs(os.path.dirname(PRIV), exist_ok=True)
        open(PRIV, 'w', encoding='utf-8').write(json.dumps(pv, ensure_ascii=False, indent=2) + '\n')
    else:
        sys.exit(__doc__)
    open(TRIP, 'w', encoding='utf-8').write(json.dumps(t, ensure_ascii=False, indent=2) + '\n')
    print(cmd, sorted(pv))


if __name__ == '__main__':
    main()
