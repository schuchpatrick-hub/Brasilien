"""Erzeugt die Routenkarte (SVG) fuer die Brasilienreise aus Natural-Earth-Daten."""
import json, math, os, urllib.request

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'

def load(name):
    """Laedt Natural-Earth-Laendergrenzen (wird beim ersten Lauf heruntergeladen, nicht im Repo)."""
    os.makedirs(DATA, exist_ok=True)
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        urllib.request.urlretrieve(NE + name, path)
    with open(path) as f:
        return json.load(f)

# ---- Projektion Hauptkarte ----
LON0, LON1, LAT0, LAT1 = -76.0, -25.0, 7.0, -37.0
K = 23.2
COS = math.cos(math.radians(15))
W = round((LON1 - LON0) * K * COS)
H = round((LAT0 - LAT1) * K)

def P(lon, lat):
    return ((lon - LON0) * K * COS, (LAT0 - lat) * K)

# ---- Projektion Ausschnitt Suedost-Kueste ----
ILON0, ILON1, ILAT0, ILAT1 = -47.0, -42.85, -22.45, -24.2
ICOS = math.cos(math.radians(23.2))
IX, IY, IW = 636, 786, 494
IK = IW / ((ILON1 - ILON0) * ICOS)
IH = round((ILAT0 - ILAT1) * IK)

def PI(lon, lat):
    return (IX + (lon - ILON0) * IK * ICOS, IY + (ILAT0 - lat) * IK)

def rings(feat):
    g = feat['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        for ring in poly:
            yield ring

def bbox_hit(ring, lo0, lo1, la0, la1, pad=2):
    xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
    return not (max(xs) < lo0 - pad or min(xs) > lo1 + pad or max(ys) < la1 - pad or min(ys) > la0 + pad)

def path(ring, proj, minstep):
    out, last = [], None
    for lon, lat in ring:
        x, y = proj(lon, lat)
        if last and abs(x - last[0]) + abs(y - last[1]) < minstep:
            continue
        out.append(f'{x:.1f},{y:.1f}')
        last = (x, y)
    return 'M' + 'L'.join(out) + 'Z' if len(out) > 2 else ''

def country_paths(data, proj, box, minstep):
    br, other = [], []
    for f in data['features']:
        for ring in rings(f):
            if not bbox_hit(ring, *box):
                continue
            d = path(ring, proj, minstep)
            if d:
                (br if f['properties']['ADM0_A3'] == 'BRA' else other).append(d)
    return ''.join(other), ''.join(br)

def arc(a, b, bend=0.18):
    (x1, y1), (x2, y2) = a, b
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    cx, cy = mx - dy * bend, my + dx * bend
    return f'M{x1:.1f},{y1:.1f} Q{cx:.1f},{cy:.1f} {x2:.1f},{y2:.1f}'

# Buchungsstatus der Fluege aus trip.json (offen = orange)
TRIP = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'trip.json'), encoding='utf-8'))
def fcls(date, frm, extra=''):
    f = next((f for f in TRIP['flights'] if f['date'] == date and f['from'] == frm), None)
    c = 'fl' + (' ' + extra if extra else '')
    if f and f.get('status') == 'open':
        return c + ' open', 'arrO'
    return c, ('arrB' if 'flB' in extra else 'arr')

# Orte
GRU = (-46.47, -23.43); CGH = (-46.66, -23.63); GUA = (-46.25, -23.99)
RIO = (-43.20, -22.93); GIG = (-43.25, -22.81); SDU = (-43.16, -22.91)
IGU = (-54.58, -25.52); MAO = (-60.02, -3.12); JUMA = (-59.95, -3.72)
PAR = (-44.71, -23.22); ILG = (-44.17, -23.14); ANG = (-44.32, -23.01)

