#!/usr/bin/env python3
"""Zeiten einer Serien-Folge aus Pausen und Sprechlängen neu berechnen.

Jede Zeile in trip.json → series.epN.lines trägt `sc` (Szene) und `gap` (Pause vor der Zeile in ms; bei der ersten Zeile
einer Szene = Vorlauf ab Szenenbeginn), jede Szene `tail` (Nachlauf nach der letzten Zeile). Zeilen mit `anchor: [key, ms]`
laufen über einer Pause und hängen an einer anderen Zeile (Zeitpunkt = Anker + Versatz). Daraus ergeben sich `at` und
`scenes[].t`. Dauer = voice[key].dur (Zwischentitel: cdur). Neue Stimme erzeugt → einfach dieses Skript laufen lassen,
die Pausen bleiben gleich.

Aufruf: python3 tools/relayout.py [ep1 ep2 …]   (--init: Pausen einmalig aus den jetzigen Zeiten ableiten)
"""
import json, os, re, sys

TRIP = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'web', 'trip.json')


def dur(E, l):
    return l.get('cdur', 2600) if l['who'] == 'card' else E['voice'].get(l['key'], {}).get('dur') or int(len(l.get('say', '')) * 62 + 400)


def init(E):
    """Pausen aus den bisherigen Zeiten ableiten (einmalig)."""
    for s in E['scenes']:
        ls = [l for l in E['lines'] if s['t'][0] <= l['at'] < s['t'][1] and 'anchor' not in l]
        prev = s['t'][0]
        for l in ls:
            l['sc'] = s['id']; l['gap'] = l['at'] - prev; prev = max(prev, l['at'] + dur(E, l))
        s['tail'] = s['t'][1] - prev


def layout(E):
    t = 0; at = {}
    for s in E['scenes']:
        s0 = t; prev = s0
        for l in E['lines']:
            if l.get('sc') != s['id'] or 'anchor' in l: continue
            l['at'] = prev + l['gap']; prev = l['at'] + dur(E, l); at[l['key']] = l['at']
        t = prev + s.get('tail', 1800); s['t'] = [s0, t]
    for l in E['lines']:
        if 'anchor' in l: k, o = l['anchor']; l['at'] = at[k] + o
    E['lines'].sort(key=lambda l: l['at'])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    t = json.load(open(TRIP, encoding='utf-8')); se = t['series']
    eps = args or sorted((k for k in se if re.fullmatch(r'ep\d+', k)), key=lambda k: int(k[2:]))
    for ep in eps:
        if '--init' in sys.argv: init(se[ep])
        layout(se[ep]); print(ep, round(se[ep]['scenes'][-1]['t'][1] / 1000, 1), 's')
    open(TRIP, 'w', encoding='utf-8').write(json.dumps(t, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
