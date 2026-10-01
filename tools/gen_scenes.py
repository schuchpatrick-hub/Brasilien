"""Gezeichnete Brasilien-Szenen (SVG) für die Webseite.

Alle Bilder sind eigene Vektorgrafiken im flachen Poster-Stil (keine Fotos, keine fremden Rechte).
build.py ersetzt in page_body.html die Platzhalter %%SCENE:<name>%% durch das jeweilige SVG.

- hero:     Copacabana mit Zuckerhut; Himmel und Sonne über CSS-Variablen (--sky1..3, --sun-c, --night)
            je nach Tageszeit in Brasilien (die Seite setzt data-time am Kopfbereich)
- guaruja, rio, iguacu, manaus, paraty, ilha: Bildstreifen pro Station
"""
import math

W, H = 1200, 300


def svg(body, w=W, h=H, cls='scene', label=''):
    return (f'<svg class="{cls}" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice" '
            f'role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">{body}</svg>')


def sky(id_, top, mid, bottom, h=H):
    return (f'<defs><linearGradient id="{id_}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{top}"/><stop offset=".6" stop-color="{mid}"/>'
            f'<stop offset="1" stop-color="{bottom}"/></linearGradient></defs>'
            f'<rect width="{W}" height="{h}" fill="url(#{id_})"/>')


def palm(x, y, s=1.0, color='#0f2a1c', lean=1):
    """Palme: geschwungener Stamm plus Wedel, Fuß bei (x, y)."""
    tx, ty = x + 28 * s * lean, y - 150 * s
    trunk = (f'<path d="M{x-5*s:.1f} {y:.1f} Q{x+10*s*lean:.1f} {y-80*s:.1f} {tx:.1f} {ty:.1f} '
             f'L{tx+6*s:.1f} {ty+2*s:.1f} Q{x+18*s*lean:.1f} {y-78*s:.1f} {x+6*s:.1f} {y:.1f}Z" fill="{color}"/>')
    fronds = ''
    for ang, ln in [(-160, 70), (-130, 80), (-95, 60), (-60, 82), (-25, 72), (10, 55), (170, 55)]:
        a = math.radians(ang)
        ex, ey = tx + math.cos(a) * ln * s, ty + math.sin(a) * ln * s + 26 * s
        cx, cy = tx + math.cos(a) * ln * .55 * s, ty + math.sin(a) * ln * .55 * s - 14 * s
        fronds += (f'<path d="M{tx:.1f} {ty:.1f} Q{cx:.1f} {cy:.1f} {ex:.1f} {ey:.1f} '
                   f'Q{cx:.1f} {cy+10*s:.1f} {tx:.1f} {ty+5*s:.1f}Z" fill="{color}"/>')
    return trunk + fronds


def umbrella(x, y, c1, c2, s=1.0):
    r = 26 * s
    return (f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y-34*s:.1f}" stroke="#5b4a3a" stroke-width="{2*s:.1f}"/>'
            f'<path d="M{x-r:.1f} {y-30*s:.1f} Q{x:.1f} {y-58*s:.1f} {x+r:.1f} {y-30*s:.1f}Z" fill="{c1}"/>'
            f'<path d="M{x-r*.35:.1f} {y-30*s:.1f} Q{x:.1f} {y-58*s:.1f} {x+r*.35:.1f} {y-30*s:.1f}Z" fill="{c2}"/>')


def wave_lines(y0, y1, color, step=18, amp=4, op=.35, w=W):
    out = ''
    y = y0
    while y < y1:
        d = f'M0 {y}'
        for x in range(0, w + 60, 60):
            d += f' Q{x+15} {y-amp} {x+30} {y} T{x+60} {y}'
        out += f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2" opacity="{op}"/>'
        y += step
    return out


def calcadao(y, h, w=W, dark='#1b1b1b', light='#f3efe6'):
    """Wellenmosaik der Copacabana-Promenade."""
    out = f'<rect x="0" y="{y}" width="{w}" height="{h}" fill="{light}"/>'
    band = 14
    yy = y + 4
    while yy < y + h:
        d = f'M0 {yy}'
        for x in range(0, w + 80, 80):
            d += f' Q{x+20} {yy-9} {x+40} {yy} T{x+80} {yy}'
        d += f' L{w} {yy+band/2} '
        for x in range(w, -80, -80):
            d += f' Q{x-20} {yy+band/2-9} {x-40} {yy+band/2} T{x-80} {yy+band/2}'
        d += 'Z'
        out += f'<path d="{d}" fill="{dark}"/>'
        yy += band
    return out


