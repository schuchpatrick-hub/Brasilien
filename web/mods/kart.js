/* ---------- Gringo Kart ----------
   Rennspiel von oben, Canvas. Sechs Strecken entlang der Reise (TRACKS: Guarujá, Copacabana, Iguaçu, Amazonas, Paraty, Ilha Grande),
   Einzelrennen oder Grand Prix (alle sechs, Punkte 10/8/6/5/4/3, Siegerehrung). 6 Fahrer mit Crew-Köpfen, 3 Runden.
   Gas automatisch, Daumen links/rechts lenkt, ITEM (oder Item-Fenster) zündet das Item (🍹 Turbo, 🧴 Sonnencreme-Öl, 🦝 Nasenbär).
   Lange in eine Richtung lenken = Drift mit Funken, Loslassen = Mini-Turbo (blau) bzw. Super-Turbo (orange).
   Raketenstart: bei „1“ tippen. Boost-Pfeile, Schanze (in der Luft tippen = Trick). Je Strecke eigene Gefahren (Mover, Hindernisse, Pfützen, Welle, Regen, Nebel, Delfine).
   Ton: Samba-Rennmusik (Web Audio), echte Geräusche aus audio/sfx.mp3, Ansager aus audio/kart.mp3 + audio/kart2.mp3 (TRIP.kartvo, f = Datei).
   Kamera dreht mit (Fahrtrichtung immer nach oben). Bestzeiten pro Strecke im localStorage (br26.kartBest), Grand-Prix-Siege (br26.kartCups). */
(function () {
  if (PRINT) return;
  const openBtn = document.getElementById('kart-open'); if (!openBtn) return;
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.random() * a.length | 0];
  const angd = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  // Live: gemeinsamer Zufall (gleiche Gefahren, Wellen, Böen, Gewitter auf allen Handys); je Ereignis-Art ein eigener Strom
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hashS = s0 => { let h = 2166136261; for (const c of String(s0)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const wr = key => { if (!S || !S.seed) return Math.random(); const g = S.wr || (S.wr = {}); return (g[key] || (g[key] = mulberry(hashS(S.seed + ':' + key))))(); };
  const wrnd = (key, a, b) => a + wr(key) * (b - a);
  const LOOK = (TRIP.dance && TRIP.dance.look) || {}, CREW = TRIP.crew, NAME = id => (CREW.find(c => c.id === id) || {}).name || id;
  let LAPS = 3; const VMAX = 272, PTS = [10, 8, 6, 5, 4, 3];
  const LINES = {jonas: ['Das kommt auf Splitwise!', 'Mein Fischerhut!'], simon: ['Schon wieder ich?!', 'Aua, mein Sonnenbrand!'], patrick: ['Mein Rücken!', 'Ich hab Vorfahrt!'],
    marco: ['Wer war das?!', 'Fernschuss!'], greisel: ['Passt scho.', 'Kitzelt bloß.'], dajo: ['Das war Absicht!', 'Ich will nachfüllen!']};
  const ITEMS = {turbo: {k: 'turbo', e: '🍹', n: 'Caipi-Turbo'}, oil: {k: 'oil', e: '🧴', n: 'Sonnencreme-Öl'}, coati: {k: 'coati', e: '🦝', n: 'Nasenbär'},
    parrot: {k: 'parrot', e: '🦜', n: 'Papagei'}, pimenta: {k: 'pimenta', e: '🌶️', n: 'Pimenta-Turbo'}, flip: {k: 'flip', e: '🩴', n: 'Flip-Flop'}, shield: {k: 'shield', e: '⛱️', n: 'Sonnenschirm'}}, ILIST = Object.values(ITEMS);
  // Item-Wahrscheinlichkeit nach Platz: vorne Verteidigung, hinten Aufholen
  const IW = {front: {oil: .27, shield: .25, flip: .2, turbo: .1, parrot: .1, coati: .08}, mid: {turbo: .2, oil: .14, coati: .18, flip: .2, shield: .1, parrot: .12, pimenta: .06}, back: {turbo: .24, coati: .18, pimenta: .2, parrot: .16, flip: .12, shield: .1}};
  // Spezial-Item je Person (Stufe 3)
  const SPECIAL = {jonas: {k: 'bill', e: '🧾', n: 'Splitwise-Rechnung', x: 'bremst alle vor dir'}, simon: {k: 'burn', e: '☀️', n: 'Sonnenbrand-Blitz', x: 'blendet alle in der Nähe'},
    patrick: {k: 'wheel', e: '♿', n: 'Rollstuhl-Boost', x: 'langer Turbo, unverwundbar'}, marco: {k: 'ball', e: '⚽', n: 'Fernschuss', x: 'trifft den Nächsten vor dir, egal wie weit'},
    greisel: {k: 'beer', e: '🍺', n: 'Bierdusche', x: 'riesige Schaumpfütze hinter dir'}, dajo: {k: 'snack', e: '🥟', n: 'Snack-Runde', x: 'alle hinter dir halten zum Essen an'}};
  // Fahrer-Werte aus den FIFA-Karten: Tempo = Trinktempo, Lenkung = Orientierung, Start = Pünktlichkeit, Nehmerqualität = Kater-Resistenz (0–1 innerhalb der Crew)
  const CS = {}; (function () { const st = (id, k) => ((CREW.find(c => c.id === id).card || {}).stats || {})[k] || 60, ids = CREW.map(c => c.id);
    const n = (id, k) => { const a = ids.map(i => st(i, k)), mn = Math.min(...a), mx = Math.max(...a); return mx > mn ? (st(id, k) - mn) / (mx - mn) : .5; };
    ids.forEach(id => { CS[id] = {spd: n(id, 'TTP'), hdl: n(id, 'ORI'), acc: n(id, 'PÜN'), tgh: n(id, 'KAT')}; }); })();
  const pegel = id => Math.min(1, (((MEHUB.drinks || {})[id] || {}).today || 0) / 8);   // Drinks heute → Lenkung wackelt
  // Fahrzeuge zum Freischalten (Statistik im localStorage br26.kartStats)
  const VEHS = [{id: 'kart', n: 'Gringo-Kart', e: '🏎️'}, {id: 'uber', n: 'Uber', e: '🚕', need: ['races', 3], t: '3 Rennen fahren'},
    {id: 'uno', n: 'Fiat Uno', e: '🚗', need: ['wins', 1], t: '1 Rennen gewinnen'}, {id: 'cart', n: 'Gepäckkarren', e: '🧳', need: ['ilha', 1], t: 'Ilha Grande ins Ziel bringen'},
    {id: 'wheel', n: 'Rollstuhl', e: '♿', need: ['supers', 5], t: '5 Super-Turbos'}, {id: 'gold', n: 'Goldenes Kart', e: '🏆', need: ['cups', 1], t: 'Grand Prix gewinnen'}];
  // Fahrgefühl je Fahrzeug: g = Haftung, d = Rutschen im Drift, m = Masse (Rempler), b = Turbo-Dauer, x = Beschreibung im Menü
  const VTX = {kart: {g: 1, d: 1, m: 1, b: 1, x: 'Ausgewogen, für alles gut.'}, uber: {g: 1.08, d: .8, m: 1.45, b: 1, x: 'Schwer und stabil: rempelt andere weg, driftet ungern.'},
    uno: {g: .95, d: 1.15, m: 1.1, b: 1, x: 'Zieht stark an, das Heck kommt schnell.'}, cart: {g: .85, d: 1.35, m: .9, b: 1, x: 'Rutschig wie auf Seife, aber wendig.'},
    wheel: {g: 1.1, d: .8, m: .65, b: 1.35, x: 'Leicht und wendig, Turbos halten deutlich länger, fliegt bei Remplern weg.'}, gold: {g: 1.04, d: 1, m: 1.1, b: 1.1, x: 'Von allem ein bisschen mehr.'},
    boat: {g: 1, d: 1, m: 1, b: 1, x: ''}};
  // KI-Persönlichkeiten: line = Linientreue, care = Abstand zu Hindernissen, brake = Bremsen vor Kurven, mis = Fehler-Häufigkeit + Art, item = wann Items benutzt werden
  const PERS = {jonas: {line: 1.1, care: 1.3, brake: 1.35, mis: [.5, 'brake'], item: .5, x: 'fährt vorsichtig und sauber, bremst aber vor jeder Kurve zu früh'},
    simon: {line: .8, care: .6, brake: .6, mis: [1.1, 'wide'], item: 1, ram: 1, x: 'riskant: drängelt, nimmt jede Abkürzung, fliegt dafür gern aus der Kurve'},
    patrick: {line: 1, care: 1, brake: 1, mis: [.6, 'wobble'], item: 1.4, late: 1, noRocket: 1, x: 'verschläft den Start, wird aber in der letzten Runde gefährlich'},
    marco: {line: 1, care: .9, brake: .9, mis: [.6, 'lapse'], item: 2.2, straight: 1, x: 'schnell auf Geraden, hebt Items für den perfekten Fernschuss auf'},
    greisel: {line: .9, care: 1, brake: 1, mis: [.7, 'lapse'], item: 1, burst: 1, x: 'unberechenbar: plötzlich irre schnell, dann wieder kurz vom Gas'},
    dajo: {line: 1.25, care: 1.5, brake: 1.15, mis: [.4, 'brake'], item: .8, x: 'fährt die sauberste Linie und weicht allem aus, ist aber nicht die Schnellste'}};
  const PERS0 = {line: 1, care: 1, brake: 1, mis: [.6, 'wide'], item: 1, x: ''};
  const VTUNE = {kart: [1, 1, 1], uber: [1.02, .96, 1], uno: [.99, 1.03, 1.12], cart: [.98, 1.08, 1], wheel: [.97, 1.1, 1.2], gold: [1.02, 1.02, 1.05]};   // Tempo, Lenkung, Beschleunigung

  /* ---- Strecken ----
     cp = Kontrollpunkte (geschlossen), tw = Breite, ww/wh = Weltgröße, sea = Uferlinie (y) oder null, off = Tempo neben der Strecke,
     grip = Haftung (klein = rutschig), veh = kart/boat/cart, pads/ramp/boxes = Anteil der Runde, obst = feste Hindernisse, movers = Querläufer,
     puddles = Wasserflächen (bremsen), extras: wave, rain, mist, dolphins, flood. */
  const TRACKS = [
    {id: 'gru', name: 'Flughafen GRU', sub: 'Rennen auf dem Gepäckband', e: '🛫', tw: 160, ww: 3394, wh: 2297, sea: null, off: .6, grip: 13, veh: 'kart',
      cp: [[700, 1798], [960, 1798], [1220, 1798], [1480, 1798], [1740, 1798], [2000, 1798], [2068, 1804], [2134, 1820], [2197, 1847], [2260, 1875], [2326, 1891], [2394, 1897], [2694, 1897], [2809, 1874], [2906, 1809], [2972, 1711], [2994, 1597], [2994, 1298], [2994, 999], [2994, 700], [2972, 585], [2906, 488], [2809, 423], [2694, 400], [2394, 400], [2094, 400], [1794, 400], [1726, 406], [1660, 422], [1597, 449], [1534, 476], [1468, 493], [1400, 498], [1167, 498], [933, 498], [700, 498], [585, 521], [488, 586], [423, 684], [400, 798], [400, 1032], [400, 1265], [400, 1498], [423, 1613], [488, 1710], [585, 1775]],
      pads: [[.12, 0], [.52, -30], [.83, 30]], ramp: .36, boxes: [.22, .5, .76], music: {bpm: 124, root: .9, style: 'bossa'},
      obst: [[.18, 35, 'suitcase'], [.44, -35, 'suitcase'], [.63, 30, 'suitcase'], [.9, -30, 'suitcase']], movers: [{f: .3, range: 100, speed: 60, kind: 'tug'}, {f: .7, range: 100, speed: 55, kind: 'tug'}],
      belts: [[.04, .1, 1], [.56, .62, -1], [.86, .93, 1]], birds: [], spect: [[.02, 1], [.48, -1]]},
    {id: 'guaruja', name: 'Guarujá', sub: 'Praia da Enseada', e: '🏖️', tw: 178, ww: 2500, wh: 1800, sea: x => 1560 + 30 * Math.sin(x / 210) + 14 * Math.sin(x / 71), off: .6, grip: 14, veh: 'kart',
      cp: [[420, 1270], [1000, 1330], [1700, 1300], [2120, 1110], [2170, 760], [1920, 480], [1300, 420], [700, 450], [360, 660], [270, 960]],
      pads: [[.12, 0], [.55, -40], [.8, 40]], ramp: null, boxes: [.2, .5, .78], music: {bpm: 120, root: 1, style: 'samba'},
      obst: [[.3, -55, 'umbrella'], [.33, 50, 'umbrella'], [.62, -30, 'umbrella'], [.9, 45, 'umbrella'], [.42, 0, 'nut']],
      movers: [{f: .68, range: 105, speed: 34, kind: 'corn'}], birds: [.25, .47, .86], spect: [[.03, 1], [.15, 1], [.5, -1], [.9, 1]]},
    {id: 'sp', name: 'São Paulo', sub: 'Avenida Paulista im Feierabendverkehr', e: '🏙️', tw: 160, ww: 3100, wh: 2000, sea: null, off: .5, grip: 12, veh: 'kart',
      cp: [[700, 1740], [1300, 1780], [1900, 1760], [2450, 1690], [2780, 1430], [2800, 1000], [2560, 700], [2100, 660], [1650, 820], [1200, 720], [820, 460], [450, 600], [340, 1050], [420, 1450]],
      pads: [[.1, 0], [.4, -35], [.82, 30]], ramp: .58, boxes: [.2, .5, .77], music: {bpm: 130, root: .94, style: 'funk'},
      obst: [[.15, 30, 'cone'], [.33, -35, 'cone'], [.71, 20, 'cone'], [.9, -30, 'cone']], movers: [{f: .46, range: 115, speed: 95, kind: 'tram'}, {f: .86, range: 105, speed: 70, kind: 'moto'}],
      gates: [{f: .27, period: 5.5, closed: 1.8, kind: 'toll'}], birds: [.62], spect: [[.03, 1], [.36, -1], [.66, 1]]},
    {id: 'copa', name: 'Copacabana', sub: 'Grand Prix do Rio', e: '🌆', tw: 150, ww: 2400, wh: 1750, sea: x => 1520 + 36 * Math.sin(x / 190) + 18 * Math.sin(x / 67), off: .55, grip: 14, veh: 'kart',
      cp: [[330, 1300], [900, 1360], [1500, 1350], [2000, 1250], [2240, 1010], [2160, 700], [1820, 600], [1520, 760], [1220, 660], [1030, 380], [620, 300], [300, 480], [190, 880]],
      pads: [[.07, -32], [.07, 32], [.39, 0], [.69, -38], [.93, 30]], ramp: .215, boxes: [.17, .47, .76], music: {bpm: 128, root: 1, style: 'bossa'},
      obst: [[.3, 30, 'nut'], [.58, -35, 'nut'], [.66, 40, 'nut'], [.9, -20, 'nut']], movers: [{f: .62, range: 105, speed: 38, kind: 'vendor'}],
      wave: {x0: 620, x1: 1180}, birds: [.27, .55, .82], spect: [[.03, 1], [.12, 1], [.33, -1], [.5, 1], [.6, -1], [.84, -1], [.96, 1]]},
    {id: 'reveillon', name: 'Réveillon', sub: 'Silvesternacht an der Copacabana', e: '🎆', night: 1, fw: 1, white: 1, tw: 150, ww: 2400, wh: 1750, sea: x => 1520 + 36 * Math.sin(x / 190) + 18 * Math.sin(x / 67), off: .55, grip: 14, veh: 'kart',
      cp: [[330, 1300], [900, 1360], [1500, 1350], [2000, 1250], [2240, 1010], [2160, 700], [1820, 600], [1520, 760], [1220, 660], [1030, 380], [620, 300], [300, 480], [190, 880]],
      pads: [[.07, -32], [.07, 32], [.39, 0], [.69, -38], [.93, 30]], ramp: .215, boxes: [.17, .47, .76], music: {bpm: 132, root: 1.06, style: 'bossa'},
      obst: [[.3, 30, 'champ'], [.58, -35, 'champ'], [.9, -20, 'champ']], movers: [{f: .62, range: 105, speed: 38, kind: 'vendor'}],
      wave: {x0: 620, x1: 1180, every: [5, 8]}, birds: [.27, .55, .82], spect: [[.03, 1], [.12, 1], [.33, -1], [.5, 1], [.6, -1], [.84, -1], [.96, 1]]},
    {id: 'cristo', name: 'Cristo Redentor', sub: 'Serpentinen im Nebel', e: '⛰️', laps: 2, tw: 160, ww: 3000, wh: 2300, sea: null, off: .5, grip: 10, veh: 'kart',
      cp: [[650, 2080], [1000, 2080], [1350, 2080], [1700, 2080], [2050, 2080], [2400, 2080], [2550, 2040], [2660, 1930], [2700, 1780], [2660, 1630], [2550, 1520], [2400, 1480], [2062, 1480], [1725, 1480], [1388, 1480], [1050, 1480], [900, 1440], [790, 1330], [750, 1180], [790, 1030], [900, 920], [1050, 880], [1388, 880], [1725, 880], [2062, 880], [2400, 880], [2530, 845], [2625, 750], [2660, 620], [2660, 500], [2625, 370], [2530, 275], [2400, 240], [2050, 240], [1700, 240], [1350, 240], [1000, 240], [650, 240], [510, 278], [408, 380], [370, 520], [370, 947], [370, 1373], [370, 1800], [408, 1940], [510, 2042]],
      pads: [[.08, 0], [.36, 30], [.62, -30], [.88, 0]], ramp: null, boxes: [.15, .45, .74], music: {bpm: 116, root: .84, style: 'epic'},
      obst: [[.22, 35, 'stone'], [.52, -35, 'stone'], [.8, 30, 'stone']], movers: [{f: .4, range: 100, speed: 50, kind: 'monkey'}, {f: .7, range: 100, speed: 45, kind: 'monkey'}],
      gates: [{f: .57, period: 6.5, closed: 2.2, kind: 'train'}], fog: 1, statue: {x: 1500, y: 560}, birds: [.3], spect: [[.02, 1], [.95, -1]]},
    {id: 'bridge', name: 'Ponte Rio–Niterói', sub: '13 Kilometer über der Guanabara-Bucht', e: '🌉', laps: 2, tw: 150, ww: 4057, wh: 2663, sea: null, off: .35, grip: 14, veh: 'kart', cut: false,
      cp: [[760, 2263], [1014, 2263], [1267, 2263], [1521, 2263], [1775, 2263], [2028, 2263], [2282, 2263], [2536, 2263], [2790, 2263], [3043, 2263], [3297, 2263], [3408, 2246], [3509, 2195], [3588, 2115], [3639, 2015], [3657, 1903], [3657, 1603], [3657, 1303], [3657, 1003], [3639, 892], [3588, 792], [3509, 712], [3408, 661], [3297, 643], [3064, 643], [2830, 643], [2597, 643], [2477, 629], [2364, 588], [2263, 522], [2162, 455], [2048, 414], [1928, 400], [1809, 414], [1695, 455], [1594, 522], [1493, 588], [1380, 629], [1260, 643], [1010, 643], [760, 643], [649, 661], [548, 712], [469, 792], [418, 892], [400, 1003], [400, 1303], [400, 1603], [400, 1903], [418, 2015], [469, 2115], [548, 2195], [649, 2246]],
      pads: [[.1, 0], [.35, 30], [.6, -30], [.85, 0]], ramp: null, boxes: [.2, .48, .77], music: {bpm: 134, root: 1.06, style: 'axe'},
      obst: [[.26, 30, 'cone'], [.42, -30, 'cone'], [.7, 25, 'cone']], movers: [{f: .55, range: 95, speed: 70, kind: 'bus'}, {f: .9, range: 100, speed: 80, kind: 'moto'}],
      wind: {every: [6, 10]}, birds: [.3, .65], spect: []},
    {id: 'iguacu', name: 'Iguaçu', sub: 'Garganta do Diabo', e: '🌊', laps: 2, tw: 165, ww: 3000, wh: 2300, sea: null, off: .5, grip: 3.6, veh: 'kart',
      cp: [[700, 2020], [1350, 2080], [2000, 2010], [2580, 1900], [2830, 1450], [2760, 950], [2620, 520], [2200, 300], [1650, 330], [1150, 450], [700, 380], [400, 660], [330, 1150], [430, 1650]],
      pads: [[.1, 0], [.47, -30], [.72, 30]], ramp: .36, boxes: [.18, .52, .8], music: {bpm: 124, root: .89, style: 'forest'},
      obst: [[.6, 0, 'log'], [.85, -40, 'log']], movers: [{f: .66, range: 100, speed: 70, kind: 'coati', n: 3}],
      puddles: [[.05, 30, 38], [.27, -35, 40], [.92, 20, 42]], rain: 1, mist: {x: 1500, y: 1250, r: 460}, falls: {x: 1500, y: 1250},
      birds: [], spect: [[.02, 1], [.4, -1]]},
    {id: 'amazon', name: 'Amazonas', sub: 'Encontro das Águas', e: '🛶', laps: 2, tw: 180, ww: 3000, wh: 2300, sea: null, off: .45, grip: 4.2, veh: 'boat',
      cp: [[700, 2000], [1350, 2080], [2000, 1990], [2550, 1950], [2830, 1560], [2620, 1170], [2080, 1150], [1550, 1260], [1050, 1170], [920, 860], [1100, 600], [1550, 560], [2050, 610], [2520, 600], [2730, 520], [2810, 340], [2730, 160], [2520, 80], [2100, 80], [1600, 110], [1100, 160], [600, 330], [300, 800], [300, 1350], [420, 1800]],
      pads: [[.33, 0], [.64, -30]], ramp: null, boxes: [.15, .45, .75], music: {bpm: 116, root: .84},
      obst: [[.22, 40, 'log'], [.4, -45, 'log'], [.58, 30, 'log'], [.88, -30, 'log']], movers: [{f: .29, range: 80, speed: 26, kind: 'caiman'}, {f: .78, range: 80, speed: 22, kind: 'caiman'}],
      dolphins: [.1, .52, .7, .95], birds: [], spect: []},
    {id: 'manaus', name: 'Hafen Manaus', sub: 'Nachts zwischen Containern', e: '⚓', laps: 2, night: 1, tw: 160, ww: 3590, wh: 2300, sea: x => 2130 + 14 * Math.sin(x / 210), off: .5, grip: 13, veh: 'kart',
      cp: [[700, 1900], [974, 1900], [1248, 1900], [1521, 1900], [1795, 1900], [2069, 1900], [2342, 1900], [2616, 1900], [2890, 1900], [3005, 1877], [3102, 1812], [3167, 1715], [3190, 1600], [3190, 1300], [3190, 1000], [3190, 700], [3167, 585], [3102, 488], [3005, 423], [2890, 400], [2540, 400], [2410, 435], [2315, 530], [2280, 660], [2280, 1010], [2245, 1140], [2150, 1235], [2020, 1270], [1795, 1270], [1570, 1270], [1440, 1235], [1345, 1140], [1310, 1010], [1310, 660], [1275, 530], [1180, 435], [1050, 400], [700, 400], [585, 423], [488, 488], [423, 585], [400, 700], [400, 1000], [400, 1300], [400, 1600], [423, 1715], [488, 1812], [585, 1877]],
      pads: [[.08, 0], [.4, 30], [.72, -30]], ramp: .55, boxes: [.18, .46, .8], music: {bpm: 130, root: .94, style: 'funk'},
      obst: [[.24, 35, 'crate'], [.33, -35, 'crate'], [.62, 30, 'crate'], [.9, -30, 'crate']], movers: [{f: .5, range: 100, speed: 55, kind: 'fork'}, {f: .86, range: 100, speed: 50, kind: 'fork'}],
      birds: [], spect: [[.03, 1], [.6, -1]]},
    {id: 'paraty', name: 'Paraty', sub: 'Centro Histórico bei Flut', e: '⛵', laps: 2, tw: 165, ww: 3150, wh: 2100, sea: x => 1900 + 20 * Math.sin(x / 150), off: .42, grip: 9, veh: 'kart',
      cp: [[700, 1740], [1250, 1700], [1650, 1460], [2150, 1400], [2620, 1430], [2900, 1130], [2780, 700], [2250, 570], [1700, 680], [1200, 520], [750, 380], [380, 560], [280, 1050], [400, 1500]],
      pads: [[.2, 0], [.52, 0], [.86, 0]], ramp: .44, boxes: [.12, .4, .7], music: {bpm: 132, root: 1.12, style: 'forro'},
      obst: [[.6, 35, 'stone'], [.77, -30, 'stone']], movers: [{f: .3, range: 80, speed: 30, kind: 'horse'}],
      puddles: [[.08, 0, 50], [.34, -25, 45], [.63, 20, 48], [.95, -15, 46]], flood: 1, birds: [.15, .68], spect: [[.02, 1], [.45, 1], [.82, -1]]},
    {id: 'ilha', name: 'Ilha Grande', sub: 'Vila do Abraão · nur Gepäckkarren', e: '🏝️', tw: 160, ww: 2500, wh: 1850, sea: x => 1580 + 26 * Math.sin(x / 230) + 12 * Math.sin(x / 61), off: .55, grip: 10, veh: 'cart',
      cp: [[350, 1300], [900, 1420], [1400, 1270], [1800, 1380], [2250, 1220], [2300, 800], [1950, 600], [1500, 760], [1100, 560], [700, 360], [300, 560], [200, 960]],
      pads: [[.1, 30], [.48, 0], [.76, -30]], ramp: .3, boxes: [.18, .55, .85], music: {bpm: 136, root: 1.19, style: 'axe'},
      obst: [[.24, -45, 'suitcase'], [.38, 40, 'suitcase'], [.66, 0, 'suitcase'], [.93, -35, 'suitcase']], movers: [{f: .6, range: 95, speed: 60, kind: 'coati'}, {f: .87, range: 95, speed: 34, kind: 'dog'}],
      birds: [.44], spect: [[.03, 1], [.2, 1], [.5, 1], [.72, -1]]},
    {id: 'lopes', name: 'Lopes Mendes', sub: 'Traumstrand mit Fußballplatz', e: '🏖️', tw: 160, ww: 3632, wh: 2540, sea: x => 2350 + 30 * Math.sin(x / 180) + 14 * Math.sin(x / 61), off: .5, grip: 11, veh: 'kart',
      cp: [[720, 2140], [994, 2140], [1268, 2140], [1542, 2140], [1816, 2140], [2090, 2140], [2364, 2140], [2638, 2140], [2912, 2140], [3035, 2116], [3139, 2046], [3208, 1942], [3232, 1820], [3232, 1539], [3214, 1437], [3162, 1346], [3082, 1279], [2866, 1154], [2649, 1029], [2564, 969], [2490, 895], [2430, 810], [2280, 550], [2213, 470], [2123, 418], [2020, 400], [1760, 400], [1500, 400], [1240, 400], [980, 400], [720, 400], [598, 424], [494, 494], [424, 598], [400, 720], [400, 995], [400, 1270], [400, 1545], [400, 1820], [424, 1942], [494, 2046], [598, 2116]],
      pads: [[.1, 0], [.45, 30], [.8, -30]], ramp: .62, boxes: [.2, .5, .78], music: {bpm: 126, root: 1.12, style: 'samba'},
      obst: [[.28, 30, 'nut'], [.55, -30, 'nut'], [.88, 25, 'umbrella']], movers: [{f: .38, range: 105, speed: 90, kind: 'soccer'}, {f: .72, range: 100, speed: 45, kind: 'dog'}],
      wave: {x0: 900, x1: 1800}, birds: [.2, .6], spect: [[.03, 1], [.33, 1], [.66, -1]]},
  ];
  const TBY = {}; TRACKS.forEach(t => { TBY[t.id] = t; });
  // Pokale (Grand Prix): Reihenfolge wie die Reise
  const CUPS = [{id: 'sp', e: '🛬', n: 'Ankunfts-Pokal', t: ['gru', 'guaruja', 'sp']}, {id: 'rio', e: '🌴', n: 'Rio-Pokal', t: ['copa', 'reveillon', 'cristo', 'bridge']},
    {id: 'wild', e: '🌿', n: 'Wildnis-Pokal', t: ['iguacu', 'amazon', 'manaus']}, {id: 'coast', e: '🏝️', n: 'Küsten-Pokal', t: ['paraty', 'ilha', 'lopes']},
    {id: 'all', e: '🏆', n: 'Grand Prix do Brasil', t: ['gru', 'guaruja', 'sp', 'copa', 'reveillon', 'cristo', 'bridge', 'iguacu', 'amazon', 'manaus', 'paraty', 'ilha', 'lopes']}];
  let CUPSEL = CUPS.find(c => c.id === store.get('kartCup')) || CUPS[0];

  // aktuelle Strecke (wird von loadTrack gesetzt)
  let CURV = [], LINE = [], SCURV = [], CUT = null, T = TRACKS[1], P = [], NX = [], NY = [], N = 0, TW = 150, WW = 2400, WH = 1750, PADS = [], RAMP = -1, SPECT = [], BG = null, MINI = null;
  const shore = x => T.sea ? T.sea(x) : 1e9;
  // Geheimwege: die Abkürzung je Strecke als Schleichweg mit eigenem Belag, Schild und Hindernissen (schneller als außen herum, wenn man ausweicht)
  const SECRET = {gru: ['Gepäckhalle', 'suitcase', '#b9bec6'], guaruja: ['Strandbar', 'umbrella', '#e8cf8f'], sp: ['Markthalle', 'stall', '#8d8778'], copa: ['Hotelfoyer', 'table', '#ddd5c6'],
    reveillon: ['Partyzelt', 'champ', '#5a3f8a'], cristo: ['Trampelpfad', 'stone', '#8a6a44'], iguacu: ['Holzsteg', 'log', '#9b6b3c', 1], manaus: ['Fischmarkt', 'fish', '#7c8a8f'], paraty: ['Hinterhof', 'barrel', '#a89a86'],
    ilha: ['Bootssteg', 'crate', '#9b6b3c', 1], lopes: ['Dünenpfad', 'nut', '#ecd59a']};
  const secretOf = () => SECRET[T.id] || ['Schleichweg', 'crate', '#a07a4a'];
  function onCut(x, y) { if (!CUT) return false; const ax = CUT.a[0], ay = CUT.a[1], bx = CUT.b[0] - ax, by = CUT.b[1] - ay, l2 = bx * bx + by * by, q = clamp(((x - ax) * bx + (y - ay) * by) / l2, 0, 1);
    return Math.hypot(x - ax - bx * q, y - ay - by * q) < CUT.w / 2 + 6 ? q : false; }
  const wrap = i => ((Math.round(i) % N) + N) % N, at = (i, lat) => { i = wrap(i); return [P[i][0] + NX[i] * lat, P[i][1] + NY[i] * lat]; };
  function nearest(x, y, hint) {   // nächster Punkt der Mittellinie (erst lokal, bei großem Abstand global)
    let best = -1, bd = 1e12;
    const scan = (from, to) => { for (let j = from; j <= to; j++) { const i = ((j % N) + N) % N, dx = x - P[i][0], dy = y - P[i][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } } };
    if (hint >= 0) scan(hint - 25, hint + 45);
    if (hint < 0 || bd > 110 * 110) scan(0, N - 1);
    return [best, (x - P[best][0]) * NX[best] + (y - P[best][1]) * NY[best]];
  }
  function buildPath(cp) {
    P = []; NX = []; NY = []; const raw = [], n = cp.length;
    for (let i = 0; i < n; i++) {
      const p0 = cp[(i - 1 + n) % n], p1 = cp[i], p2 = cp[(i + 1) % n], p3 = cp[(i + 2) % n];
      for (let s = 0; s < 40; s++) { const t = s / 40, t2 = t * t, t3 = t2 * t;
        raw.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
    }
    const STEP = 6; let acc = 0; P.push(raw[0]);
    for (let i = 1; i <= raw.length; i++) { const a = raw[i - 1], b = raw[i % raw.length]; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); let pos = 0;
      while (acc + (d - pos) >= STEP) { pos += STEP - acc; acc = 0; const k = pos / d; P.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
      acc += d - pos; }
    P.pop(); N = P.length;
    for (let i = 0; i < N; i++) { const a = P[(i - 1 + N) % N], b = P[(i + 1) % N]; const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; NX.push(-ty / l); NY.push(tx / l); }
  }
  function loadTrack(id, rev) {
    const B = TBY[id] || TRACKS[1], k = B.k || 1.15;   // alle Strecken etwas größer (länger, weitere Kurven)
    T = Object.assign({}, B, {cp: B.cp.map(p => [p[0] * k, p[1] * k]), ww: Math.round(B.ww * k), wh: Math.round(B.wh * k), sea: B.sea ? (x => B.sea(x / k) * k) : null,
      falls: B.falls && {x: B.falls.x * k, y: B.falls.y * k}, statue: B.statue && {x: B.statue.x * k, y: B.statue.y * k}, mist: B.mist && {x: B.mist.x * k, y: B.mist.y * k, r: B.mist.r * k}, wave: B.wave && {x0: B.wave.x0 * k, x1: B.wave.x1 * k}});
    LAPS = T.laps || 3; TW = T.tw; WW = T.ww; WH = T.wh; buildPath(rev ? T.cp.slice().reverse() : T.cp);
    PADS = (T.pads || []).map(([f, l]) => ({i: wrap(f * N), l})); RAMP = T.ramp ? wrap(T.ramp * N) : -1;
    // Krümmung (rad/px, + = Rechtskurve) und Ideallinie (Kurveninnenseite, geglättet) für die KI
    const ang = i => Math.atan2(NX[wrap(i)], -NY[wrap(i)]);
    CURV = P.map((_, i) => angd(ang(i + 8), ang(i - 8)) / 96);
    const cs = CURV.map((_, i) => { let s0 = 0; for (let j = -25; j <= 25; j++) s0 += CURV[wrap(i + j)]; return s0 / 51; });
    SCURV = cs; LINE = cs.map(c => clamp(c * TW * 55, -TW * .3, TW * .3));
    // Abkürzung: kürzeste sichere Verbindung zweier Streckenstellen durchs Innere (holprig, mit Turbo-Pfeil in der Mitte)
    CUT = null; if (T.cut !== false && T.veh !== 'boat') { const cand = [];
      for (let i = Math.round(N * .1); i < N * .9; i += 6) for (let d = Math.round(N * .08); d < N * .4; d += 6) { const j = i + d; if (j > N * .92) continue;
        const dist = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]); if (dist < 200 || dist > d * 6 * .72) continue; cand.push({i, j, dist, save: d * 6 - dist}); }
      cand.sort((p0, p1) => p1.save - p0.save);
      for (const c of cand.slice(0, 400)) { let ok = true; const qm = Math.min(.4, (TW / 2 + 70) / c.dist); for (let q = qm; q <= 1 - qm && ok; q += .04) { const x = P[c.i][0] + (P[c.j][0] - P[c.i][0]) * q, y = P[c.i][1] + (P[c.j][1] - P[c.i][1]) * q, nl = nearest(x, y, -1)[1];
          if (Math.abs(nl) < TW / 2 + 45 || y > shore(x) - 60) ok = false; if (T.falls && Math.hypot(x - T.falls.x, y - T.falls.y) < 330) ok = false; if (T.statue && Math.hypot(x - T.statue.x, y - T.statue.y) < 160) ok = false; }
        if (ok) { CUT = {i1: c.i, i2: c.j, a: P[c.i], b: P[c.j], w: 74}; break; } } } LINE = LINE.map((_, i) => { let s0 = 0; for (let j = -12; j <= 12; j++) s0 += LINE[wrap(i + j)]; return s0 / 25; });
    SPECT = [];
    (T.spect || []).forEach(([f, s]) => { for (let j = 0; j < 9; j++) { const [x, y] = at(f * N + j * 4, s * (TW / 2 + 34 + (j % 2) * 16));
      if (y < shore(x) - 30) SPECT.push({x, y, c: T.white ? pick(['#fff', '#f4f4f4', '#fffbe8']) : pick(['#ff4d4d', '#ffd23f', '#3fa7ff', '#3ccf6e', '#ff5fa2', '#fff', '#8a4fbf']), s: pick(['#f1c27d', '#c68642', '#8d5524', '#ffe0bd']), ph: rnd(0, TAU)}); } });
    BG = null; MINI = null; drawBG(); makeVehicles();
  }

  /* ---- Hintergrund je Strecke einmal vorzeichnen ---- */
  function sprite(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  const emo = {}; const E = (ch, s) => emo[ch + s] || (emo[ch + s] = sprite(s * 1.3, s * 1.3, (x, w) => { x.font = s + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, w / 2, w / 2 + s * .06); }));
  const across = (x, i, fn) => { x.save(); x.translate(P[i][0], P[i][1]); x.rotate(Math.atan2(NY[i], NX[i])); fn(); x.restore(); };   // lokales x = quer, −y = Fahrtrichtung
  const free = (X, Y, m) => { const lat = nearest(X, Y, -1)[1]; return Math.abs(lat) > TW / 2 + m && Y < shore(X) - 40 && !SPECT.some(s => Math.hypot(s.x - X, s.y - Y) < 40); };
  function scatter(x, n, m, fn) { for (let k = 0, tries = 0; k < n && tries < n * 15; tries++) { const X = rnd(30, WW - 30), Y = rnd(30, WH - 30); if (!free(X, Y, m)) continue; k++; fn(X, Y, k); } }
  const palm = (x, X, Y, k) => { x.fillStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.arc(X + 10, Y + 10, 30, 0, TAU); x.fill(); x.fillStyle = '#7a5230'; x.beginPath(); x.arc(X, Y, 7, 0, TAU); x.fill();
    for (let s = 0; s < 7; s++) { const a = s * TAU / 7 + k; x.fillStyle = s % 2 ? '#2f9e44' : '#3cbf55'; x.beginPath(); x.ellipse(X + Math.cos(a) * 18, Y + Math.sin(a) * 18, 20, 7, a, 0, TAU); x.fill(); } };
  const brolly = (x, X, Y, k, r) => { r = r || 26; const c = ['#ff4d4d', '#ffd23f', '#3fa7ff', '#3ccf6e'][k % 4]; x.fillStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.arc(X + 8, Y + 8, r, 0, TAU); x.fill();
    for (let s = 0; s < 8; s++) { x.fillStyle = s % 2 ? '#fff' : c; x.beginPath(); x.moveTo(X, Y); x.arc(X, Y, r, s * TAU / 8, (s + 1) * TAU / 8); x.fill(); } };
  const canopy = (x, X, Y, r, k) => { x.fillStyle = 'rgba(0,30,10,.35)'; x.beginPath(); x.arc(X + 8, Y + 10, r, 0, TAU); x.fill(); x.fillStyle = ['#1f6f35', '#2a8a43', '#17602c', '#35994f'][k % 4]; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.arc(X - r * .3, Y - r * .3, r * .45, 0, TAU); x.fill(); };
  function sea(x, c1, c2) { const g = x.createLinearGradient(0, 1400, 0, WH); g.addColorStop(0, c1 || '#2fc4c9'); g.addColorStop(.3, '#1694b8'); g.addColorStop(1, c2 || '#0b5d8f');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, WH); for (let X = 0; X <= WW; X += 20) x.lineTo(X, shore(X)); x.lineTo(WW, WH); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 6; x.beginPath(); for (let X = 0; X <= WW; X += 20) x[X ? 'lineTo' : 'moveTo'](X, shore(X)); x.stroke(); }
  function drawBG() {
    const BGS = [.7, .85, 1][SET.q];
    BG = sprite(Math.round(WW * BGS), Math.round(WH * BGS), (x) => { x.scale(BGS, BGS);
      const path = new Path2D(); P.forEach((p, i) => i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])); path.closePath();
      x.lineJoin = 'round'; x.lineCap = 'round';
      const id = T.id, noise = (n, c1, c2) => { for (let i = 0; i < n; i++) { x.fillStyle = Math.random() < .5 ? c1 : c2; x.fillRect(Math.random() * WW, Math.random() * WH, 2, 2); } };
      if (id === 'guaruja' || id === 'copa' || id === 'reveillon' || id === 'ilha') {
        x.fillStyle = id === 'ilha' ? '#ecd7a4' : '#f1d9a2'; x.fillRect(0, 0, WW, WH); noise(2600, 'rgba(180,140,80,.25)', 'rgba(255,255,255,.35)');
        sea(x, id === 'ilha' ? '#5fe0d0' : null);
        if (id === 'copa' || id === 'reveillon' || id === 'guaruja') { const cols = ['#e8e1d5', '#d9cbb4', '#f2efe8', '#cfd8dc', '#f6d6b3', '#e0c9e6'], h0 = id === 'guaruja' ? 100 : 140;
          for (let X = 10; X < WW; X += rnd(70, 110)) { const w = rnd(55, 95), h = rnd(70, h0); x.fillStyle = cols[(X * 7 | 0) % cols.length]; x.fillRect(X, 10, w, h); x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(X + w - 8, 10, 8, h);
            x.fillStyle = 'rgba(80,140,200,.5)'; for (let k = 0; k < 4; k++) x.fillRect(X + 8 + k * (w - 16) / 4, 30 + (k % 2) * 30, 8, 8); }
          x.fillStyle = '#5a5a5a'; x.fillRect(0, h0 + 20, WW, 40); x.strokeStyle = '#fff'; x.setLineDash([30, 30]); x.lineWidth = 3; x.beginPath(); x.moveTo(0, h0 + 40); x.lineTo(WW, h0 + 40); x.stroke(); x.setLineDash([]); }
        if (id === 'ilha') { for (let X = -50; X < WW + 100; X += 160) canopy(x, X + rnd(-30, 30), rnd(20, 120), rnd(70, 110), X / 160 | 0);   // grüne Hügel
          for (let k = 0; k < 7; k++) { const X = rnd(100, WW - 100), Y = shore(X) + rnd(60, 180); x.save(); x.translate(X, Y); x.rotate(rnd(-.4, .4)); x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(6, 8, 46, 14, 0, 0, TAU); x.fill();
            x.fillStyle = pick(['#ff6b3d', '#ffd23f', '#fff', '#3fa7ff']); x.beginPath(); x.moveTo(-46, -12); x.lineTo(30, -12); x.lineTo(50, 0); x.lineTo(30, 12); x.lineTo(-46, 12); x.closePath(); x.fill(); x.fillStyle = '#7a5230'; x.fillRect(-20, -6, 30, 12); x.restore(); } }
      } else if (id === 'iguacu' || id === 'amazon') {
        x.fillStyle = id === 'amazon' ? '#1e5a2c' : '#2d6b35'; x.fillRect(0, 0, WW, WH);
        for (let k = 0; k < 520; k++) canopy(x, rnd(0, WW), rnd(0, WH), rnd(26, 60), k);
      } else if (id === 'sp') {   // Hochhäuser von oben, Straßenraster
        x.fillStyle = '#7d8187'; x.fillRect(0, 0, WW, WH); noise(3000, 'rgba(0,0,0,.18)', 'rgba(255,255,255,.12)');
        for (let X = 0; X < WW; X += 230) { x.fillStyle = '#5d6066'; x.fillRect(X, 0, 26, WH); } for (let Y = 0; Y < WH; Y += 230) { x.fillStyle = '#5d6066'; x.fillRect(0, Y, WW, 26); }
        for (let X = 30; X < WW; X += 230) for (let Y = 30; Y < WH; Y += 230) { if (!free(X + 95, Y + 95, 50)) continue; const h = rnd(.3, 1), c = pick(['#c9ccd2', '#aeb4bd', '#d8d2c4', '#9fb3c8', '#e4e1da']);
          x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(X + 18 * h + 6, Y + 18 * h + 6, 190, 190); x.fillStyle = c; x.fillRect(X, Y, 190, 190); x.fillStyle = 'rgba(80,140,200,.45)';
          for (let a2 = 0; a2 < 5; a2++) for (let b2 = 0; b2 < 5; b2++) x.fillRect(X + 14 + a2 * 36, Y + 14 + b2 * 36, 22, 22); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(X, Y, 190, 8); }
      } else if (id === 'cristo') {   // grüner Berg, Felsen, oben die Statue
        x.fillStyle = '#2f7a3a'; x.fillRect(0, 0, WW, WH); for (let k2 = 0; k2 < 420; k2++) canopy(x, rnd(0, WW), rnd(0, WH), rnd(24, 54), k2);
        for (let k2 = 0; k2 < 50; k2++) { x.fillStyle = 'rgba(120,110,100,.8)'; x.beginPath(); x.ellipse(rnd(0, WW), rnd(0, WH), rnd(20, 50), rnd(14, 30), rnd(0, 3), 0, TAU); x.fill(); }
      } else if (id === 'gru') {   // Terminal: Fliesen, Gates, Gepäckhaufen
        x.fillStyle = '#c4c8ce'; x.fillRect(0, 0, WW, WH); x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; for (let X = 0; X < WW; X += 80) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, WH); x.stroke(); } for (let Y = 0; Y < WH; Y += 80) { x.beginPath(); x.moveTo(0, Y); x.lineTo(WW, Y); x.stroke(); }
        for (let X = 60; X < WW - 200; X += 420) { x.fillStyle = '#2b5f9e'; x.fillRect(X, 20, 260, 90); x.fillStyle = '#ffd23f'; x.font = '900 40px system-ui'; x.textAlign = 'center'; x.fillText('GATE ' + (X / 420 + 1 | 0), X + 130, 80); }
        scatter(x, 40, 40, (X, Y) => { for (let q = 0; q < 4; q++) { x.fillStyle = pick(['#d62828', '#2b5f9e', '#f2b600', '#333', '#7b4ea0']); x.fillRect(X + rnd(-30, 30), Y + rnd(-20, 20), rnd(26, 40), rnd(36, 50)); } });
      } else if (id === 'bridge') {   // Guanabara-Bucht: Wasser, Schiffe, Ufer
        const g = x.createLinearGradient(0, 0, WW, WH); g.addColorStop(0, '#1d7fa8'); g.addColorStop(1, '#0b4a6e'); x.fillStyle = g; x.fillRect(0, 0, WW, WH); noise(5000, 'rgba(255,255,255,.18)', 'rgba(0,30,60,.2)');
        x.fillStyle = '#3f8f4a'; x.beginPath(); x.ellipse(0, 0, 520, 340, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(WW, WH, 560, 380, 0, 0, TAU); x.fill();
        scatter(x, 9, 120, (X, Y) => { x.save(); x.translate(X, Y); x.rotate(rnd(-.5, .5)); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-120, -3, 70, 6); x.fillStyle = pick(['#fff', '#d62828', '#333']); x.fillRect(-60, -18, 120, 36); x.fillStyle = '#ffd23f'; x.fillRect(-20, -12, 40, 24); x.restore(); });
      } else if (id === 'manaus') {   // Hafen bei Nacht: Beton, Container, Kräne, Fluss
        x.fillStyle = '#34383d'; x.fillRect(0, 0, WW, WH); noise(4000, 'rgba(0,0,0,.25)', 'rgba(255,255,255,.08)'); sea(x, '#1c4a55', '#0a2a33');
        scatter(x, 70, 50, (X, Y) => { const c = pick(['#c0392b', '#2f6fd6', '#1d9a5b', '#e3a21a', '#8e44ad', '#d35400']), w = 120, h = 44; x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(X + 6, Y + 6, w, h); x.fillStyle = c; x.fillRect(X, Y, w, h); x.fillStyle = 'rgba(0,0,0,.18)'; for (let q = 8; q < w; q += 12) x.fillRect(X + q, Y, 4, h); });
        for (let X = 300; X < WW; X += 700) { x.strokeStyle = '#f2b600'; x.lineWidth = 10; x.beginPath(); x.moveTo(X, shore(X) - 40); x.lineTo(X + 40, shore(X) - 320); x.lineTo(X + 260, shore(X) - 320); x.stroke(); }
      } else if (id === 'lopes') {   // Traumstrand: weißer Sand, Palmen, Fußballplatz im Innenfeld
        x.fillStyle = '#f6ead0'; x.fillRect(0, 0, WW, WH); noise(3000, 'rgba(200,170,110,.25)', 'rgba(255,255,255,.4)'); sea(x, '#6ff0e0', '#0e7fa8');
        for (let X = -50; X < WW + 100; X += 150) canopy(x, X + rnd(-30, 30), rnd(20, 140), rnd(70, 110), X / 150 | 0);
        { let cx = 0, cy = 0; P.forEach(p0 => { cx += p0[0]; cy += p0[1]; }); cx /= P.length; cy /= P.length; x.fillStyle = '#3f9f4a'; x.fillRect(cx - 330, cy - 200, 660, 400); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 6; x.strokeRect(cx - 310, cy - 180, 620, 360);
          x.beginPath(); x.moveTo(cx, cy - 180); x.lineTo(cx, cy + 180); x.stroke(); x.beginPath(); x.arc(cx, cy, 60, 0, TAU); x.stroke(); x.strokeRect(cx - 310, cy - 70, 60, 140); x.strokeRect(cx + 250, cy - 70, 60, 140); }
      } else if (id === 'paraty') {
        x.fillStyle = '#b9b1a3'; x.fillRect(0, 0, WW, WH); noise(4000, 'rgba(90,80,70,.25)', 'rgba(255,255,255,.2)');
        sea(x, '#4fb5b0', '#1b6f86');
        // Kolonialhäuser (weiß, bunte Türen, rote Dächer) in Blöcken
        for (let X = 20; X < WW; X += 120) for (let Y = 20; Y < shore(X) - 210; Y += 120) { if (!free(X + 50, Y + 50, 60)) continue;
          x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(X + 6, Y + 6, 96, 96); x.fillStyle = '#c4553a'; x.fillRect(X, Y, 96, 96); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(X + 48, Y, 48, 96);
          x.fillStyle = '#f7f2e8'; x.fillRect(X, Y + 82, 96, 14); const dc = pick(['#2f6fd6', '#1d9a5b', '#e3a21a', '#c0392b']); x.fillStyle = dc; for (let d = 0; d < 3; d++) x.fillRect(X + 10 + d * 30, Y + 84, 14, 12); }
      }
      // Wasserfall (Iguaçu): Klippe, Kaskaden, Becken
      if (T.falls) { const {x: fx, y: fy} = T.falls; x.fillStyle = '#5c4a3a'; x.beginPath(); x.ellipse(fx, fy, 270, 230, 0, 0, TAU); x.fill();
        const g = x.createRadialGradient(fx, fy + 40, 20, fx, fy + 40, 220); g.addColorStop(0, '#e9fbff'); g.addColorStop(.5, '#7fd6f0'); g.addColorStop(1, '#2a8fb8'); x.fillStyle = g; x.beginPath(); x.ellipse(fx, fy + 30, 215, 175, 0, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 9; for (let a = -2.6; a < -.5; a += .12) { x.beginPath(); x.moveTo(fx + Math.cos(a) * 250, fy + Math.sin(a) * 210); x.lineTo(fx + Math.cos(a) * 170, fy + Math.sin(a) * 120 + 40); x.stroke(); } }
      // Strecke
      const surf = {gru: '#8a9099', bridge: '#55595f', manaus: '#4a4e54', lopes: '#e2cc98', guaruja: '#6d6f73', copa: null, reveillon: null, iguacu: '#a5482b', amazon: null, paraty: '#8f8578', ilha: '#c99d5c', sp: '#3b3e44', cristo: '#5b5550'}[id];
      if (id === 'amazon') {   // Fluss: zwei Farben (Rio Negro + Solimões), Uferschlamm
        x.strokeStyle = '#6b4b2a'; x.lineWidth = TW + 40; x.stroke(path);
        x.strokeStyle = '#2b1d12'; x.lineWidth = TW; x.stroke(path);
        x.save(); x.beginPath(); x.rect(WW * .45, 0, WW, WH); x.clip(); x.strokeStyle = '#b07a3e'; x.lineWidth = TW; x.stroke(path); x.restore();
        x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 3; for (let k = 0; k < 6; k++) { x.setLineDash([30, 60]); x.lineDashOffset = k * 15; x.lineWidth = 2; x.stroke(path); } x.setLineDash([]);
      } else {
        x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = TW + 34; x.stroke(path);
        if (id === 'iguacu') { x.strokeStyle = '#5e8d3a'; x.lineWidth = TW + 18; x.stroke(path); }
        else if (id === 'ilha') { x.strokeStyle = '#8a5a2b'; x.lineWidth = TW + 18; x.stroke(path); x.strokeStyle = '#a8743f'; x.setLineDash([12, 6]); x.stroke(path); x.setLineDash([]); }
        else { x.strokeStyle = '#fff'; x.lineWidth = TW + 18; x.stroke(path); x.strokeStyle = id === 'paraty' ? '#2f6fd6' : '#e63a2e'; x.setLineDash([22, 22]); x.stroke(path); x.setLineDash([]); }
        let pat = null;
        if (id === 'copa' || id === 'reveillon') pat = sprite(120, 60, (c, w, h) => { c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#26221f';
          c.beginPath(); c.moveTo(0, 18); for (let X = 0; X <= w; X += 4) c.lineTo(X, 18 + 12 * Math.sin(X / w * TAU)); for (let X = w; X >= 0; X -= 4) c.lineTo(X, 34 + 12 * Math.sin(X / w * TAU)); c.fill(); });
        if (id === 'paraty') pat = sprite(64, 64, (c) => { c.fillStyle = '#5d554b'; c.fillRect(0, 0, 64, 64); for (let i = 0; i < 9; i++) { c.fillStyle = pick(['#8f8578', '#9d927f', '#7f776c', '#a49a88']); c.beginPath(); c.ellipse((i % 3) * 21 + 11, (i / 3 | 0) * 21 + 11, 9, 8, rnd(0, 3), 0, TAU); c.fill(); } });
        x.strokeStyle = pat ? x.createPattern(pat, 'repeat') : surf; x.lineWidth = TW; x.stroke(path);
        if (id === 'iguacu') { for (let i = 0; i < N; i += 3) { const [px, py] = at(i, rnd(-TW / 2 + 8, TW / 2 - 8)); x.fillStyle = 'rgba(70,20,10,.25)'; x.fillRect(px, py, 3, 3); } }
        if (id === 'guaruja' || id === 'sp' || id === 'cristo' || id === 'bridge' || id === 'gru' || id === 'manaus') { x.strokeStyle = id === 'sp' || id === 'manaus' ? 'rgba(255,210,63,.85)' : 'rgba(255,255,255,.75)'; x.lineWidth = 4; x.setLineDash([26, 26]); x.stroke(path); x.setLineDash([]); }
        if (id === 'ilha') { x.strokeStyle = 'rgba(255,240,200,.35)'; x.lineWidth = TW * .45; x.stroke(path); x.strokeStyle = 'rgba(90,60,30,.35)'; x.lineWidth = 3; x.setLineDash([4, 18]); for (const o of [-TW * .3, TW * .3]) { x.save(); x.stroke(path); x.restore(); } x.setLineDash([]); }
      }
      // Start/Ziel
      across(x, 0, () => { for (let r = 0; r < 2; r++) for (let c = -TW / 2; c < TW / 2; c += 12) { x.fillStyle = ((c / 12 + r) & 1) ? '#111' : '#fff'; x.fillRect(c, -12 + r * 12, 12, 12); } });
      // Boost-Pfeile
      PADS.forEach(p => across(x, p.i, () => { x.translate(p.l, 0); x.fillStyle = '#ff8a00'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(-19, -26, 38, 52, 8) : x.rect(-19, -26, 38, 52); x.fill(); x.stroke();
        x.fillStyle = '#fff6b0'; for (let k = 0; k < 3; k++) { const y = 14 - k * 15; x.beginPath(); x.moveTo(-12, y + 6); x.lineTo(0, y - 6); x.lineTo(12, y + 6); x.lineTo(12, y + 11); x.lineTo(0, y - 1); x.lineTo(-12, y + 11); x.fill(); } }));
      // Schanze
      if (RAMP >= 0) across(x, RAMP, () => { const gr = x.createLinearGradient(0, 18, 0, -18); gr.addColorStop(0, '#8a5a2b'); gr.addColorStop(1, '#d9a35c'); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-TW / 2 - 4, -14, TW + 8, 36);
        x.fillStyle = gr; x.fillRect(-TW / 2, -18, TW, 36); x.strokeStyle = 'rgba(80,40,10,.6)'; x.lineWidth = 2; for (let y = -12; y < 18; y += 8) { x.beginPath(); x.moveTo(-TW / 2, y); x.lineTo(TW / 2, y); x.stroke(); }
        for (let c = -TW / 2; c < TW / 2; c += 15) { x.fillStyle = ((c + TW / 2) / 15 & 1) ? '#111' : '#ffd23f'; x.fillRect(c, -22, 15, 5); } });
      // Gepäckbänder: dunkle Rollen quer über die Strecke, Pfeile in Laufrichtung
      (T.belts || []).forEach(([f0, f1, dir]) => { for (let i = Math.round(f0 * N); i < f1 * N; i += 3) across(x, i, () => { x.fillStyle = 'rgba(30,30,35,.55)'; x.fillRect(-TW / 2 + 6, -1.5, TW - 12, 3); });
        for (let i = Math.round(f0 * N) + 8; i < f1 * N; i += 22) across(x, i, () => { x.fillStyle = dir > 0 ? 'rgba(90,255,140,.8)' : 'rgba(255,90,90,.8)'; x.beginPath(); x.moveTo(-14, 0); x.lineTo(0, 10 * dir); x.lineTo(14, 0); x.lineTo(14, 6 * -dir); x.lineTo(0, 4 * dir); x.lineTo(-14, 6 * -dir); x.closePath(); x.fill(); }); });
      if (id === 'bridge') { [-1, 1].forEach(sd => { x.strokeStyle = '#d8dde3'; x.lineWidth = 7; x.beginPath(); P.forEach((p0, i) => { const X = p0[0] + NX[i] * sd * (TW / 2 + 10), Y = p0[1] + NY[i] * sd * (TW / 2 + 10); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.stroke(); });
        for (let i = 0; i < N; i += 40) [-1, 1].forEach(sd => { const X = P[i][0] + NX[i] * sd * (TW / 2 + 24), Y = P[i][1] + NY[i] * sd * (TW / 2 + 24); x.fillStyle = '#9aa3ad'; x.fillRect(X - 9, Y - 9, 18, 18); }); }
      if (id === 'manaus') for (let i = 10; i < N; i += 55) { const X = P[i][0] + NX[i] * (TW / 2 + 30), Y = P[i][1] + NY[i] * (TW / 2 + 30); const g = x.createRadialGradient(X, Y, 4, X, Y, 120); g.addColorStop(0, 'rgba(255,220,140,.55)'); g.addColorStop(1, 'rgba(255,220,140,0)'); x.fillStyle = g; x.fillRect(X - 120, Y - 120, 240, 240); x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(X, Y, 6, 0, TAU); x.fill(); }
      // Abkürzung: Schotterweg mit Schild und Turbo-Pfeil
      if (CUT) { x.save(); x.lineCap = 'round'; x.strokeStyle = 'rgba(0,0,0,.2)'; x.lineWidth = CUT.w + 14; x.beginPath(); x.moveTo(CUT.a[0], CUT.a[1]); x.lineTo(CUT.b[0], CUT.b[1]); x.stroke();
        const SQ = secretOf(); x.strokeStyle = SQ[2]; x.lineWidth = CUT.w; x.stroke();
        if (SQ[3]) { const dx0 = CUT.b[0] - CUT.a[0], dy0 = CUT.b[1] - CUT.a[1], l0 = Math.hypot(dx0, dy0), nx0 = -dy0 / l0, ny0 = dx0 / l0; x.strokeStyle = 'rgba(60,35,15,.45)'; x.lineWidth = 2; x.beginPath(); for (let q = 8; q < l0; q += 16) { const cx0 = CUT.a[0] + dx0 / l0 * q, cy0 = CUT.a[1] + dy0 / l0 * q; x.moveTo(cx0 - nx0 * CUT.w / 2, cy0 - ny0 * CUT.w / 2); x.lineTo(cx0 + nx0 * CUT.w / 2, cy0 + ny0 * CUT.w / 2); } x.stroke(); }
        else { x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; x.setLineDash([14, 14]); x.stroke(); x.setLineDash([]); }
        { x.save(); x.translate(CUT.a[0], CUT.a[1]); x.fillStyle = 'rgba(20,20,30,.82)'; x.font = '900 22px system-ui,sans-serif'; const tx0 = '🤫 ' + SQ[0], tw0 = x.measureText(tx0).width + 20; x.fillRect(-tw0 / 2, -64, tw0, 32); x.fillStyle = '#ffd23f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(tx0, 0, -48); x.restore(); }
        for (let q = 0; q < 140; q++) { const u = Math.random(), v = (Math.random() - .5) * CUT.w * .8, dx = CUT.b[0] - CUT.a[0], dy = CUT.b[1] - CUT.a[1], l = Math.hypot(dx, dy); x.fillStyle = 'rgba(70,45,20,.35)'; x.fillRect(CUT.a[0] + dx * u - dy / l * v, CUT.a[1] + dy * u + dx / l * v, 4, 4); }
        const mx = (CUT.a[0] + CUT.b[0]) / 2, my = (CUT.a[1] + CUT.b[1]) / 2; x.translate(mx, my); x.rotate(Math.atan2(CUT.b[1] - CUT.a[1], CUT.b[0] - CUT.a[0]) + Math.PI / 2); x.fillStyle = '#ff8a00'; x.fillRect(-16, -22, 32, 44);
        x.fillStyle = '#fff6b0'; for (let q = 0; q < 2; q++) { const yy = 10 - q * 16; x.beginPath(); x.moveTo(-10, yy + 5); x.lineTo(0, yy - 5); x.lineTo(10, yy + 5); x.fill(); } x.restore();
      }
      // Cristo-Statue auf dem Gipfel
      if (T.statue) { const {x: sx, y: sy} = T.statue; x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(sx + 30, sy + 40, 150, 60, 0, 0, TAU); x.fill(); x.fillStyle = '#d9d4c7'; x.beginPath(); x.arc(sx, sy, 70, 0, TAU); x.fill();
        x.fillStyle = '#f4f1ea'; x.fillRect(sx - 150, sy - 18, 300, 36); x.fillRect(sx - 22, sy - 60, 44, 150); x.beginPath(); x.arc(sx, sy - 70, 22, 0, TAU); x.fill(); x.strokeStyle = 'rgba(0,0,0,.2)'; x.lineWidth = 2; x.strokeRect(sx - 150, sy - 18, 300, 36); }
      // Schranken-Pfosten
      (T.gates || []).forEach(g => { const gi = wrap(g.f * N); across(x, gi, () => { x.fillStyle = '#333'; x.fillRect(-TW / 2 - 18, -10, 16, 20); x.fillStyle = '#ffd23f'; x.fillRect(-TW / 2 - 16, -8, 12, 16); if (g.kind === 'train') { x.fillStyle = '#5b4636'; for (let q = -TW / 2; q < TW / 2; q += 14) x.fillRect(q, -16, 8, 32); x.fillStyle = '#9aa3ad'; x.fillRect(-TW / 2, -12, TW, 4); x.fillRect(-TW / 2, 8, TW, 4); } }); });
      // Kurven-Schilder (rot-weiße Pfeiltafeln) außen an scharfen Kurven
      for (let i = 0; i < N; i += 16) { const c = SCURV[i]; if (Math.abs(c) < 1 / 330) continue; const sd = -Math.sign(c), [bx, by] = at(i, sd * (TW / 2 + 26));
        x.save(); x.translate(bx, by); x.rotate(Math.atan2(NY[i], NX[i])); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-15, -7, 34, 18); x.fillStyle = '#d62828'; x.fillRect(-17, -9, 34, 18); x.strokeStyle = '#fff'; x.lineWidth = 3;
        const dir = Math.sign(c); x.beginPath(); for (let q = -1; q <= 1; q++) { x.moveTo(q * 9 - dir * 4, -5); x.lineTo(q * 9 + dir * 4, 0); x.lineTo(q * 9 - dir * 4, 5); } x.stroke(); x.restore(); }
      // Deko neben der Strecke
      if (id === 'copa' || id === 'guaruja') scatter(x, 60, 40, (X, Y, k) => { if (Y < 230) return; (Y > 1400 || Math.random() < .35) ? brolly(x, X, Y, k) : palm(x, X, Y, k); });
      if (id === 'ilha') scatter(x, 45, 40, (X, Y, k) => { if (Y < 200) return; Math.random() < .3 ? brolly(x, X, Y, k, 22) : palm(x, X, Y, k); });
      if (id === 'paraty') scatter(x, 14, 40, (X, Y, k) => palm(x, X, Y, k));
      const title = {gru: 'AEROPORTO GRU', bridge: 'PONTE RIO–NITERÓI', manaus: 'PORTO DE MANAUS', lopes: 'LOPES MENDES', guaruja: 'GUARUJÁ', copa: 'COPACABANA', reveillon: 'RÉVEILLON 2027', iguacu: 'IGUAÇU', amazon: 'AMAZONAS', paraty: 'PARATY', ilha: 'ILHA GRANDE', sp: 'SÃO PAULO', cristo: 'CRISTO REDENTOR'}[id];
      x.save(); x.font = '900 70px system-ui,sans-serif'; x.fillStyle = id === 'iguacu' || id === 'amazon' ? 'rgba(255,255,255,.18)' : 'rgba(0,120,70,.22)'; x.textAlign = 'center';
      const [tx, ty] = T.falls ? [T.falls.x, T.falls.y + 330] : [WW / 2, WH / 2 + 60]; x.fillText(title, tx, ty); x.font = '900 34px system-ui,sans-serif'; x.fillText('Gringo Kart · ' + T.sub, tx, ty + 50); x.restore();
    });
  }

  /* ---- Fahrer: Kopf- und Fahrzeug-Sprites ---- */
  const HEAD = {}, VEH = {};
  function makeHeads() {
    CREW.forEach(p => {
      const L = LOOK[p.id] || {}, col = L.shirt || '#00a651', R = 52;
      const hs = sprite(2 * R + 12, 2 * R + 12, (x) => { x.translate(R + 6, R + 6); x.fillStyle = col; x.beginPath(); x.arc(0, 0, R + 6, 0, TAU); x.fill();
        x.fillStyle = '#ffe0bd'; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill(); x.fillStyle = '#333'; x.font = '800 52px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.name[0], 0, 1); });
      HEAD[p.id] = hs;
      if (p.photo) { const im = new Image(); im.onload = () => { const x = hs.getContext('2d'), f = L.face || {x: .5, y: .5, z: 1}, D = 2 * R * f.z;
        x.setTransform(1, 0, 0, 1, 0, 0); x.save(); x.translate(R + 6, R + 6); x.beginPath(); x.arc(0, 0, R, 0, TAU); x.clip(); x.drawImage(im, -f.x * D, -f.y * D, D, D); x.restore(); }; im.src = p.photo; }
    });
  }
  const FW = {kart: [[-14, -13], [14, -13]], gold: [[-14, -13], [14, -13]], uber: [[-14, -13], [14, -13]], uno: [[-14, -13], [14, -13]], cart: [[-16, -10], [16, -10]]};
  const vehOf = id => T.veh === 'boat' || T.veh === 'cart' ? T.veh : (id === me ? myVeh() : 'kart');
  // Lack & Aufkleber je Fahrer (Garage): Farbe c (null = Shirt-Farbe), Aufkleber s
  const PAINTS = [null, '#d62828', '#ff8a00', '#ffd23f', '#1d9a5b', '#1694b8', '#2b5f9e', '#7b4ea0', '#ff5fa2', '#222222', '#f4f4f4', '#c9a227'];
  const STK = [{id: 'stripes', e: '🏁', n: 'Rennstreifen', c: 30}, {id: 'num', e: '#️⃣', n: 'Startnummer', c: 20}, {id: 'flag', e: '🇧🇷', n: 'Brasil-Heck', c: 25}, {id: 'name', e: '🔤', n: '„GRINGO“', c: 25}, {id: 'flames', e: '🔥', n: 'Flammen', c: 40}];
  const NUMS = {jonas: 7, simon: 10, patrick: 69, marco: 9, greisel: 12, dajo: 23};
  const paintOf = id => Object.assign({c: null, s: []}, loadJ('kartPaint')[id] || {});
  function makeVehicles() {
    CREW.forEach(p => { const pt = paintOf(p.id); VEH[p.id] = vehSprite(pt.c || (LOOK[p.id] || {}).shirt || '#00a651', vehOf(p.id), pt, p.id); }); }
  function vehSprite(col, vt, pt, nid) { pt = pt || {s: []};
      return sprite(88, 120, (x) => { x.scale(2, 2); x.translate(22, 30); x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 2;
        if (vt === 'uber' || vt === 'uno') { const c2 = vt === 'uber' ? '#151515' : '#d62828'; x.fillStyle = '#111'; [[-17, 8], [11, 8]].forEach(([a, b]) => x.fillRect(a, b, 6, 12));
          x.fillStyle = c2; x.beginPath(); x.roundRect ? x.roundRect(-14, -28, 28, 54, vt === 'uno' ? 4 : 9) : x.rect(-14, -28, 28, 54); x.fill(); x.stroke();
          x.fillStyle = 'rgba(160,210,255,.85)'; x.fillRect(-11, -18, 22, 9); x.fillRect(-11, 12, 22, 6); x.fillStyle = col; x.fillRect(-11, -7, 22, 17);
          if (vt === 'uber') { x.fillStyle = '#fff'; x.font = '800 8px system-ui'; x.textAlign = 'center'; x.fillText('UBER', 0, 3); } else { x.fillStyle = '#fff'; x.fillRect(-14, -2, 28, 3); } }
        else if (vt === 'wheel') { x.fillStyle = '#333'; x.fillRect(-20, -14, 7, 30); x.fillRect(13, -14, 7, 30); x.fillStyle = '#9aa3ad'; x.beginPath(); x.arc(-16, 1, 3, 0, TAU); x.arc(16, 1, 3, 0, TAU); x.fill();
          x.fillStyle = col; x.fillRect(-12, -10, 24, 24); x.fillStyle = '#2b2b2b'; x.fillRect(-12, 12, 24, 6); x.fillStyle = '#555'; x.fillRect(-8, -24, 4, 14); x.fillRect(4, -24, 4, 14); x.fillStyle = '#222'; x.beginPath(); x.arc(-6, -26, 3, 0, TAU); x.arc(6, -26, 3, 0, TAU); x.fill(); }
        else if (vt === 'gold') { x.fillStyle = '#111'; [[-17, 8], [11, 8]].forEach(([a, b]) => x.fillRect(a, b, 6, 14));
          const g = x.createLinearGradient(-13, -27, 13, 22); g.addColorStop(0, '#fff3a8'); g.addColorStop(.5, '#f2b600'); g.addColorStop(1, '#a86f00'); x.fillStyle = g;
          x.beginPath(); x.moveTo(-9, -27); x.lineTo(9, -27); x.lineTo(13, -6); x.lineTo(13, 22); x.lineTo(-13, 22); x.lineTo(-13, -6); x.closePath(); x.fill(); x.stroke(); x.fillStyle = col; x.fillRect(-8, -24, 16, 5); }
        else if (vt === 'boat') { x.fillStyle = col; x.beginPath(); x.moveTo(0, -29); x.quadraticCurveTo(15, -12, 14, 20); x.lineTo(-14, 20); x.quadraticCurveTo(-15, -12, 0, -29); x.fill(); x.stroke();
          x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.moveTo(0, -24); x.quadraticCurveTo(10, -10, 9, 14); x.lineTo(-9, 14); x.quadraticCurveTo(-10, -10, 0, -24); x.fill();
          x.fillStyle = '#333'; x.fillRect(-6, 18, 12, 9); x.fillStyle = '#888'; x.fillRect(-2, 26, 4, 4); }
        else if (vt === 'cart') { x.fillStyle = '#222'; [[-19, 6], [13, 6]].forEach(([a, b]) => x.fillRect(a, b, 6, 12));
          x.fillStyle = '#9b6a3a'; x.fillRect(-15, -24, 30, 46); x.strokeRect(-15, -24, 30, 46); x.strokeStyle = 'rgba(60,30,10,.6)'; for (let y = -18; y < 22; y += 7) { x.beginPath(); x.moveTo(-15, y); x.lineTo(15, y); x.stroke(); }
          x.fillStyle = col; x.fillRect(-11, 2, 22, 16); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(-4, 0, 8, 3); x.strokeStyle = '#555'; x.lineWidth = 3; x.beginPath(); x.moveTo(-12, -26); x.lineTo(-12, -30); x.lineTo(12, -30); x.lineTo(12, -26); x.stroke(); }
        else { x.fillStyle = '#111'; [[-17, 8], [11, 8]].forEach(([a, b]) => { x.beginPath(); x.roundRect ? x.roundRect(a, b, 6, 14, 2) : x.rect(a, b, 6, 14); x.fill(); });
          x.fillStyle = col; x.beginPath(); x.moveTo(-9, -27); x.lineTo(9, -27); x.lineTo(13, -6); x.lineTo(13, 22); x.lineTo(-13, 22); x.lineTo(-13, -6); x.closePath(); x.fill(); x.stroke();
          x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(-8, -24, 16, 5); x.fillStyle = '#222'; x.fillRect(-15, 20, 30, 5); }
        if (vt !== 'boat' && vt !== 'wheel') { const g = x.createLinearGradient(-14, 0, 14, 0); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); x.fillStyle = g; x.fillRect(-13, -26, 26, 48); }
        // Aufkleber (nur auf Karosserien)
        if (vt !== 'boat' && vt !== 'wheel' && vt !== 'cart') { const S0 = pt.s || [];
          if (S0.includes('stripes')) { x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(-5, -26, 3, 47); x.fillRect(2, -26, 3, 47); }
          if (S0.includes('flames')) { [-1, 1].forEach(sd => { x.fillStyle = '#ff5a1f'; x.beginPath(); x.moveTo(sd * 12, -20); x.quadraticCurveTo(sd * 4, -14, sd * 12, -6); x.quadraticCurveTo(sd * 6, -10, sd * 12, 4); x.lineTo(sd * 13, -20); x.fill(); x.fillStyle = '#ffd23f'; x.beginPath(); x.moveTo(sd * 12, -16); x.quadraticCurveTo(sd * 7, -12, sd * 12, -8); x.fill(); }); }
          if (S0.includes('flag')) { x.fillStyle = '#009c3b'; x.fillRect(-12, 12, 24, 8); x.fillStyle = '#ffdf00'; x.beginPath(); x.moveTo(-7, 16); x.lineTo(0, 12.5); x.lineTo(7, 16); x.lineTo(0, 19.5); x.fill(); x.fillStyle = '#002776'; x.beginPath(); x.arc(0, 16, 2.2, 0, TAU); x.fill(); }
          if (S0.includes('num')) { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -3, 6.5, 0, TAU); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 1; x.stroke(); x.fillStyle = '#111'; x.font = '900 7px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(NUMS[nid] || 1), 0, -2.6); }
          if (S0.includes('name')) { x.save(); x.fillStyle = 'rgba(255,255,255,.95)'; x.font = '900 5px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GRINGO', 0, 9); x.restore(); } } });
  }

  /* ---- Ton: Motor, Synth-Effekte, echte Geräusche, Samba, Ansager ---- */
  let AC = null, eng = null, MG = null, FXG = null, SOUND = store.get('kartSound') !== '0', ANN = store.get('kartAnn') !== '0';
  const BUF = {sfx: null, ann: null, ann2: null, ann3: null, ann4: null, ann5: null}; let loading = false;
  function audio() {
    if (!SOUND) return null;
    try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)();
        FXG = AC.createGain(); FXG.gain.value = 1; FXG.connect(AC.destination); MG = AC.createGain(); MG.gain.value = .5; MG.connect(AC.destination);
        const o = AC.createOscillator(), o2 = AC.createOscillator(), sub = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), g2 = AC.createGain();
        o.type = 'sawtooth'; o2.type = 'square'; sub.type = 'sine'; o2.detune.value = 9; g2.gain.value = .35; f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 3; g.gain.value = 0;
        o.connect(f); o2.connect(g2); g2.connect(f); sub.connect(f); f.connect(g); g.connect(FXG); o.start(); o2.start(); sub.start();
        const nb = AC.createBuffer(1, AC.sampleRate, AC.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const sq = AC.createBufferSource(), sf = AC.createBiquadFilter(), sg = AC.createGain(); sq.buffer = nb; sq.loop = true; sf.type = 'bandpass'; sf.frequency.value = 2600; sf.Q.value = 6; sg.gain.value = 0; sq.connect(sf); sf.connect(sg); sg.connect(FXG); sq.start();
        eng = {o, o2, sub, g, f, sg, sf}; loadBufs(); }
      if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
    return AC;
  }
  function loadBufs() {
    if (loading || !AC) return; loading = true;
    const get = (u, k) => fetch(u).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => new Promise((ok, no) => AC.decodeAudioData(b, ok, no))).then(d => { BUF[k] = d; }).catch(() => {});
    // zuerst nur Geräusche + Haupt-Ansager; die übrigen Stimmen-Pakete erst beim ersten Rennen nacheinander (lädt nicht alles auf einmal)
    if (TRIP.sfx) get('audio/sfx.mp3', 'sfx'); if (TRIP.kartvo) get('audio/kart.mp3', 'ann'); BUF.more = () => { if (BUF.moreDone) return; BUF.moreDone = 1; let w = 0; const q = (u, k) => { w += 700; setTimeout(() => get(u, k), w); }; if (TRIP.kartvo) { const get = q; if (Object.values(TRIP.kartvo).some(v => v.f === 2)) get('audio/kart2.mp3', 'ann2'); if (Object.values(TRIP.kartvo).some(v => v.f === 3)) get('audio/kart3.mp3', 'ann3'); if (Object.values(TRIP.kartvo).some(v => v.f === 4)) get('audio/kart4.mp3', 'ann4'); if (Object.values(TRIP.kartvo).some(v => v.f === 5)) get('audio/kart5.mp3', 'ann5'); } };
  }
  function playBuf(buf, off, dur, vol, out) { const a = AC; if (!a || !buf) return false; const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; g.gain.value = vol; s.connect(g); g.connect(out || FXG); s.start(a.currentTime, off, dur); return true; }
  function real(name, vol) { const seg = TRIP.sfx && TRIP.sfx[name]; if (!seg || !BUF.sfx || !SOUND) return false; const [st, len, v] = pick(seg); return playBuf(BUF.sfx, st, len, (v || 1) * (vol || 1)); }
  function beep(freq, dur, type, vol, slide) { const a = audio(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur); g.gain.setValueAtTime(vol || .08, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(FXG); o.start(t); o.stop(t + dur + .02); }
  function noise(dur, vol, hp, when, out, bp) { const a = audio(); if (!a) return; const t = when || a.currentTime, b = a.createBuffer(1, Math.max(1, a.sampleRate * dur | 0), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = bp ? 'bandpass' : 'highpass'; f.frequency.value = bp || hp || 800; g.gain.value = vol || .12; s.connect(f); f.connect(g); g.connect(out || FXG); s.start(t); }
  const SFX = {coin: () => { beep(1320, .05, 'square', .045); setTimeout(() => beep(1980, .09, 'square', .045), 50); }, pick: () => { beep(880, .08, 'square', .06); setTimeout(() => beep(1320, .1, 'square', .06), 70); }, turbo: () => { noise(.6, .14, 400); beep(220, .5, 'sawtooth', .05, 660); },
    spin: () => { if (!real('crash', .45)) beep(700, .5, 'triangle', .1, 120); beep(500, .45, 'triangle', .05, 140); }, throw: () => beep(400, .25, 'square', .05, 900), oil: () => noise(.25, .1, 2000),
    count: n => beep(n ? 440 : 880, n ? .18 : .4, 'square', .08), finish: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .22, 'square', .07), i * 130)); real('cheer', .8); setTimeout(() => real('applause', .6), 400); },
    drift: () => { if (!real('squeak', .25)) noise(.25, .05, 3000); }, mini: l => { beep(l > 1 ? 330 : 440, .35, 'sawtooth', .05, l > 1 ? 1320 : 990); noise(.4, .1, 600); },
    pad: () => { beep(600, .25, 'square', .05, 1400); noise(.3, .08, 1200); }, jump: () => beep(300, .3, 'triangle', .08, 900), land: () => { if (!real('thud', .5)) noise(.15, .12, 200); },
    splash: () => { if (!real('splash', .6)) noise(.6, .15, 500); }, rocket: () => { beep(200, .6, 'sawtooth', .07, 1200); noise(.8, .12, 300); }, stall: () => beep(160, .5, 'square', .06, 60),
    birds: () => { for (let i = 0; i < 4; i++) setTimeout(() => noise(.06, .05, 0, 0, 0, 2500 + Math.random() * 1500), i * 60); }, trick: () => beep(660, .2, 'square', .05, 1320),
    chomp: () => { if (!real('chomp', .7)) beep(180, .2, 'square', .08, 90); }, fanfare: () => [392, 523, 659, 784, 1046, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, i > 4 ? .5 : .2, 'square', .07), i * 160))};
  // Samba-Rennmusik: Surdo, Tamborim, Ganzá, Agogô, Bass (Lookahead-Planer, 16tel); Tempo/Tonart je Strecke
  const MUS = {on: false, next: 0, step: 0, fast: false};
  function musTick() {
    if (!AC || !SOUND || !MUS.on || AC.state !== 'running') return;
    const m = T.music || {bpm: 128, root: 1}, sp = 60 / (m.bpm * (MUS.fast ? 1.1 : 1)) / 4;
    if (MUS.next < AC.currentTime) MUS.next = AC.currentTime + .05;
    while (MUS.next < AC.currentTime + .2) { musNote(MUS.step, MUS.next, m.root); MUS.next += sp; MUS.step++; }
  }
  function musNote(s, t, rt) {
    const i = s % 16, bar = (s >> 4) % 4, a = AC, st = (T.music || {}).style || 'samba';
    const tone = (f, d, type, v, f2) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(MG); o.start(t); o.stop(t + d + .02); };
    const root0 = [110, 146.8, 164.8, 146.8][bar] * rt, pent = [1, 1.125, 1.25, 1.5, 1.667, 2];
    if (st === 'bossa') {   // Bossa Nova: Clave, weicher Bass, Akkord-Tupfer
      if ([0, 3, 6, 10, 13].includes(i)) noise(.03, .07, 0, t, MG, 3200); if (i === 0 || i === 8) tone(70, .25, 'sine', .35, 45);
      if ([0, 6, 8, 14].includes(i)) tone(i % 8 ? root0 * 1.5 : root0, .3, 'triangle', .14); if (i === 3 || i === 10) [1, 1.26, 1.5].forEach(m => tone(root0 * 2 * m, .25, 'triangle', .03));
      noise(.02, .012, 7000, t, MG); if (MUS.fast && i % 4 === 0) tone(root0 * 4 * pent[(s >> 2) % 6], .12, 'triangle', .03); return; }
    if (st === 'forro') {   // Forró: Zabumba, Triangel, Akkordeon-Melodie
      if (i === 0 || i === 6) tone(65, .28, 'sine', .5, 40); if (i === 8) tone(90, .12, 'sine', .25);
      noise(.03, i % 4 === 2 ? .06 : .025, 0, t, MG, 8000); if (i % 2 === 0) tone(root0 * 2 * pent[(s * 7 >> 2) % 6], .14, 'sawtooth', .025);
      if ([0, 8].includes(i)) tone(root0, .3, 'triangle', .15); return; }
    if (st === 'axe') {   // Axé: gerade Bass-Drum, Timbal, schneller Bass
      if (i % 4 === 0) tone(80, .2, 'sine', .55, 45); if (i === 4 || i === 12) noise(.08, .1, 1200, t, MG); if (i % 2) noise(.03, .04, 0, t, MG, 5000);
      if (i % 2 === 0) tone(i % 4 ? root0 * 1.5 : root0, .12, 'triangle', .14); if (i % 4 === 2) tone(root0 * 3 * pent[(s >> 2) % 6], .1, 'square', .02); return; }
    if (st === 'funk') {   // Funk carioca (Tamborzão) für São Paulo
      if ([0, 3, 7, 10].includes(i)) tone(60, .3, 'sine', .6, 38); if (i === 4 || i === 12) noise(.06, .11, 900, t, MG); if ([2, 6, 11, 14].includes(i)) noise(.03, .05, 0, t, MG, 2500);
      if (i === 0 || i === 8) tone(root0 / 2, .4, 'sawtooth', .07, root0 / 3); return; }
    if (st === 'epic') {   // Bergfahrt: Pauken, Bläser-Stiche, Streicher-Fläche
      if (i === 0 || i === 8) tone(55, .5, 'sine', .55, 40); if (i === 14 || i === 15) tone(60, .1, 'sine', .25);
      if (i === 0 && bar % 2 === 0) [1, 1.5, 2].forEach(m => tone(root0 * m, .7, 'sawtooth', .03)); if (i === 12) tone(root0 * 2, .2, 'square', .03); noise(.02, .012, 6000, t, MG); return; }
    if (st === 'forest') {   // Regenwald: Toms, Schüttelrohr, Vogelrufe
      if ([0, 5, 10].includes(i)) tone([90, 120, 75][i % 3], .25, 'sine', .4, 60); if (i % 2) noise(.04, .03, 0, t, MG, 4500);
      if (i === 7 && (s >> 4) % 2) tone(1800, .15, 'sine', .03, 2600); if (i === 0) tone(root0, .5, 'triangle', .1); return; }
    if (i === 0 || i === 8) tone(i ? 75 : 95, .35, 'sine', i ? .55 : .3, 45);               // Surdo
    if ([0, 2, 3, 5, 6, 8, 10, 11, 13, 14].includes(i)) noise(.04, i % 4 === 2 ? .09 : .05, 0, t, MG, 4200);   // Tamborim
    noise(.03, i % 2 ? .035 : .018, 6000, t, MG);                                              // Ganzá
    const ag = {0: 1, 3: 0, 6: 1, 8: 0, 10: 1, 12: 0, 14: 1}; if (i in ag && (s >> 4) % 2 === 0) tone((ag[i] ? 920 : 690) * rt, .12, 'square', .03);   // Agogô
    const root = [110, 146.8, 164.8, 146.8][bar] * rt; if ([0, 3, 6, 8, 11, 14].includes(i)) tone(i === 6 || i === 14 ? root * 1.5 : root, .18, 'triangle', .16);   // Bass
    if (MUS.fast && i % 4 === 2) tone(root * 4, .1, 'square', .025);
  }
  // Ansager: ein Satz gleichzeitig, Musik wird leiser
  let annBusy = 0, annLast = {}, banner = null;
  function say(key, text, prio) {
    const now = performance.now();
    if (!prio && (now < annBusy || now - (annLast[key] || 0) < 7000)) return;
    annLast[key] = now; banner = {t: text, until: now + 2400};
    const v = TRIP.kartvo && TRIP.kartvo[key], buf = v && (v.f === 5 ? BUF.ann5 : v.f === 4 ? BUF.ann4 : v.f === 3 ? BUF.ann3 : v.f === 2 ? BUF.ann2 : BUF.ann);
    if (ANN && v && buf && AC && SOUND) { const d = v.dur / 1000; playBuf(buf, v.o / 1000, d, 1.1); annBusy = now + d * 1000 + 300;
      if (MG) { MG.gain.setTargetAtTime(.22, AC.currentTime, .05); MG.gain.setTargetAtTime(.5, AC.currentTime + d, .3); } }
    else annBusy = now + 1500;
  }

  // persönliche Sprüche mit den Serien-Stimmen (v_<id>_over/hit/sp), Sprechblase am Fahrzeug
  let voiceBusy = 0;
  const VTXT = {jonas: ['Tschüss, das buche ich um!', 'Das kommt auf Splitwise!', 'Rechnung kommt!'], simon: ['Bis später, Jungs!', 'Aua, mein Sonnenbrand!', 'Achtung, ich leuchte!'],
    patrick: ['Rollstuhl hat Vorfahrt!', 'Mein Rücken!', 'Rollstuhl-Boarding!'], marco: ['Fernschuss, Baby!', 'Wer war das?', 'Aus der eigenen Hälfte!'],
    greisel: ['Passt scho!', 'Kitzelt bloß!', 'Prost, Burschen!'], dajo: ['Ich muss nachfüllen!', 'Das war Absicht!', 'Snacks für alle!']};
  // weitere Sprüche je Fahrer (Stimmen in audio/kart5.mp3): Sieg, Drift, Item-Treffer, Überholen (Variante)
  const VTXT2 = {jonas: {win: 'Pokal! Und die Prämie kommt nicht auf Splitwise!', drift: 'Fischerhut festhalten!', item: 'Wer war das? Das wird abgerechnet!', pass: 'Sorry, ich hab es eilig!'},
    simon: {win: 'Sieg! Ich leuchte vor Freude!', drift: 'Wuhuu, Fahrtwind auf dem Sonnenbrand!', item: 'Schon wieder ich?!', pass: 'Tschüss, ihr Schnecken!'},
    patrick: {win: 'Der alte Mann gewinnt! Wer hätte das gedacht?', drift: 'Achtung, mein Rücken!', item: 'Ich bin zu alt für sowas!', pass: 'Platz da, Senioren haben Vorfahrt!'},
    marco: {win: 'Hab ich doch gesagt, ich bin der Schnellste!', drift: 'Das ist meine Fernschuss-Kurve!', item: 'Aua! Das war ein Foul!', pass: 'Ciao ciao!'},
    greisel: {win: 'Prost! Die Runde geht auf mich!', drift: 'Hoppla, das Weißbier schwappt!', item: 'Mein Bier! Mein schönes Bier!', pass: 'Servus, bis später!'},
    dajo: {win: 'Sieg! Und jetzt gibt es Snacks für alle!', drift: 'Huiii, festhalten!', item: 'Hey! Das war gemein!', pass: 'Entschuldigung, darf ich mal vorbei?'}};
  const bufOf = v => v && BUF['ann' + (v.f > 1 ? v.f : '')];
  function voice(k, kind, force) {
    const now = performance.now(); if (!S || (!force && (now < voiceBusy || now < annBusy))) return;
    if (kind === 'over' && Math.random() < .5 && TRIP.kartvo && TRIP.kartvo['v_' + k.id + '_pass']) kind = 'pass';
    const txt = {over: 0, hit: 1, sp: 2}[kind] !== undefined ? (VTXT[k.id] || [])[{over: 0, hit: 1, sp: 2}[kind]] : (VTXT2[k.id] || {})[kind]; if (!txt) return; k.say = txt; k.sayT = 1.8; voiceBusy = now + 2600;
    const v = TRIP.kartvo && TRIP.kartvo['v_' + k.id + '_' + kind], vb = bufOf(v);
    if (v && vb && AC && SOUND) { playBuf(vb, v.o / 1000, v.dur / 1000, 1.05); if (MG) { MG.gain.setTargetAtTime(.25, AC.currentTime, .05); MG.gain.setTargetAtTime(.5, AC.currentTime + v.dur / 1000, .3); } }
  }

  /* ---- Tages-Challenge (Stufe 4): jeden Tag eine Strecke mit Sonderregel, gleich für alle ---- */
  const RULES = [{k: 'night', e: '🌙', n: 'Nachtfahrt', x: 'nur dein Scheinwerfer leuchtet'}, {k: 'rev', e: '🔄', n: 'Rückwärts', x: 'Strecke in Gegenrichtung'},
    {k: 'slip', e: '🧊', n: 'Rutschpartie', x: 'alles rutschig wie Iguaçu im Regen'}, {k: 'turbo', e: '🍹', n: 'Caipi-Wahnsinn', x: 'aus jeder Kiste ein Turbo'},
    {k: 'coati', e: '🦝', n: 'Nasenbär-Chaos', x: 'Nasenbären überall, alle Items sind Nasenbären'}, {k: 'mirror', e: '🪞', n: 'Spiegelverkehrt', x: 'links ist rechts'}];
  const dayKey = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
  function daily() { const d = dayKey(); let h = 7; for (const c of d) h = (h * 31 + c.charCodeAt(0)) % 100003; return {d, track: TRACKS[h % TRACKS.length], rule: RULES[(h >> 3) % RULES.length]}; }
  let RULE = null;   // aktive Sonderregel (nur in der Tages-Challenge)
  /* ---- Crew-Bestenliste und Geister (db: kartbest/<strecke>__<person>, kartghost/<…>, kartdaily/<datum>__<person>; schreiben nur mit Schreibrecht) ---- */
  let LB = {}, LBD = {}, WR = false, DB = null;
  const player = () => ME || me;   // wer am Handy spielt („Ich bin …“), sonst der gewählte Fahrer
  function lbInit() {
    if (DB !== null) return; DB = false;
    getDb().then(db => { if (!db) return; DB = db;
      db.collection('kartbest').onSnapshot(sn => { LB = {}; sn.docs.forEach(d => { if (d.exists) LB[d.id] = d.data(); }); board(); if (!box.hidden && !menu.hidden) renderMenu(); }, () => {});
      try { window.claude.use('user').then(u => u && u.id ? u.id().then(id => { UID = id || null; ACC = u; accSync(); }) : null).catch(() => {}); } catch (e) {}
      db.collection('kartusers').onSnapshot(sn => { USERS = {}; sn.docs.forEach(d => { if (d.exists) USERS[d.id] = d.data().who; }); accSync(); board(); }, () => {});
      db.collection('kartprog').onSnapshot(sn => { PROG = {}; sn.docs.forEach(d => { if (d.exists) PROG[d.id] = d.data(); }); progOn = true; progSync(true); }, () => {});
      db.collection('kartlive').onSnapshot(sn => { LIVEST = []; sn.docs.forEach(d => { if (d.exists) LIVEST.push(d.data()); }); if (!box.hidden && !menu.hidden && MODE === 'live') liveBox(); }, () => {});
      db.collection('kartdaily').onSnapshot(sn => { LBD = {}; sn.docs.forEach(d => { if (d.exists) LBD[d.id] = d.data(); }); if (!box.hidden && !menu.hidden) renderMenu(); }, () => {});
    }).catch(() => {});
    canWrite().then(w => { WR = w !== false && w !== null; progWR = WR; progSync(true); if (!box.hidden && !menu.hidden) renderMenu(); }).catch(() => {});
  }
  const lbList = (src, pre) => Object.entries(src).filter(([id]) => id.indexOf(pre + '__') === 0).map(([, v]) => v).filter(v => v && v.ms).sort((a, b) => a.ms - b.ms);
  function lbHtml(list, title) {
    if (!list.length) return '<p class="kr-lb-t">' + title + '</p><p class="kr-lb-e">Noch keine Zeit eingetragen. Sei der Erste!</p>';
    return '<p class="kr-lb-t">' + title + '</p><ol class="kr-lb-l">' + list.slice(0, 6).map((v, i) => '<li' + (v.who === player() ? ' class="me"' : '') + '>' +
      '<span>' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(NAME(v.who)) + '<small class="kr-by">' + esc(byline(v)) + '</small></span><i>' + fmt(v.ms) + '</i></li>').join('') + '</ol>';
  }
  // Bestenliste: nur unter der echten Person speichern („Ich bin …“); ohne Wahl wird nach dem Rennen gefragt
  let PEND = null, UID = null, ACC = null, USERS = {}, PNAME = {};
  const devName = () => { const u = navigator.userAgent || ''; return /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Gerät'; };
  // Konto ↔ Person: Ein Konto gehört fest zu einer Person (gilt auf jedem Handy, auf dem man angemeldet ist)
  function accSync() { if (!UID || !DB) return; const mapped = USERS[UID];
    if (mapped && mapped !== ME && !ME) setMe(mapped);
    else if (ME && mapped !== ME && WR) { USERS[UID] = ME; DB.doc('kartusers/' + UID).set({who: ME, ts: Date.now()}).catch(() => {}); }
    const ids = Object.values(LB).map(v => v.uid).filter(x => x && !(x in PNAME)); if (ACC && ACC.profiles && ids.length) { ids.forEach(x => { PNAME[x] = ''; });
      ACC.profiles(ids).then(ps => { ids.forEach(x => { const n = ps && ps[x] && ps[x].name; PNAME[x] = n ? n.split(' ')[0] : ''; }); board(); if (!box.hidden && !menu.hidden) renderMenu(); }).catch(() => {}); } }
  // „Wer hat es gefahren?“: Person, gefahrene Figur, Konto, Gerät, Zeitpunkt
  const when = ts => { if (!ts) return ''; const d = new Date(ts); return d.getDate() + '.' + (d.getMonth() + 1) + '. ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function byline(v) { const p = [];
    if (v.drv && v.drv !== v.who) p.push('als ' + NAME(v.drv));
    if (v.uid) p.push('✓ Konto' + (PNAME[v.uid] ? ' ' + PNAME[v.uid] : '') + (USERS[v.uid] && USERS[v.uid] !== v.who ? ' (gehört ' + NAME(USERS[v.uid]) + ')' : '')); else p.push('❓ ohne Konto-Zuordnung');
    if (v.dev) p.push(v.dev); if (v.ts) p.push(when(v.ts)); return p.join(' · '); }
  function saveLB(pd) { const who = ME; if (!who || !DB) return;
    if (pd.kind === 'best') { const id = pd.track + '__' + who, old = LB[id]; if (old && old.ms <= pd.ms) return; const doc = {track: pd.track, who, drv: pd.drv, veh: pd.veh, ms: pd.ms, ts: Date.now(), uid: UID, dev: devName()};
      DB.doc('kartbest/' + id).set(doc).catch(() => {}); DB.doc('kartghost/' + id).set({g: pd.g, ms: pd.ms}).catch(() => {}); LB[id] = doc; }
    else { const id = pd.d + '__' + who, old = LBD[id]; if (old && old.ms <= pd.ms) return; const doc = {d: pd.d, who, drv: pd.drv, ms: pd.ms, ts: Date.now(), uid: UID, dev: devName()}; DB.doc('kartdaily/' + id).set(doc).catch(() => {}); LBD[id] = doc; } }
  /* ---- Fortschritt am Konto (db kartprog/<person>): Münzen, Tuning, Kostüme, Lack, Aufkleber, Erfolge, Statistik, eigene Bestzeiten.
     Gilt auf jedem Handy, auf dem die Person „Ich bin …“ gewählt hat. Zusammenführen: Gekauftes/Erreichtes wird vereinigt (Maximum),
     Bestzeiten Minimum, Auswahl (Fahrzeug, Kostüm, Lack, Rivale) = neuester Stand, Münzen als Zähler (Änderung seit dem letzten Abgleich). ---- */
  const PROGK = /^kart(Coins|Tune|Cos|CosOwn|Ach|Stats|Cups|Paint|StkOwn|TutDone|Rival|Veh|Best|Lap\..+|Sec\..+)$/, PREFK = /^kart(Cos|Paint|Rival|Veh)$/, TIMEK = /^kart(Best|Lap\.|Sec\.)/;
  let PROG = {}, progOn = false, progMute = false, progT = 0, progWR = false;
  const pj = s0 => { try { return JSON.parse(s0); } catch (e) { return null; } };
  const progKeys = () => { try { return Object.keys(localStorage).filter(k => k.indexOf('br26.') === 0 && PROGK.test(k.slice(5))).map(k => k.slice(5)); } catch (e) { return []; } };
  const progLocal = () => { const o = {}; progKeys().forEach(k => { const v = store.get(k); if (v !== null && v !== '') o[k] = v; }); return o; };
  function progWrite(o) { progMute = true; try { progKeys().forEach(k => { if (!(k in o)) localStorage.removeItem('br26.' + k); }); Object.entries(o).forEach(([k, v]) => store.set(k, v)); } finally { progMute = false; } }
  function deep(x, y, f) { if (typeof x === 'number' && typeof y === 'number') return f(x, y);
    if (Array.isArray(x) && Array.isArray(y)) return Array.from({length: Math.max(x.length, y.length)}, (_, i) => x[i] == null ? y[i] : y[i] == null ? x[i] : deep(x[i], y[i], f));
    if (x && y && typeof x === 'object' && typeof y === 'object') { const o = Object.assign({}, y, x); Object.keys(y).forEach(k => { if (k in x) o[k] = deep(x[k], y[k], f); }); return o; }
    return x == null ? y : x; }
  function progMerge(loc, rem, localNewer) { const o = Object.assign({}, rem, loc);
    Object.keys(rem).forEach(k => { if (!(k in loc) || k === 'kartCoins') return;
      if (PREFK.test(k)) { if (!localNewer) o[k] = rem[k]; return; }
      const x = pj(loc[k]), y = pj(rem[k]); if (x === null || y === null) return;
      o[k] = typeof x === 'object' || typeof y === 'object' ? JSON.stringify(deep(x, y, TIMEK.test(k) ? Math.min : k === 'kartAch' ? Math.min : Math.max)) : String(TIMEK.test(k) ? Math.min(x, y) : Math.max(x, y)); });
    return o; }
  // Handy wechselt die Person: Stand der bisherigen Person auf dem Handy zur Seite legen, Stand der neuen holen
  function progOwner() { const own = store.get('kartProgOwner'); if (!ME || own === ME) return; progMute = true;
    try { if (own) localStorage.setItem('br26.kartProgBak.' + own, JSON.stringify({p: progLocal(), b: store.get('kartCoinsBase'), lt: store.get('kartProgLT')}));
      const bak = own ? pj(localStorage.getItem('br26.kartProgBak.' + ME)) : null;
      if (own) { progWrite(bak ? bak.p : {}); progMute = true; store.set('kartCoinsBase', bak && bak.b || ''); store.set('kartProgLT', bak && bak.lt || ''); }
      store.set('kartProgOwner', ME); } catch (e) {} finally { progMute = false; } HEADC = {}; }
  let progBusy = false;
  function progSync(push) { if (!ME || !progOn || progBusy) return; progBusy = true; try { progSync0(push); } finally { progBusy = false; } }
  function progSync0(push) { progOwner();
    const rd = PROG[ME] || null, rem = Object.assign({}, rd && rd.p || {}); if (rd && rd.r !== (TRIP.kartReset || '')) Object.keys(rem).forEach(k => { if (TIMEK.test(k)) delete rem[k]; });
    const loc = progLocal(), lt = +store.get('kartProgLT') || 0, m = progMerge(loc, rem, lt > (rd && rd.ts || 0));
    const rc = +(rem.kartCoins || 0), base = +(store.get('kartCoinsBase') || 0), lc = +(loc.kartCoins || 0); m.kartCoins = String(Math.max(0, rc + lc - base));
    progWrite(m); progMute = true; store.set('kartCoinsBase', String(rc)); progMute = false;
    if (JSON.stringify(loc) !== JSON.stringify(m)) { HEADC = {}; try { teaser(); } catch (e) {} if (!box.hidden && !menu.hidden) renderMenu(); }
    const diff = Object.keys(m).some(k => m[k] !== rem[k]) || Object.keys(rem).some(k => !(k in m)) || !rd || rd.r !== (TRIP.kartReset || '');
    if (push && diff && progWR && DB) { const doc = {p: m, ts: Date.now(), r: TRIP.kartReset || '', uid: UID, dev: devName()}; PROG[ME] = doc;
      progMute = true; store.set('kartCoinsBase', m.kartCoins); progMute = false; DB.doc('kartprog/' + ME).set(doc).catch(() => {}); } }
  store.onSet = k => { if (progMute || !PROGK.test(k)) return; progMute = true; store.set('kartProgLT', String(Date.now())); progMute = false;
    clearTimeout(progT); progT = setTimeout(() => progSync(true), 2500); };
  const progLine = () => !ME ? '☁️ Wähle „Wer spielt?“, dann gelten Münzen, Garage und Erfolge auf jedem Handy.' : progWR ? '☁️ Fortschritt von ' + esc(NAME(ME)) + ' wird am Konto gespeichert und gilt auf jedem Handy.' : '📱 Fortschritt nur auf diesem Handy (Speichern am Konto nur für Eingeladene).';
  function setMe(id) { ME = id; store.set('me', id); setTimeout(accSync, 0); setTimeout(() => progSync(true), 0);
    try { const g = Object.keys(GROUP_IDS).find(k => GROUP_IDS[k].includes(id)); if (g && typeof setGroup === 'function') setGroup(g); meMark(); renderMe(); } catch (e) {}
    if (PEND) { saveLB(PEND); PEND = null; const w = res.querySelector('.kr-who'); if (w) { w.innerHTML = '<p>✅ Gespeichert als <b>' + esc(NAME(id)) + '</b>. Ab jetzt merkt sich dieses Handy, wer spielt.</p>'; } }
    if (!box.hidden && !menu.hidden) renderMenu(); }
  const whoHtml = txt => '<div class="kr-who"><p>' + txt + '</p><div class="kr-pick kr-whop">' + CREW.map(p => '<button type="button" data-who="' + p.id + '" aria-label="' + esc(p.name) + '"><span class="kr-wh" data-h="' + p.id + '"></span><span>' + esc(p.name) + '</span></button>').join('') + '</div></div>';
  const whoHeads = el => el.querySelectorAll('.kr-wh').forEach(x => x.replaceWith(headCv(x.dataset.h, 92)));
  // Crew-Rekorde aller Strecken
  function recsHtml() { const rows = TRACKS.map(tr => ({tr, top: lbList(LB, tr.id)[0]})), cnt = {};
    rows.forEach(r => { if (r.top) cnt[r.top.who] = (cnt[r.top.who] || 0) + 1; });
    const king = Object.entries(cnt).sort((x, y) => y[1] - x[1]);
    return '<p class="kr-rk">' + (king.length ? '👑 ' + king.map(([id, n]) => esc(NAME(id)) + ' ' + n).join(' · ') : 'Noch kein Rekord, die Strecken warten!') + '</p><ul class="kr-recl">' + rows.map(r => '<li><button type="button" class="kr-rec" data-t="' + r.tr.id + '"><i>' + r.tr.e + '</i><b>' + esc(r.tr.name) + '</b>' +
      (r.top ? '<span' + (r.top.who === ME ? ' class="me"' : '') + '>' + esc(NAME(r.top.who)) + '</span><em>' + fmt(r.top.ms) + '</em>' : '<span class="no">frei</span><em>–</em>') + '</button></li>').join('') + '</ul>'; }

  /* ---- Live-Mehrspieler (room-Fähigkeit): Lobby im Raum „gringo-kart“, Positionen über presence, Start/Treffer/Effekte als Ereignisse auf Topic „kart“ ---- */
  const LIVE = {room: null, ok: null, peers: [], me: null, race: null, pending: null, sentAt: 0, buf: {}, lastN: {}, seq: 0, rdy: false, gp: null, autoAt: 0, emoAt: 0, pings: {}, rtt: {}, taunts: {}, cfg: null, tauntOpen: false};
  let LIVEST = [];   // gespeicherte Live-Rennen (db kartlive) für die Live-Bilanz
  async function liveJoin() {
    if (LIVE.room || LIVE.ok === false || LIVE.joining) return; LIVE.joining = 1;
    try { const r0 = window.claude && window.claude.use ? await window.claude.use('room') : null; if (!r0) { LIVE.ok = false; if (!box.hidden) renderMenu(); return; }
      const r = await r0.join('gringo-kart'); LIVE.room = r; LIVE.ok = true;
      r.onPeers(ch => { LIVE.peers = ch.peers; const mine = ch.peers.find(p0 => p0.sameTab); if (mine) LIVE.me = mine.peer; liveRecv(ch.peers); const sig = JSON.stringify(lobby().map(p0 => [p0.peer, p0.presence.who, p0.presence.drv, p0.presence.rdy, p0.presence.trk, p0.presence.gpv, (p0.presence.cfg || {}).ts])); liveAuto();
        if (sig !== LIVE.sig) { LIVE.sig = sig; if (!box.hidden && !menu.hidden && MODE === 'live') renderMenu(); } }, () => { LIVE.ok = false; });
      r.on('kart', liveMsg, () => {}); livePres();
    } catch (e) { LIVE.ok = false; if (!box.hidden && !menu.hidden) renderMenu(); } finally { LIVE.joining = 0; } }
  function livePres(extra) { if (!LIVE.room) return; const base = {who: ME || me, drv: me, veh: myVeh(), cos: cosOf(me), paint: paintOf(me), lob: !box.hidden && MODE === 'live' && !LIVE.race, rdy: LIVE.rdy && !LIVE.race ? 1 : 0, trk: TRK, gpv: store.get('kartLiveGP') === '1' ? 1 : 0, cfg: LIVE.cfg || undefined};
    const o = Object.assign(base, extra || {race: null}), j = JSON.stringify(o); if (j === LIVE.lastPres) return; LIVE.lastPres = j; LIVE.room.presence(o).catch(() => {}); }
  const lobby = () => LIVE.peers.filter(p0 => p0.presence && p0.presence.lob && p0.kind === 'viewer');
  const liveEmit = d => { if (LIVE.room) LIVE.room.emit('kart', d).catch(() => {}); };
  function liveMsg(m) { const d = m.data || {}; if (!d.t) return;
    if (d.t === 'start') { if (!LIVE.me || !(d.players || []).includes(LIVE.me) || LIVE.race || box.hidden) return; LIVE.pending = Object.assign({rt: performance.now()}, d); TRK = d.track; LIVE.rdy = false; LIVE.autoAt = 0;
      if (d.gp) { if (!LIVE.gp || LIVE.gp.id !== d.gp.id) LIVE.gp = {id: d.gp.id, list: d.gp.list, i: d.gp.i, pts: {}, nm: {}, seen: {}}; else LIVE.gp.i = d.gp.i; } else LIVE.gp = null; startRace(); return; }
    if (d.t === 'ping' && !m.sameTab) { liveEmit({t: 'pong', id: d.id, to: d.from, by: LIVE.me}); return; }
    if (d.t === 'pong' && d.to === LIVE.me) { const t0 = LIVE.pings[d.id]; if (t0) { const r = performance.now() - t0, o = LIVE.rtt[d.by]; LIVE.rtt[d.by] = o ? o * .6 + r * .4 : r; if (d.id[0] === 't') (LIVE.test || []).push([d.by, r]); if (!menu.hidden && MODE === 'live') liveBox(); } return; }
    if (d.t === 'taunt') { LIVE.taunts[m.sameTab ? LIVE.me : m.peer] = {txt: String(d.txt || '').slice(0, 160), until: performance.now() + 6000}; if (!m.sameTab) beep(990, .07, 'triangle', .05); if (!menu.hidden && MODE === 'live') { liveBox(); setTimeout(() => { if (!menu.hidden && MODE === 'live') liveBox(); }, 6100); } return; }
    if (d.t === 'rj' && !m.sameTab && S && S.live && S.live.id === d.race && !S.karts[0].done) { liveEmit({t: 'rjs', race: d.race, to: d.from, st: +S.t.toFixed(3)}); return; }
    if (d.t === 'rjs' && d.to === LIVE.me && LIVE.rjWait && LIVE.rjWait.race.id === d.race && !LIVE.race) { const sv = LIVE.rjWait; LIVE.rjWait = null; liveRejoinGo(sv, d.st); return; }
    if (d.t === 'cs' && !m.sameTab && S && S.live && S.live.id === d.race && d.to === LIVE.me) { liveEmit({t: 'csr', race: d.race, id: d.id, to: d.from, th: +S.t.toFixed(4)}); return; }
    if (d.t === 'csr' && d.to === LIVE.me && S && S.live && S.live.id === d.race) { liveClockReply(d); return; }
    if (!S || !LIVE.race || d.race !== LIVE.race.id) return; const k0 = S.karts[0];
    if (d.t === 'box' && !m.sameTab) { const b = S.boxes[d.i]; if (b) b.off = Math.max(b.off, 3); return; }
    if (d.t === 'bump' && d.to === LIVE.me && !k0.done) { const pu = clamp(d.p || 4, 2, 12); k0.x -= d.nx * pu; k0.y -= d.ny * pu; k0.vr -= (d.nx * -Math.sin(k0.a) + d.ny * Math.cos(k0.a)) * pu * 9; k0.v *= .97; if (!S.bumpT) { S.bumpT = .25; noise(.08, .1, 0, 0, 0, 900); vib(15); } return; }
    const tg = d.ai !== undefined && d.ai !== null ? S.karts.find(x => x.aiIdx === d.ai && !x.remote) : k0;
    if (d.t === 'hit' && d.to === LIVE.me && tg) { const o = S.karts.find(x => x.peer === m.peer && x.aiIdx === undefined); hit(tg, d.why); if (o && tg === k0) { k0.say = 'Das war ' + NAME(o.id) + '!'; k0.sayT = 1.4; } }
    if (d.t === 'fx' && d.to === LIVE.me && tg) { Object.assign(tg, d.f || {}); }
    if (d.t === 'emo') { const ek = m.sameTab ? k0 : S.karts.find(x => x.peer === m.peer && x.aiIdx === undefined); if (ek) { ek.emo = String(d.e || '').slice(0, 4); ek.emoU = performance.now() + 2400; } }
    if (d.t === 'oil' && !m.sameTab) S.oils.push({x: d.x, y: d.y, t: d.fire ? 6 : 12, by: null, beer: d.beer ? 1 : 0, fire: d.fire ? 1 : 0}); }
  // ferngesteuerte Karts: Position aus der presence, weich nachgeführt
  // Empfangene Positionen mit Empfangszeit puffern (eigene Uhr, unabhängig von der Uhrzeit der anderen Handys)
  function liveRecv(peers) { const tn = performance.now();
    peers.forEach(p0 => { const pr = p0.presence; if (!pr || !pr.race || pr.n === undefined || p0.sameTab) return; const sig = pr.race + '|' + pr.n, ln = LIVE.lastN[p0.peer]; if (ln === sig) return; if (ln && ln.split('|')[0] === pr.race && +ln.split('|')[1] > pr.n) return; LIVE.lastN[p0.peer] = sig;
      if (pr.rj && S && S.live && pr.race === S.live.id && pr.rj !== p0.peer) { const ok = S.karts.find(k => k.peer === pr.rj && k.aiIdx === undefined); if (ok) { ok.peer = p0.peer; ok.vkey = 'r:' + p0.peer; S.karts.forEach(k => { if (k.peer === pr.rj) k.peer = p0.peer; }); } S.live.players = (S.live.players || []).map(x => x === pr.rj ? p0.peer : x); if (S.live.curHost === pr.rj) S.live.curHost = p0.peer; }
      const b = LIVE.buf[p0.peer] || (LIVE.buf[p0.peer] = []); if (b.length && b[b.length - 1].race !== pr.race) b.length = 0; b.push({t: tn, race: pr.race, q: pr}); if (b.length > 16) b.shift(); }); }
  // Zustand eines fremden Karts etwas in der Vergangenheit (Puffer ≈ 1,7 Sendeabstände): zwischen zwei Meldungen weich überblenden, bei Lücken kurz vorausrechnen
  // Zustand eines fremden Karts JETZT: letzte Meldung + Vorhersage. Jede Meldung trägt die Rennzeit des Absenders (tm); da alle Rennuhren
  // gemeinsam laufen, ist S.t − st das Alter der Meldung (Netz-Laufzeit). So weit wird das Kart entlang der Strecke vorausgerechnet (auch in Kurven).
  const tdir = i => { const a = P[wrap(i)], b2 = P[wrap(i + 1)]; return Math.atan2(b2[1] - a[1], b2[0] - a[0]); };
  function liveSample(peer, conv) { const b = LIVE.buf[peer]; if (!b || !b.length || b[b.length - 1].race !== LIVE.race.id) return null;
    const now = performance.now(), lb = b[b.length - 1], last = conv(lb.q); if (!last) return null;
    const out = Object.assign({}, last, {age: now - lb.t}), st = lb.q.tm;
    // Alter der Meldung = Laufzeit übers Netz + seit dem Empfang vergangene Zeit (ohne st: geschätzt)
    const age = clamp((st !== undefined ? S.t - st : (now - lb.t) / 1000 + .08), 0, .8);
    if (last.done || last.sp || !(last.v > 5)) return out;
    if (last.lat !== undefined && Math.abs(last.lat) < TW && last.idx !== undefined) { const i2 = last.idx + last.v * age / 6, [x, y] = at(i2, last.lat); out.x = x; out.y = y; out.a = tdir(i2) + angd(last.a, tdir(last.idx)); }
    else { out.x += Math.cos(last.a) * last.v * age; out.y += Math.sin(last.a) * last.v * age; }
    return out; }
  // ferngesteuerte Karts: Position aus der presence, weich nachgeführt
  // Empfangene Positionen mit Empfangszeit puffern (eigene Uhr, unabhängig von der Uhrzeit der anderen Handys)
  function liveRecv(peers) { const tn = performance.now();
    peers.forEach(p0 => { const pr = p0.presence; if (!pr || !pr.race || pr.n === undefined || p0.sameTab) return; const sig = pr.race + '|' + pr.n, ln = LIVE.lastN[p0.peer]; if (ln === sig) return; if (ln && ln.split('|')[0] === pr.race && +ln.split('|')[1] > pr.n) return; LIVE.lastN[p0.peer] = sig;
      if (pr.rj && S && S.live && pr.race === S.live.id && pr.rj !== p0.peer) { const ok = S.karts.find(k => k.peer === pr.rj && k.aiIdx === undefined); if (ok) { ok.peer = p0.peer; ok.vkey = 'r:' + p0.peer; S.karts.forEach(k => { if (k.peer === pr.rj) k.peer = p0.peer; }); } S.live.players = (S.live.players || []).map(x => x === pr.rj ? p0.peer : x); if (S.live.curHost === pr.rj) S.live.curHost = p0.peer; }
      const b = LIVE.buf[p0.peer] || (LIVE.buf[p0.peer] = []); if (b.length && b[b.length - 1].race !== pr.race) b.length = 0; b.push({t: tn, race: pr.race, q: pr}); if (b.length > 16) b.shift(); }); }
  // ferngesteuerte Karts: Position aus der presence, weich nachgeführt
  function liveRemote(k, dt) { const conv = k.aiIdx !== undefined ? q => { const r0 = (q.ai || [])[k.aiIdx]; return r0 ? {x: r0[0], y: r0[1], a: r0[2], v: r0[3], lap: r0[4], idx: r0[5], done: r0[6], b: r0[7], sp: r0[8], lat: r0[9]} : null; } : q => q;
    const q = liveSample(k.peer, conv), stale = !q || (q.age > 6000 && !q.done);
    if (stale) { k.gone = (k.gone || 0) + dt; k.lagging = 1; if (k.gone > 6 && !k.done) { k.out = 1; k.lap = -5; } return; } k.gone = 0; k.out = 0; k.lagging = q.age > 1200 ? 1 : 0;
    if (k.x0 === undefined || Math.hypot(q.x - k.x, q.y - k.y) > 160) { k.x = q.x; k.y = q.y; k.a = q.a; } const f = Math.min(1, dt * 14); k.x += (q.x - k.x) * f; k.y += (q.y - k.y) * f; k.x0 = 1;
    k.a += angd(q.a, k.a) * f; k.v = q.v; k.lap = q.lap; k.idx = q.idx; k.lat = q.lat || 0; k.done = q.done || 0; k.boost = q.b ? .2 : 0; k.spin = q.sp ? .2 : 0; k.rot = q.sp ? k.rot + dt * 14 : 0; k.steer = q.st || 0; k.shield = q.sh ? 1 : 0; }
  function liveSend(k) { const now = performance.now(); if (now - LIVE.sentAt < 50) return; LIVE.sentAt = now;
    liveKeep(k); liveHostCheck();
    livePres({race: LIVE.race.id, rj: LIVE.race.rjFrom || undefined, n: ++LIVE.seq, tm: +S.t.toFixed(3), x: Math.round(k.x), y: Math.round(k.y), a: +k.a.toFixed(3), v: Math.round(k.v), lap: k.lap, idx: k.idx, lat: Math.round(k.lat), done: k.done ? +k.done.toFixed(3) : 0, b: k.boost > 0 ? 1 : 0, sp: k.spin > 0 ? 1 : 0, st: +k.steer.toFixed(2), sh: k.shield > 0 ? 1 : 0, ai: S.karts.filter(o => o.aiIdx !== undefined && !o.remote).map(o => [Math.round(o.x), Math.round(o.y), +o.a.toFixed(3), Math.round(o.v), o.lap, o.idx, o.done ? +o.done.toFixed(3) : 0, o.boost > 0 ? 1 : 0, o.spin > 0 ? 1 : 0, Math.round(o.lat)])}); }
  // Fahrschule: eine geführte Runde allein auf Guarujá
  const TUT = [{t: 'Lenken: links oder rechts halten (Analog: Daumen-Position).', ok: k => (S.tut.st = (S.tut.st || 0) + (Math.abs(k.steer) > .6 ? 1 / 60 : 0)) > .8},
    {t: 'Driften: in der Kurve doppelt tippen und halten, Funken sammeln, dann loslassen = Turbo!', ok: () => S.tutMini},
    {t: 'Bremsen: beide Seiten gleichzeitig halten.', ok: k => (S.tut.br = (S.tut.br || 0) + (k.brk ? 1 / 60 : 0)) > .4},
    {t: 'Fahr durch eine ?-Kiste (gelbe Würfel auf der Strecke).', ok: k => k.item || k.roll > 0},
    {t: 'Tippe unten auf ITEM, um es zu benutzen.', ok: () => S.tutUsed},
    {t: 'Pfeile auf der Strecke geben Turbo, auf der Schanze tippen = Trick. Fahr jetzt ins Ziel!', ok: () => false}];
  let TUTON = false;
  function tutStart() { TUTON = true; TRK = 'guaruja'; MODE = 'single'; startRace(); }
  // Strecken-Abstimmung: jeder Spieler in der Lobby stimmt mit seiner gewählten Strecke ab
  function liveVotes(lb) { const v = {}; lb.forEach(p0 => { const t = p0.presence.trk; if (TBY[t]) v[t] = (v[t] || 0) + 1; }); return Object.entries(v).sort((x, y) => y[1] - x[1]); }
  const liveLeader = lb => lb.map(p0 => p0.peer).sort()[0];
  function liveGo(auto) { const lb = lobby(); if (!LIVE.room || lb.length < 2) { toast('👥 Mindestens zwei Spieler müssen im Live-Raum sein.'); return; }
    const used = lb.map(p0 => p0.presence.drv || p0.presence.who), ai = store.get('kartLiveAI') === '0' ? [] : CREW.map(c => c.id).filter(id => !used.includes(id)).slice(0, Math.max(0, 6 - lb.length));
    const vs = liveVotes(lb), top = vs.filter(v => v[1] === (vs[0] || [0, 0])[1]).map(v => v[0]); let track = top.length ? pick(top) : TRK, gp = null;
    if (LIVE.gp && LIVE.gp.i < LIVE.gp.list.length - 1) { gp = {id: LIVE.gp.id, list: LIVE.gp.list, i: LIVE.gp.i + 1}; track = gp.list[gp.i]; }
    else if (lb.filter(p0 => p0.presence.gpv).length * 2 >= lb.length && lb.some(p0 => p0.presence.gpv)) { const rest = TRACKS.map(t => t.id).filter(t => t !== track).sort(() => Math.random() - .5); gp = {id: Date.now().toString(36), list: [track, rest[0], rest[1]], i: 0}; }
    liveEmit({t: 'start', id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), track, at: Date.now() + 4500, delay: 4500, players: lb.map(p0 => p0.peer), host: LIVE.me, ai, gp, auto: auto ? 1 : 0, seed: Math.random().toString(36).slice(2, 10), cfg: liveCfg()}); }
  // Auto-Start: sind alle in der Lobby (mindestens 2) bereit, startet das Rennen nach 3 s von selbst (gesendet vom „Anführer“ = kleinste Peer-Kennung)
  function liveAuto() { const lb = lobby(), all = lb.length >= 2 && lb.every(p0 => p0.presence.rdy);
    if (!all || LIVE.race || box.hidden || MODE !== 'live') { if (LIVE.autoAt) { LIVE.autoAt = 0; if (!menu.hidden) liveBox(); } return; }
    if (LIVE.autoAt) return; LIVE.autoAt = performance.now() + 3000; SFX.pick();
    const tick = () => { if (!LIVE.autoAt) return; if (!menu.hidden) liveBox(); if (performance.now() < LIVE.autoAt) { setTimeout(tick, 250); return; } LIVE.autoAt = 0;
      const lb2 = lobby(); if (lb2.length >= 2 && lb2.every(p0 => p0.presence.rdy) && liveLeader(lb2) === LIVE.me && !LIVE.race) liveGo(1); }; tick(); }
  // Live-Pokal: Punkte nach jedem Rennen (gleiche Reihenfolge auf allen Handys)
  function liveGpScore(order) { const g = LIVE.gp; if (!g || g.seen[S.live.id]) return; g.seen[S.live.id] = 1;
    order.forEach((k, i) => { const key = k.me ? 'p:' + LIVE.me : k.aiIdx !== undefined ? 'a:' + k.id : 'p:' + k.peer; g.nm[key] = k.aiIdx !== undefined ? '🤖 ' + NAME(k.id) : NAME(k.me ? (ME || me) : k.who || k.id); g.pts[key] = (g.pts[key] || 0) + (k.out ? 0 : PTS[i] || 0); }); }
  function liveSave(order) { try { localStorage.removeItem('br26.kartLiveRun'); } catch (e) {} if (!WR || !DB || !S.live || (S.live.curHost || S.live.host) !== LIVE.me) return;
    const res0 = order.map((k, i) => ({who: k.me ? (ME || me) : k.aiIdx !== undefined ? null : (k.who || k.id), drv: k.id, ai: k.aiIdx !== undefined ? 1 : 0, ms: k.done && !k.out ? Math.round(k.done * 1000) : null, pl: i + 1}));
    DB.doc('kartlive/' + S.live.id).set({ts: Date.now(), track: T.id, gp: LIVE.gp ? LIVE.gp.id : null, res: res0}).catch(() => {}); }
  function liveBilanz() { const w = {}, r = {}; LIVEST.forEach(d => (d.res || []).forEach(x => { if (!x.who || x.ai) return; r[x.who] = (r[x.who] || 0) + 1; const hum = d.res.filter(y => !y.ai && y.ms); if (hum.length && hum.sort((a, b) => a.ms - b.ms)[0] === x) w[x.who] = (w[x.who] || 0) + 1; }));
    const ids = Object.keys(r).sort((a, b) => (w[b] || 0) - (w[a] || 0) || r[b] - r[a]); if (!ids.length) return '';
    return '<p class="kr-live-b">📊 <b>Live-Bilanz</b> (' + LIVEST.length + ' Rennen): ' + ids.slice(0, 6).map((id, i) => (i === 0 && w[id] ? '👑 ' : '') + esc(NAME(id)) + ' ' + (w[id] || 0) + '/' + r[id]).join(' · ') + '</p>'; }
  function liveLeave() { if (LIVE.race) { LIVE.race = null; livePres(); } }
  // Uhrabgleich im Countdown: Rennuhr an die des Starters angleichen (hin und zurück messen, halbe Laufzeit, kürzeste Messung zählt)
  function liveClockSync() { const L = S && S.live; if (!L || !L.host || L.host === LIVE.me) return; L.cs = {sent: {}, best: null};
    for (let i = 0; i < 6; i++) setTimeout(() => { if (!S || S.live !== L) return; const id = Math.random().toString(36).slice(2, 7); L.cs.sent[id] = S.t; liveEmit({t: 'cs', race: L.id, id, from: LIVE.me, to: L.host}); }, 120 + i * 180); }
  function liveClockReply(d) { const L = S.live, cs = L.cs, tc = cs && cs.sent[d.id]; if (tc === undefined) return; delete cs.sent[d.id]; const tr = S.t, rtt = tr - tc;
    if (rtt < 0 || rtt > 2 || (cs.best && cs.best.rtt <= rtt)) return; const off = d.th + rtt / 2 - tr; cs.best = {rtt, off};
    if (Math.abs(off) > .008) { L.t0p -= off * 1000; S.t += off; } L.rtt = rtt; }
  // Gastgeber-Wechsel: fällt der Gastgeber (rechnet die Computer-Gegner) aus, übernimmt der nächste lebende Spieler (gleiche Regel auf allen Handys)
  function liveHostCheck() { const L = S.live; if (!L || !(L.ai || []).length || S.t < 3) return; const now = performance.now(); if (now - (LIVE.hcT || 0) < 500) return; LIVE.hcT = now;
    const alive = pr => pr === LIVE.me || (b => b && b.length && (now - b[b.length - 1].t < 3500 || b[b.length - 1].q.done))(LIVE.buf[pr]);
    const cur = L.curHost || L.host; if (alive(cur)) return; const nh = (L.players || []).slice().sort().find(alive); if (!nh || nh === cur) return; L.curHost = nh;
    S.karts.forEach(k => { if (k.aiIdx === undefined) return; if (nh === LIVE.me) { k.remote = 0; k.peer = null; k.out = 0; k.gone = 0; k.v = Math.max(k.v || 0, 120); } else { k.remote = 1; k.peer = nh; k.x0 = undefined; } });
    if (nh === LIVE.me) { floatTxt(S.karts[0], '🤖 Du lenkst jetzt die Computer-Gegner', '#bfe8ff'); } }
  // Wieder einsteigen: Stand des laufenden Rennens im Handy merken (Seite neu geladen / App abgestürzt)
  function liveKeep(k) { const now = performance.now(); if (now - (LIVE.keepT || 0) < 1000 || k.done) return; LIVE.keepT = now;
    try { localStorage.setItem('br26.kartLiveRun', JSON.stringify({ts: Date.now(), me: LIVE.me, race: Object.assign({}, LIVE.race, {rt: 0, t0p: 0}), k: {x: Math.round(k.x), y: Math.round(k.y), a: +k.a.toFixed(3), lap: k.lap, idx: k.idx, half: k.half, lapT0: k.lapT0, got: S.got}})); } catch (e) {} }
  const liveRun = () => { try { const v = JSON.parse(localStorage.getItem('br26.kartLiveRun') || 'null'); return v && Date.now() - v.ts < 12 * 60000 ? v : null; } catch (e) { return null; } };
  function liveRejoin() { const sv = liveRun(); if (!sv || !LIVE.room) return; LIVE.rjWait = sv; liveEmit({t: 'rj', race: sv.race.id, from: LIVE.me}); toast('🔄 Frage die anderen nach dem Rennstand …');
    setTimeout(() => { if (LIVE.rjWait === sv) { LIVE.rjWait = null; toast('😕 Das Rennen läuft nicht mehr.'); try { localStorage.removeItem('br26.kartLiveRun'); } catch (e) {} liveBox(); } }, 4000); }
  function liveRejoinGo(sv, st) { const r = Object.assign({}, sv.race); r.players = (r.players || []).map(x => x === sv.me ? LIVE.me : x); if (r.host === sv.me) r.host = r.players.filter(x => x !== LIVE.me).sort()[0] || LIVE.me; r.rjFrom = sv.me; r.rjK = sv.k;
    r.rt = performance.now(); r.delay = -st * 1000; LIVE.pending = r; TRK = r.track; LIVE.gp = null; LIVE.rdy = false; startRace(); }
  function liveRejoinRestore() { const r = S.live, kk = r && r.rjK; if (!kk) return; const k = S.karts[0]; Object.assign(k, {x: kk.x, y: kk.y, a: kk.a, mv: kk.a, lap: kk.lap, idx: kk.idx, half: kk.half, lapT0: kk.lapT0, v: 0}); S.got = kk.got || 0; S.camX = k.x; S.camY = k.y; S.camA = k.a; r.rjK = null; }
  // Ping: Laufzeit zu jedem Mitspieler (über den Live-Raum hin und zurück)
  function livePing(test) { if (!LIVE.room || !LIVE.me) return; const id = (test ? 't' : '') + Math.random().toString(36).slice(2, 8); LIVE.pings[id] = performance.now(); liveEmit({t: 'ping', id, from: LIVE.me}); }
  function liveTest() { LIVE.test = []; for (let i = 0; i < 6; i++) setTimeout(() => livePing(1), i * 350); setTimeout(() => { const by = {}; (LIVE.test || []).forEach(([p0, r]) => { (by[p0] = by[p0] || []).push(r); }); LIVE.test = null;
      const nm = p0 => NAME(((LIVE.peers.find(x => x.peer === p0) || {}).presence || {}).who || '?'), rows = Object.entries(by).map(([p0, a]) => { const av = a.reduce((x, y) => x + y, 0) / a.length, mx = Math.max(...a); return (av < 180 ? '🟢 ' : av < 400 ? '🟡 ' : '🔴 ') + esc(nm(p0)) + ': ' + Math.round(av) + ' ms (max ' + Math.round(mx) + ', ' + a.length + '/6)'; });
      toast('📶 <b>Verbindungstest</b><br>' + (rows.length ? rows.join('<br>') : 'Keine Antwort von den anderen 😬')); }, 3200); }
  const pingTag = p0 => { const r = LIVE.rtt[p0]; return r === undefined ? '' : (r < 180 ? '🟢' : r < 400 ? '🟡' : '🔴') + ' ' + Math.round(r) + ' ms'; };
  // Einstellungen für alle: jeder darf ändern, es gilt die zuletzt geänderte (presence.cfg mit Zeitstempel)
  const CFG0 = {laps: 0, items: 'all', diff: -1, storm: 'off', ev: 'on', ts: 0};
  function liveCfg() { let c = Object.assign({}, CFG0, LIVE.cfg || {}); lobby().forEach(p0 => { const x = p0.presence.cfg; if (x && x.ts > c.ts) c = Object.assign({}, CFG0, x); }); return c; }
  const cfgTxt = c => ({laps: '🔁 Runden: ' + (c.laps || 'Standard'), items: '🎁 Items: ' + {all: 'alle', turbo: 'nur 🍹 Turbo', off: 'aus'}[c.items], diff: '🤖 Gegner: ' + (c.diff < 0 ? 'je nach Gastgeber' : ['Leicht', 'Normal', 'Schwer'][c.diff]), storm: '⛈️ Gewitter: ' + {off: 'nie', rnd: 'Zufall', on: 'immer'}[c.storm], ev: '🎲 Ereignisse: ' + (c.ev === 'off' ? 'aus' : 'an')});
  function cfgStep(key) { const c = liveCfg(); if (key === 'laps') c.laps = (c.laps + 1) % 6; if (key === 'items') c.items = {all: 'turbo', turbo: 'off', off: 'all'}[c.items]; if (key === 'diff') c.diff = c.diff >= 2 ? -1 : c.diff + 1; if (key === 'storm') c.storm = {off: 'rnd', rnd: 'on', on: 'off'}[c.storm]; if (key === 'ev') c.ev = c.ev === 'off' ? 'on' : 'off';
    c.ts = Date.now(); LIVE.cfg = c; livePres(); liveBox(); }
  // Schnellsprüche in der Lobby (derb, schwarz, Crew war einverstanden); {n} = zufälliger Mitspieler
  const TAUNTS = ['{n}, ich fahr dich platter als deine letzte Beziehung.', 'Wer Letzter wird, zahlt die nächste Runde. Und die Beerdigung.', '{n} fährt, wie er trinkt: viel zu lang und am Ende gegen die Wand.',
    'Ich hab Nasenbären gesehen, die besser lenken als {n}.', 'Bremsen ist was für Leute mit Lebensversicherung.', 'Heute gewinnt nur einer. Der Rest sucht sich schon mal einen Grabstein aus.',
    'Ich überhol dich so knapp, {n}, das merkst du erst auf der Intensivstation.', '{n}, du bist so langsam, dein Kart hat schon Rente beantragt.', 'Wer Letzter wird, kotzt heute Abend als Erster.',
    'Nach dem Rennen kratzen wir {n} mit dem Spachtel von der Strecke.', 'Selbst der Kaiman hat {n} wieder ausgespuckt. Zu zäh, zu wenig Talent.', 'Mein Testament ist gemacht. Deins auch, {n}? Brauchst du gleich.',
    'Splitwise-Eintrag: Krankenwagen für {n}, durch sechs geteilt.', 'Keine Sorge, {n}, wir sagen deiner Mama, du warst tapfer.', 'Ich fahr heute nüchtern. Das wird für euch alle ein Albtraum.',
    '{n}, wenn du verlierst, darfst du dir aussuchen, welcher Nasenbär deine Asche verstreut.', 'Ich wollte fair fahren. Dann hab ich {n} gesehen und mich umentschieden.', 'Leg schon mal die Organspende-Karte aufs Armaturenbrett, {n}.'];
  function tauntSend(i) { const others = lobby().filter(p0 => p0.peer !== LIVE.me).map(p0 => NAME(p0.presence.who)), n = others.length ? pick(others) : 'Simon'; liveEmit({t: 'taunt', txt: TAUNTS[i].replace(/\{n\}/g, n)}); }

  function liveBox() { const el = menu.querySelector('.kr-live'); if (!el) return; el.hidden = MODE !== 'live'; if (MODE !== 'live') return; liveJoin();
    if (LIVE.ok === false) { el.innerHTML = '<p>📡 Live geht nur, wenn die Seite auf claude.ai mit deinem Konto offen ist (als Bearbeiter eingeladen).</p>'; return; }
    if (!LIVE.room) { el.innerHTML = '<p>📡 Verbinde mit dem Live-Raum …</p>'; return; }
    const lb = lobby(), nr = lb.filter(p0 => p0.presence.rdy).length, drvs = lb.map(p0 => p0.presence.drv), vs = liveVotes(lb), gpOn = store.get('kartLiveGP') === '1', g = LIVE.gp, gpRun = g && g.i < g.list.length - 1;
    const cd = LIVE.autoAt ? Math.max(0, Math.ceil((LIVE.autoAt - performance.now()) / 1000)) : 0;
    el.innerHTML = '<p class="kr-lbl">Im Live-Raum (' + lb.length + ') · ✅ ' + nr + ' bereit</p><div class="kr-pick kr-livep">' + lb.map(p0 => { const pr = p0.presence, dup = drvs.filter(x => x === pr.drv).length > 1;
        return '<span class="kr-lp' + (pr.rdy ? ' rdy' : '') + '"><span class="kr-lh" data-h="' + esc(String(pr.drv || pr.who)) + '"></span><span>' + esc(NAME(pr.who)) + (p0.sameTab ? ' (du)' : '') + '</span><small>' + (pr.rdy ? '✅' : '⏳') + ' ' + (TBY[pr.trk] ? TBY[pr.trk].e : '') + (dup ? ' ⚠️' : '') + '</small>' + (p0.sameTab ? '' : '<small class="kr-ping">' + pingTag(p0.peer) + '</small>') + '</span>'; }).join('') + '</div>' +
      (() => { const tn = performance.now(), tt = lb.map(p0 => [p0, LIVE.taunts[p0.peer]]).filter(([, t]) => t && t.until > tn); return tt.length ? '<div class="kr-taunts">' + tt.map(([p0, t]) => '<p><b>' + esc(NAME(p0.presence.who)) + ':</b> „' + esc(t.txt) + '“</p>').join('') + '</div>' : ''; })() +
      (liveRun() && LIVE.peers.some(p0 => p0.presence && p0.presence.race === liveRun().race.id) ? '<button type="button" class="kr-rjb">🔄 Zurück ins laufende Rennen (' + esc((TBY[liveRun().race.track] || {}).name || '') + ')</button>' : '') +
      (LIVE.autoAt ? '<p class="kr-live-cd">🚦 Alle bereit! Start in ' + cd + ' …</p>' : '') +
      '<div class="kr-live-btns"><button type="button" class="kr-rdy' + (LIVE.rdy ? ' on' : '') + '">' + (LIVE.rdy ? '✅ Bereit' : '⏳ Bereit?') + '</button><button type="button" class="kr-liveai">🤖 Gegner: ' + (store.get('kartLiveAI') === '0' ? 'aus' : 'an') + '</button><button type="button" class="kr-gpt' + (gpOn ? ' on' : '') + '">🏆 Pokal (3 Rennen): ' + (gpOn ? 'an' : 'aus') + '</button><button type="button" class="kr-tnt' + (LIVE.tauntOpen ? ' on' : '') + '">💬 Sprüche</button><button type="button" class="kr-ptest">📶 Verbindung testen</button></div>' +
      (LIVE.tauntOpen ? '<div class="kr-tlist">' + TAUNTS.map((t, i) => '<button type="button" data-tn="' + i + '">' + esc(t.replace(/\{n\}/g, '…')) + '</button>').join('') + '</div>' : '') +
      (() => { const c = liveCfg(), tx = cfgTxt(c); return '<p class="kr-lbl">Einstellungen für alle</p><div class="kr-live-btns kr-cfg">' + ['laps', 'items', 'diff', 'storm', 'ev'].map(k0 => '<button type="button" data-cfg="' + k0 + '">' + tx[k0] + '</button>').join('') + '</div>'; })() +
      (gpRun ? '<p class="kr-live-n">🏆 <b>Live-Pokal läuft:</b> nächstes Rennen ' + (g.i + 2) + '/' + g.list.length + ' ' + TBY[g.list[g.i + 1]].e + ' ' + esc(TBY[g.list[g.i + 1]].name) + ' · ' + Object.entries(g.pts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k0, v]) => esc(g.nm[k0]) + ' ' + v).join(' · ') + '</p>' :
        vs.length ? '<p class="kr-live-n">🗳️ Strecke: ' + vs.map(([t, n]) => TBY[t].e + ' ' + esc(TBY[t].name) + ' ' + n).join(' · ') + ' <i>(deine Stimme = gewählte Strecke unten)</i></p>' : '') +
      (drvs.some((x, i) => drvs.indexOf(x) !== i) ? '<p class="kr-live-n">⚠️ Zwei fahren mit derselben Figur. Geht, aber eine andere Figur ist übersichtlicher.</p>' : '') +
      '<p class="kr-live-n">' + (lb.length < 2 ? 'Warte auf Mitspieler: Die anderen öffnen Gringo Kart und wählen ebenfalls „👥 Live“.' : 'Sind alle ✅ bereit, startet das Rennen von selbst. Oder unten „Rennen starten“ (alle in der Lobby fahren mit).') + (gpOn && !gpRun ? ' Pokal: Mehrheit der Lobby muss ihn anhaben.' : '') + '</p>' + liveBilanz();
    el.querySelectorAll('.kr-lh').forEach(x => x.replaceWith(headCv(CREW.some(c => c.id === x.dataset.h) ? x.dataset.h : CREW[0].id, 92))); }
  const GHOST = {mode: store.get('kartGhost') || 'off'};   // off | mine | crew
  function ghostLocal(tid) { try { return JSON.parse(localStorage.getItem('br26.kartGhost.' + tid) || 'null'); } catch (e) { return null; } }
  function ghostProg(G) { if (!G || !G.g) return; let lap = -1, hint = -1, pi = null; G.prog = G.g.map(r => { const [i] = nearest(r[0], r[1], hint); hint = i; if (pi !== null && pi > N * .85 && i < N * .15) lap++; pi = i; return lap * N + i; }); }
  function ghostGap(pr) { const a0 = S.ghost && S.ghost.prog; if (!a0 || !a0.length) return null; let lo = 0, hi = a0.length - 1; if (pr > a0[hi]) return null;
    while (lo < hi) { const m = (lo + hi) >> 1; if (a0[m] < pr) lo = m + 1; else hi = m; } return S.t - lo * .1; }
  async function ghostFor(tid) {
    if (GHOST.mode === 'mine') { const g = ghostLocal(tid); return g ? {g: g.g, who: player(), drv: g.drv || me, ms: g.ms} : null; }
    if (GHOST.mode === 'crew') { const top = lbList(LB, tid)[0]; if (!top || !DB) return null;
      try { const sn = await DB.doc('kartghost/' + tid + '__' + top.who).get(); const v = sn && sn.exists ? sn.data() : null; return v && v.g ? {g: v.g, who: top.who, drv: top.drv || top.who, ms: top.ms} : null; } catch (e) { return null; } }
    return null;
  }

  /* ---- Rennen ---- */
  const box = document.getElementById('kart'), cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
  const menu = box.querySelector('.kr-menu'), res = box.querySelector('.kr-res'), itemBtn = box.querySelector('.kr-item'), sndBtn = box.querySelector('.kr-snd'), pm = box.querySelector('.kr-pm'), steerBtn = box.querySelector('.kr-steer'), annBtn = box.querySelector('.kr-ann');
  const STEERS = [['Sanft', 1.25], ['Mittel', 1.65], ['Stark', 2.2]]; let STEER = +(store.get('kartSteer') || 1); if (!STEERS[STEER]) STEER = 1;
  // Gegner-Stärke: Tempo-Spanne, Gummiband, wie genau die Ideallinie gefahren wird
  const DIFFS = [{n: 'Leicht', s: [.86, .92], rb: .45, line: .4}, {n: 'Normal', s: [.9, .97], rb: .33, line: .75}, {n: 'Schwer', s: [.96, 1.005], rb: .18, line: 1}];
  let DIFF = +(store.get('kartDiff') || 1); if (!DIFFS[DIFF]) DIFF = 1;
  const vib = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  let S = null, raf = 0, last = 0, me = ME || 'patrick', W = 0, H = 0, DPR = 1, MODE = ['cup', 'daily', 'live'].includes(store.get('kartMode')) ? store.get('kartMode') : 'single', TRK = TBY[store.get('kartTrack')] ? store.get('kartTrack') : 'copa', CUP = null;
  const loadJ = k => { try { return JSON.parse(store.get(k) || '{}'); } catch (e) { return {}; } };
  // Zurücksetzen aller Zeiten (Stichtag in trip.json → kartReset): lokale Bestzeiten, Rundenzeiten und eigene Geister einmalig löschen
  if (TRIP.kartReset && store.get('kartResetSeen') !== TRIP.kartReset) { try { Object.keys(localStorage).filter(k => /^br26\.(kart(Best$|Lap\.|Ghost\.|RecSeen$)|cache\.kart(best|ghost|daily)$)/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {} store.set('kartResetSeen', TRIP.kartReset); }
  const best = () => loadJ('kartBest');
  // Einstellungen: Steuerung (Halten/Analog), Grafik (Sparsam/Normal/Hoch), Kamera (Nah/Normal/Weit)
  const SET = Object.assign({ctl: 'hold', q: 1, cam: 1, tod: 'real'}, loadJ('kartSet')), saveSet = () => store.set('kartSet', JSON.stringify(SET));
  const stats = () => Object.assign({races: 0, wins: 0, ilha: 0, supers: 0, cups: 0, coinsTot: 0, rivals: 0, tracks: ''}, loadJ('kartStats'));
  const unlocked = v => !v.need || stats()[v.need[0]] >= v.need[1];
  const myVeh = () => { const v = VEHS.find(x => x.id === store.get('kartVeh')); return v && unlocked(v) ? v.id : 'kart'; };
  // Münzen (auf der Strecke + Bonus), Tuning, Kostüme, Erfolge: alles pro Handy
  const coins = () => +(store.get('kartCoins') || 0), addCoins = n => store.set('kartCoins', String(Math.max(0, coins() + n)));
  const TUNE = [{k: 'm', e: '⚙️', n: 'Motor', x: 'Höchsttempo'}, {k: 'r', e: '🛞', n: 'Reifen', x: 'Haftung + Lenkung'}, {k: 't', e: '🔥', n: 'Turbo', x: 'Turbos halten länger'}], TCOST = [15, 30, 50, 80, 120];
  // Tuning je Fahrzeug (alter Stand ohne Fahrzeug gehört zum Gringo-Kart)
  const tuneAll = () => { const o = loadJ('kartTune'); return 'm' in o ? {kart: o} : o; };
  const tuneOf = v => Object.assign({m: 0, r: 0, t: 0}, tuneAll()[v] || {}), tune = () => tuneOf(myVeh());
  const tuneSet = (v, x) => { const o = tuneAll(); o[v] = x; store.set('kartTune', JSON.stringify(o)); };
  const COS = [{id: '', e: '🚫', n: 'Ohne'}, {id: 'cap', e: '🧢', n: 'Cap', c: 20}, {id: 'sun', e: '🕶️', n: 'Sonnenbrille', c: 30, eye: 1}, {id: 'flower', e: '🌺', n: 'Blüte', c: 30, side: 1},
    {id: 'straw', e: '👒', n: 'Sonnenhut', c: 45}, {id: 'parrot', e: '🦜', n: 'Papagei', c: 70}, {id: 'top', e: '🎩', n: 'Zylinder', c: 90}, {id: 'pine', e: '🍍', n: 'Ananas', c: 120},
    {id: 'party', e: '🎉', n: 'Silvester-Hut', ach: 'reveillon'}, {id: 'crown', e: '👑', n: 'Krone', ach: 'cup'}, {id: 'halo', e: '😇', n: 'Heiligenschein', ach: 'cristo'}, {id: 'helmet', e: '⛑️', n: 'Helm', ach: 'nohit'},
    // Reise-Kostüme: werden erst an den echten Reisetagen frei (Datum Berlin)
    {id: 'fish', e: '🎣', n: 'Fischerhut', from: '2026-12-27', fl: 'ab Abflug 27.12.'}, {id: 'nye', e: '🤍', n: 'Silvester-Weiß', from: '2026-12-31', fl: 'ab Silvester'},
    {id: 'flag', e: '🇧🇷', n: 'Brasil-Stirnband', from: '2027-01-06', fl: 'ab 06.01., Crew komplett'}, {id: 'coatihat', e: '🦝', n: 'Nasenbär-Mütze', from: '2027-01-07', fl: 'ab Iguaçu 07.01.'},
    {id: 'net', e: '🦟', n: 'Moskitonetz', from: '2027-01-09', fl: 'ab Dschungel 09.01.'}];
  const ACH = [{id: 'combo', e: '💥', n: 'Erste Item-Kombo'}, {id: 'police', e: '👮', n: 'Brav durch die Polizeikontrolle'}, {id: 'first', e: '🏁', n: 'Erstes Rennen'}, {id: 'win', e: '🥇', n: 'Erster Sieg'}, {id: 'rocket', e: '🚀', n: 'Raketenstart'}, {id: 'trick', e: '🤸', n: 'Trick auf der Schanze'},
    {id: 'cut', e: '⤴', n: 'Abkürzung gefunden'}, {id: 'dolphin', e: '🐬', n: 'Delfin-Turbo'}, {id: 'nohit', e: '😇', n: 'Fehlerfrei', x: 'ein Rennen ohne Treffer'}, {id: 'super10', e: '🔥', n: 'Turbo-Junkie', x: '10 Super-Turbos'},
    {id: 'coins100', e: '🪙', n: 'Sparschwein', x: '100 Münzen gesammelt'}, {id: 'night', e: '🌙', n: 'Nachtfahrer', x: 'Rennen bei Nacht'}, {id: 'sp', e: '🏙️', n: 'Stau-Sieger', x: 'São Paulo gewinnen'},
    {id: 'reveillon', e: '🎆', n: 'Feliz Ano Novo', x: 'Réveillon gewinnen'}, {id: 'cristo', e: '⛰️', n: 'Gipfelstürmer', x: 'Cristo gewinnen'}, {id: 'all', e: '🗺️', n: 'Weltenbummler', x: 'alle Strecken gefahren'},
    {id: 'cup', e: '🏆', n: 'Pokalsieger', x: 'einen Grand Prix gewinnen'}, {id: 'rival5', e: '⚔️', n: 'Erzfeind', x: '5 Rivalen-Duelle gewonnen'}, {id: 'tuned', e: '🛠', n: 'Voll getunt', x: 'ein Teil auf Stufe 5'}];
  const achs = () => loadJ('kartAch'), hasAch = id => !!achs()[id];
  let toastT = 0;
  function toast(html) { const el = box.querySelector('.kr-toast'); el.innerHTML = html; el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }
  function ach(id) { const a0 = achs(); if (a0[id]) return; const A = ACH.find(x => x.id === id); if (!A) return; a0[id] = Date.now(); store.set('kartAch', JSON.stringify(a0)); addCoins(10);
    const cos = COS.find(c => c.ach === id); toast('🏅 <b>' + A.e + ' ' + esc(A.n) + '</b><br>+10 🪙' + (cos ? ' · Kostüm frei: ' + cos.e + ' ' + esc(cos.n) : '')); say('ach', 'Erfolg freigeschaltet!'); SFX.pick(); }
  const cosOf = id => (loadJ('kartCos')[id] || ''), cosOwn = () => { const o = loadJ('kartCosOwn'), dk = dayKey(); return c => !c.id || (c.from ? dk >= c.from : c.ach ? hasAch(c.ach) : !!o[c.id]); };
  let HEADC = {};
  function headImg(id) { const c = cosOf(id); if (!c) return HEAD[id]; const key = id + c; if (HEADC[key]) return HEADC[key]; const C = COS.find(x => x.id === c), h = HEAD[id]; if (!C || !h) return h;
    return HEADC[key] = sprite(h.width + 60, h.height + 120, (x, w, hh) => { x.drawImage(h, 30, 60); const R = h.width / 2;
      if (C.id === 'fish') { x.fillStyle = '#7a7a45'; x.beginPath(); x.ellipse(w / 2, 62, R * .95, 16, 0, 0, TAU); x.fill(); x.fillStyle = '#8c8c52'; x.beginPath(); x.ellipse(w / 2, 46, R * .62, 26, 0, Math.PI, 0); x.fill(); x.fillRect(w / 2 - R * .62, 44, R * 1.24, 18); x.strokeStyle = '#5a5a30'; x.lineWidth = 4; x.beginPath(); x.moveTo(w / 2 - R * .62, 58); x.lineTo(w / 2 + R * .62, 58); x.stroke(); return; }
      if (C.id === 'nye') { x.fillStyle = '#fff'; x.strokeStyle = '#d4af37'; x.lineWidth = 4; x.beginPath(); x.moveTo(w / 2 - 34, 66); x.lineTo(w / 2, 8); x.lineTo(w / 2 + 34, 66); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#d4af37'; x.font = '900 15px system-ui'; x.textAlign = 'center'; x.fillText('2027', w / 2, 56); x.beginPath(); x.arc(w / 2, 8, 7, 0, TAU); x.fill(); return; }
      if (C.id === 'flag') { x.save(); x.beginPath(); x.rect(30, 66, w - 60, 20); x.clip(); x.fillStyle = '#009c3b'; x.fillRect(0, 66, w, 20); x.fillStyle = '#ffdf00'; x.fillRect(0, 72, w, 8); x.restore(); x.fillStyle = '#002776'; x.beginPath(); x.arc(w / 2, 76, 7, 0, TAU); x.fill(); return; }
      if (C.id === 'net') { x.strokeStyle = 'rgba(240,240,230,.75)'; x.lineWidth = 1.5; x.save(); x.beginPath(); x.arc(w / 2, hh / 2, R + 8, Math.PI * 1.05, Math.PI * 1.95); x.lineTo(w / 2 + R + 8, hh / 2 + R * .9); x.lineTo(w / 2 - R - 8, hh / 2 + R * .9); x.closePath(); x.clip();
        for (let q = -R; q < R * 3; q += 9) { x.beginPath(); x.moveTo(w / 2 - R - 10 + q, 0); x.lineTo(w / 2 - R - 10 + q - hh, hh); x.stroke(); x.beginPath(); x.moveTo(w / 2 - R - 10 + q - R, 0); x.lineTo(w / 2 - R - 10 + q - R + hh, hh); x.stroke(); } x.restore(); x.fillStyle = 'rgba(240,240,230,.9)'; x.beginPath(); x.arc(w / 2, 40, 9, 0, TAU); x.fill(); return; }
      if (C.id === 'halo') { x.strokeStyle = '#ffd23f'; x.lineWidth = 9; x.shadowColor = '#fff6a0'; x.shadowBlur = 12; x.beginPath(); x.ellipse(w / 2, 46, R * .7, 14, 0, 0, TAU); x.stroke(); return; }
      const em = E(C.e, 64), sz = C.eye ? R * 1.5 : C.side ? R * 1 : R * 1.5; x.drawImage(em, C.side ? w / 2 + R * .25 : w / 2 - sz / 2, C.eye ? hh / 2 - sz * .42 : C.side ? 60 - sz * .1 : 60 - sz * .62, sz, sz); }); }
  const fmt = ms => { const s = ms / 1000; return Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0'); };

  function newRace() {
    const LP = LIVE.race && LIVE.race.players ? LIVE.race.players.filter(pl => pl !== LIVE.me).map(pl => ({peer: pl, pr: ((LIVE.peers.find(p0 => p0.peer === pl) || {}).presence) || {}})) : null;
    const LAI = LP ? (LIVE.race.ai || []) : [], HOST = LP && LIVE.race.host === LIVE.me;
    const order = LP ? [me].concat(LP.map(x => x.pr.drv || x.pr.who || 'jonas'), LAI) : [me].concat(CREW.map(c => c.id).filter(id => id !== me).sort(() => Math.random() - .5));
    const karts = order.map((id, k) => { const row = Math.floor(k / 2), lat = (k % 2 ? 1 : -1) * Math.min(34, TW * .22), i = N - 10 - row * 9, [x, y] = at(i, lat);
      const a = Math.atan2(P[(i + 1) % N][1] - P[i][1], P[(i + 1) % N][0] - P[i][0]);
      return {id, me: id === me, x, y, a, mv: a, v: 0, steer: 0, idx: i, lat, lap: -1, half: true, done: 0, spin: 0, rot: 0, boost: 0, item: null, roll: 0, useAt: 0,
        skill: id === me ? 1 : rnd(DIFFS[DIFF].s[0], DIFFS[DIFF].s[1]), vr: 0, lost: 0, rumble: 0, squash: 0, lapT0: 0, lane: rnd(-35, 35), laneT: 0, say: null, sayT: 0, dust: 0, hold: 0, dr: 0, dt: 0, yaw: 0, air: 0, airT: 0, trick: 0, stall: 0, pad: 0, wet: 0, dol: 0, inv: 0, glow: 0, blind: 0, slowT: 0, slowE: '', bump: 0, cs: CS[id] || {spd: .5, hdl: .5, acc: .5, tgh: .5}, vt: VTUNE[id === me ? vehOf(id) : 'kart'] || VTUNE.kart, vtype: vehOf(id), vx: VTX[vehOf(id)] || VTX.kart, brk: false, manual: null, peg: pegel(id),
        rocket: !LP && id !== me && !(PERS[id] || {}).noRocket && Math.random() < .45, remote: LP && k > 0 && (k <= LP.length || !HOST) ? 1 : 0, peer: LP && k > 0 ? (k <= LP.length ? LP[k - 1].peer : LIVE.race.host) : null, aiIdx: LP && k > LP.length ? k - LP.length - 1 : undefined, vkey: LP && k > 0 && k <= LP.length ? 'r:' + LP[k - 1].peer : null, who: LP && k > 0 && k <= LP.length ? LP[k - 1].pr.who : null, coins: 0, pp: PERS[id] || PERS0, misT: rnd(6, 14), misK: null, misD: 0, burstT: rnd(8, 18)}; });
    const boxes = []; (T.boxes || []).forEach(f => [-42, 0, 42].forEach(l => { const i = Math.round(f * N); boxes.push({i, l, x: at(i, l)[0], y: at(i, l)[1], off: 0}); }));
    const obst = (T.obst || []).map(([f, l, kind]) => { const [x, y] = at(f * N, l); return {x, y, kind, r: {crate: 22, umbrella: 24, log: 26, suitcase: 20, stone: 18, nut: 20, cone: 16, champ: 16}[kind] || 20}; });
    if (CUT) { const SQ = secretOf(), dx0 = CUT.b[0] - CUT.a[0], dy0 = CUT.b[1] - CUT.a[1], l0 = Math.hypot(dx0, dy0), nx0 = -dy0 / l0, ny0 = dx0 / l0;
      [[.3, -1], [.52, 1], [.74, -1]].forEach(([u, sd]) => obst.push({x: CUT.a[0] + dx0 * u + nx0 * sd * CUT.w * .24, y: CUT.a[1] + dy0 * u + ny0 * sd * CUT.w * .24, kind: SQ[1], r: 17, secret: 1})); }
    const birds = []; (T.birds || []).forEach(f => { const l0 = rnd(-40, 40); for (let j = 0; j < 5; j++) { const [x, y] = at(f * N + rnd(-4, 4), l0 + rnd(-22, 22)); birds.push({x0: x, y0: y, x, y, f: 0, vx: 0, vy: 0, a: rnd(0, TAU)}); } });
    const movers = []; (T.movers || []).concat(RULE && RULE.k === 'coati' ? [{f: .2, range: TW * .6, speed: 60, kind: 'coati', n: 2}, {f: .55, range: TW * .6, speed: 70, kind: 'coati', n: 2}, {f: .85, range: TW * .6, speed: 55, kind: 'coati'}] : []).forEach(m => { for (let j = 0; j < (m.n || 1); j++) movers.push({i: wrap(m.f * N + j * 14), l: rnd(-m.range, m.range), dir: Math.random() < .5 ? 1 : -1, range: m.range, speed: m.speed * rnd(.85, 1.15), kind: m.kind, say: 0, x: 0, y: 0}); });
    const puddles = (T.puddles || []).map(([f, l, r]) => { const [x, y] = at(f * N, l); return {x, y, r, r0: r}; });
    const gates = (T.gates || []).map(g => ({i: wrap(g.f * N), period: g.period, closed: g.closed, kind: g.kind, ph: rnd(0, g.period)}));
    const coinsT = []; [.13, .38, .63, .88].forEach((f, n) => { const l0 = [-40, 30, -20, 40][n]; for (let j = 0; j < 5; j++) { const i = wrap(f * N + j * 5), [x, y] = at(i, l0 + Math.sin(j) * 8); coinsT.push({x, y, off: 0}); } });
    let rival = loadJ('kartRival')[me]; const rp0 = pick(order.slice(1)); if (!rival || rival === me || !CREW.some(c => c.id === rival)) rival = rp0;
    karts.forEach(k => { if (k.id === rival) k.skill = Math.max(k.skill, DIFFS[DIFF].s[1] + .005); }); HEADC = {};
    if (LP) LP.forEach(x => { const pr = x.pr, id = pr.drv || pr.who || 'jonas', pt = pr.paint || {}; VEH['r:' + x.peer] = vehSprite(pt.c || (LOOK[id] || {}).shirt || '#00a651', T.veh === 'boat' || T.veh === 'cart' ? T.veh : (pr.veh || 'kart'), pt, id); });
    const dolphins = (T.dolphins || []).map(f => { const l = rnd(-40, 40), [x, y] = at(f * N, l); return {x, y, i: wrap(f * N), t: rnd(0, 3), cd: 0}; });
    S = {storm: {at: !RULE && T.id !== 'cristo' && Math.random() < .33 ? rnd(22, 40) : -1, f: 0, next: 0, pud: 0}, karts, boxes, obst, birds, movers, puddles, dolphins, gates, fwT: 1, cutSaid: -1, coins: coinsT, got: 0, myHits: 0, rival, rivalAhead: true, rivalSaid: 0, tu: tune(), oils: [], coatis: [], fx: [], sp: [], marks: [], fw: [], drops: [], t: -4.1, cd: 4, over: 0, slow: 0, press: null, leader: null, lastPlace: 6,
      wave: {next: rnd(9, 13), on: 0, warn: 0, h: 0}, flood: 0, hl: {}, flash: 0, supers: 0, rec: [], ghost: null, lapMsg: null, zoom: 1, camT: 0, camA: karts[0].a, camX: karts[0].x, camY: karts[0].y, shake: 0};
  }
  const gateShut = g => ((S.t + g.ph) % g.period) < g.closed;
  function progress(k) { return k.lap * N + k.idx; }
  function place(k) { return S.karts.filter(o => o !== k && (o.done ? (!k.done || o.done < k.done) : !k.done && progress(o) > progress(k))).length + 1; }
  function floatTxt(k, t, c) { S.fx.push({x: k.x, y: k.y, txt: t, col: c || '#ffd23f', t: 0}); }
  const HITSAY = {parade: 'In den Sambazug gekracht!', coco: 'Kokosnuss auf die Birne!', tug: 'Vom Gepäckwagen erwischt!', fork: 'Gabelstapler!', bus: 'Der Bus! Der Bus!', soccer: 'Ball an den Kopf!', crate: 'Container!', flip: 'Flip-Flop ins Gesicht!', fire: 'Heiß, heiß, heiß!', tram: 'Von der Straßenbahn erwischt!', moto: 'Motoboy!!', monkey: 'Der Affe hat mein Item geklaut!', cone: 'Baustelle!', champ: 'Sekt verschüttet!', gate: 'Schranke zu!', ball: 'Fernschuss ins Gesicht!', beer: 'Alles voller Schaum!', coati: 'Dieser Nasenbär!!', vendor: 'Ich wollte nur einen Caipi!', corn: 'Mein Mais!', caiman: 'Der Kaiman hat mich gebissen!', horse: 'Pferd hat Vorfahrt?!', dog: 'Guter Hund … AUA!', log: 'Baumstamm!', umbrella: 'Sonnenschirm-Treffer!', suitcase: 'Wessen Koffer ist das?!'};
  function hit(k, why) {
    if (k.remote) { if (S.live && ['coati', 'ball', 'flip', 'fire'].includes(why) && !k.hitT) { k.hitT = 1; setTimeout(() => { k.hitT = 0; }, 900); liveEmit({t: 'hit', race: S.live.id, to: k.peer, ai: k.aiIdx, why}); } return; }
    if (k.spin > 0 || k.air > 0 || k.inv > 0) return; if (k.shield > 0 && why !== 'gate') { k.shield = 0; floatTxt(k, '⛱️ geblockt!', '#7fd3ff'); if (k.me) { beep(520, .1, 'triangle', .07); vib(15); } return; } S.hl[why] = (S.hl[why] || 0) + 1; k.spin = .9 * (1.12 - k.cs.tgh * .3); k.vr += rnd(-60, 60); if (k.me) vib([30, 40, 30]); k.boost = 0; k.dr = 0; k.dt = 0; SFX.spin(); if (why === 'caiman') SFX.chomp();
    const l = LINES[k.id]; k.say = (HITSAY[why] && Math.random() < .55) ? HITSAY[why] : l ? pick(l) : 'Aua!'; k.sayT = 1.6;
    if (k.me) { S.myHits++; if (k.coins > 0) { const n = Math.min(2, k.coins); k.coins -= n; S.got = Math.max(0, S.got - n); floatTxt(k, '−' + n + ' 🪙', '#ffb0b0'); } } 
    if (k.me) { S.shake = .35; if (why === 'caiman') say('caiman', 'Vorsicht, Kaiman!'); else if (['oil', 'coati', 'ball', 'flip', 'fire', 'beer'].includes(why) && Math.random() < .6) voice(k, 'item'); else if (Math.random() < .5) voice(k, 'hit'); else if (Math.random() < .4) say('hit', 'Autsch, das tat weh!'); }
  }
  function rollItem(k) { if ((RULE && RULE.k === 'turbo') || (S.live && S.live.cfg && S.live.cfg.items === 'turbo')) return ITEMS.turbo; if (RULE && RULE.k === 'coati') return ITEMS.coati; if (SPECIAL[k.id] && Math.random() < .22) return SPECIAL[k.id]; const pl = place(k), tb = IW[pl === 1 ? 'front' : pl <= 3 ? 'mid' : 'back']; let r = Math.random(); for (const [kk, p0] of Object.entries(tb)) { r -= p0; if (r < 0) return ITEMS[kk]; } return ITEMS.turbo; const w = [0, 0]; return r < w[0] ? ITEMS.turbo : r < w[0] + w[1] ? ITEMS.oil : ITEMS.coati; }
  /* ---- Zufallsereignisse mitten im Rennen (im Live-Rennen über den gemeinsamen Zufall bei allen gleich) ---- */
  const EVK = [{k: 'police', e: '🚔', n: 'Polizeikontrolle', x: 'Langsam fahren, sonst Strafe!'}, {k: 'parade', e: '💃', n: 'Karnevalsumzug', x: 'Sambazug quert die Strecke!'},
    {k: 'coco', e: '🥥', n: 'Kokosnussregen', x: 'Auf die Schatten achten!'}, {k: 'blackout', e: '🔌', n: 'Stromausfall', x: 'Alles dunkel, nur Scheinwerfer!'}];
  function evStart() { const E0 = S.ev, ty = EVK[Math.floor(wr('ev') * EVK.length)], f = wr('ev'), c = {k: ty.k, ty, i: wrap(f * N), t0: S.t, end: S.t + (ty.k === 'coco' ? 7 : ty.k === 'blackout' ? 8 : 10)};
    if (ty.k === 'coco') { c.nuts = []; const base = f * N; for (let j = 0; j < 34; j++) { const ii = base + wr('ev') * N * .45, l = (wr('ev') - .5) * TW * .9, [x, y] = at(ii, l); c.nuts.push({x, y, t: S.t + .4 + j * .19, done: 0}); } }
    S.karts.forEach(k => { k.evP = k.idx; k.evRaser = !k.me && Math.random() < .3; });
    E0.cur = c; S.evBan = {t: ty.e + ' ' + ty.n + '! ' + ty.x, until: performance.now() + 3200}; beep(ty.k === 'police' ? 960 : 520, .18, 'square', .06); if (ty.k === 'police') setTimeout(() => beep(720, .18, 'square', .06), 200);
    say('ev_' + ty.k, ty.n + '! ' + ty.x); }
  function evStep(dt) { if (!S.evOn || S.t < 0 || !S.ev) return; const E0 = S.ev;
    if (!E0.cur) { if (S.t > E0.next) evStart(); return; } const c = E0.cur;
    if (c.k === 'police') S.karts.forEach(k => { if (k.remote || k.done) { k.evP = k.idx; return; } const pv = k.evP === undefined ? k.idx : k.evP, d = wrap(k.idx - pv); k.evP = k.idx;
      if (d < 60 && wrap(c.i - pv) < d + 1 && wrap(c.i - pv) > 0) { const sp = Math.hypot(k.v, k.vr); if (sp > 165 && k.inv <= 0) { k.slowT = 2.2; k.slowE = '🚔'; k.say = 'Führerschein weg?!'; k.sayT = 1.6; floatTxt(k, '🚔 Zu schnell! Strafe', '#ff6b6b'); if (k.me) { vib(60); S.shake = .2; } } else { floatTxt(k, '👮 Brav!', '#9dffb4'); if (k.me) { addCoins(2); ach('police'); } } } });
    if (c.k === 'parade') { c.dn = []; for (let j = 0; j < 7; j++) { const l = Math.sin(S.t * 1.1 + j * .9) * TW * .62, [x, y] = at(c.i + j * 4, l); c.dn.push({x, y, e: ['💃', '🥁', '🕺', '🎺', '💃', '🪇', '🕺'][j]}); }
      S.karts.forEach(k => { if (k.remote || k.air || k.spin > 0) return; if (c.dn.some(d0 => Math.hypot(k.x - d0.x, k.y - d0.y) < 24)) hit(k, 'parade'); }); }
    if (c.k === 'coco') c.nuts.forEach(nu => { if (nu.done || S.t < nu.t) return; nu.done = 1; S.karts.forEach(k => { if (!k.remote && !k.air && Math.hypot(k.x - nu.x, k.y - nu.y) < 26) hit(k, 'coco'); }); if (Math.hypot(nu.x - S.karts[0].x, nu.y - S.karts[0].y) < 500) beep(140, .08, 'triangle', .06); for (let j = 0; j < 5; j++) S.sp.push({x: nu.x, y: nu.y, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: '#8a5a2b'}); });
    if (S.t > c.end) { E0.cur = null; E0.next = S.t + wrnd('ev', 18, 30); } }
  function evDraw(up, tt) { const c = S.ev && S.ev.cur; if (!c) return;
    if (c.k === 'police') { const [x0, y0] = at(c.i, -TW / 2), [x1, y1] = at(c.i, TW / 2), bl = Math.floor(tt * 6) % 2; ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = bl ? '#2f6bff' : '#ff2a2a'; ctx.setLineDash([16, 10]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
      const [px, py] = at(c.i + 3, TW / 2 + 34); up(px, py, E('🚓', 40), 1); const [qx, qy] = at(c.i - 2, -TW / 2 - 24); up(qx, qy, E('👮', 32), 1); }
    if (c.k === 'parade' && c.dn) c.dn.forEach((d0, j) => up(d0.x, d0.y - Math.abs(Math.sin(tt * 8 + j)) * 6, E(d0.e, 30), 1));
    if (c.k === 'coco') c.nuts.forEach(nu => { const dtn = nu.t - S.t; if (nu.done || dtn > 1) return; const f = clamp(1 - dtn, 0, 1); ctx.fillStyle = `rgba(0,0,0,${.15 + .25 * f})`; ctx.beginPath(); ctx.arc(nu.x, nu.y, 8 + f * 12, 0, TAU); ctx.fill(); up(nu.x, nu.y - dtn * 140, E('🥥', 26), .7 + .3 * f); }); }
  /* ---- Persönliche Hymne je Person (Web Audio): bei Führung und bei der Siegerehrung ---- */
  function hymn(id) { const a = audio(); if (!a || !FXG) return; const t0 = a.currentTime + .05, out = a.createGain(); out.gain.value = .5; out.connect(FXG);
    if (MG) { MG.gain.setTargetAtTime(.12, t0, .05); MG.gain.setTargetAtTime(.5, t0 + 3, .4); }
    const nt = (t, f, d, type, vol, o2) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0 + t); let n0 = o;
      if (o2 && o2.vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = o2.vib; lg.gain.value = f * .012; l.connect(lg); lg.connect(o.frequency); l.start(t0 + t); l.stop(t0 + t + d + .1); }
      if (o2 && o2.lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o2.lp; o.connect(fl); n0 = fl; }
      if (o2 && o2.slide) o.frequency.exponentialRampToValueAtTime(o2.slide, t0 + t + d);
      g.gain.setValueAtTime(0, t0 + t); g.gain.linearRampToValueAtTime(vol, t0 + t + (o2 && o2.att || .01)); g.gain.setTargetAtTime(0, t0 + t + d * .75, d * .25 + .02); n0.connect(g); g.connect(out); o.start(t0 + t); o.stop(t0 + t + d + .4); };
    const hz = m => 440 * Math.pow(2, (m - 69) / 12), kick = t => nt(t, 150, .18, 'sine', .5, {slide: 45}), hat = t => noise(.04, .05, 7000, t0 + t, out), snare = t => noise(.12, .12, 1500, t0 + t, out);
    if (id === 'patrick') { const b = .21; [48, 55, 48, 55, 53, 48, 55, 48].forEach((m, i) => { nt(i * b, hz(m - 12), b * .8, 'sawtooth', .22, {lp: 500}); [64, 67, 72].forEach(c0 => nt(i * b + b / 2, hz(c0 - (i % 4 > 1 ? 2 : 0)), b * .35, 'square', .05)); });   // Rentner-Polka: Umpa-Umpa + Quetschkommode
      [76, 72, 76, 79, 77, 74, 71, 72].forEach((m, i) => nt(i * b, hz(m), b * .9, 'square', .09, {vib: 6.5, lp: 2600})); nt(8 * b, hz(72), .5, 'square', .1, {vib: 5}); }
    else if (id === 'simon') { const b = .42; [[64, 1], [67, 1], [71, 1.5], [69, .5], [67, 1], [64, 2]].reduce((t, [m, l]) => { nt(t, hz(m), b * l * 1.05, 'triangle', .2, {vib: 5.5, att: .08}); return t + b * l; }, 0);   // Schmalz-Ballade
      [[52, 59, 64], [48, 55, 64], [55, 59, 62], [52, 59, 64]].forEach((ch, i) => ch.forEach(m => nt(i * b * 1.75, hz(m), b * 1.9, 'sine', .07, {att: .2}))); }
    else if (id === 'greisel') { const b = .25; [36, 43, 36, 43, 36, 43, 31, 36].forEach((m, i) => { nt(i * b, hz(m), b * .5, 'sawtooth', .28, {lp: 380}); if (i % 2) snare(i * b); });   // Blasmusik-Marsch: Tuba + Trompete
      [72, 72, 79, 76, 72, 76, 79, 84].forEach((m, i) => nt(i * b, hz(m), b * .85, 'sawtooth', .1, {lp: 1800, vib: 5})); nt(8 * b, hz(84), .6, 'sawtooth', .12, {lp: 1800, vib: 5}); }
    else if (id === 'jonas') { const b = .19; [40, 40, 52, 40, 43, 45, 40, 52].forEach((m, i) => nt(i * b, hz(m), b * .5, 'square', .16, {lp: 700}));   // Kassen-Funk: Slap-Bass + Registrierkasse
      [0, 2, 4, 6].forEach(i => { kick(i * b); }); [1, 3, 5, 7].forEach(i => hat(i * b)); nt(8 * b, 2093, .07, 'square', .1); nt(8 * b + .08, 2637, .25, 'square', .1); noise(.15, .08, 3000, t0 + 8 * b + .05, out); }
    else if (id === 'marco') { const b = .16; [[67, 1], [72, 1], [76, 1], [79, 2], [76, 1], [79, 4]].reduce((t, [m, l]) => { nt(t, hz(m), b * l * .95, 'sawtooth', .13, {lp: 2400}); nt(t, hz(m - 12), b * l * .95, 'square', .05); return t + b * l; }, 0);   // Stadion-Fanfare „Attacke!“
      [0, 2, 4, 6, 8].forEach(i => snare(i * b * 1.2)); }
    else { const b = .23; for (let i = 0; i < 8; i++) { kick(i * b); hat(i * b + b / 2); nt(i * b + b / 2, hz(i % 2 ? 57 : 45), b * .4, 'sawtooth', .14, {lp: 900}); }   // Daijo: Disco
      [69, 72, 76, 81, 76, 72, 76, 81].forEach((m, i) => nt(i * b, hz(m), b * .45, 'square', .06, {lp: 3000})); } }
  // Zwei Item-Plätze (nur der Spieler): passen beide zusammen, wird daraus eine Kombo
  const COMBOS = {'oil+pimenta': {e: '🔥', n: 'Flammenteppich'}, 'coati+parrot': {e: '🦝', n: 'Nasenbärenarmee'}, 'turbo+turbo': {e: '🚀', n: 'Mega-Caipi'}, 'pimenta+turbo': {e: '☄️', n: 'Raketen-Caipi'},
    'flip+flip': {e: '🩴', n: 'Flip-Flop-Salve'}, 'oil+oil': {e: '🧴', n: 'Ölteppich'}, 'shield+shield': {e: '🛡️', n: 'Panzer-Schirm'}, 'coati+coati': {e: '🦝', n: 'Nasenbär-Doppel'}};
  const comboKey = (a, b) => a && b ? [a.k, b.k].sort().join('+') : '', comboOf = (a, b) => COMBOS[comboKey(a, b)];
  function useCombo(k, key) { const C = COMBOS[key]; floatTxt(k, C.e + ' KOMBO: ' + C.n + '!', '#ff7ae0'); if (k.me) { SFX.turbo(); vib([30, 40, 30]); S.flash = Math.max(S.flash, .25); say('combo', 'Kombo! ' + C.n + '!'); } ach('combo');
    const ahead = n => S.karts.filter(o => o !== k && !o.done && progress(o) > progress(k)).sort((a, b) => progress(a) - progress(b)).slice(0, n);
    if (key === 'oil+pimenta') { k.boost = Math.max(k.boost, 2.2); k.fire = 3; k.flameT = 3; }
    if (key === 'coati+parrot' || key === 'coati+coati') { const tg = ahead(key === 'coati+coati' ? 2 : 3); (tg.length ? tg : [null]).forEach((o, j) => S.coatis.push({i: k.idx + 6 + j * 3, l: k.lat + (j - 1) * 30, tgt: o, t: 6, by: k, x: k.x, y: k.y})); SFX.throw(); }
    if (key === 'turbo+turbo') { k.boost = Math.max(k.boost, 3); k.inv = 2; }
    if (key === 'pimenta+turbo') { k.boost = Math.max(k.boost, 3.6); k.fire = 3.6; }
    if (key === 'flip+flip') { [-40, 0, 40].forEach(l => S.coatis.push({i: k.idx + 5, l: k.lat + l, tgt: null, t: 3.2, by: k, x: k.x, y: k.y, flip: 1})); SFX.throw(); }
    if (key === 'oil+oil') { for (let j = 0; j < 3; j++) { const [x, y] = [k.x - Math.cos(k.a) * (34 + j * 30), k.y - Math.sin(k.a) * (34 + j * 30)]; S.oils.push({x, y, t: 12, by: k}); if (S.live) liveEmit({t: 'oil', race: S.live.id, x: Math.round(x), y: Math.round(y)}); } SFX.oil(); }
    if (key === 'shield+shield') { k.shield = 16; } }
  function useItem(k) {
    if (!k.item || k.roll > 0 || S.t < 0) return; const it = k.item; k.item = null;
    if (k.me && k.item2) { const it2 = k.item2, ck = comboKey(it, it2); k.item2 = null; if (COMBOS[ck]) { const snap0 = S.live ? S.karts.filter(o => o.remote).map(o => [o, o.slowT, o.blind, o.parrot || 0]) : []; useCombo(k, ck); return; } k.item = it2; }
    const snap = S.live ? S.karts.filter(o => o.remote).map(o => [o, o.slowT, o.blind, o.parrot || 0]) : [];
    useItem0(k, it);
    snap.forEach(([o, a0, b0, c0]) => { const f = {}; if (o.slowT > a0) { f.slowT = o.slowT; f.slowE = o.slowE; } if (o.blind > b0) f.blind = o.blind; if ((o.parrot || 0) > c0) f.parrot = o.parrot; if (Object.keys(f).length) liveEmit({t: 'fx', race: S.live.id, to: o.peer, ai: o.aiIdx, f}); });
    if (S.live && (it.k === 'oil' || it.k === 'beer')) { const o = S.oils[S.oils.length - 1]; if (o) liveEmit({t: 'oil', race: S.live.id, x: Math.round(o.x), y: Math.round(o.y), beer: o.beer ? 1 : 0}); }
  }
  function useItem0(k, it) {
    if (k.me) S.tutUsed = 1;
    if (it.k === 'turbo') { k.boost = Math.max(k.boost, 1.6); if (k.me) SFX.turbo(); floatTxt(k, '🍹 Turbo!'); }
    if (it.k === 'oil') { const [x, y] = [k.x - Math.cos(k.a) * 34, k.y - Math.sin(k.a) * 34]; S.oils.push({x, y, t: 12, by: k}); SFX.oil(); }
    if (it.k === 'coati') { const ahead = S.karts.filter(o => o !== k && !o.done && progress(o) > progress(k)).sort((a, b) => progress(a) - progress(b))[0];
      S.coatis.push({i: k.idx + 6, l: k.lat, tgt: ahead || null, t: 5, by: k, x: k.x, y: k.y}); SFX.throw(); if (ahead && ahead.me) say('coati', 'Nasenbär-Alarm!'); }
    if (it.k === 'parrot') { S.karts.forEach(o => { if (o !== k && !o.done && o.inv <= 0 && progress(o) > progress(k) && progress(o) - progress(k) < 140) { if (o.shield > 0) { o.shield = 0; floatTxt(o, '⛱️ geblockt'); return; } o.parrot = 1.1; o.say = 'Papagei im Gesicht!'; o.sayT = 1.2; } }); beep(1800, .08, 'square', .05, 2600); setTimeout(() => beep(2200, .08, 'square', .05, 1500), 90); floatTxt(k, '🦜 Kraaah!'); }
    if (it.k === 'pimenta') { k.boost = Math.max(k.boost, 2.6); k.fire = 2.6; if (k.me) { SFX.turbo(); vib(30); } floatTxt(k, '🌶️ Scharf!', '#ff5a3a'); }
    if (it.k === 'flip') { S.coatis.push({i: k.idx + 5, l: k.lat, tgt: null, t: 3.2, by: k, x: k.x, y: k.y, flip: 1}); SFX.throw(); }
    if (it.k === 'shield') { k.shield = 8; floatTxt(k, '⛱️ Schirm auf!', '#7fd3ff'); if (k.me) SFX.pick(); }
    // Spezial-Items
    const near0 = Math.hypot(k.x - S.karts[0].x, k.y - S.karts[0].y) < 700;
    if (SPECIAL[k.id] && it === SPECIAL[k.id]) { if (k.me || near0) voice(k, 'sp'); floatTxt(k, it.e + ' ' + it.n + '!', '#fff'); }
    if (it.k === 'bill') { S.karts.forEach(o => { if (o !== k && !o.done && progress(o) > progress(k) && o.inv <= 0) { o.slowT = 1.4; o.slowE = '🧾'; o.say = 'Zahlungserinnerung?!'; o.sayT = 1.4; } }); beep(880, .1, 'square', .06); setTimeout(() => beep(660, .2, 'square', .06), 110); }
    if (it.k === 'burn') { k.glow = 2; S.karts.forEach(o => { if (o !== k && o.inv <= 0 && Math.hypot(o.x - k.x, o.y - k.y) < 280) { o.blind = 1.3; if (o.me) S.flash = .7; } }); noise(.5, .12, 300); }
    if (it.k === 'wheel') { k.boost = Math.max(k.boost, 2.3); k.inv = 2.3; SFX.turbo(); }
    if (it.k === 'ball') { const ahead = S.karts.filter(o => o !== k && !o.done && progress(o) > progress(k)).sort((a, b) => progress(a) - progress(b))[0];
      S.coatis.push({i: k.idx + 6, l: k.lat, tgt: ahead || null, t: 9, by: k, x: k.x, y: k.y, ball: 1}); real('kick', .6) || beep(300, .15, 'square', .08, 120); }
    if (it.k === 'beer') { const [x, y] = [k.x - Math.cos(k.a) * 46, k.y - Math.sin(k.a) * 46]; S.oils.push({x, y, t: 10, by: k, beer: 1}); real('splash', .4); }
    if (it.k === 'snack') { k.boost = Math.max(k.boost, .8); S.karts.forEach(o => { if (o !== k && !o.done && progress(o) < progress(k) && progress(k) - progress(o) < 110 && o.inv <= 0) { o.slowT = 1.2; o.slowE = '🥟'; o.say = 'Mmmh, Snacks!'; o.sayT = 1.2; } }); }
  }
  const INPUT = {L: false, R: false, keys: {}, ax: null, brake: false, drift: false, dtap: null};
  const anyInput = () => INPUT.L || INPUT.R || INPUT.keys.ArrowLeft || INPUT.keys.ArrowRight || INPUT.keys.a || INPUT.keys.d;
  function step(dt) {
    S.t += dt; S.shake = Math.max(0, S.shake - dt);
    if (S.live && S.live.t0p && !(S.slow > 0)) { const w = (performance.now() - S.live.t0p) / 1000; if (w - S.t > .25) S.t = w; }   // Live: gemeinsame Rennuhr (nach App-Wechsel/Ruckeln aufholen)
    if (S.t < 0) { const c = Math.ceil(-S.t); if (c !== S.cd) { S.cd = c; if (c <= 3) SFX.count(1); } if (S.press === null && S.t > -3.05 && anyInput()) S.press = S.t; return; }
    if (S.cd !== 0) { S.cd = 0; SFX.count(0); MUS.on = true;
      S.karts.forEach(k => { const pr = k.me ? S.press : (k.rocket ? -.3 : null);
        if (pr !== null && pr > -.62 && pr < -.04) { k.boost = 1.1; k.v = 120; if (k.me) { SFX.rocket(); ach('rocket'); floatTxt(k, '🚀 Raketenstart!'); say('rocket', 'Was für ein Raketenstart!', 1); } }
        else if (k.me && pr !== null && pr < -2) { k.stall = .9; SFX.stall(); floatTxt(k, '💨 Abgewürgt!', '#ff8a8a'); say('stall', 'Abgewürgt! Zu früh gestartet!', 1); } });
      if (!S.karts[0].stall && S.karts[0].boost <= 0) say('go', 'Und los geht\'s!', 1); }
    const ks = S.karts;
    { const k0 = ks[0], gi = Math.floor(S.t / .1); if (!k0.done && S.rec.length <= gi) S.rec.push([Math.round(k0.x), Math.round(k0.y), Math.round(k0.a * 100)]); }
    ks.forEach(k => {
      if (k.remote) { liveRemote(k, dt); return; }
      // Lenken
      let target = 0;
      if (k.done) target = 0;
      else if (k.me) { const kb = (INPUT.keys.ArrowLeft || INPUT.keys.a ? -1 : 0) + (INPUT.keys.ArrowRight || INPUT.keys.d ? 1 : 0);
        k.brk = !!(INPUT.brake || INPUT.keys.ArrowDown || INPUT.keys.s || (SET.ctl !== 'analog' && INPUT.L && INPUT.R));
        target = SET.ctl === 'analog' && INPUT.ax !== null ? INPUT.ax : kb || ((INPUT.L ? -1 : 0) + (INPUT.R ? 1 : 0)); if (RULE && RULE.k === 'mirror') target = -target;
        // Drift sofort: Doppeltipp auf eine Seite (Halten) oder Drift-Knopf (Analog)
        if (!k.dr && k.v > 150 && !k.air && k.spin <= 0 && !k.done) { const dt0 = INPUT.dtap && performance.now() - INPUT.dtap.t < 380;
          if ((INPUT.drift && Math.abs(target) > .25) || dt0) { k.dr = INPUT.drift ? Math.sign(target) : INPUT.dtap.s; k.dt = 0; k.manual = INPUT.drift ? 'btn' : 'tap'; INPUT.dtap = null; SFX.drift(); vib(10); } } }
      else { k.laneT -= dt; if (k.laneT < 0) { k.laneT = rnd(1.5, 4); k.lane = rnd(-TW * .25, TW * .25); }
        const la = 14 + k.v / 30; let lane = k.lane, haz = null, hd = 170;
        S.obst.concat(S.oils, S.puddles).forEach(o => { const dx = o.x - k.x, dy = o.y - k.y, d = Math.hypot(dx, dy); if (d < hd && dx * Math.cos(k.a) + dy * Math.sin(k.a) > 0) { hd = d; haz = o; } });
        if (haz) { const nl = nearest(haz.x, haz.y, k.idx)[1], gap = (haz.r || 24) + 34 * k.pp.care; lane = nl > 0 ? nl - gap : nl + gap; }
        else { const bx = S.boxes.find(b => b.off <= 0 && !k.item && k.roll <= 0 && b.i > k.idx && b.i - k.idx < 40); if (bx) lane = bx.l;
          const pd = PADS.find(p => p.i > k.idx && p.i - k.idx < 35); if (pd && k.skill > .93) lane = pd.l; }
        const mvr = S.movers.find(m => m.i > k.idx && m.i - k.idx < 30); if (mvr) lane = mvr.l > 0 ? -TW * .3 : TW * .3;
        if (!haz && !mvr) { const lw = clamp(DIFFS[DIFF].line * k.pp.line, 0, 1); lane = LINE[wrap(k.idx + la)] * lw + lane * (1 - lw * .7); }
        if (k.pp.ram && !haz) { const vic = S.karts.find(o => o !== k && !o.done && progress(o) - progress(k) > 2 && progress(o) - progress(k) < 14); if (vic) lane = vic.lat; }
        const [tx, ty] = at(k.idx + la, clamp(lane, -TW * .37, TW * .37)); const d = angd(Math.atan2(ty - k.y, tx - k.x), k.a); target = clamp(d * 2.6, -1, 1);
        if (k.misD > 0 && k.misK === 'wide') target *= .35; if (k.misD > 0 && k.misK === 'wobble') target = clamp(target + Math.sin(S.t * 9) * .8, -1, 1);
        if (k.item && k.roll <= 0) { k.useAt -= dt; if (k.useAt < 0) useItem(k); } }
      if (k.peg > 0 && !k.done) target = clamp(target + Math.sin(S.t * 2.3 + k.idx * .01) * k.peg * .45, -1, 1);   // Pegel vom Vorabend
      if (k.blind > 0) target = clamp(target + Math.sin(S.t * 13) * .8, -1, 1);
      if (k.parrot > 0) { k.parrot -= dt; target = clamp(target * .8 + Math.sin(S.t * 6) * .45, -1, 1); }
      if (k.shield > 0) k.shield -= dt;
      if (k.fire > 0) { k.fire -= dt; S.karts.forEach(o => { if (o !== k && !o.air && Math.hypot(o.x - (k.x - Math.cos(k.a) * 40), o.y - (k.y - Math.sin(k.a) * 40)) < 26) hit(o, 'fire'); }); if (Math.random() < dt * 30) S.sp.push({x: k.x - Math.cos(k.a) * 26, y: k.y - Math.sin(k.a) * 26, vx: -Math.cos(k.a) * 120 + rnd(-40, 40), vy: -Math.sin(k.a) * 120 + rnd(-40, 40), t: 0, c: pick(['#ff5a1f', '#ffb21f', '#ff2a2a']), big: 1}); }
      if (k.air > 0) target *= .25;
      const rate = k.me ? (SET.ctl === 'analog' ? 6 : target ? 3.2 : 6) : 7;   // Spieler: Lenkeinschlag baut sich weich auf, Loslassen geht schnell zurück
      k.steer += clamp(target - k.steer, -rate * dt, rate * dt);
      // Drift: lange in eine Richtung lenken → rutschen, Funken; Loslassen → Mini-/Super-Turbo
      const sgn = Math.sign(target);
      k.hold = sgn && Math.abs(k.steer) > .7 ? (Math.sign(k.steer) === sgn ? k.hold + dt : 0) : 0;
      if (!k.dr && k.hold > .38 && k.v > 190 && !k.air && k.spin <= 0 && !k.done) { k.dr = sgn; k.dt = 0; if (k.me) SFX.drift(); }
      if (k.dr) { if ((k.manual === 'btn' ? !INPUT.drift : sgn !== k.dr) || k.spin > 0 || k.v < 120) { k.manual = null; const lvl = k.dt > 1.5 ? 2 : k.dt > .75 ? 1 : 0;
          if (lvl && k.spin <= 0) { k.boost = Math.max(k.boost, lvl > 1 ? 1.0 : .55); if (k.me) { SFX.mini(lvl); floatTxt(k, lvl > 1 ? '🔥 Super-Turbo!' : '💨 Mini-Turbo!', lvl > 1 ? '#ff9a3c' : '#7fd3ff'); S.tutMini = 1; if (lvl > 1) { S.supers++; if (Math.random() < .4) voice(k, 'drift'); else say('super', 'Super-Turbo!'); } } }
          k.dr = 0; k.dt = 0; }
        else { k.dt += dt; if (Math.random() < dt * 30) { const lvl = k.dt > 1.5 ? 2 : k.dt > .75 ? 1 : 0, bx = k.x - Math.cos(k.a) * 18, by = k.y - Math.sin(k.a) * 18;
            S.sp.push({x: bx + rnd(-8, 8), y: by + rnd(-8, 8), vx: -Math.cos(k.a) * 60 + rnd(-40, 40), vy: -Math.sin(k.a) * 60 + rnd(-40, 40), t: 0, c: ['#fff6c0', '#5ec8ff', '#ff8a2a'][lvl]}); } } }
      k.yaw += ((k.dr ? k.dr * .42 : 0) - k.yaw) * Math.min(1, dt * 8);
      // Tempo
      const cq = onCut(k.x, k.y), edge = cq !== false ? -50 : Math.abs(k.lat) - TW / 2, offT = edge > -4 && !k.air, me1 = ks[0], deep = clamp((edge + 4) / 45, 0, 1);
      // Randsteine: rütteln, leicht bremsen
      if (!k.air && T.veh !== 'boat' && edge > -16 && edge < 8 && k.v > 80) { k.rumble -= dt; if (k.rumble <= 0) { k.rumble = .07; if (k.me) { S.shake = Math.max(S.shake, .06); noise(.04, .05, 0, 0, 0, 180); } } }
      const blt = T.belts && !k.air ? T.belts.find(q => k.idx >= q[0] * N && k.idx <= q[1] * N) : null;
      let vmax = (blt ? 1 + blt[2] * .16 : 1) * (k.me ? 1 + S.tu.m * .012 + Math.min(10, k.coins) * .004 : 1) * VMAX * k.skill * (.97 + k.cs.spd * .06) * k.vt[0] * (k.slowT > 0 ? .55 : 1) * (k.blind > 0 ? .8 : 1) * (offT ? 1 - (1 - T.off) * deep : 1) * (edge > -16 && edge < 8 && !k.air ? .985 : 1) * (k.wet > 0 ? .68 : 1) * (k.boost > 0 ? 1.45 : 1) * (k.done ? .6 : 1) * (k.dr ? .97 : 1 - Math.abs(k.steer) * .1) * (k.brk ? .35 : 1) * (cq !== false && k.boost <= 0 ? .86 : 1);   // starkes Einlenken kostet Tempo (Reifenabrieb)
      if (!k.me && !k.done) { const gap = (progress(me1) - progress(k)) / N; vmax *= clamp(1 + gap * DIFFS[DIFF].rb, .9, 1.12);   // Gummiband: knapp bleibt spannend
        let ca = 0; for (let j = 10; j < 60; j += 6) ca = Math.max(ca, Math.abs(CURV[wrap(k.idx + j)])); vmax *= 1 - clamp((ca - .003) * 55, 0, .2) * k.pp.brake;
        if (k.pp.straight && ca < .002) vmax *= 1.025; if (k.pp.late && k.lap >= LAPS - 1) vmax *= 1.035;
        if (k.pp.burst && S.t > 3) { k.burstT -= dt; if (k.burstT < 0) { k.burstT = rnd(10, 20); k.boost = Math.max(k.boost, .9); } }
        // typische Fehler je Person
        if (S.t > 3) { k.misT -= dt; if (k.misT < 0 && !k.misD) { k.misT = rnd(9, 17) / k.pp.mis[0]; k.misK = k.pp.mis[1]; k.misD = k.misK === 'wide' ? 1.1 : k.misK === 'wobble' ? 1.6 : .9; }
          if (k.misD > 0) { k.misD = Math.max(0, k.misD - dt); if (k.misK === 'lapse') vmax *= .6; if (k.misK === 'brake') vmax *= .72; } } }   // vor engen Kurven bremsen
      if (!k.me && S.ev && S.ev.cur && S.ev.cur.k === 'police' && !k.evRaser && wrap(S.ev.cur.i - k.idx) < 70) vmax *= .5;
      if (k.spin > 0) { k.spin -= dt; k.rot += dt * 14; vmax *= .25; } else k.rot *= Math.max(0, 1 - dt * 10);
      if (k.stall > 0) { k.stall -= dt; vmax = 0; }
      k.v += (vmax - k.v) * Math.min(1, dt * (k.v < vmax ? (k.boost > 0 ? 4 : 1.6 * (.86 + k.cs.acc * .28) * k.vt[2]) : 4));
      k.inv = Math.max(0, k.inv - dt); k.glow = Math.max(0, k.glow - dt); k.blind = Math.max(0, k.blind - dt); k.slowT = Math.max(0, k.slowT - dt);
      k.boost = Math.max(0, k.boost - dt / ((k.me ? 1 + S.tu.t * .08 : 1) * k.vx.b)); k.wet = Math.max(0, k.wet - dt);
      const turn = k.dr ? clamp(k.dr * .7 + k.steer * .55, -1.25, 1.25) : k.steer;
      // Lenkung: im Stand wenig, bei Höchsttempo etwas weniger als in der Mitte
      const sf = k.v < 120 ? Math.max(0, k.v) / 120 : 1 - clamp((k.v - 260) / 420, 0, .2);
      const dA = turn * (k.me ? STEERS[STEER][1] : 2.7) * (.94 + k.cs.hdl * .12) * k.vt[1] * (k.me ? 1 + S.tu.r * .03 : 1) * (k.dr ? 1.14 : 1) * dt * sf;
      k.a += dA;
      // Querbewegung: Schwung bleibt beim Einlenken erhalten und wird über die Haftung abgebaut (Drift = wenig Haftung = Rutschen)
      const grip0 = (RULE && RULE.k === 'slip' ? Math.min(T.grip, 3.2) : T.grip) * (1 - S.storm.f * .2), lg = k.air ? .4 : k.spin > 0 ? 1.5 : k.dr ? Math.min(grip0, 2.4) : grip0 * (offT ? .8 : 1) * (k.me ? 1 + S.tu.r * .04 : 1) * k.vx.g;
      k.vr = (k.vr - k.v * dA * .92 + (k.dr ? -k.dr * k.v * .55 * k.vx.d * dt : 0)) * Math.exp(-lg * dt);
      k.vr = clamp(k.vr, -k.v * .8 - 20, k.v * .8 + 20);
      const ca = Math.cos(k.a), sa = Math.sin(k.a);
      k.x = clamp(k.x + (ca * k.v - sa * k.vr) * dt, 20, WW - 20); k.y = clamp(k.y + (sa * k.v + ca * k.vr) * dt, 20, Math.min(WH - 20, shore(k.x) - 10));
      k.mv = Math.atan2(sa * k.v + ca * k.vr, ca * k.v - sa * k.vr);
      // Reifenqualm beim Rutschen
      if (!k.air && T.veh !== 'boat' && (Math.abs(k.vr) > 70 || k.dr) && Math.random() < dt * 14) S.fx.push({x: k.x - ca * 16 + rnd(-6, 6), y: k.y - sa * 16 + rnd(-6, 6), dust: 1, t: 0, c: '235,235,235'});
      // weiche Bande: weit neben der Strecke ist Schluss (Dschungel/Häuser/Absperrung), Kart gleitet an ihr entlang
      { const lim = TW / 2 + (T.veh === 'boat' ? 55 : T.id === 'paraty' ? 60 : 85), [ni, nl] = nearest(k.x, k.y, k.idx);
        if (Math.abs(nl) > lim && !k.air && cq === false) { const sg = Math.sign(nl), [bx, by] = at(ni, sg * lim); k.x = bx; k.y = by; k.v *= .93; k.vr *= -.25; k.dr = 0;
          if (k.me && !S.wallT) { S.wallT = .3; noise(.07, .09, 0, 0, 0, 500); vib(12); S.shake = Math.max(S.shake, .12); for (let q = 0; q < 5; q++) S.sp.push({x: bx, y: by, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: '#ffe08a'}); } } }
      // weit weg oder festgefahren: zurück auf die Strecke
      if (!k.done && !k.air && (edge > 230 || (edge > 10 && k.v < 30) || (T.sea && k.y >= shore(k.x) - 11))) k.lost += dt; else k.lost = Math.max(0, k.lost - dt * 2);
      if (k.lost > 2.2) { const i = wrap(k.idx - 8), [x, y] = at(i, 0); k.x = x; k.y = y; k.a = k.mv = Math.atan2(P[wrap(i + 1)][1] - P[i][1], P[wrap(i + 1)][0] - P[i][0]); k.v = 60; k.vr = 0; k.lost = 0; k.dr = 0; k.spin = 0;
        floatTxt(k, '🔄 Zurück auf die Strecke', '#fff'); if (k.me) { S.fade = .5; vib(40); } }
      if (offT && k.v > 120) { k.dust -= dt; if (k.dust < 0) { k.dust = .06; S.fx.push({x: k.x - Math.cos(k.a) * 18, y: k.y - Math.sin(k.a) * 18, dust: 1, t: 0, c: T.veh === 'boat' ? '120,150,90' : T.id === 'iguacu' ? '150,70,40' : '200,160,100'}); } }
      // Kielwasser (Boot) bzw. Reifenspuren
      if (T.veh === 'boat' && k.v > 60 && Math.random() < dt * 20) S.sp.push({x: k.x - Math.cos(k.a) * 26 + rnd(-6, 6), y: k.y - Math.sin(k.a) * 26 + rnd(-6, 6), vx: rnd(-20, 20), vy: rnd(-20, 20), t: 0, c: 'rgba(255,255,255,.8)', big: 1});
      if ((k.dr || k.spin > 0) && !k.air && T.veh !== 'boat') { const c = Math.cos(k.a), s = Math.sin(k.a), rx = k.x - c * 14, ry = k.y - s * 14;
        [[-s * 11, c * 11], [s * 11, -c * 11]].forEach(([ox, oy], j) => { const p = k['mk' + j]; if (p) S.marks.push([p[0], p[1], rx + ox, ry + oy]); k['mk' + j] = [rx + ox, ry + oy]; });
        if (S.marks.length > 700) S.marks.splice(0, S.marks.length - 700); } else { k.mk0 = k.mk1 = null; }
      // Fortschritt und Runden
      const prev = k.idx; [k.idx, k.lat] = nearest(k.x, k.y, k.idx);
      if (k.idx > N * .4 && k.idx < N * .6) k.half = true;
      // Zwischenzeiten: zwei Messpunkte pro Runde (1/3, 2/3), Vergleich mit der eigenen besten Zwischenzeit
      if (k.me && !k.done && k.lap >= 0 && S.t > 0) [1, 2].forEach(j => { const bi = Math.round(N * j / 3); if (prev < bi && k.idx >= bi && k.idx - prev < 40) { const st = S.t - k.lapT0, key = 'kartSec.' + T.id + (RULE ? '@' + RULE.k : ''); let bs = []; try { bs = JSON.parse(store.get(key) || '[]'); } catch (e) {}
        const d = bs[j - 1] ? st - bs[j - 1] / 1000 : null; S.secMsg = {t: 'Zwischenzeit ' + j + ': ' + fmt(st * 1000), d, until: performance.now() + 2200}; if (!bs[j - 1] || st * 1000 < bs[j - 1]) { bs[j - 1] = Math.round(st * 1000); store.set(key, JSON.stringify(bs)); } } });
      if (prev > N * .85 && k.idx < N * .15 && k.half) { k.lap++; k.half = false;
        if (k.me && k.lap >= 1) { const lt = S.t - k.lapT0, key = 'kartLap.' + T.id + (RULE ? '@' + RULE.k : ''), bl = +store.get(key) || 0; S.lapMsg = {t: 'Runde ' + k.lap + ': ' + fmt(lt * 1000), d: bl ? lt - bl / 1000 : null, until: performance.now() + 2800};
          if (!bl || lt * 1000 < bl) store.set(key, Math.round(lt * 1000)); }
        k.lapT0 = S.t;
        if (k.lap >= LAPS && !k.done) { k.done = S.t; if (k.me) { const wn = S.karts.filter(o => o.done).sort((x, y) => x.done - y.done)[0] || k; S.pose = {id: wn.id, t0: performance.now(), me: wn === k, live: !!S.live}; if (!S.live) setTimeout(() => { if (S) voice(wn, 'win', 1); }, 700); SFX.finish(); S.over = 3.4; S.slow = 1.6; say('finish', 'Zielflagge!', 1); fireworks(place(k) <= 3 ? 70 : 25); } }
        else if (k.me && k.lap === LAPS - 1) { say('last', 'Letzte Runde!', 1); MUS.fast = true; floatTxt(k, '🏁 Letzte Runde!', '#fff'); } }
      if (prev < N * .15 && k.idx > N * .85 && k.lap >= 0 && !k.half) { k.lap--; k.half = true; }   // rückwärts über die Linie
      if (cq !== false) { if (Math.abs(cq - .5) < .06 && k.pad <= 0) { k.boost = Math.max(k.boost, .8); k.pad = .5; if (k.me) SFX.pad(); }
        if (k.me && S.cutSaid !== k.lap) { S.cutSaid = k.lap; say('cut', 'Abkürzung!'); ach('cut'); } if (Math.random() < dt * 10) S.fx.push({x: k.x, y: k.y, dust: 1, t: 0, c: '150,110,70'}); }
      if (k.me && !k.air) S.coins.forEach(c => { if (c.off <= 0 && Math.hypot(c.x - k.x, c.y - k.y) < 26) { c.off = 9; k.coins++; S.got++; SFX.coin ? SFX.coin() : beep(1560, .06, 'square', .05); } });
      if (k.me && S.t > 4 && !k.done) { const rv = S.karts.find(o => o.id === S.rival); if (rv && !rv.done) { const ah = progress(rv) > progress(k);
          if (S.rivalAhead && !ah && S.t - S.rivalSaid > 12) { S.rivalSaid = S.t; floatTxt(k, '⚔️ Rivale überholt!', '#ffb86b'); say('rival', 'Der Rivale ist überholt!'); } S.rivalAhead = ah; } }
      // Schranken: geschlossen = Anhalten
      S.gates.forEach(g => { const shut = gateShut(g); if (shut && prev < g.i && k.idx >= g.i && k.idx - prev < 30 && !k.air) { const [bx, by] = at(g.i - 4, k.lat); k.x = bx; k.y = by; k.v = 0; k.vr = 0; k.bump = .4; if (k.me) { S.shake = .25; vib(40); SFX.land(); k.say = HITSAY.gate; k.sayT = 1.2; } }
        if (!k.me && shut && g.i - k.idx > 0 && g.i - k.idx < 45) k.v = Math.min(k.v, 60);
        if (k.me && shut && g.i - k.idx > 0 && g.i - k.idx < 70 && g.said !== k.lap) { g.said = k.lap; say('gate', 'Achtung, Schranke!'); } });
      // Boost-Pfeile, Schanze, Luft
      if (!k.air && k.pad <= 0) { const pd = PADS.find(p => Math.abs(p.i - k.idx) < 5 && Math.abs(p.l - k.lat) < 24); if (pd) { k.boost = Math.max(k.boost, .8); k.pad = .5; if (k.me) { SFX.pad(); vib(15); } } }
      k.pad -= dt;
      if (RAMP >= 0 && prev < RAMP && k.idx >= RAMP && k.idx - prev < 30 && !k.air && Math.abs(k.lat) < TW / 2 && k.v > 170) { k.airT = k.air = .55 + k.v / 1400; k.trick = 0; if (k.me) { SFX.jump(); say('jump', 'Abflug!'); } else if (Math.random() < .5) k.trick = 1; }
      if (k.air > 0) { k.air -= dt; if (k.me && k.trick === 0 && anyInput() && k.airT - k.air > .08) { k.trick = 1; SFX.trick(); ach('trick'); }
        if (k.air <= 0) { k.air = 0; k.squash = .3; for (let j = 0; j < 10; j++) { const an = j / 10 * TAU; S.fx.push({x: k.x + Math.cos(an) * 14, y: k.y + Math.sin(an) * 14, dust: 1, t: 0, c: '210,190,150'}); } if (k.me) { SFX.land(); vib(25); } if (k.trick) { k.boost = Math.max(k.boost, .7); if (k.me) { floatTxt(k, '🤸 Trick!', '#7fffa5'); say('trick', 'Was für ein Trick!'); } } } }
      // Item-Roulette
      if (k.roll > 0) { k.roll -= dt; if (k.roll <= 0) { k.item = rollItem(k); k.useAt = rnd(.8, 3) * (k.pp ? k.pp.item : 1); if (k.me) SFX.pick(); } }
      k.squash = Math.max(0, k.squash - dt * 1.6);
      if (k.sayT > 0) k.sayT -= dt; k.dol = Math.max(0, k.dol - dt); k.bump = Math.max(0, (k.bump || 0) - dt);
    });
    // Kart gegen Kart
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const a = ks[i], b = ks[j]; if (a.air || b.air) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d < 30 && d > .01) { const p = (30 - d) / 2, nx = dx / d, ny = dy / d, ma = a.vx.m, mb = b.vx.m, fa = b.remote ? 2 : a.remote ? 0 : 2 * mb / (ma + mb), fb = a.remote ? 2 : b.remote ? 0 : 2 * ma / (ma + mb); a.x -= nx * p * fa; a.y -= ny * p * fa; b.x += nx * p * fb; b.y += ny * p * fb; a.v *= .97; b.v *= .97;
        const push = p * 9; a.vr -= (nx * -Math.sin(a.a) + ny * Math.cos(a.a)) * push * fa; b.vr += (nx * -Math.sin(b.a) + ny * Math.cos(b.a)) * push * fb;
        if (S.live && p > 2 && (a.me || b.me) && !S.bumpSent) { const o = a.me ? b : a; if (o.remote && o.aiIdx === undefined) { S.bumpSent = .35; liveEmit({t: 'bump', race: S.live.id, to: o.peer, nx: +(a.me ? nx : -nx).toFixed(2), ny: +(a.me ? ny : -ny).toFixed(2), p: Math.round(p)}); } }
        if (p > 3 && (a.me || b.me) && !S.bumpT) { S.bumpT = .25; noise(.08, .1, 0, 0, 0, 900); vib(15); for (let q = 0; q < 6; q++) S.sp.push({x: a.x + nx * 15, y: a.y + ny * 15, vx: rnd(-140, 140), vy: rnd(-140, 140), t: 0, c: '#ffe08a'}); } } }
    S.bumpT = Math.max(0, (S.bumpT || 0) - dt); S.bumpSent = Math.max(0, (S.bumpSent || 0) - dt); S.wallT = Math.max(0, (S.wallT || 0) - dt); S.fade = Math.max(0, (S.fade || 0) - dt);
    const ground = k => !k.air;
    // Kisten, Hindernisse, Öl, Nasenbären
    S.boxes.forEach((b, bi) => { if (b.off > 0) { b.off = Math.max(0, b.off - dt); return; } ks.forEach(k => { if (!k.remote && b.off <= 0 && Math.hypot(k.x - b.x, k.y - b.y) < 28) { b.off = 3; if (S.live) liveEmit({t: 'box', race: S.live.id, i: bi}); for (let j = 0; j < 8; j++) S.sp.push({x: b.x, y: b.y, vx: rnd(-120, 120), vy: rnd(-120, 120), t: 0, c: '#ffd23f'}); if (!k.item && k.roll <= 0) { k.roll = .9; if (k.me) beep(660, .06, 'square', .05); } else if (k.me && k.item && !k.item2 && k.roll <= 0) { k.item2 = rollItem(k); SFX.pick(); floatTxt(k, k.item2.e + ' 2. Item' + (comboOf(k.item, k.item2) ? ' · KOMBO!' : ''), '#ffd23f'); } } }); });
    // feste Hindernisse: Anprall (zurückschieben, bremsen, wackeln) statt Dreher
    S.obst.forEach(o => ks.forEach(k => { const dx = k.x - o.x, dy = k.y - o.y, d = Math.hypot(dx, dy); if (k.remote || !ground(k) || d >= o.r + 8 || d < .01) return;
      k.x = o.x + dx / d * (o.r + 8); k.y = o.y + dy / d * (o.r + 8); if (k.bump > 0) return; k.bump = .45; k.v *= .4; k.dr = 0; k.dt = 0; S.hl[o.kind] = (S.hl[o.kind] || 0) + 1; if (k.me) { S.shake = .2; SFX.land(); }
      if (Math.random() < .5 && HITSAY[o.kind]) { k.say = HITSAY[o.kind]; k.sayT = 1.3; } }));
    S.oils = S.oils.filter(o => { o.t -= dt; ks.forEach(k => { if (ground(k) && Math.hypot(k.x - o.x, k.y - o.y) < (o.beer ? 52 : 24) && !(o.by === k && (o.fire || o.t > (o.beer ? 9 : 11)))) { hit(k, o.beer ? 'beer' : o.fire ? 'fire' : 'oil'); if (!o.beer && !o.fire) o.t = 0; } }); return o.t > 0; });
    S.coatis = S.coatis.filter(c => { c.t -= dt; c.i += (c.ball ? 1000 : c.flip ? 1150 : 560) / 6 * dt; const tl = c.tgt ? c.tgt.lat : c.l; c.l += clamp(tl - c.l, -90 * dt, 90 * dt);
      if (c.tgt && c.i > c.tgt.idx + (c.tgt.lap - c.by.lap) * N - 4) { c.x += (c.tgt.x - c.x) * Math.min(1, dt * 8); c.y += (c.tgt.y - c.y) * Math.min(1, dt * 8); } else [c.x, c.y] = at(c.i, c.l);
      const v = ks.find(k => k !== c.by && ground(k) && Math.hypot(k.x - c.x, k.y - c.y) < 26); if (v) { hit(v, c.ball ? 'ball' : c.flip ? 'flip' : 'coati'); return false; } return c.t > 0; });
    // Querläufer (Verkäufer, Nasenbären, Kaimane, Pferdekutsche, Hund)
    S.movers.forEach(m => { m.l += m.dir * m.speed * dt; if (Math.abs(m.l) > m.range) { m.dir *= -1; m.l = clamp(m.l, -m.range, m.range); } [m.x, m.y] = at(m.i, m.l);
      m.say = m.say > 0 ? m.say - dt : (Math.random() < dt * .2 ? 2 : 0);
      ks.forEach(k => { if (ground(k) && Math.hypot(k.x - m.x, k.y - m.y) < (m.kind === 'tram' || m.kind === 'bus' ? 44 : m.kind === 'tug' || m.kind === 'fork' ? 32 : m.kind === 'horse' ? 30 : 24) && k.spin <= 0) { hit(k, m.kind); if (m.kind === 'monkey') k.item = null; if (k.me && m.kind === 'vendor') say('vendor', 'Der Caipi-Verkäufer! Mitten auf der Strecke!'); } }); });
    // Tauben fliegen auf
    S.birds.forEach(b => { if (!b.f) { if (ks.some(k => Math.hypot(k.x - b.x, k.y - b.y) < 85)) { b.f = 1; const a = rnd(0, TAU); b.vx = Math.cos(a) * rnd(80, 160); b.vy = Math.sin(a) * rnd(80, 160); if (Math.hypot(ks[0].x - b.x, ks[0].y - b.y) < 120) SFX.birds(); } }
      else { b.f += dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.f > 9) { b.f = 0; b.x = b.x0; b.y = b.y0; } } });
    // Pfützen / Hochwasser (Paraty: Flut steigt und fällt)
    if (T.flood) { S.flood += dt; const f = .75 + .45 * Math.sin(S.flood * TAU / 14); S.puddles.forEach(p => { p.r = p.r0 * f; }); if (f > 1.15 && !S.floodSaid) { S.floodSaid = 1; say('flood', 'Land unter!'); } if (f < .9) S.floodSaid = 0; }
    S.puddles.forEach(p => ks.forEach(k => { if (ground(k) && Math.hypot(k.x - p.x, k.y - p.y) < p.r) { if (!k.wet) { if (k.me) SFX.splash(); for (let j = 0; j < 6; j++) S.sp.push({x: k.x, y: k.y, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: '#bff3ff'}); } k.wet = .35; } }));
    // Delfine (Amazonas): springen auf, durchfahren = Turbo
    S.dolphins.forEach(d => { d.t += dt; d.cd = Math.max(0, d.cd - dt); const up = (d.t % 3.2) < 1.1;
      if (up && d.cd <= 0) ks.forEach(k => { if (k.dol <= 0 && Math.hypot(k.x - d.x, k.y - d.y) < 40) { k.boost = Math.max(k.boost, 1.1); k.dol = 2; d.cd = 1.2; if (k.me) { SFX.mini(2); ach('dolphin'); floatTxt(k, '🐬 Delfin-Turbo!', '#ff9ed2'); say('dolphin', 'Delfin-Turbo!'); } } }); });
    // Welle schwappt über die Uferstraße (Copacabana)
    if (T.wave) { const wv = S.wave; wv.next -= dt;
      if (wv.next < 2.2 && wv.next + dt >= 2.2) { wv.warn = 2.2; const p = ks[0]; if (p.x > T.wave.x0 - 500 && p.x < T.wave.x1 + 400 && p.y > 1050) say('wave', 'Achtung, die Welle!'); }
      wv.warn = Math.max(0, wv.warn - dt);
      if (wv.next <= 0 && !wv.on) { wv.on = 3.2; SFX.splash(); }
      if (wv.on > 0) { wv.on -= dt; const k2 = 1 - Math.abs(wv.on - 1.6) / 1.6; wv.h = 260 * Math.sqrt(clamp(k2, 0, 1)); if (wv.on <= 0) { wv.on = 0; wv.h = 0; wv.next = T.wave.every ? wrnd('wave', T.wave.every[0], T.wave.every[1]) : wrnd('wave', 12, 18); } }
      if (wv.h > 10) ks.forEach(k => { if (ground(k) && k.x > T.wave.x0 && k.x < T.wave.x1 && k.y > shore(k.x) - wv.h) { if (!k.wet && k.me) SFX.splash(); if (!k.wet) for (let j = 0; j < 6; j++) S.sp.push({x: k.x, y: k.y, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: '#bff3ff'}); k.wet = .35; } }); }
    // Ansager: Führungswechsel, Überholen
    if (S.t > 4 && !ks[0].done) { const lead = ks.slice().sort((a, b) => progress(b) - progress(a))[0];
      if (S.leader && lead !== S.leader) { say('lead_' + lead.id, NAME(lead.id) + ' übernimmt die Führung!'); if (lead === ks[0] && performance.now() - (S.hymnAt || -1e9) > 25000) { S.hymnAt = performance.now(); hymn(lead.id); } } S.leader = lead;
      const pl = place(ks[0]); if (pl < S.lastPlace && Math.random() < .5) { Math.random() < .55 ? voice(ks[0], 'over') : say('over', 'Überholt!'); }
      else if (pl > S.lastPlace && Math.random() < .4) { const by = ks.find(o => o !== ks[0] && place(o) === pl - 1); if (by) voice(by, 'over'); }
      S.lastPlace = pl; }
    if (S.t > 1.2 && S.t - dt <= 1.2 && T.id === 'iguacu') { const m = S.movers[0]; if (m) say('coatis', 'Die Nasenbären sind los!'); }
    S.flash = Math.max(0, S.flash - dt);
    // Seitenwind auf der Brücke: Böen schieben alle zur Seite
    if (T.wind && S.t > 0) { const w0 = S.wind || (S.wind = {next: wrnd('wind', 4, 7), on: 0, dir: 1, warn: 0}); w0.next -= dt; if (w0.next < 1.2 && !w0.on) w0.warn = 1; if (w0.next < 0 && !w0.on) { w0.on = 1.6; w0.dir = wr('wind') < .5 ? -1 : 1; w0.warn = 0; noise(1.6, .12, 300); }
      if (w0.on > 0) { w0.on -= dt; ks.forEach(k => { if (!k.air) k.vr += w0.dir * 150 * dt; }); if (w0.on <= 0) { w0.on = 0; w0.next = wrnd('wind', T.wind.every[0], T.wind.every[1]); } } }
    // Tropengewitter: zieht auf, Regen, Blitze, Donner, rutschiger, neue Pfützen auf der Strecke
    { const st = S.storm; if (st.at > 0 && S.t > st.at) { st.f = Math.min(1, st.f + dt / 4);
        if (!st.said) { st.said = 1; say('storm', 'Tropengewitter! Achtung, rutschig!'); }
        st.next -= dt; if (st.next < 0 && st.f > .6) { st.next = wrnd('storm', 2.5, 6); S.flash = Math.max(S.flash, .35); st.bolt = .25; setTimeout(() => { if (S) noise(1.6, .22, 0, 0, 0, 90); }, rnd(150, 700)); }
        st.bolt = Math.max(0, (st.bolt || 0) - dt);
        if (st.f > .7 && st.pud < 6) { st.pud++; const k0 = S.karts[0], [x, y] = S.seed ? at(wr('storm') * N, wrnd('storm', -TW * .3, TW * .3)) : at(k0.idx + rnd(40, 160), rnd(-TW * .3, TW * .3)); S.puddles.push({x, y, r: 0, r0: wrnd('storm', 26, 40), grow: 1}); } }
      S.puddles.forEach(p0 => { if (p0.grow && p0.r < p0.r0) p0.r = Math.min(p0.r0, p0.r + dt * 20); }); } S.coins.forEach(c => { if (c.off > 0) c.off -= dt; });
    if (T.fw) { S.fwT -= dt; if (S.fwT < 0) { S.fwT = rnd(.7, 1.8); const n0 = S.fw.length; fireworks(16); S.fw.slice(n0).forEach(p0 => { p0.t = 0; }); noise(.4, .05, 0, 0, 0, 120); } }
    S.fx = S.fx.filter(f => (f.t += dt) < (f.dust ? .5 : f.txt ? 1.3 : 1));
    S.sp = S.sp.filter(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; return p.t < (p.big ? .9 : .45); });
    ks.forEach(k => { if (k.boost > 0 && Math.random() < dt * 25) S.sp.push({x: k.x - Math.cos(k.a) * 26, y: k.y - Math.sin(k.a) * 26, vx: -Math.cos(k.a) * 80, vy: -Math.sin(k.a) * 80, t: .15, c: '#ffb13b'}); });
    { const k = ks[0]; if (S.t > 0 && !k.done && k.v > 150 && !k.air) { const o = ks.find(o => o !== k && !o.out && (d => d > 26 && d < 150)(Math.hypot(o.x - k.x, o.y - k.y)) && Math.abs(angd(Math.atan2(o.y - k.y, o.x - k.x), k.a)) < .22 && Math.abs(angd(o.a, k.a)) < .5);
        S.draft = o ? (S.draft || 0) + dt : Math.max(0, (S.draft || 0) - dt * 2); if (S.draft > 1.1) { S.draft = 0; k.boost = Math.max(k.boost, .55); floatTxt(k, '💨 Windschatten!', '#bfe8ff'); vib(15); } } }
    ks.forEach(k => { if (!(k.flameT > 0) || k.remote) return; k.flameT -= dt; k.flameD = (k.flameD || 0) - dt; if (k.flameD <= 0) { k.flameD = .12; const x = k.x - Math.cos(k.a) * 30, y = k.y - Math.sin(k.a) * 30; S.oils.push({x, y, t: 6, by: k, fire: 1}); if (S.live) liveEmit({t: 'oil', race: S.live.id, x: Math.round(x), y: Math.round(y), fire: 1}); } });
    evStep(dt);
    if (S.live && S.karts[0]) liveSend(S.karts[0]);
    if (S.tut && S.t > 0) { const st = TUT[S.tut.i]; if (S.tut.t0 === undefined) S.tut.t0 = S.t; if (st && (st.ok(S.karts[0]) || (S.tut.i < TUT.length - 1 && S.t - S.tut.t0 > 30))) { S.tut.i++; S.tut.t0 = S.t; S.tut.ok = performance.now(); SFX.pick(); vib(20); } }
    if (S.pose && S.pose.live) { const wn = S.karts.filter(o => o.done && !o.out).sort((x, y) => x.done - y.done)[0]; if (wn) S.pose.id = wn.id; }
    if (S.live && S.over > 0 && S.over - dt <= 0 && S.karts.some(o => o.remote && o.aiIdx === undefined && !o.done && (o.gone || 0) < 5) && (S.liveWait = (S.liveWait || 0) + dt) < 30) S.over = .3;
    if (S.over > 0) { S.over -= dt; if (S.over <= 0) finish(); }
    // Motor
    const p = ks[0]; if (eng && AC) { const gs = 95, gear = Math.min(4, Math.floor(Math.max(0, p.v) / gs)), rpm = (Math.max(0, p.v) - gear * gs) / gs, base = T.veh === 'cart' ? 90 : T.veh === 'boat' ? 42 : 52;
      const fr = base + gear * 9 + rpm * 70 + (p.boost > 0 ? 35 : 0) + (p.air > 0 ? 40 : 0), now = AC.currentTime;
      eng.o.frequency.setTargetAtTime(fr, now, .04); eng.o2.frequency.setTargetAtTime(fr * .5, now, .04); eng.sub.frequency.setTargetAtTime(fr * .5, now, .04);
      eng.f.frequency.setTargetAtTime(380 + p.v * 2.2 + (p.boost > 0 ? 600 : 0), now, .06);
      eng.g.gain.setTargetAtTime(S.over > 0 || p.done ? .0 : (T.veh === 'cart' ? .012 : .028), now, .1);
      const slide = !p.air && T.veh !== 'boat' && !p.done ? clamp((Math.abs(p.vr) - 50) / 160, 0, 1) + (p.dr ? .5 : 0) : 0; eng.sg.gain.setTargetAtTime(Math.min(.05, slide * .04), now, .05); eng.sf.frequency.setTargetAtTime(2200 + p.v * 2, now, .1); }
  }
  function fireworks(n) { for (let j = 0; j < n; j++) { const cx = rnd(.15, .85), cy = rnd(.12, .45), c = pick(['#ffd23f', '#ff4d4d', '#3fa7ff', '#3ccf6e', '#ff5fa2', '#fff']), a = rnd(0, TAU), v = rnd(60, 260);
    S.fw.push({x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: -Math.floor(j / 14) * .45, c}); } }

  /* ---- Zeichnen ---- */
  const camY = () => H * (W > H ? .56 : .66);
  const OBE = {crate: '📦', umbrella: '⛱️', log: '🪵', suitcase: '🧳', stone: '🪨', nut: '🥥', cone: '🚧', champ: '🍾', stall: '🍉', table: '🪑', barrel: '🛢️', fish: '🐟', cart: '🛒'}, MVE = {tug: '🚚', fork: '🚜', bus: '🚌', soccer: '⚽', vendor: null, corn: '🌽', coati: '🦝', caiman: '🐊', horse: '🐴', dog: '🐕', tram: '🚋', moto: '🛵', monkey: '🐒'};
  const MVSAY = {tug: 'Gepäck kommt!', fork: 'Bip bip bip!', bus: 'Fiiiip!', soccer: 'Gooool!', tram: 'Plim plim!', moto: 'Saaai da frente!', monkey: 'Uh uh uh!', vendor: 'Olha o Caipi! 🍹', corn: 'Milho verde! 🌽', horse: 'Ôa, ôa!', dog: 'Wuff!', caiman: '…', coati: '!!'};
  function draw() {
    const k0 = S.karts[0], nowT = performance.now() / 1000, cdt = clamp(nowT - (S.camT || nowT), 0, .05); S.camT = nowT;
    const spd = Math.hypot(k0.v, k0.vr), zt = 1 - clamp((spd - 250) / 700, 0, .14) - (k0.boost > 0 ? .03 : 0); S.zoom += (zt - S.zoom) * (1 - Math.exp(-cdt * 3));
    const sc = Math.min(W, H) / (W > H ? 380 : 390) * S.zoom * [1.12, 1, .86][SET.cam];
    // Kamera folgt weich: Blickrichtung zwischen Nase und Fahrtrichtung, Vorausblick in Fahrtrichtung
    const la = k0.done ? 0 : 1, wantA = k0.a + angd(k0.mv, k0.a) * .45, kr = 1 - Math.exp(-cdt * 6), kp = 1 - Math.exp(-cdt * 14);
    S.camA += angd(wantA, S.camA) * kr;
    S.camX += (k0.x + Math.cos(k0.mv) * spd * .12 * la - S.camX) * kp; S.camY += (k0.y + Math.sin(k0.mv) * spd * .12 * la - S.camY) * kp;
    const phi = -Math.PI / 2 - S.camA, sh = S.shake > 0 ? S.shake * 18 : 0, tt = performance.now() / 1000;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#0b5d8f'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2 + rnd(-sh, sh), camY() + rnd(-sh, sh)); ctx.scale(sc, sc); ctx.rotate(phi); ctx.translate(-S.camX, -S.camY);
    // außerhalb der Karte: passende Fläche
    const outer = {gru: '#c4c8ce', bridge: '#0b4a6e', manaus: '#34383d', lopes: '#f6ead0', guaruja: '#f1d9a2', copa: '#f1d9a2', reveillon: '#f1d9a2', ilha: '#ecd7a4', iguacu: '#2d6b35', amazon: '#1e5a2c', paraty: '#b9b1a3', sp: '#7d8187', cristo: '#2f7a3a'}[T.id];
    ctx.fillStyle = outer; ctx.fillRect(-3000, -3000, WW + 6000, WH + 6000); if (T.sea) { ctx.fillStyle = '#1694b8'; ctx.fillRect(-3000, shore(0) - 20, WW + 6000, WH + 3000); }
    ctx.drawImage(BG, 0, 0, WW, WH);
    const near = (x, y, r) => Math.abs(x - S.camX) < (r || 760) && Math.abs(y - S.camY) < (r || 760);
    // Brandung (bewegt, nur im Sichtbereich)
    if (T.sea) { const vx0 = S.camX - 700; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4;
      for (let w = 0; w < 3; w++) { const o = ((tt * .35 + w / 3) % 1); ctx.globalAlpha = 1 - o; ctx.beginPath(); for (let X = Math.max(0, vx0); X <= Math.min(WW, vx0 + 1400); X += 25) { const Y = shore(X) + 20 + o * 60 + 6 * Math.sin(X / 40 + tt * 2); X === Math.max(0, vx0) ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); } ctx.stroke(); }
      ctx.globalAlpha = 1; }
    // Welle über der Uferstraße
    const wv = S.wave; if (T.wave && wv.h > 2 && near((T.wave.x0 + T.wave.x1) / 2, 1400, 1100)) { const {x0, x1} = T.wave; ctx.beginPath(); ctx.moveTo(x0 - 60, shore(x0 - 60));
      for (let X = x0 - 60; X <= x1 + 60; X += 20) { const f = Math.sin(clamp((X - x0 + 60) / (x1 - x0 + 120), 0, 1) * Math.PI); ctx.lineTo(X, shore(X) - wv.h * f + 10 * Math.sin(X / 30 + tt * 6)); }
      ctx.lineTo(x1 + 60, shore(x1 + 60)); ctx.closePath(); ctx.fillStyle = 'rgba(47,196,201,.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 7; ctx.stroke(); }
    // Pfützen
    S.puddles.forEach(p => { if (!near(p.x, p.y)) return; ctx.fillStyle = T.id === 'iguacu' ? 'rgba(120,60,30,.7)' : 'rgba(70,150,190,.7)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * .78, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * (.5 + .4 * ((tt * .6) % 1)), p.r * .78 * (.5 + .4 * ((tt * .6) % 1)), 0, 0, TAU); ctx.stroke(); });
    // Reifenspuren
    if (S.marks.length) { ctx.strokeStyle = 'rgba(40,30,25,.32)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); S.marks.forEach(m => { ctx.moveTo(m[0], m[1]); ctx.lineTo(m[2], m[3]); }); ctx.stroke(); }
    const up = (x, y, img, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-phi); ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); ctx.restore(); };
    // Zuschauer (winken, springen, wenn du vorbeifährst)
    SPECT.forEach(s => { if (!near(s.x, s.y)) return; const close = Math.hypot(k0.x - s.x, k0.y - s.y) < 160, j = close ? Math.abs(Math.sin(tt * 9 + s.ph)) * 6 : 0, w = Math.sin(tt * (close ? 12 : 4) + s.ph);
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(-phi); ctx.scale(1 + j / 30, 1 + j / 30); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(3, 10, 9, 5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = s.s; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-12, -10 - w * 5 - j); ctx.moveTo(6, -2); ctx.lineTo(12, -10 + w * 5 - j); ctx.stroke();
      ctx.fillStyle = s.c; ctx.beginPath(); ctx.ellipse(0, 2 - j, 8, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = s.s; ctx.beginPath(); ctx.arc(0, -10 - j, 6, 0, TAU); ctx.fill(); ctx.restore(); });
    S.oils.forEach(o => { if (o.fire) { const fl = .7 + .3 * Math.sin(tt * 20 + o.x); ctx.fillStyle = `rgba(255,${90 + 60 * fl | 0},20,${.55 * Math.min(1, o.t)})`; ctx.beginPath(); ctx.ellipse(o.x, o.y, 22, 16, 0, 0, TAU); ctx.fill(); if (near(o.x, o.y)) up(o.x, o.y - 6, E('🔥', 26), .8 + .2 * fl); return; } if (o.beer) { ctx.fillStyle = 'rgba(255,250,235,.9)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 54, 42, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(240,190,60,.55)'; ctx.beginPath(); ctx.ellipse(o.x + 6, o.y + 4, 36, 26, 0, 0, TAU); ctx.fill(); up(o.x, o.y, E('🍺', 26), 1); return; }
      ctx.fillStyle = 'rgba(255,240,170,.85)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 22, 16, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(o.x - 6, o.y - 4, 7, 4, 0, 0, TAU); ctx.fill(); up(o.x, o.y, E('🧴', 22), .8); });
    S.obst.forEach(o => { if (near(o.x, o.y)) up(o.x, o.y, E(OBE[o.kind] || '🥥', 30), o.kind === 'umbrella' ? 1.3 : 1); });
    evDraw(up, tt);
    // Schranken: offen = hochgeklappt, zu = quer mit Blinklicht; Zahnradbahn fährt durch
    S.gates.forEach(g => { const [px, py] = at(g.i, -TW / 2 - 10); if (!near(px, py)) return; const shut = gateShut(g), ang = Math.atan2(NY[g.i], NX[g.i]);
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang + (shut ? 0 : -1.3)); ctx.fillStyle = '#fff'; ctx.fillRect(0, -5, TW + 10, 10); ctx.fillStyle = '#d62828'; for (let q = 0; q < TW + 10; q += 24) ctx.fillRect(q, -5, 12, 10); ctx.restore();
      if (shut) { ctx.fillStyle = Math.floor(tt * 6) % 2 ? '#ff2a2a' : '#661010'; ctx.beginPath(); ctx.arc(px, py, 7, 0, TAU); ctx.fill();
        if (g.kind === 'train') { const ph = ((S.t + g.ph) % g.period) / g.closed, [tx2, ty2] = at(g.i - 14, -TW * .9 + ph * TW * 1.8); up(tx2, ty2, E('🚃', 60), 1.2); }
        if (g.kind === 'toll') { const [tx2, ty2] = at(g.i - 6, TW / 2 + 30); up(tx2, ty2, E('🧾', 26), 1); } } });
    // Boost-Pfeile leuchten
    PADS.forEach(p => { const [x, y] = at(p.i, p.l); if (!near(x, y)) return; ctx.globalAlpha = .25 + .25 * Math.sin(tt * 8); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; });
    S.coins.forEach(c => { if (c.off > 0 || !near(c.x, c.y)) return; const sx = Math.abs(Math.cos(tt * 4 + c.x * .01)); ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(-phi); ctx.scale(.25 + sx * .75, 1);
      ctx.fillStyle = '#b07800'; ctx.beginPath(); ctx.arc(1.5, 1.5, 10, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff3a0'; ctx.fillRect(-2, -6, 4, 12); ctx.restore(); });
    S.boxes.forEach(b => { if (b.off > 0 || !near(b.x, b.y)) return; const bob = 1 + .08 * Math.sin(tt * 4 + b.l); ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(tt * 1.5); ctx.fillStyle = 'rgba(255,210,63,.92)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.fillRect(-14 * bob, -14 * bob, 28 * bob, 28 * bob); ctx.strokeRect(-14 * bob, -14 * bob, 28 * bob, 28 * bob); ctx.rotate(-tt * 1.5 - phi); ctx.fillStyle = '#7a3e00'; ctx.font = '900 19px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 1); ctx.restore(); });
    S.fx.forEach(f => { if (f.dust) { ctx.fillStyle = `rgba(${f.c || '200,160,100'},${.5 - f.t})`; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + f.t * 30, 0, TAU); ctx.fill(); } });
    // Delfine
    S.dolphins.forEach(d => { if (!near(d.x, d.y)) return; const ph = (d.t % 3.2) / 1.1; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(d.x, d.y, 30 + 6 * Math.sin(tt * 3), 0, TAU); ctx.stroke();
      if (ph < 1) { const z = Math.sin(ph * Math.PI); ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(-phi); ctx.scale(1 + z * .6, 1 + z * .6); ctx.rotate(-.8 + ph * 1.6); ctx.drawImage(E('🐬', 34), -22, -22 - z * 30, 44, 44); ctx.restore(); } });
    // Tauben
    S.birds.forEach(b => { if (!near(b.x, b.y) || b.f > 2.5) return; const fl = b.f > 0, s = 1 + b.f * .6; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(fl ? Math.atan2(b.vy, b.vx) + Math.PI / 2 : b.a); ctx.scale(s, s); ctx.globalAlpha = fl ? clamp(1 - b.f / 2.5, 0, 1) : 1;
      ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.arc(0, -8, 3.5, 0, TAU); ctx.fill();
      if (fl) { const w = Math.sin(tt * 30) * 9; ctx.strokeStyle = '#a7aebb'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-12, w); ctx.moveTo(3, 0); ctx.lineTo(12, w); ctx.stroke(); }
      ctx.restore(); });
    // Querläufer
    S.movers.forEach(m => { if (!near(m.x, m.y)) return; const bob = Math.abs(Math.sin(tt * 8)) * 3;
      if (m.kind === 'vendor') { ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(-phi); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(4, 14, 16, 7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8f4ff'; ctx.fillRect(-18 * m.dir - 9, -4, 18, 16); ctx.drawImage(E('🍹', 22), -18 * m.dir - 14, -16, 28, 28);
        ctx.fillStyle = '#ff6b3d'; ctx.beginPath(); ctx.ellipse(4 * m.dir, 2 - bob, 9, 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c68642'; ctx.beginPath(); ctx.arc(4 * m.dir, -12 - bob, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(4 * m.dir - 8, -21 - bob, 16, 4); ctx.restore(); }
      else { ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(-phi); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(3, 12, 16, 6, 0, 0, TAU); ctx.fill();
        ctx.scale(-m.dir, 1); const s = m.kind === 'tram' ? 78 : m.kind === 'bus' ? 70 : m.kind === 'tug' || m.kind === 'fork' ? 48 : m.kind === 'soccer' ? 26 : m.kind === 'horse' ? 44 : m.kind === 'caiman' ? 46 : 34; ctx.drawImage(E(MVE[m.kind], s), -s * .65, -s * .65 - (m.kind === 'caiman' ? 0 : bob), s * 1.3, s * 1.3); ctx.restore(); } });
    // Funken
    S.sp.forEach(p => { if (p.t < 0) return; ctx.globalAlpha = clamp(1 - p.t / (p.big ? .9 : .45), 0, 1); ctx.fillStyle = p.c; const r = p.big ? 4 + p.t * 10 : 2.5; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); }); ctx.globalAlpha = 1;
    // Fahrzeuge (dreht mit, Kopf bleibt aufrecht)
    S.karts.slice().sort((a, b) => (a.air > 0) - (b.air > 0) || a.y - b.y).forEach(k => {
      const z = k.air > 0 ? Math.sin(Math.PI * (1 - k.air / k.airT)) : 0, s = 1 + z * .38, tr = k.trick && k.air > 0 ? (1 - k.air / k.airT) * TAU : 0;
      ctx.save(); ctx.translate(k.x, k.y); ctx.fillStyle = `rgba(0,0,0,${.25 - z * .12})`; ctx.beginPath(); ctx.ellipse(3 + z * 16, 4 + z * 16, 20 * (1 - z * .2), 26 * (1 - z * .2), k.a + Math.PI / 2, 0, TAU); ctx.fill();
      ctx.scale(s, s); ctx.rotate(k.a + Math.PI / 2 + k.rot + k.yaw + tr + (k.bump > 0 ? Math.sin(k.bump * 40) * .25 * k.bump : 0) + clamp(k.vr / 900, -.12, .12)); if (k.squash > 0) ctx.scale(1 + k.squash * .5, 1 - k.squash * .35);
      if (k.boost > 0) { const fl = 40 + Math.random() * 18; ctx.fillStyle = 'rgba(255,90,0,.55)'; ctx.beginPath(); ctx.moveTo(-11, 24); ctx.quadraticCurveTo(0, fl + 14, 11, 24); ctx.fill(); ctx.fillStyle = `rgba(255,${190 + Math.random() * 60 | 0},60,.95)`; ctx.beginPath(); ctx.moveTo(-6, 24); ctx.quadraticCurveTo(0, fl, 6, 24); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(-3, 24); ctx.quadraticCurveTo(0, fl * .7, 3, 24); ctx.fill(); }
      if (k.stall > 0) { ctx.fillStyle = 'rgba(120,120,120,.6)'; ctx.beginPath(); ctx.arc(rnd(-6, 6), 34 + rnd(0, 8), 9, 0, TAU); ctx.fill(); }
      if (k.glow > 0) { ctx.fillStyle = `rgba(255,70,30,${.35 + .2 * Math.sin(tt * 20)})`; ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fill(); }
      if (k.inv > 0) { ctx.strokeStyle = `hsl(${tt * 600 % 360},90%,60%)`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke(); }
      const fw = FW[k.vtype]; if (fw) { ctx.fillStyle = '#111'; fw.forEach(([wx, wy]) => { ctx.save(); ctx.translate(wx, wy); ctx.rotate(k.steer * .5); ctx.fillRect(-3, -7, 6, 14); ctx.restore(); }); }
      ctx.drawImage(VEH[k.vkey || k.id] || VEH[k.id], -22, -30, 44, 60);
      if (k.brk && k.v > 20) { ctx.fillStyle = '#ff2020'; ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 8; ctx.fillRect(-11, 22, 6, 4); ctx.fillRect(5, 22, 6, 4); ctx.shadowBlur = 0; }
      ctx.restore();
      if (k.slowT > 0 && k.slowE) up(k.x + 18, k.y - 18, E(k.slowE, 22), .9); if (k.blind > 0) up(k.x - 18, k.y - 18, E('😵', 22), .9);
      if (k.out) { up(k.x, k.y - 34, E('📴', 22), .9); }
      up(k.x, k.y - z * 2 + (T.veh === 'cart' ? -8 : 0), headImg(k.id), (k.me ? .31 : .275) * s);
      if (k.id === S.rival && !k.done) up(k.x + 20, k.y - 22, E('⚔️', 20), .75);
      if (k.shield > 0 && (k.shield > 1.5 || Math.floor(tt * 8) % 2)) { ctx.save(); ctx.globalAlpha = .9; up(k.x, k.y - 30, E('⛱️', 40), .9); ctx.restore(); ctx.strokeStyle = 'rgba(127,211,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(k.x, k.y, 36, 0, TAU); ctx.stroke(); }
      if (k.parrot > 0) up(k.x - 18, k.y - 24, E('🦜', 24), .9);
      if (k.item && !k.me && k.roll <= 0) up(k.x, k.y, E(k.item.e, 20), .7);
    });
    S.coatis.forEach(c => up(c.x, c.y, E(c.ball ? '⚽' : c.flip ? '🩴' : '🦝', c.ball || c.flip ? 26 : 34), 1));
    // Geist: halbdurchsichtig, ohne Zusammenstoß
    const G = S.ghost; if (G && G.g && S.t >= 0) { const f = S.t / .1, i = Math.min(G.g.length - 2, Math.floor(f)), r = clamp(f - i, 0, 1), a0 = G.g[Math.max(0, i)], a1 = G.g[Math.max(0, i + 1)];
      if (a0 && a1) { const gx = a0[0] + (a1[0] - a0[0]) * r, gy = a0[1] + (a1[1] - a0[1]) * r, ga = (a0[2] + angd(a1[2] / 100, a0[2] / 100) * 100 * r) / 100; G.x = gx; G.y = gy;
        ctx.save(); ctx.globalAlpha = .45; ctx.translate(gx, gy); ctx.rotate(ga + Math.PI / 2); ctx.drawImage(VEH[G.drv] || VEH[me], -22, -30, 44, 60); ctx.restore();
        ctx.save(); ctx.globalAlpha = .55; up(gx, gy, HEAD[G.drv] || HEAD[me], .25); ctx.restore(); ctx.save(); ctx.globalAlpha = .8; up(gx, gy - 30, E('👻', 18), .8); ctx.restore(); } }
    ctx.restore();
    // Wetter im Bild: Regen (Iguaçu), Gischt-Nebel am Wasserfall
    if (S.storm.f > 0) { ctx.save(); ctx.fillStyle = `rgba(10,20,40,${.38 * S.storm.f})`; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = `rgba(200,225,255,${.5 * S.storm.f})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let j = 0; j < [50, 90, 130][SET.q] * S.storm.f; j++) { const x = (j * 97 + tt * 520) % (W + 60) - 30, y = (j * 53 + tt * 1100) % (H + 40) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 20); } ctx.stroke();
      if (S.storm.bolt > 0) { ctx.strokeStyle = 'rgba(255,255,240,.95)'; ctx.lineWidth = 3; ctx.beginPath(); let bx = W * (.2 + ((S.t * 7) % 1) * .6), by = 0; ctx.moveTo(bx, by); while (by < H * .45) { bx += rnd(-30, 30); by += rnd(20, 45); ctx.lineTo(bx, by); } ctx.stroke(); } ctx.restore(); }
    if (T.rain) { ctx.save(); ctx.strokeStyle = 'rgba(200,225,255,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let j = 0; j < [40, 70, 90][SET.q]; j++) { const x = (j * 97 + tt * 420) % (W + 60) - 30, y = (j * 53 + tt * 900) % (H + 40) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); } ctx.stroke();
      ctx.fillStyle = 'rgba(30,60,80,.12)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (T.mist) { const dm = Math.hypot(k0.x - T.mist.x, k0.y - T.mist.y), f = clamp(1 - (dm - T.mist.r * .4) / T.mist.r, 0, 1) * .6;
      if (f > .02) { const g = ctx.createRadialGradient(W / 2, camY(), 60, W / 2, camY(), Math.max(W, H) * .8); g.addColorStop(0, `rgba(240,250,255,${f * .25})`); g.addColorStop(1, `rgba(240,250,255,${f})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
    { const ni = (RULE && RULE.k === 'night') || (S.ev && S.ev.cur && S.ev.cur.k === 'blackout') ? 1 : T.night ? .78 : S.tod === 'night' ? .7 : 0;
      if (ni > 0) { const g = ctx.createRadialGradient(W / 2, camY() - 70, 40, W / 2, camY() - 70, Math.max(W, H) * .55); g.addColorStop(0, 'rgba(5,10,35,0)'); g.addColorStop(.45, `rgba(5,10,35,${.55 * ni})`); g.addColorStop(1, `rgba(5,10,35,${.93 * ni})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      else if (S.tod === 'dusk') { ctx.fillStyle = 'rgba(255,120,40,.16)'; ctx.fillRect(0, 0, W, H); } else if (S.tod === 'dawn') { ctx.fillStyle = 'rgba(255,170,190,.12)'; ctx.fillRect(0, 0, W, H); }
      if (T.fog) { const g = ctx.createRadialGradient(W / 2, camY(), 80, W / 2, camY(), Math.max(W, H) * .6); g.addColorStop(0, 'rgba(235,240,245,.05)'); g.addColorStop(1, 'rgba(235,240,245,.72)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
    { const sp0 = Math.hypot(k0.v, k0.vr), inten = clamp((sp0 - 300) / 140, 0, 1) + (k0.boost > 0 ? .6 : 0);
      if (inten > .05 && !k0.done) { ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${Math.min(.55, inten * .35)})`; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j < 22; j++) { const an = rnd(0, TAU), r0 = Math.max(W, H) * rnd(.42, .55), r1 = r0 * rnd(.72, .86), cx = W / 2, cy = camY() - 40; ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); }
        ctx.stroke(); ctx.restore(); } }
    if (S.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(.8, S.fade * 1.6)})`; ctx.fillRect(0, 0, W, H); }
    if (S.flash > 0) { ctx.fillStyle = `rgba(255,170,120,${Math.min(.85, S.flash)})`; ctx.fillRect(0, 0, W, H); }
    if (k0.peg > .3 && !k0.done) { ctx.fillStyle = `rgba(255,120,200,${k0.peg * .08})`; ctx.fillRect(0, 0, W, H); }
    // Bildschirm: schwebende Texte, Sprechblasen
    S.fx.forEach(f => { if (!f.txt) return; const p = toScreen(f.x, f.y, sc, phi); ctx.save(); ctx.globalAlpha = clamp(1.3 - f.t, 0, 1); ctx.font = '900 20px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)';
      const y = p[1] - 48 - f.t * 40; ctx.strokeText(f.txt, p[0], y); ctx.fillStyle = f.col; ctx.fillText(f.txt, p[0], y); ctx.restore(); });
    S.karts.forEach(k => { if (k.sayT <= 0) return; const p = toScreen(k.x, k.y, sc, phi); bubble(p[0], p[1] - 34 * sc, k.say, Math.min(1, k.sayT * 3)); });
    if (S.live) { const tn = performance.now(); ctx.save(); ctx.textAlign = 'center'; S.karts.forEach(k => { if (k.me || k.out) return; const p = toScreen(k.x, k.y, sc, phi); if (p[0] < -40 || p[0] > W + 40 || p[1] < -40 || p[1] > H + 40) return;
        if (k.aiIdx === undefined) { const t = NAME(k.who || k.id) + (k.lagging ? ' 📶' : ''); ctx.font = '800 12px system-ui,sans-serif'; const w = ctx.measureText(t).width + 12; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(p[0] - w / 2, p[1] + 22 * sc, w, 18, 9) : ctx.rect(p[0] - w / 2, p[1] + 22 * sc, w, 18); ctx.fill(); ctx.fillStyle = '#9ff0b4'; ctx.fillText(t, p[0], p[1] + 22 * sc + 13); } });
      S.karts.forEach(k => { if (!(k.emoU > tn)) return; const p = toScreen(k.x, k.y, sc, phi), a = clamp((k.emoU - tn) / 400, 0, 1), up = (2400 - (k.emoU - tn)) / 2400; ctx.globalAlpha = a; ctx.font = '40px system-ui,sans-serif'; ctx.fillText(k.emo, p[0], p[1] - 52 * sc - up * 26); ctx.globalAlpha = 1; }); ctx.restore(); }
    S.movers.forEach(m => { if (m.say > 0 && near(m.x, m.y, 500) && MVSAY[m.kind] && m.kind !== 'coati' && m.kind !== 'caiman' && m.kind !== 'monkey') { const p = toScreen(m.x, m.y, sc, phi); bubble(p[0], p[1] - 30 * sc, MVSAY[m.kind], Math.min(1, m.say)); } });
    hud(sc);
    if (S.pod) podDraw();
  }
  function toScreen(x, y, sc, phi) { const dx = x - S.camX, dy = y - S.camY, c = Math.cos(phi), s = Math.sin(phi); return [W / 2 + (dx * c - dy * s) * sc, camY() + (dx * s + dy * c) * sc]; }
  function bubble(x, y, t, a) { ctx.save(); ctx.globalAlpha = a; ctx.font = '700 14px system-ui,sans-serif'; const w = ctx.measureText(t).width + 16; x = clamp(x, w / 2 + 6, W - w / 2 - 6);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 30, w, 26, 12) : ctx.rect(x - w / 2, y - 30, w, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y - 17); ctx.restore(); }
  function hud() {
    const k = S.karts[0], pl = place(k), top = 12, now = performance.now();
    ctx.save(); ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
    ctx.fillStyle = pl === 1 ? '#ffd23f' : '#fff'; ctx.font = '900 44px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(pl + '.', W / 2, top + 30);
    ctx.font = '700 14px system-ui,sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Runde ' + clamp(k.lap + 1, 1, LAPS) + '/' + LAPS + ' · ' + fmt(Math.max(0, (k.done || S.t)) * 1000), W / 2, top + 78);
    if (S.live) { const ord = S.karts.slice().sort((a, b) => place(a) - place(b)); ctx.save(); ctx.textAlign = 'right'; ctx.font = '700 12px system-ui,sans-serif'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4;
      ord.forEach((o, i) => { const y = top + 150 + i * 17; if (o.out) ctx.globalAlpha = .45; ctx.fillStyle = o.me ? '#ffd23f' : o.aiIdx !== undefined ? 'rgba(255,255,255,.7)' : '#9ff0b4'; ctx.fillText((i + 1) + '. ' + (o.me ? 'Du' : NAME(o.who || o.id)) + (o.aiIdx !== undefined ? ' 🤖' : '') + (o.out ? ' 📴' : o.lagging ? ' 📶' : '') + (o.done ? ' 🏁' : ''), W - 14, y); ctx.globalAlpha = 1; }); ctx.restore(); }
    if (S.live && LIVE.gp) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('🏆 Live-Pokal · Rennen ' + (LIVE.gp.i + 1) + '/' + LIVE.gp.list.length + ' · ' + T.e + ' ' + T.name, W / 2, top + 98); }
    else if (CUP) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(CUP.e + ' ' + CUP.n + ' · Rennen ' + (CUP.i + 1) + '/' + CUP.list.length + ' · ' + T.e + ' ' + T.name, W / 2, top + 98); }
    else if (RULE) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('🎯 Tages-Challenge · ' + RULE.e + ' ' + RULE.n, W / 2, top + 98); }
    else if (S.ghost) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('👻 Geist: ' + NAME(S.ghost.who) + ' · ' + fmt(S.ghost.ms), W / 2, top + 98); }
    // Ansager-Zeile
    if (banner && now < banner.until) { ctx.globalAlpha = clamp((banner.until - now) / 300, 0, 1); ctx.font = '800 16px system-ui,sans-serif'; const t = '🎙 ' + banner.t, w = Math.min(W - 20, ctx.measureText(t).width + 24);
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(200,20,40,.88)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W / 2 - w / 2, top + 142, w, 28, 14) : ctx.rect(W / 2 - w / 2, top + 142, w, 28); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(t, W / 2, top + 148, W - 36); ctx.globalAlpha = 1; }
    if (S.wind && (S.wind.warn || S.wind.on > 0) && Math.floor(now / 250) % 2) { ctx.font = '900 22px system-ui,sans-serif'; ctx.fillStyle = '#d9f2ff'; ctx.shadowBlur = 8; ctx.fillText(S.wind.on > 0 ? (S.wind.dir > 0 ? '💨 Seitenwind →' : '← Seitenwind 💨') : '💨 Böe kommt!', W / 2, top + 178); }
    if (T.wave && S.wave.warn > 0 && Math.floor(now / 250) % 2) { ctx.font = '900 22px system-ui,sans-serif'; ctx.fillStyle = '#7fe9ff'; ctx.shadowBlur = 8; ctx.fillText('🌊 Welle kommt!', W / 2, top + 178); }
    ctx.shadowBlur = 0;
    { ctx.font = '800 14px system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#ffd23f'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4; ctx.fillText('🪙 ' + S.got, W - 14, top + 110);
      const rv = S.karts.find(o => o.id === S.rival); if (rv) { ctx.fillStyle = '#ffb86b'; ctx.font = '700 12px system-ui,sans-serif'; ctx.fillText('⚔️ ' + NAME(rv.id) + ' ' + (S.rivalAhead ? '▲' : '▼'), W - 14, top + 130); } ctx.textAlign = 'center'; ctx.shadowBlur = 0; }
    if (S.evBan && now < S.evBan.until) { ctx.save(); ctx.globalAlpha = clamp((S.evBan.until - now) / 400, 0, 1); ctx.font = '900 17px system-ui,sans-serif'; ctx.textAlign = 'center'; const w0 = Math.min(W - 20, ctx.measureText(S.evBan.t).width + 28); ctx.fillStyle = 'rgba(120,20,160,.9)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W / 2 - w0 / 2, top + 186, w0, 32, 16) : ctx.rect(W / 2 - w0 / 2, top + 186, w0, 32); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(S.evBan.t, W / 2, top + 202, W - 36); ctx.restore(); ctx.textBaseline = 'top'; }
    if (S.ev && S.ev.cur && S.ev.cur.k === 'police' && !k.done) { const d = wrap(S.ev.cur.i - k.idx); if (d < 160 && Math.floor(now / 250) % 2) { ctx.font = '900 18px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = Math.hypot(k.v, k.vr) > 165 ? '#ff5a4a' : '#9dffb4'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 6; ctx.fillText('🚔 Kontrolle voraus: ' + (Math.hypot(k.v, k.vr) > 165 ? 'BREMSEN!' : 'gut so'), W / 2, top + 226); ctx.shadowBlur = 0; } }
    // Item-Fenster
    const ix = W - 70, iy = top + 44; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(ix, iy, 58, 58, 14) : ctx.rect(ix, iy, 58, 58); ctx.fill(); ctx.stroke();
    const show = k.roll > 0 ? ILIST[Math.floor(now / 90) % ILIST.length] : k.item; if (show) ctx.drawImage(E(show.e, 36), ix + 29 - 23, iy + 29 - 23, 46, 46);
    if (k.item || k.item2) { const jx = ix - 44, jy = iy + 14; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.strokeStyle = 'rgba(255,210,63,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(jx, jy, 36, 36, 10) : ctx.rect(jx, jy, 36, 36); ctx.fill(); ctx.stroke(); if (k.item2) ctx.drawImage(E(k.item2.e, 28), jx + 4, jy + 4, 28, 28);
      const cb = comboOf(k.item, k.item2); if (cb) { ctx.font = '900 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = Math.floor(now / 200) % 2 ? '#ff7ae0' : '#fff'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 4; ctx.fillText(cb.e + ' KOMBO', ix + 6, iy + 70); ctx.shadowBlur = 0; } }
    // Kurven-Warnung: scharfe Kurve voraus
    if (S.t > 0 && !k.done && SCURV.length) { let w = 0; for (let j = 25; j < 120; j += 5) { const c = SCURV[wrap(k.idx + j)]; if (Math.abs(c) > 1 / 330) { w = c; break; } }
      if (w) { const hard = Math.abs(w) > 1 / 250 && k.v > 230, txt = (w > 0 ? '↱ ' : '↰ ') + (hard ? 'Bremsen!' : w > 0 ? 'Rechtskurve' : 'Linkskurve');
        ctx.font = '900 17px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 6; ctx.fillStyle = hard ? (Math.floor(now / 180) % 2 ? '#ff5a4a' : '#fff') : '#ffd23f'; ctx.fillText(txt, W / 2, top + 122); ctx.shadowBlur = 0; } }
    // Tacho (unten links) und Rundenzeit-Hinweis
    { const kmh = Math.round(Math.hypot(k.v, k.vr) * .45), cx = 54, cy = H - 150, r = 34, f = clamp(kmh / 200, 0, 1);
      ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * .8, Math.PI * 2.2); ctx.stroke();
      ctx.strokeStyle = k.boost > 0 ? '#ff8a2a' : f > .85 ? '#ffd23f' : '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * .8, Math.PI * (.8 + 1.4 * f)); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4; ctx.textAlign = 'center'; ctx.font = '900 18px system-ui,sans-serif'; ctx.fillText(kmh, cx, cy - 10); ctx.font = '700 9px system-ui,sans-serif'; ctx.fillText('km/h', cx, cy + 9); ctx.shadowBlur = 0; }
    if (S.lapMsg && now < S.lapMsg.until) { const m = S.lapMsg, a0 = clamp((m.until - now) / 400, 0, 1); ctx.globalAlpha = a0; ctx.font = '800 15px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#fff'; ctx.fillText('⏱ ' + m.t, W / 2, top + 190); if (m.d !== null) { ctx.fillStyle = m.d <= 0 ? '#5dff8a' : '#ff8a8a'; ctx.fillText((m.d <= 0 ? '−' : '+') + Math.abs(m.d).toFixed(2) + ' s zur besten Runde', W / 2, top + 210); } ctx.shadowBlur = 0; ctx.globalAlpha = 1; }
    // Drift-Anzeige
    if (k.dr) { const lvl = k.dt > 1.5 ? 2 : k.dt > .75 ? 1 : 0, w = 120, f = clamp(k.dt / 1.5, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(W / 2 - w / 2, H - 132, w, 8);
      ctx.fillStyle = ['#fff6c0', '#5ec8ff', '#ff8a2a'][lvl]; ctx.fillRect(W / 2 - w / 2, H - 132, w * f, 8); }
    // Minikarte
    const mw = 92, mh = Math.round(92 * WH / WW);
    if (!MINI) { MINI = new Path2D(); P.forEach((p, i) => { const x = p[0] / WW * mw, y = p[1] / WH * mh; i ? MINI.lineTo(x, y) : MINI.moveTo(x, y); }); MINI.closePath(); }
    ctx.save(); ctx.translate(12, top + 50); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-4, -4, mw + 8, mh + 8); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.stroke(MINI);
    if (S.ghost && S.ghost.x) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(S.ghost.x / WW * mw, S.ghost.y / WH * mh, 4, 0, TAU); ctx.fill(); }
    S.karts.slice().reverse().forEach(o => { ctx.fillStyle = (LOOK[o.id] || {}).shirt || '#0a5'; ctx.strokeStyle = o.me ? '#ff2a2a' : '#000'; ctx.lineWidth = o.me ? 2.5 : 1; ctx.beginPath(); ctx.arc(o.x / WW * mw, o.y / WH * mh, o.me ? 5 : 3.5, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.restore();
    // Abstände: Vordermann, Hintermann, Geist (Sekunden)
    if (S.t > 0 && !k.done) { const all = S.karts.filter(o => o !== k && !o.done).sort((x, y) => progress(y) - progress(x)), pk = progress(k), v = Math.max(k.v, 90);
      const ah = all.filter(o => progress(o) > pk).pop(), bh = all.find(o => progress(o) < pk), rows = [];
      if (ah && progress(ah) - pk < N) rows.push(['▲ ' + NAME(ah.who || ah.id), '+' + ((progress(ah) - pk) * 6 / v).toFixed(1) + ' s', '#ff9a8a']);
      if (bh && pk - progress(bh) < N) rows.push(['▼ ' + NAME(bh.who || bh.id), '−' + ((pk - progress(bh)) * 6 / v).toFixed(1) + ' s', '#9dffb4']);
      const gg = S.ghost ? ghostGap(pk) : null; if (gg !== null) rows.push(['👻 Geist', (gg > 0 ? '+' : '−') + Math.abs(gg).toFixed(1) + ' s', gg > 0 ? '#ff9a8a' : '#9dffb4']);
      ctx.font = '700 11px system-ui,sans-serif'; ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4;
      rows.forEach((r, i) => { const y = top + 50 + mh + 12 + i * 15; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(r[0], 10, y, 62); ctx.textAlign = 'right'; ctx.fillStyle = r[2]; ctx.fillText(r[1], 108, y); }); ctx.shadowBlur = 0; ctx.textAlign = 'center'; }
    if (S.live && S.liveWait > 0) { ctx.font = '800 16px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 6; ctx.fillText('⏳ Warte auf die anderen … ' + Math.ceil(30 - S.liveWait) + ' s', W / 2, H * .25); ctx.shadowBlur = 0; }
    // Fahrschule: Aufgabe oben einblenden
    if (S.tut) { const st = TUT[Math.min(S.tut.i, TUT.length - 1)], fresh = performance.now() - S.tut.ok < 900; ctx.save(); const bw = Math.min(W - 24, 420), bx = (W - bw) / 2, by = H - (W > H ? 180 : 250);
      ctx.fillStyle = fresh ? 'rgba(40,160,80,.92)' : 'rgba(6,26,48,.88)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, 64, 14) : ctx.rect(bx, by, bw, 64); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffd23f'; ctx.font = '900 12px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText((fresh ? '✅ ' : '🎓 ') + 'Fahrschule ' + Math.min(S.tut.i + 1, TUT.length) + '/' + TUT.length, bx + 12, by + 8);
      ctx.fillStyle = '#fff'; ctx.font = '700 13px system-ui,sans-serif'; const words = st.t.split(' '); let line = '', ly = by + 26; words.forEach(w0 => { if (ctx.measureText(line + w0).width > bw - 24) { ctx.fillText(line, bx + 12, ly); line = ''; ly += 16; } line += w0 + ' '; }); ctx.fillText(line, bx + 12, ly); ctx.restore(); }
    // Siegerpose
    if (S.pose) { const ps = S.pose, a0 = clamp((performance.now() - ps.t0) / 400, 0, 1), el = (performance.now() - ps.t0) / 1000; ctx.save(); ctx.globalAlpha = a0;
      const g = ctx.createRadialGradient(W / 2, H * .42, 40, W / 2, H * .42, Math.max(W, H) * .7); g.addColorStop(0, 'rgba(255,210,63,.35)'); g.addColorStop(1, 'rgba(4,18,34,.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const PE = {jonas: '💸', simon: '☀️', patrick: '♿', marco: '⚽', greisel: '🍺', dajo: '🥟'}[ps.id] || '🎉';
      for (let j = 0; j < 22; j++) { const x = (j * 97 + 30) % W, y = ((el * (140 + (j % 5) * 40) + j * 71) % (H + 80)) - 40; ctx.save(); ctx.translate(x, y); ctx.rotate(el * (j % 2 ? 2 : -2) + j); ctx.drawImage(E(PE, 30), -18, -18, 36, 36); ctx.restore(); }
      const hb = Math.abs(Math.sin(el * 6)) * 18, hs = 150, img = headImg(ps.id); ctx.save(); ctx.translate(W / 2, H * .42 - hb); ctx.rotate(ps.id === 'patrick' ? Math.sin(el * 12) * .25 : Math.sin(el * 5) * .08);
      if (ps.id === 'simon') { ctx.fillStyle = `rgba(255,60,30,${.35 + .2 * Math.sin(el * 10)})`; ctx.beginPath(); ctx.arc(0, 0, hs * .62, 0, TAU); ctx.fill(); }
      ctx.drawImage(img, -img.width / 2 * hs / 116, -img.height / 2 * hs / 116, img.width * hs / 116, img.height * hs / 116); ctx.restore();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffd23f'; ctx.font = 'italic 900 30px system-ui,sans-serif';
      ctx.fillText('🏆 ' + NAME(ps.id).toUpperCase() + ' GEWINNT!', W / 2, H * .42 + hs * .7, W - 30);
      const wl = (VTXT2[ps.id] || {}).win; if (wl) { ctx.font = '700 16px system-ui,sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('„' + wl + '“', W / 2, H * .42 + hs * .7 + 36, W - 30); }
      ctx.shadowBlur = 0; ctx.restore(); }
    // Zwischenzeit-Meldung
    if (S.secMsg && performance.now() < S.secMsg.until) { const m = S.secMsg; ctx.globalAlpha = clamp((m.until - performance.now()) / 400, 0, 1); ctx.font = '800 14px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#fff'; ctx.fillText('⏱ ' + m.t + (m.d !== null ? '  ' : ''), W / 2 - (m.d !== null ? 30 : 0), top + 232); if (m.d !== null) { ctx.fillStyle = m.d <= 0 ? '#5dff8a' : '#ff8a8a'; ctx.textAlign = 'left'; ctx.fillText((m.d <= 0 ? '−' : '+') + Math.abs(m.d).toFixed(2), W / 2 + ctx.measureText('⏱ ' + m.t).width / 2 - 20, top + 232); } ctx.shadowBlur = 0; ctx.globalAlpha = 1; }
    ctx.restore();
    // Countdown / Ziel
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10;
    if (S.t < .9 && S.t > -3) { const c = Math.ceil(-S.t), lw = 150, lx = W / 2 - lw / 2, ly = H * .245;   // Startampel
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(20,20,20,.85)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx, ly, lw, 54, 14) : ctx.rect(lx, ly, lw, 54); ctx.fill();
      for (let j = 0; j < 3; j++) { const on = S.t >= 0 ? 'g' : (3 - j) >= c ? 'r' : ''; ctx.fillStyle = on === 'g' ? '#3cff7a' : on === 'r' ? '#ff3b30' : '#3a3a3a'; ctx.shadowColor = on ? ctx.fillStyle : 'transparent'; ctx.shadowBlur = on ? 18 : 0;
        ctx.beginPath(); ctx.arc(lx + 30 + j * 45, ly + 27, 16, 0, TAU); ctx.fill(); } ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,.6)'; }
    if (S.t < 0 && S.t > -3) { const c = Math.ceil(-S.t), f = 1 + (Math.ceil(-S.t) + S.t) * .4; ctx.fillStyle = c === 1 ? '#ffd23f' : '#fff'; ctx.font = `900 ${100 * f | 0}px system-ui,sans-serif`; ctx.fillText(c, W / 2, H * .43);
      ctx.shadowBlur = 0; ctx.font = '700 14px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('Tipp genau bei der 1 = 🚀 Raketenstart', W / 2, H * .43 + 76, W - 24); }
    else if (S.t >= 0 && S.t < .9) { ctx.fillStyle = '#3ccf6e'; ctx.font = '900 90px system-ui,sans-serif'; ctx.fillText('LOS!', W / 2, H * .38); }
    if (S.t < -3) { ctx.fillStyle = '#fff'; ctx.font = '900 34px system-ui,sans-serif'; ctx.fillText(T.e + ' ' + T.name, W / 2, H * .36); ctx.font = '700 16px system-ui,sans-serif'; ctx.fillText(T.sub, W / 2, H * .36 + 34); }
    if (k.done) { ctx.fillStyle = '#ffd23f'; ctx.font = '900 70px system-ui,sans-serif'; ctx.fillText('ZIEL!', W / 2, H * .38); }
    if (S.t >= 0 && S.t < 6 && !k.done) { ctx.shadowBlur = 0; ctx.globalAlpha = clamp(6 - S.t, 0, 1) * .85; ctx.fillStyle = '#fff'; ctx.font = '700 14px system-ui,sans-serif';
      ctx.fillText(T.veh === 'boat' ? 'Boot: träge Lenkung, früh einlenken · 🐬 = Turbo' : T.gates ? 'Schranken im Takt · 🚧 ausweichen' : T.wind ? 'Brücke: Seitenwind-Böen, gegenlenken!' : T.belts ? 'Gepäckbänder: mit dem Band schneller, dagegen langsamer' : T.fog ? 'Nebel! Achte auf die Kurven-Schilder' : T.rain ? 'Rutschig! Früh einlenken · Nasenbären!' : T.flood ? 'Pfützen bremsen · die Flut steigt!' : T.veh === 'cart' ? 'Gepäckkarren-Rennen · Koffer und Hund ausweichen!' : 'Halten = lenken · lange halten = Drift + Turbo', W / 2, H * .5, W - 24); }
    ctx.restore();
    // Feuerwerk / Konfetti
    if (S.fw.length) { ctx.save(); S.fw.forEach(p => { if (p.t < 0) return; ctx.globalAlpha = clamp(1.4 - p.t, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x * W + p.vx * p.t, p.y * H + p.vy * p.t + 60 * p.t * p.t, 3, 0, TAU); ctx.fill(); }); ctx.restore(); }
  }

  /* ---- Ablauf ---- */
  function resize() { DPR = Math.min([1, 1.5, 2][SET.q], window.devicePixelRatio || 1); box.classList.toggle('ana', SET.ctl === 'analog'); W = box.clientWidth; H = box.clientHeight; cv.width = W * DPR; cv.height = H * DPR; }
  // Ruckel-Schutz: läuft das Rennen über 4 s mit unter ~40 Bildern/s, Grafik automatisch eine Stufe runter (höchstens bis Niedrig)
  const PERF = {acc: 0, n: 0, t: 0, done: false};
  function perfCheck(raw) { if (!S || S.paused || S.t < 1 || PERF.done || SET.q === 0 || document.hidden) return; PERF.acc += raw; PERF.n++; PERF.t += raw;
    if (PERF.t < 4) return; const avg = PERF.acc / PERF.n; PERF.acc = PERF.n = PERF.t = 0;
    if (avg > 1 / 40) { SET.q--; SET.qAuto = 1; saveSet(); resize(); setTxt(); toast('⚙️ Grafik automatisch auf <b>' + ['Niedrig', 'Normal', 'Hoch'][SET.q] + '</b> gestellt, damit es flüssig läuft.'); if (SET.q === 0) PERF.done = true; } }
  function loop(ts) { raf = requestAnimationFrame(loop); const raw = (ts - (last || ts)) / 1000; let dt = Math.min(.05, raw); last = ts; if (!S) return; if (raw > 0 && raw < .5) perfCheck(raw);
    if (S.fw.length) { S.fw.forEach(p => { p.t += dt; }); S.fw = S.fw.filter(p => p.t < 1.5); }
    if (!S.paused) { if (S.slow > 0) { S.slow -= dt; dt *= .3; } step(dt); } musTick(); draw(); }
  const headCv = (id, n) => { const c = document.createElement('canvas'); c.width = c.height = n || 64; c.getContext('2d').drawImage(HEAD[id], 0, 0, c.width, c.height); return c; };
  function finish() {
    if (S.live && S.pose) { const wk = S.karts.find(o => o.id === S.pose.id); if (wk) voice(wk, 'win', 1); }
    const ks = S.karts; ks.forEach(k => { if (!k.done) k.est = k.out ? 1e6 : S.t + (LAPS * N - progress(k)) * 6 / (VMAX * .9); });
    const order = ks.slice().sort((a, b) => (a.done || a.est) - (b.done || b.est)), mine = ks[0], bkey = T.id + (RULE ? '@' + RULE.k : ''), b = best(), prev = b[bkey], rec = !prev || mine.done * 1000 < prev, ms = Math.round(mine.done * 1000);
    if (rec) { b[bkey] = ms; store.set('kartBest', JSON.stringify(b)); if (!RULE) try { localStorage.setItem('br26.kartGhost.' + T.id, JSON.stringify({ms, drv: me, g: S.rec})); } catch (e) {} }
    // Crew-Bestenliste / Tages-Challenge (nur mit Schreibrecht)
    let crewMsg = ''; PEND = null;
    if (TUTON) { TUTON = false; if (!store.get('kartTutDone')) { store.set('kartTutDone', '1'); addCoins(20); setTimeout(() => toast('🎓 <b>Fahrschule bestanden!</b><br>+20 🪙'), 600); } }
    else if (!RULE) { const top = lbList(LB, T.id)[0], mineLB = LB[T.id + '__' + player()];
      if (WR && DB) { const pd = {kind: 'best', track: T.id, drv: me, veh: vehOf(me), ms, g: S.rec}; if (ME) saveLB(pd); else PEND = pd; }
      crewMsg = !top || ms < top.ms ? (WR ? '👑 Neuer Crew-Rekord auf ' + T.name + '!' : '👑 Schneller als der Crew-Rekord, aber nur eingeladene Bearbeiter kommen in die Bestenliste.') : '🏆 Crew-Rekord: ' + NAME(top.who) + ' ' + fmt(top.ms); }
    else { const dk = daily().d + '__' + player(), mineD = LBD[dk];
      if (WR && DB) { const pd = {kind: 'daily', d: daily().d, drv: me, ms}; if (ME) saveLB(pd); else PEND = pd; }
      const day = lbList(LBD, daily().d); crewMsg = day.length ? '🎯 Heute vorne: ' + NAME(day[0].who) + ' ' + fmt(day[0].ms) : ''; }
    const pl = order.indexOf(mine) + 1;
    let msg = pl === 1 ? ['Campeão! 🏆', 'Der Pokal geht nach Hause!'] : pl === 6 ? ['Rote Laterne 🏮', 'Immerhin heil angekommen.'] : pl <= 3 ? ['Podium! ' + (pl === 2 ? '🥈' : '🥉'), 'Stark gefahren.'] : ['Mittelfeld', 'Nächstes Mal mehr Caipi-Turbo.'];
    if (CUP) { order.forEach((k, i) => { CUP.pts[k.id] = (CUP.pts[k.id] || 0) + PTS[i]; }); CUP.races.push(order.map(k => k.id)); }
    if (S.live) { liveGpScore(order); liveSave(order); }
    const mi0 = order.indexOf(mine), nbF = [order[mi0 - 1], order[mi0 + 1]].filter(o => o && o.done && mine.done && Math.abs(o.done - mine.done) < .15)[0], photo = nbF ? '📸 Fotofinish gegen ' + NAME(nbF.who || nbF.id) + ': ' + Math.round(Math.abs(nbF.done - mine.done) * 1000) + ' ms ' + (nbF.done > mine.done ? 'vorne!' : 'hinten.') + ' ' : '';
    const st0 = stats(), st1 = Object.assign({}, st0, {races: st0.races + 1, wins: st0.wins + (pl === 1 ? 1 : 0), ilha: st0.ilha + (T.id === 'ilha' ? 1 : 0), supers: st0.supers + S.supers});
    const rv = ks.find(o => o.id === S.rival), beatRival = rv && order.indexOf(mine) < order.indexOf(rv), earn = S.got + [10, 6, 4, 2, 1, 1][pl - 1] + (beatRival ? 5 : 0);
    st1.coinsTot = st0.coinsTot + S.got; st1.rivals = st0.rivals + (beatRival ? 1 : 0); if (!st1.tracks.split(',').includes(T.id)) st1.tracks = (st1.tracks ? st1.tracks + ',' : '') + T.id; addCoins(earn);
    { const rr = loadJ('kartRival'), mi = order.indexOf(mine), nb = order[mi + 1] || order[mi - 1]; rr[me] = beatRival ? nb.id : S.rival; store.set('kartRival', JSON.stringify(rr)); }
    store.set('kartStats', JSON.stringify(st1)); const newV = VEHS.filter(v => v.need && st0[v.need[0]] < v.need[1] && st1[v.need[0]] >= v.need[1]);
    const lastCup = CUP && CUP.i === CUP.list.length - 1;
    if (!lastCup) { if (pl === 1) say('win', 'Sieg! Der Pokal geht nach Hause!', 1); else if (pl <= 3) say('podium', 'Aufs Podest! Stark gefahren!', 1); else say('lose', 'Na ja, dabei sein ist alles!', 1); }
    if (pl === 1) fireworks(90);
    if (beatRival) setTimeout(() => say('rivalwin', 'Duell gewonnen! Rivale geschlagen!', 1), 2600);
    setTimeout(() => { ach('first'); if (pl === 1) { ach('win'); if (['sp', 'reveillon', 'cristo'].includes(T.id)) ach(T.id); } if (!S.myHits) ach('nohit'); if (st1.supers >= 10) ach('super10'); if (st1.coinsTot >= 100) ach('coins100');
      if (S.tod === 'night' || T.night) ach('night'); if (TRACKS.every(x => st1.tracks.split(',').includes(x.id))) ach('all'); if (st1.rivals >= 5) ach('rival5'); }, 900);
    res.querySelector('.kr-res-t').textContent = (CUP ? T.e + ' ' : '') + msg[0];
    res.querySelector('.kr-res-s').textContent = photo + msg[1] + ' Deine Zeit: ' + fmt(mine.done * 1000) + (rec ? ' · Neue Bestzeit!' : ' · Bestzeit: ' + fmt(prev));
    const ol = res.querySelector('ol'); ol.innerHTML = '';
    order.forEach((k, i) => { const li = document.createElement('li'); if (k.me) li.className = 'me'; li.innerHTML = '<b>' + (i + 1) + '.</b>'; li.appendChild(headCv(k.id));
      li.insertAdjacentHTML('beforeend', '<span>' + esc(S.live && k.aiIdx === undefined && !k.me && k.who && k.who !== k.id ? NAME(k.who) + ' (' + NAME(k.id) + ')' : NAME(k.id)) + (S.live && k.aiIdx !== undefined ? ' 🤖' : '') + '</span><small>' + (k.done ? fmt(k.done * 1000) : k.out ? '📴 raus' : '+ ' + (k.est - mine.done).toFixed(1) + ' s') + (CUP ? ' · +' + PTS[i] : '') + '</small>'); ol.appendChild(li); });
    res.querySelector('.kr-crew').textContent = crewMsg; res.querySelector('.kr-crew').hidden = !crewMsg || !!CUP;
    { const wr = res.querySelector('.kr-whores'); wr.innerHTML = PEND ? whoHtml('🙋 <b>Wer bist du?</b> Tippe dich an, dann kommt deine Zeit (' + fmt(ms) + ') in die Crew-Bestenliste.') : ''; whoHeads(wr); }
    res.querySelector('.kr-coins').innerHTML = '🪙 +' + earn + ' Münzen (' + S.got + ' eingesammelt, ' + [10, 6, 4, 2, 1, 1][pl - 1] + ' Platz-Bonus' + (beatRival ? ', 5 ⚔️ Rivale ' + esc(NAME(rv.id)) + ' geschlagen' : rv ? ', ⚔️ ' + esc(NAME(rv.id)) + ' war schneller' : '') + ') · Kasse: ' + coins();
    const ul = res.querySelector('.kr-unlock'); ul.hidden = !newV.length; ul.innerHTML = newV.map(v => '🔓 Neues Fahrzeug: <b>' + v.e + ' ' + esc(v.n) + '</b>').join('<br>'); if (newV.length) setTimeout(() => SFX.fanfare(), 600);
    const st = res.querySelector('.kr-stand'); st.innerHTML = ''; st.hidden = !CUP;
    if (CUP) { const tbl = Object.entries(CUP.pts).sort((a, b) => b[1] - a[1]); st.innerHTML = '<p class="kr-lbl">Gesamtwertung nach ' + (CUP.i + 1) + ' von ' + CUP.list.length + ' Rennen</p>' +
      '<div class="kr-st">' + tbl.map(([id, p], i) => '<span' + (id === me ? ' class="me"' : '') + '><b>' + (i + 1) + '.</b> ' + esc(NAME(id)) + ' <i>' + p + '</i></span>').join('') + '</div>'; }
    if (S.live && LIVE.gp) { const g = LIVE.gp, last0 = g.i >= g.list.length - 1, tb = Object.entries(g.pts).sort((a, b) => b[1] - a[1]); st.hidden = false;
      st.innerHTML = '<p class="kr-lbl">' + (last0 ? '🏆 Live-Pokal: Endstand' : '🏆 Live-Pokal nach ' + (g.i + 1) + ' von ' + g.list.length + ' Rennen') + '</p><div class="kr-st">' + tb.map(([k0, p0], i) => '<span' + (k0 === 'p:' + LIVE.me ? ' class="me"' : '') + '><b>' + (last0 && i === 0 ? '🏆' : (i + 1) + '.') + '</b> ' + esc(g.nm[k0]) + ' <i>' + p0 + '</i></span>').join('') + '</div>';
      if (last0) { res.querySelector('.kr-res-t').textContent = tb[0][0] === 'p:' + LIVE.me ? '🏆 Live-Pokal gewonnen!' : '🏆 Pokal-Sieger: ' + g.nm[tb[0][0]]; if (tb[0][0] === 'p:' + LIVE.me) fireworks(120); } }
    if (S.live) { res.querySelector('.kr-again').textContent = LIVE.gp && LIVE.gp.i < LIVE.gp.list.length - 1 ? '▶ Nächstes Pokal-Rennen (bereit)' : '🔁 Revanche (bereit)'; } else res.querySelector('.kr-again').textContent = CUP ? (lastCup ? '🏆 Zur Siegerehrung' : '▶ Nächstes Rennen: ' + TBY[CUP.list[CUP.i + 1]].e + ' ' + TBY[CUP.list[CUP.i + 1]].name) : 'Nochmal';
    res.querySelector('.kr-res .kr-back').textContent = CUP ? '☰ Menü (Grand Prix abbrechen)' : S.live ? '👥 Zur Lobby' : '☰ Zurück ins Menü';
    S.paused = true; MUS.on = false; racing(false); engOff();
    if (TUTON || order.length < 2) { res.hidden = false; return; }
    // Siegerehrung auf der Strecke: Podest, Sekt, Konfetti, Hymne des Siegers, der Letzte hält den Eimer; antippen = überspringen
    const nm = o => o.me ? (S.live ? NAME(ME || me) : NAME(o.id)) : NAME(o.who || o.id);
    S.pose = null; S.pod = {t0: performance.now(), top: order.slice(0, 3).map(o => ({id: o.id, n: nm(o), me: !!o.me})), last: order.length > 3 ? {id: order[order.length - 1].id, n: nm(order[order.length - 1]), me: !!order[order.length - 1].me} : null, p: [], cf: []};
    for (let j = 0; j < 90; j++) S.pod.cf.push({x: Math.random(), y: -Math.random() * .6, v: .12 + Math.random() * .2, r: Math.random() * TAU, c: ['#ffd23f', '#5fe783', '#ff5a8a', '#5ec8ff', '#fff'][j % 5]});
    SFX.fanfare(); setTimeout(() => { real('applause', .7); hymn(order[0].id); }, 700);
    clearTimeout(podT); podT = setTimeout(podEnd, 6500);
  }
  let podT = 0;
  function podEnd() { clearTimeout(podT); if (!S || !S.pod) return; S.pod = null; res.hidden = false; }
  function podDraw() { const P0 = S.pod, el = (performance.now() - P0.t0) / 1000, cx = W / 2, base = H * .66, bw = Math.min(110, W * .26);
    ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(6,20,48,.92)'); g.addColorStop(1, 'rgba(40,10,60,.92)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + Math.sin(el * .8 + j * 2) * .5; ctx.fillStyle = 'rgba(255,240,180,.07)'; ctx.beginPath(); ctx.moveTo(cx + (j - 1) * W * .35, 0); ctx.lineTo(cx + Math.cos(a + .25) * H, H); ctx.lineTo(cx + Math.cos(a - .25) * H, H); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd23f'; ctx.font = 'italic 900 26px system-ui,sans-serif'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8; ctx.fillText('🏆 SIEGEREHRUNG · ' + T.name.toUpperCase(), cx, H * .12, W - 24); ctx.shadowBlur = 0;
    const slots = [[0, 0, 1], [1, -1, .62], [2, 1, .4]];   // [Platz-Index, Position, Höhe]
    slots.forEach(([pi, pos, hgt]) => { const o = P0.top[pi]; if (!o) return; const x = cx + pos * bw * 1.05, h = H * .2 * hgt + 30, rise = clamp((el - .2 * pi) / .5, 0, 1);
      ctx.fillStyle = ['#e9c13a', '#c7ccd6', '#c9824a'][pi]; ctx.fillRect(x - bw / 2, base - h * rise, bw, h * rise + H); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - bw / 2, base - h * rise, bw, 8);
      ctx.fillStyle = '#fff'; ctx.font = '900 34px system-ui,sans-serif'; ctx.fillText(pi + 1, x, base - h * rise + 34);
      if (rise < 1) return; const hb = pi === 0 ? Math.abs(Math.sin(el * 5)) * 14 : Math.abs(Math.sin(el * 3 + pi)) * 5, hs = pi === 0 ? 96 : 74, img = headImg(o.id);
      const iw = img.width * hs / 116, ih = img.height * hs / 116, hcy = base - h - hs * .5 - hb; ctx.drawImage(img, x - iw / 2, hcy - ih / 2, iw, ih);
      ctx.font = '800 14px system-ui,sans-serif'; ctx.fillStyle = 'rgba(0,0,0,.55)'; const nw = Math.min(bw - 6, ctx.measureText(o.n).width + 14); ctx.fillRect(x - nw / 2, base - h + 60, nw, 22); ctx.fillStyle = '#fff'; ctx.fillText((o.me ? '⭐ ' : '') + o.n, x, base - h + 71, bw - 10);
      if (pi === 0) { ctx.drawImage(E('🏆', 44), x - 22, hcy - hs * .5 - 50, 44, 44);
        if (el > 1.1 && el < 5.5) { const bx = x + hs * .5 + 8, by = hcy + 4; ctx.save(); ctx.translate(bx, by); ctx.rotate(-.6 + Math.sin(el * 4) * .15); ctx.drawImage(E('🍾', 36), -18, -18, 36, 36); ctx.restore();
          for (let q = 0; q < 6; q++) P0.p.push({x: bx - 6, y: by - 18, vx: rnd(-260, 60), vy: rnd(-380, -200), t: 0}); } } });
    // Sekt-Spritzer + Konfetti
    const dt0 = 1 / 60; P0.p = P0.p.filter(q => { q.t += dt0; q.x += q.vx * dt0; q.y += q.vy * dt0; q.vy += 700 * dt0; ctx.fillStyle = `rgba(255,248,200,${clamp(1.2 - q.t, 0, 1)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, TAU); ctx.fill(); return q.t < 1.2; });
    P0.cf.forEach(c => { c.y += c.v * dt0; c.r += dt0 * 4; if (c.y > 1.05) c.y = -.05; ctx.save(); ctx.translate(c.x * W + Math.sin(el * 2 + c.r) * 10, c.y * H); ctx.rotate(c.r); ctx.fillStyle = c.c; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); });
    // Der Letzte steht mit dem Eimer daneben
    if (P0.last && el > 1.4) { const x = W - 52, y = base + 40, img = headImg(P0.last.id), hs = 52; ctx.globalAlpha = clamp((el - 1.4) / .5, 0, 1); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(el * 2) * .12);
      ctx.drawImage(img, -img.width / 2 * hs / 116, -40 - img.height / 2 * hs / 116, img.width * hs / 116, img.height * hs / 116); ctx.drawImage(E('🪣', 34), -17, 2, 34, 34); ctx.restore();
      ctx.font = '700 11px system-ui,sans-serif'; ctx.fillStyle = '#ffb3b3'; ctx.fillText('Letzter: ' + P0.last.n, x - 6, y + 50, 110); ctx.fillText('hält den Kotzeimer', x - 6, y + 64, 110); ctx.globalAlpha = 1; }
    ctx.font = '700 13px system-ui,sans-serif'; ctx.fillStyle = `rgba(255,255,255,${.5 + .3 * Math.sin(el * 4)})`; ctx.fillText('Antippen zum Überspringen', cx, H - 40);
    ctx.restore(); }
  // Siegerehrung nach dem Grand Prix: Podest auf dem Canvas, Tabelle im Kasten
  function ceremony() {
    const tbl = Object.entries(CUP.pts).sort((a, b) => b[1] - a[1]), myPl = tbl.findIndex(([id]) => id === me) + 1;
    if (myPl === 1) { setTimeout(() => ach('cup'), 1200); const c = loadJ('kartCups'); c[me] = (c[me] || 0) + 1; store.set('kartCups', JSON.stringify(c)); const s1 = stats(), had = s1.cups; s1.cups++; store.set('kartStats', JSON.stringify(s1));
      const ul = res.querySelector('.kr-unlock'); ul.hidden = had > 0; ul.innerHTML = had > 0 ? '' : '🔓 Neues Fahrzeug: <b>🏆 Goldenes Kart</b>'; }
    else res.querySelector('.kr-unlock').hidden = true;
    res.querySelector('.kr-res-t').textContent = CUP.e + ' ' + CUP.n;
    res.querySelector('.kr-res-s').textContent = myPl === 1 ? 'Du hast den Grand Prix gewonnen! Campeão!' : 'Du bist ' + myPl + '. geworden. Sieger: ' + NAME(tbl[0][0]) + '.';
    const ol = res.querySelector('ol'); ol.innerHTML = '';
    const pod = document.createElement('li'); pod.className = 'kr-podium'; [1, 0, 2].forEach(i => { const e = tbl[i]; if (!e) return; const d = document.createElement('div'); d.className = 'p' + (i + 1); d.appendChild(headCv(e[0], 80));
      d.insertAdjacentHTML('beforeend', '<span>' + esc(NAME(e[0])) + '</span><b>' + ['🥇', '🥈', '🥉'][i] + ' ' + e[1] + ' P.</b>'); pod.appendChild(d); }); ol.appendChild(pod);
    tbl.slice(3).forEach(([id, p], i) => { const li = document.createElement('li'); if (id === me) li.className = 'me'; li.innerHTML = '<b>' + (i + 4) + '.</b>'; li.appendChild(headCv(id)); li.insertAdjacentHTML('beforeend', '<span>' + esc(NAME(id)) + '</span><small>' + p + ' P.</small>'); ol.appendChild(li); });
    res.querySelector('.kr-stand').hidden = true;
    res.querySelector('.kr-again').textContent = '🏆 Neuer Grand Prix'; res.querySelector('.kr-res .kr-back').textContent = '☰ Zurück ins Menü';
    CUP.done = 1; SFX.fanfare(); real('applause', .8); say('cupwin', 'Der Grand-Prix-Sieger steht fest!', 1); if (S) fireworks(120);
  }
  const THEME = {gru: ['#d7dbe0', '#2b5f9e'], bridge: ['#1d7fa8', '#0b2e4a'], manaus: ['#3a3f45', '#0a2a33'], lopes: ['#fff3d6', '#22c3c9'], guaruja: ['#ffe3a3', '#2fb8cc'], sp: ['#9aa0a8', '#3f444c'], copa: ['#f8d98f', '#1694b8'], reveillon: ['#2a2f6e', '#05081c'], cristo: ['#5fae66', '#1d5a2b'],
    iguacu: ['#4c9a52', '#1a4a28'], amazon: ['#3a8a62', '#6b4a22'], paraty: ['#e2d6c0', '#8f8578'], ilha: ['#f1dca8', '#22a9c4']}, THUMB = {};
  function thumb(tr) { if (THUMB[tr.id]) return THUMB[tr.id]; const w = 272, h = 172, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), cp = tr.cp, n = cp.length;
    const th = THEME[tr.id] || ['#2fb8cc', '#0b5d8f'], g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, th[0]); g.addColorStop(1, th[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (tr.id === 'reveillon') for (let j = 0; j < 40; j++) { x.fillStyle = ['#ffd23f', '#ff4d4d', '#3fa7ff', '#fff'][j % 4]; x.fillRect((j * 97) % w, (j * 53) % h, 3, 3); }
    const pts = []; for (let i = 0; i < n; i++) { const p0 = cp[(i - 1 + n) % n], p1 = cp[i], p2 = cp[(i + 1) % n], p3 = cp[(i + 2) % n];
      for (let k = 0; k < 10; k++) { const u = k / 10, u2 = u * u, u3 = u2 * u; pts.push([0, 1].map(d => .5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3))); } }
    const xs = pts.map(p0 => p0[0]), ys = pts.map(p0 => p0[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), sc = Math.min((w - 44) / (x1 - x0), (h - 40) / (y1 - y0)),
      ox = (w - (x1 - x0) * sc) / 2 - x0 * sc, oy = (h - (y1 - y0) * sc) / 2 - y0 * sc + 6;
    const path = () => { x.beginPath(); pts.forEach((p0, i) => x[i ? 'lineTo' : 'moveTo'](ox + p0[0] * sc, oy + p0[1] * sc)); x.closePath(); };
    x.lineJoin = x.lineCap = 'round'; x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 4; path(); x.strokeStyle = '#14171c'; x.lineWidth = 16; x.stroke(); x.shadowColor = 'transparent';
    path(); x.strokeStyle = tr.veh === 'boat' ? '#8fd6ff' : '#f4f1ea'; x.lineWidth = 9; x.stroke(); path(); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.5; x.setLineDash([6, 6]); x.stroke(); x.setLineDash([]);
    const s0 = pts[0], s1 = pts[2], an = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]); x.save(); x.translate(ox + s0[0] * sc, oy + s0[1] * sc); x.rotate(an);
    for (let a2 = 0; a2 < 2; a2++) for (let b2 = 0; b2 < 4; b2++) { x.fillStyle = (a2 + b2) % 2 ? '#111' : '#fff'; x.fillRect(-4 + a2 * 4, -8 + b2 * 4, 4, 4); } x.restore();
    return THUMB[tr.id] = c; }
  function teaser() { const hd = openBtn.querySelector('.kt-heads'), stt = openBtn.querySelector('.kt-stats'); if (!hd) return;
    if (!hd.childElementCount) CREW.forEach(p0 => { if (!p0.photo) return; const im = document.createElement('img'); im.src = p0.photo; im.alt = ''; im.loading = 'lazy'; im.style.setProperty('--c', (LOOK[p0.id] || {}).shirt || '#ffd23f'); hd.appendChild(im); });
    const st = stats(), ah = Object.keys(loadJ('kartAch')).length, bt = Object.values(best()).length; stt.innerHTML = st.races ? '<span>🪙 ' + coins() + '</span><span>🏁 ' + st.races + ' Rennen</span>' + (st.wins ? '<span>🥇 ' + st.wins + ' Siege</span>' : '') + '<span>🏅 ' + ah + '/' + ACH.length + '</span>' : ''; }
  // Crew-Rekorde auf der Seite: für alle sichtbar, Zeile antippen = Strecke mit dem Geist des Rekordhalters fahren
  function board() { const el = document.getElementById('kt-board'); if (!el) return;
    const rows = TRACKS.map(tr => ({tr, list: lbList(LB, tr.id)})).filter(r => r.list.length), seen = loadJ('kartRecSeen');
    if (!rows.length) { el.hidden = true; return; }
    const lost = ME ? rows.filter(r => seen[r.tr.id] === ME && r.list[0].who !== ME) : [];
    if (!Object.keys(seen).length) { const s0 = {}; rows.forEach(r => { s0[r.tr.id] = r.list[0].who; }); store.set('kartRecSeen', JSON.stringify(s0)); }
    const cnt = {}; rows.forEach(r => { cnt[r.list[0].who] = (cnt[r.list[0].who] || 0) + 1; });
    { const h = document.querySelector('[data-hint="kart-tab"]'), k0 = Object.entries(cnt).sort((x, y) => y[1] - x[1])[0]; if (h && k0 && !h.dataset.live) { h.textContent = '👑 ' + NAME(k0[0]) + ' · ' + rows.length + '/' + TRACKS.length + ' Rekorde'; h.classList.add('live'); } }
    el.hidden = false;
    el.innerHTML = '<div class="kb-h"><b>🏆 Crew-Rekorde</b><span>' + Object.entries(cnt).sort((x, y) => y[1] - x[1]).map(([id, n]) => '👑 ' + esc(NAME(id)) + ' ' + n).join(' · ') + '</span></div>' +
      lost.map(r => '<p class="kb-lost">😱 <b>' + esc(NAME(r.list[0].who)) + '</b> hat deinen Rekord auf ' + esc(r.tr.name) + ' geknackt! Hol ihn dir zurück.</p>').join('') +
      '<div class="kb-l">' + rows.map(r => { const top = r.list[0], me2 = r.list.find(v => v.who === ME), pos = me2 ? r.list.indexOf(me2) + 1 : 0;
        return '<button type="button" data-t="' + r.tr.id + '"><i>' + r.tr.e + '</i><span><b>' + esc(r.tr.name) + '</b><small>' + esc(byline(top)) + '</small><small class="kb-me">' + (top.who === ME ? '🛡 Dein Rekord, verteidige ihn!' : pos ? 'Du: ' + pos + '. · ' + fmt(me2.ms) : r.list.length + (r.list.length === 1 ? ' Zeit' : ' Zeiten')) + '</small></span><em>' + esc(NAME(top.who)) + '<br><b>' + fmt(top.ms) + '</b></em><u>⚔️</u></button>'; }).join('') + '</div>' +
      '<p class="kb-n">⚔️ antippen = Strecke mit dem Geist des Rekordhalters fahren. ' + (TRACKS.length - rows.length) + ' Strecken noch ohne Rekord.</p>'; }
  document.addEventListener('click', e => { const b = e.target.closest('#kt-board button[data-t]'); if (!b) return; TRK = b.dataset.t; store.set('kartTrack', TRK);
    MODE = 'single'; store.set('kartMode', MODE); GHOST.mode = 'crew'; store.set('kartGhost', 'crew'); open(); });
  // Erklärtexte zu den Fahrer-Werten (Antippen im Menü)
  const BXK = ['spd', 'hdl', 'acc', 'tgh'], BXT = {spd: ['Tempo', '🏎️ Höchstgeschwindigkeit auf der Geraden (bis ±3 %). Kommt vom Trinktempo (TTP) der FIFA-Karte.'],
    hdl: ['Lenkung', '🎯 Wie scharf das Kart einlenkt, enge Kurven gehen leichter (bis ±6 %). Kommt von der Orientierung (ORI).'],
    acc: ['Start', '🚦 Wie schnell das Kart beim Start und nach Unfällen wieder auf Tempo ist (bis ±14 %). Kommt von der Pünktlichkeit (PÜN).'],
    tgh: ['Nehmer', '💥 Wie gut man Treffer wegsteckt: Nach Öl, Nasenbär oder Hindernis dreht man sich kürzer (bis ein Viertel schneller wieder unterwegs). Kommt von der Kater-Resistenz (KAT).']};
  let BX = null;
  function renderMenu() {
    const pk = menu.querySelector('.kr-pick:not(.kr-whop)'); pk.innerHTML = '';
    CREW.forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.dataset.id = p.id; b.setAttribute('aria-pressed', p.id === me); b.setAttribute('aria-label', p.name); b.appendChild(headCv(p.id, 92)); b.insertAdjacentHTML('beforeend', '<span>' + esc(p.name) + '</span>'); pk.appendChild(b); });
    menu.querySelectorAll('.kr-mode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === MODE));
    const cs = CS[me], bar = v => '<i style="--v:' + Math.round(20 + v * 80) + '%"></i>', sp = SPECIAL[me], pg = pegel(me);
    const dv = menu.querySelector('.kr-drv'), cosE = (COS.find(c => c.id === cosOf(me)) || {}).e; dv.innerHTML = '<div class="kr-dc" style="--dc:' + ((LOOK[me] || {}).shirt || '#00a651') + '"><span class="kr-dch"></span><div><p class="kr-dn">' + esc(NAME(me)) + (cosE && cosOf(me) ? ' <small>' + cosE + ' Kostüm</small>' : '') + '</p><div class="kr-bars">' + BXK.map(k => '<button type="button" class="kr-bk" data-k="' + k + '" aria-pressed="' + (BX === k) + '"><span>' + BXT[k][0] + ' <u>ⓘ</u></span>' + bar(cs[k]) + '</button>').join('') + '</div>' +
      '<p class="kr-bx">' + (BX ? esc(BXT[BX][1]) + ' <b>' + esc(NAME(me)) + ': ' + (cs[BX] < .34 ? 'eher schwach' : cs[BX] < .67 ? 'mittel' : 'stark') + '.</b>' : 'Tipp auf einen Wert, dann steht hier, was er bewirkt.') + '</p>' +
      '<p class="kr-sp">' + sp.e + ' <b>' + esc(sp.n) + '</b>: ' + esc(sp.x) + '</p>' + ((PERS[me] || {}).x ? '<p class="kr-sp kr-pp">🤖 Als Gegner: ' + esc(PERS[me].x) + '</p>' : '') + (pg > 0 ? '<p class="kr-sp">🍹 Heute schon ' + ((MEHUB.drinks || {})[me] || {}).today + ' Drinks: Lenkung wackelt!</p>' : '') + '</div></div>'; dv.querySelector('.kr-dch').replaceWith(headCv(me, 140));
    menu.querySelectorAll('.kr-diff button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.d === DIFF));
    const mv = myVeh(); menu.querySelector('.kr-vehs').innerHTML = VEHS.map(v => { const ok = unlocked(v); return '<button type="button" data-v="' + v.id + '" aria-pressed="' + (v.id === mv) + '"' + (ok ? '' : ' disabled') + ' title="' + esc(ok ? v.n : v.t) + '"><i>' + (ok ? v.e : '🔒') + '</i><small>' + esc(ok ? v.n : v.t) + '</small></button>'; }).join('');
    const tu = tune(), own = cosOwn(), mc = cosOf(me), cn = coins();
    menu.querySelector('.kr-garage summary').textContent = '🛠 Garage: Tuning & Kostüme · 🪙 ' + cn; { const pl = menu.querySelector('.kr-prog'); if (pl) pl.innerHTML = progLine(); }
    { const mv0 = myVeh(), V0 = VEHS.find(v => v.id === mv0) || VEHS[0], vxe = menu.querySelector('.kr-vx'); if (vxe) vxe.textContent = V0.e + ' ' + V0.n + ': ' + (VTX[mv0] || VTX.kart).x;
      const st0 = menu.querySelector('.kr-shopt'); if (st0) st0.textContent = 'Tuning für ' + V0.e + ' ' + V0.n + ' (jedes Fahrzeug einzeln)'; }
    { const pt = paintOf(me), so = loadJ('kartStkOwn'), pe = menu.querySelector('.kr-paintb');
      if (pe) { pe.innerHTML = '<p class="kr-lbl">Lack & Aufkleber für ' + esc(NAME(me)) + '</p><div class="kr-pv"><span class="kr-pvc"></span><div class="kr-paints">' + PAINTS.map(c => '<button type="button" data-p="' + (c || '') + '" aria-pressed="' + ((pt.c || '') === (c || '')) + '" aria-label="' + (c ? 'Farbe ' + c : 'Shirt-Farbe') + '" style="--pc:' + (c || (LOOK[me] || {}).shirt || '#00a651') + '">' + (c ? '' : '👕') + '</button>').join('') + '</div></div>' +
        '<div class="kr-stks">' + STK.map(x0 => { const own = so[x0.id], on = pt.s.includes(x0.id); return '<button type="button" data-s="' + x0.id + '" aria-pressed="' + on + '"' + (!own && cn < x0.c ? ' disabled' : '') + '><i>' + x0.e + '</i><small>' + esc(x0.n) + (own ? '' : ' · ' + x0.c + ' 🪙') + '</small></button>'; }).join('') + '</div>';
        const pv = vehSprite(pt.c || (LOOK[me] || {}).shirt || '#00a651', myVeh(), pt, me), cv0 = document.createElement('canvas'); cv0.width = 88; cv0.height = 120; cv0.getContext('2d').drawImage(pv, 0, 0); pe.querySelector('.kr-pvc').replaceWith(cv0); } }
    menu.querySelector('.kr-shop').innerHTML = TUNE.map(u => { const lv = tu[u.k], c = TCOST[lv]; return '<button type="button" data-k="' + u.k + '"' + (lv >= 5 || cn < c ? ' disabled' : '') + '><i>' + u.e + '</i><b>' + esc(u.n) + '</b><small>' + esc(u.x) + '</small><span class="kr-lv">' + '●'.repeat(lv) + '○'.repeat(5 - lv) + '</span><small>' + (lv >= 5 ? 'Maximum' : c + ' 🪙') + '</small></button>'; }).join('');
    menu.querySelector('.kr-cos').innerHTML = '<p class="kr-lbl">Kostüm für ' + esc(NAME(me)) + '</p>' + COS.map(c => { const ok = own(c), A = c.ach && ACH.find(x => x.id === c.ach); return '<button type="button" data-c="' + c.id + '" aria-pressed="' + (c.id === mc) + '"' + (!ok && (A || c.from || cn < c.c) ? ' disabled' : '') + ' title="' + esc(c.n) + '"><i>' + (ok || (!A && !c.from) ? c.e : '🔒') + '</i><small>' + (ok ? esc(c.n) : c.from ? esc(c.fl) : A ? esc(A.n) : c.c + ' 🪙') + '</small></button>'; }).join('');
    const ah = achs(); menu.querySelector('.kr-achs summary').textContent = '🏅 Erfolge ' + ACH.filter(x => ah[x.id]).length + '/' + ACH.length;
    menu.querySelector('.kr-ach').innerHTML = ACH.map(x => '<span class="' + (ah[x.id] ? 'on' : '') + '"><i>' + (ah[x.id] ? x.e : '🔒') + '</i><b>' + esc(x.n) + '</b>' + (x.x ? '<small>' + esc(x.x) + '</small>' : '') + '</span>').join('');
    const bt = best(), tr = menu.querySelector('.kr-tracks:not(.kr-cups)'); tr.hidden = MODE !== 'single' && MODE !== 'live'; lbInit();
    const cu = menu.querySelector('.kr-cups'); cu.hidden = MODE !== 'cup'; cu.innerHTML = CUPS.map(c => '<button type="button" data-c="' + c.id + '" aria-pressed="' + (c === CUPSEL) + '"><i>' + c.e + '</i><b>' + esc(c.n) + '</b><small>' + c.t.length + ' Strecken</small></button>').join('');
    tr.innerHTML = TRACKS.map(t => '<button type="button" data-t="' + t.id + '" aria-pressed="' + (t.id === TRK) + '"><i>' + t.e + '</i>' + (bt[t.id] ? '<em>⏱ ' + fmt(bt[t.id]) + '</em>' : '') + '<b>' + esc(t.name) + '</b><small>' + esc(t.sub) + '</small></button>').join('');
    tr.querySelectorAll('button').forEach(b0 => { const c = thumb(TBY[b0.dataset.t]), d = document.createElement('canvas'); d.width = c.width; d.height = c.height; d.getContext('2d').drawImage(c, 0, 0); b0.prepend(d); });
    requestAnimationFrame(() => { const sel = tr.querySelector('[aria-pressed="true"]'); if (sel && tr.scrollWidth > tr.clientWidth) tr.scrollLeft = sel.offsetLeft - (tr.clientWidth - sel.clientWidth) / 2; });
    menu.querySelector('.kr-tl').textContent = MODE === 'cup' ? 'Pokal' : MODE === 'daily' ? 'Heutige Challenge' : 'Strecke';
    menu.querySelector('.kr-pc').textContent = coins(); menu.querySelector('.kr-pa').textContent = Object.keys(achs()).length + '/' + ACH.length;
    const cups = loadJ('kartCups'), cw = cups[me] || 0;
    menu.querySelector('.kr-best').textContent = MODE === 'cup' ? CUPSEL.t.map(id => TBY[id].e).join(' ') + ' · ' + CUPSEL.t.length + ' Rennen, Punkte 10-8-6-5-4-3, am Ende Siegerehrung.' + (cw ? ' Deine Grand-Prix-Siege: ' + cw + ' 🏆' : '')
      : (bt[TRK] ? 'Deine Bestzeit ' + TBY[TRK].name + ': ' + fmt(bt[TRK]) : 'Noch keine Bestzeit auf dieser Strecke.');
    liveBox(); livePres();
    menu.querySelector('.kr-go').textContent = MODE === 'live' ? (lobby().length < 2 ? '👥 Warte auf Mitspieler …' : '🚦 Rennen starten (' + lobby().length + ' Spieler)') : MODE === 'cup' ? '🏆 Grand Prix starten' : MODE === 'daily' ? '🎯 Challenge fahren' : 'Los geht’s!';
    const dy = daily(), lb = menu.querySelector('.kr-lb'), gh = menu.querySelector('.kr-ghost:not(.kr-diff)');
    gh.hidden = MODE !== 'single'; gh.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.g === GHOST.mode));
    if (MODE === 'daily') { const bd = bt[dy.track.id + '@' + dy.rule.k];
      menu.querySelector('.kr-best').innerHTML = '<b>Heute (' + dy.d.split('-').reverse().slice(0, 2).join('.') + '.): ' + dy.track.e + ' ' + esc(dy.track.name) + ' · ' + dy.rule.e + ' ' + esc(dy.rule.n) + '</b><br>' + esc(dy.rule.x) + (bd ? ' · deine Bestzeit heute: ' + fmt(bd) : '');
      lb.innerHTML = lbHtml(lbList(LBD, dy.d), '🎯 Tageswertung'); }
    else if (MODE === 'single') lb.innerHTML = lbHtml(lbList(LB, TRK), '🏆 Crew-Bestenliste ' + TBY[TRK].name);
    else lb.innerHTML = '';
    lb.hidden = MODE === 'cup';
    menu.querySelector('.kr-wr').textContent = WR ? 'Deine Zeiten landen als ' + NAME(player()) + ' in der Crew-Bestenliste' + (ME ? '' : ' (wähle oben auf der Seite „Ich bin …“)') + '.' : 'Bestenliste nur ansehen: Eintragen können nur eingeladene Bearbeiter, deine Zeiten bleiben auf diesem Handy.';
    menu.querySelector('.kr-wr').hidden = MODE === 'cup' || (WR && !ME);
    menu.querySelector('.kr-tutb').hidden = !!store.get('kartTutDone') && stats().races > 2;
    const wb = menu.querySelector('.kr-whobox'); wb.innerHTML = WR && !ME ? whoHtml('🙋 <b>Wer spielt an diesem Handy?</b> Einmal antippen, dann landen deine Zeiten unter deinem Namen in der Crew-Bestenliste.') : ''; whoHeads(wb);
    const rc = menu.querySelector('.kr-recs'); rc.querySelector('.kr-recb').innerHTML = recsHtml(); rc.querySelector('summary').textContent = '🏆 Crew-Rekorde aller Strecken (' + TRACKS.filter(x => lbList(LB, x.id).length).length + '/' + TRACKS.length + ')';
  }
  function preview(id) { loadTrack(id, RULE && RULE.k === 'rev'); newRace(); S.paused = true; }
  const TIPS = ['Gewitter? Pfützen meiden, früher bremsen.', '⛱️ Schirm blockt einen Treffer, 🩴 Flip-Flop fliegt geradeaus, 🦜 Papagei verdreht den Vorderleuten die Lenkung.', '🌶️ Pimenta: langer Turbo, wer direkt hinter dir fährt, verbrennt sich.', 'Doppeltipp und halten = sofort driften. Länger driften = blauer, dann oranger Turbo.', 'Beide Seiten gleichzeitig halten = bremsen.', 'Bei der 1 tippen = Raketenstart.',
    'Auf der Schanze tippen = Trick und Turbo bei der Landung.', 'Rot-weiße Pfeiltafeln warnen vor scharfen Kurven.', 'Abkürzungen sind holprig, aber mit Turbo-Pfeil in der Mitte.',
    'Schranken öffnen im Takt. Kurz warten lohnt sich manchmal.', 'Im Pause-Menü: Steuerung „Analog“ für stufenloses Lenken.', 'Wer hinten liegt, bekommt bessere Items.',
    'Delfine auf dem Amazonas geben Turbo.', 'Im Nebel helfen die Kurven-Schilder.', 'Die Tageszeit im Spiel folgt der Uhrzeit in Rio.'];
  function showLoad(id, fn) { const L = box.querySelector('.kr-load'), tr = TBY[id] || TRACKS[0]; L.querySelector('.kr-load-t').textContent = tr.e + ' ' + tr.name; L.querySelector('.kr-load-s').textContent = tr.sub;
    L.querySelector('.kr-load-tip').textContent = '💡 ' + pick(TIPS); L.hidden = false; const t0 = performance.now(); setTimeout(() => { fn(); setTimeout(() => { L.hidden = true; }, Math.max(0, 900 - (performance.now() - t0))); }, 40); }
  function startRace() { if (MODE === 'live' && !LIVE.pending) { liveGo(); return; } const tid = CUP ? CUP.list[CUP.i] : RULE ? daily().track.id : TRK; menu.hidden = true; res.hidden = true; pm.hidden = true; racing(true); if (S) S.paused = true; showLoad(tid, startRace0); }
  function startRace0() {
    setTimeout(() => { if (BUF.more) BUF.more(); }, 1200);
    menu.hidden = true; res.hidden = true; pm.hidden = true; racing(true);
    if (CUP) { RULE = null; loadTrack(CUP.list[CUP.i]); } else if (RULE) loadTrack(daily().track.id, RULE.k === 'rev'); else loadTrack(TRK);
    if (LIVE.pending) { LIVE.race = LIVE.pending; LIVE.pending = null; } else if (MODE !== 'live') LIVE.race = null;
    const LR0 = LIVE.race, CF = LR0 && LR0.cfg || {}; if (LR0 && CF.laps) LAPS = CF.laps;
    makeVehicles(); { const MR = Math.random; if (LR0 && LR0.seed) Math.random = mulberry(hashS(LR0.seed)); if (LR0 && CF.diff >= 0) { if (LIVE.diff0 == null) LIVE.diff0 = DIFF; DIFF = CF.diff; } try { newRace(); } finally { Math.random = MR; } }
    if (LR0) { S.seed = LR0.seed || LR0.id; S.wave.next = wrnd('wave', 9, 13); S.storm.at = CF.storm === 'on' ? wrnd('storm', 12, 26) : CF.storm === 'rnd' && T.id !== 'cristo' && wr('storm') < .33 ? wrnd('storm', 22, 40) : -1; if (CF.items === 'off') S.boxes = []; }
    S.ev = {next: wrnd('ev', 15, 24), cur: null}; S.evOn = !TUTON && (LR0 ? CF.ev !== 'off' : SET.ev !== 'off');
    if (TUTON) { S.tut = {i: 0, ok: 0}; S.karts.length = 1; LAPS = 2; S.storm.at = -1; S.rival = null; }
    if (LIVE.race) { S.live = LIVE.race; S.live.t0p = LIVE.race.delay && LIVE.race.rt ? LIVE.race.rt + LIVE.race.delay : performance.now() + clamp(LIVE.race.at - Date.now(), 500, 6000); S.t = clamp((performance.now() - S.live.t0p) / 1000, -6, -.5); LIVE.buf = {}; LIVE.lastN = {}; S.live.curHost = S.live.host; liveRejoinRestore(); liveClockSync(); } box.classList.toggle('live', !!S.live); S.tod = T.night || SET.tod === 'day' ? 'day' : (h => h >= 19 || h < 6 ? 'night' : h >= 17 ? 'dusk' : h < 7 ? 'dawn' : 'day')(+new Intl.DateTimeFormat('en-GB', {timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false}).format(new Date()) % 24);
    if (!CUP && !RULE && GHOST.mode !== 'off') { const tid = T.id, s0 = S; ghostFor(tid).then(g => { if (S === s0 && g) { S.ghost = g; ghostProg(g); } }); } audio(); MUS.on = false; MUS.fast = false; MUS.step = 0; MUS.next = 0; banner = null; last = 0; if (MG && AC) MG.gain.value = .5;
    setTimeout(() => { if (S && S.tod === 'night' && !T.night) setTimeout(() => say('night', 'Es wird Nacht! Licht an!'), 2600); if (S && S.t < 0) say('t_' + T.id, RULE ? 'Tages-Challenge: ' + RULE.n + '!' : 'Willkommen in ' + T.name + '!', 1); }, 150);
  }
  function open() {
    if (!Object.keys(HEAD).length) makeHeads();
    if (box.parentElement !== document.body) document.body.appendChild(box);   // Kapitel hat content-visibility, sonst unsichtbar
    box.hidden = false; document.body.style.overflow = 'hidden'; document.documentElement.classList.add('kart-on'); resize();
    try { const r = box.requestFullscreen || box.webkitRequestFullscreen; if (r) { const pr = r.call(box); if (pr && pr.catch) pr.catch(() => {}); } } catch (e) {}
    CUP = null; S = null; RULE = MODE === 'daily' ? daily().rule : null; lbInit(); progSync(true); { const s0 = {}; TRACKS.forEach(tr => { const top = lbList(LB, tr.id)[0]; if (top) s0[tr.id] = top.who; }); if (Object.keys(s0).length) store.set('kartRecSeen', JSON.stringify(s0)); } preview(MODE === 'cup' ? CUPSEL.t[0] : MODE === 'daily' ? daily().track.id : TRK); renderMenu(); setTimeout(renderMenu, 900); menu.hidden = false; res.hidden = true; pm.hidden = true; racing(false);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function close() {
    if (LIVE.diff0 != null) { DIFF = LIVE.diff0; LIVE.diff0 = null; } liveLeave(); cancelAnimationFrame(raf); S = null; MUS.on = false; box.hidden = true; if (LIVE.room) livePres(); teaser(); board(); document.body.style.overflow = ''; document.documentElement.classList.remove('kart-on');
    engOff(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  }
  function toMenu() { if (LIVE.diff0 != null) { DIFF = LIVE.diff0; LIVE.diff0 = null; } TUTON = false; CUP = null; RULE = MODE === 'daily' ? daily().rule : null; res.hidden = true; pm.hidden = true; racing(false); MUS.on = false; menu.hidden = false; preview(MODE === 'cup' ? CUPSEL.t[0] : MODE === 'daily' ? daily().track.id : TRK); renderMenu(); }
  openBtn.addEventListener('click', open);
  const racing = on => box.classList.toggle('racing', on);
  function pause() { if (!S || !box.classList.contains('racing') || !res.hidden) return; pm.querySelector('.kr-restart').hidden = !!S.live;
    if (S.live) { ptr.clear(); upd(); pm.hidden = false; return; }   // Live: Rennen läuft weiter, nur das Menü kommt
    S.paused = true; ptr.clear(); upd(); pm.hidden = false; if (AC) try { AC.suspend(); } catch (e) {} }
  const engOff = () => { if (eng && AC) { eng.g.gain.setTargetAtTime(0, AC.currentTime, .05); eng.sg.gain.setTargetAtTime(0, AC.currentTime, .05); } };
  function resume() { pm.hidden = true; if (S) S.paused = false; last = 0; audio(); }
  const setT = (sel, txt) => box.querySelectorAll(sel).forEach(b => { b.textContent = txt; });
  const sndTxt = () => setT('.kr-snd', SOUND ? '🔊 Ton: an' : '🔇 Ton: aus'), steerTxt = () => setT('.kr-steer', '🎚 Lenkstärke: ' + STEERS[STEER][0]), annTxt = () => setT('.kr-ann', '🎙 Ansager: ' + (ANN ? 'an' : 'aus'));
  const setTxt = () => { sndTxt(); steerTxt(); annTxt(); setT('.kr-ctl', '🎮 Steuerung: ' + (SET.ctl === 'analog' ? 'Analog (Daumen-Position)' : 'Halten links/rechts'));
    setT('.kr-q', '✨ Grafik: ' + ['Sparsam', 'Normal', 'Hoch'][SET.q]); setT('.kr-cam', '🎥 Kamera: ' + ['Nah', 'Normal', 'Weit'][SET.cam]); setT('.kr-tod', '🌗 Tageszeit: ' + (SET.tod === 'day' ? 'immer Tag' : 'wie in Rio')); setT('.kr-evt', '🎲 Ereignisse: ' + (SET.ev === 'off' ? 'aus' : 'an')); };
  setTxt();
  box.addEventListener('click', e => {
    if (e.target.closest('.kr-steer')) { STEER = (STEER + 1) % STEERS.length; store.set('kartSteer', STEER); }
    if (e.target.closest('.kr-ann')) { ANN = !ANN; store.set('kartAnn', ANN ? '1' : '0'); }
    if (e.target.closest('.kr-snd')) { SOUND = !SOUND; store.set('kartSound', SOUND ? '1' : '0'); if (!SOUND && eng && AC) engOff(); }
    if (e.target.closest('.kr-ctl')) { SET.ctl = SET.ctl === 'analog' ? 'hold' : 'analog'; saveSet(); resize(); }
    if (e.target.closest('.kr-q')) { SET.q = (SET.q + 1) % 3; saveSet(); resize(); if (S && T) { drawBG(); } }
    if (e.target.closest('.kr-cam')) { SET.cam = (SET.cam + 1) % 3; saveSet(); }
    if (e.target.closest('.kr-tod')) { SET.tod = SET.tod === 'day' ? 'real' : 'day'; saveSet(); }
    if (e.target.closest('.kr-evt')) { SET.ev = SET.ev === 'off' ? 'on' : 'off'; saveSet(); }
    if (e.target.closest('.kr-steer, .kr-ann, .kr-snd, .kr-ctl, .kr-q, .kr-cam, .kr-tod, .kr-evt')) setTxt(); });
  box.querySelector('.kr-pbtn').addEventListener('click', pause);
  // Live: Emoji-Reaktionen während des Rennens (über dem eigenen Kart, bei allen sichtbar)
  { const eb = box.querySelector('.kr-emo'); if (eb) { const el = eb.querySelector('.kr-emol');
    eb.addEventListener('pointerdown', e => { e.stopPropagation(); });
    eb.addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('.kr-emob')) { el.hidden = !el.hidden; return; } const b = e.target.closest('.kr-emol button'); if (!b || !S || !S.live) return; el.hidden = true;
      const now = performance.now(); if (now - LIVE.emoAt < 1200) return; LIVE.emoAt = now; liveEmit({t: 'emo', race: S.live.id, e: b.textContent}); const k0 = S.karts[0]; k0.emo = b.textContent; k0.emoU = now + 2400; }); } }
  pm.addEventListener('click', e => {
    if (e.target.closest('.kr-resume')) resume();
    if (e.target.closest('.kr-restart')) { pm.hidden = true; startRace(); }
    if (e.target.closest('.kr-back')) { liveLeave(); toMenu(); }
    if (e.target.closest('.kr-quit')) { pm.hidden = true; close(); }
  });
  box.addEventListener('click', e => { if (e.target.closest('.kr-menu .kr-quit, .kr-res .kr-quit')) close(); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('.kr-pick:not(.kr-whop) button'); if (b) { me = b.dataset.id; makeVehicles(); renderMenu(); newRace(); S.paused = true; }
    const m = e.target.closest('.kr-mode button'); if (m) { MODE = m.dataset.mode; store.set('kartMode', MODE); RULE = MODE === 'daily' ? daily().rule : null; preview(MODE === 'cup' ? CUPSEL.t[0] : MODE === 'daily' ? daily().track.id : TRK); renderMenu(); }
    const cb = e.target.closest('.kr-cups button'); if (cb) { CUPSEL = CUPS.find(c => c.id === cb.dataset.c) || CUPS[0]; store.set('kartCup', CUPSEL.id); preview(CUPSEL.t[0]); renderMenu(); }
    const pb = e.target.closest('.kr-paints button'); if (pb) { const all = loadJ('kartPaint'), pt = paintOf(me); pt.c = pb.dataset.p || null; all[me] = pt; store.set('kartPaint', JSON.stringify(all)); makeVehicles(); renderMenu(); return; }
    const skb = e.target.closest('.kr-stks button'); if (skb && !skb.disabled) { const id0 = skb.dataset.s, X = STK.find(x0 => x0.id === id0), so = loadJ('kartStkOwn'), all = loadJ('kartPaint'), pt = paintOf(me);
      if (!so[id0]) { if (coins() < X.c) return; addCoins(-X.c); so[id0] = 1; store.set('kartStkOwn', JSON.stringify(so)); SFX.pick(); }
      pt.s = pt.s.includes(id0) ? pt.s.filter(z => z !== id0) : pt.s.concat(id0); all[me] = pt; store.set('kartPaint', JSON.stringify(all)); makeVehicles(); renderMenu(); return; }
    const sb = e.target.closest('.kr-shop button'); if (sb && !sb.disabled) { const tu = tune(), c = TCOST[tu[sb.dataset.k]]; if (tu[sb.dataset.k] < 5 && coins() >= c) { addCoins(-c); tu[sb.dataset.k]++; tuneSet(myVeh(), tu); SFX.pick(); if (tu[sb.dataset.k] >= 5) ach('tuned'); renderMenu(); } }
    const ob = e.target.closest('.kr-cos button'); if (ob && !ob.disabled) { const C = COS.find(x => x.id === ob.dataset.c), o = loadJ('kartCosOwn');
      if (C && !cosOwn()(C) && !C.ach && coins() >= C.c) { addCoins(-C.c); o[C.id] = 1; store.set('kartCosOwn', JSON.stringify(o)); SFX.pick(); }
      if (C && cosOwn()(C)) { const m = loadJ('kartCos'); m[me] = C.id; store.set('kartCos', JSON.stringify(m)); HEADC = {}; } renderMenu(); }
    const bk = e.target.closest('.kr-bk'); if (bk) { BX = BX === bk.dataset.k ? null : bk.dataset.k; renderMenu(); return; }
    const rec = e.target.closest('.kr-rec'); if (rec) { TRK = rec.dataset.t; store.set('kartTrack', TRK); if (MODE !== 'single') menu.querySelector('.kr-mode button[data-mode="single"]').click(); else { preview(TRK); renderMenu(); } menu.querySelector('.kr-trk').scrollIntoView({behavior: 'smooth', block: 'center'}); return; }
    if (e.target.closest('.kr-tutgo')) { tutStart(); return; }
    const cfb = e.target.closest('.kr-cfg button'); if (cfb) { cfgStep(cfb.dataset.cfg); return; }
    if (e.target.closest('.kr-tnt')) { LIVE.tauntOpen = !LIVE.tauntOpen; liveBox(); return; }
    const tnb = e.target.closest('.kr-tlist button'); if (tnb) { tauntSend(+tnb.dataset.tn); LIVE.tauntOpen = false; liveBox(); return; }
    if (e.target.closest('.kr-ptest')) { liveTest(); return; }
    if (e.target.closest('.kr-rjb')) { liveRejoin(); return; }
    if (e.target.closest('.kr-rdy')) { LIVE.rdy = !LIVE.rdy; livePres(); liveBox(); liveAuto(); return; }
    if (e.target.closest('.kr-gpt')) { store.set('kartLiveGP', store.get('kartLiveGP') === '1' ? '0' : '1'); livePres(); liveBox(); return; }
    if (e.target.closest('.kr-liveai')) { store.set('kartLiveAI', store.get('kartLiveAI') === '0' ? '1' : '0'); renderMenu(); return; }
    const pl0 = e.target.closest('.kr-pill'); if (pl0) { const d = menu.querySelector('.kr-' + pl0.dataset.open); if (d) { d.open = true; setTimeout(() => d.scrollIntoView({behavior: 'smooth', block: 'center'}), 30); } }
    const db0 = e.target.closest('.kr-diff button'); if (db0) { DIFF = +db0.dataset.d; store.set('kartDiff', DIFF); renderMenu(); }
    const gb = e.target.closest('.kr-ghost:not(.kr-diff) button'); if (gb) { GHOST.mode = gb.dataset.g; store.set('kartGhost', GHOST.mode); renderMenu(); }
    const t = e.target.closest('.kr-trk button'); if (t) { TRK = t.dataset.t; store.set('kartTrack', TRK); preview(TRK); renderMenu(); }
    const vb = e.target.closest('.kr-vehs:not(.kr-cos) button'); if (vb && !vb.disabled) { store.set('kartVeh', vb.dataset.v); makeVehicles(); newRace(); S.paused = true; renderMenu(); }
    if (e.target.closest('.kr-go')) { CUP = MODE === 'cup' ? {i: 0, pts: {}, races: [], list: CUPSEL.t, n: CUPSEL.n, e: CUPSEL.e} : null; RULE = MODE === 'daily' ? daily().rule : null; startRace(); }
  });
  res.addEventListener('click', e => {
    if (e.target.closest('.kr-again')) {
      if (CUP && CUP.done) { CUP = {i: 0, pts: {}, races: [], list: CUPSEL.t, n: CUPSEL.n, e: CUPSEL.e}; startRace(); }
      else if (CUP && CUP.i === CUP.list.length - 1) ceremony();
      else if (CUP) { CUP.i++; say('cupnext', 'Auf zum nächsten Rennen!', 1); startRace(); }
      else if (MODE === 'live') { if (LIVE.gp && LIVE.gp.i >= LIVE.gp.list.length - 1) LIVE.gp = null; liveLeave(); LIVE.rdy = true; toMenu(); }
      else startRace(); }
    if (e.target.closest('.kr-res .kr-back')) { if (LIVE.gp && LIVE.gp.i >= LIVE.gp.list.length - 1) LIVE.gp = null; liveLeave(); LIVE.rdy = false; toMenu(); }
  });
  // Steuerung: Daumen links/rechts, Item-Knopf; Tastatur
  const ptr = new Map();
  const lastTap = {L: 0, R: 0};
  const upd = () => { const v = [...ptr.values()]; INPUT.L = v.some(o => o.s === 'L'); INPUT.R = v.some(o => o.s === 'R');
    if (SET.ctl === 'analog') { INPUT.brake = v.length >= 2; const o = v[v.length - 1]; if (!o) INPUT.ax = null; else { const r = (o.x - W / 2) / (W * .3); INPUT.ax = Math.abs(r) < .08 ? 0 : clamp(r, -1, 1); } }
    else { INPUT.ax = null; INPUT.brake = false; } };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); if (S && S.pod) { podEnd(); return; }
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; if (px > W - 80 && py > 46 && py < 124) { if (S) useItem(S.karts[0]); return; }   // Item-Fenster oben rechts antippen = Item benutzen
    try { cv.setPointerCapture(e.pointerId); } catch (x) {} const sd = px < W / 2 ? 'L' : 'R', now = performance.now();
    if (SET.ctl !== 'analog' && now - lastTap[sd] < 300) INPUT.dtap = {s: sd === 'L' ? -1 : 1, t: now}; lastTap[sd] = now;
    ptr.set(e.pointerId, {s: sd, x: px}); upd(); });
  cv.addEventListener('pointermove', e => { if (ptr.has(e.pointerId)) { const r = cv.getBoundingClientRect(), px = e.clientX - r.left; ptr.set(e.pointerId, {s: px < W / 2 ? 'L' : 'R', x: px}); upd(); } });
  const drB = box.querySelector('.kr-drift');
  drB.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); INPUT.drift = true; try { drB.setPointerCapture(e.pointerId); } catch (x) {} });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => drB.addEventListener(n, () => { INPUT.drift = false; }));
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => cv.addEventListener(t, e => { ptr.delete(e.pointerId); upd(); }));
  itemBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (S) useItem(S.karts[0]); });
  box.addEventListener('touchmove', e => { if (!e.target.closest('.kr-menu, .kr-res, .kr-pm')) e.preventDefault(); }, {passive: false});
  box.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape' || e.key === 'p') { if (!pm.hidden) resume(); else if (box.classList.contains('racing')) pause(); else close(); return; } INPUT.keys[e.key] = true; if (e.key === ' ') { e.preventDefault(); if (S) useItem(S.karts[0]); } if (e.key.startsWith('Arrow')) e.preventDefault(); });
  addEventListener('keyup', e => { INPUT.keys[e.key] = false; });
  addEventListener('resize', () => { if (!box.hidden) resize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !box.hidden) pause(); });
  try { teaser(); } catch (e) {}
  setTimeout(() => { try { lbInit(); } catch (e) {} }, 1500);
  // Lobby-Hinweis auf der Seite: wer gerade im Live-Raum wartet (Raum wird nach dem Laden still betreten)
  function liveHint() { const tn = Date.now(), w = LIVE.peers.filter(p0 => !p0.sameTab && p0.presence && p0.presence.lob && !(p0.updatedAt && tn - p0.updatedAt > 10 * 60000)), racing = LIVE.peers.filter(p0 => !p0.sameTab && p0.presence && p0.presence.race);
    const txt = w.length ? '🟢 ' + w.map(p0 => NAME(p0.presence.who)).join(', ') + (w.length > 1 ? ' warten' : ' wartet') + ' im Live-Raum' : racing.length ? '🏁 Live-Rennen läuft (' + racing.length + ')' : '';
    let el = openBtn.querySelector('.kt-live'); if (!el && txt) { el = document.createElement('span'); el.className = 'kt-live'; openBtn.appendChild(el); } if (el) { el.textContent = txt; el.hidden = !txt; }
    const h = document.querySelector('[data-hint="kart-tab"]'); if (h) { if (txt) { h.dataset.live = 1; h.textContent = txt; h.classList.add('live'); } else if (h.dataset.live) { delete h.dataset.live; board(); } } LIVE.waiting = w.length; }
  setTimeout(() => { try { liveJoin(); } catch (e) {} }, 5000);
  setInterval(() => { if (!LIVE.room) return; liveHint(); if (!box.hidden && !menu.hidden && MODE === 'live' && lobby().length > 1) livePing(); }, 4000);
  openBtn.addEventListener('click', () => { if (LIVE.waiting && MODE !== 'live') { MODE = 'live'; store.set('kartMode', MODE); setTimeout(renderMenu, 50); } }, true);
  box.addEventListener('click', e => { const w = e.target.closest('.kr-whop button'); if (w) setMe(w.dataset.who); });
  window.__kartAt = (i, l) => at(i, l); window.__kartTW = () => TW;
  window.__kart = {ls: pr => liveSample(pr, q => q), hymn: id => hymn(id), cut: () => CUT, live: () => LIVE, liveGo: a => liveGo(a), emo: e => { const b = [...box.querySelectorAll('.kr-emol button')].find(x => x.textContent === e); if (b) b.click(); }, hitK: (i, why) => hit(S.karts[i], why), open, pause, resume, state: () => S, input: INPUT, step: dt => step(dt), draw: () => draw(), finish: () => finish(), say, bufs: () => BUF, load: id => preview(id), cup: () => CUP, lb: () => [LB, LBD, WR], daily, tracks: TRACKS.map(t => t.id)};
})();
