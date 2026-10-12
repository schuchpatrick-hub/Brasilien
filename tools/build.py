"""Baut alle Ausgaben der Reiseübersicht neu.

    python3 tools/build.py

Erzeugt aus den Quellen in web/ und tools/:
  reisebild.svg              Karte (eigenständiges SVG)
  web/brasilien-reise.html   Webseite (Artifact) = page_head + page_body + Karte + page_script (+ trip.json)
  kalender/*.ics             Kalenderdateien je Gruppe (aus web/trip.json)
  reisebild.png              Reisebild = poster_template + Karte   } brauchen: pip install playwright
  brasilien-reise.pdf        Offline-Version der Webseite         } und Chromium
"""
import hashlib
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import gen_map
import gen_scenes
import re
from gen_audio import audio_name


def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


def write(text, *p):
    path = os.path.join(ROOT, *p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    print('geschrieben:', os.path.join(*p))


# ---------- Kalender ----------

def ics_escape(s):
    return s.replace('\\', '\\\\').replace(';', '\;').replace(',', '\\,').replace('\n', '\\n')


def fold(line):
    """Kalenderzeilen nach RFC 5545 bei 75 Bytes umbrechen (ohne UTF-8-Zeichen zu zerteilen)."""
    out, cur = [], ''
    for ch in line:
        if len((cur + ch).encode('utf-8')) > (75 if not out else 74):
            out.append(cur)
            cur = ''
        cur += ch
    out.append(cur)
    return '\r\n '.join(out)


def next_day(yyyymmdd):
    import datetime
    d = datetime.date(int(yyyymmdd[:4]), int(yyyymmdd[4:6]), int(yyyymmdd[6:]))
    return (d + datetime.timedelta(days=1)).strftime('%Y%m%d')


ICS_NOW = None   # Zeitpunkt dieses Neubaus (UTC), für geänderte/neue Termine


def ics_old(path):
    """Termine der bisherigen Kalenderdatei (für feste UIDs und SEQUENCE)."""
    if not os.path.exists(path):
        return []
    raw = open(path, encoding='utf-8', newline='').read().replace('\r\n ', '').replace('\r\n', '\n')
    out = []
    for blk in raw.split('BEGIN:VEVENT\n')[1:]:
        f, body = {}, []
        for line in blk.split('END:VEVENT')[0].strip('\n').split('\n'):
            k = line.split(':', 1)[0].split(';', 1)[0]
            if k in ('UID', 'DTSTAMP', 'SEQUENCE', 'LAST-MODIFIED'):
                f[k] = line.split(':', 1)[1]
            else:
                body.append(line)
        out.append({'uid': f['UID'], 'seq': int(f.get('SEQUENCE', 0)), 'stamp': f.get('DTSTAMP'),
                    'mod': f.get('LAST-MODIFIED', f.get('DTSTAMP')), 'body': body})
    return out


def build_ics(trip, group, old=()):
    """Kalender einer Gruppe. Termine behalten ihre UID aus der bisherigen Datei (gleicher Tag + Titel,
    sonst gleicher Tag + Beginn, sonst eindeutiger Titel an einem anderen Tag = verschoben); bei
    geänderten Angaben steigt SEQUENCE und DTSTAMP/LAST-MODIFIED = Neubau. So übernehmen Kalender-Apps
    Änderungen beim erneuten Laden oder Abonnieren, statt Termine doppelt anzulegen."""
    import datetime
    global ICS_NOW
    ICS_NOW = ICS_NOW or datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')

    def mine(g):
        return g in ('all', group)
    ev = []   # [Art, Vorschlag-UID, Zeilen]
    for d in trip['days']:
        if not mine(d['g']):
            continue
        for it in d['items']:
            e = it.get('ics')
            if not e or not mine(e.get('g', 'all')):
                continue
            if 'start' in e:
                when = [f"DTSTART:{e['start']}", f"DTEND:{e['end']}"]
            else:
                when = [f"DTSTART;VALUE=DATE:{e['date']}", f"DTEND;VALUE=DATE:{next_day(e['date'])}"]
            h = hashlib.sha1(e['summary'].encode('utf-8')).hexdigest()[:6]
            ev.append(['ev', f"{d['date']}-{h}-{group}", [*when, f"SUMMARY:{ics_escape(e['summary'])}",
                       f"DESCRIPTION:{ics_escape((e['desc'] + ' – ' if e.get('desc') else '') + 'Brasilien 26/27')}"]])
    for s in trip['stays']:
        if not mine(s['g']):
            continue
        ev.append(['stay', f"stay-{s['from']}-{group}", [f"DTSTART;VALUE=DATE:{s['from']}", f"DTEND;VALUE=DATE:{s['to']}",
                   f"SUMMARY:{ics_escape('🛏 ' + s['name'])}", 'TRANSP:TRANSPARENT']])

    def key(body, k):
        return next((l.split(':', 1)[1] for l in body if l.split(':', 1)[0].split(';', 1)[0] == k), '')
    kind = lambda o: 'stay' if o['uid'].startswith('stay-') else 'ev'
    free = list(old)
    match = [None] * len(ev)
    tests = [lambda e, o: key(e[2], 'DTSTART')[:8] == key(o['body'], 'DTSTART')[:8] and key(e[2], 'SUMMARY') == key(o['body'], 'SUMMARY'),
             lambda e, o: key(e[2], 'DTSTART') == key(o['body'], 'DTSTART')]
    for t in tests:
        for i, e in enumerate(ev):
            if match[i] is None:
                o = next((o for o in free if kind(o) == e[0] and t(e, o)), None)
                if o:
                    match[i] = o
                    free.remove(o)
    for i, e in enumerate(ev):   # Termin auf einen anderen Tag verschoben: Titel ist auf beiden Seiten eindeutig
        if match[i] is None:
            sm = key(e[2], 'SUMMARY')
            cand = [o for o in free if kind(o) == e[0] and key(o['body'], 'SUMMARY') == sm]
            if len(cand) == 1 and sum(1 for j, x in enumerate(ev) if match[j] is None and key(x[2], 'SUMMARY') == sm) == 1:
                match[i] = cand[0]
                free.remove(cand[0])
    used = {o['uid'] for o in match if o}
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Brasilien 26-27//Reiseuebersicht//DE',
             'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', f"X-WR-CALNAME:Brasilien 26/27 ({trip['groups'][group]['name']})",
             'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H']
    for e, o in zip(ev, match):
        if o:
            uid = o['uid']
            seq, stamp, mod = (o['seq'], o['stamp'], o['mod']) if o['body'] == e[2] else (o['seq'] + 1, ICS_NOW, ICS_NOW)
        else:
            uid, n = e[1] + '@brasilien-26-27', 2
            while uid in used:
                uid, n = f"{e[1]}-{n}@brasilien-26-27", n + 1
            seq, stamp, mod = 0, ICS_NOW, ICS_NOW
        used.add(uid)
        lines += ['BEGIN:VEVENT', f'UID:{uid}', f'DTSTAMP:{stamp}', f'LAST-MODIFIED:{mod}', f'SEQUENCE:{seq}', *e[2], 'END:VEVENT']
    lines.append('END:VCALENDAR')
    return '\r\n'.join(fold(l) for l in lines) + '\r\n'