# ---------------------------------------------------------------- Hero: Copacabana mit Zuckerhut
def hero():
    h = 420
    b = ('<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">'
         '<stop offset="0" style="stop-color:var(--sky1)"/><stop offset=".55" style="stop-color:var(--sky2)"/>'
         '<stop offset="1" style="stop-color:var(--sky3)"/></linearGradient>'
         '<linearGradient id="hsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sea1)"/>'
         '<stop offset="1" style="stop-color:var(--sea2)"/></linearGradient></defs>'
         f'<rect width="{W}" height="{h}" fill="url(#hsky)"/>')
    # Sterne (nur nachts sichtbar)
    stars = ''.join(f'<circle cx="{(i*137)%W}" cy="{(i*53)%170+10}" r="{1+(i%3)*.5}" fill="#fff"/>' for i in range(46))
    b += f'<g class="stars">{stars}</g>'
    # Sonne / Mond
    b += '<circle class="sunc" cx="760" cy="150" r="58" style="fill:var(--sun-c)"/>'
    b += '<circle class="moon-cut" cx="782" cy="136" r="52" style="fill:var(--moon-cut)"/>'
    # Berge: Dois Irmãos links, Zuckerhut rechts
    b += ('<path d="M0 250 L0 170 Q60 120 110 160 Q150 90 205 140 Q250 175 300 230 L320 262Z" style="fill:var(--hill2)"/>'
          '<path d="M860 262 Q900 220 950 212 Q985 206 1010 230 Q1030 120 1080 95 Q1120 80 1140 130 Q1160 200 1200 230 L1200 262Z" style="fill:var(--hill1)"/>'
          '<path d="M1012 214 L1082 100" style="stroke:var(--hill1)" stroke-width="1.4"/>')
    # Meer
    b += f'<rect x="0" y="252" width="{W}" height="70" fill="url(#hsea)"/>'
    b += wave_lines(262, 318, '#ffffff', step=14, amp=3, op=.35)
    # Sonnen-Glitzer
    b += '<g class="glint" style="fill:var(--sun-c)" opacity=".55"><rect x="700" y="262" width="120" height="3" rx="1.5"/><rect x="715" y="276" width="90" height="3" rx="1.5"/><rect x="732" y="290" width="56" height="3" rx="1.5"/></g>'
    # Brandung und Strand
    b += f'<path d="M0 318 Q300 306 600 316 T1200 312 L1200 360 L0 360Z" fill="#fffaf0" opacity=".85"/>'
    b += f'<path d="M0 324 Q300 312 600 322 T1200 318 L1200 372 L0 372Z" style="fill:var(--sand)"/>'
    # Schirme
    for x, c1, c2 in [(120, '#ffcf1f', '#00843d'), (240, '#e94f37', '#fff'), (420, '#1f3f8f', '#ffcf1f'),
                      (560, '#00843d', '#fff'), (880, '#ffcf1f', '#e94f37'), (1010, '#1f3f8f', '#fff')]:
        b += umbrella(x, 352, c1, c2, .9)
    # Promenade (Calçadão)
    b += calcadao(372, h - 372)
    # Palmen als Silhouette
    b += f'<g style="color:var(--palm)">{palm(40, 380, 1.15, "currentColor", 1)}{palm(1150, 382, 1.05, "currentColor", -1)}{palm(1080, 386, .8, "currentColor", -1)}</g>'
    return svg(b, W, h, 'scene hero-scene', 'Copacabana mit Zuckerhut')


