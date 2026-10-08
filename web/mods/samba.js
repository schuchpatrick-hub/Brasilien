/* ---------- Samba-Show: Crew-Köpfe auf Cartoon-Körpern, Münder klappen wie bei den South-Park-Kanadiern ----------
   Alles hängt nur an der Zeit t (ms seit Start): frame(t) zeichnet jedes Bild neu, daher kann die Video-Aufnahme die Zeit
   über window.__danceT selbst setzen. Musik = Show-Samba aus der Karten-Animation (window.__TripMusic, Modus 'show'),
   Stimmen = MP3s mit Lautstärkekurve (trip.json → dance.voice), nach der der Oberkopf hochklappt; Sprüche haben Varianten
   (`alts`), pro Abspielen zufällig. Live-Daten: Krone = meiste Siege, Narrenkappe = meiste letzte Plätze, schief und rot =
   meiste Drinks heute. Ablauf (Zeitfenster in T): Ansage · Vorhang · Köpfe fallen · Solos (Kamera zoomt) · Patrick aus dem
   Takt · La Ola · Kostümwechsel + „Olê, olê“ gesungen · Polonaise · Daijo-Solo · Tanz-Duell Simon gegen Greisel · Sprung ·
   Ananas auf Jonas · Pyramide · „Tschau, Brasil!“ · Vorhang · Pannen vom Dreh (Pyramide kracht, Megafon pfeift, Discokugel fällt). */