# ---------- Rendering mit Chromium ----------

def browser():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('playwright fehlt, PNG/PDF übersprungen (pip install playwright)')
        return None
    return sync_playwright


def launch(p):
    exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    return p.chromium.launch(executable_path=exe) if os.path.exists(exe) else p.chromium.launch()


def render_png(sp, html_path, png_path):
    with sp() as p:
        b = launch(p)
        pg = b.new_page(viewport={'width': 1143, 'height': 900}, device_scale_factor=2)
        pg.goto('file://' + html_path)
        pg.wait_for_timeout(300)
        pg.screenshot(path=png_path, full_page=True)
        b.close()
    print('geschrieben:', os.path.relpath(png_path, ROOT))


def render_pdf(sp, html_path, pdf_path):
    with sp() as p:
        b = launch(p)
        pg = b.new_page(color_scheme='light')
        pg.goto('file://' + html_path + '#print')
        pg.wait_for_timeout(1500)
        pg.pdf(path=pdf_path, format='A4', print_background=True,
               margin={'top': '14mm', 'bottom': '14mm', 'left': '12mm', 'right': '12mm'})
        b.close()
    print('geschrieben:', os.path.relpath(pdf_path, ROOT))


def main():
    trip = json.loads(read('web', 'trip.json'))
    # private Porträts (gitignored, siehe tools/private.py): nie in die öffentliche Seite im Repo, nur in web/private/brasilien-reise.html (zum Veröffentlichen)
    for k in [k for k, v in trip['series'].items() if isinstance(v, dict) and v.get('portrait')]: trip['series'].pop(k)
    priv = os.path.join(ROOT, 'web', 'private', 'series.json')
    private = json.load(open(priv, encoding='utf-8')) if os.path.exists(priv) else {}
    for c in trip.get('phrases', []):
        for ph in c['items']:
            ph['audio'] = 'audio/' + audio_name(ph['pt'], ph['de'])
            if not os.path.exists(os.path.join(ROOT, 'web', ph['audio'])):
                print('WARNUNG: Audio fehlt, bitte python3 tools/gen_audio.py ausführen:', ph['pt'])
    standalone = gen_map.build(standalone=True)
    inline = gen_map.build(standalone=False)
    write(standalone, 'reisebild.svg')

    def script_of(tr, outdir):
        # große Teile (Samba-Show, Serie, Gringo Kart) als eigene Dateien mods/<name>.js, die Seite lädt sie bei Bedarf nach
        src, mods = read('web', 'page_script.html'), {}
        def cut(m):
            mods[m.group(1)] = m.group(2)
            return ''
        src = re.sub(r'/\*@@MOD:(\w+)\*/\n(.*?)/\*@@END\*/\n', cut, src, flags=re.S)
        js = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')
        ser = tr.get('series', {})
        # in der Seite bleibt nur ein Steckbrief je Folge/Porträt (Kino-Hinweis, Porträt-Knöpfe), der Rest kommt mit mods/serie.js
        stub = {k: {f: v[f] for f in ('n', 'admin', 'portrait', 'title') if f in v} for k, v in ser.items() if isinstance(v, dict) and re.match(r'^(ep\d+|p\w+)$', k)}
        small = dict(tr, series=stub) if 'serie' in mods else tr
        vers = {}
        for name, code in mods.items():
            if name == 'serie': code = 'Object.assign(TRIP.series, ' + js(ser) + ');\n' + code
            vers[name] = hashlib.sha1(code.encode()).hexdigest()[:10]
            write(code, *outdir, 'mods', name + '.js')
        return src.replace('%%TRIP%%', js(small)).replace('%%MODV%%', json.dumps(vers))
    script = script_of(trip, ['web'])
    scenes = gen_scenes.render_all()
    PHOTO_POS = {'rio': ('30% 38%', '30% 24%'), 'iguacu': ('50% 38%', '50% 30%'), 'manaus': ('46% 70%', '46% 76%'), 'juma': ('58% 45%', '58% 48%'), 'paraty': ('50% 60%', '50% 62%'), 'ilha': ('50% 45%', '50% 50%')}  # Bildausschnitt je Foto: Station/Heute, breiter Trenner
    counter = [0]

    def scene(m):
        counter[0] += 1
        sv, n = scenes[m.group(1)], counter[0]
        ids = re.findall(r'id="([^"]+)"', sv)
        for i in ids:
            sv = sv.replace(f'id="{i}"', f'id="{i}-{n}"').replace(f'url(#{i})', f'url(#{i}-{n})')
        # eigenes Foto web/fotos/<szene>.jpg liegt über der Zeichnung (Kopfbild: copacabana.jpg in page_body.html)
        if m.group(1) != 'hero' and os.path.exists(os.path.join(ROOT, 'web', 'fotos', m.group(1) + '.jpg')):
            pos, wide = PHOTO_POS.get(m.group(1), ('50% 50%', '50% 50%'))
            sv += f'<img class="scene-photo" src="fotos/{m.group(1)}.jpg" alt="" loading="lazy" decoding="async" style="--pos:{pos};--pos-wide:{wide}" onerror="this.remove()">'
        return sv
    # „Stand“-Datum = Tag des Neubaus (Berliner Zeit), in Webseite und README
    import datetime, zoneinfo
    stand = datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Berlin')).strftime('%d.%m.%Y')
    readme = read('README.md'); new = re.sub(r'· Stand: \d\d\.\d\d\.\d{4}', '· Stand: ' + stand, readme, count=1)
    if new != readme: write(new, 'README.md')
    body = re.sub(r'%%SCENE:(\w+)%%', scene, read('web', 'page_body.html'))
    body = body.replace('%%STAND%%', stand)
    page = read('web', 'page_head.html') + body.replace('%%MAP%%', inline) + '\n' + script
    write(page, 'web', 'brasilien-reise.html')
    if private:   # vollständige Fassung mit den privaten Porträts: diese Datei veröffentlichen
        full = json.loads(json.dumps(trip)); full['series'].update(private)
        write(read('web', 'page_head.html') + body.replace('%%MAP%%', inline) + '\n' + script_of(full, ['web', 'private']), 'web', 'private', 'brasilien-reise.html')

    for g, fn in (('a', 'gringos-plus-1-cevapi.ics'), ('b', 'daijo-greisel.ics')):
        ics = build_ics(trip, g, ics_old(os.path.join(ROOT, 'kalender', fn)))
        if not os.path.exists(os.path.join(ROOT, 'kalender', fn)) or ics != read('kalender', fn):
            write(ics, 'kalender', fn)

    sp = browser()
    if sp:
        poster = os.path.join(ROOT, 'web', '_poster.html')
        write(read('web', 'poster_template.html').replace('%%MAP%%', standalone), 'web', '_poster.html')
        render_png(sp, poster, os.path.join(ROOT, 'reisebild.png'))
        os.remove(poster)
        render_pdf(sp, os.path.join(ROOT, 'web', 'brasilien-reise.html'), os.path.join(ROOT, 'brasilien-reise.pdf'))


if __name__ == '__main__':
    main()