# ---------------------------------------------------------------- Stationen
def guaruja():
    b = sky('gsky', '#6ec8f0', '#aee3f5', '#fdf0c8')
    b += '<circle cx="980" cy="70" r="40" fill="#ffe27a"/>'
    b += '<path d="M0 170 Q120 120 260 150 Q380 110 520 160 L520 190 L0 190Z" fill="#2f7d4f"/>'
    b += f'<rect x="0" y="170" width="{W}" height="70" fill="#1aa3b8"/>' + wave_lines(180, 236, '#fff', 13, 3, .4)
    b += f'<path d="M0 232 Q400 222 800 232 T1200 228 L1200 300 L0 300Z" fill="#f1d9a4"/>'
    # Footvolley-Netz
    b += '<line x1="560" y1="286" x2="560" y2="222" stroke="#5b4a3a" stroke-width="4"/><line x1="760" y1="286" x2="760" y2="222" stroke="#5b4a3a" stroke-width="4"/>'
    b += '<rect x="560" y="224" width="200" height="22" fill="none" stroke="#fff" stroke-width="2"/>'
    b += ''.join(f'<line x1="{560+i*20}" y1="224" x2="{560+i*20}" y2="246" stroke="#fff" stroke-width="1" opacity=".7"/>' for i in range(1, 10))
    b += '<circle cx="690" cy="196" r="9" fill="#ffcf1f" stroke="#1f3f8f" stroke-width="2"/>'
    for x, c1, c2 in [(150, '#e94f37', '#fff'), (300, '#ffcf1f', '#00843d'), (960, '#1f3f8f', '#ffcf1f'), (1100, '#00843d', '#fff')]:
        b += umbrella(x, 280, c1, c2, 1)
    b += f'<g fill="#1d4d33">{palm(40, 300, .9)}{palm(1170, 300, .85, "#1d4d33", -1)}</g>'
    return svg(b, label='Strand von Guarujá mit Footvolley-Netz')


def rio():
    b = sky('rsky', '#3b8fd6', '#8fcaf0', '#ffe3b3')
    # Corcovado mit Christus
    b += '<path d="M180 300 L420 140 Q470 60 520 70 Q560 80 600 150 L860 300Z" fill="#2c6e49"/>'
    b += '<path d="M505 70 L505 38 M488 50 L522 50" stroke="#f4f1e8" stroke-width="6" stroke-linecap="round"/>'
    b += '<circle cx="505" cy="31" r="5" fill="#f4f1e8"/>'
    # Zuckerhut rechts
    b += '<path d="M860 300 Q900 230 940 220 Q975 212 990 240 Q1010 120 1060 100 Q1110 90 1130 160 Q1150 230 1200 260 L1200 300Z" fill="#23573b"/>'
    # Stadt
    city = ''
    x = 0
    import random
    rnd = random.Random(4)
    while x < W:
        w, hh = rnd.randint(18, 36), rnd.randint(20, 70)
        city += f'<rect x="{x}" y="{300-hh}" width="{w-3}" height="{hh}" fill="{rnd.choice(["#f4efe4", "#e8dcc6", "#f2c9a0", "#cfe0e8"])}"/>'
        x += w
    b += f'<g opacity=".95">{city}</g>'
    b += '<path d="M0 300 L0 280 Q300 270 600 282 T1200 276 L1200 300Z" fill="#1aa3b8"/>'
    return svg(b, label='Rio de Janeiro mit Christusstatue und Zuckerhut')


def iguacu():
    b = sky('isky', '#7fc6ea', '#c8ebf6', '#eaf7f0')
    b += '<path d="M0 90 Q200 60 400 80 Q600 50 800 75 Q1000 55 1200 80 L1200 140 L0 140Z" fill="#2f8a4e"/>'
    # Felskante mit Wasserfällen
    b += '<path d="M0 120 L1200 110 L1200 210 L0 220Z" fill="#6b4f3a"/>'
    for x in range(40, 1200, 70):
        wf = 30 + (x * 7) % 26
        b += f'<rect x="{x}" y="112" width="{wf}" height="110" fill="#f4fbff" opacity=".92"/>'
        b += f'<rect x="{x+6}" y="112" width="4" height="110" fill="#cfe9f5"/>'
    # Gischt und Fluss
    b += '<path d="M0 205 Q150 185 300 205 Q450 180 600 205 Q750 185 900 205 Q1050 182 1200 205 L1200 300 L0 300Z" fill="#e9f6fb"/>'
    b += '<rect x="0" y="240" width="1200" height="60" fill="#5aa6b8"/>' + wave_lines(250, 300, '#fff', 14, 3, .35)
    # Regenbogen
    for i, c in enumerate(['#e94f37', '#f59e2e', '#ffcf1f', '#3dbb62', '#2f7fd6', '#7a4fc0']):
        r = 260 - i * 7
        b += f'<path d="M{600-r} 250 A{r} {r} 0 0 1 {600+r} 250" fill="none" stroke="{c}" stroke-width="7" opacity=".35"/>'
    b += '<path d="M0 300 L0 220 Q40 200 80 230 L120 300Z M1200 300 L1200 215 Q1160 196 1120 226 L1080 300Z" fill="#1f5d36"/>'
    return svg(b, label='Iguaçu-Wasserfälle mit Regenbogen')