def build(standalone=False):
    d50 = load('ne_50m_admin_0_countries.geojson')
    d10 = load('ne_10m_admin_0_countries.geojson')
    o_main, b_main = country_paths(d50, P, (LON0, LON1, LAT0, LAT1), 1.2)
    o_in, b_in = country_paths(d10, PI, (ILON0, ILON1, ILAT0, ILAT1), 0.8)

    s = []
    s.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="tripmap" role="img" '
             f'data-proj="{LON0},{LAT0},{K},{COS},{ILON0},{ILON1},{ILAT0},{ILAT1},{IX},{IY},{IK},{ICOS},{IW},{IH}" '
             f'aria-label="Karte der Reiseroute durch Brasilien: Guarujá, Rio de Janeiro, Foz do Iguaçu, Manaus, Paraty, Ilha Grande">')
    if standalone:
        s.append('''<style>
.sea{fill:#dfeef0}.land{fill:#eef0ea;stroke:#c9cfc4;stroke-width:.8}.br{fill:#f7f3dc;stroke:#1d6b55;stroke-width:1.4}
.fl{fill:none;stroke:#0d4f7a;stroke-width:2.6;stroke-dasharray:7 6;stroke-linecap:round}
.fl2{stroke-width:2;opacity:.6}
.fl.open{stroke:#d9822b}.flB{stroke:#8a4fbf}.ahO{fill:#d9822b}.ahB{fill:#8a4fbf}
.hit{fill:transparent}
.ht{paint-order:stroke;stroke:#e1eef0;stroke-width:5px;stroke-linejoin:round}
.gr{fill:none;stroke:#1d6b55;stroke-width:3.2;stroke-linecap:round}
.bt{fill:none;stroke:#1d8aa8;stroke-width:3;stroke-dasharray:2 5;stroke-linecap:round}
.dot{fill:#1d6b55;stroke:#fff;stroke-width:2.5}.dot2{fill:#fff;stroke:#0d4f7a;stroke-width:2}
.num{fill:#fff;font:700 15px 'DejaVu Sans',sans-serif;text-anchor:middle;dominant-baseline:central}
.lbl{fill:#10231d;font:700 19px 'DejaVu Sans',sans-serif}.sub{fill:#4b5d56;font:500 14px 'DejaVu Sans',sans-serif}
.tag{fill:#0d4f7a;font:600 13px 'DejaVu Sans Mono',monospace}.ctry{fill:#8a968f;font:600 13px 'DejaVu Sans',sans-serif;letter-spacing:3px}
.frame{fill:none;stroke:#10231d;stroke-width:1.5}.framebg{fill:#dfeef0;stroke:#10231d;stroke-width:1.5}
.lead{fill:none;stroke:#10231d;stroke-width:1;stroke-dasharray:3 3}
.head{fill:#10231d;font:700 34px 'DejaVu Sans',sans-serif}.headsub{fill:#4b5d56;font:500 17px 'DejaVu Sans',sans-serif}
.legtxt{fill:#10231d;font:500 14px 'DejaVu Sans',sans-serif}.legbg{fill:#ffffff;fill-opacity:.85;stroke:#c9cfc4}
.arrowhead{fill:#0d4f7a}.halo{display:none}
</style>''')
    s.append('<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto-start-reverse">'
             '<path d="M0,0L10,5L0,10z" class="arrowhead"/></marker>'
             '<marker id="arrO" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="ahO"/></marker>'
             '<marker id="arrB" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="ahB"/></marker>'
             f'<clipPath id="clipMain"><rect width="{W}" height="{H}"/></clipPath>'
             f'<clipPath id="clipIn"><rect x="{IX}" y="{IY}" width="{IW}" height="{IH}"/></clipPath></defs>')
    s.append(f'<rect class="sea" width="{W}" height="{H}"/>')
    s.append(f'<g clip-path="url(#clipMain)"><path class="land" d="{o_main}"/><path class="br" d="{b_main}"/></g>')

    # Laenderbeschriftung
    for name, lon, lat in [('BRASILIEN', -49.5, -7.5), ('ARGENTINIEN', -60.0, -31.0), ('PARAGUAY', -58.8, -22.6),
                           ('BOLIVIEN', -65.5, -16.8), ('PERU', -74.2, -9.0), ('KOLUMBIEN', -74.0, 3.0),
                           ('VENEZUELA', -66.5, 6.0), ('ATLANTIK', -32.5, -12.0)]:
        x, y = P(lon, lat)
        s.append(f'<text class="ctry" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">{name}</text>')

    # Markierung Suedost-Ausschnitt in der Hauptkarte
    a0 = P(ILON0, ILAT0); a1 = P(ILON1, ILAT1)
    s.append(f'<rect class="frame" x="{a0[0]:.1f}" y="{a0[1]:.1f}" width="{a1[0]-a0[0]:.1f}" height="{a1[1]-a0[1]:.1f}"/>')
    s.append(f'<path class="lead" d="M{a1[0]:.1f},{a0[1]:.1f} L{IX+IW},{IY}"/>')
    s.append(f'<path class="lead" d="M{a0[0]:.1f},{a1[1]:.1f} L{IX},{IY+IH}"/>')

    # Hinflug aus Europa
    g = P(*GRU)
    c, mk = fcls('2026-12-27', 'MUC')
    s.append(f'<path class="{c}" data-d="2026-12-27" marker-end="url(#{mk})" d="{arc((W-20, 40), (g[0]+6, g[1]-8), -0.12)}"/>')
    s.append(f'<text class="tag ht" x="{W-24}" y="30" text-anchor="end">27.12. 19:00 MUC → FCO → GRU</text>')
    s.append(f'<text class="sub ht" x="{W-24}" y="50" text-anchor="end">☾ über Rom · ca. 15,5 h · an 28.12. 06:25</text>')
    # Rueckflug nach Europa (Gringos plus 1 Cevapi) und Ankunft Daijo & Greisel
    r0 = P(*GIG)
    c, mk = fcls('2027-01-20', 'GIG')
    s.append(f'<path class="{c}" data-d="2027-01-20" marker-end="url(#{mk})" d="{arc((r0[0]+8, r0[1]-6), (W-20, 300), 0.10)}"/>')
    s.append(f'<text class="tag ht" x="{W-24}" y="282" text-anchor="end">20.01. 15:35 GIG → FCO → MUC</text>')
    s.append(f'<text class="sub ht" x="{W-24}" y="262" text-anchor="end">☾ Heimflug über Rom · ca. 14,5 h · an 21.01. 10:10</text>')
    c, mk = fcls('2027-01-06', 'MUC', 'flB')
    s.append(f'<path class="{c}" data-d="2027-01-06" marker-end="url(#{mk})" d="{arc((W-20, 600), (r0[0]+12, r0[1]-4), -0.06)}"/>')
    s.append(f'<text class="tag ht tagB" x="{W-24}" y="588" text-anchor="end">06.01. MUC → FRA → GIG</text>')
    s.append(f'<text class="sub ht" x="{W-24}" y="570" text-anchor="end">☾ nur Daijo &amp; Greisel · an 06:10</text>')

    # Fluege Hauptkarte
    r = P(*GIG); i = P(*IGU); m = P(*MAO)
    for (d0, f0, a_, b_, bd) in [('2027-01-06', 'GIG', r, i, 0.22), ('2027-01-09', 'IGU', i, m, 0.16), ('2027-01-14', 'MAO', m, r, 0.14)]:
        c, mk = fcls(d0, f0)
        s.append(f'<path class="{c}" data-d="{d0}" marker-end="url(#{mk})" d="{arc(a_, b_, bd)}"/>')
    tx, ty = (r[0]+i[0])/2, (r[1]+i[1])/2
    s.append(f'<text class="tag ht" x="{tx-50:.0f}" y="{ty+62:.0f}" text-anchor="middle">06.01. GIG → IGU</text>')
    s.append(f'<text class="sub ht" x="{tx-50:.0f}" y="{ty+79:.0f}" text-anchor="middle">ca. 2 h · alle sechs</text>')
    tx, ty = (i[0]+m[0])/2, (i[1]+m[1])/2
    s.append(f'<text class="tag" x="{tx-118:.0f}" y="{ty+10:.0f}" text-anchor="middle">09.01. IGU → MAO</text>')
    s.append(f'<text class="sub" x="{tx-118:.0f}" y="{ty+28:.0f}" text-anchor="middle">mit Umstieg · ca. 6–8 h</text>')
    tx, ty = (m[0]+r[0])/2, (m[1]+r[1])/2
    s.append(f'<text class="tag" x="{tx+70:.0f}" y="{ty-40:.0f}" text-anchor="middle">14.01. 01:45 MAO → GIG</text>')
    s.append(f'<text class="sub" x="{tx+70:.0f}" y="{ty-22:.0f}" text-anchor="middle">☾ Nachtflug · ca. 4 h</text>')

    def stop(pt, n, name, sub, dx=16, dy=0, anchor='start', proj=P, r_=15, frm='', to='', sid='', extra=''):
        x, y = proj(*pt)
        s.append(f'<g class="stopg" data-from="{frm}" data-to="{to}" data-stop="{sid}" role="button" tabindex="0" aria-label="{name}: Infos">')
        s.append(f'<circle class="hit" cx="{x:.1f}" cy="{y:.1f}" r="{r_+16}"/>')
        s.append(f'<circle class="halo" cx="{x:.1f}" cy="{y:.1f}" r="{r_+9}"/>')
        s.append(f'<circle class="dot" cx="{x:.1f}" cy="{y:.1f}" r="{r_}"/>')
        s.append(f'<text class="num" x="{x:.1f}" y="{y:.1f}">{n}</text>')
        lx = x + dx if anchor == 'start' else x - dx
        s.append(f'<text class="lbl" x="{lx:.1f}" y="{y+dy-2:.1f}" text-anchor="{anchor}">{name}</text>')
        s.append(f'<text class="sub" x="{lx:.1f}" y="{y+dy+16:.1f}" text-anchor="{anchor}">{sub}</text>')
        if extra:
            s.append(f'<text class="tag" x="{lx:.1f}" y="{y+dy+34:.1f}" text-anchor="{anchor}">{extra}</text>')
        s.append('</g>')

    stop(IGU, 3, 'Foz do Iguaçu', '06.–09.01. · 3 Nächte · Wasserfälle', dx=20, dy=4, anchor='end', frm='2027-01-06', to='2027-01-08', sid='iguacu', extra='Argentinien-Seite: Pass mit!')
    stop(MAO, 4, 'Manaus &amp; Amazonas', '09.–14.01. · 4 Nächte · Dschungel-Lodge', dx=20, frm='2027-01-09', to='2027-01-13', sid='manaus', extra='Uhrzeit: Rio −1 h')
    # ---- Ausschnitt ----
    s.append(f'<rect class="framebg" x="{IX}" y="{IY}" width="{IW}" height="{IH}"/>')
    s.append(f'<g clip-path="url(#clipIn)"><path class="land" d="{o_in}"/><path class="br" d="{b_in}"/>')
    gi, ci, gu = PI(*GRU), PI(*CGH), PI(*GUA)
    pa, il, an, ri = PI(*PAR), PI(*ILG), PI(*ANG), PI(*RIO)
    gg = (ri[0] - 8, ri[1] - 24); sd = (ri[0] + 18, ri[1] + 17)   # GIG/SDU liegen fast auf dem Rio-Punkt, leicht versetzt
    s.append(f'<path class="gr" data-d="2026-12-28" marker-end="url(#arr)" d="M{gi[0]:.1f},{gi[1]:.1f} Q{gi[0]+30:.1f},{gi[1]+40:.1f} {gu[0]-4:.1f},{gu[1]-14:.1f}"/>')
    c, mk = fcls('2026-12-31', 'CGH')
    s.append(f'<path class="{c}" data-d="2026-12-31" marker-end="url(#{mk})" d="{arc(ci, (sd[0]-6, sd[1]+2), -0.14)}"/>')
    s.append(f'<path class="gr" data-d="2027-01-14" marker-end="url(#arr)" d="M{gg[0]:.1f},{gg[1]:.1f} Q{an[0]+60:.1f},{an[1]+10:.1f} {pa[0]+13:.1f},{pa[1]-10:.1f}"/>')
    s.append(f'<path class="bt" data-d="2027-01-16" marker-end="url(#arr)" d="M{pa[0]+12:.1f},{pa[1]+6:.1f} Q{(pa[0]+il[0])/2:.1f},{pa[1]+30:.1f} {il[0]-12:.1f},{il[1]+6:.1f}"/>')
    s.append(f'<path class="bt" data-d="2027-01-20" d="M{il[0]+4:.1f},{il[1]-12:.1f} Q{il[0]-4:.1f},{an[1]+6:.1f} {an[0]+6:.1f},{an[1]+2:.1f}"/>')
    s.append(f'<path class="gr" data-d="2027-01-20" marker-end="url(#arr)" d="M{an[0]+6:.1f},{an[1]-2:.1f} Q{(an[0]+gg[0])/2:.1f},{an[1]+4:.1f} {gg[0]-6:.1f},{gg[1]+5:.1f}"/>')
    s.append('</g>')
    s.append(f'<g class="apg" data-ap="GRU" role="button" tabindex="0" aria-label="Flughafen GRU"><circle class="hit" cx="{gi[0]:.1f}" cy="{gi[1]:.1f}" r="14"/><circle class="dot2" cx="{gi[0]:.1f}" cy="{gi[1]:.1f}" r="5"/><text class="tag" x="{gi[0]-8:.1f}" y="{gi[1]-8:.1f}" text-anchor="end">GRU</text></g>')
    s.append(f'<g class="apg" data-ap="CGH" role="button" tabindex="0" aria-label="Flughafen CGH"><circle class="hit" cx="{ci[0]:.1f}" cy="{ci[1]:.1f}" r="14"/><circle class="dot2" cx="{ci[0]:.1f}" cy="{ci[1]:.1f}" r="5"/><text class="tag" x="{ci[0]-8:.1f}" y="{ci[1]+18:.1f}" text-anchor="end">CGH</text></g>')

    s.append(f'<text class="tag" x="{(ci[0]+sd[0])/2-100:.0f}" y="{IY+24}" text-anchor="middle">31.12. CGH → SDU · ca. 1 h</text>')

    stop(GUA, 1, 'Guarujá', '28.–31.12.', dx=20, dy=6, proj=PI, r_=13, frm='2026-12-28', to='2026-12-30', sid='guaruja')
    stop(RIO, 2, 'Rio de Janeiro', '31.12.–06.01.', dx=40, dy=-40, anchor='end', proj=PI, r_=13, frm='2026-12-31', to='2027-01-05', sid='rio')
    stop(PAR, 5, 'Paraty', '14.–16.01.', dx=18, dy=4, anchor='end', proj=PI, r_=13, frm='2027-01-14', to='2027-01-15', sid='paraty')
    stop(ILG, 6, 'Ilha Grande', '16.–20./21.01.', dx=-8, dy=40, proj=PI, r_=13, frm='2027-01-16', to='2027-01-21', sid='ilha')

    for code, (ax, ay), (tx_, ty_, an_) in (('GIG', gg, (8, 4, 'start')), ('SDU', sd, (0, 17, 'middle'))):
        s.append(f'<g class="apg" data-ap="{code}" role="button" tabindex="0" aria-label="Flughafen {code}"><circle class="hit" cx="{ax:.1f}" cy="{ay:.1f}" r="12"/><circle class="dot2" cx="{ax:.1f}" cy="{ay:.1f}" r="4.5"/><text class="tag ht" x="{ax+tx_:.1f}" y="{ay+ty_:.1f}" text-anchor="{an_}">{code}</text></g>')
    rows = ['GRU → Guarujá · Uber 1,5–2 h', 'GIG → Paraty · Uber ca. 4 h', 'Paraty → Ilha Grande · Uber + Boot', 'Ilha Grande → GIG · Boot + Uber ca. 3 h']
    for k, w in enumerate(rows):
        s.append(f'<text class="sub" x="{IX+IW-10}" y="{IY+IH-54+k*14.5}" text-anchor="end">{w}</text>')
    s.append(f'<text class="tag" x="{IX+IW-10}" y="{IY+IH-70}" text-anchor="end">FAHRZEITEN</text>')

    s.append('<g id="map-pins"></g>')
    # Legende
    lx, ly = 24, H - 214
    s.append(f'<rect class="legbg" x="{lx}" y="{ly}" width="250" height="196" rx="6"/>')
    rows = [('fl', 'arr', 'Flug, gebucht'), ('fl open', 'arrO', 'Flug, noch nicht gebucht'), ('fl flB', 'arrB', 'nur Daijo &amp; Greisel'),
            ('gr', '', 'Straße (Uber / Transfer)'), ('bt', '', 'Boot / Fähre')]
    for k, (c, _, t) in enumerate(rows):
        yy = ly + 24 + k * 30
        s.append(f'<path class="{c}" d="M{lx+16},{yy} h46"/><text class="legtxt" x="{lx+74}" y="{yy+5}">{t}</text>')
    s.append(f'<text class="legtxt" x="{lx+30}" y="{ly+24+5*30+5}" text-anchor="middle">☾</text><text class="legtxt" x="{lx+74}" y="{ly+24+5*30+5}">Nachtflug</text>')
    s.append('</svg>')
    return '\n'.join(s)
