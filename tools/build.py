"""Baut alle Ausgaben der Reiseübersicht neu.

    python3 tools/build.py

Erzeugt aus den Quellen in web/ und tools/:
  reisebild.svg              Karte (eigenständiges SVG)
  web/brasilien-reise.html   Webseite (Artifact) = page_head + page_body + Karte + page_script (+ trip.json)
  kalender/*.ics             Kalenderdateien je Gruppe (aus web/trip.json)
  reisebild.png              Reisebild = poster_template + Karte   } brauchen: pip install playwright
  brasilien-reise.pdf        Offline-Version der Webseite         } und Chromium
"""
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


def build_ics(trip, group):
    def mine(g):
        return g in ('all', group)
    ev = []
    for d in trip['days']:
        if not mine(d['g']):
            continue
        for i, it in enumerate(d['items']):
            e = it.get('ics')
            if not e or not mine(e.get('g', 'all')):
                continue
            uid = f"{d['date']}-{i}-{group}@brasilien-26-27"
            if 'start' in e:
                when = [f"DTSTART:{e['start']}", f"DTEND:{e['end']}"]
            else:
                when = [f"DTSTART;VALUE=DATE:{e['date']}", f"DTEND;VALUE=DATE:{next_day(e['date'])}"]
            ev.append([f'UID:{uid}', *when, f"SUMMARY:{ics_escape(e['summary'])}",
                       f"DESCRIPTION:{ics_escape(e.get('desc', '') + ' – Brasilien 26/27')}"])
    for s in trip['stays']:
        if not mine(s['g']):
            continue
        ev.append([f"UID:stay-{s['from']}-{group}@brasilien-26-27", f"DTSTART;VALUE=DATE:{s['from']}",
                   f"DTEND;VALUE=DATE:{s['to']}", f"SUMMARY:{ics_escape('🛏 ' + s['name'])}", 'TRANSP:TRANSPARENT'])
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Brasilien 26-27//Reiseuebersicht//DE',
             'CALSCALE:GREGORIAN', f"X-WR-CALNAME:Brasilien 26/27 ({trip['groups'][group]['name']})"]
    for e in ev:
        lines += ['BEGIN:VEVENT', 'DTSTAMP:20260930T120000Z', *e, 'END:VEVENT']
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
    for c in trip.get('phrases', []):
        for ph in c['items']:
            ph['audio'] = 'audio/' + audio_name(ph['pt'], ph['de'])
            if not os.path.exists(os.path.join(ROOT, 'web', ph['audio'])):
                print('WARNUNG: Audio fehlt, bitte python3 tools/gen_audio.py ausführen:', ph['pt'])
    standalone = gen_map.build(standalone=True)
    inline = gen_map.build(standalone=False)
    write(standalone, 'reisebild.svg')

    script = read('web', 'page_script.html').replace('%%TRIP%%', json.dumps(trip, ensure_ascii=False).replace('</', '<\\/'))
    scenes = gen_scenes.render_all()
    PHOTO_POS = {'rio': ('30% 38%', '30% 24%')}  # Bildausschnitt je Foto: Station/Heute, breiter Trenner
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
            sv += f'<img class="scene-photo" src="fotos/{m.group(1)}.jpg" alt="" loading="lazy" style="--pos:{pos};--pos-wide:{wide}" onerror="this.remove()">'
        return sv
    body = re.sub(r'%%SCENE:(\w+)%%', scene, read('web', 'page_body.html'))
    page = read('web', 'page_head.html') + body.replace('%%MAP%%', inline) + '\n' + script
    write(page, 'web', 'brasilien-reise.html')

    write(build_ics(trip, 'a'), 'kalender', 'gringos-plus-1-cevapi.ics')
    write(build_ics(trip, 'b'), 'kalender', 'dajo-greisel.ics')

    sp = browser()
    if sp:
        poster = os.path.join(ROOT, 'web', '_poster.html')
        write(read('web', 'poster_template.html').replace('%%MAP%%', standalone), 'web', '_poster.html')
        render_png(sp, poster, os.path.join(ROOT, 'reisebild.png'))
        os.remove(poster)
        render_pdf(sp, os.path.join(ROOT, 'web', 'brasilien-reise.html'), os.path.join(ROOT, 'brasilien-reise.pdf'))


if __name__ == '__main__':
    main()