def manaus():
    b = sky('msky', '#f6b26b', '#fbd9a0', '#fff1d6')
    b += '<circle cx="900" cy="120" r="46" fill="#ffd166"/>'
    # Dschungel-Silhouette in Schichten
    for y, c, n in [(150, '#3f7d4f', 22), (175, '#2b6340', 28), (195, '#1d4b30', 34)]:
        d = f'M0 {y+40}'
        for i in range(n + 1):
            x = i * W / n
            d += f' Q{x - W/n/2:.0f} {y - 18 - (i*37)%22} {x:.0f} {y + (i*13)%10}'
        d += f' L{W} 300 L0 300Z'
        b += f'<path d="{d}" fill="{c}"/>'
    # Fluss
    b += '<path d="M0 235 Q300 225 600 238 T1200 232 L1200 300 L0 300Z" fill="#8a6a45"/>' + wave_lines(248, 300, '#ffd9a0', 14, 3, .35)
    # Boot mit Person
    b += '<path d="M430 262 Q500 280 590 262 L580 272 Q500 286 440 272Z" fill="#3b2a1e"/>'
    b += '<circle cx="505" cy="245" r="7" fill="#3b2a1e"/><rect x="500" y="251" width="10" height="14" fill="#3b2a1e"/>'
    b += '<line x1="515" y1="255" x2="545" y2="282" stroke="#3b2a1e" stroke-width="3"/>'
    # Rosa Flussdelfin
    b += '<path d="M760 268 Q790 236 830 262 Q812 256 800 262 Q790 252 772 268Z" fill="#f29bb4"/>'
    b += '<path d="M800 262 L806 246 L812 262Z" fill="#f29bb4"/>'
    return svg(b, label='Amazonas mit Boot und rosa Flussdelfin')


def paraty():
    b = sky('psky', '#79c3ec', '#bfe6f6', '#fdf3dc')
    b += '<path d="M0 150 Q200 70 420 120 Q600 60 820 110 Q1000 70 1200 120 L1200 200 L0 200Z" fill="#3f8a55"/>'
    # Kolonialhäuser
    colors = ['#1f3f8f', '#ffcf1f', '#00843d', '#e94f37', '#1f3f8f', '#f59e2e', '#00843d', '#1f3f8f', '#ffcf1f', '#e94f37']
    x = 20
    for i, c in enumerate(colors):
        w, hh = 104 + (i % 3) * 8, 80 + (i % 2) * 18
        y = 240 - hh
        b += f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" fill="#fbf8f1"/>'
        b += f'<path d="M{x-6} {y} L{x+w/2} {y-26} L{x+w+6} {y}Z" fill="#b5553b"/>'
        for k in range(3):
            wx = x + 12 + k * (w - 24) / 3
            b += f'<rect x="{wx:.0f}" y="{y+14}" width="{(w-48)/3:.0f}" height="24" fill="{c}"/>'
        b += f'<rect x="{x+w/2-11:.0f}" y="{y+hh-38}" width="22" height="38" fill="{c}"/>'
        x += w + 10
    # Pflaster
    b += '<rect x="0" y="240" width="1200" height="60" fill="#b9a891"/>'
    b += ''.join(f'<circle cx="{(i*53)%1200}" cy="{250+(i*17)%45}" r="{6+(i%3)*2}" fill="#9d8c76"/>' for i in range(70))
    return svg(b, label='Bunte Kolonialhäuser in Paraty')


