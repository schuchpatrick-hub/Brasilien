"""Baut alle Ausgaben der Reiseübersicht neu.

    python3 tools/build.py

Erzeugt:
  reisebild.svg              Karte (eigenständiges SVG)
  web/brasilien-reise.html   Webseite (Artifact) = page_head + page_body + Karte
  reisebild.png              Reisebild = poster_template + Karte (braucht: pip install playwright + Chromium)
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import gen_map


def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()


def write(text, *p):
    with open(os.path.join(ROOT, *p), 'w', encoding='utf-8') as f:
        f.write(text)
    print('geschrieben:', os.path.join(*p))


def render_png(html_path, png_path):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('playwright fehlt, PNG übersprungen (pip install playwright)')
        return
    exe = next((c for c in ('/opt/pw-browsers/chromium-1194/chrome-linux/chrome',) if os.path.exists(c)), None)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        pg = b.new_page(viewport={'width': 1143, 'height': 900}, device_scale_factor=2)
        pg.goto('file://' + html_path)
        pg.wait_for_timeout(300)
        pg.screenshot(path=png_path, full_page=True)
        b.close()
    print('geschrieben:', os.path.relpath(png_path, ROOT))


def main():
    standalone = gen_map.build(standalone=True)
    inline = gen_map.build(standalone=False)
    write(standalone, 'reisebild.svg')
    write(read('web', 'page_head.html') + read('web', 'page_body.html').replace('%%MAP%%', inline),
          'web', 'brasilien-reise.html')
    poster = os.path.join(ROOT, 'web', '_poster.html')
    write(read('web', 'poster_template.html').replace('%%MAP%%', standalone), 'web', '_poster.html')
    render_png(poster, os.path.join(ROOT, 'reisebild.png'))
    os.remove(poster)


if __name__ == '__main__':
    main()