(function () {
  const svg = document.getElementById('samba-svg'), btn = document.getElementById('samba-play'), sbtn = document.getElementById('samba-sound');
  if (!svg || !btn || PRINT || !TRIP.dance) return;
  const D = TRIP.dance, NS = 'http://www.w3.org/2000/svg', W = 800, H = 500, FLOOR = 452, BEAT = 500, MUSIC_AT = 1500;
  const NV = [1e9, 1e9 + 1];   // „nie“
  const TMAIN = {freeze: [17600, 25000], munch: [21100, 22200], wave: [25200, 27200], flash: 27300, chant: [27300, 32300], conga: [32400, 36600], wink: [34000, 35400],
    moves: [36700, 44700], solo: [44800, 48600], duel: [48800, 56000], duelS: [49000, 51400], duelG: [51600, 54000], verdict: [54200, 56000], spin: [56200, 57400], fruit: [57400, 58400],
    pyr: [58700, 63400], confetti: 59900, close: [63400, 65000], blo: [65600, 79600], b1: [67000, 70800], b2: [71000, 74400], b3: [74600, 78000], close2: [78200, 79600], credits: [80000, 89400]};
  const END_MAIN = 89800;
  // Zugabe: kurze Bonus-Runde (Kostüme gleich an, Olê-Chor, La Ola, Polonaise, Sprung, Konfetti, Tschau)
  const TENC = {moves: NV, credits: NV, freeze: NV, munch: NV, wave: [9000, 11000], flash: -1000, chant: [3800, 8800], conga: [11200, 14800], wink: NV, solo: NV, duel: NV, duelS: NV, duelG: NV,
    verdict: NV, spin: [14900, 16100], fruit: [-9, -8], pyr: NV, confetti: 15000, close: [17400, 19000], blo: NV, b1: NV, b2: NV, b3: NV, close2: NV};
  let T = TMAIN, END = END_MAIN, ENC = false, encoreReady = false;
  // Zufalls-Ereignis während der Polonaise (pro Abspielen eins)
  const EVENTS = ['rain', 'monkey', 'police', 'waiter'];
  let EVENT = 'police', VICTIM = 'simon', TAPS = [], BOOST = {clap: -1e9, cheer: -1e9}, PRESS = [], liveM = null;   // PRESS: [{t, k: 'clap'|'cheer'}]
  const evw = () => [T.conga[0] + 200, T.conga[1] - 200];
  // Attribute nur schreiben, wenn sich der Wert ändert: spart pro Bild Hunderte Neuberechnungen (wichtig im Vollbild)
  const SET = Element.prototype.setAttribute;
  function fastSet(k, v) { v = String(v); const c = this.__c || (this.__c = {}); if (c[k] === v) return; c[k] = v; SET.call(this, k, v);
    if (k === 'opacity') { const off = !(parseFloat(v) > .004); if (this.__off !== off) { this.__off = off; this.style.display = off ? 'none' : ''; } } }   // Unsichtbares gar nicht erst zeichnen
  const TXT = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent'), fastTxt = {configurable: true, get() { return TXT.get.call(this); }, set(v) { v = String(v); if (this.__t === v) return; this.__t = v; TXT.set.call(this, v); }};
  const speed = e => { if (e.setAttribute !== fastSet) { e.setAttribute = fastSet; Object.defineProperty(e, 'textContent', fastTxt); } };
  const fast = root => root.querySelectorAll('*').forEach(speed);
  const mk = (tag, a, parent) => { const e = document.createElementNS(NS, tag); speed(e); for (const k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };
  const byId = Object.fromEntries(TRIP.crew.map(c => [c.id, c]));
  const tnow = () => window.__danceT !== undefined ? window.__danceT : performance.now();
  const soundOn = () => store.get('sound') !== '0';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = x => { x = clamp(x, 0, 1); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1), win = (t, w, f) => span(t, w[0], w[0] + (f || 300)) * (1 - span(t, w[1] - (f || 300), w[1]));
  const ids = D.order.filter(id => byId[id]), N = ids.length, homeX = i => 90 + i * (620 / (N - 1));
  const R = 47, SKIN = '#f1c7a5', INK = '#2a1a12', S = Math.sin, C = Math.cos, PI = Math.PI;
  const hash = (a, b) => { const x = S(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  const voiceOf = key => (D.voice || {})[key] || {dur: 1500, env: ''};
  let LINES = [], LIVE = {};
  function pickLines(seed) {   // pro Abspielen eine Variante je Spruch (Video: seed 0 = immer die erste)
    // Chöre (grp c1/c2): alle singen dieselbe Variante, und der zweite Durchgang ist immer ein anderer Chor als der erste
    const pick = (l, k) => { const vs = [l].concat(l.alts || []), n = vs.length;
      if (!l.grp) return vs[seed ? Math.floor(hash(seed, k) * n) : 0];
      const i1 = seed ? Math.floor(hash(seed, 7) * n) : 0;
      return vs[l.grp === 'c1' ? i1 : (i1 + 1 + (seed ? Math.floor(hash(seed, 8) * (n - 1)) : 0)) % n]; };
    const AT = {ole: 4000, ole2: 6400, tchau: 15600};
    LINES = D.lines.filter(l => !ENC || l.chorus).map((l, k) => { const v = pick(l, k), key = l.src || (v === l && l.src0) || v.key;
      return Object.assign({}, l, {file: key, text: v.text || ''}, ENC ? {at: AT[l.key.split('-')[0]] || l.at} : {}, voiceOf(key)); });
  }
  pickLines(0);

  // ---------- Bühne (einmal aufbauen) ----------
  svg.innerHTML = '';
  const defs = mk('defs', {}, svg);
  defs.innerHTML = '<linearGradient id="sb-sky" x1="0" y1="0" x2="0" y2="1"><stop id="sb-sky0" offset="0" stop-color="#1d1450"/><stop id="sb-sky1" offset=".55" stop-color="#b8407a"/><stop id="sb-sky2" offset="1" stop-color="#ffb05c"/></linearGradient>' +
    '<radialGradient id="sb-spot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="sb-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".05"/><stop offset="1" stop-color="#fff6c8" stop-opacity=".3"/></linearGradient>' +
    '<radialGradient id="sb-fog" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="sb-ball" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9d3e6"/><stop offset="1" stop-color="#5b6478"/></radialGradient>' +
    '<radialGradient id="sb-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="sb-refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    `<mask id="sb-reflmask"><rect x="0" y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="url(#sb-refl)"/></mask>` +
    '<pattern id="sb-wave" width="60" height="26" patternUnits="userSpaceOnUse"><rect width="60" height="26" fill="#f4efe4"/><path d="M0,13 C15,0 15,26 30,13 S45,0 60,13 L60,26 L0,26Z" fill="#1c1c1c"/></pattern>' +
    '<linearGradient id="sb-curt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d0b1f"/><stop offset=".5" stop-color="#c8193a"/><stop offset="1" stop-color="#7d0b1f"/></linearGradient>' +
    ['#ff3d7f', '#3ce0ff', '#ffe14d'].map((c, k) => `<linearGradient id="sb-beam${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`).join('');
  const world = mk('g', {}, svg);   // alles, was die Kamera bewegt
  mk('rect', {x: -200, y: -200, width: W + 400, height: H + 400, fill: 'url(#sb-sky)'}, world);
  const stars = mk('g', {fill: '#fff'}, world); for (let k = 0; k < 30; k++) mk('circle', {cx: hash(k, 1) * W, cy: hash(k, 2) * 160, r: hash(k, 3) * 1.4 + .4, opacity: .7}, stars);
  const scenery = mk('g', {}, world);
  // Bühne passend zur Reise: unterwegs der Hintergrund der heutigen Station (vor und nach der Reise: Copacabana im Sonnenuntergang)
  const STAGES = {
    default: {sky: ['#1d1450', '#b8407a', '#ffb05c'], night: 1, label: ''},
    guaruja: {sky: ['#2f86d0', '#7cc4ee', '#ffe6a8'], label: 'Guarujá'},
    rio: {sky: ['#1d1450', '#b8407a', '#ffb05c'], night: 1, label: 'Rio de Janeiro'},
    silvester: {sky: ['#04061a', '#141a4a', '#2c2f6b'], night: 1, label: 'Copacabana, Silvester'},
    iguacu: {sky: ['#4f9ccc', '#a9d6ea', '#e8f4e8'], label: 'Foz do Iguaçu'},
    jungle: {sky: ['#1f4a2c', '#4f8a45', '#c9d98a'], label: 'Amazonas'},
    paraty: {sky: ['#3f88c4', '#9cc9e6', '#f6e7c1'], label: 'Paraty'},
    ilha: {sky: ['#2b80c4', '#8ccbe8', '#fde3a7'], label: 'Ilha Grande'}};
  let STAGE = 'default', sceneTick = () => {};
  function stageToday() {
    if (window.__danceStage) return window.__danceStage;
    let d = ''; try { d = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Sao_Paulo'}).format(new Date()).replace(/-/g, ''); } catch (e) { return 'default'; }
    if (d === '20261231' || d === '20270101') return 'silvester';
    const st = (TRIP.stays || []).find(s => (s.g === 'all' || s.g === G) && d >= s.from && d < s.to) || (TRIP.stays || []).find(s => d >= s.from && d < s.to);
    if (!st) return 'default';
    const n = st.name.toLowerCase();
    return /guaruj/.test(n) ? 'guaruja' : /rio/.test(n) ? 'rio' : /igua/.test(n) ? 'iguacu' : /manaus|juma|amazon/.test(n) ? 'jungle' : /paraty/.test(n) ? 'paraty' : /ilha/.test(n) ? 'ilha' : 'default';
  }
  const sugar = g => mk('path', {d: 'M470,400 C500,330 530,250 585,230 C625,215 640,300 660,330 C690,300 700,250 735,255 C770,262 790,330 800,360 L800,400Z', fill: '#2b1f4a'}, g);
  const palms = (g, list, fill) => list.forEach(([x, y, s]) => { const p = mk('g', {transform: `translate(${x},${y}) scale(${s})`, fill: fill || '#1d2b2a'}, g);
    mk('path', {d: 'M-4,0 Q4,-80 10,-150 L16,-150 Q10,-80 6,0Z'}, p);
    [-150, -110, -60, -20, 30].forEach(a => mk('path', {d: 'M13,-150 Q40,-175 80,-150 Q45,-160 13,-146Z', transform: `rotate(${a + 40},13,-150)`}, p)); });
  const sea = (g, c) => mk('rect', {x: -200, y: 360, width: W + 400, height: 40, fill: c || '#3a6fa8', opacity: .85}, g);
  function buildStage(name) {
    STAGE = STAGES[name] ? name : 'default'; const st = STAGES[STAGE]; scenery.innerHTML = ''; sceneTick = () => {};
    st.sky.forEach((c, k) => { const e = document.getElementById('sb-sky' + k); if (e) e.setAttribute('stop-color', c); });
    stars.setAttribute('opacity', st.night ? 1 : 0);
    const g = scenery;
    if (STAGE === 'default' || STAGE === 'rio') {
      mk('circle', {cx: 640, cy: 250, r: 70, fill: '#ffd36b', opacity: .85}, g); sugar(g); sea(g); palms(g, [[70, 400, 1], [150, 400, .8]]);
      if (STAGE === 'rio') { mk('path', {d: 'M200,400 C240,330 290,290 330,285 C370,290 410,340 440,400Z', fill: '#2b1f4a'}, g);   // Corcovado mit Cristo
        mk('path', {d: 'M326,286 l0,-34 M310,262 l32,0', stroke: '#2b1f4a', 'stroke-width': 7, 'stroke-linecap': 'round'}, g); mk('circle', {cx: 326, cy: 246, r: 5, fill: '#2b1f4a'}, g); }
    } else if (STAGE === 'silvester') {
      sugar(g); sea(g, '#1b2a5c'); palms(g, [[70, 400, 1], [150, 400, .8]], '#05070f');
      const fw = Array.from({length: 6}, (_, k) => { const b = mk('g', {}, g), c = ['#ffcf1f', '#ff5fa2', '#3ce0ff', '#fff', '#3ccf7f', '#ff8a3c'][k];
        for (let r = 0; r < 14; r++) mk('line', {stroke: c, 'stroke-width': 2.5, 'stroke-linecap': 'round'}, b); return {b, x: 120 + k * 115 + hash(k, 21) * 40, y: 90 + hash(k, 22) * 90, ph: hash(k, 23)}; });
      const ban = mk('text', {x: W / 2, y: 140, 'text-anchor': 'middle', class: 'sb-sub', opacity: .9}, g); ban.textContent = '🎆 Feliz Ano Novo! 🎆';
      sceneTick = t => fw.forEach(f => { const k = ((t / 1600 + f.ph) % 1), r = 10 + 55 * Math.sqrt(k); f.b.setAttribute('opacity', (1 - k).toFixed(2));
        [...f.b.children].forEach((l, i) => { const a = i / 14 * 2 * PI; l.setAttribute('x1', f.x + C(a) * r * .5); l.setAttribute('y1', f.y + S(a) * r * .5 + k * 12); l.setAttribute('x2', f.x + C(a) * r); l.setAttribute('y2', f.y + S(a) * r + k * 12); }); });
    } else if (STAGE === 'guaruja') {
      mk('circle', {cx: 650, cy: 90, r: 45, fill: '#fff3b0'}, g); sea(g, '#2aa3c4'); mk('rect', {x: -200, y: 384, width: W + 400, height: 16, fill: '#f1d9a4'}, g);
      palms(g, [[60, 400, 1], [720, 400, .9]], '#2d6b3c');
      const u = mk('g', {transform: 'translate(560,400)'}, g); mk('line', {x1: 0, y1: 0, x2: 0, y2: -70, stroke: '#555', 'stroke-width': 3}, u);
      ['#ff5f5f', '#fff', '#ff5f5f', '#fff'].forEach((c, k) => mk('path', {d: `M0,-70 L${-50 + k * 25},-48 L${-25 + k * 25},-48Z`, fill: c}, u));
    } else if (STAGE === 'iguacu') {
      mk('path', {d: 'M-200,400 L-200,190 C0,170 120,200 260,185 C420,170 560,205 1000,180 L1000,400Z', fill: '#2f6b3a'}, g);
      const falls = [80, 190, 300, 430, 540, 650].map((x, k) => { const fall = mk('rect', {x, y: 190, width: 60 + (k % 2) * 25, height: 175, fill: '#e8f6ff', opacity: .9}, g);
        const streak = mk('path', {d: `M${x + 10},190 L${x + 10},365 M${x + 30},190 L${x + 30},365 M${x + 50},190 L${x + 50},365`, stroke: '#9fd2ee', 'stroke-width': 3, 'stroke-dasharray': '14 10'}, g); return streak; });
      [0, 1, 2].forEach(k => mk('path', {d: 'M120,360 A280,200 0 0 1 680,360', fill: 'none', stroke: ['#ff5f5f', '#ffe14d', '#5fd3ff'][k], 'stroke-width': 7, opacity: .45, transform: `translate(0,${k * 7})`}, g));
      const mist = mk('ellipse', {cx: 400, cy: 365, rx: 520, ry: 40, fill: 'url(#sb-fog)', opacity: .9}, g); sea(g, '#4f8fb8');
      sceneTick = t => falls.forEach((f, k) => f.setAttribute('stroke-dashoffset', (-(t / 6 + k * 7) % 24).toFixed(1)));
    } else if (STAGE === 'jungle') {
      for (let k = 0; k < 9; k++) mk('ellipse', {cx: -40 + k * 110, cy: 260 + hash(k, 31) * 60, rx: 110, ry: 120, fill: ['#1d4d2a', '#24603a', '#163d22'][k % 3]}, g);
      sea(g, '#7a5a2e');
      for (let k = 0; k < 6; k++) mk('path', {d: `M${60 + k * 140},0 Q${80 + k * 140},80 ${50 + k * 140},170`, fill: 'none', stroke: '#2f5d24', 'stroke-width': 4}, g);
      const bird = mk('text', {'font-size': 30}, g); bird.textContent = '🦜';
      sceneTick = t => { const k = (t / 9000) % 1; bird.setAttribute('x', (-60 + k * 920).toFixed(1)); bird.setAttribute('y', (120 + 30 * S(t / 400)).toFixed(1)); };
    } else if (STAGE === 'paraty') {
      mk('path', {d: 'M-200,330 C100,250 300,290 500,260 C650,240 800,280 1000,260 L1000,400 L-200,400Z', fill: '#3f7a46'}, g);
      [[40, '#1f5fbf'], [170, '#e0a900'], [300, '#2f9e5a'], [520, '#1f5fbf'], [650, '#c0392b']].forEach(([x, c]) => {
        mk('rect', {x, y: 300, width: 110, height: 72, fill: '#fbf7ee', stroke: '#c9c2b0'}, g); mk('path', {d: `M${x - 6},300 L${x + 55},276 L${x + 116},300Z`, fill: '#b5522f'}, g);
        mk('rect', {x: x + 45, y: 336, width: 20, height: 36, fill: c}, g); [x + 12, x + 80].forEach(wx => mk('rect', {x: wx, y: 316, width: 16, height: 16, fill: c}, g)); });
      mk('rect', {x: 420, y: 250, width: 70, height: 122, fill: '#fbf7ee', stroke: '#c9c2b0'}, g); mk('path', {d: 'M414,250 L455,214 L496,250Z', fill: '#b5522f'}, g);
      mk('circle', {cx: 455, cy: 280, r: 10, fill: '#1f5fbf'}, g); sea(g, '#3a7fb0');
    } else if (STAGE === 'ilha') {
      mk('circle', {cx: 140, cy: 110, r: 40, fill: '#fff3b0'}, g); sea(g, '#2a9ec4');
      mk('path', {d: 'M300,362 C380,250 470,230 560,262 C640,240 720,290 790,362Z', fill: '#2f7a40'}, g);
      palms(g, [[40, 400, .9]], '#2d6b3c');
      const boat = mk('text', {'font-size': 34}, g); boat.textContent = '⛵';
      sceneTick = t => { const k = (t / 14000) % 1; boat.setAttribute('x', (900 - k * 1000).toFixed(1)); boat.setAttribute('y', (372 + 3 * S(t / 300)).toFixed(1)); };
    }
  }
  buildStage('default');
  const bulbs = [], lights = mk('g', {}, world);
  mk('path', {d: 'M0,40 Q200,95 400,55 Q600,15 800,60', fill: 'none', stroke: '#222', 'stroke-width': 2}, lights);
  for (let i = 0; i < 17; i++) { const x = i * 50, y = i < 8 ? 40 + 49.5 * S(PI * x / 400) : 55 - 25 * S(PI * (x - 400) / 400);
    bulbs.push(mk('circle', {cx: x, cy: y + 7, r: 6, fill: ['#ffcf1f', '#3ccf7f', '#ff5fa2', '#5fd3ff'][i % 4]}, lights)); }
  mk('rect', {x: -200, y: 400, width: W + 400, height: 200, fill: 'url(#sb-wave)'}, world);
  mk('rect', {x: -200, y: 400, width: W + 400, height: 200, fill: '#0b1a33', opacity: .28}, world);   // nasser, dunkler Boden
  const refl = mk('g', {mask: 'url(#sb-reflmask)', opacity: .9, class: 'sb-heavy'}, world);   // Spiegelung auf dem nassen Boden
  const shadows = mk('g', {}, world);
  // Discokugel mit Lichtpunkten
  const ball = mk('g', {}, world), ballLine = mk('line', {x1: 400, y1: -200, x2: 400, stroke: '#ddd', 'stroke-width': 1.5}, ball), ballG = mk('g', {}, ball);
  mk('circle', {r: 24, fill: 'url(#sb-ball)', stroke: '#3b4152', 'stroke-width': 1}, ballG);
  for (let k = -2; k <= 2; k++) mk('line', {x1: -24, y1: k * 9, x2: 24, y2: k * 9, stroke: '#7a8396', 'stroke-width': .8}, ballG);
  const ballV = []; for (let k = 0; k < 5; k++) ballV.push(mk('ellipse', {cx: 0, cy: 0, rx: 4, ry: 24, fill: 'none', stroke: '#7a8396', 'stroke-width': .8}, ballG));
  const dots = mk('g', {}, world), dotEls = Array.from({length: 26}, (_, k) => mk('circle', {r: 2.5 + hash(k, 5) * 2.5, fill: ['#fff', '#ffe14d', '#3ce0ff', '#ff5fa2'][k % 4]}, dots));
  const spot = mk('g', {opacity: 0}, world);
  const cone = mk('path', {fill: 'url(#sb-cone)'}, spot), pool = mk('ellipse', {ry: 18, rx: 70, fill: 'url(#sb-spot)'}, spot);
  const gPeople = mk('g', {}, world);
  const beams = mk('g', {class: 'sb-beams'}, world), beamEls = [150, 400, 650].map((x, k) => ({x, el: mk('path', {fill: `url(#sb-beam${k})`, d: 'M-12,0 L12,0 L70,520 L-70,520Z'}, beams)}));
  const fog = mk('g', {class: 'sb-heavy'}, world), fogEls = Array.from({length: 7}, (_, k) => mk('ellipse', {cy: 440 + (k % 3) * 14, rx: 170, ry: 26, fill: 'url(#sb-fog)'}, fog));
  const gFx = mk('g', {}, world);
  const crowd = mk('g', {}, world), fans = Array.from({length: 15}, (_, k) => { const g = mk('g', {}, crowd);
    const armL = mk('line', {x1: -10, y1: 4, x2: -18, y2: 22, stroke: '#140d29', 'stroke-width': 7, 'stroke-linecap': 'round'}, g), armR = mk('line', {x1: 10, y1: 4, x2: 18, y2: 22, stroke: '#140d29', 'stroke-width': 7, 'stroke-linecap': 'round'}, g);
    mk('ellipse', {cx: 0, cy: 30, rx: 26, ry: 18, fill: '#140d29'}, g); mk('circle', {cx: 0, cy: 0, r: 15, fill: '#140d29'}, g);
    return {g, armL, armR, x: 20 + k * 54 + hash(k, 7) * 14, y: 484 + hash(k, 8) * 10, ph: hash(k, 9) * 6}; });
  const gBub = mk('g', {}, world), partG = mk('g', {}, world);   // partG: 👏/🎉 vom Publikum

  // ---------- Figuren ----------
  const P = {};
  const limb = (parent, top, w1, w2, len1, len2) => {
    const a = mk('g', {}, parent); mk('line', {x1: 0, y1: 0, x2: 0, y2: len1, stroke: top, 'stroke-width': w1, 'stroke-linecap': 'round'}, a);
    const f = mk('g', {transform: `translate(0,${len1})`}, a); mk('line', {x1: 0, y1: 0, x2: 0, y2: len2, stroke: SKIN, 'stroke-width': w2, 'stroke-linecap': 'round'}, f); return {a, f};
  };
  const PROPS = {jonas: '📣', simon: '🌹', patrick: '🍗', marco: '🍍', greisel: '💍', dajo: '🎤'};
  const FEATH = ['#ffcf1f', '#3ccf7f', '#ff5fa2', '#5fd3ff', '#ff8a3c', '#ffcf1f', '#3ccf7f'];
  ids.forEach((id, i) => {
    const L = D.look[id] || {}, p = byId[id], o = {id, i, L}, shirt = L.shirt || '#ffcf1f', pants = L.pants || '#1f3f8f';
    // Pailletten-Muster für den Kostümwechsel
    const pat = mk('pattern', {id: 'sb-seq-' + id, width: 10, height: 10, patternUnits: 'userSpaceOnUse'}, defs);
    mk('rect', {width: 10, height: 10, fill: shirt}, pat); [[2.5, 2.5], [7.5, 7.5]].forEach(([x, y]) => mk('circle', {cx: x, cy: y, r: 2.2, fill: '#fff', opacity: .55}, pat));
    o.g = mk('g', {id: 'sb-p-' + id}, gPeople); o.body = mk('g', {}, o.g);
    o.fan = mk('g', {opacity: .95}, o.body);   // Federschmuck hinter dem Kopf
    FEATH.forEach((c, k) => mk('ellipse', {cx: 0, cy: -112, rx: 10, ry: 44, fill: c, stroke: INK, 'stroke-width': 1, transform: `rotate(${(k - 3) * 24},0,-66)`}, o.fan));
    o.fan2 = mk('g', {opacity: 0}, o.body);    // großer Karnevals-Federhut nach dem Kostümwechsel
    for (let k = 0; k < 9; k++) mk('ellipse', {cx: 0, cy: -128, rx: 9, ry: 50, fill: k % 2 ? '#ffd700' : FEATH[k % 7], stroke: '#7a4b00', 'stroke-width': 1, transform: `rotate(${(k - 4) * 19},0,-80)`}, o.fan2);
    o.legL = limb(o.body, pants, 12, 8, 30, 28); o.legR = limb(o.body, pants, 12, 8, 30, 28);
    [o.legL, o.legR].forEach(l => mk('ellipse', {cx: 4, cy: 31, rx: 10, ry: 5, fill: INK}, l.f));
    o.torso = mk('g', {}, o.body);
    o.shirt = mk('path', {d: 'M-19,-50 Q0,-56 19,-50 L21,2 Q0,7 -21,2Z', fill: shirt, stroke: INK, 'stroke-width': 2.5}, o.torso);
    o.belt = mk('rect', {x: -21, y: -8, width: 42, height: 12, rx: 3, fill: pants, stroke: INK, 'stroke-width': 2}, o.torso);
    o.armL = limb(o.torso, shirt, 10, 7, 24, 21); o.armR = limb(o.torso, shirt, 10, 7, 24, 21);
    [o.armL, o.armR].forEach(l => mk('circle', {cx: 0, cy: 24, r: 6, fill: SKIN, stroke: INK, 'stroke-width': 1.5}, l.f));
    if (PROPS[id]) { o.prop = mk('text', {x: 0, y: 34, 'font-size': 20, 'text-anchor': 'middle'}, o.armR.f); o.prop.textContent = PROPS[id]; }
    mk('rect', {x: -6, y: -60, width: 12, height: 12, fill: SKIN}, o.torso);
    // Kopf: Foto in zwei Hälften, Trennlinie auf Mundhöhe; die obere Hälfte klappt beim Sprechen hoch
    const f = L.face || {x: .5, y: .5, z: 1, m: .75}, Dd = 2 * R * f.z;
    const mY = clamp((f.m - f.y) * Dd, -R * .2, R * .75), c = Math.sqrt(R * R - mY * mY);
    const up = `M${-c},${mY} A${R},${R} 0 ${mY > 0 ? 1 : 0} 1 ${c},${mY}Z`, lo = `M${-c},${mY} A${R},${R} 0 ${mY > 0 ? 0 : 1} 0 ${c},${mY}Z`;
    mk('path', {d: up}, mk('clipPath', {id: 'sb-u-' + id}, defs)); mk('path', {d: lo}, mk('clipPath', {id: 'sb-l-' + id}, defs));
    o.head = mk('g', {}, o.torso); o.mY = mY; o.c = c;
    o.mouth = mk('ellipse', {cx: 0, rx: c * .82, fill: '#3a0a0a'}, o.head); o.tongue = mk('ellipse', {cx: 0, rx: c * .42, fill: '#e0566b'}, o.head);
    const half = (clip, d) => { const g = mk('g', {}, o.head);
      if (p && p.photo) mk('image', {href: p.photo, x: -f.x * Dd, y: -f.y * Dd, width: Dd, height: Dd, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${clip})`}, g);
      else mk('path', {d, fill: '#00843d'}, g);
      return g; };
    o.lower = half('sb-l-' + id, lo); o.upper = half('sb-u-' + id, up);
    o.tint = [mk('path', {d: lo, fill: '#ff2a00', opacity: 0, class: 'sb-tint'}, o.lower), mk('path', {d: up, fill: '#ff2a00', opacity: 0, class: 'sb-tint'}, o.upper)];
    mk('path', {d: lo, fill: 'none', stroke: INK, 'stroke-width': 3}, o.lower); mk('path', {d: up, fill: 'none', stroke: INK, 'stroke-width': 3}, o.upper);
    if (!(p && p.photo)) { const t = mk('text', {y: -6, 'text-anchor': 'middle', 'font-size': 30, fill: '#fff', 'font-weight': 800}, o.upper); t.textContent = p ? p.name[0] : '?'; }
    // Cartoon-Augenbrauen über den Augen des Fotos (wandern beim Sprechen und Staunen nach oben)
    const ey = ((f.e || .5) - f.y) * Dd - 12, ex = (f.ex || .13) * Dd;
    o.brows = [];   // Augenbrauen bewusst weggelassen
    o.sweat = [0, 1, 2].map(k => mk('path', {d: 'M0,-7 Q5,0 0,5 Q-5,0 0,-7Z', fill: '#7fd3ff', stroke: '#2a6f99', 'stroke-width': 1, opacity: 0}, o.head));
    o.hat = mk('g', {opacity: 0}, o.head);   // Krone oder Narrenkappe (Live-Daten)
    mk('use', {href: '#sb-p-' + id, transform: `translate(0,${2 * FLOOR}) scale(1,-1)`}, refl);
    o.shadow = mk('ellipse', {cy: FLOOR + 2, rx: 30, ry: 7, fill: 'url(#sb-shadow)'}, shadows);
    P[id] = o;
  });
  const flash = mk('rect', {x: -200, y: -200, width: W + 400, height: H + 400, fill: '#fff', opacity: 0}, world);
  const hat = mk('text', {'font-size': 34, 'text-anchor': 'middle', opacity: 0}, gFx); hat.textContent = '🍍';   // fliegende Ananas
  const chick = mk('text', {'font-size': 26, 'text-anchor': 'middle', opacity: 0}, gFx); chick.textContent = '🍗';
  const limbo = mk('g', {opacity: 0}, gFx);
  [340, 460].forEach(x => { mk('rect', {x: x - 4, y: FLOOR - 130, width: 8, height: 132, rx: 3, fill: '#ffcf1f', stroke: INK, 'stroke-width': 2}, limbo); });
  const limboBar = mk('rect', {x: 336, y: FLOOR - 104, width: 128, height: 9, rx: 4, fill: '#ff5fa2', stroke: INK, 'stroke-width': 2}, limbo);   // Patricks Hähnchen fällt runter
  // Ereignisse: Regen, Affe, Polizei, Kellner
  const ev = mk('g', {}, gFx);
  const clouds = mk('g', {opacity: 0}, ev); [[120, 40], [330, 25], [560, 45], [740, 30]].forEach(([x, y]) => [[0, 0, 70], [50, -15, 55], [-50, -8, 50]].forEach(([dx, dy, r]) => mk('ellipse', {cx: x + dx, cy: y + dy, rx: r, ry: r * .55, fill: '#7d8597'}, clouds)));
  const drops = mk('g', {opacity: 0, stroke: '#a9d8ff', 'stroke-width': 2}, ev), dropEls = Array.from({length: 70}, (_, k) => mk('line', {x1: 0, y1: 0, x2: -3, y2: 14}, drops));
  const umbr = ids.map(() => { const e = mk('text', {'font-size': 46, 'text-anchor': 'middle', opacity: 0}, ev); e.textContent = '☂️'; return e; });
  const monkey = mk('text', {'font-size': 46, 'text-anchor': 'middle', opacity: 0}, ev); monkey.textContent = '🐒';
  const feather = mk('text', {'font-size': 30, 'text-anchor': 'middle', opacity: 0}, ev); feather.textContent = '🪶';
  const cop = mk('text', {'font-size': 70, 'text-anchor': 'middle', opacity: 0}, ev); cop.textContent = '👮';
  const waiter = mk('text', {'font-size': 66, 'text-anchor': 'middle', opacity: 0}, ev); waiter.textContent = '🤵';
  const tray = mk('text', {'font-size': 24, 'text-anchor': 'middle', opacity: 0}, ev); tray.textContent = '🍹🍹🍹';
  const conf = mk('g', {}, gFx), confs = Array.from({length: 110}, (_, k) => ({x: hash(k, 11) * W, d: 60 + hash(k, 12) * 90, s: hash(k, 13) * 7, el: mk('rect', {width: 8, height: 4, fill: ['#ffcf1f', '#3ccf7f', '#ff5fa2', '#5fd3ff', '#fff'][k % 5]}, null)}));
  confs.forEach(q => conf.appendChild(q.el));
  // Applaus-Meter fürs Tanz-Duell
  const meter = mk('g', {opacity: 0}, null), meterBars = ['simon', 'greisel'].map((id, k) => { const y = 92 + k * 34;
    mk('rect', {x: 250, y, width: 300, height: 24, rx: 12, fill: '#140d29', stroke: '#fff', 'stroke-width': 2}, meter);
    const bar = mk('rect', {x: 252, y: y + 2, width: 0, height: 20, rx: 10, fill: k ? '#8a4fbf' : '#00a651'}, meter);
    const tx = mk('text', {x: 240, y: y + 18, 'text-anchor': 'end', class: 'sb-meter'}, meter); tx.textContent = byId[id] ? byId[id].name : id; return bar; });
  const meterT = mk('text', {x: 400, y: 80, 'text-anchor': 'middle', class: 'sb-meter'}, meter); meterT.textContent = '👏 Applaus-Meter';
  // Kamera-unabhängig: Vorhang, Titel, Ansage, Filmklappe
  const hud = mk('g', {}, svg);
  const curtL = mk('rect', {x: 0, width: W / 2 + 30, height: H, fill: 'url(#sb-curt)'}, hud), curtR = mk('rect', {width: W / 2 + 30, height: H, fill: 'url(#sb-curt)'}, hud);
  const title = mk('g', {}, hud);
  const tt = mk('text', {x: W / 2, y: 230, 'text-anchor': 'middle', class: 'sb-title'}, title); tt.textContent = '💃 ' + (D.title || 'Samba-Show');
  const ts = mk('text', {x: W / 2, y: 275, 'text-anchor': 'middle', class: 'sb-sub'}, title);
  const loc = mk('text', {x: 14, y: H - 14, class: 'sb-loc', opacity: 0}, hud);
  const cap = mk('g', {opacity: 0}, hud); const capR = mk('rect', {x: 40, y: 18, width: W - 80, height: 40, rx: 20, fill: '#10231d', opacity: .88}, cap);
  const capT = mk('text', {x: W / 2, y: 45, 'text-anchor': 'middle', class: 'sb-cap'}, cap);
  hud.appendChild(meter); meter.setAttribute('transform', 'translate(0,-20)');
  const credits = mk('g', {opacity: 0}, hud), CRED = [['🎬 Mitwirkende', ''], ['Choreografie', 'Daijo'], ['Catering', 'Patrick'], ['Obst & Gemüse', 'Marco'], ['Sicherheit & Megafon', 'Jonas'],
    ['Hüftschwung', 'Simon'], ['Flitterwochen-Koordination', 'Greisel'], ['Musik', 'Batucada dos Gringos'], ['Stunts', 'die Pyramide'], ['', 'Kein Kaiman wurde verletzt.'], ['', 'Obrigado! 🇧🇷']];
  const credEls = CRED.map(([a, b2], k) => { const g = mk('g', {}, credits);
    const l = mk('text', {x: b2 && a ? W / 2 - 14 : W / 2, 'text-anchor': b2 && a ? 'end' : 'middle', class: k ? 'sb-credit' : 'sb-credit h'}, g); l.textContent = a || b2;
    if (a && b2) { const r = mk('text', {x: W / 2 + 14, 'text-anchor': 'start', class: 'sb-credit b'}, g); r.textContent = b2; } return g; });
  const stamp = mk('text', {x: W / 2, y: H / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'trip-stamp', opacity: 0, transform: `rotate(-10 ${W / 2} ${H / 2})`}, hud); stamp.textContent = 'CUT!';

  // ---------- Bewegung ----------
  function sambaLegs(b) {   // Samba-Grundschritt: abwechselnd ein Fuß hoch (Knie gebeugt), dazwischen federn beide Knie
    const f = ((b % 2) + 2) % 2, lift = x => x > 0 && x < .5 ? S(PI * x * 2) : 0, l = lift(f), r = lift(f - 1), dip = 4 * Math.abs(S(PI * b));
    return {lL: [16 * l, -48 * l], lR: [-16 * r, 48 * r], dip};
  }
  function basePose(style, b, t, i) {
    const sw = S(PI * b), up = Math.abs(sw), legs = sambaLegs(b);
    const p = {x: 0, y: -4 * up + legs.dip * .5, rot: 5 * sw, hip: 8 * sw, aL: [95 + 35 * sw, 40], aR: [95 - 35 * sw, 40], lL: legs.lL, lR: legs.lR, tilt: 6 * sw, look: 0, flip: 1};
    if (style === 'robot') { const q = Math.floor(b * 2) % 4, A = [[90, 90], [170, 0], [90, -90], [10, 0]][q], B = [[10, 0], [90, -90], [170, 0], [90, 90]][q];
      Object.assign(p, {y: -3 * up, rot: 0, hip: 0, aL: A, aR: B, tilt: [-10, 0, 10, 0][q], lL: [q === 1 ? 14 : 0, q === 1 ? -30 : 0], lR: [q === 3 ? -14 : 0, q === 3 ? 30 : 0]}); }
    else if (style === 'hips') Object.assign(p, {hip: 16 * sw, rot: 12 * sw, aL: [35, -100], aR: [160, 110], tilt: -8 * sw});
    else if (style === 'off') { const b2 = b * .83 + .37, s2 = S(PI * b2), l2 = sambaLegs(b2 * 1.3);
      Object.assign(p, {y: -9 * Math.abs(s2), rot: 9 * s2, hip: 9 * s2, aL: [90 + 70 * S(2.3 * b2), 60 * S(3.1 * b2)], aR: [90 + 70 * S(2.9 * b2 + 1), 60 * S(2.2 * b2)], tilt: 12 * S(1.7 * b2), lL: l2.lL, lR: l2.lR}); }
    else if (style === 'fruit') { const sh = S(4 * PI * b); Object.assign(p, {y: -5 * Math.abs(S(2 * PI * b)), aL: [150 + 18 * sh, 30], aR: [150 - 18 * sh, 30]}); }
    else if (style === 'propeller') { const r = (b * 180) % 360; Object.assign(p, {aL: [r, 0], aR: [(r + 180) % 360, 0], rot: 4 * sw}); }
    else if (style === 'star') { const sp = b % 8 > 7 ? C(PI * 2 * (b % 1)) : 1;
      Object.assign(p, {y: -9 * up, hip: 12 * sw, rot: 8 * sw, aL: [150 + 20 * sw, 30 + 20 * sw], aR: [150 - 20 * sw, 30 - 20 * sw], flip: sp}); }
    const lk = Math.floor(b / 4) % 3; if (lk === (i % 3)) p.look = i % 2 ? -1 : 1;   // ab und zu zum Nachbarn schauen
    return p;
  }
  const idle = (t, i) => ({x: 0, y: 0, rot: 0, hip: 0, aL: [12, 8], aR: [12, 8], lL: [0, 0], lR: [0, 0], tilt: 3 * S(t / 600 + i), look: 0, flip: 1});
  const mix = (a, b, k) => { const r = {}; for (const key in a) r[key] = Array.isArray(a[key]) ? a[key].map((v, j) => v + (b[key][j] - v) * k) : a[key] + (b[key] - a[key]) * k; return r; };
  function mouthOf(id, t, b, i) {
    for (const tp of TAPS) { if (tp.who !== id || t < tp.at || t > tp.at + tp.dur) continue;
      if (tp.kind === 'chicken') return t < tp.at + 900 ? .9 : 0;
      if (tp.kind === 'line') { const d = +(tp.env[Math.floor((t - tp.at) / 40)] || 0); return d >= 5 ? 1 : d >= 2 ? .55 : 0; } }
    if (EVENT === 'police' && t > evw()[0] + 1200 && t < evw()[0] + 2600) return 0;
    for (const l of LINES) { if (l.who !== id || t < l.at || t > l.at + l.dur) continue;
      const d = +(l.env[Math.floor((t - l.at) / 40)] || 0); return d >= 5 ? 1 : d >= 2 ? .55 : 0; }
    if (id === 'patrick' && t > T.munch[0] && t < T.munch[1]) return S(PI * (t - T.munch[0]) / 180) > 0 ? .8 : 0;   // mampf
    if ((t > T.conga[0] && t < T.conga[1]) || (t > T.pyr[0] + 2600 && t < T.close[0])) { const f = b % 1; return (Math.floor(b) + i) % 3 === 0 && f < .3 ? .45 : 0; }   // mitsingen
    if (t > T.b2[0] + 1200 && t < T.b2[0] + 2200 && id !== 'jonas') return .9;   // Schrei beim Pfeifen
    if (t > T.b3[0] + 1300 && t < T.b3[0] + 2100) return 1;                      // Schreck: Discokugel
    return 0;
  }
  const speaking = t => LINES.find(l => !l.chorus && l.who !== 'announcer' && t >= l.at && t <= l.at + l.dur + 300) || TAPS.find(tp => tp.kind === 'line' && t >= tp.at && t <= tp.at + tp.dur + 300);
  const PSC = .6, rowY = r => FLOOR - r * 205 * PSC, PYR = {jonas: [320, 0], patrick: [400, 0], marco: [480, 0], simon: [360, 1], greisel: [440, 1], dajo: [400, 2]};
  const POPS = [{who: 'patrick', w: T.munch, txt: '😋 *mampf*'}, {who: 'simon', w: T.wink, txt: '😉✨'}, {who: 'jonas', w: [58300, 59600], txt: '🍍?!'}];
  const duelWinner = () => { const c = LIVE.card || {}, s = (c.simon || {}).w || 0, g = (c.greisel || {}).w || 0; return s > g ? 'simon' : g > s ? 'greisel' : hash(Math.floor(Date.now() / 864e5), 3) > .5 ? 'simon' : 'greisel'; };   // Gleichstand: Tageslaune
  let cam = {x: 0, y: 0, w: W, h: H};
  // Fokus auf Sprecher: weich ein- (0,9 s vor dem Spruch) und ausblenden (1,2 s danach); überlappen sich zwei, wird zwischen ihnen geschwenkt
  const smooth = x => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  function focusK(l, t) { return smooth(span(t, l.at - 900, l.at + 150)) * (1 - smooth(span(t, l.at + l.dur + 100, l.at + l.dur + 1300))); }
  function focus(t) {   // {k: Stärke 0–1, x, y: Kopfposition (gewichtet), per: {id: k}}
    let sk = 0, mk2 = 0, x = 0, y = 0; const per = {};
    if (t < T.blo[0]) LINES.forEach(l => { if (l.chorus || l.who === 'announcer' || !P[l.who]) return; const k = focusK(l, t); if (k <= 0) return;
      const o = P[l.who]; per[l.who] = Math.max(per[l.who] || 0, k); sk += k; mk2 = Math.max(mk2, k); x += k * o.x; y += k * (o.y - 110 * o.sc); });
    return sk ? {k: mk2, x: x / sk, y: y / sk, per} : {k: 0, per};
  }
  let FOC = {k: 0, per: {}};
  function camAt(t, sp) {   // Kamera: zoomt weich auf den Sprecher, im Finale langsam zurück
    let z = 1, cx = W / 2, cy = H / 2;
    const f = focus(t); if (f.k > 0) { z = 1 + .3 * f.k; cx += (f.x - cx) * f.k; cy += (f.y - cy) * f.k; }
    const fin = smooth(span(t, T.pyr[0] + 1000, T.pyr[0] + 2200)) * (1 - smooth(span(t, T.pyr[0] + 2200, T.close[0])));
    if (fin > 0) { z = 1 + .3 * fin; cx = 400; cy = H / 2 - 40 * fin; }
    const w = W / z, h = H / z; return {x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h), w, h};
  }

  let BUBK = '', POPEL = [];
  let UI = 1;   // Schriftgröße der Einblendungen: auf schmalen Bildschirmen größer (Breite nur bei Größenänderung messen)
  const measure = () => { UI = clamp(560 / (svg.clientWidth || 800), 1, 1.9); BUBK = ''; };
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(svg); else addEventListener('resize', measure);
  function frame(t) {
    FOC = focus(t);
    const b = (t - MUSIC_AT - 30) / BEAT, blo = t > T.blo[0], dancing = (t > 2400 && t < T.close[0]) || (t > T.b2[0] && t < T.b3[1]), sp = speaking(t);
    const fz = win(t, T.freeze), conga = win(t, T.conga, 600), solo = win(t, T.solo, 600), pyr = span(t, T.pyr[0], T.pyr[0] + 1200) * (t < T.close[1] ? 1 : 0);
    const duel = win(t, T.duel, 500), costume = t > T.flash, b1 = t > T.b1[0] && t < T.b1[1];
    ids.forEach((id, i) => {
      const o = P[id]; let p = dancing ? basePose(o.L.style, b, t, i) : idle(t, i);
      if (fz > 0 && id !== 'patrick') p = mix(p, Object.assign(idle(t, i), {tilt: i < ids.indexOf('patrick') ? 14 : -14, look: i < ids.indexOf('patrick') ? 1 : -1}), fz);
      if (id === 'patrick' && t > T.munch[0] && t < T.munch[1]) p = mix(p, Object.assign({}, idle(t, i), {aR: [150, 150]}), win(t, T.munch, 150));
      let x = homeX(i), y = FLOOR - 62, sc = 1, flip = p.flip, fall = 0;
      // La Ola: einer nach dem anderen springt mit hochgerissenen Armen, hin und zurück
      [T.wave[0] + i * 160, T.wave[0] + 1100 + (N - 1 - i) * 160].forEach(w0 => { const k = span(t, w0, w0 + 420); if (k > 0 && k < 1) { const j = S(PI * k); p = mix(p, Object.assign({}, p, {aL: [175, 0], aR: [175, 0], lL: [10, -40], lR: [-10, 40]}), j); p.y -= 46 * j; } });
      const ch = win(t, T.chant, 300); if (ch > 0) { const pump = Math.floor(b) % 2 === i % 2; p = mix(p, Object.assign({}, p, {aL: pump ? [170, -20] : [60, 100], aR: pump ? [60, 100] : [170, -20], y: -10 * Math.abs(S(PI * b))}), ch); }
      if (conga > 0) { const ph = 2 * PI * (t - T.conga[0]) / 4200, o2 = 170 * S(ph), dir = C(ph) >= 0 ? 1 : -1, cx = 400 + o2 + (i - (N - 1) / 2) * 80;
        x += (cx - x) * ease(conga); p = mix(p, Object.assign({}, p, {aL: [70, 10], aR: [70, 10], rot: 4 * S(PI * b)}), conga); flip = conga > .5 ? dir : flip; }
      // Tanzschule: Moonwalk, Floss, Passinho, Limbo (Patrick bleibt unter der Stange hängen)
      const mvw = win(t, T.moves, 400);
      if (mvw > 0 && t < T.moves[0] + 4500) { const u = t - T.moves[0];
        if (u < 1500) { const ph = (t / 250) % 2 < 1; flip = 1; x -= 80 * ease(u / 1500) * mvw;
          p = mix(p, Object.assign({}, p, {lL: ph ? [0, 0] : [8, -34], lR: ph ? [-8, 34] : [0, 0], aL: [28, 40], aR: [28, 40], rot: -4, hip: 0, y: 0}), mvw); }
        else if (u < 3000) { const f = S(2 * PI * t / 500); p = mix(p, Object.assign({}, p, {aL: [40 + 38 * f, 10], aR: [40 - 38 * f, 10], hip: -14 * f, rot: 6 * f, lL: [0, 0], lR: [0, 0]}), Math.min(mvw, span(t, T.moves[0] + 1500, T.moves[0] + 1700))); }
        else { const kk = S(4 * PI * b); p = mix(p, Object.assign({}, p, {lL: [26 * Math.max(0, kk), -50 * Math.max(0, kk)], lR: [-26 * Math.max(0, -kk), 50 * Math.max(0, -kk)], aL: [100, 120], aR: [100, 120], y: -6 * Math.abs(kk), hip: 6 * kk}), Math.min(mvw, span(t, T.moves[0] + 3000, T.moves[0] + 3200))); } }
      if (t > T.moves[0] + 4500 && t < T.moves[1]) {
        const order = ids.filter(z => z !== 'patrick').concat(ids.includes('patrick') ? ['patrick'] : []), r = order.indexOf(id), s0 = T.moves[0] + 4900 + r * 380;
        const lineX = 60 + r * 48, endX = 520 + r * 44, e1 = ease(span(t, T.moves[0] + 4500, T.moves[0] + 4900)), back = ease(span(t, T.moves[1] - 900, T.moves[1] - 100));
        const stuckP = id === 'patrick';
        let lx = lineX + ((stuckP ? 372 : endX) - lineX) * span(t, s0, s0 + (stuckP ? 700 : 1100));
        lx = homeX(i) + (lx - homeX(i)) * e1; lx += (homeX(i) - lx) * back; x = lx;
        let lim = clamp(1 - Math.abs(x - 400) / 80, 0, 1) * (1 - back);
        if (stuckP && t > s0 + 700 && t < T.moves[1] - 900) lim = 1;
        p = Object.assign({}, p, {rot: -55 * lim + (stuckP && lim === 1 ? 8 * S(t / 80) : 0), hip: 0, lL: [30 * lim, -60 * lim], lR: [-30 * lim, 60 * lim],
          aL: stuckP && lim === 1 ? [150 + 20 * S(t / 90), 30] : [20 + 60 * (1 - lim), 10], aR: stuckP && lim === 1 ? [150 + 20 * S(t / 70), 30] : [20 + 60 * (1 - lim), 10], tilt: 0});
        y += 34 * lim; flip = 1; }
      if (solo > 0) { if (id === 'dajo') { x += (400 - x) * ease(solo); y += 30 * ease(solo); sc = 1 + .25 * ease(solo); }
        else { const k = i < ids.indexOf('dajo') ? i : i - 1, ang = PI * (k + .5) / (N - 1); x += (400 - 330 * C(ang) - x) * ease(solo); y -= 22 * S(ang) * ease(solo);
          const cl = S(2 * PI * b) > 0; p = mix(p, Object.assign({}, p, {aL: [65, cl ? 95 : 70], aR: [65, cl ? 95 : 70]}), solo); } }
      // Tanz-Duell: Simon links, Greisel rechts vorn, die anderen hinten am Rand
      if (duel > 0) { const e = ease(duel);
        if (id === 'simon' || id === 'greisel') { const left = id === 'simon', act = left ? win(t, T.duelS, 300) : win(t, T.duelG, 300);
          x += ((left ? 270 : 530) - x) * e; y += 24 * e;
          if (act > 0) p = mix(p, left ? Object.assign({}, p, {hip: 22 * S(PI * b), rot: 16 * S(PI * b), aL: [160, 120], aR: [40, -110]}) : Object.assign({}, p, {aL: [(b * 360) % 360, 0], aR: [(b * 360 + 180) % 360, 0], y: -18 * Math.abs(S(2 * PI * b))}), act);
          const won = t > T.verdict[0] && duelWinner() === id; if (won) { p.y -= 26 * Math.abs(S(2 * PI * b)); p.aL = [175, 0]; p.aR = [175, 0]; } }
        else { const k = ids.filter(z => z !== 'simon' && z !== 'greisel').indexOf(id); x += ([80, 160, 640, 720][k] - x) * e; y -= 18 * e; sc *= 1 - .12 * e; } }
      [T.spin[0] + 200, T.spin[0] + 700].forEach(j0 => { const k = span(t, j0, j0 + 450); if (k > 0 && k < 1) { p.y -= 60 * S(PI * k); flip = C(2 * PI * k); p.aL = [160, 20]; p.aR = [160, 20]; } });
      // Pyramide (auch in Panne 1, dort kracht sie zusammen)
      const pk = b1 ? 1 : pyr;
      if (pk > 0 && PYR[id]) { const [px, row] = PYR[id], e = b1 ? 1 : ease(pk), ty = rowY(row) - 62 * PSC, arc = row && !b1 ? -90 * S(PI * pk) : 0;
        x += (px - x) * e; y += (ty - y) * e + arc; sc += (PSC - sc) * e;
        p = mix(p, Object.assign({}, p, {aL: row === 2 ? [150, 20] : row ? [100, 10] : [160, 30], aR: row === 2 ? [150, 20] : row ? [100, 10] : [160, 30], lL: [0, 0], lR: [0, 0], hip: row ? 0 : p.hip * .5, rot: row ? 0 : p.rot * .5, y: row ? 0 : p.y}), e);
        if (b1) { const k = span(t, T.b1[0] + 1700, T.b1[0] + 2300); if (k > 0) { const row2 = row, fy = FLOOR - 26 * PSC - (y); y += fy * ease(k); fall = (i % 2 ? 1 : -1) * 85 * ease(k); x += (i - 2.5) * 22 * ease(k); }
          else if (t > T.b1[0] + 1100) p.rot = (id === 'patrick' ? 8 : 3) * S((t - T.b1[0]) / 60); } }
      // Panne 2: Jonas’ Megafon pfeift, alle halten sich die Ohren zu
      if (t > T.b2[0] && t < T.b2[1]) { if (id === 'jonas') { if (t > T.b2[0] + 700) p = Object.assign({}, p, {aR: [150, 150], rot: 0, hip: 0}); }
        else if (t > T.b2[0] + 1200) { p = Object.assign({}, p, {aL: [150, 155], aR: [150, 155], rot: 6 * S(t / 40), hip: 0}); flip = 1; } }
      // Panne 3: Discokugel fällt, alle springen vor Schreck
      if (t > T.b3[0] && t < T.b3[1]) { const k = span(t, T.b3[0] + 1300, T.b3[0] + 1800); if (k > 0) { p.y -= 70 * S(PI * k); p.aL = [175, 0]; p.aR = [175, 0]; } }
      const fk = duel ? 0 : FOC.per[id] || 0; if (fk > 0) { y += 26 * fk; sc *= 1 + .16 * fk; }
      // Live-Daten: wer heute am meisten getrunken hat, tanzt schief und mit rotem Kopf
      const tipsy = LIVE.tipsy === id && dancing;
      if (tipsy) { p.rot += 9 * S(t / 700); p.tilt += 14 * S(t / 530); x += 10 * S(t / 900); }
      // Antippen: Sprung, Drehung, Spruch oder Hähnchen-Panne
      TAPS.forEach(tp => { if (tp.who !== id) return; const k = (t - tp.at) / 650;
        if (tp.kind === 'jump' && k > 0 && k < 1) { p.y -= 60 * S(PI * k); p.aL = [170, 0]; p.aR = [170, 0]; }
        if (tp.kind === 'spin' && k > 0 && k < 1.2) flip = C(2 * PI * Math.min(1, k / 1.2)); });
      // Polizei: alle erstarren kurz; Publikum jubelt: kleiner Sprung
      const [e0, e1] = evw();
      if (EVENT === 'police' && t > e0 + 1200 && t < e0 + 2600) p = Object.assign(idle(t, i), {aL: [20, 10], aR: [20, 10], tilt: 10});
      const ck = (t - BOOST.cheer) / 800; if (ck > 0 && ck < 1) { p.y -= 45 * S(PI * ck); p.aL = [170, 0]; p.aR = [170, 0]; }
      const cl = (t - BOOST.clap) / 1600; if (cl > 0 && cl < 1) { const c = S(t / 75) > 0; p.aL = [60, c ? 100 : 70]; p.aR = [60, c ? 100 : 70]; }
      const drop = ENC ? -1e9 : 2000 + i * 160, dropY = t < drop ? -700 : t < drop + 520 ? -700 * Math.pow(1 - (t - drop) / 520, 2) * Math.abs(C(3 * PI * (t - drop) / 520)) : 0;
      const bob = dancing ? 2 * S(2 * PI * b) : 0, squash = dancing ? 1 - .035 * Math.abs(S(PI * b)) : 1;
      o.g.setAttribute('transform', `translate(${(x + p.hip).toFixed(1)},${(y + p.y).toFixed(1)}) rotate(${fall.toFixed(1)}) scale(${(sc * (flip || .001)).toFixed(3)},${sc.toFixed(3)})`);
      o.body.setAttribute('transform', `rotate(${p.rot.toFixed(1)})`);
      o.torso.setAttribute('transform', `translate(0,${(-50 * (1 - squash)).toFixed(1)}) rotate(${(-p.rot * .45).toFixed(1)},0,-20) scale(1,${squash.toFixed(3)})`);
      const wob = (-p.rot * 1.4 + 5 * S(2 * PI * b - .9)).toFixed(1);
      o.fan.setAttribute('transform', `rotate(${wob},0,-66)`); o.fan2.setAttribute('transform', `rotate(${wob},0,-80)`);
      const stolen = EVENT === 'monkey' && id === VICTIM && t > e0 + 1300 && t < T.close[1];
      o.fan.setAttribute('opacity', costume || stolen ? 0 : .95); o.fan2.setAttribute('opacity', costume && !stolen ? 1 : 0);
      o.shirt.setAttribute('fill', costume ? `url(#sb-seq-${id})` : (o.L.shirt || '#ffcf1f'));
      o.armL.a.setAttribute('transform', `translate(-17,${(-44 + bob).toFixed(1)}) rotate(${p.aL[0].toFixed(1)})`); o.armL.f.setAttribute('transform', `translate(0,24) rotate(${p.aL[1].toFixed(1)})`);
      o.armR.a.setAttribute('transform', `translate(17,${(-44 - bob).toFixed(1)}) rotate(${(-p.aR[0]).toFixed(1)})`); o.armR.f.setAttribute('transform', `translate(0,24) rotate(${(-p.aR[1]).toFixed(1)})`);
      o.legL.a.setAttribute('transform', `translate(-9,2) rotate(${p.lL[0].toFixed(1)})`); o.legL.f.setAttribute('transform', `translate(0,30) rotate(${p.lL[1].toFixed(1)})`);
      o.legR.a.setAttribute('transform', `translate(9,2) rotate(${p.lR[0].toFixed(1)})`); o.legR.f.setAttribute('transform', `translate(0,30) rotate(${p.lR[1].toFixed(1)})`);
      o.head.setAttribute('transform', `translate(${(4 * p.look).toFixed(1)},${(-96 + dropY).toFixed(1)}) rotate(${(p.tilt + 9 * p.look).toFixed(1)})`);
      const m = mouthOf(id, t, b, i), h = R * .55 * m;
      o.upper.setAttribute('transform', `translate(0,${(-h).toFixed(1)}) rotate(${(-6 * m).toFixed(1)},${(-o.c).toFixed(1)},${o.mY.toFixed(1)})`);
      o.mouth.setAttribute('cy', (o.mY - h / 2).toFixed(1)); o.mouth.setAttribute('ry', Math.max(.1, h / 2 + 1.5).toFixed(1));
      o.tongue.setAttribute('cy', (o.mY - 3).toFixed(1)); o.tongue.setAttribute('ry', Math.max(.1, h * .28).toFixed(1));
      // Augenbrauen: beim Sprechen/Singen hoch, beim Staunen (Freeze, Schreck) ganz hoch
      const surprised = (fz > .5 && id !== 'patrick') || (t > T.b3[0] + 1300 && t < T.b3[0] + 2600) || (t > T.b2[0] + 1200 && t < T.b2[1]);
      const lift = surprised ? 9 : m > 0 ? 4 + 3 * m : 0;
      o.brows.forEach(q => q.g.setAttribute('transform', `translate(0,${(-lift).toFixed(1)}) rotate(${(surprised ? -q.sx * 8 : 0)},${q.x},${q.y})`));
      // Schweiß nach den schnellen Teilen
      const sweaty = (t > T.wave[1] && t < T.wave[1] + 1600) || (t > T.spin[1] && t < T.spin[1] + 1400) || (t > T.verdict[0] && t < T.verdict[1] && id !== duelWinner() && (id === 'simon' || id === 'greisel'));
      o.sweat.forEach((d, k) => { const ph = ((t / 700 + k / 3 + i * .17) % 1); d.setAttribute('opacity', sweaty ? (1 - ph).toFixed(2) : 0);
        d.setAttribute('transform', `translate(${((k - 1) * 30 + (k === 1 ? 44 : 0)).toFixed(0)},${(-R * .6 + ph * 40).toFixed(1)})`); });
      o.tint.forEach(e => e.setAttribute('opacity', tipsy ? .32 : 0));
      if (o.prop && id === 'marco') o.prop.setAttribute('opacity', t > T.fruit[0] && t < T.close[1] ? 0 : 1);
      const chk = TAPS.find(tp => tp.kind === 'chicken' && tp.who === id && t > tp.at && t < tp.at + 2600);
      if (o.prop && id === 'patrick') o.prop.setAttribute('opacity', chk ? 0 : 1);
      if (chk) { const k = clamp((t - chk.at) / 700, 0, 1), hx = x + p.hip + 26 * sc, hy0 = y + p.y - 10 * sc, fy = hy0 + (FLOOR - 6 - hy0) * k * k - (k >= 1 ? 8 * Math.abs(S((t - chk.at - 700) / 90)) * Math.max(0, 1 - (t - chk.at - 700) / 500) : 0);
        chick.setAttribute('x', hx.toFixed(1)); chick.setAttribute('y', fy.toFixed(1)); chick.setAttribute('opacity', 1); }
      // Kellner verteilt Caipis: wer erreicht ist, hält ab jetzt eine 🍹
      if (EVENT === 'waiter' && o.prop) { const wx = -80 + 960 * span(t, e0, e1); if (t > e0 && wx > x && !o.gotDrink) { o.gotDrink = t; } o.prop.textContent = o.gotDrink && t >= o.gotDrink && t < T.close[1] ? '🍹' : PROPS[id]; }
      umbr[i].setAttribute('opacity', EVENT === 'rain' ? win(t, [e0 + 500, e1], 300).toFixed(2) : 0); umbr[i].setAttribute('x', (x + p.hip + 30 * sc).toFixed(1)); umbr[i].setAttribute('y', (y + p.y - 165 * sc).toFixed(1));
      // Schatten: kleiner und blasser, je höher die Figur über dem Boden ist
      const feet = y + p.y + 62 * sc, air = clamp((FLOOR - feet) / 160, 0, 1);
      o.shadow.setAttribute('cx', (x + p.hip).toFixed(1)); o.shadow.setAttribute('rx', (34 * sc * (1 - .5 * air)).toFixed(1)); o.shadow.setAttribute('opacity', (1 - air).toFixed(2));
      o.x = x + p.hip; o.y = y + p.y; o.sc = sc;
    });
    // Live-Daten: Krone (meiste Siege) und Narrenkappe (meiste letzte Plätze)
    ids.forEach(id => { const o = P[id], k = LIVE.crown === id ? '👑' : LIVE.jester === id ? '🤡' : ''; if (o.hatK !== k) { o.hat.innerHTML = ''; if (k) { const tx = mk('text', {y: -R - 2, 'text-anchor': 'middle', 'font-size': 34}, o.hat); tx.textContent = k; } o.hatK = k; }
      o.hat.setAttribute('opacity', k && t > 2600 ? 1 : 0); });
    // Reihenfolge: Pyramide unten zuerst, sonst Sprecher/Solist vorn
    if (!TAPS.some(tp => tp.kind === 'chicken' && t > tp.at && t < tp.at + 2600)) chick.setAttribute('opacity', 0);
    const lmb = win(t, [T.moves[0] + 4400, T.moves[1] - 300], 300), stuck = t > T.moves[0] + 4900 + 5 * 380 + 700 && t < T.moves[1] - 900;
    limbo.setAttribute('opacity', lmb.toFixed(2)); limboBar.setAttribute('transform', stuck ? `rotate(${(5 * S(t / 60)).toFixed(1)},400,${FLOOR - 100})` : '');
    // Ereignisse
    const [e0, e1] = evw();
    const rk = EVENT === 'rain' ? win(t, [e0, e1], 500) : 0;
    clouds.setAttribute('opacity', rk.toFixed(2)); clouds.setAttribute('transform', `translate(${(-60 * (1 - rk)).toFixed(1)},0)`); drops.setAttribute('opacity', (rk * .7).toFixed(2));
    if (rk > 0) dropEls.forEach((d, k) => { const x = hash(k, 41) * (W + 60), yy = ((t * .9 + hash(k, 42) * 520) % 520) - 20; d.setAttribute('transform', `translate(${x.toFixed(1)},${yy.toFixed(1)})`); });
    if (EVENT === 'monkey' && t > e0 && t < e1 + 400) { const v = P[VICTIM], k1 = span(t, e0, e0 + 1300), k2 = span(t, e0 + 1500, e0 + 2900);
      const mx = k2 > 0 ? v.x + (-120 - v.x) * k2 : 880 + (v.x + 30 - 880) * k1, my = FLOOR - 20 - Math.abs(S(t / 120)) * 22 - (k1 >= 1 && k2 === 0 ? 60 : 0);
      monkey.setAttribute('x', mx.toFixed(1)); monkey.setAttribute('y', my.toFixed(1)); monkey.setAttribute('opacity', 1); monkey.setAttribute('transform', `scale(${k2 > 0 ? -1 : 1},1)`); if (k2 > 0) monkey.setAttribute('x', (-mx).toFixed(1));
      feather.setAttribute('opacity', k2 > 0 ? 1 : 0); feather.setAttribute('x', (mx + 10).toFixed(1)); feather.setAttribute('y', (my - 40).toFixed(1));
    } else { monkey.setAttribute('opacity', 0); feather.setAttribute('opacity', 0); }
    if (EVENT === 'police' && t > e0 && t < e1 + 600) { const kin = span(t, e0, e0 + 1200), kout = span(t, e0 + 3400, e1 + 600), cx = -80 + 480 * ease(kin) + 560 * ease(kout);
      const dance = t > e0 + 2600 ? Math.abs(S(PI * (t - MUSIC_AT) / BEAT)) * 16 : 0; cop.setAttribute('x', cx.toFixed(1)); cop.setAttribute('y', (FLOOR - 10 - dance).toFixed(1)); cop.setAttribute('opacity', 1);
      cop.setAttribute('transform', t > e0 + 2600 ? `rotate(${(10 * S(t / 160)).toFixed(1)},${cx.toFixed(1)},${(FLOOR - 40).toFixed(1)})` : '');
    } else cop.setAttribute('opacity', 0);
    if (EVENT === 'waiter' && t > e0 && t < e1) { const wx = -80 + 960 * span(t, e0, e1), wy = FLOOR - 4 - Math.abs(S(t / 140)) * 4;
      waiter.setAttribute('x', wx.toFixed(1)); waiter.setAttribute('y', wy.toFixed(1)); waiter.setAttribute('opacity', 1); tray.setAttribute('x', (wx + 22).toFixed(1)); tray.setAttribute('y', (wy - 62).toFixed(1)); tray.setAttribute('opacity', 1);
    } else { waiter.setAttribute('opacity', 0); tray.setAttribute('opacity', 0); }
    sceneTick(t);
    // Klatschen/Jubeln: 👏 bzw. 🎉🙌✨ steigen aus dem Publikum auf
    PRESS.forEach((q, n) => { const k = (t - q.t) / 1500;
      if (k < 0 || k > 1) { if (q.els) { q.els.forEach(e => e.remove()); q.els = null; } return; }
      const em = q.k === 'clap' ? ['👏'] : ['🎉', '🙌', '✨', '🥳'];
      if (!q.els) q.els = Array.from({length: q.k === 'clap' ? 12 : 18}, (_, m) => { const e = mk('text', {'text-anchor': 'middle'}, partG); e.textContent = em[m % em.length]; return e; });
      q.els.forEach((e, m) => { const x0 = 30 + hash(m, 51 + n) * (W - 60), sp2 = .6 + hash(m, 52 + n) * .7;
        e.setAttribute('x', (x0 + 25 * S(k * 6 + m)).toFixed(1)); e.setAttribute('y', (H - 20 - k * 330 * sp2).toFixed(1)); e.setAttribute('font-size', ((q.k === 'clap' ? 30 : 34) * (1 - .3 * k)).toFixed(1)); e.setAttribute('opacity', (1 - k).toFixed(2)); }); });
    const front = sp ? sp.who : solo > .5 ? 'dajo' : null;
    if (pyr > 0 || b1) ['jonas', 'patrick', 'marco', 'simon', 'greisel', 'dajo'].forEach(id => P[id] && gPeople.appendChild(P[id].g));
    else if (front && P[front] && gPeople.lastChild !== P[front].g) gPeople.appendChild(P[front].g);
    // Spotlight
    const ff = focus(t), tgt = ff.k > 0 ? {x: ff.x} : solo > 0 ? P.dajo : null;   // Spotlight blendet mit dem Fokus weich ein und aus
    spot.setAttribute('opacity', tgt ? (ff.k > 0 ? ff.k : solo).toFixed(2) : 0);
    if (tgt) { cone.setAttribute('d', `M${tgt.x - 30},0 L${tgt.x + 30},0 L${tgt.x + 80},${FLOOR + 8} L${tgt.x - 80},${FLOOR + 8}Z`); pool.setAttribute('cx', tgt.x); pool.setAttribute('cy', FLOOR + 6); }
    // Ananas fliegt von Marco auf Jonas’ Kopf und bleibt bis zum Vorhang dort
    const mj = P.marco, jo = P.jonas;
    if (mj && jo && t > T.fruit[0] && t < T.close[1]) { const k = span(t, T.fruit[0], T.fruit[1]), sx = mj.x + 20 * mj.sc, sy = mj.y - 70 * mj.sc, ex = jo.x, ey = jo.y - 150 * jo.sc;
      const fx = sx + (ex - sx) * k, fy = sy + (ey - sy) * k - 200 * S(PI * k); hat.setAttribute('x', fx.toFixed(1)); hat.setAttribute('y', fy.toFixed(1));
      hat.setAttribute('font-size', (34 * (k < 1 ? 1 : jo.sc)).toFixed(1)); hat.setAttribute('transform', `rotate(${k < 1 ? (k * 720).toFixed(0) : 0},${fx.toFixed(1)},${fy.toFixed(1)})`); hat.setAttribute('opacity', 1);
    } else hat.setAttribute('opacity', 0);
    // Sprechblasen, Einblendungen, Applaus-Meter
    const bubs = [];   // erst sammeln, dann mit dem Bestand vergleichen
    const bubble = (o, text) => { bubs.push({o, text}); };
    const bubbleBuild = (o, text) => { const words = text.split(' '), rows = [''], mx = Math.min(24, Math.floor((W - 60) / (8.6 * UI))); words.forEach(w => { if ((rows[rows.length - 1] + ' ' + w).length > mx) rows.push(w); else rows[rows.length - 1] = (rows[rows.length - 1] + ' ' + w).trim(); });
      const bw = Math.max(...rows.map(r => r.length)) * 8.6 * UI + 26, bh = rows.length * 20 * UI + 14, bx = clamp(o.x - bw / 2, 8, W - bw - 8), by = clamp(o.y - 150 * o.sc - bh, 8, H);
      const g = mk('g', {class: 'sb-bub'}, gBub); g.__o = {bx, by, x: o.x, y: o.y}; mk('rect', {x: bx, y: by, width: bw, height: bh, rx: 12}, g);
      mk('path', {d: `M${clamp(o.x - 8, bx + 12, bx + bw - 24)},${by + bh - 1} l14,0 l-6,14Z`}, g);
      rows.forEach((r, k) => { const tx = mk('text', {x: bx + bw / 2, y: by + 7 + 19 * UI + k * 20 * UI, 'text-anchor': 'middle', style: `font-size:${(16 * UI).toFixed(1)}px`}, g); tx.textContent = r; }); return g; };
    if (sp && sp.text && t > sp.at && P[sp.who]) bubble(P[sp.who], sp.text);
    const evPops = EVENT === 'rain' ? [{who: 'jonas', w: [e0 + 600, e0 + 2400], txt: 'Typisch Tropen! ☔'}] : EVENT === 'monkey' ? [{who: VICTIM, w: [e0 + 1500, e0 + 3200], txt: 'Hey! Mein Hut! 😠'}] :
      EVENT === 'waiter' ? [{who: 'patrick', w: [e0 + 1200, e0 + 2600], txt: 'Obrigado! 🍹'}] : [];
    const copPop = EVENT === 'police' ? (t > e0 + 1200 && t < e0 + 2500 ? 'Documentos, por favor! 👮' : t > e0 + 2600 && t < e0 + 3600 ? 'Tá bom! 🕺' : '') : '';
    const pops = []; if (copPop) pops.push({x: +cop.getAttribute('x'), y: FLOOR - 95, txt: copPop, op: 1, mid: true});
    const st0 = T.moves[0] + 4900 + 5 * 380 + 700;
    if (P.patrick) evPops.push({who: 'patrick', w: [st0, T.moves[1] - 900], txt: 'Ich stecke fest! 😩'});
    if (P.jonas) evPops.push({who: 'jonas', w: [st0 + 500, T.moves[1] - 900], txt: '😂'});
    TAPS.forEach(tp => { if (tp.kind === 'chicken' && t > tp.at && t < tp.at + 1800) evPops.push({who: tp.who, w: [tp.at, tp.at + 1800], txt: 'Mein Hähnchen! 😱'}); });
    POPS.concat(evPops).forEach(q => { const k = win(t, q.w, 200), o = P[q.who]; if (k > 0 && o) pops.push({x: o.x + 42 * o.sc, y: o.y - 150 * o.sc - 10 * k, txt: q.txt, op: k}); });
    if (t > T.verdict[0] && t < T.verdict[1] && P[duelWinner()]) bubble(P[duelWinner()], '🏆 ' + byId[duelWinner()].name + ' gewinnt das Duell!');
    // Sprechblasen/Einblendungen: Bestand nur bei neuem Text neu aufbauen, sonst per transform mitführen
    const key = bubs.map(q => q.text).join('|') + '#' + pops.map(q => q.txt).join('|') + '#' + UI;
    if (key !== BUBK) { gBub.innerHTML = ''; BUBK = key; bubs.forEach(q => { q.g = bubbleBuild(q.o, q.text); });
      POPEL = pops.map(q => { const tx = mk('text', {class: 'sb-pop', 'text-anchor': q.mid ? 'middle' : 'start', style: `font-size:${(24 * UI).toFixed(1)}px`}, gBub); tx.textContent = q.txt; return tx; }); }
    [...gBub.querySelectorAll('.sb-bub')].forEach((g, n) => { const q = bubs[n]; if (!q || !g.__o) return; const dx = clamp(q.o.x, 0, W) - g.__o.x, dy = q.o.y - g.__o.y;
      const nbx = clamp(g.__o.bx + dx, 8, W - 8 - (+g.firstChild.getAttribute('width'))); g.setAttribute('transform', `translate(${(nbx - g.__o.bx).toFixed(1)},${dy.toFixed(1)})`); });
    POPEL.forEach((e, n) => { const q = pops[n]; if (!q) return; e.setAttribute('x', q.x.toFixed(1)); e.setAttribute('y', q.y.toFixed(1)); e.setAttribute('opacity', q.op.toFixed(2)); });
    meter.setAttribute('opacity', duel.toFixed(2));
    const wnr = duelWinner(); meterBars.forEach((bar, k) => { const id = k ? 'greisel' : 'simon', w = k ? T.duelG : T.duelS, f = span(t, w[0], w[1]) * (id === wnr ? 1 : .78);
      bar.setAttribute('width', (296 * f * (1 + .03 * S(t / 90))).toFixed(1)); });
    // Licht: Lichterkette, Scheinwerfer, Discokugel (fällt in Panne 3), Nebel, Publikum, Konfetti, Blitz beim Kostümwechsel
    const on = Math.floor(b) % 2, party = t - BOOST.cheer < 1800 && t > BOOST.cheer; bulbs.forEach((q, k) => q.setAttribute('opacity', party ? (Math.floor(t / 90) + k) % 2 ? .3 : 1 : t > MUSIC_AT && (k + on) % 2 ? .45 : 1));
    const lit = span(t, 2200, 3000) * (1 - span(t, T.close[0], T.close[0] + 800)) + (blo ? span(t, T.b1[0] - 600, T.b1[0]) * (1 - span(t, T.close2[0], T.close2[0] + 600)) : 0);
    const chk2 = clamp(1 - (t - BOOST.cheer) / 1800, 0, 1) * (t > BOOST.cheer ? 1 : 0);
    beams.setAttribute('opacity', Math.min(1, lit * (.55 + .45 * Math.abs(S(PI * b))) + chk2).toFixed(2));
    beamEls.forEach((q, k) => q.el.setAttribute('transform', `translate(${q.x},-10) rotate(${(28 * S(t / 1300 + k * 2.1)).toFixed(1)})`));
    let bd = ease(span(t, T.wave[0] - 800, T.wave[0] + 400)) * (1 - ease(span(t, T.close[0], T.close[0] + 900)));
    let by = -40 + 80 * bd, broken = false;
    if (t > T.b3[0] && t < T.close2[1]) { bd = 1; const k = span(t, T.b3[0] + 800, T.b3[0] + 1300); by = 40 + (FLOOR - 30 - 40) * k * k; broken = k >= 1; }
    ball.setAttribute('opacity', bd > 0 ? 1 : 0); ballLine.setAttribute('opacity', t > T.b3[0] + 800 && t < T.close2[1] ? 0 : 1); ballLine.setAttribute('y2', by - 24);
    ballG.setAttribute('transform', `translate(400,${by.toFixed(1)}) scale(${broken ? '1.3,.45' : 1})`);
    ballV.forEach((e, k) => { const a = ((t / 900 + k / 5) % 1) * PI; e.setAttribute('rx', (24 * Math.abs(C(a))).toFixed(1)); });
    dots.setAttribute('opacity', (bd * .8 * (broken ? 0 : 1)).toFixed(2));
    dotEls.forEach((d, k) => { const a = t / 2400 + hash(k, 3) * 6.3, rr = 160 + hash(k, 4) * 260; d.setAttribute('cx', (400 + rr * C(a) * 1.4).toFixed(1)); d.setAttribute('cy', (90 + Math.abs(rr * S(a)) * .9).toFixed(1)); });
    fog.setAttribute('opacity', (.35 * lit + .1).toFixed(2));
    fogEls.forEach((f, k) => f.setAttribute('cx', (((k * 140 + t * (.012 + k * .003)) % 1060) - 130).toFixed(1)));
    const clapNow = t > BOOST.clap && t < BOOST.clap + 1800, cheer = t - BOOST.cheer < 1800 && t > BOOST.cheer || [[1700, 4200], [16700, 17300], T.chant, [48400, 48800], [T.verdict[0], T.verdict[1]], [T.pyr[0] + 1200, T.close[1]], [T.confetti, T.close[1]]].some(w => t > w[0] && t < w[1]) || (t > T.duel[0] && S(t / 300) > .3 && t < T.duel[1]);
    fans.forEach(q => { const jump = cheer ? Math.abs(S(PI * b + q.ph)) * 8 : Math.abs(S(PI * b + q.ph)) * 2.5;
      q.g.setAttribute('transform', `translate(${q.x.toFixed(1)},${(q.y - jump).toFixed(1)})`);
      if (clapNow) { const c = S(t / 70 + q.ph) > 0 ? 4 : 14; q.armL.setAttribute('x2', -c); q.armL.setAttribute('y2', -14); q.armR.setAttribute('x2', c); q.armR.setAttribute('y2', -14); return; }
      const up = cheer ? 1 : 0, wv = S(2 * PI * b + q.ph) * 6;
      q.armL.setAttribute('x2', up ? -22 + wv : -18); q.armL.setAttribute('y2', up ? -26 : 22); q.armR.setAttribute('x2', up ? 22 + wv : 18); q.armR.setAttribute('y2', up ? -26 : 22); });
    const cOn = t > T.confetti && t < T.close[1]; conf.setAttribute('opacity', cOn ? 1 : 0);
    if (cOn) confs.forEach(q => { const k = (t - T.confetti) / 1000, yy = ((k * q.d + q.s * 40) % 560) - 40; q.el.setAttribute('transform', `translate(${(q.x + 18 * S(k * 3 + q.s)).toFixed(1)},${yy.toFixed(1)}) rotate(${((k * 200 + q.s * 50) % 360).toFixed(0)})`); });
    const chf = t > BOOST.cheer && t < BOOST.cheer + 400 ? .3 * (1 - (t - BOOST.cheer) / 400) : 0;
    flash.setAttribute('opacity', Math.max(chf, (1 - span(t, T.flash, T.flash + 500)) * (t > T.flash ? 1 : 0)).toFixed(2));
    // Kamera
    cam = camAt(t, sp); world.setAttribute('transform', `scale(${(W / cam.w).toFixed(4)}) translate(${(-cam.x).toFixed(1)},${(-cam.y).toFixed(1)})`);
    // Vorhang: auf (0,3–1,7 s), zu, für die Pannen kurz wieder auf
    const open = Math.max(ease(span(t, 300, 1700)) * (1 - ease(span(t, T.close[0], T.close[1]))), ease(span(t, T.b1[0] - 700, T.b1[0] - 100)) * (1 - ease(span(t, T.close2[0], T.close2[1])))), cw = (W / 2 + 30) * open;
    curtL.setAttribute('x', (-cw).toFixed(1)); curtR.setAttribute('x', (W / 2 - 30 + cw).toFixed(1));
    const tShow = (1 - span(t, 1700, 2600)) + span(t, T.close[1] - 600, T.close[1]) * (1 - span(t, T.b1[0] - 900, T.b1[0] - 500)) + span(t, T.close2[1] - 400, T.close2[1]);
    const cw2 = win(t, T.credits, 600); title.setAttribute('opacity', (clamp(tShow, 0, 1) * (1 - cw2)).toFixed(2));
    credits.setAttribute('opacity', cw2.toFixed(2));
    if (cw2 > 0) credEls.forEach((g, k) => g.setAttribute('transform', `translate(0,${(H + 30 + k * 46 - (t - T.credits[0]) * .075).toFixed(1)})`));
    tt.textContent = ENC ? '🎉 Zugabe!' : t > T.close[1] - 700 && t < T.b1[0] ? '🎬 Pannen vom Dreh' : '💃 ' + (D.title || 'Samba-Show');
    ts.textContent = t > T.close2[1] - 500 ? 'Obrigado! 👏' : t > T.close[0] && t < T.close[1] ? 'Obrigado! 👏' : t > T.close[1] && !ENC ? 'gleich geht’s weiter …' : t < 50 && !document.getElementById('samba-big') ? (encoreReady ? '🎉 Zugabe? Antippen!' : '▶ Antippen zum Starten') : '';   // mit großem Start-Knopf keine Doppelung
    // Ansage (Untertitel) und Filmklappen der Pannen
    loc.textContent = STAGES[STAGE].label ? '📍 Live aus ' + STAGES[STAGE].label : ''; loc.setAttribute('opacity', STAGES[STAGE].label && t > 1700 ? 1 : 0);
    const ann = LINES.find(l => l.who === 'announcer'), annOn = ann && t > ann.at && t < ann.at + ann.dur + 400;
    const klap = [[T.b1, 'Klappe, die 12. – Pyramide'], [T.b2, 'Klappe, die 31. – Ansage'], [T.b3, 'Klappe, die 47. – Discokugel']].find(([w]) => t > w[0] && t < w[1]);
    const mvU = t - T.moves[0], mvName = t > T.moves[0] && t < T.moves[1] ? (mvU < 1500 ? '🕺 Tanzschule: Moonwalk' : mvU < 3000 ? '🕺 Tanzschule: Floss' : mvU < 4500 ? '🕺 Tanzschule: Passinho' : '🕺 Tanzschule: Limbo') : '';
    cap.setAttribute('opacity', annOn || klap || mvName ? 1 : 0); capT.textContent = annOn ? ann.text : klap ? '🎬 ' + klap[1] : mvName;
    if (capT.__fs !== UI) { capT.__fs = UI; capT.style.fontSize = (18 * UI).toFixed(1) + 'px'; } capR.setAttribute('height', (40 * UI).toFixed(1)); capR.setAttribute('y', 18); capT.setAttribute('y', (18 + 27 * UI).toFixed(1));
    const cut = [[T.b1[0] + 2600, T.b1[1]], [T.b2[0] + 2400, T.b2[1]], [T.b3[0] + 2200, T.b3[1]]].some(w => t > w[0] && t < w[1]); stamp.setAttribute('opacity', cut ? 1 : 0);
  }

  // ---------- Ton: Show-Samba, Effekte, Stimmen ----------
  function eventSfx(m, at) {
    const [e0] = evw();
    if (EVENT === 'rain') m.sfx('rain', at(e0));
    if (EVENT === 'monkey') { m.sfx('monkey', at(e0 + 1300)); m.sfx('monkey', at(e0 + 2000)); }
    if (EVENT === 'police') { m.sfx('whistle', at(e0 + 1100)); m.music.gain.setTargetAtTime(.1, at(e0 + 1250), .05); m.music.gain.setTargetAtTime(1, at(e0 + 2600), .1); m.sfx('whoo', at(e0 + 2700)); }
    if (EVENT === 'waiter') [800, 1600, 2400, 3200].forEach(o => m.sfx('ding', at(e0 + o)));
  }
  function program(m, t0) {   // alles relativ zu t0 (Sekunden im AudioContext)
    const at = ms => t0 + ms * SLOW / 1000; m.slow = SLOW;
    eventSfx(m, at);
    if (ENC) { m.setMode('show', at(MUSIC_AT)); m.step = 0; m.next = at(MUSIC_AT) + .03; m.drums = [[at(T.chant[0]), at(T.chant[1])]];
      m.sfx('applause', at(600)); m.sfx('whoo', at(900)); m.sfx('whoo', at(T.wave[0] + 300)); m.sfx('whoo', at(T.spin[0] + 300));
      m.sfx('boom', at(T.confetti - 400)); m.sfx('boom', at(T.confetti + 400)); m.sfx('applause', at(T.confetti)); m.end(at(T.close[1])); return; }
    m.setMode('show', at(MUSIC_AT)); m.step = 0; m.next = at(MUSIC_AT) + .03;   // Takt 1 genau zum Tanzbeginn
    m.drums = [[at(T.chant[0]), at(T.chant[1])], [at(T.close[0] + 400), at(T.b2[0])], [at(T.b3[1]), at(T.close2[1])]];
    m.sfx('applause', at(1700)); m.sfx('whoo', at(2000)); ids.forEach((id, i) => m.sfx('boing', at(2000 + i * 160 + 400)));
    const g = m.music.gain; m.sfx('scratch', at(T.freeze[0])); g.setTargetAtTime(.12, at(T.freeze[0] + 200), .05); g.setTargetAtTime(1, at(T.freeze[1] - 100), .1);
    m.sfx('munch', at(T.munch[0] + 100)); m.sfx('whoo', at(T.wave[0] + 300)); m.sfx('flash', at(T.flash)); m.sfx('ding', at(T.wink[0]));
    m.sfx('applause', at(T.solo[1] - 200)); m.sfx('applause', at(T.duelS[1] - 300)); m.sfx('applause', at(T.duelG[1] - 300)); m.sfx('whoo', at(T.verdict[0])); m.sfx('applause', at(T.verdict[0] + 200));
    m.sfx('whoo', at(T.spin[0] + 300)); m.sfx('boing', at(T.fruit[1]));
    m.sfx('boom', at(T.confetti - 400)); m.sfx('boom', at(T.confetti + 400)); m.sfx('applause', at(T.confetti)); m.sfx('whoo', at(T.confetti + 200)); m.sfx('applause', at(T.pyr[1] - 1500));
    // Pannen: Musik leise, Klappe, Effekt, Plattenkratzer + Lacher beim CUT
    [[T.b1, 2600], [T.b2, 2400], [T.b3, 2200]].forEach(([w, c]) => { m.sfx('clap', at(w[0] + 100)); m.sfx('scratch', at(w[0] + c)); m.sfx('laugh', at(w[0] + c + 250)); });
    m.sfx('thud', at(T.b1[0] + 2200)); m.sfx('crash', at(T.b1[0] + 2250)); m.sfx('feedback', at(T.b2[0] + 1100)); m.sfx('crash', at(T.b3[0] + 1300));
    const st0 = T.moves[0] + 4900 + 5 * 380 + 700; m.sfx('thud', at(st0)); m.sfx('boing', at(st0 + 150)); m.sfx('whoo', at(T.moves[0] + 300)); m.sfx('boing', at(T.moves[1] - 800));
    m.sfx('applause', at(T.credits[0])); m.end(at(T.credits[1]));
  }
  const SLOW = 1 / .9;   // ganze Show ca. 10 % langsamer: Showzeit = echte Zeit / SLOW (Stimmen-MP3s sind entsprechend gedehnt)
  const SPD = () => window.__danceT !== undefined ? 1 : SLOW;
  let run = 0, raf = 0, ctx = null, timer = 0, voices = [], t0p = 0, base = 0, vGain = null, STATE = 'idle', pausedAt = 0, startedAt = 0;   // STATE: idle | run | pause
  const RAW = {}, ABUF = {};
  function prefetch(keys) { keys.forEach(k => { if (!RAW[k]) RAW[k] = fetch('audio/samba-' + k + '.mp3').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null); }); }
  const allKeys = () => [...new Set(D.lines.flatMap(l => [l.src || (l.nogen ? l.src0 : l.key)].concat((l.alts || []).map(v => v.key))).filter(Boolean))];
  async function bufOf(key) {
    if (ABUF[key]) return ABUF[key]; prefetch([key]); const raw = await RAW[key]; if (!raw || !ctx) return null;
    try { ABUF[key] = await ctx.decodeAudioData(raw.slice(0)); } catch (e) { return null; } return ABUF[key];
  }
  function playVoice(key, whenMs, my) {   // whenMs = Showzeit; Start über die Audio-Uhr, notfalls mit Versatz in die Aufnahme hinein
    bufOf(key).then(bf => { if (my !== run || !ctx) return;
      if (!bf) { const el = new Audio('audio/samba-' + key + '.mp3'); el.play().catch(() => {}); voices.push({el}); return; }
      const src = ctx.createBufferSource(); src.buffer = bf; src.connect(vGain); const w = base + whenMs * SLOW / 1000, now = ctx.currentTime;
      if (w >= now) src.start(w); else if (now - w < bf.duration - .05) src.start(now, now - w); else return; voices.push({src}); });
  }
  const clock = () => STATE === 'pause' ? pausedAt : ctx && window.__danceT === undefined ? (ctx.currentTime - (ctx.outputLatency || 0) - base) * 1000 / SLOW : (tnow() - t0p) / SPD();
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { prefetch(allKeys()); io.disconnect(); } }, {rootMargin: '400px'}); io.observe(svg); }
  function stop(reset) {
    run++; cancelAnimationFrame(raf); clearInterval(timer); voices.forEach(a => { if (a.el) a.el.pause(); if (a.src) try { a.src.stop(); } catch (e) {} if (a.to) clearTimeout(a.to); }); voices = [];
    if (ctx) { ctx.close().catch(() => {}); ctx = null; }
    STATE = 'idle'; paint(); liveM = null; aud.forEach(b => b.classList.add('off'));
    if (reset) { ENC = false; T = TMAIN; END = END_MAIN; TAPS = []; frame(0); }
  }
  function liveData() {   // aus den anderen Modulen (Drinks, Karten): Krone, Narrenkappe, wer heute am meisten getrunken hat
    const c = MEHUB.card || {}, d = MEHUB.drinks || {}, best = (o, f, min) => { let id = null, v = min; for (const k in o) if (f(o[k]) > v) { v = f(o[k]); id = k; } return id; };
    LIVE = {card: c, crown: best(c, x => x.w || 0, 0), jester: best(c, x => x.l || 0, 0), tipsy: best(d, x => x.today || 0, 2)};
    if (LIVE.jester === LIVE.crown) LIVE.jester = null;
  }
  function start(enc) {
    stop(false); const my = ++run; STATE = 'run'; startedAt = performance.now(); paint(); aud.forEach(b => b.classList.remove('off'));
    window.dispatchEvent(new CustomEvent('br26-kino', {detail: 'samba'}));
    ENC = !!enc; T = ENC ? TENC : TMAIN; END = ENC ? 19800 : END_MAIN; encoreReady = false; TAPS = []; BOOST = {clap: -1e9, cheer: -1e9}; PRESS = [];
    const video = window.__danceT !== undefined; pickLines(video ? 0 : 1 + Math.floor(Math.random() * 1000)); if (!video) liveData();
    EVENT = window.__danceEvent || (video ? 'police' : EVENTS[Math.floor(Math.random() * EVENTS.length)]);
    VICTIM = video ? 'simon' : ids[Math.floor(Math.random() * N)];
    ids.forEach(id => { P[id].gotDrink = 0; if (P[id].prop) P[id].prop.textContent = PROPS[id]; });
    buildStage(stageToday()); fast(svg);
    if (!video && soundOn() && window.__TripMusic) {
      try { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); ctx.resume();
        base = ctx.currentTime + .15; const m = window.__TripMusic(ctx); program(m, base); liveM = m;
        vGain = ctx.createGain(); vGain.gain.value = 1; vGain.connect(ctx.destination);
        timer = setInterval(() => { if (ctx) m.schedule(ctx.currentTime + .15); }, 30);
        LINES.forEach(l => { if (!l.mute) playVoice(l.file, l.at, my); });   // mute: Mund bewegt sich, Ton kommt von der Quell-Zeile (src)
      } catch (e) { ctx = null; }
    }
    t0p = tnow();
    let last = performance.now(), slow = 0;
    (function loop() { if (my !== run) return;
      const now = performance.now(), dt = now - last; last = now;
      if (STATE === 'run' && window.__danceT === undefined) { slow = dt > 34 ? slow + 1 : Math.max(0, slow - 1); if (slow > 20) svg.classList.add('sb-lite'); }   // ruckelt es länger: Sparmodus
      // Ton kommt nicht in Gang (z. B. stummgeschaltet blockiert): ohne Ton weiterlaufen statt stehen zu bleiben
      if (ctx && STATE === 'run' && ctx.state !== 'running' && now - startedAt > 1500 && window.__danceT === undefined) { const tn = Math.max(0, clock()); ctx.close().catch(() => {}); ctx = null; clearInterval(timer); t0p = tnow() - tn * SPD(); }
      if (STATE === 'run') { const t = clock(); frame(t); if (t > END) { encoreReady = !ENC; stop(true); return; } }
      raf = requestAnimationFrame(loop); })();
  }
  const stopB = document.getElementById('samba-stop');
  function paint() {
    btn.textContent = STATE === 'run' ? '⏸ Pause' : STATE === 'pause' ? '▶ Weiter' : encoreReady ? '🎉 Zugabe!' : '💃 Samba-Show starten';
    btn.setAttribute('aria-pressed', String(STATE !== 'idle')); if (stopB) stopB.hidden = STATE === 'idle';
    box.classList.toggle('idle', STATE === 'idle'); if (bigB) { bigB.querySelector('small').textContent = encoreReady ? '🎉 Zugabe abspielen' : 'ca. 1:40 min · mit Ton am schönsten'; bigB.setAttribute('aria-label', encoreReady ? 'Zugabe abspielen' : 'Samba-Show abspielen'); }
  }
  const bigB = document.getElementById('samba-big');   // großer Start-Knopf über der Bühne (nur im Ruhezustand sichtbar)
  if (bigB) bigB.addEventListener('click', () => { if (STATE === 'idle') start(encoreReady); });
  function pause() { if (STATE !== 'run') return; pausedAt = clock(); STATE = 'pause'; if (ctx) ctx.suspend().catch(() => {}); voices.forEach(a => { if (a.el && !a.el.paused) { a.el.pause(); a.resumeEl = true; } }); paint(); }
  function resume() { if (STATE !== 'pause') return; if (ctx) ctx.resume().catch(() => {}); else t0p = tnow() - pausedAt * SPD();
    voices.forEach(a => { if (a.resumeEl) { a.el.play().catch(() => {}); a.resumeEl = false; } }); STATE = 'run'; startedAt = performance.now(); paint(); }
  btn.addEventListener('click', () => { if (STATE === 'run') pause(); else if (STATE === 'pause') resume(); else start(encoreReady); });
  if (stopB) stopB.addEventListener('click', () => { encoreReady = false; stop(true); });
  window.addEventListener('br26-kino', e => { if (e.detail !== 'samba' && STATE === 'run') pause(); });   // nie zwei Filme gleichzeitig
  // Antippen einer Figur während der Show: Spruch, Sprung, Drehung (Patrick: Hähnchen fällt runter)
  const playing = () => STATE === 'run';
  function tapPerson(id) {
    const t = clock(), own = D.lines.filter(l => l.who === id && !l.chorus && !l.sing && !l.src).flatMap(l => [l].concat(l.alts || [])).map(v => ({key: v.key, text: v.text}));
    const r = Math.random(), kind = id === 'patrick' && r < .35 && !TAPS.some(tp => tp.kind === 'chicken' && t - tp.at < 3000) ? 'chicken' : r < .7 && own.length ? 'line' : r < .85 ? 'jump' : 'spin';
    const tp = {who: id, at: t, kind, tap: true, dur: kind === 'chicken' ? 1800 : 700, env: ''};
    if (kind === 'line') { const v = own[Math.floor(Math.random() * own.length)]; Object.assign(tp, {text: v.text, file: v.key}, voiceOf(v.key));
      if (ctx) playVoice(v.key, t, run); }
    if (liveM && ctx) liveM.sfx(kind === 'chicken' ? 'thud' : kind === 'jump' ? 'boing' : kind === 'spin' ? 'whoo' : 'ding', ctx.currentTime + .02);
    TAPS = TAPS.filter(x => t - x.at < 4000).concat([tp]);
  }
  svg.addEventListener('click', e => {
    if (STATE === 'pause') { resume(); return; }
    if (STATE === 'idle') { start(encoreReady); return; }
    const g = e.target.closest && e.target.closest('[id^="sb-p-"]'); if (g) tapPerson(g.id.slice(5));
  });
  // Publikum: Klatschen und Jubeln
  const aud = [document.getElementById('samba-clap'), document.getElementById('samba-cheer')].filter(Boolean);
  aud.forEach(b => b.addEventListener('click', () => { if (!playing()) return; const t = clock(), cheerB = b.id === 'samba-cheer';
    if (cheerB) BOOST.cheer = t; else BOOST.clap = t; PRESS.filter(q => t - q.t >= 2500 && q.els).forEach(q => q.els.forEach(e => e.remove())); PRESS = PRESS.filter(q => t - q.t < 2500).concat([{t, k: cheerB ? 'cheer' : 'clap'}]);
    if (liveM && ctx) { const n = ctx.currentTime + .02; if (cheerB) { liveM.sfx('cheer', n); liveM.sfx('applause', n + .3); } else liveM.sfx('handclaps', n); } }));
  const sPaint = () => { if (sbtn) { sbtn.textContent = soundOn() ? '🔊 Ton an' : '🔇 Ton aus'; sbtn.setAttribute('aria-pressed', String(soundOn())); } };
  if (sbtn) sbtn.addEventListener('click', () => { store.set('sound', soundOn() ? '0' : '1'); sPaint(); if (!soundOn() && ctx) { const tn = clock(); t0p = tnow() - tn * SPD(); if (STATE === 'pause') pausedAt = tn; voices.forEach(a => { if (a.el) a.el.pause(); if (a.src) try { a.src.stop(); } catch (e) {} }); ctx.close().catch(() => {}); ctx = null; clearInterval(timer); } });
  // Vollbild: echtes Vollbild, wo erlaubt (sonst füllt die Show per CSS den Bildschirm), im Querformat gesperrt wenn möglich
  const box = document.getElementById('samba'), fbtn = document.getElementById('samba-full');
  const isFull = () => box.classList.contains('full');
  const ph = document.createComment('samba');
  function setFull(on) {
    if (on === isFull()) return;
    // Vollbild: Bühne direkt unter <body> hängen und den Rest der (langen) Seite ausblenden, damit nur die Show gezeichnet wird
    if (on) { box.before(ph); document.body.appendChild(box); } else if (ph.isConnected) { ph.replaceWith(box); }
    box.classList.toggle('full', on); document.documentElement.classList.toggle('sb-noscroll', on); svg.classList.toggle('sb-lite', on);
    if (fbtn) fbtn.textContent = on ? '✕ Vollbild beenden' : '⛶ Vollbild';
    if (on) { const r = box.requestFullscreen || box.webkitRequestFullscreen; if (r) try { const pr = r.call(box); if (pr && pr.then) pr.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {} }
    else { if (document.fullscreenElement || document.webkitFullscreenElement) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
      try { screen.orientation.unlock(); } catch (e) {}
      // nach dem Vollbild: Seite wieder dorthin, wo sie war, und die Bühne neu ausmessen
      requestAnimationFrame(() => requestAnimationFrame(() => { document.body.classList.add('cv-all'); measure(); frame(clock()); const r = box.getBoundingClientRect(); scrollTo({top: Math.max(0, scrollY + r.top - Math.max(70, (innerHeight - r.height) / 2)), behavior: 'auto'}); })); }
  }
  if (fbtn) fbtn.addEventListener('click', () => setFull(!isFull()));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) setFull(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isFull()) setFull(false); });
  fast(svg); sPaint(); paint(); frame(0);
  // Video-Aufnahme: Zeit setzen, Musik offline rendern, Stimmen-Startzeiten; __danceLive setzt Live-Daten zum Ausprobieren
  window.__dancePlay = start; window.__danceTap = id => tapPerson(id); window.__danceBoost = k => { const t = clock(); BOOST[k] = t; PRESS = PRESS.concat([{t, k}]); }; window.__danceEnd = END; window.__danceLive = o => { LIVE = Object.assign({card: {}}, o); };
  window.__danceAudio = async ms => { const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(sr * ms * SLOW / 1000), sr), m = window.__TripMusic(oc); program(m, 0); m.schedule(ms * SLOW / 1000); return wavB64(await oc.startRendering()); };
  window.__danceVoices = () => LINES.map(l => ({key: l.file, at: l.at * SLOW}));   // echte ms (Showzeit × SLOW)
})();