def ilha():
    b = sky('lsky', '#4fb6ea', '#a8e0f6', '#e6f8fb')
    b += '<path d="M0 170 Q140 70 300 120 Q420 40 560 110 Q680 150 760 175 L760 210 L0 210Z" fill="#2d7a48"/>'
    b += '<path d="M700 180 Q880 110 1040 150 Q1120 130 1200 160 L1200 215 L700 215Z" fill="#3e9158"/>'
    b += '<rect x="0" y="190" width="1200" height="70" fill="#19b5c9"/>'
    b += '<rect x="0" y="190" width="1200" height="30" fill="#0f8fb3" opacity=".6"/>' + wave_lines(200, 258, '#fff', 13, 3, .4)
    b += '<path d="M0 258 Q300 244 600 256 T1200 250 L1200 300 L0 300Z" fill="#fbf2d8"/>'
    # Boot
    b += '<path d="M820 232 Q880 246 950 232 L940 242 Q880 254 830 242Z" fill="#fbfbf7"/><rect x="872" y="214" width="26" height="16" fill="#1f3f8f"/>'
    b += f'<g fill="#1d4d33">{palm(70, 300, .95)}{palm(1140, 300, 1.0, "#1d4d33", -1)}{palm(1070, 300, .7, "#1d4d33", -1)}</g>'
    return svg(b, label='Traumstrand auf der Ilha Grande')



def spiele():
    """Spieltisch wie im Brettspiel-Foto: Backgammon-Brett, Ludo-Ecke, Figuren, Würfel, Dominosteine, Spielsteine."""
    b = '<rect width="1200" height="300" fill="#c8431f"/>'
    for i in range(14):                                  # Backgammon-Zungen oben und unten
        x = 360 + i * 62; c = '#f0a14a' if i % 2 else '#7c2a12'
        b += f'<path d="M{x} 0 L{x+62} 0 L{x+31} 120Z" fill="{c}" opacity=".85"/>'
        c2 = '#7c2a12' if i % 2 else '#f3dcb4'
        b += f'<path d="M{x} 300 L{x+62} 300 L{x+31} 180Z" fill="{c2}" opacity=".85"/>'
    # Ludo-Brett links oben (gelb mit grünem Rand)
    b += ('<g transform="rotate(-8 180 90)"><rect x="-20" y="-60" width="400" height="260" rx="10" fill="#1f8a3a"/>'
          '<rect x="-8" y="-48" width="376" height="236" rx="8" fill="#f6e27a"/>'
          '<path d="M30 150 Q190 60 350 150" fill="none" stroke="#d6311f" stroke-width="10"/>')
    for i, (cx, cy) in enumerate([(30, 10), (80, 10), (130, 10), (180, 10), (230, 10), (60, 70), (110, 70), (300, 40)]):
        b += f'<circle cx="{cx}" cy="{cy}" r="19" fill="#fffdf3" stroke="#2a2a2a" stroke-width="3"/>'
    b += '<circle cx="300" cy="40" r="19" fill="#2c5fb3"/><text x="300" y="47" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="20" fill="#fff">A</text></g>'
    # Schachbrett-Ecke links unten und Dame-Brett rechts unten
    for r in range(4):
        for c in range(5):
            if (r + c) % 2 == 0:
                b += f'<rect x="{-20 + c * 40}" y="{190 + r * 40}" width="40" height="40" fill="#3f5f9a" opacity=".9" transform="rotate(6 60 260)"/>'
    b += '<rect x="900" y="180" width="320" height="160" fill="#efe6d2" transform="rotate(-10 1060 260)"/>'
    for r in range(4):
        for c in range(8):
            if (r + c) % 2 == 0:
                b += f'<rect x="{900 + c * 40}" y="{180 + r * 40}" width="40" height="40" fill="#5a4636" opacity=".85" transform="rotate(-10 1060 260)"/>'

    def pawn(x, y, col, s=1.0):
        return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="34" rx="20" ry="7" fill="rgba(0,0,0,.25)"/>'
                f'<path d="M-17 32 L-6 -2 L6 -2 L17 32Z" fill="{col}"/><circle cx="0" cy="-12" r="13" fill="{col}"/>'
                f'<circle cx="-4" cy="-16" r="4" fill="#fff" opacity=".45"/></g>')

    def die(x, y, n, rot=0, s=1.0, col='#fffdf3'):
        pts = {1: [(0, 0)], 2: [(-9, -9), (9, 9)], 3: [(-9, -9), (0, 0), (9, 9)], 4: [(-9, -9), (9, -9), (-9, 9), (9, 9)],
               5: [(-9, -9), (9, -9), (0, 0), (-9, 9), (9, 9)], 6: [(-9, -10), (9, -10), (-9, 0), (9, 0), (-9, 10), (9, 10)]}[n]
        dots = ''.join(f'<circle cx="{px}" cy="{py}" r="{6 if n == 1 else 3.6}" fill="{"#d6311f" if n == 1 else "#1b1b1b"}"/>' for px, py in pts)
        return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><rect x="-22" y="-22" width="44" height="44" rx="8" fill="{col}" stroke="#c9c0a8" stroke-width="2"/>{dots}</g>')

    def domino(x, y, a, c, rot=0):
        def half(n, oy):
            P = {1: [(0, 0)], 2: [(-8, -8), (8, 8)], 3: [(-8, -8), (0, 0), (8, 8)], 4: [(-8, -8), (8, -8), (-8, 8), (8, 8)],
                 5: [(-8, -8), (8, -8), (0, 0), (-8, 8), (8, 8)], 6: [(-8, -9), (8, -9), (-8, 0), (8, 0), (-8, 9), (8, 9)]}[n]
            return ''.join(f'<circle cx="{px}" cy="{py + oy}" r="3.2" fill="#fff"/>' for px, py in P)
        return (f'<g transform="translate({x} {y}) rotate({rot})"><rect x="-22" y="-44" width="44" height="88" rx="6" fill="#151515"/>'
                f'<line x1="-16" y1="0" x2="16" y2="0" stroke="#fff" stroke-width="2"/>{half(a, -22)}{half(c, 22)}</g>')

    def disc(x, y, col, ring):
        return (f'<g transform="translate({x} {y})"><ellipse cx="0" cy="6" rx="30" ry="12" fill="rgba(0,0,0,.25)"/>'
                f'<circle r="28" fill="{col}"/><circle r="20" fill="none" stroke="{ring}" stroke-width="3"/></g>')

    def chess(x, y, col, s=1.0):
        return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="40" rx="22" ry="6" fill="rgba(0,0,0,.25)"/>'
                f'<path d="M-20 38 L20 38 L16 28 L9 24 L6 0 L12 -6 L-12 -6 L-6 0 L-9 24 L-16 28Z" fill="{col}"/>'
                f'<circle cx="0" cy="-16" r="12" fill="{col}"/></g>')

    b += domino(640, 70, 6, 5, -20) + domino(700, 120, 4, 6, 70) + domino(1080, 60, 5, 6, 25) + domino(1140, 140, 3, 6, -15)
    b += disc(560, 230, '#f7f3ea', '#d8d0bf') + disc(620, 260, '#f7f3ea', '#d8d0bf') + disc(1020, 210, '#1d1d1d', '#3a3a3a') + disc(970, 260, '#f7f3ea', '#d8d0bf')
    b += die(90, 220, 6, -12, 1.2) + die(430, 250, 1, 10, 1.15) + die(760, 230, 3, -18, 1.1) + die(260, 260, 4, 20, 1.0)
    b += pawn(120, 120, '#d6311f') + pawn(240, 70, '#2c5fb3') + pawn(330, 150, '#f2c42c') + pawn(470, 100, '#d6311f', 1.1)
    b += pawn(520, 170, '#f2c42c', 1.15) + pawn(400, 210, '#2f9a49', 1.05) + pawn(860, 120, '#f2c42c', 1.1) + pawn(180, 250, '#f2c42c', .95)
    b += chess(300, 210, '#1b1b1b', 1.1) + chess(820, 220, '#f4ecd8', 1.0) + chess(930, 90, '#1b1b1b', 1.05)
    b += '<rect width="1200" height="300" fill="url(#gmshade)"/><defs><linearGradient id="gmshade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient></defs>'
    return svg(b, label='Spieltisch mit Würfeln, Figuren und Dominosteinen')

SCENES = {'hero': hero, 'guaruja': guaruja, 'rio': rio, 'iguacu': iguacu, 'manaus': manaus, 'juma': manaus, 'paraty': paraty, 'ilha': ilha, 'spiele': spiele}


def render_all():
    return {k: f() for k, f in SCENES.items()}
