/* ---------- Gringo Kart ----------
   Rennspiel von oben, Canvas. Sechs Strecken entlang der Reise (TRACKS: Guarujá, Copacabana, Iguaçu, Amazonas, Paraty, Ilha Grande),
   Einzelrennen oder Grand Prix (alle sechs, Punkte 10/8/6/5/4/3, Siegerehrung). 6 Fahrer mit Crew-Köpfen, 3 Runden.
   Gas automatisch, Daumen links/rechts lenkt, ITEM (oder Item-Fenster) zündet das Item (🍹 Turbo, 🧴 Sonnencreme-Öl, 🦝 Nasenbär).
   Lange in eine Richtung lenken (oder Doppeltipp) = Drift mit Funken; Richtung halten = enger Bogen, Gegenseite = weiter Bogen, ganz loslassen = Mini-Turbo (blau) bzw. Super-Turbo (orange).
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
  const LOOK = Object.assign({}, (TRIP.dance && TRIP.dance.look) || {}), CREW = TRIP.crew, NAME = id => (CREW.find(c => c.id === id) || XBY[id] || {}).name || gName(id);
  // Gäste ohne eigene Figur („Anderer Gast“): Kennung gast_<Name>, angezeigter Name aus Bestenliste/presence (GNM), sonst aus der Kennung
  const GNM = {}, gName = id => typeof id === 'string' && id.indexOf('gast_') === 0 ? GNM[id] || id.slice(5).replace(/-/g, ' ') : id;
  let LAPS = 3; const VMAX = 272, PTS = [10, 8, 6, 5, 4, 3];
  const LINES = {jonas: ['Das kommt auf Splitwise!', 'Mein Fischerhut!'], simon: ['Schon wieder ich?!', 'Aua, mein Sonnenbrand!'], patrick: ['Mein Rücken!', 'Ich hab Vorfahrt!'],
    marco: ['Wer war das?!', 'Fernschuss!'], greisel: ['Passt scho.', 'Kitzelt bloß.'], dajo: ['Das war Absicht!', 'Ich will nachfüllen!']};
  const ITEMS = {turbo: {k: 'turbo', e: '🍹', n: 'Caipi-Turbo'}, oil: {k: 'oil', e: '🧴', n: 'Sonnencreme-Öl'}, coati: {k: 'coati', e: '🦝', n: 'Nasenbär'},
    parrot: {k: 'parrot', e: '🦜', n: 'Papagei'}, pimenta: {k: 'pimenta', e: '🌶️', n: 'Pimenta-Turbo'}, flip: {k: 'flip', e: '🩴', n: 'Flip-Flop'}, shield: {k: 'shield', e: '⛱️', n: 'Sonnenschirm'},
    // Mehrfach-Items: mehrmals antippen (wie die drei Pilze), Restanzahl in k.icnt
    turbo3: {k: 'turbo3', e: '🍹', n: 'Caipi-Runde', cnt: 3}, flip2: {k: 'flip2', e: '🩴', n: 'Flip-Flop-Paar', cnt: 2}, coco3: {k: 'coco3', e: '🥥', n: 'Kokos-Trio', cnt: 3, orb: 1},
    banana3: {k: 'banana3', e: '🍌', n: 'Bananen-Staude', cnt: 3, trail: 1}, boller3: {k: 'boller3', e: '🧨', n: 'Böller-Batterie', cnt: 3},
    // Neue Items (Wunsch Patrick 09.10.): Urubu (sucht den Führenden), Cristo-Blitz (alle anderen schrumpfen), Açaí-Bombe (Matsch ins Gesicht der Vorderen), Ônibus-Express (Autopilot-Bus)
    uru: {k: 'uru', e: '🦅', n: 'Urubu'}, blitz: {k: 'blitz', e: '⚡', n: 'Cristo-Blitz'}, acai: {k: 'acai', e: '🫐', n: 'Açaí-Bombe'}, bus: {k: 'bus', e: '🚌', n: 'Ônibus-Express'}}, ILIST = Object.values(ITEMS);
  // Item-Wahrscheinlichkeit nach Platz: vorne Verteidigung, hinten Aufholen. Ausgeglichen (Wunsch Patrick 09.10.: Flip-Flop kam zu oft, vorher 18–20 % mit Paar):
  // jede Item-Familie höchstens ~15 %, alle 12 Items kommen überall vor (gleich verteilt wären gut 8 %)
  const IW = {front: {oil: .11, shield: .11, banana3: .11, coco3: .09, boller3: .08, flip: .08, turbo: .08, parrot: .08, coati: .08, flip2: .04, turbo3: .05, pimenta: .05, acai: .04},
    mid: {turbo: .10, oil: .08, coati: .10, flip: .07, shield: .07, parrot: .08, pimenta: .07, turbo3: .08, flip2: .04, coco3: .07, banana3: .07, boller3: .08, acai: .05, uru: .03, blitz: .01},
    back: {turbo: .08, coati: .10, pimenta: .11, parrot: .09, flip: .04, shield: .04, turbo3: .12, flip2: .03, coco3: .06, boller3: .07, oil: .03, banana3: .04, acai: .06, uru: .05, blitz: .03, bus: .05}};
  const ifam = it => it.k.replace(/\d+$/, '');   // Item-Familie: turbo3 → turbo, flip2 → flip
  const icnt = k => !k.item || !k.item.cnt ? (k.item ? 1 : 0) : k.icntFor === k.item ? k.icnt : (k.icntFor = k.item, k.icnt = k.item.cnt);   // Restanzahl des Mehrfach-Items
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
  // Fahrzeuge (Wunsch Patrick 09.10.): 4 sofort frei, der Rest ENTWEDER mit Münzen kaufen (c) ODER über einen Erfolg freischalten (need), nie beides; lustigere teurer
  const VEHS = [{id: 'kart', n: 'Gringo-Kart', e: '🏎️'}, {id: 'uber', n: 'Uber', e: '🚕'}, {id: 'uno', n: 'Fiat Uno', e: '🚗'}, {id: 'cart', n: 'Gepäckkarren', e: '🧳'},
    {id: 'moto', n: 'Motoboy', e: '🛵', c: 100}, {id: 'trak', n: 'Zuckerrohr-Traktor', e: '🚜', c: 120}, {id: 'sail', n: 'Strandsegler', e: '⛵', c: 140}, {id: 'coco', n: 'Kokos-Karren', e: '🥥', c: 150},
    {id: 'horse', n: 'Pferdekutsche', e: '🐎', c: 170}, {id: 'capi', n: 'Capivara', e: '🦫', c: 190}, {id: 'rocket', n: 'Raketen-Liegestuhl', e: '🚀', c: 250},
    {id: 'wheel', n: 'Rollstuhl', e: '♿', need: ['vsup', 10], t: '10 Super-Turbos'}, {id: 'trio', n: 'Trio Elétrico', e: '🔊', need: ['vtds', 15], t: '15 Takedowns'}, {id: 'gold', n: 'Goldenes Kart', e: '🏆', need: ['vcup', 1], t: 'einen Grand Prix gewinnen'}];
  // Neustart 09.10. abends (Wunsch Patrick: jeder nur 3–4 Fahrzeuge zu Beginn): Erfolge zählen ab jetzt (eigene Zähler vsup/vtds/vcup), Käufe in neuem Speicher br26.kartVehOwn2
  // Fahrgefühl je Fahrzeug: g = Haftung, d = Rutschen im Drift, m = Masse (Rempler), b = Turbo-Dauer, x = Beschreibung im Menü
  const VTX = {kart: {g: 1, d: 1, m: 1, b: 1, x: 'Ausgewogen, für alles gut.'}, uber: {g: 1.08, d: .8, m: 1.45, b: 1, x: 'Schwer und stabil: rempelt andere weg, driftet ungern.'},
    uno: {g: .95, d: 1.15, m: 1.1, b: 1, x: 'Zieht stark an, das Heck kommt schnell.'}, cart: {g: .85, d: 1.35, m: .9, b: 1, x: 'Rutschig wie auf Seife, aber wendig.'},
    wheel: {g: 1.1, d: .8, m: .65, b: 1.35, x: 'Leicht und wendig, Turbos halten deutlich länger, fliegt bei Remplern weg.'}, gold: {g: 1.04, d: 1, m: 1.1, b: 1.1, x: 'Von allem ein bisschen mehr.'},
    capi: {g: 1.06, d: .85, m: 1.25, b: .95, x: 'Die Ruhe selbst: dreht sich bei Treffern kaum, schwimmt durch Pfützen und Wellen, mag auch Sand und Wiese. Dafür etwas langsamer.'},
    moto: {g: 1, d: 1.1, m: .6, b: 1, x: 'Schmal, spritzig, wendig: knapp an jemandem vorbei = Mini-Turbo, Windschatten lädt doppelt so schnell. Wird bei Remplern weggeschubst.'},
    coco: {g: 1, d: 1, m: 1.3, b: 1, x: 'Verliert alle 6 Sekunden eine Kokosnuss nach hinten, Hintermänner machen Bonk. Bei Treffern kullert Ladung raus.'},
    sail: {g: .8, d: 1.45, m: .6, b: .9, x: 'Segelt mit dem Wind: Rückenwind bis +13 %, Gegenwind bis −13 % (Anzeige rechts). Auf Sand ein Traum, rutscht aber wie verrückt.'},
    horse: {g: 1.25, d: .5, m: 1.15, b: 1, x: 'Pferde driften nicht: keine Mini-Turbos, dafür kosten Kurven kaum Tempo, und im Galopp wird es auf Geraden immer schneller.'},
    trak: {g: 1.25, d: .6, m: 1.9, b: .9, x: 'Langsam, aber Gelände ist ihm egal: Sand, Wiese und Schleichwege ohne Bremse, rollt über Öl, Bananen und Kokosnüsse einfach drüber.'},
    rocket: {g: .9, d: 1.15, m: .8, b: 1.55, x: 'Höchstes Endtempo, Turbos halten ewig, lenkt aber wie ein Liegestuhl. Zu lange Turbo am Stück = Überhitzung.'},
    trio: {g: 1.1, d: .75, m: 2.3, b: 1, x: 'Rollende Party: riesig und schwer, schiebt alle weg und haut alle 4,5 s einen Bass-Stoß raus, der Gegner zur Seite schleudert. Kommt schwer in Gang.'},
    boat: {g: 1, d: 1, m: 1, b: 1, x: ''}};
  // KI-Persönlichkeiten: line = Linientreue, care = Abstand zu Hindernissen, brake = Bremsen vor Kurven, mis = Fehler-Häufigkeit + Art, item = wann Items benutzt werden
  const PERS = {jonas: {line: 1.1, care: 1.3, brake: 1.15, mis: [.5, 'brake'], item: .5, x: 'fährt vorsichtig und sauber, bremst aber vor jeder Kurve zu früh'},
    simon: {line: .8, care: .6, brake: .6, mis: [1.1, 'wide'], item: 1, ram: 1, x: 'riskant: drängelt, nimmt jede Abkürzung, fliegt dafür gern aus der Kurve'},
    patrick: {line: 1, care: 1, brake: 1, mis: [.6, 'wobble'], item: 1.4, late: 1, noRocket: 1, x: 'verschläft den Start, wird aber in der letzten Runde gefährlich'},
    marco: {line: 1, care: .9, brake: .9, mis: [.6, 'lapse'], item: 2.2, straight: 1, x: 'schnell auf Geraden, hebt Items für den perfekten Fernschuss auf'},
    greisel: {line: .9, care: 1, brake: 1, mis: [.7, 'lapse'], item: 1, burst: 1, x: 'unberechenbar: plötzlich irre schnell, dann wieder kurz vom Gas'},
    dajo: {line: 1.25, care: 1.5, brake: 1.15, mis: [.4, 'brake'], item: .8, x: 'fährt die sauberste Linie und weicht allem aus, ist aber nicht die Schnellste'}};
  const PERS0 = {line: 1, care: 1, brake: 1, mis: [.6, 'wide'], item: 1, x: ''};
  const VTUNE = {kart: [1, 1, 1], uber: [1.02, .96, 1], uno: [.99, 1.03, 1.12], cart: [.98, 1.08, 1], wheel: [.97, 1.1, 1.2], gold: [1.02, 1.02, 1.05],
    capi: [.985, 1.02, 1], moto: [.98, 1.13, 1.25], coco: [.99, .97, .95], sail: [1.035, .95, .82], horse: [1.01, 1.12, 1.05], trak: [.95, .96, .92], rocket: [1.025, .8, .78], trio: [1.025, .86, .78]};   // Tempo, Lenkung, Beschleunigung
  // neue Fahrzeuge: Haltung des Fahrers (VSEAT), Sitzplatz nach hinten in px (VHEAD, Standard 7), Größe/Zusammenstoß (VSZ), Bremse neben der Strecke (VOFF, 1 = normal), Pfützen/Wellen egal (VDRY)
  const VNEW = {capi: 1, moto: 1, coco: 1, sail: 1, horse: 1, trak: 1, rocket: 1, trio: 1}, VSEAT = {capi: 'bar', moto: 'bar', coco: 'bar', sail: 'bar', horse: 'bar', trak: 'wheel', rocket: 'bar', trio: 'bar'};
  const VHEAD = {capi: 5, moto: 3, coco: 21, sail: 16, horse: 17, trak: 9, rocket: 4, trio: 3}, VSZ = {moto: .82, horse: 1.08, trak: 1.08, rocket: .95, trio: 1.22}, VOFF = {capi: .55, sail: .45, horse: .75, trak: .12, moto: 1.15}, VDRY = {capi: 1, trak: 1}, VNOX = {capi: 1, horse: 1, sail: 1, coco: 1};   // VNOX: ohne Motor, kein Auspuff-Feuer
  // Zusätzliche Fahrer (Wunsch Patrick 08.10.): Crew in besonderen Zuständen (base = Foto, Stimme, KI-Art der Person; d = Änderung der Werte) und Figuren aus der Serie (npc, Kopf = Emoji)
  // m = Masse (Rempler), sp = eigenes Spezial-Item, l = Sprüche, ov = Zeichnung über dem Foto, col = Kart-Farbe
  const XDRV = [
    {id: 'simon_love', sh: 'verliebt', base: 'simon', name: 'Simon verliebt', e: '😍', ov: 'love', col: '#ff5fa2', d: {spd: .35, hdl: -.45}, x: 'Nach einer heißen Nacht mit einer Latina: schwebt auf Wolke sieben, lenkt aber verträumt.', sp: {k: 'kiss', e: '💋', n: 'Luftkuss', x: 'alle in der Nähe sind verknallt: Lenkung spielt verrückt'}, l: ['Gatinha, warte auf mich!', 'Ich denk nur an sie …', 'Hat jemand ihre Nummer?']},
    {id: 'patrick_fat', sh: 'Fresskoma', base: 'patrick', name: 'Patrick vollgefressen', e: '🍖', ov: 'fat', col: '#a0522d', d: {spd: -.45, acc: -.4, tgh: .8}, m: 1.8, x: 'Nach dem Rodízio: deutlich langsamer, aber robust wie ein Bus. Rempler prallen ab, Dreher sind kurz.', sp: {k: 'burp', e: '🤢', n: 'Picanha-Rülpser', x: 'Druckwelle schiebt alle Nahen weg und bremst sie'}, l: ['Ich hatte nur zwölf Spieße!', 'Bauch voraus!', 'Noch ein Stück Picanha …']},
    {id: 'marco_dia', sh: 'Durchfall', base: 'marco', name: 'Marco mit Durchfall', e: '💩', ov: 'sick', col: '#7a8f3a', d: {spd: .35, acc: .3, hdl: -.2, tgh: -.4}, m: .9, x: 'Flusswasser-Eis: rast wie verrückt, weil er ganz dringend muss. Verträgt nichts.', sp: {k: 'stink', e: '💨', n: 'Stinkwolke', x: 'grüne Wolke hinter dir, wer durchfährt, kriecht'}, l: ['Ich muss mal ganz dringend!', 'Nicht jetzt, Bauch!', 'Wo ist das nächste Klo?!']},
    {id: 'jonas_kater', sh: 'verkatert', base: 'jonas', name: 'Jonas verkatert', e: '🥴', ov: 'hang', col: '#6b7c8f', d: {acc: -.45, hdl: .2, tgh: .3}, x: 'Morgen nach der Lodge-Bar: kommt schwer in die Gänge, fährt dann aber erstaunlich ruhig.', sp: {k: 'puke', e: '🤮', n: 'Kotzfontäne', x: 'drei Pfützen hinter dir, wer reinfährt, dreht sich'}, l: ['Zu laut, alles zu laut!', 'Nie wieder Cachaça!', 'Mir ist so schlecht …']},
    {id: 'greisel_wb', sh: 'Weißbier', base: 'greisel', name: 'Weißbier-Greisel', e: '🍺', ov: 'foam', col: '#e8b84a', d: {spd: .15, hdl: -.3, tgh: .7}, m: 1.25, x: 'Weißbier in der Hand: steckt alles weg, lenkt aber nur einhändig.', sp: {k: 'beer', e: '🍺', n: 'Maß-Dusche', x: 'riesige Schaumpfütze hinter dir'}, l: ['Prost, Burschen!', 'Ned verschütten!', 'Passt scho, oans geht no.']},
    {id: 'dajo_party', sh: 'Party', base: 'dajo', name: 'Party-Daijo', e: '🪩', ov: 'disco', col: '#9b5de5', d: {acc: .5, spd: .1, hdl: -.15}, x: 'Direkt aus der Disco: Vollgas beim Start, Lichtorgel an Bord.', sp: {k: 'disco', e: '🪩', n: 'Lichtorgel', x: 'blendet alle in der Nähe länger als ein Sonnenbrand'}, l: ['Noch eine Runde!', 'Wer hat die Musik aus?!', 'Partyyy!']},
    {id: 'taxi', sh: 'Taxi', npc: 1, name: 'Taxifahrer', e: '🧔🏽', col: '#ffd23f', cs: {spd: .85, hdl: .6, acc: .75, tgh: .6}, m: 1.3, x: 'Kennt jede Abkürzung und jeden Umweg. Fährt, als gäbe es keine Verkehrsregeln.', sp: {k: 'meter', e: '🚖', n: 'Taxameter', x: 'alle vor dir bezahlen den Umweg: kurz gebremst'}, l: ['Atalho, amigo!', 'Taxameter läuft!', 'Rio-Fahrstil!']},
    {id: 'coati', sh: 'Nasenbär', npc: 1, name: 'Nasenbär', e: '🦝', col: '#8a5a2b', cs: {spd: .55, hdl: .9, acc: .85, tgh: .1}, m: .55, x: 'Der Erzfeind aus der Serie: klein, wendig, fliegt bei jedem Rempler weg.', sp: {k: 'steal', e: '🦝', n: 'Langfinger', x: 'klaut dem Vordermann das Item und bremst ihn'}, l: ['Kchhh!', 'Mein Sandwich jetzt!', 'Gib her!']},
    {id: 'officer', sh: 'Security', npc: 1, name: 'Kontrolleur', e: '👮🏻', col: '#2b5f9e', cs: {spd: .55, hdl: .6, acc: .5, tgh: .9}, m: 1.4, x: 'Von der Sicherheitskontrolle: langsam, gründlich, nicht aus der Bahn zu bringen.', sp: {k: 'ticket', e: '🛂', n: 'Kontrolle!', x: 'alle Nahen müssen kurz anhalten'}, l: ['Flüssigkeiten raus!', 'Bitte zur Seite treten!', 'Ausweis!']},
    {id: 'dona', sh: 'Dona Rosa', npc: 1, name: 'Dona Rosa', e: '👵🏽', col: '#d62828', cs: {spd: .5, hdl: .75, acc: .6, tgh: .85}, m: 1.1, x: 'Die Oma von der Ilha Grande: unterschätzt, aber flirtet alle in den Graben.', sp: {k: 'kiss', e: '💋', n: 'Que gatinho!', x: 'alle in der Nähe sind verknallt: Lenkung spielt verrückt'}, l: ['Que gatinho!', 'Vem cá, menino!', 'Ai, ai, ai!']},
    {id: 'guide', sh: 'Guide', npc: 1, name: 'Dschungel-Guide', e: '🤠', col: '#3d6b35', cs: {spd: .6, hdl: .95, acc: .55, tgh: .7}, x: 'Kennt den Amazonas: perfekte Linie, nichts bringt ihn aus der Ruhe.', sp: {k: 'caiman', e: '🐊', n: 'Kaiman-Wurf', x: 'Kaiman jagt den Vordermann'}, l: ['Olja, Kaiman!', 'Nau, nau, nau!', 'Sokorro!']},
    {id: 'steward', sh: 'Stewardess', npc: 1, name: 'Flugbegleiterin', e: '💁🏻‍♀️', col: '#1694b8', cs: {spd: .7, hdl: .7, acc: .65, tgh: .45}, x: 'Aus dem Flieger: immer freundlich, immer schneller als man denkt.', sp: {k: 'trolley', e: '🛒', n: 'Servierwagen', x: 'rollt geradeaus nach vorn und räumt ab'}, l: ['Chicken or pasta?', 'Bitte anschnallen!', 'Turbulenzen!']},
    {id: 'caimanx', sh: 'Kaiman', npc: 1, name: 'Kaiman', e: '🐊', col: '#4a7a3a', cs: {spd: .5, hdl: .35, acc: .4, tgh: 1}, m: 2, x: 'Hat Simons Fischerhut gefressen: schwer, langsam, beißt alles in der Nähe.', sp: {k: 'chomp', e: '🦷', n: 'Biss', x: 'beißt alle direkt neben dir: Dreher'}, l: ['*schnapp*', '*grummel*', '*zisch*']},
    // Gastfahrer (Kumpel der Crew, eigenes Foto nur im Artifact): Manuel, Spitznamen Abzwickter, Miniman, Half Cutted, Stumpen, weil er so klein ist
    {id: 'manuel', sh: 'Abzwickter', npc: 1, guest: 1, name: 'Manuel', ann: 'Achtung, der Abzwickter ist am Start! Bitte nicht überfahren!', e: '🤏', col: '#2bb3a3', photo: 'crew/manuel.jpg', face: {x: .5, y: .5, z: 1}, cs: {spd: .55, hdl: 1.1, acc: .9, tgh: .1}, m: .55,
      x: 'Gastfahrer, auch bekannt als Miniman, Half Cutted oder Stumpen. Sieht nur mit Kissen übers Lenkrad, flutscht dafür durch jede Lücke und zieht um die Kurven wie kein anderer. Federleicht: Bei Remplern fliegt er weit.',
      sp: {k: 'mini', e: '🤏', n: 'Abgezwickt!', x: 'schrumpft auf Taschenformat: unverwundbar, flutscht unter allen durch und gibt Gas'},
      l: ['Ich seh nix übers Lenkrad!', 'Wer hat Stumpen gesagt?!', 'Kleiner Mann, großer Turbo!', 'Ich fahr unten durch!', 'Unterschätz nie den Abzwickter!', 'Half cutted, full speed!', 'Hey, nicht auf den Kleinen!', 'Wo ist mein Sitzkissen?']},
    // Gastfahrer Erich: Betreuer von Schwaben Augsburg (Jonas, Greisel, Marco), immer grantig; nach jedem Dreher Wut-Turbo (k.wut)
    {id: 'erich', sh: 'Grantler', npc: 1, guest: 1, name: 'Erich', ann: 'Achtung, Erich ist am Start. Und er hat, wie immer, Mordlaune!', e: '😠', ov: 'grump', col: '#b3202a', photo: 'crew/erich.jpg', face: {x: .5, y: .48, z: 1.05}, cs: {spd: .6, hdl: .45, acc: .35, tgh: 1.15}, m: 1.45,
      x: 'Gastfahrer: Betreuer von Schwaben Augsburg und damit Chef von Jonas, Greisel und Marco. Immer grantig, nie zufrieden. Kommt schwer in die Gänge, ist aber zäh wie Leder: Rempler prallen ab, und jeder Dreher macht ihn nur wütender (💢 Wut-Turbo danach).',
      sp: {k: 'grant', e: '📢', n: 'Kabinenpredigt', x: 'brüllt alle in der Nähe zusammen: gebremst, Lenkung zittert; seine eigenen Spieler (Jonas, Greisel, Marco) kuschen extra lang'},
      l: ['Des isch doch koi Rennfahrer!', 'Früher hätt’s des ned gebe!', 'Wer hat die Trinkflaschen liegen lassen?!', 'Schleich di, du Bagasch!', 'I sag nix mehr …', 'Ihr Weicheier!', 'Die Leibchen wäsch i ned nomal!', 'Mir doch wurscht!', 'Hört eh koiner auf mi!', 'Jonas, Greisel, Marco: Hopp jetzt!']},
    // Gastfahrer Rasmus: Animator, sportlicher Leiter und Partyorganisator von Schwaben Augsburg, Mitspieler von Jonas, Greisel und Marco; Hippie-Frisur
    {id: 'rasmus', sh: 'Animator', npc: 1, guest: 1, name: 'Rasmus', ann: 'Achtung, Rasmus ist da! Er organisiert auch eure Trauerfeier!', e: '🎉', ov: 'hippie', col: '#5b2a86', photo: 'crew/rasmus.jpg', face: {x: .5, y: .5, z: 1.05}, cs: {spd: .8, hdl: .75, acc: .9, tgh: .5}, m: 1.1,
      x: 'Gastfahrer: Animator, sportlicher Leiter und Partyorganisator von Schwaben Augsburg, spielt mit Jonas, Greisel und Marco. Lässige Hippie-Frisur, fährt im bunten Bulli. Rundum stark, nirgends überragend, und wo er ist, ist Party.',
      sp: {k: 'polo', e: '💃', n: 'Polonaise', x: 'alle in der Nähe müssen mittanzen (gebremst), seine Mitspieler Jonas, Greisel und Marco tanzen mit Turbo mit, er selbst gibt Gas'},
      l: ['Auf geht’s, Party!', 'Training um sieben, Party um acht!', 'Mannschaftsabend ist Pflicht!', 'Alle Mann: Polonaise!', 'Locker bleiben, Jungs!', 'Wer kommt mit zum Feiern?', 'Erich, lach doch mal!', 'Peace, Bruder!', 'Ich hab schon den Tisch reserviert!']},
    // Gastfahrer Ilkay (Wunsch Patrick 09.10.): Spitznamen Taco und Kebabito, Deutscher mit türkischen Eltern; „Taco“, weil er mit dem Schnurrbart wie ein Mexikaner aussieht
    {id: 'ilkay', sh: 'Taco', npc: 1, guest: 1, name: 'Ilkay', ann: 'Achtung, Taco ist am Start, er macht euch zu Hackfleisch, mit alles und scharf!', e: '🌮', ov: 'taco', col: '#e07b1a', photo: 'crew/ilkay.jpg', face: {x: .47, y: .52, z: 1.05}, cs: {spd: .9, hdl: .6, acc: .65, tgh: .55}, m: 1.05,
      x: 'Gastfahrer, auch Kebabito genannt: Deutscher mit türkischen Eltern, aber mit diesem Schnurrbart hält ihn jeder für einen Mexikaner. Fährt den Taco-Döner-Truck, ist auf den Geraden richtig schnell und bleibt dabei tiefenentspannt 🤙.',
      sp: {k: 'taco', e: '🌮', n: 'Scharf mit alles', x: 'Taco mit extra Chili: langer Feuer-Turbo, wer direkt hinter ihm fährt, verbrennt sich, und allen in der Nähe tränen die Augen (kurz geblendet)'},
      l: ['Hola, Abi!', 'Mit alles und scharf!', 'Taco oder Döner? Beides!', 'Der Schnurrbart fährt vor!', 'Ich bin Deutscher, verdammt!', 'Kebabito kommt!', '¡Ándale, ándale!', '¡Órale, güey!', 'Hadi lan!', '¡No manches!', 'Yavaş, kanka!', 'Oha!', '¡Ay, caramba!', 'Salak!', '¡Pinche pendejo!', '¡Chinga tu madre!', '¡Tu madre!', 'Ananı…!', 'Orospu çocuğu!']},
    // Gastfahrer Ritchi = Felix (Wunsch Patrick 09.10.: alle kennen ihn als „Ritchi“ bzw. „Ritchi Reddels“; id bleibt felix): der mit den meisten Spitznamen (Willi, Röddels, Reddel, Side-Step-Broly, Rocket, Raketenforscher Röddels, Peitsche …), rote Haare, meckert und diskutiert gern, leidenschaftlicher Golfer
    {id: 'felix', sh: 'Reddels', npc: 1, guest: 1, name: 'Ritchi', ann: 'Achtung, Ritchi Reddels ist am Start! Er diskutiert schon mit der Rennleitung über eure Beerdigung!', e: '⛳', ov: 'golf', col: '#2e8b57', photo: 'crew/felix.jpg', face: {x: .5, y: .48, z: .95}, cs: {spd: .85, hdl: .85, acc: .3, tgh: .6}, m: 1,
      x: 'Ritchi Reddels alias Felix, Gastfahrer mit den meisten Spitznamen der Welt: Willi, Röddels, Reddel, Side-Step-Broly, Rocket, Raketenforscher Röddels, Peitsche … Rote Haare, meckert über alles und diskutiert jede Entscheidung aus. Leidenschaftlicher Golfer: fährt im Golfcart, lenkt präzise wie beim Putten, verliert am Start aber Zeit, weil er erst mit der Rennleitung diskutiert.',
      sp: {k: 'golf', e: '⛳', n: 'Hole-in-One', x: 'Abschlag auf den Führenden: der Golfball fliegt über alle hinweg und schlägt beim Ersten ein (ist er selbst vorne, trifft es den Zweiten)'},
      l: ['Das war Foul!', 'Darüber müssen wir reden!', 'Fore!', 'Unfair!', 'Ich leg Protest ein!', 'Videobeweis!', 'Mein Handicap ist besser!', 'Rocket kommt!', 'Wer hat Willi gesagt?!', 'Side-Step!', 'Peitsche!', 'Das zählt nicht!', 'Schiri, wo bist du?!']},
    // Gastfahrerin Pat's Mum (Wunsch Patrick 09.10.): Patricks Mama, super lieb, holt jeden von jeder Party ab, raucht ihr Leben lang und hört nie auf, dekoriert alles (Haus, Garten, jetzt auch ihr Auto)
    {id: 'patmum', sh: 'Mama-Taxi', npc: 1, guest: 1, gl: 'Gastfahrerin', name: 'Pat’s Mum', ann: 'Achtung, Pat’s Mum ist am Start! Sie holt euch alle ab, aber erst nach der Zigarette.', e: '🚬', ov: 'mum', col: '#7b3fa0', photo: 'crew/patmum.jpg', face: {x: .5, y: .54, z: 1.12}, cs: {spd: .55, hdl: .75, acc: .9, tgh: .8}, m: 1.05,
      x: 'Gastfahrerin: Patricks Mama. Super lieb, holt dich zu jeder Uhrzeit von jeder Party ab, raucht seit Ewigkeiten und hört garantiert nie auf. Dekoriert alles, was stillsteht: Haus, Garten und jetzt auch ihr Mama-Taxi. Immer sofort startklar, fährt umsichtig und steckt viel weg.',
      sp: {k: 'mum', e: '🚬', n: 'Qualm-Taxi', x: 'Mama gibt Gas: langer Turbo, hinter ihr bleibt eine dicke Qualmwolke (bremst), alle in der Nähe husten und sehen kurz nichts, und Patrick wird abgeholt: er bekommt auch Turbo, egal wo er gerade ist'},
      l: ['Soll ich dich abholen, Schatz?', 'Kurz eine rauchen, dann geht’s weiter!', 'Aufhören? Niemals!', 'Ich hol euch alle ab, egal wie spät!', 'Habt ihr was gegessen?', 'Schuhe aus im Auto!', 'Da fehlt noch Deko!', 'Eine Lichterkette, und schon ist es gemütlich!', 'Nicht ins Auto kotzen, Jungs!', '*hust* … alles gut!', 'Die Lunge hält, keine Sorge!', 'Patrick, Jacke an!', 'Wer will noch ein Brot?', 'Nach dem Rennen dekorier ich um!', 'Bin schon unterwegs, Schatz!', 'Gurt an, Jungs!']}];
  const XBY = {}; XDRV.forEach(x => { XBY[x.id] = x; });
  const baseOf = id => (XBY[id] && XBY[id].base) || id, isNpc = id => !!(XBY[id] && XBY[id].npc);
  const DRVS = CREW.map(c => c.id).concat(XDRV.map(x => x.id));
  XDRV.forEach(x => { const b = x.base;
    CS[x.id] = x.cs ? Object.assign({}, x.cs) : Object.fromEntries(Object.entries(CS[b] || {spd: .5, hdl: .5, acc: .5, tgh: .5}).map(([k, v]) => [k, clamp(v + ((x.d || {})[k] || 0), -.5, 1.5)]));
    SPECIAL[x.id] = x.sp; LINES[x.id] = x.l; PERS[x.id] = b ? PERS[b] : Object.assign({}, PERS0, x.id === 'guide' ? {line: 1.3, care: 1.4} : x.id === 'taxi' ? {line: .85, care: .7, ram: 1} : x.id === 'manuel' ? {line: 1.05, care: .85} : x.id === 'erich' ? {line: 1, care: .6, brake: 1.1, ram: 1, x: 'rammt aus Prinzip, weicht keinem aus und schimpft dabei'} : x.id === 'rasmus' ? {line: 1.1, care: 1.1, item: .8, x: 'fährt locker und sauber und hebt die Polonaise für den richtigen Moment auf'} : x.id === 'ilkay' ? {line: 1, care: .9, straight: 1, x: 'chillt durch die Kurven und tritt auf der Geraden voll aufs Gas'} : x.id === 'felix' ? {line: 1.15, care: 1, mis: [.8, 'brake'], x: 'fährt präzise wie beim Putten, bremst aber ab und zu, um sich zu beschweren'} : x.id === 'patmum' ? {line: 1.08, care: 1.25, mis: [.7, 'brake'], x: 'fährt umsichtig wie nachts um vier mit vollem Auto, wird aber ab und zu langsamer: Zigarette anzünden'} : {});
    LOOK[x.id] = Object.assign({}, b ? LOOK[b] : {}, {shirt: x.col}); });
  // Ausgleich (Wunsch Patrick 08.10.: einige hatten fast überall volle Punkte): einzelne Werte dürfen voll sein, aber die Summe ist begrenzt:
  // jeder Wert 0,08–1, Summe der Abweichungen über 0,08 zwischen 1,2 und 1,9 (Gesamtstärke ähnlich); das Profil der Figur (Stärken/Schwächen) bleibt
  Object.keys(CS).forEach(id => { const c = CS[id], ks = ['spd', 'hdl', 'acc', 'tgh']; ks.forEach(k => { c[k] = .08 + clamp(c[k], 0, 1) * .92; });
    const sm = ks.reduce((a, k) => a + c[k] - .08, 0), f = sm > 1.9 ? 1.9 / sm : sm > 0 && sm < 1.2 && baseOf(id) !== 'marco' ? 1.2 / sm : 1;   /* Marco bleibt als Running Gag schwach (Wunsch Patrick) */ ks.forEach(k => { c[k] = Math.min(1, .08 + (c[k] - .08) * f); }); });

  /* ---- Strecken ----
     cp = Kontrollpunkte (geschlossen), tw = Breite, ww/wh = Weltgröße, sea = Uferlinie (y) oder null, off = Tempo neben der Strecke,
     grip = Haftung (klein = rutschig), veh = kart/boat/cart, pads/ramp/boxes = Anteil der Runde, obst = feste Hindernisse, movers = Querläufer,
     puddles = Wasserflächen (bremsen), extras: wave, rain, mist, dolphins, flood. */
  // Zonen-Vielecke für Langstrecken: waagerechtes Band mit welligem Rand (kein harter Strich zwischen Stadt, Berg und Strand)
  const ZB = (W, y0, y1, a) => { const w = y => Array.from({length: Math.ceil(W / 120) + 1}, (_, i) => [Math.min(W, i * 120), y + (y > 0 && y < 9e3 ? Math.sin(i * 1.3 + y * .013) * a + Math.sin(i * .47 + y * .029) * a * .6 : 0)]); return w(y0).map(p0 => [p0[0], p0[1] - (y0 > 0 ? 6 : 0)]).concat(w(y1).reverse()); };   /* gleiche Grenze → gleiche Welle, 6 px Überlappung (keine Haarlinien zwischen Nachbarzonen) */
  const TRACKS = [
    {id: 'gru', name: 'Flughafen GRU', sub: 'Rennen auf dem Gepäckband', e: '🛫', tw: 160, ww: 3394, wh: 2297, sea: null, off: .6, grip: 13, veh: 'kart',
      cp: [[700, 1798], [960, 1798], [1220, 1798], [1480, 1798], [1740, 1798], [2000, 1798], [2068, 1804], [2134, 1820], [2197, 1847], [2260, 1875], [2326, 1891], [2394, 1897], [2694, 1897], [2809, 1874], [2906, 1809], [2972, 1711], [2994, 1597], [2994, 1298], [2994, 999], [2994, 700], [2972, 585], [2906, 488], [2809, 423], [2694, 400], [2394, 400], [2094, 400], [1794, 400], [1726, 406], [1660, 422], [1597, 449], [1534, 476], [1468, 493], [1400, 498], [1167, 498], [933, 498], [700, 498], [585, 521], [488, 586], [423, 684], [400, 798], [400, 1032], [400, 1265], [400, 1498], [423, 1613], [488, 1710], [585, 1775]],
      pads: [[.12, 0], [.52, -30], [.83, 30]], ramp: .36, boxes: [.22, .5, .76], music: {bpm: 124, root: .9, style: 'bossa'},
      obst: [[.18, 35, 'suitcase'], [.44, -35, 'suitcase'], [.63, 30, 'suitcase'], [.9, -30, 'suitcase']], movers: [{f: .3, range: 100, speed: 60, kind: 'tug'}, {f: .7, range: 100, speed: 55, kind: 'tug'}],
      belts: [[.04, .1, 1], [.56, .62, -1], [.86, .93, 1]], birds: [], spect: [[.02, 1], [.48, -1]]},
    {id: 'guaruja', name: 'Guarujá', sub: 'Praia da Enseada', e: '🏖️', tw: 178, ww: 2500, wh: 1800, sea: x => 1560 + 30 * Math.sin(x / 210) + 14 * Math.sin(x / 71), off: .6, grip: 14, veh: 'kart',
      // Umbau 09.10. spät (Wunsch Patrick: mehr Höhen und Tiefen statt Oval): oben über den Morro do Maluf mit Kuppe, Brücke über die Schlucht im S, Tunnel bergab
      cp: [[480, 1305], [1000, 1335], [1700, 1300], [2130, 1100], [2210, 760], [2030, 450], [1680, 320], [1250, 500], [820, 320], [480, 410], [300, 690], [290, 1010]],   // kleinster Kurvenradius ≈ 229 px
      pads: [[.12, 0], [.5, -40], [.9, 40]], ramp: null, boxes: [.2, .47, .7], music: {bpm: 120, root: 1, style: 'samba'},
      obst: [[.26, -55, 'umbrella'], [.29, 50, 'umbrella'], [.93, 45, 'umbrella'], [.04, -50, 'umbrella'], [.4, 0, 'nut']],
      movers: [{f: .16, range: 105, speed: 34, kind: 'corn'}], birds: [.25, .47, .86], spect: [[.03, 1], [.15, 1], [.5, -1], [.9, 1]]},
    {id: 'sp', name: 'São Paulo', sub: 'Avenida Paulista im Feierabendverkehr', e: '🏙️', tw: 160, ww: 3100, wh: 2000, sea: null, off: .5, grip: 12, veh: 'kart',
      cp: [[700, 1740], [1300, 1780], [1900, 1760], [2450, 1690], [2780, 1430], [2800, 1000], [2560, 700], [2100, 660], [1650, 820], [1200, 720], [820, 460], [450, 600], [340, 1050], [420, 1450]],
      pads: [[.1, 0], [.4, -35], [.82, 30]], ramp: .58, boxes: [.2, .5, .77], music: {bpm: 130, root: .94, style: 'funk'},
      obst: [[.15, 30, 'cone'], [.33, -35, 'cone'], [.71, 20, 'cone'], [.9, -30, 'cone']], movers: [{f: .46, range: 115, speed: 95, kind: 'tram'}, {f: .86, range: 105, speed: 70, kind: 'moto'}],
      gates: [{f: .27, period: 5.5, closed: 1.8, kind: 'toll'}], birds: [.62], spect: [[.03, 1], [.36, -1], [.66, 1]]},
    // Minhocão: Hochstraße als Acht (Lemniskate), an der Kreuzung führt eine Brücke über die eigene Strecke; ein Bogen links-, einer rechtsherum
    {id: 'minhocao', bg: 'sp', name: 'Minhocão', sub: 'Achterbahn mit Brücke und Tunnel', e: '🛣️', tw: 150, ww: 3200, wh: 2200, sea: null, off: .5, grip: 12, veh: 'kart', cut: false, laps: 3,
      cp: Array.from({length: 16}, (_, i) => { const t = i / 16 * Math.PI * 2, d = 1 + Math.sin(t) ** 2; return [1600 + 1300 * Math.cos(t) / d, 1100 + 1.55 * 1300 * Math.sin(t) * Math.cos(t) / d]; }),
      pads: [[.1, 0], [.6, 0]], ramp: .5, boxes: [.15, .4, .65, .9], music: {bpm: 132, root: .9, style: 'funk'}, tunnels: [[.84, .96, 'Túnel Paulista']],
      obst: [[.33, 35, 'cone'], [.45, -30, 'cone'], [.83, 30, 'cone']], movers: [{f: .37, range: 100, speed: 80, kind: 'moto'}], birds: [.55], spect: [[.05, 1], [.55, -1]]},
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
    {id: 'amazon', name: 'Amazonas', sub: 'Encontro das Águas · alle im Boot', e: '🛶', laps: 2, tw: 180, ww: 3000, wh: 2300, sea: null, off: .45, grip: 4.2, veh: 'boat',
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
    {id: 'ilha', name: 'Ilha Grande', sub: 'Vila do Abraão · Gegner im Gepäckkarren', e: '🏝️', tw: 160, ww: 2500, wh: 1850, sea: x => 1580 + 26 * Math.sin(x / 230) + 12 * Math.sin(x / 61), off: .55, grip: 10, veh: 'cart',
      cp: [[350, 1300], [900, 1420], [1400, 1270], [1800, 1380], [2250, 1220], [2300, 800], [1950, 600], [1500, 760], [1100, 560], [700, 360], [300, 560], [200, 960]],
      pads: [[.1, 30], [.48, 0], [.76, -30]], ramp: .3, boxes: [.18, .55, .85], music: {bpm: 136, root: 1.19, style: 'axe'},
      obst: [[.24, -45, 'suitcase'], [.38, 40, 'suitcase'], [.66, 0, 'suitcase'], [.93, -35, 'suitcase']], movers: [{f: .6, range: 95, speed: 60, kind: 'coati'}, {f: .87, range: 95, speed: 34, kind: 'dog'}],
      birds: [.44], spect: [[.03, 1], [.2, 1], [.5, 1], [.72, -1]]},
    {id: 'lopes', name: 'Lopes Mendes', sub: 'Traumstrand mit Fußballplatz', e: '🏖️', tw: 160, ww: 3632, wh: 2540, sea: x => 2350 + 30 * Math.sin(x / 180) + 14 * Math.sin(x / 61), off: .5, grip: 11, veh: 'kart',
      cp: [[720, 2140], [994, 2140], [1268, 2140], [1542, 2140], [1816, 2140], [2090, 2140], [2364, 2140], [2638, 2140], [2912, 2140], [3035, 2116], [3139, 2046], [3208, 1942], [3232, 1820], [3232, 1539], [3214, 1437], [3162, 1346], [3082, 1279], [2866, 1154], [2649, 1029], [2564, 969], [2490, 895], [2430, 810], [2280, 550], [2213, 470], [2123, 418], [2020, 400], [1760, 400], [1500, 400], [1240, 400], [980, 400], [720, 400], [598, 424], [494, 494], [424, 598], [400, 720], [400, 995], [400, 1270], [400, 1545], [400, 1820], [424, 1942], [494, 2046], [598, 2116]],
      pads: [[.1, 0], [.45, 30], [.8, -30]], ramp: .62, boxes: [.2, .5, .78], music: {bpm: 126, root: 1.12, style: 'samba'},
      obst: [[.28, 30, 'nut'], [.55, -30, 'nut'], [.88, 25, 'umbrella']], movers: [{f: .38, range: 105, speed: 90, kind: 'soccer'}, {f: .72, range: 100, speed: 45, kind: 'dog'}],
      wave: {x0: 900, x1: 1800}, birds: [.2, .6], spect: [[.03, 1], [.33, 1], [.66, -1]]},
    // ===== Langstrecken (10.10., Wunsch Patrick: 2–3× so lang wie die Kurzstrecken, gleich viel Abwechslung) =====
    {id: 'serra', long: 1, k: 1, title: 'SERRA DO MAR', name: 'Serra do Mar', sub: 'São Paulo → Guarujá über die Imigrantes', e: '🌁', laps: 2, tw: 160, ww: 4600, wh: 3700,
      sea: x => 3490 + 24 * Math.sin(x / 200) + 10 * Math.sin(x / 63), off: .5, grip: 12, veh: 'kart',
      zones: [{th: 'sp', r: ZB(4600, 0, 840, 50)}, {th: 'cristo', r: ZB(4600, 840, 2790, 60)}, {th: 'guaruja', r: ZB(4600, 2790, 9e3, 60)}],
      cp: [[2140, 500], [2270, 506], [2530, 517], [2600, 517], [2669, 509], [3015, 455], [3361, 402], [3499, 396], [3634, 423], [3867, 497], [4099, 570], [4197, 621], [4273, 701], [4319, 802], [4328, 912], [4321, 994], [4294, 1096], [4233, 1182], [4146, 1242], [4043, 1268], [3772, 1287], [3501, 1306], [3230, 1325], [2959, 1344], [2688, 1363], [2593, 1387], [2512, 1443], [2455, 1523], [2429, 1618], [2424, 1680], [2429, 1766], [2461, 1846], [2515, 1912], [2586, 1959], [2669, 1983], [2975, 2020], [3281, 2057], [3586, 2094], [3892, 2131], [3987, 2157], [4068, 2211], [4130, 2287], [4282, 2548], [4320, 2643], [4328, 2745], [4305, 2844], [4254, 2932], [4107, 3116], [4029, 3190], [3934, 3238], [3829, 3259], [3556, 3272], [3283, 3286], [3009, 3300], [2736, 3313], [2463, 3327], [2400, 3328], [2337, 3326], [2051, 3308], [1766, 3289], [1480, 3271], [1194, 3252], [908, 3234], [851, 3226], [795, 3212], [433, 3091], [348, 3046], [281, 2977], [240, 2891], [228, 2796], [231, 2729], [246, 2650], [286, 2581], [345, 2527], [419, 2495], [498, 2488], [797, 2510], [1096, 2531], [1395, 2552], [1475, 2545], [1550, 2514], [1611, 2462], [1653, 2394], [1673, 2316], [1677, 2265], [1672, 2186], [1642, 2112], [1590, 2052], [1522, 2011], [1444, 1993], [1145, 1974], [845, 1954], [545, 1935], [456, 1912], [382, 1860], [331, 1784], [311, 1695], [310, 1651], [319, 1573], [352, 1502], [406, 1445], [474, 1407], [551, 1392], [901, 1380], [1251, 1369], [1333, 1353], [1405, 1312], [1461, 1250], [1494, 1174], [1502, 1091], [1480, 760], [1488, 673], [1525, 595], [1586, 532], [1664, 494], [1750, 483], [2010, 494]],
      pads: [[.06, 0], [.22, -30], [.33, 30], [.5, 0], [.72, -30], [.9, 30]], ramp: .58, boxes: [.1, .27, .44, .6, .76, .92], music: {bpm: 126, root: .95, style: 'epic'},
      obst: [[.03, 35, 'cone'], [.12, -35, 'car'], [.24, 30, 'stone'], [.345, -35, 'stone'], [.45, 40, 'umbrella'], [.53, -45, 'nut'], [.63, 35, 'umbrella'], [.745, -30, 'log'], [.83, 30, 'stone'], [.945, -35, 'cone']],
      movers: [{f: .08, range: 100, speed: 120, kind: 'moto'}, {f: .3, range: 100, speed: 50, kind: 'monkey'}, {f: .5, range: 105, speed: 34, kind: 'vendor'}, {f: .565, range: 105, speed: 36, kind: 'corn'}, {f: .615, range: 95, speed: 45, kind: 'dog'}, {f: .8, range: 100, speed: 50, kind: 'monkey'}, {f: .87, range: 95, speed: 50, kind: 'coati'}],
      gates: [{f: .165, period: 7, closed: 2, kind: 'toll'}], birds: [.46, .55, .7], spect: [[.02, 1], [.5, -1], [.97, -1]],
      hills: [[.64, .42, 1.25, {pl: .32, n: 'Serra do Mar'}], [.48, .535, .32, {pl: .1, jump: 1, n: 'Morro da Enseada'}]],
      tunnels: [[.045, .075, 'Túnel 9 de Julho'], [.19, .225, 'Túnel TD-1 Imigrantes'], [.305, .335, 'Túnel TD-2 Imigrantes']],
      bridges: [[.255, .29, 'Viaduto dos Imigrantes', 'gorge', {ext: [330, 330]}], [.36, .395, 'Viaduto Grota Funda', 'gorge', {ext: [330, 330]}], [.545, .565, 'Ponte do Rio Itapanhaú', 'water', {ext: [700, 700]}], [.77, .79, 'Pontilhão da Estrada Velha', 'water', {wood: 1, ext: [300, 300]}]]},
    {id: 'riotour', long: 1, k: 1, title: 'RIO DE JANEIRO', name: 'Rio Grande Tour', sub: 'Copacabana · Lagoa · Corcovado · Aterro', e: '🚡', laps: 2, tw: 155, ww: 5300, wh: 3800,
      sea: x => 3370 + 30 * Math.sin(x / 190) + 14 * Math.sin(x / 67), off: .55, grip: 13, veh: 'kart',
      zones: [{th: 'cristo', r: [[0, 0], [3356, 0], [3356, 2975], [0, 2975]]}, {th: 'sp', r: [[3350, 0], [5300, 0], [5300, 2975], [3350, 2975]]}, {th: 'copa', r: ZB(5300, 2900, 9e3, 60)}],
      cp: [[2828, 3150], [2676, 3150], [2372, 3150], [2300, 3147], [2229, 3139], [1952, 3094], [1674, 3050], [1550, 3041], [1426, 3055], [1219, 3096], [1108, 3099], [1001, 3065], [912, 2997], [851, 2903], [825, 2794], [808, 2527], [790, 2261], [773, 1994], [783, 1888], [826, 1791], [898, 1713], [990, 1662], [1095, 1642], [1398, 1636], [1702, 1629], [2006, 1622], [2310, 1615], [2613, 1609], [2737, 1624], [2851, 1676], [2944, 1758], [3009, 1864], [3040, 1985], [3056, 2134], [3049, 2263], [3001, 2382], [2918, 2480], [2808, 2547], [2683, 2575], [2388, 2593], [2094, 2611], [1800, 2629], [1693, 2618], [1596, 2573], [1518, 2500], [1467, 2405], [1450, 2299], [1450, 2004], [1450, 1708], [1450, 1412], [1450, 1117], [1450, 821], [1471, 694], [1530, 580], [1623, 491], [1739, 437], [2141, 320], [2273, 304], [2404, 330], [2520, 396], [2870, 676], [2956, 725], [3054, 745], [3153, 735], [3244, 694], [3377, 607], [3453, 569], [3536, 549], [3963, 494], [4071, 496], [4174, 531], [4262, 595], [4327, 682], [4363, 784], [4424, 1111], [4434, 1249], [4411, 1386], [4345, 1619], [4334, 1721], [4357, 1820], [4413, 1905], [4494, 1967], [4591, 1999], [4688, 2013], [4794, 2047], [4882, 2114], [4943, 2206], [4970, 2314], [4986, 2519], [4976, 2629], [4930, 2729], [4854, 2809], [4525, 3054], [4445, 3096], [4356, 3113], [4009, 3125], [3663, 3137], [3316, 3149], [2980, 3150]],
      lakes: [{e: [1850, 2100, 950, 330], c1: '#4fc3d9', c2: '#1b7fa3', boats: 8, swan: 1}, {p: [[4660, 0], [5300, 0], [5300, 3000], [5090, 3000], [5090, 1900], [4700, 1880], [4640, 1200]], c1: '#2a9fc9', c2: '#0c5f8a', shore: '#cfc2a0', boats: 7}],
      marks: [{k: 'sugarloaf', x: 4650, y: 2380, s: .7}, {k: 'stadium', x: 3850, y: 1450, s: .8, n: 'MARACANÃ'}, {k: 'favela', x: 1050, y: 1050, s: .8}], statue: {x: 2350, y: 720},
      side: [[.92, .105, 1, 'tower', 150, 60], [.92, .105, -1, 'kiosk', 520, 40], [.935, .09, -1, 'palm', 330, 150], [.115, .18, -1, 'tower', 160, 60], [.2, .43, 1, 'palm', 210, 30], [.2, .3, -1, 'tree', 200, 50], [.37, .43, -1, 'tower', 170, 60],
        [.54, .66, 1, 'tree', 170, 40], [.54, .66, -1, 'rock', 260, 40], [.665, .72, 1, 'house', 140, 40], [.665, .72, -1, 'house', 160, 40], [.73, .83, -1, 'tree', 160, 40], [.73, .83, -1, 'lamp', 220, 14], [.73, .83, 1, 'tower', 170, 60], [.84, .87, -1, 'boat', 260, 80]],
      pads: [[.03, 0], [.2, -30], [.33, 30], [.5, 0], [.68, -30], [.78, 30]], ramp: null, boxes: [.05, .22, .38, .56, .74, .86], music: {bpm: 128, root: 1.06, style: 'bossa'},
      obst: [[.015, 35, 'umbrella'], [.15, -35, 'cone'], [.25, 35, 'table'], [.4, -35, 'stall'], [.58, 30, 'stone'], [.64, -30, 'log'], [.71, 35, 'car'], [.8, -35, 'cone'], [.85, 35, 'barrel'], [.96, -40, 'umbrella']],
      movers: [{f: .04, range: 100, speed: 55, kind: 'jogger'}, {f: .13, range: 100, speed: 85, kind: 'bike'}, {f: .27, range: 100, speed: 80, kind: 'skate'}, {f: .6, range: 100, speed: 50, kind: 'monkey'}, {f: .76, range: 110, speed: 60, kind: 'bus'}, {f: .98, range: 105, speed: 34, kind: 'vendor'}],
      birds: [.1, .3, .62], spect: [[.01, 1], [.5, -1], [.97, 1]],
      hills: [[.535, .70, 1.2, {pl: .3, n: 'Corcovado'}], [.06, .09, .35, {pl: .1, jump: 1, n: 'Pedra do Arpoador'}]],
      tunnels: [[.507, .533, 'Túnel Rebouças'], [.885, .91, 'Túnel Novo']],
      bridges: [[.445, .484, 'Ponte da Lagoa', 'water', {ext: [90, 90]}]]},
    {id: 'cataratas', long: 1, k: 1.07, title: 'CATARATAS DO IGUAÇU', name: 'Cataratas', sub: 'Trilha das Cataratas · Grenzbrücke · Garganta', e: '💦', laps: 2, tw: 160, ww: 5500, wh: 3800,
      sea: null, off: .5, grip: 7, veh: 'kart',
      zones: [{th: 'iguacu', r: [[0, 0], [5500, 0], [5500, 3800], [0, 3800]]}, {th: 'paraty', r: [[4640, 0], [5500, 0], [5500, 1420], [4640, 1420]]}, {th: 'sp', r: [[4560, 2260], [5500, 2260], [5500, 3800], [4560, 3800]]}],
      cp: [[4630, 2410], [4737, 2407], [4812, 2393], [4880, 2357], [4934, 2301], [4968, 2233], [4980, 2157], [4980, 1991], [4980, 1826], [4980, 1661], [4980, 1496], [4968, 1419], [4933, 1350], [4879, 1295], [4811, 1259], [4734, 1246], [4610, 1230], [4533, 1190], [4472, 1128], [4433, 1051], [4420, 965], [4420, 837], [4420, 710], [4406, 623], [4367, 545], [4305, 483], [4227, 444], [4140, 430], [3960, 430], [3880, 443], [3807, 480], [3750, 537], [3713, 610], [3700, 690], [3700, 750], [3688, 827], [3652, 897], [3597, 952], [3527, 988], [3450, 1000], [3337, 983], [3259, 935], [3204, 862], [3178, 774], [3166, 649], [3145, 566], [3100, 493], [3034, 438], [2956, 404], [2870, 396], [2770, 402], [2682, 422], [2606, 468], [2548, 537], [2514, 620], [2508, 709], [2531, 942], [2525, 1033], [2490, 1117], [2429, 1186], [2350, 1231], [2260, 1249], [2159, 1252], [2072, 1241], [1993, 1203], [1930, 1143], [1887, 1067], [1871, 981], [1866, 823], [1851, 746], [1813, 677], [1755, 623], [1684, 590], [1560, 555], [1436, 520], [1351, 510], [1267, 526], [1191, 567], [1131, 628], [1093, 705], [1080, 790], [1080, 954], [1080, 1118], [1080, 1283], [1080, 1447], [1080, 1611], [1080, 1776], [1080, 1940], [1080, 2104], [1080, 2269], [1080, 2433], [1080, 2597], [1080, 2761], [1080, 2926], [1080, 3090], [1094, 3180], [1135, 3260], [1200, 3325], [1280, 3366], [1370, 3380], [1440, 3380], [1520, 3367], [1593, 3330], [1650, 3273], [1687, 3200], [1700, 3120], [1700, 2935], [1700, 2751], [1712, 2672], [1747, 2601], [1803, 2544], [1873, 2506], [1951, 2491], [2015, 2489], [2089, 2497], [2158, 2528], [2215, 2577], [2254, 2641], [2273, 2714], [2279, 2782], [2303, 2868], [2356, 2940], [2431, 2989], [2519, 3008], [2591, 3011], [2670, 3001], [2743, 2966], [2800, 2911], [2837, 2840], [2850, 2761], [2863, 2640], [2902, 2563], [2963, 2501], [3040, 2461], [3126, 2446], [3230, 2444], [3315, 2456], [3392, 2493], [3455, 2551], [3497, 2626], [3514, 2709], [3521, 2843], [3529, 2976], [3536, 3109], [3553, 3194], [3595, 3270], [3658, 3331], [3735, 3370], [3821, 3384], [3956, 3386], [4046, 3373], [4128, 3332], [4194, 3268], [4236, 3186], [4250, 3096], [4250, 2961], [4250, 2827], [4250, 2692], [4263, 2607], [4302, 2530], [4362, 2469], [4438, 2428], [4522, 2413]],
      lakes: [{p: [[0, 1500], [250, 1515], [500, 1523], [750, 1482], [1000, 1484], [1250, 1491], [1500, 1513], [1750, 1527], [2000, 1489], [2250, 1486], [2500, 1483], [2750, 1509], [3000, 1528], [3250, 1496], [3500, 1490], [3750, 1477], [4000, 1504], [4250, 1527], [4500, 1503], [4750, 1496], [5000, 1472], [5250, 1499], [5500, 1523], [5500, 2160], [5250, 2124], [5000, 2141], [4750, 2144], [4500, 2173], [4250, 2165], [4000, 2145], [3750, 2136], [3500, 2128], [3250, 2164], [3000, 2161], [2750, 2170], [2500, 2137], [2250, 2133], [2000, 2140], [1750, 2156], [1500, 2177], [1250, 2150], [1000, 2147], [750, 2122], [500, 2150], [250, 2160], [0, 2169]], c1: '#b5855a', c2: '#7b5233', shore: '#a5482b', boats: 7, isl: 9}],
      marks: [{k: 'cascade', x: 3560, y: 1840, s: 1.05, n: 'GARGANTA DO DIABO'}, {k: 'cascade', x: 2150, y: 1850, s: .7, n: 'SALTO FLORIANO'}, {k: 'cascade', x: 4280, y: 1835, s: .62}],
      mist: {x: 3560, y: 1840, r: 760}, tpos: [2780, 1990],
      side: [[.965, .02, 1, 'tower', 170, 60], [.965, .02, -1, 'tower', 190, 60], [.08, .125, 1, 'house', 140, 40], [.08, .125, -1, 'house', 150, 40], [.13, .5, 1, 'tree', 190, 40], [.13, .5, -1, 'rock', 330, 40],
        [.56, .95, 1, 'tree', 180, 40], [.56, .95, -1, 'palm', 360, 60], [.6, .64, -1, 'kiosk', 520, 40], [.5, .51, 1, 'crowd', 60, 40]],
      pads: [[.05, 0], [.2, -30], [.33, 30], [.47, 0], [.66, -30], [.84, 30]], ramp: .862, boxes: [.08, .24, .4, .58, .73, .9], music: {bpm: 124, root: .89, style: 'forest'},
      obst: [[.115, 35, 'cone'], [.18, -35, 'log'], [.27, 30, 'stone'], [.41, -35, 'log'], [.47, 35, 'stone'], [.6, -30, 'log'], [.68, 35, 'stone'], [.78, -35, 'log'], [.94, -35, 'cone'], [.955, 30, 'stone']],
      movers: [{f: .14, range: 100, speed: 70, kind: 'coati', n: 3}, {f: .31, range: 100, speed: 50, kind: 'monkey'}, {f: .45, range: 100, speed: 80, kind: 'bike'}, {f: .57, range: 110, speed: 30, kind: 'caiman'}, {f: .7, range: 100, speed: 70, kind: 'coati', n: 3}, {f: .86, range: 100, speed: 50, kind: 'monkey'}, {f: .985, range: 100, speed: 55, kind: 'jogger'}],
      puddles: [[.2, 30, 34], [.43, -30, 36], [.64, 25, 34], [.88, -25, 36]],
      gates: [{f: .096, period: 7, closed: 2, kind: 'toll'}], birds: [.3, .62, .8], spect: [[.02, 1], [.5, -1], [.97, -1]],
      hills: [[.6, .69, .7, {pl: .25, n: 'Trilha das Cataratas'}], [.27, .315, .45, {pl: .15, n: 'Mirador'}], [.92, .945, .32, {pl: .1, jump: 1, n: 'Salto Bossi'}]],
      tunnels: [[.375, .4, 'Túnel de Bambu'], [.79, .812, 'Túnel Verde']],
      bridges: [[.026, .074, 'Ponte da Fraternidade', 'water', {ext: [150, 150]}], [.509, .556, 'Passarela da Garganta', 'water', {wood: 1, ext: [150, 150]}]]},
    {id: 'costa', long: 1, k: 1.07, title: 'COSTA VERDE', name: 'Costa Verde', sub: 'Paraty · Serra · Angra · Fähre · Ilha Grande', e: '⛴️', laps: 2, tw: 160, ww: 5600, wh: 4100,
      sea: null, off: .5, grip: 11, veh: 'kart',
      zones: [{th: 'cristo', r: [[0, 0], [3306, 0], [3306, 2060], [0, 2060]]}, {th: 'paraty', r: [[3300, 0], [5600, 0], [5600, 2060], [3300, 2060]]}, {th: 'iguacu', r: ZB(5600, 1900, 3440, 50)}, {th: 'ilha', r: ZB(5600, 3440, 9e3, 50)}, {th: 'ilha', r: [[1584, 2560], [1596, 2657], [1447, 2721], [1351, 2782], [1288, 2862], [1165, 2909], [1035, 2962], [880, 2986], [742, 2916], [625, 2872], [460, 2871], [341, 2814], [264, 2735], [201, 2652], [264, 2560], [309, 2483], [257, 2383], [319, 2296], [465, 2253], [592, 2207], [742, 2202], [880, 2206], [1036, 2156], [1198, 2170], [1283, 2262], [1373, 2328], [1453, 2397], [1488, 2478]]}],
      cp: [[4650, 1250], [4570, 1250], [4410, 1250], [4330, 1237], [4257, 1200], [4200, 1143], [4163, 1070], [4150, 990], [4150, 780], [4137, 700], [4100, 627], [4043, 570], [3970, 533], [3890, 520], [3723, 520], [3634, 536], [3557, 584], [3501, 655], [3475, 742], [3461, 864], [3448, 985], [3427, 1061], [3385, 1127], [3325, 1178], [3252, 1208], [3174, 1216], [3122, 1213], [3033, 1192], [2957, 1141], [2903, 1067], [2878, 979], [2872, 921], [2847, 834], [2793, 762], [2717, 714], [2628, 696], [2582, 695], [2508, 704], [2441, 735], [2385, 785], [2346, 849], [2329, 922], [2321, 1002], [2296, 1092], [2241, 1167], [2163, 1218], [2071, 1238], [1999, 1241], [1920, 1231], [1847, 1196], [1790, 1141], [1753, 1070], [1740, 991], [1740, 857], [1740, 724], [1740, 590], [1727, 510], [1690, 437], [1633, 380], [1560, 343], [1480, 330], [1370, 330], [1293, 342], [1223, 378], [1168, 433], [1132, 503], [1120, 580], [1120, 625], [1109, 698], [1075, 764], [1023, 817], [958, 852], [885, 865], [835, 865], [762, 878], [697, 913], [645, 966], [611, 1032], [600, 1105], [600, 1272], [600, 1439], [600, 1606], [600, 1773], [600, 1940], [600, 2106], [600, 2273], [600, 2440], [613, 2520], [650, 2593], [707, 2650], [780, 2687], [860, 2700], [1049, 2700], [1238, 2700], [1324, 2715], [1400, 2759], [1456, 2827], [1485, 2909], [1516, 3094], [1544, 3176], [1599, 3245], [1673, 3291], [1759, 3310], [1919, 3318], [2012, 3306], [2095, 3262], [2156, 3190], [2189, 3102], [2216, 2942], [2244, 2861], [2298, 2793], [2371, 2746], [2455, 2726], [2602, 2717], [2681, 2723], [2754, 2754], [2814, 2804], [2857, 2871], [2877, 2947], [2893, 3085], [2908, 3223], [2923, 3360], [2952, 3455], [3011, 3534], [3094, 3588], [3191, 3609], [3374, 3616], [3558, 3623], [3741, 3630], [3824, 3621], [3900, 3588], [3964, 3533], [4008, 3463], [4030, 3383], [4055, 3169], [4081, 3082], [4135, 3009], [4212, 2960], [4301, 2940], [4451, 2933], [4601, 2926], [4752, 2919], [4902, 2912], [4980, 2896], [5049, 2858], [5103, 2801], [5138, 2730], [5150, 2652], [5150, 2489], [5150, 2326], [5150, 2162], [5150, 1999], [5150, 1836], [5150, 1673], [5150, 1510], [5137, 1430], [5100, 1357], [5043, 1300], [4970, 1263], [4890, 1250], [4730, 1250]],
      lakes: [{p: [[0, 1480], [200, 1496], [400, 1499], [600, 1476], [800, 1445], [1000, 1195], [1200, 1108], [1400, 1278], [1600, 1504], [1800, 1471], [2000, 1470], [2200, 1455], [2400, 1489], [2600, 1490], [2800, 1504], [3000, 1471], [3200, 1468], [3400, 1458], [3600, 1487], [3800, 1494], [4000, 1499], [4200, 1476], [4400, 1463], [4600, 1464], [4800, 1481], [5000, 1501], [5200, 1492], [5400, 1481], [5600, 1456], [5600, 2397], [5400, 2364], [5200, 2362], [5000, 2343], [4800, 2361], [4600, 2380], [4400, 2386], [4200, 2395], [4000, 2362], [3800, 2362], [3600, 2341], [3400, 2365], [3200, 2379], [3000, 2389], [2800, 2392], [2600, 2361], [2400, 2361], [2200, 2340], [2000, 2369], [1800, 2377], [1600, 2393], [1400, 2388], [1200, 2361], [1000, 2359], [800, 2341], [600, 2372], [400, 2376], [200, 2396], [0, 2384]], c1: '#36c2d0', c2: '#0e6f99', shore: '#e9d7a4', boats: 16, isl: 8}, {p: [[0, 3790], [200, 3807], [400, 3819], [600, 3784], [800, 3782], [1000, 3757], [1200, 3791], [1400, 3800], [1600, 3816], [1800, 3802], [2000, 3772], [2200, 3774], [2400, 3768], [2600, 3810], [2800, 3805], [3000, 3813], [3200, 3779], [3400, 3767], [3600, 3775], [3800, 3787], [4000, 3821], [4200, 3800], [4400, 3800], [4600, 3761], [4800, 3774], [5000, 3784], [5200, 3807], [5400, 3818], [5600, 3789], [5600, 4100], [0, 4100]], c1: '#4fd8e0', c2: '#0a5f8a', shore: '#f3e3b8', boats: 4}],
      marks: [{k: 'church', x: 4650, y: 820, s: .8}, {k: 'pedra', x: 2550, y: 3230, s: .7}], tpos: [3000, 1990],
      side: [[.975, .045, 1, 'house', 140, 40], [.975, .045, -1, 'house', 150, 40], [.06, .085, -1, 'house', 150, 40], [.1, .19, -1, 'palm', 260, 60], [.1, .19, 1, 'tree', 200, 40], [.2, .37, 1, 'tree', 170, 40], [.2, .37, -1, 'rock', 300, 40],
        [.39, .425, -1, 'container', 260, 50], [.495, .57, 1, 'house', 150, 40], [.5, .57, -1, 'kiosk', 420, 40], [.58, .72, 1, 'tree', 170, 40], [.58, .72, -1, 'tree', 210, 40], [.725, .79, 1, 'brolly', 170, 50], [.725, .79, -1, 'palm', 230, 40], [.74, .77, 1, 'crowd', 220, 120], [.81, .9, 1, 'palm', 260, 50]],
      pads: [[.03, 0], [.17, -30], [.3, 30], [.46, 0], [.62, -30], [.76, 30], [.94, 0]], ramp: .745, boxes: [.07, .22, .36, .5, .64, .79, .92], music: {bpm: 132, root: 1.12, style: 'samba'},
      obst: [[.04, 35, 'barrel'], [.12, -35, 'cone'], [.24, 30, 'stone'], [.31, -35, 'stone'], [.4, 35, 'barrel'], [.522, -35, 'suitcase'], [.532, 35, 'suitcase'], [.695, 30, 'stone'], [.705, -30, 'log'], [.845, -30, 'nut'], [.857, 30, 'umbrella']],
      movers: [{f: .02, range: 100, speed: 30, kind: 'horse'}, {f: .12, range: 100, speed: 120, kind: 'moto'}, {f: .28, range: 100, speed: 50, kind: 'monkey'}, {f: .52, range: 95, speed: 45, kind: 'dog'}, {f: .62, range: 100, speed: 70, kind: 'coati', n: 3}, {f: .765, range: 105, speed: 90, kind: 'soccer'}, {f: .79, range: 100, speed: 55, kind: 'jogger'}, {f: .88, range: 95, speed: 45, kind: 'dog'}],
      puddles: [[.06, 25, 32], [.66, -25, 34], [.99, -25, 30]],
      gates: [{f: .425, period: 7, closed: 2, kind: 'toll'}], birds: [.15, .55, .8], spect: [[.01, 1], [.52, -1], [.77, -1]],
      hills: [[.19, .375, 1.1, {pl: .3, n: 'Serra da Bocaina'}], [.585, .7, .8, {pl: .2, n: 'Pico do Papagaio'}]],
      tunnels: [[.135, .16, 'Túnel da Praia Vermelha'], [.355, .375, 'Túnel de Angra']],
      bridges: [[.43, .49, 'Balsa Angra → Abraão', 'water', {wood: 1, ext: [160, 160]}], [.905, .967, 'Ponte do Saco do Mamanguá', 'water', {wood: 1, ext: [160, 160]}]]}
  ];
  const TBY = {}; TRACKS.forEach(t => { TBY[t.id] = t; });
  // Pokale (Grand Prix): Reihenfolge wie die Reise
  const CUPS = [{id: 'sp', e: '🛬', n: 'Ankunfts-Pokal', t: ['gru', 'guaruja', 'sp', 'minhocao']}, {id: 'rio', e: '🌴', n: 'Rio-Pokal', t: ['copa', 'reveillon', 'cristo', 'bridge']},
    {id: 'wild', e: '🌿', n: 'Wildnis-Pokal', t: ['iguacu', 'amazon', 'manaus']}, {id: 'coast', e: '🏝️', n: 'Küsten-Pokal', t: ['paraty', 'ilha', 'lopes']},
    {id: 'long', e: '🛣️', n: 'Langstrecken-Pokal', t: ['serra', 'riotour', 'cataratas', 'costa']},
    {id: 'all', e: '🏆', n: 'Grand Prix do Brasil', t: ['gru', 'guaruja', 'sp', 'minhocao', 'copa', 'reveillon', 'cristo', 'bridge', 'iguacu', 'amazon', 'manaus', 'paraty', 'ilha', 'lopes']}];
  let CUPSEL = CUPS.find(c => c.id === store.get('kartCup')) || CUPS[0];

  // aktuelle Strecke (wird von loadTrack gesetzt)
  let CURV = [], LINE = [], SCURV = [], CUT = null, T = TRACKS[1], P = [], NX = [], NY = [], N = 0, TW = 150, WW = 2400, WH = 1750, PADS = [], RAMP = -1, SPECT = [], BG = null, MINI = null;
  const shore = x => T.sea ? T.sea(x) : 1e9;
  // Geheimwege: die Abkürzung je Strecke als Schleichweg mit eigenem Belag, Schild und Hindernissen (schneller als außen herum, wenn man ausweicht)
  const SECRET = {serra: ['Trilha da Serra', 'stone', '#8a7a62'], cataratas: ['Trilha do Macuco', 'log', '#8a4a2a', 1], costa: ['Steg der Fischer', 'crate', '#9a6a3a', 1], riotour: ['Steg über die Lagoa', 'crate', '#9a6a3a', 1], gru: ['Gepäckhalle', 'suitcase', '#b9bec6'], guaruja: ['Strandbar', 'umbrella', '#e8cf8f'], sp: ['Markthalle', 'stall', '#8d8778'], copa: ['Hotelfoyer', 'table', '#ddd5c6'],
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
  // Rechtsherum (Wunsch Patrick 08.10.: nicht alle Strecken gegen den Uhrzeigersinn) und Tunnel je Strecke ([von, bis, Name] als Anteil der Runde)
  const CWT = {gru: 1, reveillon: 1, cristo: 1, iguacu: 1, paraty: 1, lopes: 1};
  const TUNT = {sp: [[.55, .64, 'Túnel Ayrton Senna']], copa: [[.6, .68, 'Túnel Novo']], reveillon: [[.6, .68, 'Túnel Novo']], cristo: [[.3, .38, 'Túnel Rebouças']], gru: [[.66, .74, 'Unterführung Terminal 3']], guaruja: [[.75, .81, 'Túnel do Morro']]};
  // Absturz-Strecken: kein Bande, wer über den Rand fährt, fällt runter und wird vom Retter zurückgebracht (m = Randstreifen neben der Fahrbahn)
  /* Strecke ändert sich je Runde (Wunsch Patrick 09.10. spät, Idee 13): ab Runde 2 (r: 2) bzw. in der letzten Runde (r: 'last') passiert auf jeder Strecke etwas.
     Auslöser = Runde des Führenden (live zählen fremde Karts mit); alle Positionen fest in den Daten, kein Zufall → auf allen Handys gleich.
     obst [Anteil, Versatz, Art] fallen von oben, mov [Anteil, Art, Reichweite, Tempo] = neue Querläufer, pud [Anteil, Versatz, Radius] = Pfützen, dol = Delfine,
     tod = Tageszeit, rain = Regen (rutschiger), wave = Wellen-Abstand [von, bis], wh = Wellenhöhe, belt = Gepäckbänder ×, fog = Nebel ×, wind = Böen-Abstand, flood = Flut ×, fw = Feuerwerk × */
  const LAPX = {
    gru: [{r: 2, e: '🧳', t: 'Gepäck-Chaos! Koffer auf dem Rollfeld', obst: [[.1, -35, 'suitcase'], [.42, -15, 'suitcase'], [.6, 40, 'suitcase'], [.84, -30, 'suitcase']]},
      {r: 'last', e: '⚡', t: 'Gepäckbänder auf Turbo!', belt: 2}],
    guaruja: [{r: 2, e: '🌅', t: 'Sonnenuntergang über Guarujá', tod: 'dusk', alt: {e: '🌽', t: 'Maisverkäufer-Invasion!', mov: [[.4, 'corn', 95, 36], [.86, 'corn', 95, 42]]}},
      {r: 'last', e: '🌙', t: 'Nacht über dem Morro! Licht an!', tod: 'night', alt: {e: '⛈️', t: 'Wolkenbruch am Morro! Rutschig!', rain: 2}}],
    sp: [{r: 2, e: '🛵', t: 'Rushhour! Motoboys überall', mov: [[.1, 'moto', 50, 120], [.35, 'moto', 55, 130], [.62, 'moto', 50, 115]]}, {r: 'last', e: '🌧️', t: 'Platzregen über São Paulo! Rutschig!', rain: 1}],
    minhocao: [{r: 2, e: '🏃', t: 'Sonntag! Der Minhocão wird zum Park', mov: [[.08, 'jogger', 55, 55], [.3, 'bike', 60, 85], [.52, 'jogger', 55, 60], [.7, 'skate', 60, 80], [.95, 'bike', 60, 90]]},
      {r: 'last', e: '🍉', t: 'Straßenfest! Stände auf der Fahrbahn', obst: [[.2, 40, 'stall'], [.45, -40, 'stall'], [.6, 35, 'stall'], [.85, -38, 'stall']]}],
    copa: [{r: 2, e: '🌊', t: 'Die Wellen werden höher!', wave: [6, 9], wh: 1.15}, {r: 'last', e: '🌊', t: 'Springflut! Die Strandstraße säuft ab', wave: [4, 6], wh: 1.35}],
    reveillon: [{r: 2, e: '🍾', t: 'Mitternacht! Feliz Ano Novo!', fw: 3, obst: [[.1, 30, 'champ'], [.33, -30, 'champ'], [.58, 25, 'champ'], [.88, -28, 'champ']]}, {r: 'last', e: '🌊', t: 'Alle springen über sieben Wellen!', wave: [3, 4.5], wh: 1.2}],
    cristo: [{r: 'last', e: '🌫️', t: 'Der Nebel wird dichter … und die Affen frecher', fog: 1.3, mov: [[.15, 'monkey', 90, 55], [.88, 'monkey', 90, 50]]}],
    bridge: [{r: 'last', e: '🚗', t: 'Stau auf der Ponte! Eine Spur ist dicht', wind: [3, 5], obst: [[.3, 38, 'car'], [.325, 38, 'van'], [.35, 38, 'car'], [.62, -38, 'car'], [.645, -38, 'car'], [.67, -38, 'van']]}],
    iguacu: [{r: 'last', e: '⛈️', t: 'Wolkenbruch! Pfützen überall', rain: 2, pud: [[.1, -25, 30], [.35, 25, 32], [.6, -20, 30], [.9, 22, 32]]}],
    amazon: [{r: 'last', e: '🐊', t: 'Die Kaimane haben Hunger!', mov: [[.05, 'caiman', 80, 26], [.55, 'caiman', 80, 24]], dol: [.4, .92]}],
    manaus: [{r: 'last', e: '🏗️', t: 'Der Kran lässt Container fallen!', obst: [[.12, 35, 'crate'], [.3, -35, 'crate'], [.55, 30, 'crate'], [.7, -30, 'crate'], [.92, 35, 'crate']]}],
    paraty: [{r: 'last', e: '🌊', t: 'Springflut in Paraty!', flood: 1.35, pud: [[.2, 20, 30], [.55, -22, 30], [.85, 18, 28]]}],
    ilha: [{r: 2, e: '🧳', t: 'Koffer fallen vom Karren!', obst: [[.1, 30, 'suitcase'], [.35, -30, 'suitcase'], [.65, 28, 'suitcase']]}, {r: 'last', e: '🐕', t: 'Die Inselhunde wollen mitspielen!', mov: [[.25, 'dog', 95, 45], [.75, 'dog', 95, 40]]}],
    costa: [{r: 'last', e: '⛴️', t: 'Die Fähre ist da! Touristen-Ansturm in Abraão, Springflut in Paraty', pud: [[.03, -25, 34], [.06, 25, 36], [.97, 20, 34]], mov: [[.53, 'jogger', 90, 55], [.56, 'dog', 90, 50], [.78, 'jogger', 90, 60]], obst: [[.515, 30, 'suitcase'], [.535, -30, 'suitcase']]}],
    cataratas: [{r: 'last', e: '⛈️', t: 'Wolkenbruch über den Fällen! Die Nasenbären-Bande räumt die Trilha ab', rain: 1, pud: [[.15, -25, 34], [.33, 25, 34], [.66, -25, 36], [.82, 25, 34]], mov: [[.25, 'coati', 100, 75], [.62, 'coati', 100, 75], [.9, 'coati', 100, 75]]}],
    serra: [{r: 'last', e: '🌧️', t: 'Regen über der Serra … und Lkw auf der Imigrantes!', rain: 1, obst: [[.2, 38, 'van'], [.28, -38, 'car'], [.37, 38, 'van']], mov: [[.84, 'monkey', 95, 55]]}],
    riotour: [{r: 'last', e: '🥁', t: 'Bloco de Carnaval! Die Avenida gehört den Tänzern', mov: [[.02, 'jogger', 95, 60], [.08, 'skate', 95, 80], [.97, 'bike', 95, 85]], obst: [[.6, 35, 'stall'], [.76, -35, 'stall']]}],
    lopes: [{r: 2, e: '⚽', t: 'Footvolley-Turnier! Bälle überall', mov: [[.1, 'soccer', 100, 85], [.6, 'soccer', 100, 95]]}, {r: 'last', e: '🌊', t: 'Die Flut kommt!', wave: [5, 7], wh: 1.2}]};
  const OBR = {crate: 22, umbrella: 24, log: 26, suitcase: 20, stone: 18, nut: 20, cone: 16, champ: 16, car: 26, van: 28, stall: 22};
  const FALLT = {bridge: {m: 30, e: '🚁', n: 'Rettungshubschrauber', t: 'Ab in die Guanabara-Bucht!', w: 1, rim: '#8d949c'}, minhocao: {m: 26, e: '🏗️', n: 'Baukran', t: 'Vom Minhocão gestürzt!', rim: '#8a8a86'},
    cristo: {m: 34, e: '🦅', n: 'Urubu', t: 'Den Corcovado runter!', rim: '#6d655c'}, iguacu: {m: 38, e: '🦜', n: 'Riesen-Arara', t: 'Ab in die Teufelsschlucht!', w: 1, rim: '#4d3a2c'}};
  /* Höhen und Tiefen (Wunsch Patrick 09.10. spät: Brücken, Berg hoch und runter, Tunnel). Hügel je Strecke [von, bis, Höhe 0–1, {pl = Anteil Plateau,
     jump = Kuppe mit Sprung oben, n = Name}] entlang der Fahrtrichtung (Anteil der Runde). Bergauf bremst, bergab schiebt (±15 %), oben wirkt das Kart größer
     mit längerem Schatten, Hänge als Terrassen im Hintergrund. Brücken [von, bis, Name, Art water/gorge/road]: Deck mit Geländer (= Bande dicht an der Fahrbahn),
     darunter Wasser, Schlucht bzw. eine Straße. */
  const HILLT = {guaruja: [[.33, .85, 1, {pl: .5, jump: 1, n: 'Morro do Maluf'}]], gru: [[.1, .45, .75, {pl: .45, n: 'Abflugebene'}]], lopes: [[.17, .46, .85, {pl: .25, jump: 1, n: 'Trilha do Pouso'}]],
      cristo: [[.0, .6, 1.3, {pl: .55, n: 'Corcovado'}]], bridge: [[.5, .8, .9, {pl: .25, n: 'Vão central'}]]},
    BRGT = {guaruja: [[.57, .64, 'Ponte da Serra', 'gorge', {ext: [110, 1000]}]], gru: [[.19, .33, 'Abflugebene', 'road', {ext: [330, 420]}]], lopes: [[.665, .705, 'Holzbrücke', 'water', {wood: 1, ext: [900, 260]}]]},
    HILLW = {gru: [50, 22]},   // Breite der Terrassen [Zuschlag, je Stufe] (Rampe am Flughafen schmal)
    HILLC = {gru: ['#868c94', '#92989f', '#9ea4ab', '#aab0b7', '#b6bcc3'], gru_bare: 1, bridge: null, minhocao: null, sp: null,
      cristo: ['#2c5a26', '#35672d', '#3f7535', '#4a833e', '#579149'], lopes: ['#3f7a34', '#4b893c', '#579645', '#64a34f', '#73b05b']};   // Hangfarben je Höhenstufe (null = keine Terrassen, z. B. Brücke übers Wasser)
  let TUN = [], DECK = null, FALL = null, HGT0 = null, HGT = null, SLP = null, CRESTS = [], BRG = [], HILLS = [];
  const inTun = i => TUN.some(U => wrap(i - U.i0) <= U.len), inBrg = i => BRG.some(U => wrap(i - U.i0) <= U.len);
  const hgt = i => HGT ? HGT[wrap(Math.round(i || 0))] || 0 : 0, slp = i => SLP ? SLP[wrap(Math.round(i || 0))] || 0 : 0;
  function loadTrack(id, rev) {
    const B = TBY[id] || TRACKS[1], k = B.k || 1.15; rev = !!rev !== !!CWT[id];   // alle Strecken etwas größer (länger, weitere Kurven)
    T = Object.assign({}, B, {cp: B.cp.map(p => [p[0] * k, p[1] * k]), ww: Math.round(B.ww * k), wh: Math.round(B.wh * k), sea: B.sea ? (x => B.sea(x / k) * k) : null,
      falls: B.falls && {x: B.falls.x * k, y: B.falls.y * k}, statue: B.statue && {x: B.statue.x * k, y: B.statue.y * k}, zones: B.zones && B.zones.map(z => ({th: z.th, r: z.r.map(p => [p[0] * k, p[1] * k])})), lakes: B.lakes && B.lakes.map(L => Object.assign({}, L, {e: L.e && [L.e[0] * k, L.e[1] * k, L.e[2] * k, L.e[3] * k], p: L.p && L.p.map(p => [p[0] * k, p[1] * k])})),
      marks: B.marks && B.marks.map(M => Object.assign({}, M, {x: M.x * k, y: M.y * k, s: (M.s || 1) * Math.sqrt(k)})), tpos: B.tpos && [B.tpos[0] * k, B.tpos[1] * k], mist: B.mist && {x: B.mist.x * k, y: B.mist.y * k, r: B.mist.r * k}, wave: B.wave && {x0: B.wave.x0 * k, x1: B.wave.x1 * k}});
    LAPS = T.laps || 3; TW = T.tw; WW = T.ww; WH = T.wh; buildPath(rev ? T.cp.slice().reverse() : T.cp);
    PADS = (T.pads || []).map(([f, l]) => ({i: wrap(f * N), l})); RAMP = T.ramp ? wrap(T.ramp * N) : -1;
    // Krümmung (rad/px, + = Rechtskurve) und Ideallinie (Kurveninnenseite, geglättet) für die KI
    const ang = i => Math.atan2(NX[wrap(i)], -NY[wrap(i)]);
    CURV = P.map((_, i) => angd(ang(i + 8), ang(i - 8)) / 96);
    const cs = CURV.map((_, i) => { let s0 = 0; for (let j = -25; j <= 25; j++) s0 += CURV[wrap(i + j)]; return s0 / 51; });
    SCURV = cs; LINE = cs.map(c => clamp(c * TW * 55, -TW * .3, TW * .3));
    FALL = FALLT[T.id] || null;
    HGT = new Float32Array(N); CRESTS = []; HILLS = [];
    (T.hills || HILLT[T.id] || []).forEach(([a, b, h, o]) => { o = o || {}; const i0 = wrap(Math.round(a * N)), len = wrap(Math.round(b * N) - i0), pl = o.pl === undefined ? .25 : o.pl, r = (1 - pl) / 2;
      for (let j = 0; j <= len; j++) { const u = j / len, f = u < r ? Math.sin(Math.PI / 2 * u / r) ** 2 : u > 1 - r ? Math.sin(Math.PI / 2 * (1 - u) / r) ** 2 : 1, q = wrap(i0 + j); HGT[q] = Math.max(HGT[q], h * f); }
      if (o.jump) CRESTS.push(wrap(i0 + Math.round(len * r))); HILLS.push({i0, len, r, h, o}); });
    SLP = Float32Array.from(HGT, (_, i) => (HGT[wrap(i + 3)] - HGT[wrap(i - 3)]) / 6);   // Steigung je Abtastpunkt (6 px), + = bergauf
    BRG = (T.bridges || BRGT[T.id] || []).map(([a, b, nm, kd, o]) => { const i0 = wrap(Math.round(a * N)), len = wrap(Math.round(b * N) - i0), pth = new Path2D(); for (let j = 0; j <= len; j++) { const q = P[wrap(i0 + j)]; j ? pth.lineTo(q[0], q[1]) : pth.moveTo(q[0], q[1]); } return {i0, len, pth, nm, kd: kd || 'water', o: o || {}}; });
    TUN = (T.tunnels || TUNT[T.id] || []).map(([a, b, nm]) => { const i0 = wrap(a * N), len = wrap(b * N - i0), pth = new Path2D(); for (let j = 0; j <= len; j++) { const q = P[wrap(i0 + j)]; j ? pth.lineTo(q[0], q[1]) : pth.moveTo(q[0], q[1]); } return {i0, len, pth, nm}; });
    // Kreuzung mit sich selbst (Acht): die zweite Durchfahrt wird zur Brücke
    DECK = null; for (let i = 0; i < N && !DECK; i += 2) for (let j = i + Math.round(N * .25); j < N - Math.round(N * .1); j += 2) { if (Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]) < 14) { const i0 = wrap(j - 34), len = 68, pth = new Path2D(); for (let q = 0; q <= len; q++) { const pp = P[wrap(i0 + q)]; q ? pth.lineTo(pp[0], pp[1]) : pth.moveTo(pp[0], pp[1]); } DECK = {i0, len, pth, under: i}; break; } }
    HGT0 = HGT.slice();   // nur Berge (für Hangstufen im Hintergrund), ohne die optische Anhebung der Hochstraße
    if (DECK) for (let q = -45; q <= DECK.len + 45; q++) { const u = q < 0 ? (q + 45) / 45 : q > DECK.len ? (DECK.len + 45 - q) / 45 : 1, i = wrap(DECK.i0 + q); HGT[i] = Math.max(HGT[i], .55 * Math.sin(Math.PI / 2 * u) ** 2); }   // Hochstraße: oben größer gezeichnet (nur Optik, SLP schon berechnet)
    // Abkürzung: kürzeste sichere Verbindung zweier Streckenstellen durchs Innere (holprig, mit Turbo-Pfeil in der Mitte)
    CUT = null; if (T.cut !== false && T.veh !== 'boat') {
      // Abkürzung neu (Wunsch Patrick 08.10.): kurze Sehne, Schlamm bremst so stark, dass sie ohne Turbo kaum etwas bringt.
      // Zweiter, lockererer Durchgang für Strecken, auf denen die strenge Suche nichts findet (Guarujá, Cristo, Iguaçu)
      const findCut = (rmin, rmax, dmax, clr) => { const cand = [];
        for (let i = Math.round(N * .1); i < N * .9; i += 6) for (let d = Math.round(N * .08); d < N * dmax; d += 6) { const j = i + d; if (j > N * .92) continue;
          const dist = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]), r = dist / (d * 6); if (dist < 200 || r < rmin || r > rmax) continue; cand.push({i, j, dist, r, save: d * 6 - dist}); }
        cand.sort((p0, p1) => p1.save - p0.save);
        for (const c of cand.slice(0, 600)) { let ok = true; const qm = Math.min(.4, (TW / 2 + 70) / c.dist); for (let q = qm; q <= 1 - qm && ok; q += .04) { const x = P[c.i][0] + (P[c.j][0] - P[c.i][0]) * q, y = P[c.i][1] + (P[c.j][1] - P[c.i][1]) * q, nl = nearest(x, y, -1)[1];
            if (Math.abs(nl) < TW / 2 + clr || y > shore(x) - 60) ok = false; if (T.falls && Math.hypot(x - T.falls.x, y - T.falls.y) < 300) ok = false; if (T.statue && Math.hypot(x - T.statue.x, y - T.statue.y) < 160) ok = false; }
          if (ok) return {i1: c.i, i2: c.j, a: P[c.i], b: P[c.j], w: 74, f: clamp(c.r / .97, .45, .9)}; } return null; };
      CUT = findCut(.42, .74, .22, 45) || findCut(.3, .82, .3, 34); }
    LINE = LINE.map((_, i) => { let s0 = 0; for (let j = -12; j <= 12; j++) s0 += LINE[wrap(i + j)]; return s0 / 25; });
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
  // Belag-Texturen (Qualitätsrunde 2): Asphalt mit Körnung, Teerfugen und Flicken bzw. Erdweg mit Kieseln und Flecken, nahtlos kachelbar
  /* eigener Zufall (fester Startwert): verbraucht nichts vom gemeinsamen Live-Zufall */
  function grainPat(base, kind) { return sprite(160, 160, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); let sd = 1234567; const rr = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296, R = (a, b) => a + rr() * (b - a);
    if (kind === 'asph') { for (let j = 0; j < 3; j++) { c.fillStyle = `rgba(0,0,0,${R(.05, .1)})`; c.fillRect(R(0, w - 50), R(0, h - 40), R(30, 60), R(20, 45)); }
      c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1.4; for (let j = 0; j < 2; j++) { let X = R(0, w), Y = 0; c.beginPath(); c.moveTo(X, Y); while (Y < h) { X += R(-8, 8); Y += R(8, 18); c.lineTo(X, Y); } c.stroke(); } }
    else for (let j = 0; j < 10; j++) { c.fillStyle = `rgba(${rr() < .5 ? '60,35,15' : '255,240,210'},${R(.06, .14)})`; c.beginPath(); c.ellipse(R(0, w), R(0, h), R(8, 22), R(5, 14), R(0, 3), 0, TAU); c.fill(); }
    for (let j = 0; j < 1400; j++) { const l = rr() < .5; c.fillStyle = l ? `rgba(255,255,255,${R(.04, .16)})` : `rgba(0,0,0,${R(.05, .2)})`; const s0 = R(.8, kind === 'asph' ? 2 : 2.8); c.fillRect(R(0, w), R(0, h), s0, s0); }
    if (kind !== 'asph') for (let j = 0; j < 40; j++) { c.fillStyle = `rgba(${rr() < .5 ? '120,110,100' : '200,190,170'},.7)`; c.beginPath(); c.arc(R(2, w - 2), R(2, h - 2), R(1.2, 2.6), 0, TAU); c.fill(); } }); }
  function drawBG() {
    // Auflösung des Hintergrunds: nach Grafikstufe, aber höchstens ~6,5 Mio. Pixel und 4000 px Kante (größere Bilder machten das Zeichnen 10× langsamer, z. B. Brücke, Lopes; Handys haben oft 4096 px als Grenze)
    // Langstrecken (10.10.): größere Welt, daher etwas mehr Pixel erlaubt (~10 Mio., Kante höchstens 3800 px)
    const BGS = T.long ? Math.min([.6, .72, .85][SET.q], Math.sqrt(10e6 / (WW * WH)), 3800 / Math.max(WW, WH)) : Math.min([.7, .85, 1][SET.q], Math.sqrt(6.5e6 / (WW * WH)), 4000 / Math.max(WW, WH));
    const paintBG = (x, id) => {
      const path = new Path2D(); P.forEach((p, i) => i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])); path.closePath();
      x.lineJoin = 'round'; x.lineCap = 'round';
      const DF = T.long ? Math.max(1, WW * WH / 8e6) : 1, noise = (n, c1, c2) => { for (let i = 0, n0 = n * DF; i < n0; i++) { x.fillStyle = Math.random() < .5 ? c1 : c2; x.fillRect(Math.random() * WW, Math.random() * WH, 2, 2); } };
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
        for (let k = 0; k < 520 * DF; k++) canopy(x, rnd(0, WW), rnd(0, WH), rnd(26, 60), k);
      } else if (id === 'sp') {   // Hochhäuser von oben, Straßenraster
        x.fillStyle = '#7d8187'; x.fillRect(0, 0, WW, WH); noise(3000, 'rgba(0,0,0,.18)', 'rgba(255,255,255,.12)');
        for (let X = 0; X < WW; X += 230) { x.fillStyle = '#5d6066'; x.fillRect(X, 0, 26, WH); } for (let Y = 0; Y < WH; Y += 230) { x.fillStyle = '#5d6066'; x.fillRect(0, Y, WW, 26); }
        for (let X = 30; X < WW; X += 230) for (let Y = 30; Y < WH; Y += 230) { if (!free(X + 95, Y + 95, 50)) continue; const h = rnd(.3, 1), c = pick(['#c9ccd2', '#aeb4bd', '#d8d2c4', '#9fb3c8', '#e4e1da']);
          x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(X + 18 * h + 6, Y + 18 * h + 6, 190, 190); x.fillStyle = c; x.fillRect(X, Y, 190, 190); x.fillStyle = 'rgba(80,140,200,.45)';
          for (let a2 = 0; a2 < 5; a2++) for (let b2 = 0; b2 < 5; b2++) x.fillRect(X + 14 + a2 * 36, Y + 14 + b2 * 36, 22, 22); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(X, Y, 190, 8); }
      } else if (id === 'cristo') {   // grüner Berg, Felsen, oben die Statue
        x.fillStyle = '#2f7a3a'; x.fillRect(0, 0, WW, WH); for (let k2 = 0; k2 < 420 * DF; k2++) canopy(x, rnd(0, WW), rnd(0, WH), rnd(24, 54), k2);
        for (let k2 = 0; k2 < 50 * DF; k2++) { x.fillStyle = 'rgba(120,110,100,.8)'; x.beginPath(); x.ellipse(rnd(0, WW), rnd(0, WH), rnd(20, 50), rnd(14, 30), rnd(0, 3), 0, TAU); x.fill(); }
      } else if (id === 'gru') {   // Terminal: Fliesen, Gates, Gepäckhaufen
        x.fillStyle = '#c4c8ce'; x.fillRect(0, 0, WW, WH); x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; for (let X = 0; X < WW; X += 80) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, WH); x.stroke(); } for (let Y = 0; Y < WH; Y += 80) { x.beginPath(); x.moveTo(0, Y); x.lineTo(WW, Y); x.stroke(); }
        for (let X = 60; X < WW - 200; X += 420) { x.fillStyle = '#2b5f9e'; x.fillRect(X, 20, 260, 90); x.fillStyle = '#ffd23f'; x.font = '900 40px system-ui'; x.textAlign = 'center'; x.fillText('GATE ' + (X / 420 + 1 | 0), X + 130, 80); }
        x.strokeStyle = '#e8b400'; x.lineWidth = 7; for (let q = 0; q < 5; q++) { const y0 = 260 + q * (WH - 300) / 5 + rnd(-40, 40); x.beginPath(); for (let X = -20; X <= WW + 20; X += 40) { const Y = y0 + Math.sin(X / 520 + q * 1.7) * 90; X < 0 ? x.moveTo(X, Y) : x.lineTo(X, Y); } x.stroke(); }   // Rollweg-Linien
        x.strokeStyle = 'rgba(232,180,0,.7)'; x.lineWidth = 5; for (let X = 150; X < WW; X += 420) { x.beginPath(); x.moveTo(X + 130, 110); x.lineTo(X + 130, 240); x.stroke(); }
        scatter(x, 12, 40, (X, Y) => { if (Y < 160) return; for (let q = 0; q < 4; q++) { x.fillStyle = pick(['#d62828', '#2b5f9e', '#f2b600', '#333', '#7b4ea0']); x.fillRect(X + rnd(-30, 30), Y + rnd(-20, 20), rnd(26, 40), rnd(36, 50)); } });
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
        for (let X = 20; X < WW; X += 120) for (let Y = 20; Y < Math.min(WH, shore(X) - 210); Y += 120) { if (!free(X + 50, Y + 50, 60)) continue;
          x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(X + 6, Y + 6, 96, 96); x.fillStyle = '#c4553a'; x.fillRect(X, Y, 96, 96); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(X + 48, Y, 48, 96);
          x.fillStyle = '#f7f2e8'; x.fillRect(X, Y + 82, 96, 14); const dc = pick(['#2f6fd6', '#1d9a5b', '#e3a21a', '#c0392b']); x.fillStyle = dc; for (let d = 0; d < 3; d++) x.fillRect(X + 10 + d * 30, Y + 84, 14, 12); }
      }
      // Langstrecken: Seen/Buchten (Lagoa, Guanabara, Flüsse) und Wahrzeichen, unter der Fahrbahn
      (T.lakes || []).forEach((L, li) => { x.save(); x.beginPath(); if (L.e) x.ellipse(L.e[0], L.e[1], L.e[2], L.e[3], L.rot || 0, 0, TAU); else L.p.forEach((p0, j) => j ? x.lineTo(p0[0], p0[1]) : x.moveTo(p0[0], p0[1])); x.closePath();
        x.strokeStyle = L.shore || '#d9c89a'; x.lineWidth = 46; x.stroke(); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 8; x.stroke();
        const bb = L.e ? [L.e[0] - L.e[2], L.e[1] - L.e[3], L.e[0] + L.e[2], L.e[1] + L.e[3]] : L.p.reduce((a, p0) => [Math.min(a[0], p0[0]), Math.min(a[1], p0[1]), Math.max(a[2], p0[0]), Math.max(a[3], p0[1])], [1e9, 1e9, -1e9, -1e9]);
        const g = x.createLinearGradient(bb[0], bb[1], bb[2], bb[3]); g.addColorStop(0, L.c1 || '#3fb6d0'); g.addColorStop(1, L.c2 || '#16799e'); x.fillStyle = g; x.fill(); x.clip();
        x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 3; for (let q = 0; q < (bb[2] - bb[0]) * (bb[3] - bb[1]) / 9000; q++) { const X = rnd(bb[0], bb[2]), Y = rnd(bb[1], bb[3]); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + 14, Y - 6, X + 28, Y); x.stroke(); }
        for (let q = 0; q < (L.isl || 0); q++) { const X = rnd(bb[0] + 150, bb[2] - 150), Y = rnd(bb[1] + 110, bb[3] - 110), r0 = rnd(40, 75); if (!free(X, Y, 130) || (T.marks || []).some(M => Math.hypot(X - M.x, Y - M.y) < 330 * (M.s || 1))) continue;   // Inseln mit Urwald
          x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(X + 10, Y + 12, r0 * 1.3, r0 * .8, 0, 0, TAU); x.fill(); x.fillStyle = L.shore || '#a5482b'; x.beginPath(); x.ellipse(X, Y, r0 * 1.3, r0 * .8, 0, 0, TAU); x.fill();
          for (let j = 0; j < 4; j++) canopy(x, X + rnd(-r0 * .7, r0 * .7), Y + rnd(-r0 * .35, r0 * .35), rnd(22, 32), q * 5 + j); }
        for (let q = 0; q < (L.boats || 0); q++) { const X = rnd(bb[0] + 60, bb[2] - 60), Y = rnd(bb[1] + 60, bb[3] - 60), a = rnd(0, TAU); if (!free(X, Y, 60)) continue; x.save(); x.translate(X, Y); x.rotate(a);
          if (L.swan) { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-34, -2, 22, 4); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(0, 0, 18, 11, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(14, -4, 6, 5, 0, 0, TAU); x.fill(); x.fillStyle = '#ff9f1c'; x.fillRect(19, -5, 6, 3); }
          else { x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(-60, -3, 34, 6); x.fillStyle = pick(['#fff', '#ffd23f', '#e8383d', '#2f7de1']); x.beginPath(); x.moveTo(-26, -10); x.lineTo(20, -10); x.lineTo(32, 0); x.lineTo(20, 10); x.lineTo(-26, 10); x.closePath(); x.fill(); x.fillStyle = '#7a5230'; x.fillRect(-14, -5, 18, 10); }
          x.restore(); }
        x.restore(); });
      (T.marks || []).forEach(M => { const {x: mx, y: my} = M, s0 = M.s || 1; x.save(); x.translate(mx, my); x.scale(s0, s0);
        if (M.k === 'sugarloaf' || M.k === 'pedra') { const rock = (cx, cy, rx, ry) => { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(cx + 26, cy + 30, rx, ry, 0, 0, TAU); x.fill(); const g = x.createRadialGradient(cx - rx * .3, cy - ry * .35, 10, cx, cy, rx); g.addColorStop(0, '#c9c1b3'); g.addColorStop(.6, '#8e877b'); g.addColorStop(1, '#5d574e'); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fill();
            x.fillStyle = 'rgba(60,120,60,.55)'; for (let q = 0; q < 9; q++) { x.beginPath(); x.arc(cx + rnd(-rx * .7, rx * .7), cy + rnd(-ry * .7, ry * .7), rnd(10, 22), 0, TAU); x.fill(); } };
          if (M.k === 'sugarloaf') { rock(-130, 60, 130, 100); rock(120, -50, 170, 130); x.strokeStyle = '#222'; x.lineWidth = 3; x.beginPath(); x.moveTo(-130, 60); x.lineTo(120, -50); x.stroke(); x.beginPath(); x.moveTo(-130, 60); x.lineTo(-330, 190); x.stroke();
            [[-5, 5], [-230, 125]].forEach(([cx, cy]) => { x.fillStyle = '#d62828'; x.fillRect(cx - 12, cy - 8, 24, 16); x.fillStyle = '#9fd3ff'; x.fillRect(cx - 8, cy - 5, 16, 6); });
            x.font = '900 28px system-ui,sans-serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText('PÃO DE AÇÚCAR', 0, 200); }
          else rock(0, 0, 150, 110); }
        else if (M.k === 'stadium') { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(20, 26, 260, 180, 0, 0, TAU); x.fill(); x.fillStyle = '#e9e5dc'; x.beginPath(); x.ellipse(0, 0, 260, 180, 0, 0, TAU); x.fill();
          x.fillStyle = '#2f9e44'; x.beginPath(); x.ellipse(0, 0, 175, 105, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 4; x.strokeRect(-130, -70, 260, 140); x.beginPath(); x.moveTo(0, -70); x.lineTo(0, 70); x.stroke(); x.beginPath(); x.arc(0, 0, 26, 0, TAU); x.stroke();
          for (let q = 0; q < 220; q++) { const a = rnd(0, TAU), r0 = rnd(.75, .97); x.fillStyle = pick(['#ffd23f', '#2f9e44', '#fff', '#e8383d', '#2f7de1']); x.fillRect(Math.cos(a) * 250 * r0, Math.sin(a) * 172 * r0, 5, 5); }
          x.font = '900 30px system-ui,sans-serif'; x.textAlign = 'center'; x.fillStyle = '#1c3d6e'; x.fillText(M.n || 'MARACANÃ', 0, 230); }
        else if (M.k === 'cascade') { const R0 = 260, ry = R0 * .62;   // Wasserfall-Hufeisen (Iguaçu): oben der Fluss, Felskante, weiße Vorhänge, Schlund mit Gischt
          x.fillStyle = 'rgba(30,18,10,.45)'; x.beginPath(); x.ellipse(0, 18, R0 * .98, ry * .98, 0, 0, TAU); x.fill();
          const g = x.createRadialGradient(0, 30, 10, 0, 20, R0 * .8); g.addColorStop(0, '#f4fdff'); g.addColorStop(.35, '#bfe9f2'); g.addColorStop(.75, '#5aa7b8'); g.addColorStop(1, '#3d6f6a'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 22, R0 * .8, ry * .78, 0, 0, TAU); x.fill();
          x.strokeStyle = '#4a3a2c'; x.lineWidth = 34; x.lineCap = 'round'; x.beginPath(); x.ellipse(0, 0, R0, ry, 0, Math.PI * .92, Math.PI * 2.08); x.stroke();
          x.strokeStyle = '#6b5640'; x.lineWidth = 12; x.beginPath(); x.ellipse(0, -8, R0 + 10, ry + 8, 0, Math.PI * .95, Math.PI * 2.05); x.stroke();
          for (let a = Math.PI * .95; a < Math.PI * 2.05; a += .05) { const cx0 = Math.cos(a) * R0, cy0 = Math.sin(a) * ry, len = rnd(.22, .34); x.strokeStyle = `rgba(255,255,255,${rnd(.65, .95)})`; x.lineWidth = rnd(6, 11); x.beginPath(); x.moveTo(cx0, cy0); x.lineTo(cx0 * (1 - len), cy0 * (1 - len) + 26); x.stroke(); }
          for (let q = 0; q < 26; q++) { const a = rnd(0, TAU), r = rnd(0, .62); x.fillStyle = `rgba(255,255,255,${rnd(.15, .4)})`; x.beginPath(); x.arc(Math.cos(a) * R0 * r, 24 + Math.sin(a) * ry * r, rnd(14, 34), 0, TAU); x.fill(); }
          x.strokeStyle = 'rgba(255,120,200,.35)'; x.lineWidth = 7; [0, 1, 2].forEach(j => { x.strokeStyle = ['rgba(255,90,90,.3)', 'rgba(255,230,90,.3)', 'rgba(90,170,255,.3)'][j]; x.beginPath(); x.arc(0, 60, R0 * .55 - j * 8, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); });   // Regenbogen in der Gischt
          if (M.n) { x.font = '900 30px system-ui,sans-serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(M.n, 0, ry + 62); } }
        else if (M.k === 'church') { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-60, -40, 150, 200); x.fillStyle = '#f7f2e8'; x.fillRect(-80, -60, 160, 200); x.fillStyle = '#c4553a'; x.beginPath(); x.moveTo(-90, -60); x.lineTo(0, -130); x.lineTo(90, -60); x.closePath(); x.fill();
          x.fillStyle = '#f7f2e8'; x.fillRect(-26, -200, 52, 90); x.fillStyle = '#2f6fd6'; x.fillRect(-14, 90, 28, 50); x.fillStyle = '#ffd23f'; x.fillRect(-4, -232, 8, 34); x.fillRect(-14, -222, 28, 8); }
        else if (M.k === 'favela') { for (let q = 0; q < 80; q++) { const X = rnd(-260, 260), Y = rnd(-180, 180); if (X * X / 67600 + Y * Y / 32400 > 1) continue; x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(X + 4, Y + 4, 36, 30); x.fillStyle = pick(['#e8383d', '#f2c230', '#2f7de1', '#2fae5b', '#f08a24', '#a05ad8', '#f4f4f4', '#d9a066']); x.fillRect(X, Y, 36, 30); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(X, Y, 36, 6); } }
        x.restore(); });
      // Wasserfall (Iguaçu): Klippe, Kaskaden, Becken
      if (T.falls) { const {x: fx, y: fy} = T.falls; x.fillStyle = '#5c4a3a'; x.beginPath(); x.ellipse(fx, fy, 270, 230, 0, 0, TAU); x.fill();
        const g = x.createRadialGradient(fx, fy + 40, 20, fx, fy + 40, 220); g.addColorStop(0, '#e9fbff'); g.addColorStop(.5, '#7fd6f0'); g.addColorStop(1, '#2a8fb8'); x.fillStyle = g; x.beginPath(); x.ellipse(fx, fy + 30, 215, 175, 0, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 9; for (let a = -2.6; a < -.5; a += .12) { x.beginPath(); x.moveTo(fx + Math.cos(a) * 250, fy + Math.sin(a) * 210); x.lineTo(fx + Math.cos(a) * 170, fy + Math.sin(a) * 120 + 40); x.stroke(); } }
      // Höhen und Tiefen: Hänge als Terrassen (je Höhenstufe ein schmalerer, hellerer Streifen um die Strecke, dunkle Kante = Höhenlinie), Büsche und Felsen am Hang
      const HG = HGT0 || HGT, HL = HG ? [.12, .3, .5, .7, .88].map(L => { const pth = new Path2D(); let on = false, any = false; for (let i = 0; i <= N; i++) { const q = i % N; if (HG[q] >= L) { on ? pth.lineTo(P[q][0], P[q][1]) : pth.moveTo(P[q][0], P[q][1]); on = true; any = true; } else on = false; } return any ? pth : null; }) : [];
      const HC = HILLC[id] === undefined ? ['#4c7a35', '#5a8a3e', '#689a47', '#78aa52', '#89b960'] : HILLC[id];
      if (HC && HILLS.length) { HL.forEach((pth, li) => { if (!pth) return; const hw = HILLW[id] || [150, 80], w = TW + hw[0] + (HL.length - li) * hw[1]; x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = 'rgba(30,22,12,.4)'; x.lineWidth = w + 12; x.stroke(pth); x.strokeStyle = HC[li]; x.lineWidth = w; x.stroke(pth); x.restore(); });
        if (!HILLC[id + '_bare']) for (let i = 0; i < N; i += 7) { const h0 = HG[i]; if (h0 < .15) continue; [-1, 1].forEach(sd => { if (Math.random() < .45) return; const [bx, by] = at(i, sd * (TW / 2 + 40 + Math.random() * (60 + h0 * 160)));
          if (Math.random() < .3) { x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(bx + 4, by + 5, 14, 9, 0, 0, TAU); x.fill(); x.fillStyle = '#8c8a84'; x.beginPath(); x.ellipse(bx, by, 14, 9, Math.random() * 3, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.ellipse(bx - 3, by - 3, 6, 3, 0, 0, TAU); x.fill(); }
          else { x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.arc(bx + 5, by + 6, 15, 0, TAU); x.fill(); x.fillStyle = pick(['#2f6b2a', '#3b7d33', '#4a8f3c']); x.beginPath(); x.arc(bx, by, 15, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.15)'; x.beginPath(); x.arc(bx - 5, by - 5, 6, 0, TAU); x.fill(); } }); } }
      // Brücken: darunter Wasser, Schlucht oder Straße (quer zur Fahrbahn), Schatten des Decks
      BRG.forEach(U => { const im = wrap(U.i0 + Math.round(U.len / 2)), [mx, my] = P[im], span = U.len * 6 + 30, [e0, e1] = U.o.ext || [1300, 1300];
        x.save(); x.translate(mx, my); x.rotate(Math.atan2(NY[im], NX[im]));   // lokales x = quer zur Fahrbahn
        if (U.kd === 'gorge') { const g = x.createLinearGradient(0, -span / 2, 0, span / 2); g.addColorStop(0, '#6b543c'); g.addColorStop(.18, '#2a1d14'); g.addColorStop(.5, '#060403'); g.addColorStop(.82, '#2a1d14'); g.addColorStop(1, '#6b543c'); x.fillStyle = g; x.fillRect(-e0, -span / 2, e0 + e1, span);
          x.strokeStyle = 'rgba(80,170,220,.55)'; x.lineWidth = 6; x.beginPath(); for (let X = -e0; X <= e1; X += 30) x.lineTo(X, Math.sin(X / 90) * span * .08); x.stroke();
          for (let q = 0; q < 26; q++) { const X = -e0 + Math.random() * (e0 + e1), Y = (Math.random() < .5 ? -1 : 1) * span * (.3 + Math.random() * .2); x.fillStyle = '#4a3a2b'; x.beginPath(); x.ellipse(X, Y, 10 + Math.random() * 14, 7 + Math.random() * 8, Math.random() * 3, 0, TAU); x.fill(); } }
        else if (U.kd === 'road') { x.fillStyle = '#5a5e65'; x.fillRect(-e0, -span / 2 + 20, e0 + e1, span - 40); x.strokeStyle = '#ffd23f'; x.lineWidth = 4; x.setLineDash([30, 26]); x.beginPath(); x.moveTo(-e0, 0); x.lineTo(e1, 0); x.stroke(); x.setLineDash([]);
          x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 3; [-1, 1].forEach(sd => { x.beginPath(); x.moveTo(-e0, sd * (span / 2 - 28)); x.lineTo(e1, sd * (span / 2 - 28)); x.stroke(); });
          for (let q = 0; q < 7; q++) { const X = -e0 + 120 + q * (e0 + e1 - 240) / 6, Y = (q % 2 ? -1 : 1) * span * .2; x.fillStyle = pick(['#d94a3a', '#2f7de1', '#f2c230', '#f4f4f4']); x.fillRect(X - 26, Y - 12, 52, 24); x.fillStyle = 'rgba(150,210,255,.8)'; x.fillRect(X + 8, Y - 9, 10, 18); } }
        else { const g = x.createLinearGradient(0, -span / 2, 0, span / 2); g.addColorStop(0, '#c9b07a'); g.addColorStop(.12, '#2a8fb5'); g.addColorStop(.5, '#1f6f99'); g.addColorStop(.88, '#2a8fb5'); g.addColorStop(1, '#c9b07a'); x.fillStyle = g; x.fillRect(-e0, -span / 2, e0 + e1, span);
          x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; for (let q = 0; q < 18; q++) { const X = -e0 + Math.random() * (e0 + e1), Y = (Math.random() - .5) * span * .6; x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + 14, Y - 6, X + 28, Y); x.stroke(); } }
        x.restore(); x.save(); x.translate(18, 24); x.strokeStyle = 'rgba(0,0,0,.38)'; x.lineWidth = TW + 30; x.lineCap = 'butt'; x.stroke(U.pth); x.restore(); });
      // Strecke
      const surf = {gru: '#8a9099', bridge: '#55595f', manaus: '#4a4e54', lopes: '#e2cc98', guaruja: '#6d6f73', copa: null, reveillon: null, iguacu: '#a5482b', amazon: null, paraty: '#8f8578', ilha: '#c99d5c', sp: '#3b3e44', cristo: '#5b5550'}[id];
      if (id === 'amazon') {   // Fluss: zwei Farben (Rio Negro + Solimões), Uferschlamm
        x.strokeStyle = '#6b4b2a'; x.lineWidth = TW + 40; x.stroke(path);
        x.strokeStyle = '#2b1d12'; x.lineWidth = TW; x.stroke(path);
        x.save(); x.beginPath(); x.rect(WW * .45, 0, WW, WH); x.clip(); x.strokeStyle = '#b07a3e'; x.lineWidth = TW; x.stroke(path); x.restore();
        x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 3; for (let k = 0; k < 6; k++) { x.setLineDash([30, 60]); x.lineDashOffset = k * 15; x.lineWidth = 2; x.stroke(path); } x.setLineDash([]);
      } else {
        if (FALL) { const wd = TW + 2 * FALL.m; x.save(); x.translate(22, 30); x.strokeStyle = 'rgba(0,0,0,.42)'; x.lineWidth = wd + 8; x.stroke(path); x.restore();   // Schatten = Höhe
          x.strokeStyle = FALL.rim; x.lineWidth = wd; x.stroke(path); x.strokeStyle = '#ffd23f'; x.setLineDash([20, 20]); x.lineWidth = wd; x.stroke(path); x.strokeStyle = '#111'; x.lineDashOffset = 20; x.stroke(path); x.setLineDash([]); x.lineDashOffset = 0;
          x.strokeStyle = FALL.rim; x.lineWidth = wd - 10; x.stroke(path); }
        x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = TW + 34; x.stroke(path);
        if (id === 'iguacu') { x.strokeStyle = '#5e8d3a'; x.lineWidth = TW + 18; x.stroke(path); }
        else if (id === 'ilha') { x.strokeStyle = '#8a5a2b'; x.lineWidth = TW + 18; x.stroke(path); x.strokeStyle = '#a8743f'; x.setLineDash([12, 6]); x.stroke(path); x.setLineDash([]); }
        else { x.strokeStyle = '#fff'; x.lineWidth = TW + 18; x.stroke(path); x.strokeStyle = id === 'paraty' ? '#2f6fd6' : '#e63a2e'; x.setLineDash([22, 22]); x.stroke(path); x.setLineDash([]); }
        let pat = null;
        if (id === 'copa' || id === 'reveillon') pat = sprite(120, 60, (c, w, h) => { c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#26221f';
          c.beginPath(); c.moveTo(0, 18); for (let X = 0; X <= w; X += 4) c.lineTo(X, 18 + 12 * Math.sin(X / w * TAU)); for (let X = w; X >= 0; X -= 4) c.lineTo(X, 34 + 12 * Math.sin(X / w * TAU)); c.fill(); });
        if (id === 'paraty') pat = sprite(64, 64, (c) => { c.fillStyle = '#5d554b'; c.fillRect(0, 0, 64, 64); for (let i = 0; i < 9; i++) { c.fillStyle = pick(['#8f8578', '#9d927f', '#7f776c', '#a49a88']); c.beginPath(); c.ellipse((i % 3) * 21 + 11, (i / 3 | 0) * 21 + 11, 9, 8, rnd(0, 3), 0, TAU); c.fill(); } });
        const dirt = {ilha: 1, iguacu: 1, lopes: 1}[id]; if (!pat && surf) pat = grainPat(surf, dirt ? 'dirt' : 'asph');
        x.strokeStyle = pat ? x.createPattern(pat, 'repeat') : surf; x.lineWidth = TW; x.stroke(path);
        // abgefahrene Ideallinie (Gummiabrieb) und weiße Randlinien auf Asphalt
        if (surf && !dirt) { const rl = new Path2D(); for (let i = 0; i <= N; i += 2) { const q0 = i % N, [X, Y] = at(q0, LINE[q0] || 0); i ? rl.lineTo(X, Y) : rl.moveTo(X, Y); } x.strokeStyle = 'rgba(0,0,0,.07)'; x.lineWidth = 56; x.stroke(rl); x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 28; x.stroke(rl);
          [-1, 1].forEach(sd => { const ep = new Path2D(); P.forEach((p0, i) => { const X = p0[0] + NX[i] * sd * (TW / 2 - 7), Y = p0[1] + NY[i] * sd * (TW / 2 - 7); i ? ep.lineTo(X, Y) : ep.moveTo(X, Y); }); ep.closePath(); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 3; x.stroke(ep); }); }
        if (id === 'iguacu') { for (let i = 0; i < N; i += 3) { const [px, py] = at(i, rnd(-TW / 2 + 8, TW / 2 - 8)); x.fillStyle = 'rgba(70,20,10,.25)'; x.fillRect(px, py, 3, 3); } }
        if (id === 'guaruja' || id === 'sp' || id === 'cristo' || id === 'bridge' || id === 'gru' || id === 'manaus') { x.strokeStyle = id === 'sp' || id === 'manaus' ? 'rgba(255,210,63,.85)' : 'rgba(255,255,255,.75)'; x.lineWidth = 4; x.setLineDash([26, 26]); x.stroke(path); x.setLineDash([]); }
        if (id === 'ilha') { x.strokeStyle = 'rgba(255,240,200,.35)'; x.lineWidth = TW * .45; x.stroke(path); x.strokeStyle = 'rgba(90,60,30,.35)'; x.lineWidth = 3; x.setLineDash([4, 18]); for (const o of [-TW * .3, TW * .3]) { x.save(); x.stroke(path); x.restore(); } x.setLineDash([]); }
      }
      // Fahrbahn oben heller (Sonne), Pfeile bergauf/bergab, Brücken-Deck mit Geländer und Fugen, Schilder (Steigung, Kuppe, Gefälle, Name)
      HL.forEach(pth => { if (pth) { x.save(); x.lineCap = 'butt'; x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = TW; x.stroke(pth); x.restore(); } });
      HILLS.forEach(Hh => { const up = Math.round(Hh.len * Hh.r), pct = Math.round(Hh.h * Math.PI / (2 * Math.max(1, up)) * 900);
        for (let j = 10; j < up - 4; j += 26) across(x, wrap(Hh.i0 + j), () => { x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 5; x.beginPath(); x.moveTo(-22, 8); x.lineTo(0, -8); x.lineTo(22, 8); x.stroke(); });
        for (let j = Hh.len - up + 10; j < Hh.len - 4; j += 26) across(x, wrap(Hh.i0 + j), () => { x.strokeStyle = 'rgba(255,220,120,.22)'; x.lineWidth = 5; x.beginPath(); x.moveTo(-22, -8); x.lineTo(0, 8); x.lineTo(22, -8); x.stroke(); });
        const bd = (i, sd, t, c) => { const [sx, sy] = at(wrap(i), sd * (TW / 2 + 48)); x.save(); x.translate(sx, sy); x.font = '900 20px system-ui,sans-serif'; const w0 = x.measureText(t).width + 18; x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(-w0 / 2 + 4, -14, w0, 30); x.fillStyle = c; x.fillRect(-w0 / 2, -18, w0, 30); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 0, -3); x.restore(); };
        bd(Hh.i0 + 4, 1, '⛰️ ' + pct + ' % Steigung', '#2f6b2a'); bd(Hh.i0 + Hh.len - up, 1, '⚠️ ' + pct + ' % Gefälle', '#b5121b');
        if (Hh.o.jump) { bd(Hh.i0 + up - 14, -1, '🛫 Kuppe', '#d97a00'); } if (Hh.o.n) bd(Hh.i0 + up + 26, 1, '📍 ' + Hh.o.n, '#1c3d6e'); });
      BRG.forEach(U => { x.save(); x.lineCap = 'butt'; const wood = U.o.wood;
        if (wood) { for (let j = 0; j <= U.len; j += 2) across(x, wrap(U.i0 + j), () => { x.fillStyle = j % 4 ? '#9a6a3a' : '#7d5530'; x.fillRect(-TW / 2, -6, TW, 12); x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(-TW / 2, 5, TW, 1.5); }); }
        [-1, 1].forEach(sd => { const ep = new Path2D(); for (let j = 0; j <= U.len; j++) { const [X, Y] = at(U.i0 + j, sd * (TW / 2 + 7)); j ? ep.lineTo(X, Y) : ep.moveTo(X, Y); } x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 11; x.stroke(ep); x.strokeStyle = wood ? '#7a4e26' : '#e8e8ea'; x.lineWidth = 7; x.stroke(ep); });
        for (let j = 0; j <= U.len; j += 4) [-1, 1].forEach(sd => { const [X, Y] = at(U.i0 + j, sd * (TW / 2 + 7)); x.fillStyle = wood ? '#5a3818' : '#8d96a0'; x.fillRect(X - 4.5, Y - 4.5, 9, 9); });
        if (!wood) for (let j = 4; j < U.len; j += 9) across(x, wrap(U.i0 + j), () => { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(-TW / 2, -1.5, TW, 3); });
        { const [sx, sy] = at(wrap(U.i0 - 6), -(TW / 2 + 50)); x.translate(sx, sy); x.font = '900 20px system-ui,sans-serif'; const t0 = '🌉 ' + U.nm, w0 = x.measureText(t0).width + 18; x.fillStyle = 'rgba(20,20,30,.85)'; x.fillRect(-w0 / 2, -18, w0, 30); x.fillStyle = '#ffd23f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t0, 0, -3); }
        x.restore(); });
      // feine Körnung über alles (Sand, Rasen, Stadt wirken weniger glatt)
      { let sd = 987654; const rr = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296; for (let j = 0, n0 = Math.min(26000, WW * WH / 260); j < n0; j++) { x.fillStyle = rr() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; const s0 = 1 + rr() * 2.5; x.fillRect(rr() * WW, rr() * WH, s0, s0); } }
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
      if (id === 'bridge') { const ro = FALL ? FALL.m - 3 : 10; [-1, 1].forEach(sd => { x.strokeStyle = '#d8dde3'; x.lineWidth = 5; if (FALL) x.setLineDash([60, 90]); x.beginPath(); P.forEach((p0, i) => { const X = p0[0] + NX[i] * sd * (TW / 2 + ro), Y = p0[1] + NY[i] * sd * (TW / 2 + ro); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.stroke(); x.setLineDash([]); });
        for (let i = 0; i < N; i += 40) [-1, 1].forEach(sd => { const X = P[i][0] + NX[i] * sd * (TW / 2 + ro), Y = P[i][1] + NY[i] * sd * (TW / 2 + ro); x.fillStyle = '#9aa3ad'; x.fillRect(X - 6, Y - 6, 12, 12); }); }
      if (id === 'manaus') for (let i = 10; i < N; i += 55) { const X = P[i][0] + NX[i] * (TW / 2 + 30), Y = P[i][1] + NY[i] * (TW / 2 + 30); const g = x.createRadialGradient(X, Y, 4, X, Y, 120); g.addColorStop(0, 'rgba(255,220,140,.55)'); g.addColorStop(1, 'rgba(255,220,140,0)'); x.fillStyle = g; x.fillRect(X - 120, Y - 120, 240, 240); x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(X, Y, 6, 0, TAU); x.fill(); }
      // Abkürzung: Schotterweg mit Schild und Turbo-Pfeil
      if (CUT) { x.save(); x.lineCap = 'round'; x.strokeStyle = 'rgba(0,0,0,.2)'; x.lineWidth = CUT.w + 14; x.beginPath(); x.moveTo(CUT.a[0], CUT.a[1]); x.lineTo(CUT.b[0], CUT.b[1]); x.stroke();
        const SQ = secretOf(); x.strokeStyle = SQ[2]; x.lineWidth = CUT.w; x.stroke();
        if (SQ[3]) { const dx0 = CUT.b[0] - CUT.a[0], dy0 = CUT.b[1] - CUT.a[1], l0 = Math.hypot(dx0, dy0), nx0 = -dy0 / l0, ny0 = dx0 / l0; x.strokeStyle = 'rgba(60,35,15,.45)'; x.lineWidth = 2; x.beginPath(); for (let q = 8; q < l0; q += 16) { const cx0 = CUT.a[0] + dx0 / l0 * q, cy0 = CUT.a[1] + dy0 / l0 * q; x.moveTo(cx0 - nx0 * CUT.w / 2, cy0 - ny0 * CUT.w / 2); x.lineTo(cx0 + nx0 * CUT.w / 2, cy0 + ny0 * CUT.w / 2); } x.stroke(); }
        else { x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; x.setLineDash([14, 14]); x.stroke(); x.setLineDash([]); }
        { x.save(); x.translate(CUT.a[0], CUT.a[1]); x.fillStyle = 'rgba(20,20,30,.82)'; x.font = '900 22px system-ui,sans-serif'; const tx0 = '🤫 ' + SQ[0], tw0 = x.measureText(tx0).width + 20; x.fillRect(-tw0 / 2, -64, tw0, 32); x.fillStyle = '#ffd23f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(tx0, 0, -48); x.restore(); }
        for (let q = 0; q < 140; q++) { const u = Math.random(), v = (Math.random() - .5) * CUT.w * .8, dx = CUT.b[0] - CUT.a[0], dy = CUT.b[1] - CUT.a[1], l = Math.hypot(dx, dy); x.fillStyle = 'rgba(70,45,20,.35)'; x.fillRect(CUT.a[0] + dx * u - dy / l * v, CUT.a[1] + dy * u + dx / l * v, 4, 4); }
        { const dx = CUT.b[0] - CUT.a[0], dy = CUT.b[1] - CUT.a[1], l = Math.hypot(dx, dy); for (let q = .2; q < .85; q += .16) { x.fillStyle = 'rgba(90,60,30,.55)'; x.beginPath(); x.ellipse(CUT.a[0] + dx * q, CUT.a[1] + dy * q, CUT.w * .42, CUT.w * .26, Math.atan2(dy, dx), 0, TAU); x.fill(); x.fillStyle = 'rgba(160,120,70,.35)'; x.beginPath(); x.ellipse(CUT.a[0] + dx * q - 6, CUT.a[1] + dy * q - 4, CUT.w * .16, CUT.w * .08, 0, 0, TAU); x.fill(); } } x.restore();
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
      if (id === 'copa' || id === 'guaruja') scatter(x, 60 * DF, 40, (X, Y, k) => { if (Y < 230) return; (Y > 1400 || Math.random() < .35) ? brolly(x, X, Y, k) : palm(x, X, Y, k); });
      if (id === 'ilha') scatter(x, 45 * DF, 40, (X, Y, k) => { if (Y < 200) return; Math.random() < .3 ? brolly(x, X, Y, k, 22) : palm(x, X, Y, k); });
      if (id === 'paraty') scatter(x, 14 * DF, 40, (X, Y, k) => palm(x, X, Y, k));
      // Große Deko für leere Innenfelder (Qualitätsrunde 09.10.): Flieger am Flughafen, Schiffe/Inseln/Zuckerhut in der Bucht, Strandleben an der Lopes Mendes
      const placed = [], fits = (X, Y, r) => { if (X < r * .5 || Y < r * .5 || X > WW - r * .5 || Y > WH - r * .5 || !free(X, Y, r)) return false;
          if (CUT) { const dx = CUT.b[0] - CUT.a[0], dy = CUT.b[1] - CUT.a[1], l2 = dx * dx + dy * dy, u = clamp(((X - CUT.a[0]) * dx + (Y - CUT.a[1]) * dy) / l2, 0, 1); if (Math.hypot(CUT.a[0] + dx * u - X, CUT.a[1] + dy * u - Y) < r + CUT.w) return false; }
          if (T.statue && Math.hypot(T.statue.x - X, T.statue.y - Y) < r + 160) return false; return !placed.some(q => Math.hypot(q[0] - X, q[1] - Y) < q[2] + r); },
        place = (n, r, tries, fn) => { for (let k = 0, t = 0; k < n && t < tries; t++) { const X = rnd(r, WW - r), Y = rnd(r, WH - r); if (!fits(X, Y, r)) continue; placed.push([X, Y, r]); fn(X, Y, k); k++; } };
      const plane = (X, Y, a, s, liv) => { x.save(); x.translate(X, Y); x.rotate(a); x.scale(s, s);
        const shape = (dx, dy, c1, c2) => { x.save(); x.translate(dx, dy); x.fillStyle = c2; x.beginPath(); x.moveTo(-18, -40); x.lineTo(-178, 46); x.lineTo(-178, 68); x.lineTo(-18, 28); x.lineTo(18, 28); x.lineTo(178, 68); x.lineTo(178, 46); x.lineTo(18, -40); x.closePath(); x.fill();
          x.beginPath(); x.moveTo(-12, 130); x.lineTo(-76, 168); x.lineTo(-76, 181); x.lineTo(-12, 166); x.lineTo(12, 166); x.lineTo(76, 181); x.lineTo(76, 168); x.lineTo(12, 130); x.closePath(); x.fill();
          x.fillStyle = c1; x.beginPath(); x.moveTo(0, -188); x.bezierCurveTo(25, -184, 25, -142, 25, -120); x.lineTo(25, 140); x.quadraticCurveTo(21, 190, 0, 198); x.quadraticCurveTo(-21, 190, -25, 140); x.lineTo(-25, -120); x.bezierCurveTo(-25, -142, -25, -184, 0, -188); x.fill(); x.restore(); };
        shape(30, 38, 'rgba(0,0,0,.2)', 'rgba(0,0,0,.18)'); shape(0, 0, '#f7f8fa', '#cfd5dd');
        x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(4, -120, 21, 260);
        [-84, 84].forEach(ex => { x.fillStyle = liv[0]; x.beginPath(); x.ellipse(ex, -4, 14, 32, 0, 0, TAU); x.fill(); x.fillStyle = '#23272e'; x.beginPath(); x.ellipse(ex, -34, 10, 4, 0, 0, TAU); x.fill(); });
        x.fillStyle = liv[0]; x.fillRect(-178, 46, 9, 22); x.fillRect(169, 46, 9, 22); x.beginPath(); x.moveTo(-5, 118); x.lineTo(5, 118); x.lineTo(4, 196); x.lineTo(-4, 196); x.closePath(); x.fill();
        x.fillStyle = '#1d2a3a'; x.beginPath(); x.moveTo(-15, -162); x.quadraticCurveTo(0, -178, 15, -162); x.lineTo(13, -153); x.quadraticCurveTo(0, -164, -13, -153); x.closePath(); x.fill();
        x.save(); x.rotate(-Math.PI / 2); x.fillStyle = liv[0]; x.font = '900 21px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(liv[1], -20, 1, 230); x.restore(); x.restore(); };
      const bagTrain = (X, Y, a) => { x.save(); x.translate(X, Y); x.rotate(a); x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(-36, -10, 196, 36); x.fillStyle = '#f2b600'; x.fillRect(-44, -16, 40, 32); x.fillStyle = '#2b2f36'; x.fillRect(-34, -12, 16, 24);
        for (let q = 0; q < 3; q++) { const cx = 6 + q * 52; x.fillStyle = '#5f6670'; x.fillRect(cx, -16, 44, 32); for (let b = 0; b < 3; b++) { x.fillStyle = pick(['#d62828', '#2b5f9e', '#f2b600', '#333', '#7b4ea0', '#1d9a5b']); x.fillRect(cx + 3 + b * 14, -13 + rnd(-2, 2), 12, 26); } } x.restore(); };
      if (id === 'gru') {
        placed.push([WW / 2, 0, 250], [WW * .2, 0, 250], [WW * .8, 0, 250]);   // Terminal oben frei lassen
        place(4, 215, 900, (X, Y, k) => plane(X, Y, pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]) + rnd(-.15, .15), .95, [['#d62828', 'GRINGO AIR'], ['#2b5f9e', 'CEVAPI AIRWAYS'], ['#1d9a5b', 'CAIPI AIR'], ['#f28c28', 'RODÍZIO LINES']][k % 4]));
        place(7, 105, 900, (X, Y) => bagTrain(X - 60, Y, rnd(0, TAU)));
        place(10, 30, 600, (X, Y) => { x.fillStyle = '#ff6a00'; x.beginPath(); x.moveTo(X, Y - 14); x.lineTo(X + 10, Y + 10); x.lineTo(X - 10, Y + 10); x.closePath(); x.fill(); x.fillStyle = '#fff'; x.fillRect(X - 5, Y - 2, 10, 4); });
      }
      if (id === 'bridge') {
        // Zuckerhut mit Seilbahn
        place(1, 330, 900, (X, Y) => { const rock = (cx, cy, rx, ry) => { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(cx + 24, cy + 30, rx, ry, .3, 0, TAU); x.fill(); x.fillStyle = '#3f8f4a'; x.beginPath(); x.ellipse(cx, cy, rx + 22, ry + 18, .3, 0, TAU); x.fill();
            const g = x.createRadialGradient(cx - rx * .3, cy - ry * .3, 10, cx, cy, rx); g.addColorStop(0, '#b9b1a3'); g.addColorStop(1, '#6f6658'); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, .3, 0, TAU); x.fill(); for (let q = 0; q < 16; q++) canopy(x, cx + rnd(-rx, rx) * .8, cy + rnd(-ry, ry) * .8, rnd(12, 22), q); };
          rock(X - 90, Y + 40, 120, 95); rock(X + 110, Y - 60, 150, 120); x.strokeStyle = '#222'; x.lineWidth = 3; x.beginPath(); x.moveTo(X - 90, Y + 40); x.lineTo(X + 110, Y - 60); x.stroke();
          x.fillStyle = '#d62828'; x.save(); x.translate(X + 10, Y - 10); x.rotate(-.46); x.fillRect(-12, -8, 24, 16); x.restore(); });
        // MAC Niterói (Ufo-Museum) auf dem Ufer oben links
        { const mx = 240, my = 150; x.fillStyle = 'rgba(160,220,255,.9)'; x.beginPath(); x.arc(mx, my, 95, 0, TAU); x.fill(); x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.arc(mx + 14, my + 16, 64, 0, TAU); x.fill();
          x.strokeStyle = '#d62828'; x.lineWidth = 16; x.beginPath(); x.arc(mx, my, 80, 1.2, 2.9); x.lineTo(mx + 120, my + 170); x.stroke(); x.fillStyle = '#fafafa'; x.beginPath(); x.arc(mx, my, 62, 0, TAU); x.fill(); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 3; x.beginPath(); x.arc(mx, my, 46, 0, TAU); x.stroke(); }
        // Inseln mit Palmen
        place(3, 120, 900, (X, Y, k) => { x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.ellipse(X, Y, 118, 88, k, 0, TAU); x.fill(); x.fillStyle = '#ecd7a4'; x.beginPath(); x.ellipse(X, Y, 100, 72, k, 0, TAU); x.fill(); x.fillStyle = '#3f8f4a'; x.beginPath(); x.ellipse(X, Y, 70, 48, k, 0, TAU); x.fill();
          if (k === 0) { x.fillStyle = '#5ab5a0'; x.fillRect(X - 30, Y - 22, 60, 44); x.fillStyle = '#2e6f62'; x.beginPath(); x.moveTo(X - 34, Y - 22); x.lineTo(X, Y - 46); x.lineTo(X + 34, Y - 22); x.closePath(); x.fill(); } else for (let q = 0; q < 4; q++) palm(x, X + rnd(-40, 40), Y + rnd(-26, 26), q); });
        // Containerschiff und Tanker mit Kielwasser
        place(2, 230, 900, (X, Y, k) => { x.save(); x.translate(X, Y); x.rotate(rnd(-.6, .6) + (k ? Math.PI : 0)); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(-200, -26); x.lineTo(-420, -90); x.lineTo(-420, 90); x.lineTo(-200, 26); x.closePath(); x.fill();
          x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-186, -24, 390, 60); x.fillStyle = k ? '#7a1f1f' : '#2a3442'; x.beginPath(); x.moveTo(-200, -32); x.lineTo(150, -32); x.quadraticCurveTo(215, -32, 225, 0); x.quadraticCurveTo(215, 32, 150, 32); x.lineTo(-200, 32); x.closePath(); x.fill();
          if (!k) { for (let c = -170; c < 140; c += 26) for (let r = -24; r < 22; r += 16) { x.fillStyle = pick(['#c0392b', '#2f6fd6', '#1d9a5b', '#e3a21a', '#8e44ad', '#ecf0f1']); x.fillRect(c, r, 24, 14); } }
          else { x.fillStyle = '#5b6470'; x.fillRect(-170, -6, 300, 12); for (let c = -150; c < 130; c += 60) { x.fillStyle = '#9aa3ad'; x.beginPath(); x.arc(c, 0, 18, 0, TAU); x.fill(); } }
          x.fillStyle = '#f4f4f4'; x.fillRect(-196, -26, 26, 52); x.fillStyle = '#d62828'; x.fillRect(-190, -8, 12, 16); x.restore(); });
        // Segelboote
        place(7, 50, 900, (X, Y) => { const a = rnd(0, TAU); x.save(); x.translate(X, Y); x.rotate(a); x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.moveTo(-26, -4); x.lineTo(-80, -22); x.lineTo(-80, 22); x.lineTo(-26, 4); x.fill();
          x.fillStyle = '#fff'; x.beginPath(); x.ellipse(0, 0, 30, 10, 0, 0, TAU); x.fill(); x.fillStyle = pick(['#fff3c4', '#ffd23f', '#ff6b3d', '#9fd8ff']); x.beginPath(); x.moveTo(-2, 0); x.lineTo(-22, -30); x.lineTo(14, -2); x.closePath(); x.fill(); x.restore(); });
        // Wellenkämme
        x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 3; for (let q = 0; q < 260; q++) { const X = rnd(0, WW), Y = rnd(0, WH); x.beginPath(); x.arc(X, Y, rnd(10, 22), Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
      }
      if (id === 'lopes') {
        { let cx = 0, cy = 0; P.forEach(p0 => { cx += p0[0]; cy += p0[1]; }); placed.push([cx / P.length, cy / P.length, 360]); }   // Fußballplatz frei lassen
        // Strandbar, Footvolley-Netz, Handtücher mit (sonnenverbrannten) Gringos, Schirme, Surfbretter, Sandburgen
        place(1, 150, 900, (X, Y) => { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(X - 104, Y - 64, 220, 140); x.fillStyle = '#c99d5c'; x.fillRect(X - 110, Y - 70, 220, 140); x.strokeStyle = '#8a5a2b'; x.lineWidth = 4; for (let q = -100; q < 110; q += 22) { x.beginPath(); x.moveTo(X + q, Y - 70); x.lineTo(X + q + 10, Y + 70); x.stroke(); }
          x.fillStyle = '#5a3a1f'; x.fillRect(X - 110, Y + 50, 220, 24); x.fillStyle = '#fff'; x.font = '900 18px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BARRACA DO GRINGO', X, Y + 62); x.font = '30px system-ui,sans-serif'; x.fillText('🍹🥥🍺', X, Y - 6); });
        place(1, 130, 900, (X, Y) => { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(X - 110, Y + 4, 220, 6); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(X - 110, Y); x.lineTo(X + 110, Y); x.stroke(); x.fillStyle = '#5a3a1f'; x.fillRect(X - 116, Y - 6, 12, 12); x.fillRect(X + 104, Y - 6, 12, 12);
          x.font = '30px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('⚽', X + rnd(-60, 60), Y - 50); for (let q = 0; q < 4; q++) { const px = X + (q % 2 ? 60 : -60), py = Y + (q < 2 ? -70 : 70); x.fillStyle = '#7a4a2a'; x.beginPath(); x.arc(px, py, 11, 0, TAU); x.fill(); x.fillStyle = pick(['#ffd23f', '#3fa7ff', '#ff4d4d', '#3ccf6e']); x.beginPath(); x.ellipse(px, py + 16, 14, 9, 0, 0, TAU); x.fill(); } });
        place(26, 48, 1400, (X, Y, k) => { const a = rnd(-.5, .5), red = k % 3 === 0; x.save(); x.translate(X, Y); x.rotate(a); x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(-20, -42, 46, 92); x.fillStyle = ['#ff5fa2', '#5fd3ff', '#ffd23f', '#3ccf6e', '#ff8a2a'][k % 5]; x.fillRect(-24, -46, 46, 92);
          x.fillStyle = 'rgba(255,255,255,.5)'; for (let q = -40; q < 44; q += 14) x.fillRect(-24, q, 46, 5); const sk = red ? '#ff5a3c' : pick(['#f1c27d', '#c68642', '#8d5524']); x.fillStyle = sk; x.beginPath(); x.arc(0, -28, 10, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, 4, 12, 26, 0, 0, TAU); x.fill();
          x.fillStyle = pick(['#d62828', '#2b5f9e', '#111']); x.fillRect(-11, 8, 22, 10); x.restore(); if (red) { x.font = '22px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🦞', X + 34, Y - 30); } if (k % 2) brolly(x, X - 30, Y - 50, k, 30); });
        place(10, 40, 900, (X, Y, k) => { x.save(); x.translate(X, Y); x.rotate(rnd(0, TAU)); x.fillStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.ellipse(5, 5, 14, 46, 0, 0, TAU); x.fill(); x.fillStyle = ['#ff6b3d', '#3fa7ff', '#fff', '#ffd23f'][k % 4]; x.beginPath(); x.ellipse(0, 0, 14, 46, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -40); x.lineTo(0, 40); x.stroke(); x.restore(); });
        place(18, 26, 1200, (X, Y, k) => { x.font = '30px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(['🏰', '🦀', '🐚', '🥥', '🧊', '🩴', '🦀', '🏐', '🍉'][k % 9], X, Y); });
        place(24, 40, 1400, (X, Y, k) => palm(x, X, Y, k));
      }
      // Langstrecken: Randbebauung entlang der Strecke [von, bis, Seite, Art, Abstand px, Versatz] (Hochhäuser an der Copacabana, Kioske, Laternen, Kolonialhäuser, Favela, Bäume, Boote, Zuschauer)
      (T.side || []).forEach(([f0, f1, sd, kind, gap, off]) => { const i0 = Math.round(f0 * N), i1 = Math.round((f1 < f0 ? f1 + 1 : f1) * N), st = Math.max(4, Math.round((gap || 120) / 6)); let k = 0;
        for (let i = i0; i < i1; i += st, k++) { const q = wrap(i), o = TW / 2 + (off || 40), [X, Y] = at(q, sd * o); if (TUN.some(U => wrap(q - U.i0) <= U.len) || BRG.some(U => wrap(q - U.i0) <= U.len)) continue;
          let near = false; for (let j = 0; j < N; j += 12) { if (Math.abs(wrap(j - q + N / 2) - N / 2) < 40) continue; if (Math.hypot(P[j][0] - X, P[j][1] - Y) < o) { near = true; break; } } if (near) continue;
          const rr = (n0 => () => (n0 = (Math.imul(n0, 1664525) + 1013904223) >>> 0) / 4294967296)(q * 7919 + k), R = (a, b) => a + rr() * (b - a);
          x.save(); x.translate(X, Y); x.rotate(Math.atan2(NY[q], NX[q]) + (sd < 0 ? Math.PI : 0));   // lokal: +x = weg von der Fahrbahn, y = entlang
          if (kind === 'tower') { const w = R(90, 140), d = R(110, 190), c = ['#e8e1d5', '#d9cbb4', '#f2efe8', '#cfd8dc', '#f6d6b3', '#e0c9e6', '#bcd4e6'][Math.floor(R(0, 7))]; x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(14, -w / 2 + 12, d, w); x.fillStyle = c; x.fillRect(4, -w / 2, d, w);
            x.fillStyle = 'rgba(80,140,200,.5)'; for (let a2 = 12; a2 < d - 14; a2 += 22) for (let b2 = -w / 2 + 10; b2 < w / 2 - 14; b2 += 22) x.fillRect(4 + a2, b2, 10, 10); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(4, -w / 2, 6, w); }
          else if (kind === 'house') { const w = R(70, 100); x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(10, -w / 2 + 8, 80, w); x.fillStyle = '#c4553a'; x.fillRect(4, -w / 2, 80, w); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(44, -w / 2, 40, w); x.fillStyle = '#f7f2e8'; x.fillRect(0, -w / 2, 10, w);
            x.fillStyle = ['#2f6fd6', '#1d9a5b', '#e3a21a', '#c0392b'][Math.floor(R(0, 4))]; for (let d2 = -w / 2 + 10; d2 < w / 2 - 12; d2 += 26) x.fillRect(0, d2, 6, 14); }
          else if (kind === 'hut') { for (let q2 = 0; q2 < 6; q2++) { const hx = R(4, 110), hy = R(-60, 60); x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(hx + 4, hy + 4, 34, 28); x.fillStyle = ['#e8383d', '#f2c230', '#2f7de1', '#2fae5b', '#f08a24', '#a05ad8', '#d9a066'][Math.floor(R(0, 7))]; x.fillRect(hx, hy, 34, 28); } }
          else if (kind === 'kiosk') { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(10, -26, 54, 60); x.fillStyle = '#2f9e44'; x.fillRect(4, -30, 54, 60); x.fillStyle = '#fff'; x.fillRect(4, -30, 54, 8); x.font = '22px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(['🥥', '🍹', '🌽', '🍺'][Math.floor(R(0, 4))], 31, 4); }
          else if (kind === 'lamp') { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(6, 6, 7, 0, TAU); x.fill(); x.fillStyle = '#4a4e54'; x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,230,150,.9)'; x.beginPath(); x.arc(-10, 0, 5, 0, TAU); x.fill(); }
          else if (kind === 'palm') palm(x, R(10, 40), R(-20, 20), k); else if (kind === 'brolly') brolly(x, R(10, 60), R(-30, 30), k); else if (kind === 'tree') canopy(x, R(20, 60), R(-20, 20), R(26, 44), k);
          else if (kind === 'rock') { x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(R(14, 40) + 5, 6, R(16, 30), R(12, 22), R(0, 3), 0, TAU); x.fill(); x.fillStyle = ['#8c8a84', '#9b958b', '#7d7a74'][Math.floor(R(0, 3))]; x.beginPath(); x.ellipse(R(14, 40), 0, R(16, 30), R(12, 22), R(0, 3), 0, TAU); x.fill(); }
          else if (kind === 'crowd') { for (let q2 = 0; q2 < 9; q2++) { x.fillStyle = ['#e8383d', '#f2c230', '#2f7de1', '#2fae5b', '#fff', '#111', '#f08a24'][Math.floor(R(0, 7))]; x.beginPath(); x.arc(R(6, 46), R(-40, 40), 7, 0, TAU); x.fill(); } }
          else if (kind === 'boat') { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(R(20, 60), -3, 40, 6); x.fillStyle = ['#fff', '#ffd23f', '#e8383d', '#2f7de1'][Math.floor(R(0, 4))]; x.beginPath(); x.ellipse(R(40, 80), 0, 34, 12, Math.PI / 2, 0, TAU); x.fill(); }
          else if (kind === 'container') { for (let q2 = 0; q2 < 2; q2++) { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(10 + q2 * 50, -54, 46, 120); x.fillStyle = ['#c0392b', '#2f6fd6', '#1d9a5b', '#e3a21a', '#8e44ad'][Math.floor(R(0, 5))]; x.fillRect(4 + q2 * 50, -60, 44, 120); } }
          x.restore(); } });
      const title = T.title || {gru: 'AEROPORTO GRU', bridge: 'PONTE RIO–NITERÓI', manaus: 'PORTO DE MANAUS', lopes: 'LOPES MENDES', guaruja: 'GUARUJÁ', copa: 'COPACABANA', reveillon: 'RÉVEILLON 2027', iguacu: 'IGUAÇU', amazon: 'AMAZONAS', paraty: 'PARATY', ilha: 'ILHA GRANDE', sp: 'SÃO PAULO', cristo: 'CRISTO REDENTOR'}[id];
      x.save(); x.font = '900 70px system-ui,sans-serif'; x.fillStyle = id === 'iguacu' || id === 'amazon' ? 'rgba(255,255,255,.18)' : 'rgba(0,120,70,.22)'; x.textAlign = 'center';
      const [tx, ty] = T.tpos || (T.falls ? [T.falls.x, T.falls.y + 330] : [WW / 2, WH / 2 + 60]); x.fillText(title, tx, ty); x.font = '900 34px system-ui,sans-serif'; x.fillText('Gringo Kart · ' + T.sub, tx, ty + 50); x.restore();
    };
    // Zonen (Langstrecken): jede Zone wird mit der Kulisse einer Kurzstrecke gemalt (Boden, Deko, Belag), auf ihr Vieleck zugeschnitten
    BG = sprite(Math.round(WW * BGS), Math.round(WH * BGS), (x0) => { x0.scale(BGS, BGS);
      (T.zones || [null]).forEach(z => { x0.save(); if (z) { x0.beginPath(); z.r.forEach((p0, j) => j ? x0.lineTo(p0[0], p0[1]) : x0.moveTo(p0[0], p0[1])); x0.closePath(); x0.clip(); } paintBG(x0, z ? z.th : (T.bg || T.id)); x0.restore(); }); });
  }

  /* ---- Fahrer: Kopf- und Fahrzeug-Sprites ---- */
  // Jede Figur mit eigenem Fahrzeug, eigener Kopfform und Größe (Wunsch Patrick 08.10.): k = Fahrzeug-Stil (nur beim Gringo-Kart), shp = Kopfform,
  // vs = Fahrzeug-Größe (auch Zusammenstöße), hs = Kopfgröße, seat = Lenkrad (wheel), Lenker (bar) oder ohne Körper (none)
  const STY = {manuel: {k: 'buggy', shp: 'egg', vs: .74, hs: .8, seat: 'wheel'}, erich: {k: 'boller', shp: 'squircle', vs: 1.08, hs: 1.02, seat: 'wheel'}, ilkay: {k: 'taco', shp: 'oval', vs: 1.08, hs: 1.02, seat: 'wheel'}, felix: {k: 'golf', shp: 'squircle', vs: 1, hs: 1.04, seat: 'wheel'}, rasmus: {k: 'bulli', shp: 'oval', vs: 1.12, hs: 1.02, seat: 'wheel'}, patmum: {k: 'momtaxi', shp: 'oval', vs: 1.06, hs: 1.04, seat: 'wheel'}, jonas: {k: 'f1', shp: 'squircle'}, simon: {k: 'buggy', shp: 'oval'}, patrick: {k: 'kart', shp: 'egg', hs: 1.06}, marco: {k: 'f1', shp: 'shield'}, greisel: {k: 'buggy', shp: 'hex', hs: 1.08, vs: 1.05}, dajo: {k: 'kart', shp: 'circle', hs: .95},
    simon_love: {k: 'bed', shp: 'heart', vs: 1.05}, patrick_fat: {k: 'sofa', shp: 'wide', vs: 1.22, hs: 1.25, fat: 1}, marco_dia: {k: 'toilet', shp: 'blob'}, jonas_kater: {k: 'tub', shp: 'squircle', hs: .95}, greisel_wb: {k: 'keg', shp: 'mug', vs: 1.08, hs: 1.1}, dajo_party: {k: 'disco', shp: 'star', hs: 1.05},
    taxi: {k: 'taxi', vs: 1.12, skin: '#a8704a'}, coati: {k: 'skate', vs: .8, hs: .9, seat: 'none'}, officer: {k: 'police', vs: 1.1}, dona: {k: 'scooter', vs: .92, seat: 'bar', skin: '#b98060'}, guide: {k: 'jeep', vs: 1.1, skin: '#c08a5a'}, steward: {k: 'trolley', vs: .95, seat: 'bar'}, caimanx: {k: 'gator', vs: 1.28, hs: 1.1, seat: 'none'}};
  const STYK = id => { const st = STY[id]; return st && st.k !== 'kart' ? st.k : null; }, KLIKE = {f1: 1, buggy: 1};
  const STN = {f1: 'Formel-Kart', buggy: 'Strand-Buggy', bed: 'Liebesbett', sofa: 'Couch-Kart', toilet: 'Klo-Rakete', tub: 'Badewanne', keg: 'Bierfass', disco: 'Disco-Mobil', taxi: 'Taxi', skate: 'Skateboard', police: 'Streifenwagen', scooter: 'Seniorenmobil', jeep: 'Safari-Jeep', trolley: 'Servierwagen', gator: 'Kaiman', boller: 'Betreuer-Bollerwagen', bulli: 'Hippie-Bulli', taco: 'Taco-Döner-Truck', golf: 'Golfcart', momtaxi: 'Mama-Taxi'};
  const FWS = {f1: [[-15, -20], [15, -20]]}, HSET = () => [.75, 1, 1.5][SET.hd === undefined ? 1 : SET.hd];
  function shapePath(x, sh, R) { x.beginPath();
    if (sh === 'oval') x.ellipse(0, 0, R * .84, R, 0, 0, TAU);
    else if (sh === 'wide') x.ellipse(0, 0, R, R * .8, 0, 0, TAU);
    else if (sh === 'squircle' || sh === 'mug') { const a = sh === 'mug' ? .78 : .92, b = sh === 'mug' ? .95 : .92; if (x.roundRect) x.roundRect(-R * a, -R * b, R * a * 2, R * b * 2, R * (sh === 'mug' ? .22 : .42)); else x.rect(-R * a, -R * b, R * a * 2, R * b * 2); }
    else if (sh === 'egg') { x.moveTo(0, -R); x.bezierCurveTo(R * .8, -R, R, R * .1, R * .92, R * .45); x.bezierCurveTo(R * .78, R, -R * .78, R, -R * .92, R * .45); x.bezierCurveTo(-R, R * .1, -R * .8, -R, 0, -R); }
    else if (sh === 'shield') { x.moveTo(-R * .9, -R * .85); x.quadraticCurveTo(0, -R * 1.08, R * .9, -R * .85); x.lineTo(R * .9, R * .1); x.quadraticCurveTo(R * .78, R * .78, 0, R); x.quadraticCurveTo(-R * .78, R * .78, -R * .9, R * .1); x.closePath(); }
    else if (sh === 'hex') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * R, Math.sin(a) * R); } x.closePath(); }
    else if (sh === 'heart') { x.moveTo(0, R); x.bezierCurveTo(-R * 1.3, R * .15, -R * 1.02, -R * 1.08, 0, -R * .42); x.bezierCurveTo(R * 1.02, -R * 1.08, R * 1.3, R * .15, 0, R); }
    else if (sh === 'blob') { for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU, r = R * (.91 + .09 * Math.sin(a * 5 + .7)); x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); }
    else if (sh === 'star') { for (let i = 0; i < 20; i++) { const a = i / 20 * TAU - Math.PI / 2, r = i % 2 ? R * .82 : R; x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); }
    else x.arc(0, 0, R, 0, TAU); }
  // Fahrzeuge der Figuren (Draufsicht, Logik-Koordinaten −22…22 × −30…30, vorn = oben)
  function drawSty(x, kd, col) { const rr = (a, b, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); }, fill = c => { x.fillStyle = c; x.fill(); x.stroke(); },
      wh = (a, b, w, h, c) => { x.fillStyle = c || '#111'; rr(a, b, w, h, 2); x.fill(); }, dot = (a, b, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); };
    x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)';
    if (kd === 'f1') { wh(-20, 9, 7, 15); wh(13, 9, 7, 15); x.fillStyle = col; x.beginPath(); x.moveTo(-3, -29); x.lineTo(3, -29); x.lineTo(6, -8); x.lineTo(12, -3); x.lineTo(12, 19); x.lineTo(-12, 19); x.lineTo(-12, -3); x.lineTo(-6, -8); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#1b1b1b'; x.fillRect(-17, -30, 34, 4); x.fillRect(-16, 23, 32, 5); x.fillStyle = col; x.fillRect(-17, -30, 5, 4); x.fillRect(12, -30, 5, 4); x.fillStyle = 'rgba(255,255,255,.65)'; x.fillRect(-1, -27, 2, 17); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-12, 2, 3, 14); x.fillRect(9, 2, 3, 14); }
    else if (kd === 'buggy') { [[-21, -24], [14, -24], [-22, 8], [14, 8]].forEach(([a, b]) => { wh(a, b, 8, 16); x.fillStyle = '#555'; for (let q = 1; q < 16; q += 4) x.fillRect(a, b + q, 8, 1.2); });
      x.strokeStyle = '#2b2b2b'; x.lineWidth = 3; x.strokeRect(-12, -20, 24, 40); x.beginPath(); x.moveTo(-12, -20); x.lineTo(12, 20); x.moveTo(12, -20); x.lineTo(-12, 20); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)';
      rr(-10, -16, 20, 30, 6); fill(col); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-8, -14, 16, 4); x.strokeStyle = '#ffd23f'; x.lineWidth = 3; x.beginPath(); x.arc(0, 16, 10, Math.PI, 0); x.stroke(); }
    else if (kd === 'bed') { [[-15, -27], [15, -27], [-15, 25], [15, 25]].forEach(([a, b]) => dot(a, b, 2.4, '#333')); rr(-16, -29, 32, 57, 4); fill('#8a5a2b'); rr(-14, -27, 28, 53, 4); fill('#fff');
      rr(-14, -3, 28, 29, 3); fill(col); rr(-10, -25, 20, 10, 5); fill('#ffd1e3'); x.fillStyle = '#ff2d6f'; [[-6, 6], [5, 12], [-3, 19], [7, 3]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, b + 2.6); x.bezierCurveTo(a - 4, b, a - 2, b - 3, a, b - 1); x.bezierCurveTo(a + 2, b - 3, a + 4, b, a, b + 2.6); x.fill(); }); }
    else if (kd === 'sofa') { [[-20, -21], [17, -21], [-20, 20], [17, 20]].forEach(([a, b]) => wh(a, b, 4, 4, '#3a2a1a')); rr(-21, -22, 42, 47, 6); fill(col); x.fillStyle = 'rgba(0,0,0,.25)'; rr(-21, 12, 42, 13, 5); x.fill();
      rr(-21, -20, 8, 40, 4); fill(col); rr(13, -20, 8, 40, 4); fill(col); x.fillStyle = 'rgba(255,255,255,.22)'; rr(-12, -18, 11.5, 29, 3); x.fill(); rr(.5, -18, 11.5, 29, 3); x.fill(); dot(-15, 20, 3, '#ffd23f'); }
    else if (kd === 'toilet') { [[-11, -24], [11, -24], [-11, 22], [11, 22]].forEach(([a, b]) => dot(a, b, 2.4, '#222')); rr(-12, 9, 24, 17, 3); fill('#f4f4f4'); dot(0, 17, 2.4, '#bbb');
      x.beginPath(); x.ellipse(0, -7, 13, 17, 0, 0, TAU); fill('#fafafa'); x.strokeStyle = '#cfcfcf'; x.lineWidth = 3; x.beginPath(); x.ellipse(0, -8, 9, 12, 0, 0, TAU); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)';
      x.fillStyle = '#7fc8f8'; x.beginPath(); x.ellipse(0, -9, 5.5, 7.5, 0, 0, TAU); x.fill(); x.fillStyle = '#8a5a2b'; x.beginPath(); x.ellipse(1, -8, 2.2, 1.6, 0, 0, TAU); x.fill(); dot(16, 14, 4.5, '#fff'); dot(16, 14, 1.5, '#bbb'); x.fillStyle = col; x.fillRect(-12, 24, 24, 2); }
    else if (kd === 'tub') { [[-13, -26], [13, -26], [-13, 25], [13, 25]].forEach(([a, b]) => dot(a, b, 3, '#d4af37')); rr(-15, -28, 30, 56, 13); fill('#fff'); rr(-11, -24, 22, 48, 10); fill('#7fd3ff');
      [[-5, -14, 3], [4, -8, 2.2], [-3, 14, 2.6], [6, 18, 3.2], [0, -20, 1.8]].forEach(([a, b, r]) => dot(a, b, r, 'rgba(255,255,255,.9)')); rr(-3, 22, 6, 6, 2); fill('#9aa3ad'); x.fillStyle = '#ffd23f'; x.beginPath(); x.ellipse(6, -18, 3.5, 2.5, 0, 0, TAU); x.fill(); x.fillStyle = col; x.fillRect(-15, -2, 2, 6); }
    else if (kd === 'keg') { [[-15, -24], [11, -24], [-15, 14], [11, 14]].forEach(([a, b]) => wh(a, b, 4, 10)); rr(-14, -27, 28, 54, 12); fill('#9a6332'); x.strokeStyle = 'rgba(60,30,10,.45)'; x.lineWidth = 1; for (let q = -9; q <= 9; q += 6) { x.beginPath(); x.moveTo(q, -26); x.lineTo(q, 26); x.stroke(); }
      x.fillStyle = '#4a4f55'; [-18, 0, 18].forEach(b => x.fillRect(-14, b - 1.5, 28, 3)); rr(-3, -30, 6, 5, 1); fill('#9aa3ad'); rr(-9, 4, 18, 9, 2); fill(col); x.fillStyle = '#fff'; x.font = '900 5.5px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BIER', 0, 8.8); }
    else if (kd === 'disco' || kd === 'taxi' || kd === 'police') { const body = kd === 'taxi' ? '#ffd23f' : kd === 'police' ? '#f4f4f4' : col; [[-17, -22], [11, -22], [-17, 9], [11, 9]].forEach(([a, b]) => wh(a, b, 6, 13)); rr(-14, -28, 28, 55, 7); fill(body);
      if (kd === 'police') { x.fillStyle = '#1b1b1b'; x.fillRect(-14, -28, 28, 8); x.fillRect(-14, 19, 28, 8); }
      x.fillStyle = 'rgba(160,210,255,.9)'; rr(-11, -18, 22, 9, 3); x.fill(); rr(-11, 11, 22, 6, 2); x.fill();
      if (kd === 'taxi') { for (let q = 0; q < 7; q++) { x.fillStyle = q % 2 ? '#111' : '#fff'; x.fillRect(-14 + q * 4, -1, 4, 3); x.fillStyle = q % 2 ? '#fff' : '#111'; x.fillRect(-14 + q * 4, 2, 4, 3); } rr(-7, -6, 14, 5, 1.5); fill('#fff'); x.fillStyle = '#111'; x.font = '900 4.5px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TAXI', 0, -3.4); }
      if (kd === 'police') { rr(-10, -5, 10, 5, 1.5); fill('#2b6cff'); rr(0, -5, 10, 5, 1.5); fill('#ff2d2d'); x.fillStyle = '#111'; x.font = '900 4px system-ui'; x.textAlign = 'center'; x.fillText('POLÍCIA', 0, 6); }
      if (kd === 'disco') { ['#ff5fa2', '#ffd23f', '#22c3c9', '#9b5de5', '#7cff6b'].forEach((c, n) => { x.fillStyle = c; [[-12, -24 + n * 10], [12, -22 + n * 10]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 1.8, 0, TAU); x.fill(); }); });
        const g = x.createRadialGradient(-1, -26, .5, 0, -24, 5); g.addColorStop(0, '#fff'); g.addColorStop(1, '#8a93a0'); x.fillStyle = g; x.beginPath(); x.arc(0, -24, 4.6, 0, TAU); x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = .6; for (let q = -3; q <= 3; q += 2) { x.beginPath(); x.moveTo(-4.6, -24 + q); x.lineTo(4.6, -24 + q); x.stroke(); x.beginPath(); x.moveTo(q, -28.6); x.lineTo(q, -19.4); x.stroke(); } } }
    else if (kd === 'skate') { [[-11, -21], [7, -21], [-11, 15], [7, 15]].forEach(([a, b]) => wh(a, b, 4, 6, '#ffd23f')); x.fillStyle = '#9aa3ad'; x.fillRect(-10, -19, 20, 2); x.fillRect(-10, 17, 20, 2);
      rr(-8, -29, 16, 58, 8); fill('#c58b4e'); rr(-6.5, -25, 13, 50, 6); fill('#262626'); x.fillStyle = col; x.fillRect(-6.5, -2, 13, 4); }
    else if (kd === 'scooter') { [[-12, -20], [8, -20], [-12, 12], [8, 12]].forEach(([a, b]) => wh(a, b, 4, 9)); rr(-11, -20, 22, 44, 8); fill('#d62828'); rr(-9, -30, 18, 11, 2); fill('#c9a36b');
      x.strokeStyle = 'rgba(90,60,20,.6)'; x.lineWidth = .8; for (let q = -8; q < 9; q += 3) { x.beginPath(); x.moveTo(q, -30); x.lineTo(q + 3, -19); x.stroke(); } x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)'; rr(-8, 4, 16, 14, 5); fill('#333'); x.fillStyle = '#ffd23f'; x.fillRect(-2, 20, 4, 4); }
    else if (kd === 'jeep') { [[-18, -23], [12, -23], [-18, 9], [12, 9]].forEach(([a, b]) => wh(a, b, 6, 14)); rr(-15, -27, 30, 52, 4); fill('#6b7a45'); x.fillStyle = 'rgba(0,0,0,.25)'; for (let q = -24; q < -12; q += 3) x.fillRect(-12, q, 24, 1.2);
      x.strokeStyle = '#2b2b2b'; x.lineWidth = 2.6; x.strokeRect(-13, -9, 26, 26); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)'; dot(0, 27, 5.5, '#111'); dot(0, 27, 2.5, '#777'); x.fillStyle = col; x.fillRect(-15, -12, 30, 2.5); }
    else if (kd === 'trolley') { [[-11, -26], [7, -26], [-11, 22], [7, 22]].forEach(([a, b]) => wh(a, b, 4, 5)); const g = x.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, '#9aa3ad'); g.addColorStop(.5, '#e3e7ea'); g.addColorStop(1, '#8a939d'); rr(-12, -25, 24, 48, 2); fill(g);
      x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = 1; for (let q = -17; q < 23; q += 8) { x.beginPath(); x.moveTo(-12, q); x.lineTo(12, q); x.stroke(); } x.fillStyle = col; x.fillRect(-2, -25, 4, 48); x.strokeStyle = '#333'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(-11, 27); x.lineTo(11, 27); x.stroke(); }
    else if (kd === 'gator') { const gc = '#4f7d3a'; [[-17, -14], [12, -14], [-17, 10], [12, 10]].forEach(([a, b]) => { x.fillStyle = '#3d6230'; rr(a, b, 5, 8, 2.5); x.fill(); });
      x.fillStyle = gc; x.beginPath(); x.moveTo(0, -30); x.quadraticCurveTo(7, -28, 7, -18); x.quadraticCurveTo(14, -12, 14, 2); x.quadraticCurveTo(14, 16, 6, 21); x.quadraticCurveTo(2, 26, 0, 30); x.quadraticCurveTo(-2, 26, -6, 21); x.quadraticCurveTo(-14, 16, -14, 2); x.quadraticCurveTo(-14, -12, -7, -18); x.quadraticCurveTo(-7, -28, 0, -30); x.fill(); x.stroke();
      x.fillStyle = '#fff'; [-1, 1].forEach(sd => { for (let q = -27; q < -19; q += 3) { x.beginPath(); x.moveTo(sd * 5.5, q); x.lineTo(sd * 7.4, q + 1.2); x.lineTo(sd * 5.5, q + 2.4); x.fill(); } }); x.fillStyle = '#2f4f24'; for (let q = -6; q < 22; q += 5) [-5, 0, 5].forEach(a => { x.beginPath(); x.arc(a * (1 - q / 40), q, 1.6, 0, TAU); x.fill(); });
      [-1, 1].forEach(sd => { dot(sd * 5, -16, 2.6, '#e8d64a'); x.fillStyle = '#111'; x.fillRect(sd * 5 - .5, -18, 1, 4); }); }
    else if (kd === 'boller') { [[-18, -22], [13, -22], [-18, 10], [13, 10]].forEach(([a, b]) => wh(a, b, 5, 12)); rr(-14, -26, 28, 52, 3); fill('#7a4a22');
      x.strokeStyle = 'rgba(40,20,5,.5)'; x.lineWidth = 1; for (let q = -20; q < 26; q += 6) { x.beginPath(); x.moveTo(-14, q); x.lineTo(14, q); x.stroke(); } x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)';
      rr(-12, -24, 11, 15, 1.5); fill(col); rr(1, -24, 11, 15, 1.5); fill(col); [-21, -16.5, -12].forEach(b => [-9.5, -4, 3.5, 9].forEach(a => dot(a, b, 1.5, '#5aa34a')));
      rr(2, 13, 11, 9, 2); fill('#fff'); x.fillStyle = '#d62828'; x.fillRect(6.6, 14.2, 1.8, 6.6); x.fillRect(4.2, 16.6, 6.6, 1.8);
      x.strokeStyle = '#333'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(0, -26); x.lineTo(0, -29.5); x.moveTo(-5, -29.5); x.lineTo(5, -29.5); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)'; }
    else if (kd === 'bulli') { [[-18, -21], [12, -21], [-18, 11], [12, 11]].forEach(([a, b]) => wh(a, b, 6, 12)); rr(-15, -29, 30, 58, 9); fill(col); rr(-13, -27, 26, 22, 7); fill('#f4ecd8');
      x.fillStyle = 'rgba(160,210,255,.9)'; rr(-11, -25, 22, 7, 3); x.fill(); x.strokeStyle = '#f4ecd8'; x.lineWidth = 2; x.beginPath(); x.moveTo(-15, -5); x.lineTo(0, 4); x.lineTo(15, -5); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)';
      [[-8, 10, '#ffd23f'], [7, 16, '#ff5fa2'], [-5, 22, '#7cff6b'], [8, 4, '#22c3c9']].forEach(([a, b, c]) => { for (let q = 0; q < 5; q++) dot(a + Math.cos(q * TAU / 5) * 2.6, b + Math.sin(q * TAU / 5) * 2.6, 1.9, c); dot(a, b, 1.4, '#fff'); });
      x.strokeStyle = '#fff'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, -15, 4.2, 0, TAU); x.moveTo(0, -19.2); x.lineTo(0, -10.8); x.moveTo(0, -15); x.lineTo(-3, -12); x.moveTo(0, -15); x.lineTo(3, -12); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)'; }
    else if (kd === 'taco') { [[-18, -20], [12, -20], [-18, 10], [12, 10]].forEach(([a, b]) => wh(a, b, 6, 12)); rr(-15, -29, 30, 58, 6); fill(col);   // Taco-Döner-Truck: Schnurrbart am Kühler, Taco aufs Dach, Markise, Dönerspieß hinten
      x.fillStyle = 'rgba(160,210,255,.9)'; rr(-12, -26, 24, 7, 3); x.fill(); x.fillStyle = '#1b1b1b'; x.beginPath(); x.moveTo(0, -29); x.bezierCurveTo(-5, -33, -11, -32, -13, -28); x.bezierCurveTo(-8, -29, -4, -28, 0, -27); x.bezierCurveTo(4, -28, 8, -29, 13, -28); x.bezierCurveTo(11, -32, 5, -33, 0, -29); x.fill();
      rr(-12, -16, 24, 33, 4); fill('#f6efe0'); for (let q = -12; q < 16; q += 5) { x.fillStyle = (q / 5 & 1) ? '#fff' : '#d62828'; x.fillRect(15, q, 4, 5); }
      x.fillStyle = '#f2b134'; x.beginPath(); x.arc(0, 3, 9.5, Math.PI, 0); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#5aa34a'; for (let q = -7; q <= 7; q += 3.5) dot(q, 2, 2.2, '#5aa34a'); [[-4, -1], [3, -2], [6, 1]].forEach(([a, b]) => dot(a, b, 1.5, '#d62828'));
      dot(0, 23, 4.2, '#8a4a1f'); dot(0, 23, 2.4, '#c27a3a'); x.strokeStyle = '#555'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, 17); x.lineTo(0, 29); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)'; }
    else if (kd === 'momtaxi') { [[-17, -20], [12, -20], [-17, 10], [12, 10]].forEach(([a, b]) => wh(a, b, 5, 11)); rr(-15, -28, 30, 56, 9); fill(col);   // Mama-Taxi: Familienauto mit Lichterkette, Blumenkasten auf der Haube, Gartenzwerg hinten, Qualm aus dem Fenster
      x.fillStyle = 'rgba(160,210,255,.9)'; rr(-12, -21, 24, 8, 3); x.fill(); x.fillStyle = 'rgba(160,210,255,.75)'; rr(-11, 16, 22, 6, 2); x.fill();
      rr(-10, -29, 20, 5.5, 2); fill('#8a5a32'); [[-7, '#ff5fa2'], [-2.5, '#ffd23f'], [2, '#ff7b39'], [6.5, '#c79bf0']].forEach(([a, c0]) => { dot(a, -30, 2.2, c0); dot(a, -30, .9, '#fff3b0'); });
      const LC = ['#ffd23f', '#ff5fa2', '#7cff6b', '#22c3c9']; let q = 0; for (let b = -18; b <= 20; b += 6) { dot(-15.5, b, 1.3, LC[q++ % 4]); dot(15.5, b, 1.3, LC[q++ % 4]); }
      x.fillStyle = '#d62828'; x.beginPath(); x.moveTo(8, 7); x.lineTo(11.5, 15); x.lineTo(4.5, 15); x.closePath(); x.fill(); dot(8, 16.5, 2.6, '#f3d2b3'); dot(8, 18.6, 2.4, '#fff'); dot(8, 21.5, 2.6, '#2f6fd1');
      x.fillStyle = 'rgba(210,210,210,.55)'; [[-19, -6, 2.6], [-22, -10, 3.4], [-24.5, -15, 4.2]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); }); }
    else if (kd === 'golf') { [[-17, -20], [12, -20], [-17, 10], [12, 10]].forEach(([a, b]) => wh(a, b, 5, 10)); rr(-14, -27, 28, 54, 6); fill('#f4f4f0');   // Golfcart: weiß, Dach in Fahrerfarbe, hinten Golfbag, Ball und Fähnchen
      x.fillStyle = 'rgba(160,210,255,.85)'; rr(-11, -25, 22, 6, 2); x.fill(); rr(-15, -17, 30, 22, 4); fill(col);
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; for (let q = -10; q <= 10; q += 5) { x.beginPath(); x.moveTo(q, -16); x.lineTo(q, 4); x.stroke(); }
      dot(-7, 18, 5.2, '#3a2a1a'); dot(-7, 18, 3.6, '#6b4a2b'); [[-9.5, 15.5], [-6.5, 14.2], [-4.2, 17]].forEach(([a, b]) => dot(a, b, 1.4, '#c9ccd2')); dot(5, 19, 3, '#fff');
      x.strokeStyle = '#e8e8e8'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(10, 27); x.lineTo(10, 11); x.stroke(); x.fillStyle = '#d62828'; x.beginPath(); x.moveTo(10, 11); x.lineTo(16.5, 13.5); x.lineTo(10, 16); x.closePath(); x.fill(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(0,0,0,.55)'; }
    else return false; return true; }
  const HEAD = {}, VEH = {};
  // Kart-Foto einer Person: alt = Zustands-Figur; crew[].swap2 vertauscht im Kart erstes und zweites Foto (Steckbrief/Shows bleiben beim ersten)
  const kPhoto = (p, alt) => { const L = LOOK[p.id] || {}, two = !!p.photo2, use2 = two && (!!alt !== !!p.swap2); return use2 ? {src: p.photo2, f: L.face2} : {src: p.photo, f: L.face}; };
  function makeHeads() {
    CREW.forEach(p => {
      const L = LOOK[p.id] || {}, col = L.shirt || '#00a651', R = 52, sh = (STY[p.id] || {}).shp || 'circle';
      const hs = sprite(2 * R + 12, 2 * R + 12, (x) => { x.translate(R + 6, R + 6); x.fillStyle = col; shapePath(x, sh, R + 6); x.fill();
        x.fillStyle = '#ffe0bd'; shapePath(x, sh, R); x.fill(); x.fillStyle = '#333'; x.font = '800 52px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.name[0], 0, 1); });
      HEAD[p.id] = hs; XDRV.filter(x0 => x0.base === p.id).forEach(x0 => { HEAD[x0.id] = xHead(x0, null); });
      // Foto der Person; die Zustands-Figur (z. B. Patrick vollgefressen) nimmt das zweite Foto (photo2 + look.face2), falls vorhanden
      const k1 = kPhoto(p, false); if (p.photo) { const im = new Image(); im.onload = () => { const x = hs.getContext('2d'), f = k1.f || {x: .5, y: .5, z: 1}, D = 2 * R * f.z;
        x.setTransform(1, 0, 0, 1, 0, 0); x.save(); x.translate(R + 6, R + 6); shapePath(x, sh, R); x.clip(); x.drawImage(im, -f.x * D, -f.y * D, D, D); x.restore();
        x.save(); x.translate(R + 6, R + 6); x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2.5; shapePath(x, sh, R + 1); x.stroke(); x.restore();
        if (!p.photo2) XDRV.filter(x0 => x0.base === p.id).forEach(x0 => { xHead(x0, {im, f}, HEAD[x0.id]); }); HEADC = {}; }; im.src = k1.src; }
      if (p.photo2) { const k2 = kPhoto(p, true), im2 = new Image(); im2.onload = () => { const f = k2.f || {x: .5, y: .5, z: 1}; XDRV.filter(x0 => x0.base === p.id).forEach(x0 => { xHead(x0, {im: im2, f}, HEAD[x0.id]); }); HEADC = {}; }; im2.src = k2.src; }
    });
    XDRV.filter(x0 => x0.npc).forEach(x0 => { HEAD[x0.id] = xHead(x0, null); if (x0.photo) { const im = new Image(); im.onload = () => { xHead(x0, {im, f: x0.face || {x: .5, y: .5, z: 1}}, HEAD[x0.id]); HEADC = {}; }; im.src = x0.photo; } });
  }
  // Kopf der Zusatz-Fahrer: Foto der Person in eigener Form mit Zeichnung darüber bzw. Emoji ohne Rahmen (Serien-Figuren)
  function xHead(X, src, into) { const R = 52, W0 = 2 * R + 12, sh = (STY[X.id] || {}).shp || 'circle';
    const draw = (x) => { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W0, W0); x.translate(R + 6, R + 6);
      if (X.npc && !src) { x.font = '96px system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 8; x.shadowOffsetY = 3; x.fillText(X.e, 0, 6); return; }
      x.fillStyle = X.col; shapePath(x, sh, R + 6); x.fill();
      if (sh === 'mug') { x.strokeStyle = X.col; x.lineWidth = 9; x.beginPath(); x.arc(R * .86, 4, R * .34, -Math.PI / 2, Math.PI / 2); x.stroke(); }
      x.save(); if (X.ov === 'fat') x.scale(1.12, .96); shapePath(x, sh, R); x.clip(); if (src) { const f = src.f, D = 2 * R * f.z; x.drawImage(src.im, -f.x * D, -f.y * D, D, D); } else { x.fillStyle = '#ffe0bd'; x.fill(); } x.restore();
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2.5; shapePath(x, sh, R + 1); x.stroke();
      const em = (e, px, ex, ey, rot) => { x.save(); x.translate(ex, ey); if (rot) x.rotate(rot); x.font = px + 'px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 0, 0); x.restore(); };
      x.save(); shapePath(x, sh, R); x.clip();
      if (X.ov === 'love') { x.fillStyle = 'rgba(255,95,162,.28)'; x.fillRect(-R, -R, 2 * R, 2 * R); }
      if (X.ov === 'fat') { x.fillStyle = 'rgba(255,120,90,.18)'; x.fillRect(-R, -R, 2 * R, 2 * R); }
      if (X.ov === 'sick') { x.fillStyle = 'rgba(120,190,60,.38)'; x.fillRect(-R, -R, 2 * R, 2 * R); }
      if (X.ov === 'hang') { x.fillStyle = 'rgba(160,200,140,.25)'; x.fillRect(-R, -R, 2 * R, 2 * R); }
      if (X.ov === 'grump') { x.fillStyle = 'rgba(220,40,40,.16)'; x.fillRect(-R, -R, 2 * R, 2 * R); }
      if (X.ov === 'disco') { ['#ff5fa2', '#ffd23f', '#22c3c9', '#9b5de5'].forEach((c, n) => { x.fillStyle = c; x.globalAlpha = .22; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R * 1.5, n * TAU / 4, n * TAU / 4 + TAU / 8); x.fill(); }); x.globalAlpha = 1; }
      x.restore();
      if (X.ov === 'love') { em('💋', 30, R * .45, R * .2, -.3); em('❤️', 26, -R * .7, -R * .7); em('💕', 22, R * .72, -R * .72); }
      if (X.ov === 'fat') { em('🍗', 34, R * .62, R * .5, .5); em('💦', 18, -R * .72, -R * .5); }
      if (X.ov === 'sick') { em('💩', 30, R * .65, R * .55); em('💦', 20, -R * .7, -R * .55); }
      if (X.ov === 'hang') { em('🕶️', 52, 0, -R * .12); em('💫', 22, R * .7, -R * .75); }
      if (X.ov === 'foam') { x.fillStyle = '#fffaf0'; [[-.6, -.85, .32], [-.15, -.98, .36], [.35, -.92, .34], [.7, -.8, .26]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a * R, b * R, r * R, 0, TAU); x.fill(); }); }
      if (X.ov === 'disco') { em('🪩', 28, R * .66, -R * .66); }
      if (X.ov === 'grump') { em('💢', 30, R * .7, -R * .7); em('💨', 20, -R * .78, -R * .5, .3); }
      if (X.ov === 'hippie') { em('🌼', 24, -R * .62, -R * .78, -.3); em('✌️', 24, R * .74, -R * .62, .2); }
      if (X.ov === 'taco') { em('🌮', 26, -R * .66, -R * .74, -.3); em('🤙', 24, R * .74, -R * .62, .2); }
      if (X.ov === 'golf') { em('⛳', 24, -R * .66, -R * .76, -.2); em('🗯️', 24, R * .74, -R * .64, .2); }
      if (X.ov === 'mum') { em('🚬', 24, R * .72, R * .42, -.25); em('💐', 24, -R * .7, -R * .72, -.25); em('💨', 18, R * .88, R * .08, .2); } };
    const c = into || sprite(W0, W0, () => {}); draw(c.getContext('2d')); return c; }
  const FW = {kart: [[-14, -13], [14, -13]], gold: [[-14, -13], [14, -13]], uber: [[-14, -13], [14, -13]], uno: [[-14, -13], [14, -13]], cart: [[-16, -10], [16, -10]], trak: [[-11, -21], [11, -21]]};
  const vehOf = id => T.veh === 'boat' ? 'boat' : id === me ? myVeh() : T.veh === 'cart' ? 'cart' : 'kart';   // nur der Amazonas zwingt alle ins Boot; auf Ilha Grande fahren nur die Gegner Gepäckkarren (Wunsch Patrick 09.10.: gewähltes Fahrzeug = gefahrenes Fahrzeug)
  // Lack & Aufkleber je Fahrer (Garage): Farbe c (null = Shirt-Farbe), Aufkleber s
  const PAINTS = [null, '#d62828', '#ff8a00', '#ffd23f', '#1d9a5b', '#1694b8', '#2b5f9e', '#7b4ea0', '#ff5fa2', '#222222', '#f4f4f4', '#c9a227'];
  const STK = [{id: 'stripes', e: '🏁', n: 'Rennstreifen', c: 30}, {id: 'num', e: '#️⃣', n: 'Startnummer', c: 20}, {id: 'flag', e: '🇧🇷', n: 'Brasil-Heck', c: 25}, {id: 'name', e: '🔤', n: '„GRINGO“', c: 25}, {id: 'flames', e: '🔥', n: 'Flammen', c: 40}];
  const NUMS = {jonas: 7, simon: 10, patrick: 69, marco: 9, greisel: 12, dajo: 23};
  const paintOf = id => Object.assign({c: null, s: []}, loadJ('kartPaint')[id] || {});
  const partsPt = () => { const pp = partsOf(); return {tire: pp.tire, wing: pp.wing}; };
  function makeVehicles() {
    DRVS.forEach(id => { const p = {id}; const pt = Object.assign({}, paintOf(p.id), id === me ? partsPt() : {}); VEH[p.id] = vehSprite(pt.c || (LOOK[p.id] || {}).shirt || '#00a651', vehOf(p.id), pt, p.id); }); }
  // Glanz + Tiefe über jedes Fahrzeug (einmal ins Sprite gebacken, nur auf vorhandene Pixel): Lichtkante, Spiegelstreifen, dunklere Ränder (Qualitätsrunde 2)
  function vehSprite(col, vt, pt, nid) { const c = vehSprite0(col, vt, pt, nid); try { const x = c.getContext('2d'), w = c.width, h = c.height; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
      let g = x.createLinearGradient(0, 0, w, h * .9); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.28, 'rgba(255,255,255,0)'); g.addColorStop(.4, 'rgba(255,255,255,0)'); g.addColorStop(.46, 'rgba(255,255,255,.3)'); g.addColorStop(.53, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,.22)'); g.addColorStop(.22, 'rgba(0,0,0,0)'); g.addColorStop(.78, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.26)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(.72, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore(); } catch (e) {} return c; }
  function vehSprite0(col, vt, pt, nid) { pt = pt || {s: []}; const cus = vt === 'kart' ? STYK(nid) : null, plain = !cus || KLIKE[cus];
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
        else if (VNEW[vt]) { const rr = (a, b, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); }, ci = (a, b, r) => { x.beginPath(); x.arc(a, b, r, 0, TAU); }, ln = (a, b, c, d) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); };
          if (vt === 'capi') { const fur = '#9a6534', dk = '#6a4220';   // Capivara mit Orange auf dem Kopf (Meme), Sattel in Fahrerfarbe
            x.fillStyle = dk; [[-14, -12], [14, -12], [-14, 15], [14, 15]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 4, 6, 0, 0, TAU); x.fill(); });
            x.fillStyle = fur; x.beginPath(); x.ellipse(0, 3, 13.5, 22, 0, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.ellipse(0, -20, 9.5, 9.5, 0, 0, TAU); x.fill(); x.stroke();
            x.strokeStyle = 'rgba(70,40,15,.45)'; x.lineWidth = 1; [[-8, 16], [8, 14], [-9, -2], [9, 0], [0, 20]].forEach(([a, b]) => ln(a, b, a + 2, b + 4));
            x.fillStyle = dk; x.beginPath(); x.ellipse(0, -27.5, 7, 3.8, 0, 0, TAU); x.fill(); [-7, 7].forEach(a => { ci(a, -14, 2.4); x.fill(); }); x.fillStyle = '#111'; [-6.5, 6.5].forEach(a => { ci(a, -22, 1.6); x.fill(); }); [-2, 2].forEach(a => { ci(a, -28.5, .9); x.fill(); });
            x.fillStyle = col; x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 2; rr(-10, -5, 20, 21, 5); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(-10, -1, 20, 1.6); x.fillRect(-10, 11, 20, 1.6);
            x.fillStyle = '#ff9d1c'; ci(0, -19, 4.2); x.fill(); x.fillStyle = '#ffc56b'; ci(-1.3, -20.3, 1.3); x.fill(); x.fillStyle = '#3aa635'; x.beginPath(); x.ellipse(2.4, -23.4, 2.2, 1.1, -.5, 0, TAU); x.fill(); }
          else if (vt === 'moto') {   // Motoboy mit Lieferbox
            x.fillStyle = '#111'; rr(-3, -30, 6, 12, 3); x.fill(); rr(-3.5, 17, 7, 13, 3); x.fill(); x.fillStyle = '#9aa3ad'; x.fillRect(-1.2, -20, 2.4, 8);
            x.fillStyle = col; x.beginPath(); x.ellipse(0, -7, 6.5, 9.5, 0, 0, TAU); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(-2, -10, 1.6, 4, 0, 0, TAU); x.fill();
            x.fillStyle = '#1d1d1d'; rr(-5, 1, 10, 13, 4); x.fill(); x.fillStyle = '#ffe9a8'; ci(0, -19, 2.6); x.fill();
            x.strokeStyle = '#333'; x.lineWidth = 1.2; [-1, 1].forEach(sd => { ln(sd * 5, -13, sd * 10, -16); x.fillStyle = '#c0c6cc'; ci(sd * 10.5, -16.5, 1.8); x.fill(); });
            x.fillStyle = '#e3262f'; x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 2; rr(-10, 11, 20, 17, 3); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.font = '900 5px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('GRINGO', 0, 18.5); x.fillText('FOOD', 0, 24.5); }
          else if (vt === 'coco') {   // Kokoswasser-Karren mit Schild und Schiebegriff
            x.fillStyle = '#222'; [[-20, -18], [15, -18]].forEach(([a, b]) => { rr(a, b, 5, 14, 2); x.fill(); });
            x.fillStyle = '#a8743f'; rr(-16, -28, 32, 30, 3); x.fill(); x.stroke(); x.strokeStyle = 'rgba(60,30,10,.45)'; x.lineWidth = 1; [-8, 0, 8].forEach(a => ln(a, -27, a, 1));
            [[-9, -20], [0, -22], [9, -20], [-5, -12], [5, -12], [-10, -5], [0, -5], [10, -5]].forEach(([a, b], n) => { x.fillStyle = n % 3 ? '#5aa02c' : '#478a22'; ci(a, b, 5.2); x.fill(); x.strokeStyle = 'rgba(30,60,10,.6)'; x.stroke(); x.fillStyle = 'rgba(255,255,255,.35)'; ci(a - 1.5, b - 1.8, 1.4); x.fill(); });
            x.fillStyle = col; rr(-14, -31, 28, 6, 2); x.fill(); x.fillStyle = '#fff'; x.font = '900 3.8px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('ÁGUA DE COCO', 0, -26.8);
            x.strokeStyle = '#5a3a1a'; x.lineWidth = 2.4; ln(-10, 2, -9, 6); ln(10, 2, 9, 6); }
          else if (vt === 'sail') {   // Strandsegler: drei Räder, schmaler Rumpf, großes Segel in Fahrerfarbe vor dem Fahrer (Mast vorne, Baum quer)
            x.fillStyle = '#111'; rr(-21, 13, 5, 11, 2); x.fill(); rr(16, 13, 5, 11, 2); x.fill(); rr(-2.5, -30, 5, 10, 2); x.fill(); x.strokeStyle = '#7a5a3a'; x.lineWidth = 3; ln(-18, 18, 18, 18);
            x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 2; x.fillStyle = '#ece6d4'; x.beginPath(); x.moveTo(0, -27); x.quadraticCurveTo(7, -6, 6, 25); x.lineTo(-6, 25); x.quadraticCurveTo(-7, -6, 0, -27); x.fill(); x.stroke();
            x.fillStyle = '#333'; rr(-5, 9, 10, 15, 3); x.fill();
            x.save(); x.globalAlpha = .92; const g = x.createLinearGradient(0, -24, 20, 8); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, col); g.addColorStop(1, col); x.fillStyle = g; x.beginPath(); x.moveTo(0, -25); x.quadraticCurveTo(22, -14, 19, 7); x.lineTo(1, 7); x.closePath(); x.fill(); x.restore(); x.stroke();
            x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1; ln(2, -15, 15, -10); ln(2, -4, 18, -1); x.strokeStyle = '#444'; x.lineWidth = 2; ln(1, 7, 20, 7); x.fillStyle = '#333'; ci(0, -18, 2.2); x.fill(); }
          else if (vt === 'horse') {   // Pferdekutsche aus Paraty: Pferd vorne, Kutsche in Fahrerfarbe hinten
            x.fillStyle = '#2a2a2a'; rr(-19, 7, 5, 18, 2); x.fill(); rr(14, 7, 5, 18, 2); x.fill(); x.strokeStyle = '#888'; x.lineWidth = 1; [11, 16, 21].forEach(b => { ln(-19, b, -14, b); ln(14, b, 19, b); });
            x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 2; x.fillStyle = col; rr(-13, 2, 26, 27, 4); x.fill(); x.stroke(); x.fillStyle = 'rgba(0,0,0,.25)'; rr(-10, 13, 20, 13, 3); x.fill();
            x.strokeStyle = '#5a3a1a'; x.lineWidth = 2; ln(-5, 3, -5, -6); ln(5, 3, 5, -6);
            x.strokeStyle = 'rgba(0,0,0,.55)'; x.fillStyle = '#7a4a26'; x.beginPath(); x.ellipse(0, -11, 6.5, 12, 0, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.ellipse(0, -25.5, 3.6, 5.5, 0, 0, TAU); x.fill(); x.stroke();
            x.fillStyle = '#2b1a0e'; x.fillRect(-1.2, -23, 2.4, 15); x.beginPath(); x.ellipse(0, 1.5, 2, 3.5, 0, 0, TAU); x.fill(); x.fillStyle = '#7a4a26'; [-1, 1].forEach(sd => { x.beginPath(); x.moveTo(sd * 1.5, -29); x.lineTo(sd * 3.5, -32); x.lineTo(sd * 3.4, -28); x.fill(); });
            x.strokeStyle = 'rgba(40,20,5,.8)'; x.lineWidth = 1; ln(-6, 3, -3, -23); ln(6, 3, 3, -23); }
          else if (vt === 'trak') {   // Traktor: große Hinterräder, Motorhaube, Zuckerrohr hinten (Vorderräder lenken als FW mit)
            x.fillStyle = '#111'; rr(-22, -2, 9, 24, 3); x.fill(); rr(13, -2, 9, 24, 3); x.fill(); x.fillStyle = '#4a4a4a'; for (let b = 0; b < 22; b += 3) { x.fillRect(-22, b - 1, 9, 1.3); x.fillRect(13, b - 1, 9, 1.3); }
            x.fillStyle = '#2e8b3a'; rr(-7, -29, 14, 22, 3); x.fill(); x.stroke(); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-5, -28, 10, 2); x.fillStyle = '#ffd23f'; ci(-4.5, -27, 1.4); x.fill(); ci(4.5, -27, 1.4); x.fill();
            x.fillStyle = col; rr(-12, -8, 24, 22, 4); x.fill(); x.stroke(); x.fillStyle = 'rgba(160,210,255,.7)'; x.fillRect(-9, -6, 18, 5); x.fillStyle = '#333'; ci(4.5, -17, 2.2); x.fill();
            x.fillStyle = '#c9b25a'; rr(-10, 15, 20, 14, 2); x.fill(); x.strokeStyle = '#6f9a2e'; x.lineWidth = 1.5; for (let j = 0; j < 6; j++) ln(-9 + j * 3.6, 15, -8 + j * 3.6, 29); }
          else if (vt === 'rocket') {   // Liegestuhl auf einer Rakete
            x.fillStyle = '#c9ced6'; rr(-6, -28, 12, 56, 6); x.fill(); x.stroke(); x.fillStyle = '#d62828'; x.beginPath(); x.moveTo(-6, -21); x.quadraticCurveTo(0, -35, 6, -21); x.closePath(); x.fill();
            [-1, 1].forEach(sd => { x.beginPath(); x.moveTo(sd * 6, 11); x.lineTo(sd * 15, 27); x.lineTo(sd * 6, 23); x.closePath(); x.fill(); x.stroke(); }); x.fillStyle = '#555'; rr(-4, 24, 8, 5, 1); x.fill();
            x.fillStyle = '#8b5a2b'; rr(-13, -10, 26, 28, 2); x.fill(); for (let j = 0; j < 7; j++) { x.fillStyle = j % 2 ? '#ffffff' : col; x.fillRect(-11, -8 + j * 3.6, 22, 3.6); } x.fillStyle = '#6b4220'; x.fillRect(-15, -4, 3.5, 15); x.fillRect(11.5, -4, 3.5, 15); }
          else if (vt === 'trio') {   // Trio Elétrico: Führerhaus vorne, Bühne mit Boxen, DJ-Pult, Partylichter (bunt flackernd im Rennen)
            x.fillStyle = '#111'; [[-17, -25], [12, -25], [-17, 8], [12, 8], [-17, 18], [12, 18]].forEach(([a, b]) => { rr(a, b, 5, 10, 2); x.fill(); });
            x.fillStyle = col; rr(-13, -30, 26, 12, 4); x.fill(); x.stroke(); x.fillStyle = 'rgba(160,210,255,.85)'; x.fillRect(-10, -28.5, 20, 4);
            x.fillStyle = '#1b1b2a'; rr(-16, -17, 32, 47, 3); x.fill(); x.stroke();
            for (let j = 0; j < 4; j++) [-1, 1].forEach(sd => { x.fillStyle = '#3a3a48'; ci(sd * 12.5, -10 + j * 10, 3.6); x.fill(); x.fillStyle = '#777'; ci(sd * 12.5, -10 + j * 10, 1.4); x.fill(); });
            x.fillStyle = '#444'; rr(-7, -15, 14, 5, 1.5); x.fill(); ['#ff2a6a', '#ffd23f', '#3ad1ff'].forEach((c, n) => { x.fillStyle = c; ci(-4 + n * 4, -12.5, 1); x.fill(); });
            x.fillStyle = '#ffd23f'; rr(-14, 24, 28, 5, 1); x.fill(); x.fillStyle = '#1b1b2a'; x.font = '900 4.4px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('AXÉ GRINGO', 0, 28); } }
        else if (cus) drawSty(x, cus, col);
        else { x.fillStyle = '#111'; [[-17, 8], [11, 8]].forEach(([a, b]) => { x.beginPath(); x.roundRect ? x.roundRect(a, b, 6, 14, 2) : x.rect(a, b, 6, 14); x.fill(); });
          x.fillStyle = col; x.beginPath(); x.moveTo(-9, -27); x.lineTo(9, -27); x.lineTo(13, -6); x.lineTo(13, 22); x.lineTo(-13, 22); x.lineTo(-13, -6); x.closePath(); x.fill(); x.stroke();
          x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(-8, -24, 16, 5); x.fillStyle = '#222'; x.fillRect(-15, 20, 30, 5); }
        if (vt !== 'boat' && vt !== 'wheel' && !cus && !VNEW[vt]) { const g = x.createLinearGradient(-14, 0, 14, 0); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); x.fillStyle = g; x.fillRect(-13, -26, 26, 48); }
        // Aufkleber (nur auf Karosserien)
        if (vt !== 'boat' && vt !== 'wheel' && vt !== 'cart' && plain && !VNEW[vt]) { const S0 = pt.s || [];
          if (S0.includes('stripes')) { x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(-5, -26, 3, 47); x.fillRect(2, -26, 3, 47); }
          if (S0.includes('flames')) { [-1, 1].forEach(sd => { x.fillStyle = '#ff5a1f'; x.beginPath(); x.moveTo(sd * 12, -20); x.quadraticCurveTo(sd * 4, -14, sd * 12, -6); x.quadraticCurveTo(sd * 6, -10, sd * 12, 4); x.lineTo(sd * 13, -20); x.fill(); x.fillStyle = '#ffd23f'; x.beginPath(); x.moveTo(sd * 12, -16); x.quadraticCurveTo(sd * 7, -12, sd * 12, -8); x.fill(); }); }
          if (S0.includes('flag')) { x.fillStyle = '#009c3b'; x.fillRect(-12, 12, 24, 8); x.fillStyle = '#ffdf00'; x.beginPath(); x.moveTo(-7, 16); x.lineTo(0, 12.5); x.lineTo(7, 16); x.lineTo(0, 19.5); x.fill(); x.fillStyle = '#002776'; x.beginPath(); x.arc(0, 16, 2.2, 0, TAU); x.fill(); }
          if (S0.includes('num')) { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -3, 6.5, 0, TAU); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 1; x.stroke(); x.fillStyle = '#111'; x.font = '900 7px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(NUMS[nid] || 1), 0, -2.6); }
          if (S0.includes('name')) { x.save(); x.fillStyle = 'rgba(255,255,255,.95)'; x.font = '900 5px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GRINGO', 0, 9); x.restore(); } }
        // Baukasten: Reifen + Flügel (pt.tire, pt.wing)
        if (vt !== 'boat' && plain && !VNEW[vt] && pt.tire && pt.tire !== 'std') { [[-17, 8], [11, 8], [-17, -22], [11, -22]].forEach(([a, b], n) => { if (vt === 'wheel' || (vt === 'cart' && n > 1)) return;
            if (pt.tire === 'coco') { x.fillStyle = '#7a4a22'; x.beginPath(); x.ellipse(a + 3, b + 7, 5, 8, 0, 0, TAU); x.fill(); x.strokeStyle = '#4a2a10'; x.lineWidth = 1; for (let q = -5; q < 7; q += 3) { x.beginPath(); x.moveTo(a, b + 7 + q); x.lineTo(a + 6, b + 8 + q); x.stroke(); } }
            if (pt.tire === 'off') { x.fillStyle = '#111'; x.fillRect(a - 1.5, b - 1, 9, 16); x.fillStyle = '#555'; for (let q = 0; q < 15; q += 3) x.fillRect(a - 1.5, b - 1 + q, 9, 1.4); }
            if (pt.tire === 'slick') { x.fillStyle = '#0d0d0d'; x.fillRect(a - .5, b, 7, 14); x.fillStyle = '#ff2d2d'; x.fillRect(a + 2.3, b, 1.4, 14); }
            if (pt.tire === 'monster') { x.fillStyle = '#0b0b0b'; x.beginPath(); x.roundRect ? x.roundRect(a - 4, b - 3, 14, 20, 4) : x.rect(a - 4, b - 3, 14, 20); x.fill(); x.fillStyle = '#c0c4c8'; x.beginPath(); x.arc(a + 3, b + 7, 3, 0, TAU); x.fill(); } }); }
        if (vt !== 'boat' && plain && !VNEW[vt] && pt.wing && pt.wing !== 'none') { x.lineWidth = 1.5; x.strokeStyle = 'rgba(0,0,0,.55)';
          if (pt.wing === 'surf') { const g = x.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, '#22c3c9'); g.addColorStop(.5, '#fff'); g.addColorStop(1, '#ff8a00'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 25, 21, 4.2, 0, 0, TAU); x.fill(); x.stroke(); x.fillStyle = '#d62828'; x.fillRect(-1, 21, 2, 8); }
          if (pt.wing === 'palm') { x.fillStyle = '#2e9e4a'; [-1, 1].forEach(sd => { x.beginPath(); x.moveTo(0, 24); x.quadraticCurveTo(sd * 12, 16, sd * 21, 27); x.quadraticCurveTo(sd * 10, 25, 0, 27); x.fill(); x.stroke(); }); x.strokeStyle = '#1b6b2e'; x.beginPath(); x.moveTo(-18, 26); x.lineTo(18, 26); x.stroke(); }
          if (pt.wing === 'jet') { [-7, 7].forEach(sd => { x.fillStyle = '#8a8f96'; x.fillRect(sd - 3.5, 18, 7, 10); x.strokeRect(sd - 3.5, 18, 7, 10); x.fillStyle = '#ff8a00'; x.beginPath(); x.arc(sd, 28.5, 2.6, 0, TAU); x.fill(); }); } } });
  }

  /* ---- Ton: Motor, Synth-Effekte, echte Geräusche, Samba, Ansager ---- */
  let AC = null, eng = null, MG = null, FXG = null, SOUND = store.get('kartSound') !== '0', ANN = store.get('kartAnn') !== '0';
  const BUF = {sfx: null, ann: null, ann2: null, ann3: null, ann4: null, ann5: null}; let loading = false; const RAWC = {};
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
    const get = (u, k) => (RAWC[u] || (RAWC[u] = fetch(u).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).catch(e => { delete RAWC[u]; throw e; }))).then(b => decodeAt(AC, b.slice(0), k === 'sfx' ? 32000 : 24000)).then(d => { BUF[k] = d; }).catch(() => {});   // MP3 bleibt im Speicher (~12 MB): nach Schließen/Öffnen nur neu entpacken, nicht neu herunterladen (Datenvolumen unterwegs)   // Stimmen sind 24-kHz-Aufnahmen: halber Speicher ohne hörbaren Unterschied
    // zuerst nur Geräusche + Haupt-Ansager; die übrigen Stimmen-Pakete erst beim ersten Rennen nacheinander (lädt nicht alles auf einmal)
    if (TRIP.sfx) { const sp = window.loadSfx && window.loadSfx(AC); if (sp) sp.then(b => { if (b) BUF.sfx = b; else get('audio/sfx.mp3', 'sfx'); }); else get('audio/sfx.mp3', 'sfx'); } if (TRIP.kartvo) get('audio/kart.mp3', 'ann'); if (TRIP.kartvo && Object.values(TRIP.kartvo).some(v => v.f === 7)) get('audio/kart7.mp3', 'ann7'); if (TRIP.kartvo && Object.values(TRIP.kartvo).some(v => v.f === 10)) get('audio/kart10.mp3', 'ann10'); BUF.more = () => { if (BUF.moreDone) return; BUF.moreDone = 1; let w = 0; const q = (u, k) => { w += 700; setTimeout(() => get(u, k), w); }; if (TRIP.kartvo) { const get = q; if (Object.values(TRIP.kartvo).some(v => v.f === 8)) get('audio/kart8.mp3', 'ann8'); if (Object.values(TRIP.kartvo).some(v => v.f === 9)) get('audio/kart9.mp3', 'ann9'); if (Object.values(TRIP.kartvo).some(v => v.f === 11)) get('audio/kart11.mp3', 'ann11'); if (Object.values(TRIP.kartvo).some(v => v.f === 6)) get('audio/kart6.mp3', 'ann6'); if (Object.values(TRIP.kartvo).some(v => v.f === 2)) get('audio/kart2.mp3', 'ann2'); if (Object.values(TRIP.kartvo).some(v => v.f === 3)) get('audio/kart3.mp3', 'ann3'); if (Object.values(TRIP.kartvo).some(v => v.f === 4)) get('audio/kart4.mp3', 'ann4'); if (Object.values(TRIP.kartvo).some(v => v.f === 5)) get('audio/kart5.mp3', 'ann5'); } };
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
  // Menü-Musik: drei eigene Stücke, live per Web Audio erzeugt (keine Dateien); bei jedem Öffnen zufällig eins, nie zweimal hintereinander dasselbe.
  // Aufbau je Stück: 4 Takte Intro, dann Schleife aus 8 Takten Drop, 8 Takten Drop mit Melodie, 4 Takten Break.
  const MM = {next: 0, step: 0, iv: 0, g: null, dl: null, on: false, song: null};
  const hz = (base, n) => base * Math.pow(2, n / 12);
  let MMCURVE = null;
  function mmGraph() { const a = AC; if (MM.g && MM.g.context === a) return; MM.g = a.createGain(); MM.g.gain.value = 0; MM.g.connect(a.destination);
    MM.dl = a.createDelay(1); MM.dl.delayTime.value = .34; const fb = a.createGain(); fb.gain.value = .3; const wet = a.createGain(); wet.gain.value = .3;
    MM.dl.connect(fb); fb.connect(MM.dl); MM.dl.connect(wet); wet.connect(MM.g);
    MMCURVE = new Float32Array(1024); for (let k = 0; k < 1024; k++) { const x = k / 512 - 1; MMCURVE[k] = Math.tanh(x * 3.2); } }
  // Bausteine (t = Startzeit)
  function mmOsc(t, f, d, type, v, o) { o = o || {}; const a = AC, n = a.createOscillator(), g = a.createGain(); n.type = type; n.frequency.setValueAtTime(f, t); if (o.f2) n.frequency.exponentialRampToValueAtTime(o.f2, t + (o.sl || d)); if (o.det) n.detune.value = o.det;
    let src = n; if (o.dist) { const ws = a.createWaveShaper(); ws.curve = MMCURVE; n.connect(ws); src = ws; }
    if (o.lp || o.bp) { const fl = a.createBiquadFilter(); fl.type = o.bp ? 'bandpass' : 'lowpass'; fl.frequency.setValueAtTime(o.bp || o.lp, t); if (o.lp2) fl.frequency.exponentialRampToValueAtTime(o.lp2, t + d); fl.Q.value = o.q || 1; src.connect(fl); fl.connect(g); } else src.connect(g);
    const at = o.at || .004; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + at); if (o.hold) g.gain.setValueAtTime(v, t + o.hold); g.gain.exponentialRampToValueAtTime(.0001, t + d); g.connect(MM.g); if (o.dly) g.connect(MM.dl); n.start(t); n.stop(t + d + .05); return n; }
  function mmNz(t, d, v, type, f, q) { const a = AC, len = Math.max(1, a.sampleRate * d | 0), bf = a.createBuffer(1, len, a.sampleRate), dd = bf.getChannelData(0); for (let k = 0; k < len; k++) dd[k] = (Math.random() * 2 - 1) * (1 - k / len);
    const src = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); src.buffer = bf; fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1; g.gain.value = v; src.connect(fl); fl.connect(g); g.connect(MM.g); src.start(t); }
  const mmKick = (t, v, f0) => mmOsc(t, f0 || 160, .3, 'sine', v, {f2: 42, sl: .1});
  const mmClap = (t, v) => { mmNz(t, .18, v, 'bandpass', 1500, .7); mmNz(t, .06, v * .7, 'bandpass', 2800, 2); };
  const mmSnare = (t, v) => { mmNz(t, .16, v, 'bandpass', 1900, .6); mmOsc(t, 210, .1, 'triangle', v * .8, {f2: 140}); };
  const mmHat = (t, v, open) => mmNz(t, open ? .1 : .03, v, 'highpass', open ? 7000 : 9000);
  const mmWhistle = (t, n) => { for (let k = 0; k < (n || 6); k++) mmOsc(t + k * .055, 2850 + (k % 2) * 120, .045, 'sine', .05); };   // Samba-Pfeife (Apito)
  const mmAgogo = (t, hi) => { const f = hi ? 940 : 700; mmOsc(t, f, .14, 'square', .025, {bp: f * 1.4, q: 3}); mmOsc(t, f * 1.5, .1, 'sine', .02); };
  const mmPad = (t, root, iv, d, v, lp) => iv.forEach((x, k) => [-10, 10].forEach(dt => mmOsc(t, hz(root, x), d, 'sawtooth', v, {at: .3, lp: lp || 1200, det: dt + k * 2})));
  const mmRiser = (t, d) => { const a = AC, n = a.createOscillator(), g = a.createGain(); n.type = 'sawtooth'; n.frequency.setValueAtTime(200, t); n.frequency.exponentialRampToValueAtTime(2200, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.04, t + d); g.gain.linearRampToValueAtTime(0, t + d + .02); n.connect(g); g.connect(MM.g); n.start(t); n.stop(t + d + .05); mmNz(t, d, .07, 'highpass', 2500); };
  const mmSec = b => { if (b < 4) return ['intro', b % 4, b]; const c = (b - 4) % 20; return [c < 8 ? 'drop' : c < 16 ? 'drop2' : 'break', c % 4, c]; };
  // 1) Brasil-Phonk: Cowbell-Melodie, verzerrter 808-Bass, Halbzeit-Clap, Hi-Hat-Rolls, „Hey“-Rufe (fis-Moll, 130 BPM)
  const PH_A = {0: 0, 2: 0, 3: 3, 6: 0, 8: 7, 10: 5, 11: 3, 14: 2}, PH_B = {0: 0, 2: 0, 3: 3, 6: 0, 8: 10, 10: 8, 11: 7, 13: 5, 14: 3}, PH_808 = {0: 6, 6: 4, 10: 3, 14: 2};
  function phonk(s, t, sp) { const i = s % 16, b = s >> 4, [sec, bar, c] = mmSec(b), root = [0, 0, -4, -2][bar], drums = sec === 'drop' || sec === 'drop2';
    const pat = sec === 'drop2' && bar % 2 ? PH_B : PH_A;
    if (i in pat) { const f = hz(740, pat[i] + root); mmOsc(t, f, .2, 'square', sec === 'intro' ? .02 + b * .006 : .04, {bp: f * 1.25, q: 2.5, dly: sec !== 'drop'}); mmOsc(t, f * 1.48, .14, 'square', .018, {bp: f * 1.8, q: 3}); }
    if (drums && i in PH_808) { const f = hz(46.25, root + 12); mmOsc(t, f * 1.6, sp * PH_808[i] * 1.15, 'sine', .55, {f2: f, sl: .06, dist: 1, lp: 900}); if (i === 0 || i === 10) mmKick(t, .55, 180); }
    if (sec === 'break' && i === 0) { mmOsc(t, hz(46.25, root + 12), sp * 15, 'sine', .3, {lp: 400}); mmPad(t, hz(185, root), [0, 3, 7], sp * 16, .018, 900); }
    if (drums) { if (i === 8) mmClap(t, .28); if (i === 4 && sec === 'drop2') mmClap(t, .1);
      if (bar === 3 && i >= 12) { mmHat(t, .05); mmHat(t + sp / 3, .04); mmHat(t + sp * 2 / 3, .04); } else mmHat(t, i % 4 === 2 ? .06 : .035);
      if (i === 0 && bar % 2 === 0) { mmOsc(t, 230, .22, 'sawtooth', .07, {bp: 850, q: 5}); mmOsc(t, 230, .22, 'sawtooth', .05, {bp: 1250, q: 5}); } }   // „Hey!“
    if (sec === 'intro' && b === 3 && i === 0) mmRiser(t, sp * 16);
    if (sec === 'break' && c === 19 && i === 0) mmRiser(t, sp * 16); }
  // 2) Samba-Drum'n'Bass: Breakbeat, Reese-Bass, Batucada (Surdo, Tamborim, Ganzá, Agogô, Cuíca, Pfeife), Pluck-Melodie (d-Moll, 174 BPM)
  function sdnb(s, t, sp) { const i = s % 16, b = s >> 4, [sec, bar, c] = mmSec(b), root = [0, -2, -4, -5][bar], maj = bar > 0, tri = maj ? [0, 4, 7] : [0, 3, 7], drums = sec === 'drop' || sec === 'drop2';
    const R = hz(73.4, root);
    if (i === 0) mmPad(t, R * 4, tri, sp * 16, drums ? .012 : .02, 1100);
    // Batucada (im Intro nach und nach, im Break allein)
    const perc = sec !== 'intro' || b >= 1; if (perc) { if (i === 0 || i === 8) mmOsc(t, i ? 95 : 72, .35, 'sine', drums ? .2 : .4, {f2: 50});
      if ([0, 3, 6, 8, 11, 14].includes(i) && (sec !== 'intro' || b >= 2)) mmNz(t, .04, i % 4 === 2 ? .08 : .05, 'bandpass', 4200, 2);
      mmHat(t, i % 2 ? .02 : .012); if (!drums && [0, 2, 4, 7, 8, 10, 12, 14].includes(i)) mmAgogo(t, [0, 4, 8, 12].includes(i)); }
    if ((sec === 'break' || sec === 'intro') && i === 6 && bar % 2) { const n = mmOsc(t, 480, .32, 'sine', .07); n.frequency.linearRampToValueAtTime(900, t + .12); n.frequency.linearRampToValueAtTime(520, t + .3); }   // Cuíca
    if ((sec === 'drop' && c === 0 && i === 0) || (sec === 'intro' && b === 3 && i === 8)) mmWhistle(t, 7);
    if (drums) { if (i === 0 || i === 10) mmKick(t, .6); if (i === 4 || i === 12) mmSnare(t, .22); if (i === 7 || i === 15) mmSnare(t, .05); mmHat(t, i % 2 ? .02 : .04);
      if (i === 0 || i === 8) { [-12, 12].forEach(dt => mmOsc(t, R, sp * 8, 'sawtooth', .07, {lp: 380, q: 2, det: dt, at: .01, hold: sp * 6})); mmOsc(t, R / 2, sp * 8, 'sine', .25, {at: .01, hold: sp * 6}); } }
    if (sec === 'drop2' && i % 2 === 0) { const ar = [0, 2, 1, 2, 0, 2, 1, 3], tones = [tri[0], tri[1], tri[2], 12], n = tones[ar[(i >> 1) % 8]] + (bar % 2 && i >= 8 ? 12 : 0);
      mmOsc(t, hz(293.7, root + n), .22, 'triangle', .07, {dly: 1}); mmOsc(t, hz(293.7, root + n) * 2, .08, 'square', .015, {lp: 3000}); }
    if (sec === 'break' && c === 19 && i === 0) mmRiser(t, sp * 16);
    if (sec === 'intro' && b === 3 && i === 0) mmRiser(t, sp * 16); }
  // 3) Eurodance mit Brasil-Touch: gerade Bass-Drum, Offbeat-Bass, Piano-Stabs, Hoover, Supersaw-Melodie, Pfeife und Agogô (e-Moll, 140 BPM)
  const EU_LEAD = [[[0, 12, 3], [3, 10, 3], [6, 7, 2], [8, 10, 4], [12, 7, 4]], [[0, 8, 3], [3, 7, 3], [6, 3, 2], [8, 7, 4], [12, 12, 4]],
    [[0, 10, 3], [3, 12, 3], [6, 15, 2], [8, 14, 4], [12, 10, 4]], [[0, 14, 6], [6, 12, 2], [8, 10, 4], [12, 7, 4]],
    [[0, 12, 3], [3, 15, 3], [6, 19, 2], [8, 17, 4], [12, 15, 4]], [[0, 15, 3], [3, 12, 3], [6, 8, 2], [8, 12, 4], [12, 15, 4]],
    [[0, 14, 3], [3, 15, 3], [6, 17, 2], [8, 19, 4], [12, 15, 4]], [[0, 14, 2], [2, 15, 2], [4, 17, 4], [8, 19, 8]]];
  function euro(s, t, sp) { const i = s % 16, b = s >> 4, [sec, bar, c] = mmSec(b), root = [0, -4, 3, -2][bar], tri = bar ? [0, 4, 7] : [0, 3, 7], drums = sec === 'drop' || sec === 'drop2';
    const R = hz(82.4, root);
    if ([0, 3, 6, 10].includes(i)) tri.concat([12]).forEach(x => { const f = hz(R * 4, x); mmOsc(t, f, .28, 'triangle', sec === 'intro' ? .018 : .03, {lp: sec === 'intro' ? 700 + b * 500 : 4000}); mmOsc(t, f * 2, .12, 'sine', .01); });   // Piano-Stabs
    if (drums) { if (i % 4 === 0) mmKick(t, .65); if (i === 4 || i === 12) mmClap(t, .2); if (i % 4 === 2) mmHat(t, .07, 1); mmNz(t, .03, i % 2 ? .03 : .015, 'highpass', 6000);
      if (i % 4 === 2 || i % 4 === 3) mmOsc(t, i % 4 === 2 ? R : R * 2, sp * .9, 'sawtooth', .11, {lp: 700, lp2: 250, q: 3});   // Offbeat-Bass
      if ((c === 0 || c === 8) && i === 0) [-15, 0, 15].forEach(dt => mmOsc(t, R * 2, sp * 30, 'sawtooth', .03, {f2: R * 2 * 1.02, sl: .3, lp: 1800, det: dt, at: .05, hold: sp * 26})); }   // Hoover
    if (sec === 'drop2') EU_LEAD[c % 8].forEach(([st, n, l]) => { if (st === i) [-14, 0, 14].forEach(dt => mmOsc(t, hz(329.6, n), sp * l * .95, 'sawtooth', .025, {lp: 3500, det: dt, dly: 1, at: .01, hold: sp * l * .6})); });
    if (sec === 'break' || sec === 'intro') { if ([0, 3, 6, 10, 12].includes(i) && b > 0) mmAgogo(t, i % 2 === 0); if (i === 0) mmPad(t, R * 2, tri, sp * 16, .02, 1000); }
    if ((sec === 'drop' && c === 0 && i === 0) || (sec === 'drop2' && c === 8 && i === 0)) mmWhistle(t, 6);
    if ((sec === 'intro' && b === 3 && i === 0) || (sec === 'break' && c === 19 && i === 0)) mmRiser(t, sp * 16); }
  const SONGS = {phonk: {n: 'Brasil-Phonk', bpm: 130, f: phonk, v: .55}, sdnb: {n: 'Samba-Drum\'n\'Bass', bpm: 174, f: sdnb, v: .8}, euro: {n: 'Eurodance Brasil', bpm: 140, f: euro, v: 1.25}};   // v = Lautstärke angeglichen (RMS ~0,1)
  function mmPick() { const ks = Object.keys(SONGS), last = store.get('kartSong'), cand = ks.filter(k => k !== last); MM.song = pick(cand.length ? cand : ks); store.set('kartSong', MM.song); }
  const mmNote = (s, t) => { const so = SONGS[MM.song]; so.f(s, t, 60 / so.bpm / 4); };
  function mmTick() { const want = !!(AC && SOUND && SET.mm !== 'off' && !box.hidden && !menu.hidden && !document.hidden);
    if (want && !MM.on) { if (AC.state === 'suspended') AC.resume(); mmGraph(); if (!MM.song) mmPick(); MM.dl.delayTime.value = 60 / SONGS[MM.song].bpm * .75; MM.on = true; MM.step = 0; MM.next = AC.currentTime + .1; MM.g.gain.cancelScheduledValues(AC.currentTime); MM.g.gain.setValueAtTime(MM.g.gain.value, AC.currentTime); MM.g.gain.linearRampToValueAtTime(.8 * SONGS[MM.song].v, AC.currentTime + 1.2); setTxt(); }
    if (!want && MM.on) { MM.on = false; if (MM.g && AC) { MM.g.gain.cancelScheduledValues(AC.currentTime); MM.g.gain.setValueAtTime(MM.g.gain.value, AC.currentTime); MM.g.gain.linearRampToValueAtTime(0, AC.currentTime + .4); } }
    if (!MM.on || AC.state !== 'running') return; const sp = 60 / SONGS[MM.song].bpm / 4; if (MM.next < AC.currentTime) MM.next = AC.currentTime + .05;
    while (MM.next < AC.currentTime + .25) { mmNote(MM.step, MM.next); MM.next += sp; MM.step++; } }
  // beim Öffnen des Spiels ein neues Stück (zufällig, nicht dasselbe wie zuletzt)
  const mmStart = () => { MM.song = null; MM.on = false; if (!MM.iv) MM.iv = setInterval(mmTick, 60); mmTick(); }, mmStop = () => { if (MM.iv) { clearInterval(MM.iv); MM.iv = 0; } MM.on = false; if (MM.g && AC) { MM.g.gain.cancelScheduledValues(AC.currentTime); MM.g.gain.setValueAtTime(0, AC.currentTime); } };
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
  function say(key, text, prio, quiet) {
    const now = performance.now();
    if (!prio && (now < annBusy || now - (annLast[key] || 0) < 7000)) return;
    annLast[key] = now; if (!quiet) banner = {t: text, until: now + 2400, t0: now};
    const v = TRIP.kartvo && TRIP.kartvo[key], buf = v && BUF['ann' + (v.f > 1 ? v.f : '')];
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
  // eigene Stimmen der Zusatz-Fahrer (Ausnahmezustand, Serien-Figuren, Gäste; audio/kart6.mp3, Wunsch Patrick 08.10.)
  // Qualitätsrunde 2 (Wunsch Patrick: derber und schwärzer): alle 22 Fahrer neu getextet und neu aufgenommen, Stimmen in audio/kart8.mp3
  Object.assign(VTXT, {jonas: ['Tschüss! Deine Beerdigung zahlst du selbst!', 'Aua! Das kommt auf Splitwise, mit Schmerzensgeld!', 'Rechnung kommt, zahlbar bis zu deinem Tod!'], simon: ['Bis später! Oder auf deiner Beerdigung!', 'Aua! Mein Sonnenbrand platzt auf!', 'Hautkrebs-Blitz! Augen zu!'], patrick: ['Platz da, ich hab nicht mehr viel Zeit!', 'Mein Rücken! Ruft den Notarzt!', 'Rollstuhl-Boost! Die Rente fährt mit!'], marco: ['Fernschuss! Endlich treffe ich mal was!', 'Foul! Rote Karte für dein ganzes Leben!', 'Fernschuss mitten ins Gesicht!'], greisel: ['Servus! Ich hab mehr Promille als du PS!', 'Mein Bier! Mein schönes Bier!', 'Bierdusche! Ersaufen ist auch ein Tod!'], dajo: ['Platz da, die Snacks werden kalt!', 'Hey, das gibt Rache mit Gift im Essen!', 'Snacks für alle, fragt nicht, was drin ist!'], simon_love: ['Ich fliege an euch vorbei! Liebe tötet!', 'Aua! Das Herz blutet eh schon!', 'Ein Küsschen für alle! Mit Herpes!'], patrick_fat: ['Bauch voraus! Wer drunter liegt, hat Pech!', 'Uff! Ich glaub, das war ein Herzinfarkt!', 'Achtung! Die Picanha kommt zurück!'], marco_dia: ['Weg da! Ich muss! Jetzt! Sofort!', 'Nicht schütteln! Zu spät!', 'Sorry, Jungs! Das musste raus! Alles!'], jonas_kater: ['Leise überholen! Mein Schädel platzt!', 'Mein Kopf! Erschießt mich bitte!', 'Ich kotze! Auf euch alle!'], greisel_wb: ['Servus! Mein Pegel ist schneller als du!', 'Nicht verschütten! Sonst gibt es Tote!', 'Weißbier-Dusche! Die Taufe für Tote!'], dajo_party: ['Party! Wer stirbt, verpasst was!', 'Wer hat die Musik ausgemacht, und den Puls?', 'Lichtorgel an! Epileptiker raus!'], taxi: ['Atalho, amigo! Abkürzung über den Friedhof!', 'Ai! Mein Taxi! Du zahlst mit deinen Organen!', 'Taxameter läuft! Auch nach deinem Tod!'], coati: ['Hihi! Ich hab Tollwut!', 'Aua! Ich beiß dich tot!', 'Her damit! Und deine Finger auch!'], officer: ['Zur Seite treten! Oder ich schieße!', 'Das ist eine Straftat! Lebenslang!', 'Kontrolle! Leibesvisitation für alle!'], dona: ['Com licença, defunto!', 'Ai, ai! Vou te matar, menino!', 'Que gatinho! Vem morrer comigo!'], guide: ['Olja! Ich kenne den Weg! Der letzte Tourist nicht!', 'Nau! Der Kaiman riecht dein Blut!', 'Kaiman, fass! Er hat Hunger!'], steward: ['Bitte bleiben Sie angeschnallt! Bis zum Aufprall!', 'Turbulenzen! Beten Sie jetzt!', 'Achtung! Der Servierwagen bricht Knochen!'], caimanx: ['Zu langsam, du riechst lecker!', 'Das kitzelt nur, dann fress ich dich!', 'Schnapp! Da war doch ein Bein!'], manuel: ['Hier unten, ihr Riesen! Ich beiß euch in die Knöchel!', 'Nicht auf den Kleinen, ich hab ein Messer!', 'Abgezwickt! Jetzt passe ich in jeden Sarg!'], erich: ['Schleich dich! Sonst gibt es Tote!', 'Kruzifix! Ich bring dich um!', 'Ruhe jetzt! Kabinenpredigt bis zum Tod!'], rasmus: ['Auf geht’s! Party, bis einer stirbt!', 'Locker bleiben, Tote feiern nicht!', 'Alle Mann! Polonaise zum Friedhof!']});
  Object.assign(VTXT2, {jonas: {win: 'Pokal! Die Hinterbliebenen kriegen die Rechnung!', drift: 'Fischerhut festhalten, sonst bricht das Genick!', item: 'Wer war das? Ich verklage deine Erben!', pass: 'Sorry, du warst eh schon tot!'}, simon: {win: 'Sieg! Ich leuchte wie ein Atomkraftwerk!', drift: 'Fahrtwind auf verbrannter Haut, herrlich!', item: 'Schon wieder ich? Ich hab doch schon Hautkrebs!', pass: 'Tschüss, ihr Leichen!'}, patrick: {win: 'Der alte Mann gewinnt! Kurz vor dem Tod!', drift: 'Achtung, meine künstliche Hüfte!', item: 'Ich bin zu alt für sowas! Mein Herz!', pass: 'Senioren zuerst, ihr habt eh mehr Zeit!'}, marco: {win: 'Ich hab gewonnen? Wer hat hier bestochen?', drift: 'Meine Fernschuss-Kurve! Hoffentlich!', item: 'Aua! Wie immer bin ich das Opfer!', pass: 'Ciao! Grüß mir den Bestatter!'}, greisel: {win: 'Prost! Auf die Leber, die nicht mehr kann!', drift: 'Hoppla! Das war die Leber!', item: 'Tut nicht weh, ich spür eh nix mehr!', pass: 'Servus! Ich zahl die Grabblumen!'}, dajo: {win: 'Sieg, der Leichenschmaus geht auf mich!', drift: 'Huiii! Hoffentlich überlebe ich das!', item: 'Das war gemein, ich merk mir das!', pass: 'Entschuldigung! Tschüss! Stirb langsam!'}, simon_love: {win: 'Sieg! Für meine Gatinha und ihren Zuhälter!', drift: 'Ich schwebe! Wie auf Drogen!', item: 'Mein Herz! Diesmal wirklich!', pass: 'Platz da! Meine Liebste wartet! Mit meinem Geld!'}, patrick_fat: {win: 'Gewonnen! Erst Nachtisch, dann Krankenhaus!', drift: 'Langsam! Sonst platzt mir der Magen!', item: 'Ich hab doch nur zwölf Spieße gegessen!', pass: 'Rollender Bauch! Wer im Weg steht, wird platt!'}, marco_dia: {win: 'Erster! Und keiner will mir die Hand geben!', drift: 'Kneifen, Marco! Kneifen!', item: 'Oh nein! Jetzt ist es passiert!', pass: 'Notfall! Haltet die Luft an!'}, jonas_kater: {win: 'Gewonnen, kann mich jetzt bitte jemand erlösen?', drift: 'Alles dreht sich! Ich sterbe!', item: 'Zu laut! Lasst mich einfach sterben!', pass: 'Nie wieder Cachaça! Bis heute Abend!'}, greisel_wb: {win: 'Prost! Die Leber hat aufgegeben, ich nicht!', drift: 'Hoppla! Schaum und Mageninhalt!', item: 'Mein Bier! Dafür zahlst du mit dem Leben!', pass: 'Eins geht noch! Für dich nicht mehr!'}, dajo_party: {win: 'Sieg, die Party geht bis zum Notarzt!', drift: 'Dreh dich, bis die Pupillen platzen!', item: 'Hey! Nicht auf die Tanzfläche bluten!', pass: 'Noch eine Runde, für dich nicht mehr!'}, taxi: {win: 'Endstation! Für dich die letzte!', drift: 'Rio-Fahrstil! Anschnallen ist für Feiglinge!', item: 'Wer zahlt den Schaden? Deine Niere!', pass: 'Ich kenne den Weg! Zum Leichenschauhaus!'}, coati: {win: 'Hihi! Alles meins! Auch deine Seele!', drift: 'Wuiii! Tollwut macht schnell!', item: 'Gemein! Ich hol meine ganze Familie!', pass: 'Tschüss! Ich klau später deinen Grabstein!'}, officer: {win: 'Sieg. Die Verlierer kommen in Gewahrsam.', drift: 'Verdächtiges Fahrverhalten! Schusswaffe frei!', item: 'Wer hat das eingeschmuggelt? Ich finde dich!', pass: 'Ausweis bitte! Ach, egal, du bist eh gleich tot!'}, dona: {win: 'A vovó ganhou! Já enterrei três maridos!', drift: 'Uiii, que delícia de morte!', item: 'Ai, menino! Vai pro inferno!', pass: 'Tchau, tchau! Te vejo no caixão!'}, guide: {win: 'Der Dschungel gehört mir! Und deine Leiche auch!', drift: 'Treiben lassen, wie die Leichen im Fluss!', item: 'Sokorro! Gleich kommen die Piranhas!', pass: 'Folgt mir nicht, die Piranhas warten!'}, steward: {win: 'Wir sind gelandet, die meisten von uns!', drift: 'Notausgänge? Gibt es nicht!', item: 'Gegen die Vorschriften, Sie sterben zuerst!', pass: 'Hähnchen, Pasta oder Sarg?'}, caimanx: {win: 'Gewonnen! Jetzt gibt es Guide zum Nachtisch!', drift: 'Rutschig hier, vom Blut!', item: 'Wer stört? Ich fress deine Kinder!', pass: 'Bis gleich, mein Abendessen!'}, manuel: {win: 'Kleiner Mann, großer Sieg! Ihr seid tot!', drift: 'Halt! Mein Sitzkissen! Mein Leben!', item: 'Wer hat Stumpen gesagt? Du bist dran!', pass: 'Ich fahr unten durch! Wie ein Sarg in die Grube!'}, erich: {win: 'Gewonnen! Freuen tu ich mich erst auf deiner Beerdigung!', drift: 'Früher sind wir bei so was gestorben!', item: 'Ihr Weicheier! Ich überlebe euch alle!', pass: 'Platz da! Ich hab keine Zeit und keine Geduld!'}, rasmus: {win: 'Sieg! Mannschaftsabend, Anwesenheit Pflicht, auch tot!', drift: 'Peace, Bruder! Und Ruhe in Frieden!', item: 'Hey! Das gibt Strafrunden bis zum Kollaps!', pass: 'Training um sieben! Beerdigung um acht!'}});
  // Gastfahrer Ritchi Reddels (= Felix): meckert, diskutiert, golft (Stimme v_felix_*, Varianten _2 in kart9)
  Object.assign(VTXT, {felix: ['Fore! Aus dem Weg, sonst wirst du eingelocht!', 'Das war Foul! Darüber diskutieren wir auf deiner Beerdigung!', 'Hole-in-One! Direkt ins Grab!']});
  Object.assign(VTXT2, {felix: {win: 'Gewonnen! Und ich beschwer mich trotzdem!', drift: 'Das Grün ist viel zu schnell! Ich beschwer mich!', item: 'Unerhört! Ich leg Protest ein, bei deiner Witwe!', pass: 'Side-Step-Broly! Du bist Geschichte!'}});
  // Gastfahrer Ilkay „Taco“: Sprüche (Döner, Tacos, Schnurrbart; schwarz wie die anderen), Stimme v_ilkay_* in audio/kart7.mp3
  Object.assign(VTXT, {ilkay: ['Andale, Hackfleisch, mit alles und scharf!', 'Mein Schnurrbart, dafür kommst du auf den Dönerspieß!', 'Scharf mit alles, eure Tränen sind meine Soße!']});
  const VTXTX = {felix: {over: ['Ritchi auf der Überholspur! Beschwerden bitte schriftlich!'], hit: ['Wer war das?! Das gibt eine Diskussion bis zum Tod!'], sp: ['Abschlag! Der Ball sucht schon deinen Grabstein!'],
    win: ['Ritchi Reddels gewinnt! War trotzdem unfair!'], drift: ['Side-Step! Seitwärts in den Tod!'], item: ['Das zählt nicht! Ich will den Videobeweis!'], pass: ['Peitsche! Und tschüss, ab in den Bunker!']}, ilkay: {over: ['Hadi lan, aus dem Weg, eşek!', '¡Órale, güey! Wir sehen uns auf deiner Beerdigung!', '¡Chinga tu madre! Ich überhol dich und deine Mutter!'], hit: ['¡Pinche cabrón! Mein Schnurrbart!', 'Siktir git! Dafür grill ich dich!', '¡Hijo de puta! Deine Mutter wirft besser!'],
    sp: ['¡Ay, caramba! Extra scharf für eure Beerdigung!', 'Yallah, scharf bis ins Grab!', '¡Tu madre! Die kriegt extra scharf, mit alles!'], win: ['¡A huevo! Kebabito ist der König!', 'Vay be! Ihr seid alle Hackfleisch!', '¡Hijo de tu madre! Gewonnen, sag’s deiner Mutter!'],
    drift: ['¡No mames! Ich rutsch in den Tod!', 'Oha lan! Wie auf Ayran!', 'Ananı…! Deine Mutter driftet besser!'], item: ['¿Qué pedo, güey? Du bist tot!', 'Salak! Ich mach dich zu Lahmacun!', 'Ananı satayım! Wer war das?!'], pass: ['¡Adiós, pendejo! Der Leichenwagen wartet!', 'Görüşürüz, kanka! In der Hölle!', 'Orospu çocuğu, tschüss! Grüß deine Mutter im Jenseits!']}};
  Object.assign(VTXT2, {ilkay: {win: 'Gewonnen, Tacos gibt es auf eurer Beerdigung!', drift: 'Rutscht wie Knoblauchsoße, gleich bin ich tot!', item: 'Wer war das, ich mach dich zu Dürüm!', pass: 'Abi, du bist Hackfleisch, guten Appetit!'}});
  // Gastfahrerin Pat's Mum: eigene Stimme (XTTS „Claribel Dervla“), Sprüche, Ansage g_patmum und Smash-Name h_patmum in audio/kart10.mp3 (lädt früh, wie kart7)
  Object.assign(VTXT, {patmum: ['Mama überholt! Und raucht dabei noch eine!', 'Hust, hust! Wer war das? Jetzt ist meine Kippe aus!', 'Einsteigen, Jungs! Fenster bleiben zu, Mama raucht!']});
  Object.assign(VTXT2, {patmum: {win: 'Gewonnen! Jetzt dekorier ich das Siegerpodest!', drift: 'Uiii, meine Lichterkette!', item: 'Hey! Ich hab euch immer von jeder Party abgeholt!', pass: 'Tschüss! Ich hol dich nachher ab, versprochen!'}});
  VTXTX.patmum = {over: ['Platz da, ich muss Patrick von der Party holen!'], hit: ['Meine Blumenkübel! Die waren ganz neu!'], pass: ['Bis gleich, ich warte mit laufendem Motor!'], win: ['Mama hat gewonnen! Jetzt erst mal eine rauchen!'], item: ['Aufhören soll ich? Mit dem Rauchen? Niemals!']};
  // Allgemeine Sprüche je Fahrer (Wunsch Patrick 10.10.: mehr Abwechslung, super lustig statt nur Tod), passen zu jedem Anlass; Stimmen v_<id>_talk… in audio/kart11.mp3
  const TALK = {jonas: ['Ich hab’s ausgerechnet: Du schuldest mir drei Euro zwanzig!', 'Ich bin blind! Wer hat meinen Fischerhut geklaut?', 'Kurze Pause, ich muss das Rennen erst in Splitwise eintragen!', 'Mein Handy vibriert in der Unterhose! Wer schreibt da?!'], simon: ['Hat jemand meine Sonnenbrille gesehen? Und mein Handy? Und meine Schuhe?', 'Ich bin so rot, mich sieht man vom Weltall aus!', 'Gatinha hat geschrieben! Sie braucht nochmal vierhundert Euro!', 'Wo bin ich? Wer seid ihr? Und warum hab ich nur eine Socke an?'], patrick: ['Moment, mein Gebiss ist rausgefallen!', 'Früher hatten wir keinen Turbo! Da sind wir noch selbst gelaufen!', 'Wer hat mir eigentlich dieses Pastel-de-Frango-Tattoo gestochen?!', 'Zerrung! Schon wieder! Ich hab doch nur gelenkt!'], marco: ['Oh nein, ich hab mich eingeschissen!', 'Hat jemand meine Zahnbürste gesehen? Die war im Handschuhfach!', 'Warum überholt mich eigentlich jeder? Sogar der Nasenbär!', 'Ich teil mir das Kart mit dir, okay? Halbe-halbe!'], greisel: ['Ein Weißbier geht noch. Zwei auch. Drei sowieso!', 'Ich komm erst in der neunzigsten Minute richtig rein!', 'Kater? Kenn ich nicht. Hatte ich noch nie!', 'Kopfball! Ach nee, falsches Spiel!'], dajo: ['Ich hab Snacks für alle dabei! Außer für dich!', 'Kurze Frage: Gibt’s auf den Pokal Mengenrabatt?', 'Das Rennen trag ich gleich in meine Excel-Tabelle ein!', 'Nachschub! Wer will Chips? Ich fahr auch mit einer Hand!'], simon_love: ['Sie hat zurückgeschrieben! Mit Herz! Und einer Kontonummer!', 'Ich bin verliebt! In die Ampel! Die ist so schön rot!', 'Gatinha, ich komme! Nur noch drei Runden und ein Kredit!', 'Ich seh nur noch Herzchen! Und die Bande!'], patrick_fat: ['Kann mal einer meinen Gürtel aufmachen? Ich krieg keine Luft!', 'Noch ein Spieß Picanha, dann fahr ich weiter!', 'Mein Bauch hat gerade das Lenkrad gegessen!', 'Rülps! Entschuldigung, das war der Nachtisch!'], marco_dia: ['Wo ist das nächste Klo? Ich frag für einen Freund!', 'Nicht lachen! Sonst passiert ein Unglück!', 'Klopapier! Der Nasenbär hat mein Klopapier geklaut!', 'Dieses Flusswasser-Eis war die dümmste Idee meines Lebens!'], jonas_kater: ['Nie wieder Cachaça! Ab heute nur noch Caipirinha!', 'Warum ist die Sonne heute so laut?', 'Wer hat mich in dieses Kart gesetzt? Ich wollte ins Bett!', 'Splitwise sagt, ich hab gestern zweihundert Euro ausgegeben. Wofür?!'], greisel_wb: ['Prost! Mein Weißbier hat mehr PS als mein Kart!', 'Ich seh alles doppelt! Dann überhol ich halt beide!', 'Hicks! Wer hat die Strecke so kurvig gebaut?', 'Mein Glas ist leer! Boxenstopp, sofort!'], dajo_party: ['Polonaise! Alle hinter mir her!', 'Musik lauter! Ich hör meine Bremsen noch!', 'Die Party ist erst vorbei, wenn die Polizei kommt!', 'Ich hab meine Schuhe verloren! Egal, barfuß fahr ich schneller!'], taxi: ['Taxameter läuft! Jede Kurve kostet extra!', 'Ich kenn eine Abkürzung! Durch die Favela und über den Strand!', 'Rote Ampel? In Rio ist das nur ein Vorschlag!', 'Trinkgeld nicht vergessen, amigo! Zehn Prozent, oder ich hupe!'], coati: ['Hihi! Dein Sandwich gehört jetzt mir!', 'Ich hab deine Sonnenbrille! Und dein Handy! Hihi!', 'Nasenbären fahren nicht. Nasenbären klauen!', 'Ist das ein Snack? Alles ist ein Snack!'], officer: ['Flüssigkeiten über hundert Milliliter? Raus damit!', 'Gürtel ab! Schuhe aus! Auch während der Fahrt!', 'Ihr Kart piept! Bitte noch einmal durch den Scanner!', 'Halt! Ist das Ihr Nasenbär?!'], dona: ['Que gatinho! Casa comigo! (Heirate mich!)', 'Ai, minha dentadura caiu! (Mein Gebiss!)', 'Devagar, menino! Eu tenho noventa anos! (Ich bin neunzig!)', 'Meu feijão ainda está no fogo! (Meine Bohnen brennen an!)'], guide: ['Olha! Ein Faultier! Ach nee, das ist Greisel!', 'Keine Sorge, der Kaiman hat heute schon gegessen! Glaube ich!', 'Nicht ins Wasser fassen! Piranhas lieben Touristen!', 'Ich hab mich verfahren! Seit zwanzig Jahren!'], steward: ['Pasta oder Chicken? Chicken ist aus!', 'Bitte bringen Sie Ihre Rückenlehne in eine aufrechte Position! Auch im Kart!', 'Die Notausgänge befinden sich links, rechts und im Graben!', 'Der Bordservice wurde leider gerade überfahren!'], caimanx: ['Ich hab heute noch nichts gegessen. Du siehst lecker aus!', 'Ich bin nicht langsam. Ich lauere!', 'Mmmh, Sonnencreme! Mein Lieblingsgewürz!', 'Wer hat einen Fischerhut verloren? Schmeckt nach Jonas!'], manuel: ['Ich bin nicht klein, das Kart ist nur riesig!', 'Kann mal jemand das Kissen hochheben? Ich seh nix!', 'Miniman überholt! Ihr habt mich gar nicht gesehen, oder?', 'Achtung, ich fahr einfach unten durch!'], erich: ['Des passt mir alles ned! Gar nix passt mir!', 'Jonas, Greisel, Marco! Nach dem Rennen Straftraining!', 'Früher sind wir ohne Turbo gefahren, und es war besser!', 'Ich bin nicht grantig! Ich hab nur Hunger!'], rasmus: ['Alle mal die Hände hoch! Auch beim Lenken!', 'Peace, Brüder! Und jetzt Vollgas!', 'Wer hat Bock auf Wassergymnastik nach dem Rennen?', 'Gruppenfoto! Alle kurz anhalten und lächeln!'], ilkay: ['Mein Schnurrbart ist schneller als ihr alle!', 'Döner oder Taco? Beides! Mit alles und scharf!', 'Ich hab Knoblauchsoße im Tank! Riecht man das?', 'Wer meinen Schnurrbart anfasst, kriegt Peperoni ins Auge!'], felix: ['Frechheit! Ich will sofort den Schiedsrichter sprechen!', 'Meine Haare sind nicht rot! Die sind kupferfarben!', 'Pssst! Ruhe bitte, ich schlage gleich ab!', 'Ich diskutier das jetzt nicht! Doch, ich diskutier das jetzt!'], patmum: ['Oh nein, meine Zigarette geht aus! Hat jemand Feuer?', 'Ich hab das Kart noch schnell mit Lichterketten dekoriert!', 'Jungs, soll ich euch nachher abholen? Ich hab eh nix vor!', 'Nur noch eine Zigarette, dann hör ich auf! Versprochen! Nächstes Jahr!']};
  Object.keys(TALK).forEach(id => { (VTXT2[id] = VTXT2[id] || {}).talk = TALK[id][0]; (VTXTX[id] = VTXTX[id] || {}).talk = TALK[id].slice(1); });
  const bufOf = v => v && BUF['ann' + (v.f > 1 ? v.f : '')];
  /* Sprüche abwechseln (Wunsch Patrick 09.10. spät: nie zweimal hintereinander derselbe Spruch bei einem Fahrer): je Fahrer merkt VUSE, wann welcher Spruch zuletzt kam;
     gewählt wird der am längsten nicht gesagte Spruch des Anlasses (alle Varianten reihum), nie der zuletzt gesagte. Gibt es für den Anlass nur diesen einen, kommt ein
     anderer Spruch des Fahrers (VALT: verwandte Anlässe), sonst bleibt er still. */
  const VUSE = {}, VALT = {over: ['pass', 'drift', 'item'], pass: ['over', 'drift', 'item'], hit: ['item', 'drift', 'over', 'pass'], drift: ['pass', 'item', 'over'], item: ['drift', 'pass', 'over'], sp: ['item', 'drift', 'over'], win: ['pass', 'over', 'drift'], talk: ['pass', 'over', 'drift', 'item', 'hit']};
  const vCands = (vid, kind) => { const i0 = {over: 0, hit: 1, sp: 2}[kind], base = i0 !== undefined ? (VTXT[vid] || [])[i0] : (VTXT2[vid] || {})[kind]; if (!base) return [];
    const vk = 'v_' + vid + '_' + kind, out = [[vk, base]], ex = (VTXTX[vid] || {})[kind]; if (ex && TRIP.kartvo) ex.forEach((t, i) => { if (TRIP.kartvo[vk + '_' + (i + 2)]) out.push([vk + '_' + (i + 2), t]); }); return out; };   // weitere Sprüche je Anlass (z. B. Ilkay mit mexikanischen/türkischen Ausdrücken)
  const vPick = (U, cs) => { const ok = cs.filter(c => c[0] !== U.last); if (!ok.length) return null; const m = Math.min(...ok.map(c => U[c[0]] || 0)); return pick(ok.filter(c => (U[c[0]] || 0) === m)); };
  function voice(k, kind, force) {
    const now = performance.now(); if (!S || (!force && (now < voiceBusy || now < annBusy))) return;
    const own = !!(TRIP.kartvo && TRIP.kartvo['v_' + k.id + '_hit']), vid = own ? k.id : baseOf(k.id), U = VUSE[k.id] || (VUSE[k.id] = {last: null}), kind0 = kind;   // eigene Stimme, sonst die der Person
    if (kind === 'over' && Math.random() < .5 && TRIP.kartvo && TRIP.kartvo['v_' + vid + '_pass']) kind = 'pass';
    const X = XBY[k.id]; if (X && !own && (X.npc || Math.random() < .4)) { const c0 = vPick(U, (X.l || []).map((t, i) => ['l' + i, t])); if (!c0) return; U.last = c0[0]; U[c0[0]] = now; k.say = c0[1]; k.sayT = 1.8; k.lastKind = kind; voiceBusy = now + 1500; S.vc = (S.vc || 0) + 1; return; }
    /* Abwechslung (Wunsch Patrick 10.10.: Sprüche kamen zu oft): der Spruch zum Anlass nur, wenn er länger als 30 s her ist, sonst reihum aus Anlass- und allgemeinen Sprüchen (talk) */
    const cs0 = vCands(vid, kind), fr0 = cs0.filter(c => c[0] !== U.last && now - (U[c[0]] || -1e9) > 30000);
    let ch = fr0.length ? vPick(U, fr0) : vPick(U, kind === 'win' ? cs0 : cs0.concat(kind === 'talk' ? [] : vCands(vid, 'talk'))); if (!ch) { const all = []; (VALT[kind] || []).forEach(k2 => vCands(vid, k2).forEach(c => all.push(c.concat(k2)))); ch = vPick(U, all); if (ch) kind = ch[2]; }   // Ersatz reihum aus allen verwandten Anlässen
    if (!ch) return; let vk = ch[0], txt = ch[1]; U.last = vk; U[vk] = now;
    k.say = txt; k.sayT = 1.8; k.lastKind = kind; S.vc = (S.vc || 0) + 1; if (kind0 === 'win' && S.pose && S.pose.id === k.id) S.pose.wl = txt;
    const v = TRIP.kartvo && TRIP.kartvo[vk], vb = bufOf(v); voiceBusy = now + Math.max(1400, (v ? v.dur : 1300) + 200);   /* Sperre = Länge des Spruchs: kein Durcheinanderreden, aber auch keine Pause dazwischen (Wunsch Patrick 09.10.: mehr Gepöbel) */
    if (v && vb && AC && SOUND) { playBuf(vb, v.o / 1000, v.dur / 1000, 1.05); if (MG) { MG.gain.setTargetAtTime(.25, AC.currentTime, .05); MG.gain.setTargetAtTime(.5, AC.currentTime + v.dur / 1000, .3); } }
  }

  // Tages-Challenge entfernt (Wunsch Patrick 09.10.: benutzt keiner, Menü übersichtlicher); dayKey bleibt für die Reise-Kostüme mit Datum
  const dayKey = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
  /* ---- Crew-Bestenliste und Geister (db: kartbest/<strecke>__<person>, kartghost/<…>; schreiben nur mit Schreibrecht) ---- */
  let LB = {}, WR = false, DB = null;
  /* Als Gast spielen (Wunsch Patrick 09.10.): Gäste wie Pat's Mum oder Manuel (auf der Seite nur Kommentatoren) wählen sich im Kart selbst aus.
     Gilt nur im Kart (localStorage br26.kartGuest), „Ich bin …“ der Seite und die Konto-Zuordnung kartusers bleiben unberührt. */
  const isGuestId = id => typeof id === 'string' && (/^gast_[A-Za-z0-9-]{1,20}$/.test(id) || !!(XBY[id] && XBY[id].guest));
  let KG = isGuestId(store.get('kartGuest')) ? store.get('kartGuest') : '';
  if (KG && store.get('kartGuestName') && KG.indexOf('gast_') === 0) GNM[KG] = store.get('kartGuestName');
  const PME = () => KG || ME;   // wer im Kart spielt: Gast, sonst „Ich bin …“
  const player = () => PME() || me;   // wer am Handy spielt, sonst der gewählte Fahrer
  function lbInit() {
    if (DB !== null) return; DB = false;
    getDb().then(db => { if (!db) return; DB = db;
      db.collection('kartbest').onSnapshot(sn => { LB = {}; sn.docs.forEach(d => { if (d.exists) LB[d.id] = d.data(); }); gNames(); board(); if (!box.hidden && !menu.hidden) renderMenu(); }, () => {});
      try { window.claude.use('user').then(u => u && u.id ? u.id().then(id => { UID = id || null; ACC = u; accSync(); }) : null).catch(() => {}); } catch (e) {}
      db.collection('kartusers').onSnapshot(sn => { USERS = {}; sn.docs.forEach(d => { if (d.exists) USERS[d.id] = d.data().who; }); accSync(); board(); }, () => {});
      db.collection('kartprog').onSnapshot(sn => { PROG = {}; sn.docs.forEach(d => { if (d.exists) PROG[d.id] = d.data(); }); progOn = true; progSync(true); }, () => {});
      db.collection('kartlive').onSnapshot(sn => { LIVEST = []; sn.docs.forEach(d => { if (d.exists) LIVEST.push(d.data()); }); if (!box.hidden && !menu.hidden && MODE === 'live') liveBox(); }, () => {});
    }).catch(() => {});
    canWrite().then(w => { WR = w !== false; progWR = WR; if (w === false) LIVE.noEm = true;   // ohne Schreibrecht (Kommentatoren) darf man auch keine Live-Ereignisse senden: dann laufen sie über die presence (pqPush)   // null = Plattform sagt nichts: trotzdem eintragen (abgelehnte Schreibversuche meldet die Warteschlange unten links)
      progSync(true); if (!box.hidden && !menu.hidden) renderMenu(); }).catch(() => {});
  }
  /* Strecken-Fassung (Umbau 09.10. spät: Höhen, Brücken, Guarujá neu): umgebaute Strecken speichern Bestzeiten, Runden, Zwischenzeiten und Geister unter
     <strecke>~<Fassung>, alte Zeiten bleiben in der Datenbank, zählen aber nicht mehr (sonst wären sie auf der neuen Strecke unschlagbar bzw. geschenkt) */
  /* Geschwindigkeitsklassen (Wunsch Patrick 09.10. spät, Idee 2): 100/150/200 ccm; 150 = bisheriges Spiel. Andere Klassen speichern Bestzeiten, Runden, Zwischenzeiten und Geister
     unter <strecke>@<ccm> (150 ohne Zusatz, damit alle alten Zeiten weiter gelten). Im Rennen gilt S.cc (live für alle gleich aus cfg.cc), im Menü CC. */
  const CCS = [100, 150, 200], CCN = {100: '100 ccm', 150: '150 ccm', 200: '200 ccm'}, CCE = {100: '🐢', 150: '🏎️', 200: '🚀'}, ccF = c => c === 200 ? 1.2 : c === 100 ? .86 : 1;
  let CC = CCS.includes(+store.get('kartCC')) ? +store.get('kartCC') : 150;
  const ccNow = () => { try { return (S && S.cc) || CC; } catch (e) { return CC; } };
  const TV = {guaruja: 2, gru: 2, lopes: 2, cristo: 2, bridge: 2}, tkey = (id, cc) => { const c = cc || ccNow(); return (TV[id] ? id + '~' + TV[id] : id) + (c !== 150 ? '@' + c : ''); }, tbase = k0 => String(k0 || '').split(/[~@]/)[0], tcc = k0 => +(String(k0 || '').split('@')[1] || 150);
  const lbList = (src, pre, cc) => Object.entries(src).filter(([id]) => id.indexOf(tkey(pre, cc) + '__') === 0).map(([, v]) => v).filter(v => v && v.ms).sort((a, b) => a.ms - b.ms);
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
    if (mapped && mapped !== ME && !ME && !KG) setMe(mapped);
    else if (ME && !mapped && WR) { USERS[UID] = ME; DB.doc('kartusers/' + UID).set({who: ME, ts: Date.now()}).catch(() => {}); }   // Konto → Person wird nur einmal festgelegt (Zeitkapsel: jeder tippt nur für sich)
    const ids = Object.values(LB).map(v => v.uid).filter(x => x && !(x in PNAME)); if (ACC && ACC.profiles && ids.length) { ids.forEach(x => { PNAME[x] = ''; });
      ACC.profiles(ids).then(ps => { ids.forEach(x => { const n = ps && ps[x] && ps[x].name; PNAME[x] = n ? n.split(' ')[0] : ''; }); board(); if (!box.hidden && !menu.hidden) renderMenu(); }).catch(() => {}); } }
  // „Wer hat es gefahren?“: Person, gefahrene Figur, Konto, Gerät, Zeitpunkt
  const when = ts => { if (!ts) return ''; const d = new Date(ts); return d.getDate() + '.' + (d.getMonth() + 1) + '. ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function byline(v) { const p = []; if (v.g) p.push('👤 Gast'); if (v.pend) return p.concat('⏳ wartet auf ein Crew-Handy').join(' · ');
    if (v.drv && v.drv !== v.who) p.push('als ' + NAME(v.drv));
    if (v.uid) p.push('✓ Konto' + (PNAME[v.uid] ? ' ' + PNAME[v.uid] : '') + (USERS[v.uid] && USERS[v.uid] !== v.who ? ' (gehört ' + NAME(USERS[v.uid]) + ')' : '')); else p.push('❓ ohne Konto-Zuordnung');
    if (v.dev) p.push(v.dev); if (v.ts) p.push(when(v.ts)); return p.join(' · '); }
  function saveLB(pd) { const who = PME(); if (!who || !(pd.ms > 15000) || pd.kind !== 'best') return;   /* unmögliche Zeiten nie in die Crew-Bestenliste */
    const tk = tkey(pd.track), id = tk + '__' + who, old = LB[id]; if (old && old.ms <= pd.ms) return; const doc = {track: tk, who, drv: pd.drv, veh: pd.veh, ms: pd.ms, ts: Date.now(), uid: UID, dev: devName()};
    const gst = isGuestId(who); if (gst) { doc.g = 1; if (GNM[who]) doc.gn = GNM[who]; }
    if (!WR || !DB) { if (gst) gPend(doc); return; }   // Gast ohne Schreibrecht: Zeit wartet auf dem Handy, ein Crew-Handy trägt sie ein
    DB.doc('kartbest/' + id).set(doc).catch(() => { if (gst) gPend(doc); }); DB.doc('kartghost/' + id).set({g: pd.g, ms: pd.ms}).catch(() => {}); LB[id] = doc; }
  // Namen von „Anderer Gast“ aus der Bestenliste
  function gNames() { Object.values(LB).forEach(v => { if (v && v.gn && typeof v.who === 'string' && v.who.indexOf('gast_') === 0) GNM[v.who] = String(v.gn).slice(0, 20); }); }
  /* Gäste ohne Schreibrecht (Kommentatoren): Kommentatoren dürfen in der Datenbank nichts schreiben. Ihre Bestzeit wartet deshalb auf dem Handy
     (br26.kartGPend) und reist in der presence des Live-Raums mit (Feld gt, nur außerhalb des Rennens); jedes Handy mit Schreibrecht im Raum
     (die Seite betritt ihn 5 s nach dem Laden still) trägt sie in kartbest ein (gRelay). Nur Gast-Kennungen, damit niemand Crew-Zeiten fälschen kann. */
  const gPendGet = () => { const o = pj(store.get('kartGPend') || 'null'); return o && typeof o === 'object' ? o : {}; };
  function gPend(doc) { const o = gPendGet(), id = doc.track + '__' + doc.who; if (o[id] && o[id].ms <= doc.ms) return;
    o[id] = {track: doc.track, who: doc.who, drv: doc.drv, veh: doc.veh, ms: doc.ms, ts: doc.ts, dev: doc.dev, gn: doc.gn || ''}; store.set('kartGPend', JSON.stringify(o)); livePres(); }
  function gPendList() { const o = gPendGet(); let ch = 0; Object.keys(o).forEach(id => { const v = LB[id]; if (v && v.ms <= o[id].ms) { delete o[id]; ch = 1; } }); if (ch) store.set('kartGPend', JSON.stringify(o));
    return Object.values(o).sort((a, b) => b.ts - a.ts).slice(0, 10).map(v => [v.track, v.who, v.drv, v.veh, v.ms, v.ts, v.dev, v.gn || '']); }
  // wartende Gast-Zeiten in der Bestenliste dieses Handys schon zeigen (⏳), bis ein Crew-Handy sie eingetragen hat
  const gPendLB = () => { const o = gPendGet(), r = {}; Object.keys(o).forEach(id => { const v = o[id]; if (v && v.ms && (!LB[id] || LB[id].ms > v.ms)) r[id] = Object.assign({}, v, {g: 1, pend: 1}); }); return r; };
  const GREL = {};
  function gRelay(peers) { if (!WR || !DB) return; peers.forEach(p0 => { const g = p0.presence && p0.presence.gt; if (!Array.isArray(g) || p0.sameTab) return;
    g.slice(0, 10).forEach(e => { if (!Array.isArray(e)) return; const [track, who, drv, veh, ms, ts, dev, gn] = e;
      if (!TBY[tbase(track)] || !CCS.includes(tcc(track)) || track !== tkey(tbase(track), tcc(track)) || !isGuestId(who) || typeof ms !== 'number' || !(ms > 15000) || ms > 36e5) return;
      const id = track + '__' + who, old = LB[id]; if ((old && old.ms <= ms) || GREL[id] === ms) return; GREL[id] = ms;
      const doc = {track, who, drv: DRVS.includes(drv) ? drv : DRVS.includes(who) ? who : 'patrick', veh: VEHS.some(v => v.id === veh) ? veh : 'kart', ms: Math.round(ms), ts: +ts || Date.now(), uid: p0.by || null, dev: String(dev || '').slice(0, 20), g: 1, via: UID || null};
      if (gn) { doc.gn = String(gn).slice(0, 20); if (who.indexOf('gast_') === 0) GNM[who] = doc.gn; }
      DB.doc('kartbest/' + id).set(doc).catch(() => {}); LB[id] = doc; }); }); }
  /* ---- Fortschritt am Konto (db kartprog/<person>): Münzen, Tuning, Kostüme, Lack, Aufkleber, Erfolge, Statistik, eigene Bestzeiten.
     Gilt auf jedem Handy, auf dem die Person „Ich bin …“ gewählt hat. Zusammenführen: Gekauftes/Erreichtes wird vereinigt (Maximum),
     Bestzeiten Minimum, Auswahl (Fahrzeug, Kostüm, Lack, Rivale) = neuester Stand, Münzen als Zähler (Änderung seit dem letzten Abgleich). ---- */
  const PROGK = /^kart(Coins|Tune|Cos|CosOwn|Ach|Stats|Cups|Paint|StkOwn|VehOwn2|Parts|TutDone|Rival|Veh|Best|Lap\..+|Sec\..+)$/, PREFK = /^kart(Cos|Paint|Rival|Veh)$/, TIMEK = /^kart(Best|Lap\.|Sec\.)/;
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
    Object.keys(o).forEach(k => { if (!PROGK.test(k)) delete o[k]; });   // alte Schlüssel (z. B. kartVehOwn vor dem Neustart) nicht zurückholen
    Object.keys(rem).forEach(k => { if (!(k in loc) || k === 'kartCoins' || !(k in o)) return;
      if (PREFK.test(k)) { if (!localNewer) o[k] = rem[k]; return; }
      if (k === 'kartTune') { o[k] = JSON.stringify(deep(tuneNorm(pj(loc[k])), tuneNorm(pj(rem[k])), Math.max)); return; }
      const x = pj(loc[k]), y = pj(rem[k]); if (x === null || y === null) return;
      o[k] = typeof x === 'object' || typeof y === 'object' ? JSON.stringify(deep(x, y, TIMEK.test(k) ? Math.min : k === 'kartAch' ? Math.min : Math.max)) : String(TIMEK.test(k) ? Math.min(x, y) : Math.max(x, y)); });
    if (o.kartTune) o.kartTune = JSON.stringify(tuneNorm(pj(o.kartTune)));
    return o; }
  // Handy wechselt die Person: Stand der bisherigen Person auf dem Handy zur Seite legen, Stand der neuen holen
  function progOwner() { const own = store.get('kartProgOwner'), ME = PME(); if (!ME || own === ME) return; progMute = true;
    try { if (own) localStorage.setItem('br26.kartProgBak.' + own, JSON.stringify({p: progLocal(), b: store.get('kartCoinsBase'), lt: store.get('kartProgLT')}));
      const bak = own ? pj(localStorage.getItem('br26.kartProgBak.' + ME)) : null;
      if (own) { progWrite(bak ? bak.p : {}); progMute = true; store.set('kartCoinsBase', bak && bak.b || ''); store.set('kartProgLT', bak && bak.lt || ''); }
      store.set('kartProgOwner', ME); } catch (e) {} finally { progMute = false; } HEADC = {}; }
  let progBusy = false;
  const DID = store.get('kartDid') || (d => { store.set('kartDid', d); return d; })(Math.random().toString(36).slice(2, 10));
  function progSync(push) { if (!PME() || !progOn || progBusy) return; progBusy = true; try { progSync0(push); } finally { progBusy = false; } }
  function progSync0(push) { progOwner(); const ME = PME();   // Gäste haben ihren eigenen Stand (kartprog/<gast>)
    const rd = PROG[ME] || null, rem = Object.assign({}, rd && rd.p || {}); if (rd && rd.r !== (TRIP.kartReset || '')) Object.keys(rem).forEach(k => { if (TIMEK.test(k)) delete rem[k]; });
    const loc = progLocal(), lt = +store.get('kartProgLT') || 0, m = progMerge(loc, rem, !!(rd && rd.did === DID) || lt > (rd && rd.ts || 0));   /* eigener Stand von diesem Handy: Auswahl hier ist nie älter */
    const rc = +(rem.kartCoins || 0), base = +(store.get('kartCoinsBase') || 0), lc = +(loc.kartCoins || 0); m.kartCoins = String(Math.max(0, rc + lc - base));
    progWrite(m); progMute = true; store.set('kartCoinsBase', String(rc)); progMute = false;
    if (JSON.stringify(loc) !== JSON.stringify(m)) { HEADC = {}; try { teaser(); } catch (e) {} if (!box.hidden && !menu.hidden) { if (['kartVeh', 'kartPaint', 'kartParts', 'kartCos'].some(k => loc[k] !== m[k])) { makeVehicles(); newRace(); S.paused = true; } renderMenu(); } }   // Vorschau-Rennen mit dem Fahrzeug vom Konto (vorher zeigte das Menü das neue, die Vorschau das alte)
    const diff = Object.keys(m).some(k => m[k] !== rem[k]) || Object.keys(rem).some(k => !(k in m)) || !rd || rd.r !== (TRIP.kartReset || '');
    if (push && diff && progWR && DB) { const doc = {p: m, ts: Date.now(), r: TRIP.kartReset || '', uid: UID, dev: devName(), did: DID}; PROG[ME] = doc;
      progMute = true; store.set('kartCoinsBase', m.kartCoins); progMute = false; DB.doc('kartprog/' + ME).set(doc).catch(() => {}); } }
  store.onSet = k => { if (progMute || !PROGK.test(k)) return; progMute = true; store.set('kartProgLT', String(Date.now())); progMute = false;
    clearTimeout(progT); progT = setTimeout(() => progSync(true), 2500); };
  const progLine = () => !PME() ? '☁️ Wähle „Wer spielt?“, dann gelten Münzen, Garage und Erfolge auf jedem Handy.' : progWR ? '☁️ Fortschritt von ' + esc(NAME(PME())) + ' wird am Konto gespeichert und gilt auf jedem Handy.' : '📱 Fortschritt nur auf diesem Handy (Speichern am Konto nur für Eingeladene).';
  function setMe(id) { KG = ''; store.set('kartGuest', ''); ME = id; store.set('me', id); window.dispatchEvent(new Event('br26-me')); setTimeout(accSync, 0); setTimeout(() => progSync(true), 0);
    try { const g = Object.keys(GROUP_IDS).find(k => GROUP_IDS[k].includes(id)); if (g && typeof setGroup === 'function') setGroup(g); meMark(); renderMe(); } catch (e) {}
    if (PEND) { saveLB(PEND); PEND = null; const w = res.querySelector('.kr-who'); if (w) { w.innerHTML = '<p>✅ Gespeichert als <b>' + esc(NAME(id)) + '</b>. Ab jetzt merkt sich dieses Handy, wer spielt.</p>'; } }
    if (!box.hidden && !menu.hidden) renderMenu(); }
  // Gast wählen: nur fürs Kart (ME der Seite bleibt), Fortschritt/Bestzeiten unter der Gast-Kennung; Gast mit eigener Figur fährt sie gleich
  function setGuest(id, nm) { KG = isGuestId(id) ? id : ''; store.set('kartGuest', KG); if (KG.indexOf('gast_') === 0 && nm) { GNM[KG] = nm; store.set('kartGuestName', nm); }
    GOTHER = false; setTimeout(() => progSync(true), 0); livePres();
    if (KG && DRVS.includes(KG) && me !== KG && !menu.hidden) pickDrv(KG);
    if (PEND) { saveLB(PEND); PEND = null; const w = res.querySelector('.kr-who'); if (w) w.innerHTML = '<p>✅ Gespeichert als <b>' + esc(NAME(KG)) + '</b> (Gast).' + (WR ? '' : ' Deine Zeit kommt in die Bestenliste, sobald jemand aus der Crew die Seite offen hat.') + '</p>'; }
    if (!box.hidden && !menu.hidden) renderMenu(); }
  const gSlug = n => String(n || '').trim().replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);
  let GOTHER = false;
  const GUESTS = () => XDRV.filter(x => x.guest).map(x => x.id);
  const whoHtml = txt => { const cur = PME(), gs = GUESTS(), og = KG && KG.indexOf('gast_') === 0 ? KG : '';
    const btn = (id, attr) => '<button type="button" ' + attr + '="' + id + '" aria-label="' + esc(NAME(id)) + '"' + (id === cur ? ' aria-pressed="true"' : '') + '><span class="kr-wh" data-h="' + id + '"></span><span>' + esc(NAME(id)) + '</span></button>';
    return '<div class="kr-who"><p>' + txt + '</p><div class="kr-pick kr-whop">' + CREW.map(p => btn(p.id, 'data-who')).join('') + '</div>' +
      '<p class="kr-whog">👤 <b>Als Gast spielen</b> · für alle, die nicht in der Crew sind</p><div class="kr-pick kr-whop kr-whopg">' + gs.map(id => btn(id, 'data-gst')).join('') +
      (og ? btn(og, 'data-gst') : '') + '<button type="button" class="kr-gother"' + (GOTHER ? ' aria-pressed="true"' : '') + '><span class="kr-gq">＋</span><span>Anderer Gast</span></button></div>' +
      (GOTHER ? '<div class="kr-gform"><input type="text" class="kr-gname" maxlength="16" placeholder="Dein Vorname" autocomplete="off" enterkeyhint="done" aria-label="Vorname"><button type="button" class="kr-gok">Los</button></div>' : '') +
      (WR ? '' : '<p class="kr-whonote">Ohne Schreibrecht (z. B. als Kommentator eingeladen): deine Bestzeiten wandern in die Bestenliste, sobald jemand aus der Crew die Seite gleichzeitig offen hat.</p>') + '</div>'; };
  const whoHeads = el => el.querySelectorAll('.kr-wh').forEach(x => x.replaceWith(HEAD[x.dataset.h] ? headCv(x.dataset.h, 92) : Object.assign(document.createElement('span'), {className: 'kr-gq', textContent: '👤'})));
  // Bestzeiten aller Strecken (Crew-Bestenliste: schnellstes ganzes Rennen je Strecke; dazu die eigene schnellste Runde, nur auf diesem Handy; Name „Bestzeiten“ statt „Crew-Rekorde“, Wunsch Patrick 09.10.)
  let RECOPEN = null, RECCC = null;   // aufgeklappte Strecke in der Bestenliste; angezeigte Klasse (Standard = gewählte Klasse CC)
  function recsHtml() { const RV = RECCC || CC, rows = TRACKS.map(tr => ({tr, list: lbList(LB, tr.id, RV)})), cnt = {}, pts = {}, nT = {}, PT = [10, 8, 6, 5, 4, 3, 2, 1];
    const ccTabs = '<div class="kr-ghost kr-cc kr-recc">' + '<span>🏎️ Klasse</span>' + CCS.map(c => '<button type="button" data-rcc="' + c + '" aria-pressed="' + (c === RV) + '">' + c + '<small>ccm · ' + TRACKS.filter(x => lbList(LB, x.id, c).length).length + '/' + TRACKS.length + '</small></button>').join('') + '</div>';
    rows.forEach(r => r.list.forEach((v, i) => { pts[v.who] = (pts[v.who] || 0) + (PT[i] || 1); nT[v.who] = (nT[v.who] || 0) + 1; if (!i) cnt[v.who] = (cnt[v.who] || 0) + 1; }));
    const tab = Object.keys(pts).sort((a, b) => pts[b] - pts[a] || (cnt[b] || 0) - (cnt[a] || 0)), med = i => ['🥇', '🥈', '🥉'][i] || (i + 1) + '.';
    // Gesamtwertung über alle Strecken (Wunsch Patrick 09.10.: „gesamthafte Bestenliste“): Punkte je Strecke nach Platz in der Bestenliste
    const ges = tab.length ? '<p class="kr-lbl">🏆 Gesamtwertung · alle Strecken' + (RV !== 150 ? ' · ' + CCN[RV] : '') + '</p><ol class="kr-gw">' + tab.map((w, i) => '<li' + (w === PME() ? ' class="me"' : '') + '><i>' + med(i) + '</i><b>' + esc(NAME(w)) + '</b><span>' + (cnt[w] ? '👑 ' + cnt[w] + ' · ' : '') + nT[w] + '/' + TRACKS.length + ' Strecken</span><em>' + pts[w] + ' P</em></li>').join('') + '</ol><p class="kr-rkx">Punkte je Strecke nach Platz: 10 · 8 · 6 · 5 · 4 · 3 · 2 · 1 · 👑 = Bestzeiten</p>' : '<p class="kr-rk">Noch keine Bestzeit, die Strecken warten!</p>';
    return ccTabs + ges + '<p class="kr-lbl">⏱ Alle Strecken <small>(antippen = alle Zeiten)</small></p><p class="kr-rkx">⏱ schnellstes ganzes Rennen · 🔁 deine schnellste Runde</p><ul class="kr-recl">' + rows.map(r => { const top = r.list[0], op = RECOPEN === r.tr.id;
      return '<li><button type="button" class="kr-rec' + (op ? ' on' : '') + '" data-t="' + r.tr.id + '" aria-expanded="' + op + '"><i>' + r.tr.e + '</i><b>' + esc(r.tr.name) + '</b>' +
        (top ? '<span' + (top.who === PME() ? ' class="me"' : '') + '>' + esc(NAME(top.who)) + '</span><em>' + fmt(top.ms) + '</em>' : '<span class="no">frei</span><em>–</em>') + ((l0 => '<small>' + (l0 ? '🔁 ' + fmt(l0) : '') + '</small>')(+store.get('kartLap.' + tkey(r.tr.id, RV)) || 0)) + '</button>' +
        (op ? '<div class="kr-recx">' + (r.list.length ? '<ol>' + r.list.map((v, i) => '<li' + (v.who === PME() ? ' class="me"' : '') + '><span>' + med(i) + ' ' + esc(NAME(v.who)) + '<small>' + esc(byline(v)) + '</small></span><i>' + fmt(v.ms) + (i ? '<u>+' + ((v.ms - top.ms) / 1000).toFixed(2) + ' s</u>' : '') + '</i></li>').join('') + '</ol>' : '<p class="kr-rkx">Noch keine Zeit. Sei der Erste!</p>') +
          '<button type="button" class="kr-recgo" data-t="' + r.tr.id + '" data-rcc="' + RV + '">▶ ' + esc(r.tr.name) + ' fahren' + (RV !== 150 ? ' · ' + CCN[RV] : '') + (top ? ' (mit Geist der Bestzeit)' : '') + '</button></div>' : '') + '</li>'; }).join('') + '</ul>'; }

  /* ---- Live-Mehrspieler (room-Fähigkeit): Lobby im Raum „gringo-kart“, Positionen über presence, Start/Treffer/Effekte als Ereignisse auf Topic „kart“ ---- */
  const LIVE = {room: null, ok: null, peers: [], me: null, race: null, pending: null, sentAt: 0, buf: {}, lastN: {}, seq: 0, rdy: false, gp: null, autoAt: 0, emoAt: 0, pings: {}, rtt: {}, taunts: {}, cfg: null, tauntOpen: false, lpDrv: {}, lpAt: {}, lpAnn: 0, jt: 0, lpRdy: {}, lpRdyAt: {}, vsc: new Map(), pq: [], pqN: 0, pqSeen: {}, noEm: false};
  let LIVEST = [];   // gespeicherte Live-Rennen (db kartlive) für die Live-Bilanz
  // Live-Grand-Prix (Wunsch Patrick 10.10.): Stand {id, cup, e, n, list, i, k = gewertete Rennen, pts, nm, pl = Plätze je Rennen, dr = Figur, ai, rid, ts, done, end} übersteht Neuladen (App-Wechsel)
  const gpSave = () => { try { if (LIVE.gp) localStorage.setItem('br26.kartLiveGPRun', JSON.stringify(Object.assign({}, LIVE.gp, {seen: undefined}))); else localStorage.removeItem('br26.kartLiveGPRun'); } catch (e) {} };
  try { const g0 = JSON.parse(localStorage.getItem('br26.kartLiveGPRun') || 'null'); if (g0 && g0.id && Array.isArray(g0.list) && Date.now() - (g0.ts || 0) < 3 * 3600e3 && !g0.end) LIVE.gp = Object.assign(g0, {seen: g0.rid ? {[g0.rid]: 1} : {}}); } catch (e) {}
  const gpPack = () => LIVE.gp ? Object.assign({}, LIVE.gp, {seen: undefined, hid: undefined, cer: undefined, in: undefined}) : undefined;
  const gpLive = () => LIVE.gp && !LIVE.gp.end && !LIVE.gp.done ? LIVE.gp : null;   // läuft gerade (noch Rennen offen)
  // Stand der anderen übernehmen: gleicher Grand Prix mit mehr gewerteten Rennen (oder abgebrochen), sonst ein neuerer
  function gpMerge(peers) { let g = LIVE.gp, ch = 0; peers.forEach(p0 => { const o = p0.presence && p0.presence.gpP; if (!o || p0.sameTab || !o.id || !Array.isArray(o.list) || !o.pts) return;
      if (g && o.id === g.id) { if ((o.k || 0) > (g.k || 0) || (o.end && !g.end)) { g = Object.assign({}, o, {seen: Object.assign({}, g.seen || {}, o.rid ? {[o.rid]: 1} : {}), hid: g.hid, cer: g.cer, in: g.in}); ch = 1; } }
      else if (!o.end && (!g || (o.ts || 0) > (g.ts || 0) + 2000)) { g = Object.assign({}, o, {seen: o.rid ? {[o.rid]: 1} : {}}); ch = 1; } });
    if (ch) { LIVE.gp = g; gpSave(); } return ch; }
  async function liveJoin() {
    if (LIVE.room || LIVE.ok === false || LIVE.joining) return; LIVE.joining = 1;
    try { const r0 = window.claude && window.claude.use ? await window.claude.use('room') : null; if (!r0) { LIVE.ok = false; if (!box.hidden) renderMenu(); return; }
      const r = await r0.join('gringo-kart'); LIVE.room = r; LIVE.ok = true;
      r.onPeers(ch => { LIVE.peers = ch.peers; const mine = ch.peers.find(p0 => p0.sameTab); if (mine) LIVE.me = mine.peer; liveRecv(ch.peers); pqRecv(ch.peers); gRelay(ch.peers); ch.peers.forEach(p0 => { const pr = p0.presence; if (pr && pr.gn && typeof pr.who === 'string' && pr.who.indexOf('gast_') === 0) GNM[pr.who] = String(pr.gn).slice(0, 20); });
        if (gpMerge(ch.peers)) { LIVE.sig = ''; gpResSync(); } const sig = JSON.stringify(lobby().map(p0 => [p0.peer, p0.presence.who, p0.presence.drv, p0.presence.veh, p0.presence.rdy, p0.presence.trk, (p0.presence.gpP || {}).k, p0.presence.jt, (p0.presence.cfg || {}).ts])); liveAuto();
        if (sig !== LIVE.sig) { LIVE.sig = sig; if (!box.hidden && !menu.hidden && MODE === 'live') renderMenu(); } gpResUpd(); }, () => { LIVE.ok = false; });
      r.on('kart', liveMsg, () => {}); livePres();
    } catch (e) { LIVE.ok = false; if (!box.hidden && !menu.hidden) renderMenu(); } finally { LIVE.joining = 0; } }
  function livePres(extra) { if (!LIVE.room) return; const gt = LIVE.race ? [] : gPendList(), tn = performance.now(); LIVE.pq = LIVE.pq.filter(e => tn - e.t < 2000);
    const base = {gt: gt.length ? gt : null, pq: LIVE.pq.length ? LIVE.pq.map(e => [e.n, e.d]) : null, gn: KG && GNM[KG] || null, who: PME() || (RNDR ? RNDR.me0 : me), drv: me, veh: myVeh(), cos: cosOf(me), paint: paintOf(me), parts: partsPt(), lob: !box.hidden && !document.hidden && MODE === 'live' && !LIVE.race, rdy: LIVE.rdy && !LIVE.race ? 1 : 0, jt: LIVE.jt || (LIVE.jt = Date.now()), trk: TRK, gpP: LIVE.race ? undefined : gpPack(), gpm: !box.hidden && gpLive() && LIVE.gp.in ? LIVE.gp.id : undefined, cfg: LIVE.cfg || undefined, vo: LIVE.race ? undefined : VEHS.filter(unlocked).map(v => v.id)};
    const o = Object.assign(base, extra || {race: null}), j = JSON.stringify(o); if (j === LIVE.lastPres) return; LIVE.lastPres = j; LIVE.room.presence(o).catch(() => {}); }
  const lobby = () => LIVE.peers.filter(p0 => p0.presence && p0.presence.lob && p0.kind === 'viewer');
  // Spieler-Plätze wie bei Smash Bros: P1 = wer zuerst in der Lobby war (presence jt), feste Farben
  const PCOL = ['#e8383d', '#2f7de1', '#f2c230', '#2fae5b', '#f08a24', '#a05ad8'];
  const lobbyP = () => lobby().slice().sort((a, b) => ((a.presence.jt || 9e15) - (b.presence.jt || 9e15)) || (a.peer < b.peer ? -1 : 1));
  const myP = () => { const i = lobbyP().findIndex(p0 => p0.sameTab || p0.peer === LIVE.me); return i < 0 ? 0 : i + 1; };
  /* Ereignisse senden. Kommentatoren dürfen auf dem Topic „kart“ nichts senden (not_permitted, Topic nur ab „interact“): dann reisen ihre Ereignisse
     ~2 s lang in der eigenen presence mit (Feld pq = [[Nummer, Ereignis] …]), die anderen spielen jedes Ereignis genau einmal ab (pqRecv).
     So können Gäste voll mitfahren: Start, Treffer, Kisten, Uhrabgleich, Sprüche. */
  const liveEmit = d => { if (!LIVE.room) return; if (LIVE.noEm) { pqPush(d); return; }
    LIVE.room.emit('kart', d).catch(e => { if (e && e.code === 'not_permitted') { LIVE.noEm = true; pqPush(d); } }); };
  function pqPush(d) { const tn = performance.now(); LIVE.pq.push({n: ++LIVE.pqN, d, t: tn});
    while (LIVE.pq.length > 1 && (LIVE.pq.length > 8 || JSON.stringify(LIVE.pq.map(e => e.d)).length > 1800)) LIVE.pq.shift();   // presence darf höchstens 4 KB groß sein
    try { liveMsg({topic: 'kart', data: d, peer: LIVE.me, sameTab: true, isMe: true}); } catch (e) {}   // eigenes Echo wie bei emit
    const mk = LIVE.race && S && S.karts && S.karts.find(k => k.me); if (mk) { LIVE.sentAt = 0; liveSend(mk); } else if (!LIVE.race) livePres();   // sofort senden (im Rennen mit Position, sonst würde race: null die Rennmeldung löschen)
    clearTimeout(LIVE.pqT); LIVE.pqT = setTimeout(() => { if (!LIVE.race) livePres(); }, 2100); }
  function pqRecv(peers) { peers.forEach(p0 => { const q = p0.presence && p0.presence.pq; if (!Array.isArray(q) || p0.sameTab) return; const seen = LIVE.pqSeen[p0.peer] || 0; let mx = seen;
    q.forEach(e => { if (!Array.isArray(e) || !(e[0] > seen) || !e[1] || typeof e[1] !== 'object') return; mx = Math.max(mx, e[0]);
      try { liveMsg({topic: 'kart', data: e[1], peer: p0.peer, by: p0.by, guest: p0.guest, kind: p0.kind, isMe: p0.isMe, sameTab: false}); } catch (x) {} });
    LIVE.pqSeen[p0.peer] = mx; }); }
  function liveMsg(m) { const d = m.data || {}; if (!d.t) return;
    if (d.t === 'start') { if (!LIVE.me || !(d.players || []).includes(LIVE.me) || LIVE.race || box.hidden) return; const trk0 = TRK; LIVE.pending = Object.assign({rt: performance.now()}, d); TRK = d.track; LIVE.rdy = false; LIVE.autoAt = 0; LIVE.gpW0 = 0; LIVE.gpGo = 0;
      if (d.gp && d.gp.pts) { const o = d.gp, g = LIVE.gp; if (!g || g.id !== o.id || (o.k || 0) >= (g.k || 0)) LIVE.gp = Object.assign({}, o, {seen: Object.assign({}, g && g.id === o.id ? g.seen : {})}); LIVE.gp.i = o.i; LIVE.gp.in = 1; gpSave(); }   // Stand des Starters übernehmen (alle Tabellen gleich)
      else { LIVE.gp = null; gpSave(); }
      const rr = d.rnd && d.rnd[LIVE.me]; if (rr && DRVS.includes(rr[0])) { const base = RNDR || {me0: me, trk0}, tr = TBY[d.track] || TRACKS[0];   // Zufallsrennen für alle: eigener Fahrer + Fahrzeug vom Starter gelost, erst der Spielautomat, dann los (Start ist dafür 3,6 s später)
        RNDR = {me0: base.me0, trk0: base.trk0, veh: VEHS.some(v => v.id === rr[1]) ? rr[1] : 'kart'}; me = rr[0]; makeVehicles(); livePres(); const pk = LIVE.pending; slotShow(me, tr, VEHS.find(v => v.id === RNDR.veh), tr.veh === 'boat', true, () => { if (LIVE.pending === pk) startRace(); }, +((d.cfg || {}).cc) || 150); return; }
      startRace(); return; }
    if (d.t === 'gpgo') { const g = gpLive(); if (g && d.id === g.id) { LIVE.gpGo = g.id; liveAuto(); gpResUpd(); if (!menu.hidden && MODE === 'live') liveBox(); } return; }
    if (d.t === 'ping' && !m.sameTab) { liveEmit({t: 'pong', id: d.id, to: d.from, by: LIVE.me}); return; }
    if (d.t === 'pong' && d.to === LIVE.me) { const t0 = LIVE.pings[d.id]; if (t0) { const r = performance.now() - t0, o = LIVE.rtt[d.by]; LIVE.rtt[d.by] = o ? o * .6 + r * .4 : r; if (d.id[0] === 't') (LIVE.test || []).push([d.by, r]); if (!menu.hidden && MODE === 'live') liveBox(); } return; }
    if (d.t === 'taunt') { LIVE.taunts[m.sameTab ? LIVE.me : m.peer] = {txt: String(d.txt || '').slice(0, 160), until: performance.now() + 6000}; if (!m.sameTab) beep(990, .07, 'triangle', .05); if (!menu.hidden && MODE === 'live') { liveBox(); setTimeout(() => { if (!menu.hidden && MODE === 'live') liveBox(); }, 6100); } return; }
    if (d.t === 'rj' && !m.sameTab && S && S.live && S.live.id === d.race && !S.karts[0].done) { liveEmit({t: 'rjs', race: d.race, to: d.from, st: +S.t.toFixed(3)}); return; }
    if (d.t === 'rjs' && d.to === LIVE.me && LIVE.rjWait && LIVE.rjWait.race.id === d.race && !LIVE.race) { const sv = LIVE.rjWait; LIVE.rjWait = null; liveRejoinGo(sv, d.st); return; }
    if (d.t === 'cs' && !m.sameTab && S && S.live && S.live.id === d.race && d.to === LIVE.me) { liveEmit({t: 'csr', race: d.race, id: d.id, to: d.from, th: +S.t.toFixed(4)}); return; }
    if (d.t === 'csr' && d.to === LIVE.me && S && S.live && S.live.id === d.race) { liveClockReply(d); return; }
    if (!S || !LIVE.race || d.race !== LIVE.race.id) return; const k0 = S.karts[0];
    if (d.t === 'brk' && !m.sameTab) { const b = S.brk && S.brk[d.i]; if (b && b.dead < 0) brkBreak(b, null, 1); return; }
    if (d.t === 'box' && !m.sameTab) { const b = S.boxes[d.i]; if (b) b.off = Math.max(b.off, 3); return; }
    if (d.t === 'bump' && d.to === LIVE.me && !k0.done) { if (S.kkPeer && S.t - (S.kkPeer[m.peer] ?? -9) < .3) return;   /* eigenes Handy hat den Rempler schon selbst gerechnet */ const pu = clamp(d.p || 4, 2, 12), mo = d.m || 1, sh = mo / (mo + k0.vx.m), kv = clamp(60 + (d.v || 0) * .7, 60, 200) * sh;   // n zeigt vom Absender zu mir: weg von ihm (vorher zog die Nachricht einen zum Absender hin)
      k0.x += d.nx * pu * sh; k0.y += d.ny * pu * sh; k0.kx = (k0.kx || 0) + d.nx * kv; k0.ky = (k0.ky || 0) + d.ny * kv; k0.jolt = Math.max(k0.jolt || 0, clamp((d.v || 0) / 700, .1, .25)); if (!S.bumpT) { S.bumpT = .25; noise(.08, .1, 0, 0, 0, 900); vib(15); } return; }
    const tg = d.ai !== undefined && d.ai !== null ? S.karts.find(x => x.aiIdx === d.ai && !x.remote) : k0;
    if (d.t === 'hit' && d.to === LIVE.me && tg) { const o = S.karts.find(x => x.peer === m.peer && x.aiIdx === undefined); hit(tg, d.why); if (o && tg === k0) { k0.say = 'Das war ' + NAME(o.id) + '!'; k0.sayT = 1.4; } }
    if (d.t === 'fx' && d.to === LIVE.me && tg) { Object.assign(tg, d.f || {}); }
    if (d.t === 'emo') { const ek = m.sameTab ? k0 : S.karts.find(x => x.peer === m.peer && x.aiIdx === undefined); if (ek) { ek.emo = String(d.e || '').slice(0, 4); ek.emoU = performance.now() + 2400; } }
    if (d.t === 'oil' && !m.sameTab) S.oils.push({x: d.x, y: d.y, t: d.bang ? 3 : d.fire ? 6 : d.stink ? 9 : d.banana ? 16 : d.nut ? 11 : 12, by: null, beer: d.beer ? 1 : 0, fire: d.fire ? 1 : 0, stink: d.stink ? 1 : 0, puke: d.puke ? 1 : 0, banana: d.banana ? 1 : 0, bang: d.bang ? .9 : 0, nut: d.nut ? 1 : 0}); }
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
    if (last.lat !== undefined && Math.abs(last.lat) < TW && last.idx !== undefined && onCut(last.x, last.y) === false) { const i2 = last.idx + last.v * age / 6, [x, y] = at(i2, last.lat); out.x = x; out.y = y; out.a = tdir(i2) + angd(last.a, tdir(last.idx)); }
    else { out.x += Math.cos(last.a) * last.v * age; out.y += Math.sin(last.a) * last.v * age; }
    return out; }
  // ferngesteuerte Karts: Position aus der presence, weich nachgeführt
  function liveRemote(k, dt) { const conv = k.aiIdx !== undefined ? q => { const r0 = (q.ai || [])[k.aiIdx]; return r0 ? {x: r0[0], y: r0[1], a: r0[2], v: r0[3], lap: r0[4], idx: r0[5], done: r0[6], b: r0[7], sp: r0[8], lat: r0[9], fl: r0[10]} : null; } : q => q;
    const q = liveSample(k.peer, conv), stale = !q || (q.age > 6000 && !q.done);
    if (stale) { k.gone = (k.gone || 0) + dt; k.lagging = 1; if (k.gone > 6 && !k.done) { k.out = 1; k.lap = -5; } return; } k.gone = 0; k.out = 0; k.lagging = q.age > 1200 ? 1 : 0;
    if (k.x0 === undefined || Math.hypot(q.x - k.x, q.y - k.y) > 160) { k.x = q.x; k.y = q.y; k.a = q.a; } const f = Math.min(1, dt * 14); k.x += (q.x - k.x) * f; k.y += (q.y - k.y) * f; k.x0 = 1;
    k.a += angd(q.a, k.a) * f; k.v = q.v; k.lap = q.lap; k.idx = q.idx; k.lat = q.lat || 0; k.done = q.done || 0; k.boost = q.b ? .2 : 0; k.spin = q.sp ? .2 : 0; k.rot = q.sp ? k.rot + dt * 14 : 0; k.steer = q.st || 0; k.shield = q.sh ? 1 : 0; k.fall = q.fl || 0; k.bus = q.bu ? .3 : 0; k.zap = q.zp ? .3 : 0; }
  function liveSend(k) { const now = performance.now(); if (now - LIVE.sentAt < 50) return; LIVE.sentAt = now;
    liveKeep(k); liveHostCheck();
    livePres({race: LIVE.race.id, rj: LIVE.race.rjFrom || undefined, n: ++LIVE.seq, tm: +S.t.toFixed(3), x: Math.round(k.x), y: Math.round(k.y), a: +k.a.toFixed(3), v: Math.round(k.v), lap: k.lap, idx: k.idx, lat: Math.round(k.lat), done: k.done ? +k.done.toFixed(3) : 0, b: k.boost > 0 ? 1 : 0, sp: k.spin > 0 ? 1 : 0, st: +k.steer.toFixed(2), sh: k.shield > 0 ? 1 : 0, fl: k.fall > 0 ? +k.fall.toFixed(2) : 0, bu: k.bus > 0 ? 1 : 0, zp: k.zap > 0 ? 1 : 0, ai: S.karts.filter(o => o.aiIdx !== undefined && !o.remote).map(o => [Math.round(o.x), Math.round(o.y), +o.a.toFixed(3), Math.round(o.v), o.lap, o.idx, o.done ? +o.done.toFixed(3) : 0, o.boost > 0 ? 1 : 0, o.spin > 0 ? 1 : 0, Math.round(o.lat), o.fall > 0 ? +o.fall.toFixed(2) : 0])}); }
  // Fahrschule: eine geführte Runde allein auf Guarujá
  const TUT = [{t: 'Lenken: links oder rechts halten (Analog: Daumen-Position).', ok: k => (S.tut.st = (S.tut.st || 0) + (Math.abs(k.steer) > .6 ? 1 / 60 : 0)) > .8},
    {t: 'Driften: in der Kurve doppelt tippen und halten. Zu eng? Andere Seite dazu = weiterer Bogen. Funken sammeln, dann ganz loslassen = Turbo!', ok: () => S.tutMini},
    {t: 'Bremsen: beide Seiten gleichzeitig halten.', ok: k => (S.tut.br = (S.tut.br || 0) + (k.brk ? 1 / 60 : 0)) > .4},
    {t: 'Fahr durch eine ?-Kiste (gelbe Würfel auf der Strecke).', ok: k => k.item || k.roll > 0},
    {t: 'Tippe unten auf ITEM, um es zu benutzen.', ok: () => S.tutUsed},
    {t: 'Pfeile auf der Strecke geben Turbo, auf der Schanze tippen = Trick. Fahr jetzt ins Ziel!', ok: () => false}];
  let TUTON = false;
  function tutStart() { TUTON = true; TRK = 'guaruja'; MODE = 'single'; startRace(); }
  // Strecken-Abstimmung: jeder Spieler in der Lobby stimmt mit seiner gewählten Strecke ab
  function liveVotes(lb) { const v = {}; lb.forEach(p0 => { const t = p0.presence.trk; if (TBY[t]) v[t] = (v[t] || 0) + 1; }); return Object.entries(v).sort((x, y) => y[1] - x[1]); }
  const liveLeader = lb => lb.map(p0 => p0.peer).sort()[0];
  function liveGo(auto) { const lb = lobby(); if (!LIVE.room || lb.length < liveMin()) { toast('👥 Mindestens zwei Spieler müssen im Live-Raum sein.'); return; }
    if (!lb.every(p0 => p0.presence.rdy)) { toast('⏳ Es geht los, sobald alle bereit sind (' + lb.filter(p0 => p0.presence.rdy).length + '/' + lb.length + ').'); return; }   // Wunsch Patrick 09.10.: kein Start, solange jemand nicht bereit ist
    const cf = liveCfg(), rnd = cf.rnd === 'on' ? {} : null;   // Zufallsrennen für alle: je Spieler eine andere Person (Fassungen derselben Person nur einmal), Fahrzeug aus seinen freigeschalteten
    if (rnd) { const ub = new Set(), pool = DRVS.slice().sort(() => Math.random() - .5); lb.forEach(p0 => { const d0 = pool.find(id => !ub.has(baseOf(id))) || pick(DRVS), vo = (p0.presence.vo || []).filter(id => VEHS.some(v => v.id === id)); ub.add(baseOf(d0)); rnd[p0.peer] = [d0, pick(vo.length ? vo : ['kart', 'uber', 'uno', 'cart'])]; }); }
    const used = rnd ? Object.values(rnd).map(r => r[0]) : lb.map(p0 => p0.presence.drv || p0.presence.who), nAI = Math.max(0, 6 - lb.length);
    let ai = store.get('kartLiveAI') === '0' ? [] : CREW.map(c => c.id).filter(id => !used.map(baseOf).includes(id)).slice(0, nAI);
    if (rnd && ai.length) { const ub = new Set(used.map(baseOf).concat(lb.map(p0 => baseOf(p0.presence.who || '')))); ai = []; for (const id of DRVS.slice().sort(() => Math.random() - .5)) { if (ai.length >= nAI) break; if (ub.has(baseOf(id))) continue; ub.add(baseOf(id)); ai.push(id); } }   // Zufallsrennen: Computer-Gegner ebenfalls bunt gemischt, aber nie eine Person, die gerade echt mitspielt (sonst zweimal „Simon“ in der Liste)
    const vs = liveVotes(lb), top = vs.filter(v => v[1] === (vs[0] || [0, 0])[1]).map(v => v[0]); let track = rnd ? pick(TRACKS).id : top.length ? pick(top) : TRK, gp = null;
    // Live-Grand-Prix: laufenden fortsetzen (nächstes Rennen = Anzahl gewerteter Rennen), sonst neuen anfangen, wenn „🏆 Grand Prix“ gewählt ist; Computer-Gegner bleiben über den ganzen Pokal dieselben
    const G0 = gpLive(), ub0 = used.map(baseOf).concat(G0 ? Object.keys(G0.pts || {}).filter(k0 => k0[0] === 'p').map(k0 => baseOf(k0.slice(2).split('#')[0])) : []);
    if (G0 && ai.some(id => ub0.includes(baseOf(id)))) { const ub = new Set(ub0.concat(ai.map(baseOf).filter(b0 => !ub0.includes(b0)))); ai = ai.filter(id => !ub0.includes(baseOf(id))); for (const id of DRVS.slice().sort(() => Math.random() - .5)) { if (ai.length >= nAI) break; if (ub.has(baseOf(id))) continue; ub.add(baseOf(id)); ai.push(id); } }   // fehlt ein Mitfahrer, fährt keine Computer-Fassung derselben Person für ihn
    if (G0 && G0.ai && ai.length) { const keep = G0.ai.filter(id => DRVS.includes(id) && !ub0.includes(baseOf(id))).slice(0, nAI), ub1 = new Set(ub0.concat(keep.map(baseOf))); ai = keep.concat(ai.filter(id => !ub1.has(baseOf(id)))).slice(0, nAI); }
    if (G0) { gp = Object.assign({}, gpPack(), {i: Math.min(G0.k || 0, G0.list.length - 1)}); track = gp.list[gp.i]; }
    else if (cf.gp && cf.gp !== 'off') { const c = lgpc(cf.gp) || LGPC[0], cu = CUPS.find(x => x.id === c.id), rest = TRACKS.map(t => t.id).filter(t => t !== track).sort(() => Math.random() - .5);
      gp = {id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), cup: c.id, e: c.e, n: c.n, list: cu ? cu.t.slice() : TRACKS.map(t => t.id).sort(() => Math.random() - .5).slice(0, 4), i: 0, k: 0, pts: {}, nm: {}, pl: {}, dr: {}, ai: ai.slice(), ts: Date.now()}; track = gp.list[0]; }
    const dl = rnd ? 10700 : 6500, cfS = rnd ? Object.assign({}, cf, {cc: pick(CCS)}) : cf;   /* +2 s für die Auslosung der Startplätze; Zufallsrennen: Klasse wird für alle mit ausgelost (+0,6 s Walze) */ liveEmit({t: 'start', id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), track, at: Date.now() + dl, delay: dl, players: lb.map(p0 => p0.peer), host: LIVE.me, ai, gp, auto: auto ? 1 : 0, seed: Math.random().toString(36).slice(2, 10), cfg: cfS, rnd: rnd || undefined}); }
  // Auto-Start: sind alle in der Lobby (mindestens 2) bereit, startet das Rennen nach 3 s von selbst (gesendet vom „Anführer“ = kleinste Peer-Kennung)
  // Grand Prix: Mitfahrer, die gerade nicht in der Lobby sind (App im Hintergrund, fährt noch), werden höchstens 60 s abgewartet; „▶ Ohne … starten“ (Nachricht gpgo) überspringt
  const GPWAIT = 60000;
  function gpAway() { const g = gpLive(); if (!g || LIVE.gpGo === g.id) return []; const inL = new Set(lobby().map(p0 => p0.peer)); return LIVE.peers.filter(p0 => p0.kind === 'viewer' && !p0.sameTab && !inL.has(p0.peer) && p0.presence && p0.presence.gpm === g.id); }
  const liveMin = () => gpLive() ? 1 : 2;   // im laufenden Grand Prix darf auch einer allein (mit Computer-Gegnern) weiterfahren, wenn die anderen weg sind
  function liveAuto() { const lb = lobby(); let all = lb.length >= liveMin() && lb.every(p0 => p0.presence.rdy);
    if (!all) LIVE.gpW0 = 0; else if (gpAway().length) { const tn = performance.now(); if (!LIVE.gpW0) { LIVE.gpW0 = tn; setTimeout(() => { if (LIVE.gpW0) liveAuto(); }, GPWAIT + 500); } if (tn - LIVE.gpW0 < GPWAIT) all = false; }
    if (!all || LIVE.race || box.hidden || MODE !== 'live') { if (LIVE.autoAt) { LIVE.autoAt = 0; if (!menu.hidden) liveBox(); gpResUpd(); } return; }
    if (LIVE.autoAt) return; LIVE.autoAt = performance.now() + 3000; SFX.pick();
    const tick = () => { if (!LIVE.autoAt) return; if (!menu.hidden) liveBox(); gpResUpd(); if (performance.now() < LIVE.autoAt) { setTimeout(tick, 250); return; } LIVE.autoAt = 0;
      const lb2 = lobby(); if (lb2.length >= liveMin() && lb2.every(p0 => p0.presence.rdy) && liveLeader(lb2) === LIVE.me && !LIVE.race) liveGo(1); }; tick(); }
  // Live-Pokal: Punkte nach jedem Rennen (gleiche Reihenfolge auf allen Handys)
  // Schlüssel je Teilnehmer: echte Spieler über die Person („Ich bin …“, auch im Zufallsrennen gleich), Computer über die Figur
  const gpMyKey = () => 'p:' + (PME() || (RNDR ? RNDR.me0 : me));
  function gpKeys(order) { const ks = order.map(k => k.aiIdx !== undefined ? 'a:' + k.id : k.me ? gpMyKey() : 'p:' + (k.who || k.id)); return ks.map((x, i) => ks.indexOf(x) !== i ? x + '#' + i : x); }
  function gpTable(g) { return Object.keys(g.pts || {}).map(key => { const pl = (g.pl || {})[key] || []; return {key, pts: g.pts[key], pl, wins: pl.filter(x => x === 1).length, last: pl[pl.length - 1] || 9, nm: (g.nm || {})[key] || key.slice(2), dr: (g.dr || {})[key], ai: key[0] === 'a', me: key === gpMyKey()}; })
    .sort((a, b) => b.pts - a.pts || b.wins - a.wins || a.last - b.last || a.nm.localeCompare(b.nm)); }
  function liveGpScore(order) { const g = LIVE.gp; if (!g || g.end || !g.pts || !S.live || (g.seen = g.seen || {})[S.live.id]) return; g.seen[S.live.id] = 1;
    const ri = g.k || 0, keys = gpKeys(order), before = {}; gpTable(g).forEach((r, i) => { before[r.key] = i + 1; }); g.pl = g.pl || {}; g.dr = g.dr || {}; g.gain = {};
    order.forEach((k, i) => { const key = keys[i], pts = k.out ? 0 : PTS[i] || 0; g.nm[key] = k.aiIdx !== undefined ? '🤖 ' + NAME(k.id) : k.me ? NAME(PME() || (RNDR ? RNDR.me0 : me)) : NAME(k.who || k.id); g.dr[key] = k.id; g.pts[key] = (g.pts[key] || 0) + pts; g.gain[key] = pts; (g.pl[key] = g.pl[key] || [])[ri] = k.out ? 0 : i + 1; });
    g.prev = before; g.k = ri + 1; g.rid = S.live.id; g.ts = Date.now(); if (g.k >= g.list.length) g.done = 1; gpSave(); }
  function liveSave(order) { try { localStorage.removeItem('br26.kartLiveRun'); } catch (e) {} if (!WR || !DB || !S.live || (S.live.curHost || S.live.host) !== LIVE.me) return;
    const res0 = order.map((k, i) => ({who: k.me ? (PME() || me) : k.aiIdx !== undefined ? null : (k.who || k.id), drv: k.id, ai: k.aiIdx !== undefined ? 1 : 0, ms: k.done && !k.out ? Math.round(k.done * 1000) : null, pl: i + 1}));
    DB.doc('kartlive/' + S.live.id).set({ts: Date.now(), track: T.id, gp: LIVE.gp ? LIVE.gp.id : null, res: res0}).catch(() => {});
    const g = LIVE.gp; if (g && g.done && !g.end && g.rid === S.live.id) DB.doc('kartlive/gp_' + g.id).set({ts: Date.now(), fin: 1, gp: g.id, cup: g.cup || null, n: g.list.length, res: gpTable(g).map((r, i) => ({who: r.ai ? null : r.key.slice(2).split('#')[0], drv: r.dr || null, ai: r.ai ? 1 : 0, pts: r.pts, pl: i + 1}))}).catch(() => {}); }
  function liveBilanz() { const w = {}, r = {}, gw = {}; LIVEST.forEach(d => { if (d.fin) { const x = (d.res || [])[0]; if (x && x.who && !x.ai) gw[x.who] = (gw[x.who] || 0) + 1; } }); LIVEST.filter(d => !d.fin).forEach(d => (d.res || []).forEach(x => { if (!x.who || x.ai) return; r[x.who] = (r[x.who] || 0) + 1; const hum = d.res.filter(y => !y.ai && y.ms); if (hum.length && hum.sort((a, b) => a.ms - b.ms)[0] === x) w[x.who] = (w[x.who] || 0) + 1; }));
    const ids = Object.keys(r).sort((a, b) => (w[b] || 0) - (w[a] || 0) || r[b] - r[a]); if (!ids.length) return '';
    return '<p class="kr-live-b">📊 <b>Live-Bilanz</b> (' + LIVEST.filter(d => !d.fin).length + ' Rennen): ' + ids.slice(0, 6).map((id, i) => (i === 0 && w[id] ? '👑 ' : '') + esc(NAME(id)) + ' ' + (w[id] || 0) + '/' + r[id] + (gw[id] ? ' 🏆' + gw[id] : '')).join(' · ') + '</p>'; }
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
    r.rt = performance.now(); r.delay = -st * 1000; LIVE.pending = r; TRK = r.track; LIVE.gp = r.gp && r.gp.pts ? (LIVE.gp && LIVE.gp.id === r.gp.id ? LIVE.gp : Object.assign({}, r.gp, {seen: {}})) : null; LIVE.rdy = false; startRace(); }
  function liveRejoinRestore() { const r = S.live, kk = r && r.rjK; if (!kk) return; const k = S.karts[0]; Object.assign(k, {x: kk.x, y: kk.y, a: kk.a, mv: kk.a, lap: kk.lap, idx: kk.idx, half: kk.half, lapT0: kk.lapT0, v: 0}); S.got = kk.got || 0; S.camX = k.x; S.camY = k.y; S.camA = k.a; r.rjK = null; }
  // Ping: Laufzeit zu jedem Mitspieler (über den Live-Raum hin und zurück)
  function livePing(test) { if (!LIVE.room || !LIVE.me) return; const id = (test ? 't' : '') + Math.random().toString(36).slice(2, 8); LIVE.pings[id] = performance.now(); liveEmit({t: 'ping', id, from: LIVE.me}); }
  function liveTest() { LIVE.test = []; for (let i = 0; i < 6; i++) setTimeout(() => livePing(1), i * 350); setTimeout(() => { const by = {}; (LIVE.test || []).forEach(([p0, r]) => { (by[p0] = by[p0] || []).push(r); }); LIVE.test = null;
      const nm = p0 => NAME(((LIVE.peers.find(x => x.peer === p0) || {}).presence || {}).who || '?'), rows = Object.entries(by).map(([p0, a]) => { const av = a.reduce((x, y) => x + y, 0) / a.length, mx = Math.max(...a); return (av < 180 ? '🟢 ' : av < 400 ? '🟡 ' : '🔴 ') + esc(nm(p0)) + ': ' + Math.round(av) + ' ms (max ' + Math.round(mx) + ', ' + a.length + '/6)'; });
      toast('📶 <b>Verbindungstest</b><br>' + (rows.length ? rows.join('<br>') : 'Keine Antwort von den anderen 😬')); }, 3200); }
  const pingTag = p0 => { const r = LIVE.rtt[p0]; return r === undefined ? '' : (r < 180 ? '🟢' : r < 400 ? '🟡' : '🔴') + ' ' + Math.round(r) + ' ms'; };
  // Einstellungen für alle: jeder darf ändern, es gilt die zuletzt geänderte (presence.cfg mit Zeitstempel)
  const CFG0 = {laps: 0, items: 'all', diff: -1, storm: 'off', ev: 'on', rnd: 'off', cc: 150, gp: 'off', ts: 0};
  const LGPC = [{id: 'r4', e: '🎲', n: 'Zufalls-Pokal', x: '4 zufällige Strecken'}].concat(CUPS.map(c => ({id: c.id, e: c.e, n: c.n, x: c.t.length + ' Strecken'}))), lgpc = id => LGPC.find(c => c.id === id);
  function liveCfg() { let c = Object.assign({}, CFG0, LIVE.cfg || {}); lobby().forEach(p0 => { const x = p0.presence.cfg; if (x && x.ts > c.ts) c = Object.assign({}, CFG0, x); }); return c; }
  const cfgVal = c => ({laps: c.laps ? c.laps + (c.laps === 1 ? ' Runde' : ' Runden') : 'Standard', items: {all: 'alle', turbo: 'nur Turbo', off: 'aus'}[c.items], diff: c.diff < 0 ? 'Gastgeber' : ['Leicht', 'Normal', 'Schwer', 'Profi'][c.diff], storm: {off: 'nie', rnd: 'Zufall', on: 'immer'}[c.storm], ev: c.ev === 'off' ? 'aus' : 'an', rnd: c.rnd === 'on' ? 'an' : 'aus', cc: c.rnd === 'on' ? '🎲 Zufall' : CCN[c.cc] || '150 ccm'});
  const cfgTxt = c => ({laps: '🔁 Runden: ' + (c.laps || 'Standard'), items: '🎁 Items: ' + {all: 'alle', turbo: 'nur 🍹 Turbo', off: 'aus'}[c.items], diff: '🤖 Gegner: ' + (c.diff < 0 ? 'je nach Gastgeber' : ['Leicht', 'Normal', 'Schwer', 'Profi'][c.diff]), storm: '⛈️ Gewitter: ' + {off: 'nie', rnd: 'Zufall', on: 'immer'}[c.storm], ev: '🎲 Ereignisse: ' + (c.ev === 'off' ? 'aus' : 'an')});
  function cfgStep(key) { const c = liveCfg(); if (key === 'laps') c.laps = (c.laps + 1) % 6; if (key === 'items') c.items = {all: 'turbo', turbo: 'off', off: 'all'}[c.items]; if (key === 'diff') c.diff = c.diff >= 3 ? -1 : c.diff + 1; if (key === 'storm') c.storm = {off: 'rnd', rnd: 'on', on: 'off'}[c.storm]; if (key === 'ev') c.ev = c.ev === 'off' ? 'on' : 'off'; if (key === 'rnd') c.rnd = c.rnd === 'on' ? 'off' : 'on'; if (key === 'cc') c.cc = {150: 200, 200: 100, 100: 150}[c.cc] || 150; if (key.indexOf('gp:') === 0) { c.gp = key.slice(3); if (c.gp !== 'off') store.set('kartLiveCup', c.gp); }
    c.ts = Date.now(); LIVE.cfg = c; livePres(); liveBox(); }
  // Schnellsprüche in der Lobby (derb, schwarz, Crew war einverstanden); {n} = zufälliger Mitspieler
  const TAUNTS = ['{n}, ich fahr dich platter als deine letzte Beziehung.', 'Wer Letzter wird, zahlt die nächste Runde. Und die Beerdigung.', '{n} fährt, wie er trinkt: viel zu lang und am Ende gegen die Wand.',
    'Ich hab Nasenbären gesehen, die besser lenken als {n}.', 'Bremsen ist was für Leute mit Lebensversicherung.', 'Heute gewinnt nur einer. Der Rest sucht sich schon mal einen Grabstein aus.',
    'Ich überhol dich so knapp, {n}, das merkst du erst auf der Intensivstation.', '{n}, du bist so langsam, dein Kart hat schon Rente beantragt.', 'Wer Letzter wird, kotzt heute Abend als Erster.',
    'Nach dem Rennen kratzen wir {n} mit dem Spachtel von der Strecke.', 'Selbst der Kaiman hat {n} wieder ausgespuckt. Zu zäh, zu wenig Talent.', 'Mein Testament ist gemacht. Deins auch, {n}? Brauchst du gleich.',
    'Splitwise-Eintrag: Krankenwagen für {n}, durch sechs geteilt.', 'Keine Sorge, {n}, wir sagen deiner Mama, du warst tapfer.', 'Ich fahr heute nüchtern. Das wird für euch alle ein Albtraum.',
    '{n}, wenn du verlierst, darfst du dir aussuchen, welcher Nasenbär deine Asche verstreut.', 'Ich wollte fair fahren. Dann hab ich {n} gesehen und mich umentschieden.', 'Leg schon mal die Organspende-Karte aufs Armaturenbrett, {n}.'];
  function tauntSend(i) { const others = lobby().filter(p0 => p0.peer !== LIVE.me).map(p0 => NAME(p0.presence.who)), n = others.length ? pick(others) : 'Simon'; liveEmit({t: 'taunt', txt: TAUNTS[i].replace(/\{n\}/g, n)}); }

  // Wer spielt was (Lobby-Karten und Leiste unten): echter Name, Figur, Fahrzeug mit Bild
  function lpInfo(p0) { const pr = p0.presence || {}, d0 = DRVS.includes(pr.drv) ? pr.drv : (DRVS.includes(pr.who) ? pr.who : 'jonas'), X = XBY[d0], vt = VEHS.some(v => v.id === pr.veh) ? pr.veh : 'kart', V0 = VEHS.find(v => v.id === vt);
    return {pr, d0, who: NAME(p0.sameTab ? (PME() || pr.who || me) : pr.who || d0), char: X && X.base ? NAME(X.base) : NAME(d0), sub: X && X.sh ? X.sh : X && X.guest ? 'Gast' : '', vt, vn: vt === 'kart' && STYK(d0) ? STN[STYK(d0)] || V0.n : V0.n, ve: V0.e}; }
  function lpVeh(I) { const pt = Object.assign({}, I.pr.paint || {}, I.pr.parts || {}), key = I.d0 + '|' + I.vt + '|' + JSON.stringify(pt); let c = LIVE.vsc.get(key);
    if (!c) { c = vehSprite(pt.c || (LOOK[I.d0] || {}).shirt || '#00a651', I.vt, pt, I.d0); LIVE.vsc.set(key, c); if (LIVE.vsc.size > 40) LIVE.vsc.delete(LIVE.vsc.keys().next().value); }
    const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; d.getContext('2d').drawImage(c, 0, 0); d.className = 'kr-lpv'; return d; }
  // Leiste unten über dem Bereit-Knopf (immer sichtbar, auch beim Durchscrollen der Fahrerwahl)
  function liveStrip() { const ft = menu.querySelector('.kr-foot'); if (!ft) return; let st = ft.querySelector('.kr-fstrip'); const on = MODE === 'live' && !!LIVE.room && LIVE.ok !== false;
    ft.classList.toggle('live', on); if (!on) { if (st) st.remove(); return; } if (!st) { st = document.createElement('div'); st.className = 'kr-fstrip'; ft.prepend(st); }
    const lp = lobbyP(); st.innerHTML = lp.map((p0, i) => { const I = lpInfo(p0); return '<span class="kr-fsc' + (I.pr.rdy ? ' rdy' : '') + (p0.sameTab ? ' me' : '') + '" style="--pc:' + PCOL[i % 6] + '"><i>P' + (i + 1) + '</i><span class="kr-fsi" data-d="' + esc(I.d0) + '"></span><span class="kr-fsx"><b>' + esc(I.who) + '</b><small>' + esc(I.char + (I.sub ? ' · ' + I.sub : '')) + '</small><small>' + I.ve + ' ' + esc(I.vn) + '</small></span>' + (I.pr.rdy ? '<u>✓</u>' : '') + '</span>'; }).join('') + (lp.length < 2 ? '<span class="kr-fsc kr-fse"><span class="kr-fsx"><b>Warte auf Mitspieler …</b><small>Die anderen wählen auch „👥 Live“</small></span></span>' : '');
    st.querySelectorAll('.kr-fsi').forEach(x => { const c = portrait(x.dataset.d, 34, 40); c.className = 'kr-fsi'; x.replaceWith(c); }); }
  function rdyTxt() { const lb = lobby(), nr = lb.filter(p0 => p0.presence.rdy).length, wait = lobbyP().filter(p0 => !p0.presence.rdy), cd = LIVE.autoAt ? Math.max(0, Math.ceil((LIVE.autoAt - performance.now()) / 1000)) : 0;
    const g = gpLive(), gr = g ? ' für Rennen ' + (Math.min(g.k || 0, g.list.length - 1) + 1) + '/' + g.list.length : '', pend = gpAway(), pw = LIVE.gpW0 ? Math.max(0, Math.ceil((LIVE.gpW0 + GPWAIT - performance.now()) / 1000)) : 0;
    if (LIVE.autoAt) return ['go', '🏁 Alle bereit · Start in ' + cd + ' …'];
    if (!LIVE.rdy) return ['no', (g ? '👍 Bereit' + gr : '👍 Ich bin bereit!') + (lb.length >= 2 ? ' · ' + nr + '/' + lb.length : '')];
    if (!wait.length && pend.length) return ['yes', '✅ Bereit · warte auf ' + pend.map(p0 => NAME(p0.presence.who)).join(', ') + (pw ? ' (max. ' + pw + ' s)' : '')];
    return ['yes', lb.length < liveMin() ? '✅ Bereit · warte auf Mitspieler' : '✅ Bereit · warte auf ' + wait.map(p0 => p0.sameTab ? 'dich' : NAME(p0.presence.who)).join(', ')]; }
  function liveFoot() { const go = menu.querySelector('.kr-go'); if (!go) return; const on = MODE === 'live'; { const dc = menu.querySelector('.kr-dice'); if (dc) { const ro = on && liveCfg().rnd === 'on'; dc.setAttribute('aria-pressed', ro); dc.querySelector('small').textContent = ro ? 'Zufall ✓' : 'Zufall'; } } go.classList.toggle('kr-rdyon', false); go.classList.toggle('kr-rdygo', false); go.classList.toggle('kr-rdyno', false); if (!on) return;
    const [rk, rt] = rdyTxt(); go.textContent = rt; go.classList.add(rk === 'yes' ? 'kr-rdyon' : rk === 'go' ? 'kr-rdygo' : 'kr-rdyno'); }
  function liveBox() { const el = menu.querySelector('.kr-live'); if (!el) return; el.hidden = MODE !== 'live'; liveStrip(); liveFoot(); if (MODE !== 'live') return; liveJoin();
    if (LIVE.ok === false) { el.innerHTML = '<p>📡 Live geht nur, wenn die Seite auf claude.ai mit deinem Konto offen ist (als Bearbeiter eingeladen).</p>'; return; }
    if (!LIVE.room) { el.innerHTML = '<p>📡 Verbinde mit dem Live-Raum …</p>'; return; }
    const lb = lobby(), nr = lb.filter(p0 => p0.presence.rdy).length, drvs = lb.map(p0 => p0.presence.drv), vs = liveVotes(lb), g = LIVE.gp && !LIVE.gp.end && !LIVE.gp.hid ? LIVE.gp : null, gpRun = !!gpLive();
    // Spieler-Karten wie bei Super Smash Bros (Wunsch Patrick 09.10.): P1–P6 in festen Farben; oben wer spielt (echter Name), groß die Figur, darunter das Fahrzeug mit Bild, Stempel „BEREIT!“
    const lp = lobbyP(), tn0 = performance.now();
    lp.forEach(p0 => { const r0 = p0.presence.rdy ? 1 : 0; if (LIVE.lpRdy[p0.peer] !== r0) { LIVE.lpRdy[p0.peer] = r0; LIVE.lpRdyAt[p0.peer] = tn0; } });   // Stempel nur beim Wechsel animieren (Lobby zeichnet sich oft neu)
    lp.forEach(p0 => { const d0 = p0.presence.drv, pv = LIVE.lpDrv[p0.peer]; if (pv !== undefined && pv !== d0) { LIVE.lpAt[p0.peer] = tn0; if (!p0.sameTab) { clearTimeout(LIVE.lpAnn); LIVE.lpAnn = setTimeout(() => { const q = lobby().find(x => x.peer === p0.peer); if (q && q.presence.drv === d0 && !box.hidden && MODE === 'live' && !LIVE.race) announce(d0); }, 700); } } LIVE.lpDrv[p0.peer] = d0; });
    const [rk, rt] = rdyTxt(), c0 = liveCfg(), cv0 = cfgVal(c0), cfgT = [['cc', '🏎️', 'Klasse'], ['laps', '🔁', 'Runden'], ['items', '🎁', 'Items'], ['diff', '💪', 'Stärke'], ['storm', '⛈️', 'Gewitter'], ['ev', '🎲', 'Ereignisse']];
    el.innerHTML = (g ? gpCard(g) : '') + '<p class="kr-lbl">Im Live-Raum (' + lb.length + ') · ✅ ' + nr + '/' + lb.length + ' bereit</p><div class="kr-lsm">' + lp.map((p0, i) => { const I = lpInfo(p0), pr = I.pr, dup = drvs.filter(x => x === pr.drv).length > 1, age = tn0 - (LIVE.lpAt[p0.peer] || -1e9);
        return '<div class="kr-lpc' + (pr.rdy ? ' rdy' : '') + (p0.sameTab ? ' me' : '') + (age < 650 ? ' new' : '') + '" style="--pc:' + PCOL[i % 6] + (age < 650 ? ';--ad:-' + Math.round(age) + 'ms' : '') + '"><span class="kr-lpn"><i>P' + (i + 1) + '</i>' + esc(I.who) + '</span><span class="kr-lpi" data-d="' + esc(I.d0) + '"></span>' +
          '<b>' + esc(I.char) + (dup ? ' ⚠️' : '') + '</b><small>' + esc(I.sub) + '</small><span class="kr-lpvr"><span class="kr-lpvs" data-p="' + esc(p0.peer) + '"></span><em>' + esc(I.vn) + '</em></span>' +
          '<span class="kr-lpf">' + (TBY[pr.trk] ? '<span title="Stimme: ' + esc(TBY[pr.trk].name) + '">🗳️ ' + TBY[pr.trk].e + '</span>' : '<span></span>') + (p0.sameTab ? '' : '<small class="kr-ping">' + pingTag(p0.peer) + '</small>') + '</span>' +
          (pr.rdy ? '<span class="kr-lpr' + (tn0 - (LIVE.lpRdyAt[p0.peer] || -1e9) < 400 ? ' pop' : '') + '">BEREIT!</span>' : '') + '</div>'; }).join('') +
        (lp.length % 3 ? '<div class="kr-lpc kr-lpe" style="--pc:' + PCOL[lp.length % 6] + '"><span class="kr-lpn"><i>P' + (lp.length + 1) + '</i>frei</span><span class="kr-lpq">＋</span><small>Wer mitfährt, wählt auch „👥 Live“</small></div>' : '') + '</div>' +
      '<button type="button" class="kr-rdybig kr-rb-' + rk + '">' + esc(rt) + '</button>' +
      (gpRun ? '' : '<div class="kr-lmode"><button type="button" data-lm="off" class="' + (c0.gp === 'off' ? 'on' : '') + '"><i>🏁</i><b>Einzelrennen</b><small>ein Rennen, Strecke per Abstimmung</small></button><button type="button" data-lm="gp" class="' + (c0.gp !== 'off' ? 'on' : '') + '"><i>🏆</i><b>Grand Prix</b><small>mehrere Rennen mit Punktetabelle</small></button></div>' +
        (c0.gp !== 'off' ? '<div class="kr-lcups">' + LGPC.map(c => '<button type="button" data-lc="' + c.id + '" class="' + (c0.gp === c.id ? 'on' : '') + '"><i>' + c.e + '</i><b>' + esc(c.n) + '</b><small>' + esc(c.x) + '</small></button>').join('') + '</div>' : '')) +
      '<button type="button" class="kr-rndtog' + (c0.rnd === 'on' ? ' on' : '') + '" aria-pressed="' + (c0.rnd === 'on') + '"><b>🎲 Zufallsrennen für alle: ' + (c0.rnd === 'on' ? 'AN' : 'aus') + '</b><small>' + (c0.rnd === 'on' ? 'Fahrer, Fahrzeug (nur freigeschaltete), Strecke und Klasse werden ausgelost. Eure Auswahl unten zählt diesmal nicht · antippen = aus' : 'antippen: der Automat lost jedem Fahrer und Fahrzeug zu, dazu Strecke und Klasse') + '</small></button>' +
      (() => { const tn = performance.now(), tt = lb.map(p0 => [p0, LIVE.taunts[p0.peer]]).filter(([, t]) => t && t.until > tn); return tt.length ? '<div class="kr-taunts">' + tt.map(([p0, t]) => '<p><b>' + esc(NAME(p0.presence.who)) + ':</b> „' + esc(t.txt) + '“</p>').join('') + '</div>' : ''; })() +
      (liveRun() && LIVE.peers.some(p0 => p0.presence && p0.presence.race === liveRun().race.id) ? '<button type="button" class="kr-rjb">🔄 Zurück ins laufende Rennen (' + esc((TBY[liveRun().race.track] || {}).name || '') + ')</button>' : '') +
      (gpRun || c0.gp !== 'off' ? '' :
        c0.rnd === 'on' ? '' :
        vs.length ? '<div class="kr-votes"><span>🗳️ Strecke</span>' + vs.map(([t, n], j) => '<b class="' + (j === 0 ? 'top' : '') + '">' + TBY[t].e + ' ' + esc(TBY[t].name) + ' <i>' + n + '</i></b>').join('') + '<small>Deine Stimme = die Strecke, die du unten in Schritt ③ wählst.</small></div>' : '') +
      // Einstellungen als Kacheln (Wunsch Patrick 09.10.: übersichtlicher und schöner)
      '<p class="kr-lbl">⚙️ Einstellungen für alle</p><div class="kr-cfgg">' + cfgT.map(([k0, e0, n0]) => '<button type="button" class="kr-cfgt" data-cfg="' + k0 + '"><i>' + e0 + '</i><span>' + n0 + '</span><b>' + esc(cv0[k0]) + '</b></button>').join('') +
        '<button type="button" class="kr-cfgt kr-liveai"><i>🤖</i><span>Computer</span><b>' + (store.get('kartLiveAI') === '0' ? 'aus' : 'füllen auf') + '</b></button></div>' +
      '<div class="kr-live-btns kr-lx"><button type="button" class="kr-tnt' + (LIVE.tauntOpen ? ' on' : '') + '">💬 Sprüche</button><button type="button" class="kr-ptest">📶 Verbindung testen</button></div>' +
      (LIVE.tauntOpen ? '<div class="kr-tlist">' + TAUNTS.map((t, i) => '<button type="button" data-tn="' + i + '">' + esc(t.replace(/\{n\}/g, '…')) + '</button>').join('') + '</div>' : '') +
      (drvs.some((x, i) => drvs.indexOf(x) !== i) ? '<p class="kr-live-n">⚠️ Zwei fahren mit derselben Figur. Geht, aber eine andere Figur ist übersichtlicher.</p>' : '') +
      '<p class="kr-live-n">' + (lb.length < 2 ? 'Warte auf Mitspieler: Die anderen öffnen Gringo Kart und wählen ebenfalls „👥 Live“.' : 'Das Rennen startet von selbst, sobald alle ✅ bereit sind. Wer die App wechselt, verlässt die Lobby, bis er zurück ist.') + (gpRun ? ' Im Grand Prix geht es nach jedem Rennen direkt aus der Punktetabelle weiter, sobald alle bereit sind. Wer die App im Hintergrund hat, wird höchstens 60 s abgewartet.' : '') + '</p>' + liveBilanz();
    el.querySelectorAll('.kr-lpi').forEach(x => { const c = portrait(x.dataset.d, 112, 132); c.className = 'kr-lpi'; x.replaceWith(c); });   // Porträt der gewählten Figur (vorher nur Crew-Köpfe: andere Figuren zeigten Jonas)
    gpHeads(el);
    el.querySelectorAll('.kr-lpvs').forEach(x => { const p0 = lp.find(q => q.peer === x.dataset.p); if (p0) x.replaceWith(lpVeh(lpInfo(p0))); }); }
  const gpHeads = el => el.querySelectorAll('span.kr-gpi').forEach(x => { const c = portrait(x.dataset.d, 30, 34); c.className = 'kr-gpi'; x.replaceWith(c); });   // Köpfe in der Punktetabelle
  // Zwischenstand nach einem Grand-Prix-Rennen (Wunsch Patrick 10.10.: sicherer als zurück in die Lobby): man bleibt im Ergebnis, „Bereit“ meldet einen in der Lobby an, das nächste Rennen startet direkt von hier
  function gpResUpd() { if (res.hidden || MODE !== 'live' || !gpLive() || LIVE.race) return; const ag = res.querySelector('.kr-again'), [rk, rt] = rdyTxt(); ag.textContent = rt; ['no', 'yes', 'go'].forEach(x => ag.classList.toggle('kr-gr-' + x, rk === x));
    let w = res.querySelector('.kr-gpw'); if (!w) { w = document.createElement('div'); w.className = 'kr-gpw'; res.querySelector('.kr-btns').before(w); } w.hidden = false;
    const lp = lobbyP(), away = gpAway(), all = lp.length && lp.every(p0 => p0.presence.rdy), wt = LIVE.gpW0 ? performance.now() - LIVE.gpW0 : 0;
    w.innerHTML = '<p class="kr-lbl">Bereit fürs nächste Rennen?</p><div>' + lp.map((p0, i) => '<span class="' + (p0.presence.rdy ? 'ok' : '') + '" style="--pc:' + PCOL[i % 6] + '"><i>P' + (i + 1) + '</i>' + esc(p0.sameTab ? 'Du' : NAME(p0.presence.who)) + ' ' + (p0.presence.rdy ? '✅' : '⏳') + '</span>').join('') +
      away.map(p0 => '<span class="aw">' + esc(NAME(p0.presence.who)) + (p0.presence.race ? ' 🏁 fährt noch' : ' 💤 App im Hintergrund') + '</span>').join('') + '</div>' +
      (away.length && all && wt > 8000 ? '<button type="button" class="kr-gpgo">▶ Ohne ' + esc(away.map(p0 => NAME(p0.presence.who)).join(', ')) + ' starten</button>' : ''); }
  function gpResSync() { const g = LIVE.gp; if (res.hidden || MODE !== 'live' || LIVE.race || !g || !g.pts || g.cer) return; const st = res.querySelector('.kr-stand'); if (!st || st.hidden) return;
    st.innerHTML = g.end ? '<p class="kr-gpnx">✖ Der Grand Prix wurde abgebrochen.</p>' : gpCard(g, 1) + (g.done ? '' : '<p class="kr-gpnx">▶ Nächstes Rennen ' + ((g.k || 0) + 1) + '/' + g.list.length + ': ' + esc((TBY[g.list[g.k]] || {}).e || '') + ' ' + esc((TBY[g.list[g.k]] || {}).name || '') + '</p>'); gpHeads(st);
    if (g.done || g.end) { const w = res.querySelector('.kr-gpw'), ag = res.querySelector('.kr-again'); if (w) w.hidden = true; ['no', 'yes', 'go'].forEach(x => ag.classList.remove('kr-gr-' + x)); ag.textContent = g.done && !g.end && !g.cer ? '🏆 Zur Siegerehrung' : '👥 Zur Lobby'; res.querySelector('.kr-res .kr-back').hidden = true; } else gpResUpd(); }
  // Punktetabelle des Live-Grand-Prix in der Lobby: Strecken mit Haken, je Teilnehmer Platz, Kopf, Plätze je Rennen, Punkte, Auf-/Abstieg seit dem letzten Rennen
  function gpCard(g, inRes) { const tb = gpTable(g), done = !!g.done, nx = Math.min(g.k || 0, g.list.length - 1), pv = g.prev || {}, ga = g.gain || {};
    return '<div class="kr-gpc' + (done ? ' done' : '') + '"><div class="kr-gph"><b>' + esc((g.e || '🏆') + ' ' + (g.n || 'Grand Prix')) + '</b><small>' + (done ? '🏁 Endstand nach ' + g.list.length + ' Rennen' : (g.k || 0) ? 'Stand nach Rennen ' + g.k + ' von ' + g.list.length : 'Grand Prix · ' + g.list.length + ' Rennen') + '</small></div>' +
      '<div class="kr-gpr">' + g.list.map((t, i) => { const tr = TBY[t] || {e: '❔', name: t}; return '<span class="' + (i < (g.k || 0) ? 'ok' : i === nx && !done ? 'nx' : '') + '" title="' + esc(tr.name) + '"><i>' + (i + 1) + '</i>' + tr.e + (i < (g.k || 0) ? '✓' : '') + '</span>'; }).join('') + '</div>' +
      (tb.length ? '<div class="kr-gpt2">' + tb.map((r, i) => { const d = pv[r.key] ? pv[r.key] - (i + 1) : 0; return '<div class="kr-gprw' + (r.me ? ' me' : '') + (done && i === 0 ? ' win' : '') + '"><b>' + (done && i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1) + '.') + '</b><span class="kr-gpi" data-d="' + esc(r.dr || 'jonas') + '"></span><span class="kr-gpn">' + esc(r.nm) + '<small>' + Array.from({length: Math.max(g.k || 0, r.pl.length)}, (_, j) => r.pl[j] ? r.pl[j] + '.' : '–').join(' · ') + '</small></span>' +
        (d ? '<em class="' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + Math.abs(d) + '</em>' : '<em></em>') + (ga[r.key] ? '<u>+' + ga[r.key] + '</u>' : '<u></u>') + '<strong>' + r.pts + '</strong></div>'; }).join('') + '</div>' : '<p class="kr-gpn0">Noch keine Punkte. Erstes Rennen: ' + esc((TBY[g.list[0]] || {}).e || '') + ' ' + esc((TBY[g.list[0]] || {}).name || '') + '</p>') +
      (inRes ? '' : done ? '<p class="kr-gpx0">' + (tb[0] ? '👑 <b>' + esc(tb[0].nm) + '</b> gewinnt den ' + esc(g.n || 'Grand Prix') + '! ' : '') + 'Neuer Grand Prix: einfach wieder alle bereit drücken.</p><button type="button" class="kr-gphide">Tabelle ausblenden</button>' :
        '<p class="kr-gpx0">▶ Nächstes Rennen ' + (nx + 1) + '/' + g.list.length + ': <b>' + esc((TBY[g.list[nx]] || {}).e || '') + ' ' + esc((TBY[g.list[nx]] || {}).name || '') + '</b> · startet, sobald alle „Bereit“ gedrückt haben</p><button type="button" class="kr-gpx">' + (LIVE.gpX ? '⚠️ Wirklich abbrechen? Nochmal tippen' : '✖ Grand Prix abbrechen') + '</button>') + '</div>'; }
  const GHOST = {mode: store.get('kartGhost') || 'off'};   // off | mine | crew
  function ghostLocal(tid) { try { return JSON.parse(localStorage.getItem('br26.kartGhost.' + tkey(tid)) || 'null'); } catch (e) { return null; } }
  function ghostProg(G) { if (!G || !G.g) return; let lap = -1, hint = -1, pi = null; G.prog = G.g.map(r => { const [i] = nearest(r[0], r[1], hint); hint = i; if (pi !== null && pi > N * .85 && i < N * .15) lap++; pi = i; return lap * N + i; }); }
  function ghostGap(pr) { const a0 = S.ghost && S.ghost.prog; if (!a0 || !a0.length) return null; let lo = 0, hi = a0.length - 1; if (pr > a0[hi]) return null;
    while (lo < hi) { const m = (lo + hi) >> 1; if (a0[m] < pr) lo = m + 1; else hi = m; } return S.t - lo * .1; }
  async function ghostFor(tid) {
    if (GHOST.mode === 'mine') { const g = ghostLocal(tid); return g ? {g: g.g, who: player(), drv: g.drv || me, ms: g.ms} : null; }
    if (GHOST.mode === 'crew') { const top = lbList(LB, tid)[0]; if (!top || !DB) return null;
      try { const sn = await DB.doc('kartghost/' + tkey(tid) + '__' + top.who).get(); const v = sn && sn.exists ? sn.data() : null; return v && v.g ? {g: v.g, who: top.who, drv: top.drv || top.who, ms: top.ms} : null; } catch (e) { return null; } }
    return null;
  }

  /* ---- Rennen ---- */
  const box = document.getElementById('kart'), cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
  const menu = box.querySelector('.kr-menu'), res = box.querySelector('.kr-res'), itemBtn = box.querySelector('.kr-item'), sndBtn = box.querySelector('.kr-snd'), pm = box.querySelector('.kr-pm'), steerBtn = box.querySelector('.kr-steer'), annBtn = box.querySelector('.kr-ann');
  const STEERS = [['Sanft', 1.25], ['Mittel', 1.65], ['Stark', 2.2]]; let STEER = +(store.get('kartSteer') || 1); if (!STEERS[STEER]) STEER = 1;
  // Gegner-Stärke: Tempo-Spanne, Gummiband, wie genau die Ideallinie gefahren wird
  // Gegner-Stärke (08.10.: Normal etwas stärker, neu Profi = schneller, Ideallinie, kaum Fehler, wenig Gummiband)
  const DIFFS = [{n: 'Leicht', s: [.86, .92], rb: .45, line: .4, mis: 1.3}, {n: 'Normal', s: [.94, .995], rb: .32, line: .85, mis: 1}, {n: 'Schwer', s: [.97, 1.015], rb: .18, line: 1, mis: .75}, {n: 'Profi', s: [1.005, 1.04], rb: .1, line: 1, mis: .4}];
  let DIFF = +(store.get('kartDiff') || 1); if (!DIFFS[DIFF]) DIFF = 1;
  const vib = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  let S = null, raf = 0, last = 0, me = (KG && XBY[KG] ? KG : ME) || 'patrick', W = 0, H = 0, DPR = 1, MODE = ['cup', 'live'].includes(store.get('kartMode')) ? store.get('kartMode') : 'single', TRK = TBY[store.get('kartTrack')] ? store.get('kartTrack') : 'copa', CUP = null;
  const loadJ = k => { try { return JSON.parse(store.get(k) || '{}'); } catch (e) { return {}; } };
  // Zurücksetzen aller Zeiten (Stichtag in trip.json → kartReset): lokale Bestzeiten, Rundenzeiten und eigene Geister einmalig löschen
  if (TRIP.kartReset && store.get('kartResetSeen') !== TRIP.kartReset) { try { Object.keys(localStorage).filter(k => /^br26\.(kart(Best$|Lap\.|Sec\.|Ghost\.|RecSeen$)|cache\.kart(best|ghost|daily)$)/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {} store.set('kartResetSeen', TRIP.kartReset); }
  const best = () => loadJ('kartBest');
  // Einstellungen: Steuerung (Halten/Analog), Grafik (Sparsam/Normal/Hoch), Kamera (Nah/Normal/Weit)
  const SET = Object.assign({ctl: 'hold', q: 1, cam: 1, tod: 'real'}, loadJ('kartSet')), saveSet = () => store.set('kartSet', JSON.stringify(SET));
  const stats = () => { const s0 = Object.assign({races: 0, wins: 0, ilha: 0, supers: 0, cups: 0, coinsTot: 0, rivals: 0, tracks: '', smash: 0, tds: 0, vsup: 0, vtds: 0, vcup: 0}, loadJ('kartStats')); s0.tracksN = s0.tracks.split(',').filter(Boolean).length; return s0; };
  const unlocked = v => (!v.need && !v.c) || (v.need ? stats()[v.need[0]] >= v.need[1] : false) || !!loadJ('kartVehOwn2')[v.id];   // frei, Erfolg (seit dem Neustart) erreicht oder gekauft
  let RNDR = null;   // laufendes Zufallsrennen {me0, trk0, veh}: eigene Auswahl kommt im Menü zurück
  const myVeh = () => { if (RNDR) return RNDR.veh; const v = VEHS.find(x => x.id === store.get('kartVeh')); return v && unlocked(v) ? v.id : 'kart'; };
  // Münzen (auf der Strecke + Bonus), Tuning, Kostüme, Erfolge: alles pro Handy
  // Kart-Baukasten (Garage): Reifen und Flügel einzeln, ändern Aussehen und Fahrgefühl (nur das eigene Fahrzeug, nicht auf dem Boot)
  // f: v = Spitze, g = Haftung, d = Rutschen im Drift, m = Masse, acc = Antritt, tgh = Nehmer, off = Bremsen neben der Strecke, air = Flugzeit, land = Turbo bei Landung, b = Turbo-Dauer, bs = Lenkung im Turbo, wet = Haftung bei Regen
  const PARTS = {tire: [{id: 'std', e: '⚫', n: 'Standard', x: 'ausgewogen', c: 0},
      {id: 'coco', e: '🥥', n: 'Kokosnuss-Reifen', x: 'schneller, aber rutschig wie Seife', c: 40, f: {v: 1.04, g: .8, d: 1.25}},
      {id: 'off', e: '🛞', n: 'Offroad-Stollen', x: 'Sand und Wiese bremsen kaum, auf der Strecke minimal langsamer', c: 35, f: {v: .985, off: .35}},
      {id: 'slick', e: '🏁', n: 'Slicks', x: 'kleben in Kurven, aber rutschen bei Regen', c: 45, f: {g: 1.2, d: .85, wet: .7}},
      {id: 'monster', e: '🚜', n: 'Monster-Räder', x: 'schwer und robust: Rempler prallen ab, Dreher kurz, Antritt träge', c: 50, f: {m: 1.6, acc: .85, tgh: .25, v: .99}}],
    wing: [{id: 'none', e: '➖', n: 'Ohne', x: 'kein Flügel', c: 0},
      {id: 'surf', e: '🏄', n: 'Surfbrett-Flügel', x: 'gleitet nach der Schanze weiter, Landung mit Turbo', c: 40, f: {air: 1.6, land: 1}},
      {id: 'palm', e: '🌴', n: 'Palmenblatt-Spoiler', x: 'mehr Halt in schnellen Kurven', c: 35, f: {g: 1.12, d: .92}},
      {id: 'jet', e: '🚀', n: 'Raketen-Heck', x: 'Turbos halten länger, im Turbo lenkt es schwammig', c: 55, f: {b: 1.3, bs: .82}}]};
  const partsOf = () => { const o = loadJ('kartParts'); return {tire: PARTS.tire.some(p0 => p0.id === o.tire) ? o.tire : 'std', wing: PARTS.wing.some(p0 => p0.id === o.wing) ? o.wing : 'none', own: o.own || {}}; };
  function partsFx() { const P0 = {v: 1, g: 1, d: 1, m: 1, acc: 1, tgh: 0, off: 1, air: 1, land: 0, b: 1, bs: 1}; if (typeof T !== 'undefined' && T && T.veh === 'boat') return P0; const pp = partsOf();
    [PARTS.tire.find(x => x.id === pp.tire), PARTS.wing.find(x => x.id === pp.wing)].forEach(X => Object.entries((X && X.f) || {}).forEach(([k, v]) => { if (k === 'wet') { if (T && (T.rain || (S && (S.rainX || (S.storm && S.storm.f > .3))))) P0.g *= v; } else if (k === 'tgh' || k === 'land') P0[k] += v; else P0[k] *= v; })); return P0; }
  const coins = () => +(store.get('kartCoins') || 0), addCoins = n => store.set('kartCoins', String(Math.max(0, coins() + n)));
  // Werkstatt (Tuning 2.0, Wunsch Patrick 09.10.): je Fahrzeug 6 Teile à 5 Stufen; Wirkung spürbar, aber klein genug für die Balance (Gegner ziehen etwas mit)
  const TUNE = [{k: 'm', e: '⚙️', n: 'Motor', x: 'mehr Endtempo', f: l => '+' + l + ' % Endtempo'}, {k: 'a', e: '⚡', n: 'Getriebe', x: 'schneller auf Tempo (Start, nach Treffern)', f: l => '+' + l * 5 + ' % Beschleunigung'},
    {k: 'r', e: '🛞', n: 'Reifen', x: 'mehr Haftung, auch neben der Strecke', f: l => '+' + l * 4 + ' % Haftung · −' + l * 3 + ' % Bremse im Sand'}, {k: 's', e: '🎯', n: 'Fahrwerk', x: 'direktere Lenkung', f: l => '+' + l * 3 + ' % Lenkung'},
    {k: 't', e: '🔥', n: 'Turbo', x: 'Turbos halten länger', f: l => '+' + l * 7 + ' % Turbo-Dauer'}, {k: 'p', e: '🛡️', n: 'Panzerung', x: 'kürzere Dreher, rempelt besser', f: l => '−' + l * 6 + ' % Dreher · +' + l * 5 + ' % Masse' + (l >= 3 ? ' · Treffer kostet nur 1 🪙' : '')}],
    TCOST = [20, 35, 55, 85, 125], TKEYS = ['m', 'a', 'r', 's', 't', 'p'];
  // Tuning je Fahrzeug (alter Stand ohne Fahrzeug gehört zum Gringo-Kart)
  // Fehler behoben (Feedback Patrick 09.10.: Tuning blieb nicht gespeichert): die alte Form {m, r, t} ohne Fahrzeug kam über den Konto-Abgleich immer wieder dazu,
  // dann galt alles als „alt“ und die Stufen der Fahrzeuge waren weg. Jetzt: Zahlen oben = alter Kart-Stand (Maximum), Fahrzeug-Einträge bleiben immer erhalten
  // 09.10. abends: alte Fassungen hatten den ganzen Stand verschachtelt gespeichert (kart → kart → kart …); jetzt bleiben je Fahrzeug nur die sechs Stufen
  const tuneNorm = o => { const out = {}; let flat = null; o = o && typeof o === 'object' ? o : {};
    Object.keys(o).forEach(q => { const v = o[q]; if (v && typeof v === 'object' && VEHS.some(x => x.id === q)) { const t0 = {}; ['m', 'a', 'r', 's', 't', 'p'].forEach(z => { if (typeof v[z] === 'number') t0[z] = v[z]; }); out[q] = t0; } else if (typeof v === 'number' && 'mrt'.includes(q)) (flat = flat || {})[q] = v; });
    if (flat) { const kk = out.kart || {}; ['m', 'r', 't'].forEach(q => { kk[q] = Math.max(kk[q] || 0, flat[q] || 0); }); out.kart = kk; }
    Object.values(out).forEach(v => { if (v.r && v.s === undefined) v.s = v.r; });   // früher lenkten die Reifen mit: diese Stufen gehen ans neue Fahrwerk
    return out; };
  const tuneAll = () => tuneNorm(loadJ('kartTune'));
  const tuneOf = v => { const x = Object.assign({m: 0, a: 0, r: 0, s: 0, t: 0, p: 0}, tuneAll()[v] || {}); TKEYS.forEach(q => { x[q] = clamp(+x[q] || 0, 0, 5); }); return x; }, tune = () => tuneOf(myVeh());
  const tuneSet = (v, x) => { const o = tuneAll(); o[v] = x; store.set('kartTune', JSON.stringify(o)); };
  const COS = [{id: '', e: '🚫', n: 'Ohne'}, {id: 'cap', e: '🧢', n: 'Cap', c: 20}, {id: 'sun', e: '🕶️', n: 'Sonnenbrille', c: 30, eye: 1}, {id: 'flower', e: '🌺', n: 'Blüte', c: 30, side: 1},
    {id: 'straw', e: '👒', n: 'Sonnenhut', c: 45}, {id: 'parrot', e: '🦜', n: 'Papagei', c: 70}, {id: 'top', e: '🎩', n: 'Zylinder', c: 90}, {id: 'pine', e: '🍍', n: 'Ananas', c: 120},
    {id: 'party', e: '🎉', n: 'Silvester-Hut', ach: 'reveillon'}, {id: 'crown', e: '👑', n: 'Krone', ach: 'cup'}, {id: 'halo', e: '😇', n: 'Heiligenschein', ach: 'cristo'}, {id: 'helmet', e: '⛑️', n: 'Helm', ach: 'nohit'},
    // Reise-Kostüme: werden erst an den echten Reisetagen frei (Datum Berlin)
    {id: 'fish', e: '🎣', n: 'Fischerhut', from: '2026-12-27', fl: 'ab Abflug 27.12.'}, {id: 'nye', e: '🤍', n: 'Silvester-Weiß', from: '2026-12-31', fl: 'ab Silvester'},
    {id: 'flag', e: '🇧🇷', n: 'Brasil-Stirnband', from: '2027-01-06', fl: 'ab 06.01., Crew komplett'}, {id: 'coatihat', e: '🦝', n: 'Nasenbär-Mütze', from: '2027-01-07', fl: 'ab Iguaçu 07.01.'},
    {id: 'net', e: '🦟', n: 'Moskitonetz', from: '2027-01-09', fl: 'ab Dschungel 09.01.'}];
  const ACH = [{id: 'cc200', e: '🚀', n: 'Lichtgeschwindigkeit', x: 'ein Rennen in 200 ccm gewonnen'}, {id: 'cc100', e: '🐢', n: 'Sonntagsfahrer', x: 'ein Rennen in 100 ccm gewonnen'}, {id: 'td1', e: '💀', n: 'Erster Abschuss', x: 'einen Gegner mit einem Item erledigt'}, {id: 'td3', e: '☠️', n: 'Dreifach-Massaker', x: 'drei Takedowns in Folge'}, {id: 'combo', e: '💥', n: 'Erste Item-Kombo'}, {id: 'police', e: '👮', n: 'Brav durch die Polizeikontrolle'}, {id: 'first', e: '🏁', n: 'Erstes Rennen'}, {id: 'win', e: '🥇', n: 'Erster Sieg'}, {id: 'rocket', e: '🚀', n: 'Raketenstart'}, {id: 'trick', e: '🤸', n: 'Trick auf der Schanze'},
    {id: 'cut', e: '⤴', n: 'Abkürzung gefunden'}, {id: 'dolphin', e: '🐬', n: 'Delfin-Turbo'}, {id: 'nohit', e: '😇', n: 'Fehlerfrei', x: 'ein Rennen ohne Treffer'}, {id: 'super10', e: '🔥', n: 'Turbo-Junkie', x: '10 Super-Turbos'},
    {id: 'coins100', e: '🪙', n: 'Sparschwein', x: '100 Münzen gesammelt'}, {id: 'night', e: '🌙', n: 'Nachtfahrer', x: 'Rennen bei Nacht'}, {id: 'sp', e: '🏙️', n: 'Stau-Sieger', x: 'São Paulo gewinnen'},
    {id: 'reveillon', e: '🎆', n: 'Feliz Ano Novo', x: 'Réveillon gewinnen'}, {id: 'cristo', e: '⛰️', n: 'Gipfelstürmer', x: 'Cristo gewinnen'}, {id: 'all', e: '🗺️', n: 'Weltenbummler', x: 'alle Strecken gefahren'},
    {id: 'cup', e: '🏆', n: 'Pokalsieger', x: 'einen Grand Prix gewinnen'}, {id: 'rival5', e: '⚔️', n: 'Erzfeind', x: '5 Rivalen-Duelle gewonnen'}, {id: 'tuned', e: '🛠', n: 'Voll getunt', x: 'ein Teil auf Stufe 5'}, {id: 'smash', e: '💥', n: 'Abrissbirne', x: '25 Dinge am Streckenrand zerlegt'}];
  const achs = () => loadJ('kartAch'), hasAch = id => !!achs()[id];
  let toastT = 0;
  function toast(html, ms) { const el = box.querySelector('.kr-toast'); el.innerHTML = html; el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms || 3200); }
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

  // Startaufstellung wird ausgelost (Wunsch Patrick 10.10.: immer von verschiedenen Positionen starten, vorher ausgelost). Einzelrennen/Pokal: Zufall, der eigene Startplatz nie zweimal
  // hintereinander gleich (br26.kartSlot); live: dieselbe Auslosung auf allen Handys aus dem Start-Seed (vorher stellte jedes Handy sein eigenes Kart auf die Pole, echte Mitspieler starteten übereinander)
  function gridSlots(order, LP, LAI) { const n = order.length;
    if (TUTON) return order.map((_, k) => k === 0 ? 2 : k <= 2 ? k - 1 : k);
    if (LP) { const r = mulberry(hashS(String(LIVE.race.seed || LIVE.race.id) + ':grid')), perm = LIVE.race.players.concat(LAI.map((_, j) => 'ai' + j)).map(e => [r(), e]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      const sl = order.map((_, k) => perm.indexOf(k === 0 ? LIVE.me : k <= LP.length ? LP[k - 1].peer : 'ai' + (k - LP.length - 1)));
      if (sl.some(x => x < 0) || new Set(sl).size !== n) return order.map((_, k) => k);   /* Notfall (z. B. Wiedereinstieg mit neuer Kennung): alte Reihenfolge */ return sl; }
    const s0 = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s0[i], s0[j]] = [s0[j], s0[i]]; }
    const last = +store.get('kartSlot'); if (n > 1 && s0[0] === last) { const j = 1 + Math.floor(Math.random() * (n - 1)); [s0[0], s0[j]] = [s0[j], s0[0]]; }
    store.set('kartSlot', String(s0[0])); return s0; }
  const gQuip = (s, n) => s === 0 ? 'Pole-Position! Jetzt bloß nicht direkt in die Bande.' : s === n - 1 ? 'Letzte Reihe. Wie im echten Leben.' : s === 1 ? 'Erste Reihe. Der Pokal riecht schon nach dir.' : s === n - 2 ? 'Fast ganz hinten. Beste Sicht auf das Gemetzel.' : ['Mittelfeld. Genau da, wo die Unfälle passieren.', 'Genug Leute vor dir zum Abschießen.'][s % 2];
  // Auslosung zeigen: Einzelrennen/Pokal 3 s (Rennuhr steht, Antippen überspringt), live in der Wartezeit vor dem Countdown (Uhr läuft weiter)
  function gridMake(live) { const dur = live ? clamp(-S.t - 3.15, .9, 2.6) : 3, f = live ? clamp((dur - .7) / 1.4, .35, 1) : 1; return {t: 0, dur, live, lk: S.karts.map(k => (.3 + k.slot * .22) * f), ok: {}, ld: {}}; }
  const GDROP = .45, GBOX = {};   // Fallzeit aus der Höhe in die Startbox, Nummern-Schilder
  function gridHud() { const g = S.grid, t = g.t, n = S.karts.length, now = performance.now(), a = Math.min(clamp(t / .25, 0, 1), clamp((g.dur - t) / .3, 0, 1)), me = S.karts[0], lockMe = t >= g.lk[0];
    S.karts.forEach((k, i) => { if (g.ok[i] || t < g.lk[i]) return; g.ok[i] = 1; if (k.me) { beep(988, .12, 'triangle', .07); beep(1319, .18, 'triangle', .05); vib(15); } else beep(560 + k.slot * 45, .045, 'square', .035); });   // Klick je eingerastetem Platz
    const tw = Math.min(172, (W - 44) / 2), th = 44, gap = 8, rows = Math.ceil(n / 2), gh = rows * (th + gap) + th / 2, x0 = W / 2 - tw - 5, x1 = W / 2 + 5, y0 = H - 34 - gh;
    ctx.save(); ctx.globalAlpha = a;
    { const gr = ctx.createLinearGradient(0, y0 - 96, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.25, 'rgba(0,0,0,.62)'); gr.addColorStop(1, 'rgba(0,0,0,.86)'); ctx.fillStyle = gr; ctx.fillRect(0, y0 - 96, W, H - y0 + 96); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 8;
    ctx.font = '900 12px system-ui,sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText('🎲 STARTAUFSTELLUNG' + (CUP ? ' · RENNEN ' + (CUP.i + 1) + '/' + CUP.list.length : ''), W / 2, y0 - 62);
    ctx.font = 'italic 900 26px system-ui,sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(lockMe ? 'Du startest von Platz ' + (me.slot + 1) : 'Wird ausgelost …', W / 2, y0 - 34, W - 30);
    if (lockMe) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = '#d6e6f5'; ctx.fillText(g.q || (g.q = gQuip(me.slot, n)), W / 2, y0 - 14, W - 30); }
    ctx.shadowBlur = 0;
    S.karts.forEach((k, i) => { const s = k.slot, col = s % 2, row = Math.floor(s / 2), x = col ? x1 : x0, y = y0 + row * (th + gap) + col * th / 2, lk = t >= g.lk[i], pop = lk ? clamp(1 - (t - g.lk[i]) / .2, 0, 1) : 0, hi = lk && k.me;
      ctx.save(); ctx.translate(x + tw / 2, y + th / 2); ctx.scale(1 + pop * .12, 1 + pop * .12); ctx.translate(-tw / 2, -th / 2);
      ctx.beginPath(); ctx.roundRect(0, 0, tw, th, 10); ctx.fillStyle = hi ? 'rgba(255,210,63,.96)' : 'rgba(8,18,38,.9)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = hi ? '#fff' : s === 0 ? '#ffd23f' : 'rgba(255,255,255,.25)'; ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'italic 900 18px system-ui,sans-serif'; ctx.fillStyle = hi ? '#1a1a1a' : s === 0 ? '#ffd23f' : '#fff'; ctx.fillText('P' + (s + 1), 8, th / 2 + 1);
      const hd = HEAD[lk ? k.id : S.karts[Math.floor(now / 70 + i * 2) % n].id]; if (hd) ctx.drawImage(hd, 42, (th - 32) / 2, 32, 32);   // vor dem Einrasten laufen die Köpfe durch
      const sub = !lk ? '' : k.me ? 'DU' : S.live ? (k.aiIdx !== undefined ? '🤖 Computer' : k.who ? NAME(k.who) : '') : '';
      ctx.font = '800 12px system-ui,sans-serif'; ctx.fillStyle = hi ? '#1a1a1a' : '#fff'; ctx.fillText(lk ? NAME(k.id) : '???', 80, sub ? th / 2 - 7 : th / 2, tw - 86);
      if (sub) { ctx.font = '800 10px system-ui,sans-serif'; ctx.fillStyle = hi ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.65)'; ctx.fillText(sub, 80, th / 2 + 8, tw - 86); }
      ctx.restore(); });
    if (!g.live) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 11px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('Antippen = überspringen', W / 2, H - 16); }
    ctx.restore(); }
  function newRace() {
    const LP = LIVE.race && LIVE.race.players ? LIVE.race.players.filter(pl => pl !== LIVE.me).map(pl => ({peer: pl, pr: ((LIVE.peers.find(p0 => p0.peer === pl) || {}).presence) || {}})) : null;
    const LAI = LP ? (LIVE.race.ai || []) : [], HOST = LP && LIVE.race.host === LIVE.me;
    const RND = LP && LIVE.race.rnd || {}, order = LP ? [me].concat(LP.map(x => (RND[x.peer] || [])[0] || x.pr.drv || x.pr.who || 'jonas'), LAI) : [me].concat(CREW.map(c => c.id).filter(id => id !== baseOf(me)).sort(() => Math.random() - .5));
    // Einzelrennen (Wunsch Patrick 08.10.): Gegner = bunter Zufallsmix aus allen Figuren (Crew, Ausnahmezustand, Serie, Gäste), je Person höchstens eine Fassung, nicht die eigene Person
    if (!LP && !CUP && MODE === 'single' && !TUTON) { const used = new Set([baseOf(me)]), pool = DRVS.filter(id => id !== me).sort(() => Math.random() - .5), mix = [];
      const rv0 = loadJ('kartRival')[me]; if (rv0 && DRVS.includes(rv0) && !used.has(baseOf(rv0))) { mix.push(rv0); used.add(baseOf(rv0)); }   // gespeicherter Rivale fährt immer mit
      for (const id of pool) { if (mix.length >= 5) break; if (used.has(baseOf(id))) continue; used.add(baseOf(id)); mix.push(id); }
      order.splice(1, order.length - 1, ...mix.sort(() => Math.random() - .5)); }
    // Startfeld: versetzte Zweierreihen mit Abstand; Startplätze werden ausgelost (gridSlots), live auf allen Handys gleich
    const SL = gridSlots(order, LP, LAI);
    const karts = order.map((id, k) => { const sl = SL[k], row = Math.floor(sl / 2), lat = (sl % 2 ? 1 : -1) * Math.min(42, TW * .26), i = N - 10 - row * 14 - (sl % 2) * 5, [x, y] = at(i, lat);
      const a = Math.atan2(P[(i + 1) % N][1] - P[i][1], P[(i + 1) % N][0] - P[i][0]);
      return {id, me: k === 0, slot: sl, x, y, a, mv: a, v: 0, steer: 0, idx: i, lat, lap: -1, half: true, done: 0, spin: 0, rot: 0, boost: 0, item: null, roll: 0, useAt: 0,
        skill: id === me ? 1 : rnd(DIFFS[DIFF].s[0], DIFFS[DIFF].s[1]), vr: 0, lost: 0, rumble: 0, squash: 0, lapT0: 0, lane: rnd(-35, 35), laneT: 0, say: null, sayT: 0, dust: 0, hold: 0, dr: 0, dt: 0, yaw: 0, air: 0, airT: 0, trick: 0, stall: 0, pad: 0, wet: 0, dol: 0, inv: 0, glow: 0, blind: 0, slowT: 0, slowE: '', bump: 0, cs: Object.assign({}, CS[id] || {spd: .5, hdl: .5, acc: .5, tgh: .5}), pf: k === 0 ? partsFx() : PF0, vt: VTUNE[id === me ? vehOf(id) : 'kart'] || VTUNE.kart, vtype: vehOf(id), vsz: VSZ[vehOf(id)] || (STY[id] || {}).vs || 1, voff: VOFF[vehOf(id)] || 1, fw: vehOf(id) === 'kart' && STYK(id) ? FWS[STYK(id)] || null : FW[vehOf(id)], vx: xvx(id, k === 0), brk: false, manual: null, peg: pegel(baseOf(id)),
        rocket: !LP && id !== me && !(PERS[id] || {}).noRocket && Math.random() < .45, remote: LP && k > 0 && (k <= LP.length || !HOST) ? 1 : 0, peer: LP && k > 0 ? (k <= LP.length ? LP[k - 1].peer : LIVE.race.host) : null, aiIdx: LP && k > LP.length ? k - LP.length - 1 : undefined, vkey: LP && k > 0 && k <= LP.length ? 'r:' + LP[k - 1].peer : null, who: LP && k > 0 && k <= LP.length ? LP[k - 1].pr.who : null, coins: 0, pp: PERS[id] || PERS0, misT: rnd(6, 14), misK: null, misD: 0, burstT: rnd(8, 18)}; });
    const boxes = [], bo = Math.round(Math.min(54, TW * .33)); (T.boxes || []).forEach(f => [-bo, 0, bo].forEach(l => {   /* Kisten weiter auseinander (vorher ±42), Wunsch Patrick 09.10. */ const i = Math.round(f * N); boxes.push({i, l, x: at(i, l)[0], y: at(i, l)[1], off: 0}); }));
    const obst = (T.obst || []).map(([f, l, kind]) => { const [x, y] = at(f * N, l); return {x, y, kind, r: OBR[kind] || 20}; });
    if (CUT) { const SQ = secretOf(), dx0 = CUT.b[0] - CUT.a[0], dy0 = CUT.b[1] - CUT.a[1], l0 = Math.hypot(dx0, dy0), nx0 = -dy0 / l0, ny0 = dx0 / l0;
      [[.3, -1], [.52, 1], [.74, -1]].forEach(([u, sd]) => obst.push({x: CUT.a[0] + dx0 * u + nx0 * sd * CUT.w * .24, y: CUT.a[1] + dy0 * u + ny0 * sd * CUT.w * .24, kind: SQ[1], r: 17, secret: 1})); }
    const birds = []; (T.birds || []).forEach(f => { const l0 = rnd(-40, 40); for (let j = 0; j < 5; j++) { const [x, y] = at(f * N + rnd(-4, 4), l0 + rnd(-22, 22)); birds.push({x0: x, y0: y, x, y, f: 0, vx: 0, vy: 0, a: rnd(0, TAU)}); } });
    const movers = []; (T.movers || []).forEach(m => { for (let j = 0; j < (m.n || 1); j++) movers.push({i: wrap(m.f * N + j * 14), l: rnd(-m.range, m.range), dir: Math.random() < .5 ? 1 : -1, range: m.range, speed: m.speed * rnd(.85, 1.15), kind: m.kind, say: 0, x: 0, y: 0}); });
    const puddles = (T.puddles || []).map(([f, l, r]) => { const [x, y] = at(f * N, l); return {x, y, r, r0: r}; });
    const gates = (T.gates || []).map(g => ({i: wrap(g.f * N), period: g.period, closed: g.closed, kind: g.kind, ph: rnd(0, g.period)}));
    const coinsT = []; [.13, .38, .63, .88].forEach((f, n) => { const l0 = [-40, 30, -20, 40][n]; for (let j = 0; j < 5; j++) { const i = wrap(f * N + j * 5), [x, y] = at(i, l0 + Math.sin(j) * 8); coinsT.push({x, y, off: 0}); } });
    let rival = loadJ('kartRival')[me]; const rp0 = pick(order.slice(1)); if (!rival || rival === me || !order.includes(rival)) rival = rp0;
    karts.forEach(k => { if (k.id === rival) k.skill = Math.max(k.skill, DIFFS[DIFF].s[1] + .005); }); HEADC = {};
    if (LP) LP.forEach(x => { const pr = x.pr, rr = RND[x.peer], id = rr ? rr[0] : pr.drv || pr.who || 'jonas', pt = rr ? {} : pr.paint || {}, pv = rr ? rr[1] : pr.veh; VEH['r:' + x.peer] = vehSprite(pt.c || (LOOK[id] || {}).shirt || '#00a651', T.veh === 'boat' ? 'boat' : (pv || 'kart'), Object.assign({}, pt, pr.parts || {}), id);
      const kk = karts.find(q => q.vkey === 'r:' + x.peer), vt0 = T.veh === 'boat' ? 'boat' : (pv || 'kart'); if (kk) { kk.vtype = vt0; kk.vsz = VSZ[vt0] || (vt0 === 'kart' && (STY[id] || {}).vs) || 1; kk.fw = vt0 === 'kart' && STYK(id) ? FWS[STYK(id)] || null : undefined; } });   // Mitspieler zeigen ihr gewähltes Fahrzeug (auch auf Ilha Grande)
    const dolphins = (T.dolphins || []).map(f => { const l = rnd(-40, 40), [x, y] = at(f * N, l); return {x, y, i: wrap(f * N), t: rnd(0, 3), cd: 0}; });
    S = {brk: makeBrk(), brkP: [], deb: [], storm: {at: T.id !== 'cristo' && Math.random() < .33 ? rnd(22, 40) : -1, f: 0, next: 0, pud: 0}, karts, boxes, obst, birds, movers, puddles, dolphins, gates, fwT: 1, cutSaid: -1, coins: coinsT, got: 0, myHits: 0, rival, rivalAhead: true, rivalSaid: 0, tu: tune(), oils: [], coatis: [], fx: [], sp: [], marks: [], fw: [], drops: [], t: -4.1, cd: 4, over: 0, slow: 0, press: null, leader: null, lastPlace: SL[0] + 1,
      lx: 0, lxMsg: null, rep: {laps: [], by: {}, vic: {}, hits: 0, items: 0, wall: 0, mini: 0, ov: 0, drT: 0, tT: 0, offT: 0, top: 0, leadT: 0, bestPl: 9, lap0: 0},
      cc: LP ? (CCS.includes(+((LIVE.race && LIVE.race.cfg) || {}).cc) ? +LIVE.race.cfg.cc : 150) : TUTON ? 150 : RNDR && RNDR.cc ? RNDR.cc : CC,
      wave: {next: rnd(9, 13), on: 0, warn: 0, h: 0}, flood: 0, hl: {}, flash: 0, supers: 0, rec: [], ghost: null, lapMsg: null, zoom: 1, camT: 0, camA: karts[0].a, camX: karts[0].x, camY: karts[0].y, shake: 0};
  }
  // Fahrzeug-Gefühl plus Masse des Fahrers (vollgefressen = schwer) und Baukasten-Teile (nur eigener Fahrer)
  // Zerstörbare Dinge am Streckenrand (Wunsch Patrick 08.10.): fahren lässt sie zerplatzen, Trümmer bremsen kurz die Hinterleute, nach 20 s stehen sie wieder
  const BRKK = {fruit: {e: ['🍉', '🍍', '🥭'], n: 'Obststand', deb: '🍉'}, chair: {e: ['🩴', '🧴'], n: 'Strandliege', deb: null, c: ['#ff5a3a', '#fff', '#1694b8']}, coco: {e: ['🥥'], n: 'Kokos-Pyramide', deb: '🥥'}, box: {e: ['📦'], n: 'Kisten', deb: null, c: ['#b5835a', '#d9b48a', '#8a5a2b']}};
  const BRKT = {serra: ['box', 'fruit', 'coco'], cataratas: ['fruit', 'coco', 'box'], costa: ['coco', 'fruit', 'chair'], riotour: ['coco', 'fruit', 'chair'], minhocao: ['box', 'fruit'], gru: ['box', 'fruit'], bridge: ['box'], manaus: ['box', 'fruit'], sp: ['fruit', 'box'], cristo: ['fruit', 'box'], paraty: ['fruit', 'box'], iguacu: ['fruit', 'coco'], ilha: ['coco', 'fruit', 'chair'], lopes: ['chair', 'coco', 'fruit'], guaruja: ['chair', 'coco', 'fruit'], copa: ['chair', 'coco', 'fruit'], reveillon: ['chair', 'coco']};
  function makeBrk() { if (T.veh === 'boat') return []; const ks0 = BRKT[T.id] || ['fruit', 'coco'], out = [], n = 12;
    for (let j = 0; j < n; j++) { const f = (j + .5) / n + rnd(-.015, .015), sd = Math.random() < .5 ? -1 : 1, kind = ks0[Math.floor(Math.random() * ks0.length)], [x, y] = at(wrap(f * N), sd * (TW / 2 - 16));
      out.push({x, y, kind, dead: -1, a: Math.atan2(P[(wrap(f * N) + 1) % N][1] - P[wrap(f * N)][1], P[(wrap(f * N) + 1) % N][0] - P[wrap(f * N)][0])}); } return out; }
  function brkBreak(b, k, fromNet) { const K = BRKK[b.kind]; b.dead = S.t; S.brkN = (S.brkN || 0) + 1;
    for (let j = 0; j < (K.c ? 14 : 9); j++) { const an = rnd(0, TAU), sp0 = rnd(80, 260), ki = k ? Math.atan2(Math.sin(k.a), Math.cos(k.a)) : an; S.brkP.push({x: b.x, y: b.y, vx: Math.cos(an) * sp0 * .6 + (k ? Math.cos(ki) * 140 : 0), vy: Math.sin(an) * sp0 * .6 + (k ? Math.sin(ki) * 140 : 0), r: rnd(0, TAU), vr: rnd(-12, 12), t: 0, e: K.c ? null : pick(K.e), c: K.c ? pick(K.c) : null}); }
    if (K.deb) for (let j = 0; j < 3; j++) { const an = (k ? k.a : 0) + rnd(-.8, .8), d = rnd(26, 70); S.deb.push({x: b.x + Math.cos(an) * d, y: b.y + Math.sin(an) * d, t: 5, e: K.deb}); }
    const nearMe = Math.hypot(b.x - S.karts[0].x, b.y - S.karts[0].y) < 500; if (nearMe) noise(.25, .14, b.kind === 'fruit' ? 900 : 300);
    if (k && !k.remote) { k.v *= k.vtype === 'trak' ? 1 : .9; if (k.me) { S.shake = Math.max(S.shake, .18); vib(18); S.myBrk = (S.myBrk || 0) + 1; floatTxt(k, '💥 ' + K.n + '!', '#ffb347'); if (S.myBrk === 1 || Math.random() < .25) { k.say = pick(['Ups!', 'Das zahlt Jonas!', 'Hat jemand was gesehen?', 'Kollateralschaden!']); k.sayT = 1.2; } } }
    if (k && !fromNet && S.live) liveEmit({t: 'brk', race: S.live.id, i: S.brk.indexOf(b)}); }
  const PF0 = {v: 1, g: 1, d: 1, m: 1, acc: 1, tgh: 0, off: 1, air: 1, land: 0, b: 1, bs: 1};
  const xvx = (id, mine) => { const v = Object.assign({}, VTX[vehOf(id)] || VTX.kart), X = XBY[id]; if (X && X.m) v.m *= X.m; if (mine) { const pp = partsFx(); v.g *= pp.g; v.d *= pp.d; v.m *= pp.m * (1 + tune().p * .05); v.b *= pp.b; } return v; };
  const gateShut = g => ((S.t + g.ph) % g.period) < g.closed;
  function progress(k) { return k.lap * N + k.idx; }
  function place(k) { return S.karts.filter(o => o !== k && (o.done ? (!k.done || o.done < k.done) : !k.done && progress(o) > progress(k))).length + 1; }
  function floatTxt(k, t, c) { S.fx.push({x: k.x, y: k.y, txt: t, col: c || '#ffd23f', t: 0}); }
  const HITSAY = {jogger: 'Jogger umgenietet! Sorry!', bike: 'Radfahrer! Wieso hier?!', skate: 'Skateboard unterm Kart!', car: 'Stau! Hupe kaputt?!', van: 'Lieferwagen im Weg!', stall: 'Melone im Gesicht!', uru: 'Vom Urubu gepickt!', squash: 'Plattgefahren wie ein Pfannkuchen!', banana: 'Auf der Bananenschale ausgerutscht!', bang: 'Böller! Meine Ohren!', trolley: 'Vom Servierwagen überrollt!', puke: 'Igitt, Kotze!', parade: 'In den Sambazug gekracht!', coco: 'Kokosnuss auf die Birne!', tug: 'Vom Gepäckwagen erwischt!', fork: 'Gabelstapler!', bus: 'Der Bus! Der Bus!', soccer: 'Ball an den Kopf!', crate: 'Container!', flip: 'Flip-Flop ins Gesicht!', fire: 'Heiß, heiß, heiß!', tram: 'Von der Straßenbahn erwischt!', moto: 'Motoboy!!', monkey: 'Der Affe hat mein Item geklaut!', cone: 'Baustelle!', champ: 'Sekt verschüttet!', gate: 'Schranke zu!', ball: 'Fernschuss ins Gesicht!', beer: 'Alles voller Schaum!', coati: 'Dieser Nasenbär!!', vendor: 'Ich wollte nur einen Caipi!', corn: 'Mein Mais!', caiman: 'Der Kaiman hat mich gebissen!', horse: 'Pferd hat Vorfahrt?!', dog: 'Guter Hund … AUA!', log: 'Baumstamm!', umbrella: 'Sonnenschirm-Treffer!', suitcase: 'Wessen Koffer ist das?!'};
  // Takedown (Burnout-Stil, Wunsch Patrick: mehr Spaß, schwarzer Humor): eigener Treffer mit Item = große Einblendung, Münze, Serien (Doppel/Dreifach)
  let HBY = null; const hitBy = (k, why, by) => { HBY = by; hit(k, why); HBY = null; };
  const TDTXT = ['💀 {n} ist raus. Blumen bitte an die Eltern.', '⚰️ {n} wurde fachgerecht entsorgt.', '🪦 {n}: gefahren, getroffen, vergessen.', '💥 Volltreffer! {n} sieht jetzt die Oma. Die tote.',
    '🩸 {n} braucht jetzt einen Priester.', '🚑 Für {n} kommt jede Hilfe zu spät.', '☠️ {n} hat das Rennen verlassen. Innerlich.', '🧹 {n} wird später zusammengekehrt.'];
  function takedown(v) { const t0 = S.t, td = S.td || (S.td = {n: 0, last: -9, chain: 0}); td.n++; if (S.rep && v) S.rep.vic[v.id] = (S.rep.vic[v.id] || 0) + 1; td.chain = t0 - td.last < 4 ? td.chain + 1 : 1; td.last = t0; addCoins(1);
    if (v && !v.me) { ach('td1'); if (td.chain >= 3) ach('td3'); } const big = ['', '💀 TAKEDOWN!', '💀💀 DOUBLE TAKEDOWN!', '💀💀💀 DREIFACH-MASSAKER!', '☠️ AMOKLAUF!'][Math.min(4, td.chain)];
    say('td_' + Math.min(4, td.chain), big, 1, 1); S.tdMsg = {t: big, sub: pick(TDTXT).replace(/\{n\}/g, NAME(v.id)), until: performance.now() + 1700}; if (td.chain >= 2) S.shake = Math.max(S.shake || 0, .3); vib(td.chain >= 2 ? [20, 30, 20, 30, 40] : 25); beep(td.chain >= 2 ? 1200 : 900, .12, 'square', .06, td.chain >= 2 ? 1800 : 1400); }
  // Kokos-Karren: Kokosnuss nach hinten (Hintermänner machen „Bonk“), auch im Live-Rennen; back < 0 = nach vorne, side = seitlich
  function cocoDrop(k, back, side) { const x = k.x - Math.cos(k.a) * back - Math.sin(k.a) * side, y = k.y - Math.sin(k.a) * back + Math.cos(k.a) * side; S.oils.push({x, y, t: 14, by: k, nut: 1}); if (S.live) liveEmit({t: 'oil', race: S.live.id, x: Math.round(x), y: Math.round(y), nut: 1}); }
  // Trio Elétrico: Bass-Stoß schleudert alle im Umkreis zur Seite (echte Mitspieler über „bump“)
  function bassPulse(k) { (S.rings || (S.rings = [])).push({x: k.x, y: k.y, t: 0});
    S.karts.forEach(o => { if (o === k || o.done || o.air > 0 || o.fall > 0) return; const dx = o.x - k.x, dy = o.y - k.y, d = Math.hypot(dx, dy) || 1; if (d > 175 || o.inv > 0) return; if (o.shield > 0) { o.shield = 0; floatTxt(o, '⛱️ geblockt'); return; } const pu = 34 * (1 - d / 200) + 8;
      if (o.remote) { if (S.live && o.aiIdx === undefined) liveEmit({t: 'bump', race: S.live.id, to: o.peer, nx: +(-dx / d).toFixed(2), ny: +(-dy / d).toFixed(2), p: 10}); return; }
      o.x += dx / d * pu; o.y += dy / d * pu; o.vr += (dx / d * -Math.sin(o.a) + dy / d * Math.cos(o.a)) * pu * 5; o.v *= .9; o.bump = .3; if (!o.sayT && Math.random() < .5) { o.say = pick(['Mein Trommelfell!', 'Zu laut!!', 'Wer hat den Bass aufgedreht?!', 'Axé-Attacke!']); o.sayT = 1.2; } });
    const m0 = S.karts[0]; if (Math.hypot(m0.x - k.x, m0.y - k.y) < 650) { beep(62, .32, 'sine', .3, 38); beep(124, .12, 'square', .05, 70); S.shake = Math.max(S.shake, k.me ? .12 : .2); } }
  function hit(k, why) {
    if (k.remote) { if (S.live && ['coati', 'ball', 'flip', 'fire', 'caiman', 'trolley', 'coco', 'bang', 'uru', 'bus', 'squash'].includes(why) && !k.hitT) { k.hitT = 1; setTimeout(() => { k.hitT = 0; }, 900); liveEmit({t: 'hit', race: S.live.id, to: k.peer, ai: k.aiIdx, why}); } return; }
    if (k.spin > 0 || k.air > 0 || k.inv > 0 || k.fall > 0) return; if (k.shield > 0 && why !== 'gate') { k.shield = 0; floatTxt(k, '⛱️ geblockt!', '#7fd3ff'); if (k.me) { beep(520, .1, 'triangle', .07); vib(15); } return; } S.hl[why] = (S.hl[why] || 0) + 1; if (HBY && HBY.me && !k.me && S.t > 0) takedown(k); if (k.me && S.rep) { S.rep.hits++; if (HBY && !HBY.me) S.rep.by[HBY.id] = (S.rep.by[HBY.id] || 0) + 1; } k.hitAt = S.t; k.hits = (k.hits || 0) + 1; k.hitE = pick(['😵', '🤕', '😱', '🥴', '😭', '🤬']); k.spin = .9 * Math.max(.45, 1.12 - (k.cs.tgh + (k.pf ? k.pf.tgh : 0)) * .3); k.vr += rnd(-60, 60); if (k.me) vib([30, 40, 30]); k.boost = 0; k.dr = 0; k.dt = 0; SFX.spin(); if (why === 'caiman') SFX.chomp(); if (k.id === 'erich') k.wut = 1;
    if (k.vtype === 'capi') k.spin *= .4; else if (k.vtype === 'rocket') k.spin *= 1.25; if (k.me && S.tu && S.tu.p) k.spin *= 1 - S.tu.p * .06; if (k.vtype === 'coco') { cocoDrop(k, -12, 24); cocoDrop(k, -12, -24); }   /* Capivara bleibt cool, Liegestuhl kippt länger, Kokos-Karren verliert Ladung */
    const l = LINES[k.id], l2 = l && l.length > 1 ? l.filter(x => x !== k.sayL) : l; k.say = (HITSAY[why] && HITSAY[why] !== k.sayL && Math.random() < .55) ? HITSAY[why] : l2 ? pick(l2) : 'Aua!'; k.sayL = k.say; k.sayT = 1.6;   // Sprechblase auch nicht zweimal gleich if (k.vtype === 'capi') k.say = pick(['Ganz ruhig.', 'Mir egal.', 'Capivara bleibt cool.', 'Chill mal.']);
    if (!k.me && Math.random() < (HBY && HBY.me ? .65 : .45) && Math.hypot(k.x - S.karts[0].x, k.y - S.karts[0].y) < 800) voice(k, 'hit');   // getroffene Gegner in Sichtweite schimpfen hörbar (auch untereinander)
    if (k.me) { S.myHits++; if (k.coins > 0) { const n = Math.min(S.tu && S.tu.p >= 3 ? 1 : 2, k.coins); k.coins -= n; S.got = Math.max(0, S.got - n); floatTxt(k, '−' + n + ' 🪙', '#ffb0b0'); } } else if (k.coins > 0) k.coins = Math.max(0, k.coins - 2); 
    if (k.me) { S.shake = .35; if (why === 'caiman') say('caiman', 'Vorsicht, Kaiman!'); else if (['oil', 'coati', 'ball', 'flip', 'fire', 'beer', 'coco', 'banana', 'bang', 'uru', 'bus', 'squash'].includes(why) && Math.random() < .9) voice(k, 'item'); else if (Math.random() < .8) voice(k, 'hit'); else if (Math.random() < .4) say('hit', 'Autsch, das tat weh!'); }
  }
  function rollItem(k, two) { if (S.live && S.live.cfg && S.live.cfg.items === 'turbo') return ITEMS.turbo; if (SPECIAL[k.id] && Math.random() < (k.me ? .22 : .32)) return SPECIAL[k.id]; /* Gegner etwas öfter mit Spezial-Item: mehr Chaos */ const pl = place(k), tb = IW[pl === 1 ? 'front' : pl <= 3 ? 'mid' : 'back'], one = () => { let r = Math.random(); for (const [kk, p0] of Object.entries(tb)) { r -= p0; if (r < 0) return ITEMS[kk]; } return ITEMS.turbo; };
    /* dieselbe Item-Familie nicht zweimal hintereinander (einmal neu ziehen); das 2. Item (Kombo-Platz) darf gleich sein, sonst gäbe es kaum Doppel-Kombos */ let it = one(); if (!two && ifam(it) === k.lastFam) it = one(); if (!two) k.lastFam = ifam(it); return it; }
  /* ---- Zufallsereignisse mitten im Rennen (im Live-Rennen über den gemeinsamen Zufall bei allen gleich) ---- */
  const EVK = [{k: 'police', e: '🚔', n: 'Polizeikontrolle', x: 'langsam!'}, {k: 'parade', e: '💃', n: 'Karnevalsumzug', x: 'Tänzer queren!'},
    {k: 'coco', e: '🥥', n: 'Kokosregen', x: 'Schatten meiden!'}, {k: 'blackout', e: '🔌', n: 'Stromausfall', x: 'alles dunkel!'}];
  function evStart() { const E0 = S.ev, ty = EVK[Math.floor(wr('ev') * EVK.length)], f = wr('ev'), c = {k: ty.k, ty, i: wrap(f * N), t0: S.t, end: S.t + (ty.k === 'coco' ? 7 : ty.k === 'blackout' ? 8 : 10)};
    if (ty.k === 'coco') { c.nuts = []; const base = f * N; for (let j = 0; j < 34; j++) { const ii = base + wr('ev') * N * .45, l = (wr('ev') - .5) * TW * .9, [x, y] = at(ii, l); c.nuts.push({x, y, t: S.t + .4 + j * .19, done: 0}); } }
    S.karts.forEach(k => { k.evP = k.idx; k.evRaser = !k.me && Math.random() < .3; });
    E0.cur = c; S.evBan = {t: ty.e + ' ' + ty.n + ': ' + ty.x, until: performance.now() + 3200};   /* nur diese eine Zeile, der Ansager spricht ohne eigene Textzeile */ beep(ty.k === 'police' ? 960 : 520, .18, 'square', .06); if (ty.k === 'police') setTimeout(() => beep(720, .18, 'square', .06), 200);
    say('ev_' + ty.k, '', 0, 1); }
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
  function hymn(id) { id = baseOf(id); const a = audio(); if (!a || !FXG) return; const t0 = a.currentTime + .05, out = a.createGain(); out.gain.value = .5; out.connect(FXG);
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
  // Absturz: 1,1 s fallen (kleiner, dreht, blasser), dann bringt der Retter das Kart 1,4 s lang von oben zurück auf die Strecke
  function fallStart(k) { k.falls = (k.falls || 0) + 1; k.fall = .001; k.fallI = k.idx; k.dr = 0; k.dt = 0; k.boost = 0; k.str = 0; k.spin = 0; k.resc = 0; S.hl.fall = (S.hl.fall || 0) + 1; if (k.me) { const fi = Math.floor(Math.random() * 5); say('fall_' + fi, ['🪦 Ruhe in Frieden … ach nein, der Retter kommt.', '☠️ Kurz tot, gleich weiter.', '🚑 Die Versicherung zahlt das nicht.', '⚰️ Der Bestatter war schon unterwegs.', '🙏 Die Crew betet, aber nur halbherzig.'][fi], 1); } k.say = pick(['Neeeiiin!', 'Hilfeee!', 'Mamãe!', 'Das war\'s …', 'Sagt Mama, ich hab sie lieb!', 'Ich seh das Licht!', 'Mein Testament liegt im Handschuhfach!', 'Nicht heute, Tod!', 'Wer kriegt meine Playstation?']); k.sayT = 1.4;
    if (k.me) { say('fall', FALL.t); floatTxt(k, '😱 ' + FALL.t, '#ff8a8a'); beep(900, 1, 'sine', .07, 140); vib([20, 60, 20]); S.falls = (S.falls || 0) + 1; } }
  function fallStep(k, dt) { k.fall += dt;
    if (k.fall < 1.1) { k.x += Math.cos(k.mv) * k.v * dt * .55; k.y += Math.sin(k.mv) * k.v * dt * .55; k.v *= Math.exp(-dt * 1.5); k.rot += dt * 7;
      if (k.fall > .95 && !k.splash) { k.splash = 1; if (FALL.w) { for (let j = 0; j < 14; j++) S.sp.push({x: k.x + rnd(-10, 10), y: k.y + rnd(-10, 10), vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: 'rgba(220,245,255,.9)', big: 1}); if (k.me) SFX.splash(); } else if (k.me) noise(.2, .12, 0, 0, 0, 200); } }
    else if (!k.resc) { k.resc = 1; k.splash = 0; const i = wrap(k.fallI - 6), [x, y] = at(i, 0); k.x = x; k.y = y; k.idx = i; k.lat = 0; k.a = k.mv = Math.atan2(P[wrap(i + 1)][1] - P[i][1], P[wrap(i + 1)][0] - P[i][0]); k.rot = 0; k.v = 0; k.vr = 0; k.kx = k.ky = 0; if (k.me) { S.fade = .45; floatTxt(k, FALL.e + ' ' + FALL.n + ' kommt!', '#fff'); } }
    if (k.fall >= 2.5) { k.fall = 0; k.resc = 0; k.inv = Math.max(k.inv, 1); k.v = 50; k.lost = 0; if (k.me) beep(660, .12, 'triangle', .06, 990); }
    if (k.sayT > 0) k.sayT -= dt; }
  function useItem(k) {
    if (!k.item || k.roll > 0 || S.t < 0 || k.icd > 0) return; const it = k.item; if (k.me && S.rep) S.rep.items++;
    if (it.cnt && icnt(k) > 1) { k.icnt--; k.icd = .28; if (!k.me) k.useAt = rnd(.6, 1.8) * (k.pp ? k.pp.item : 1); }   // Mehrfach-Item: eins verbrauchen, Rest bleibt
    else { k.item = null; k.icntFor = null; }
    if (k.item === null && k.me && k.item2) { const it2 = k.item2, ck = comboKey(it, it2); k.item2 = null; if (COMBOS[ck]) { const snap0 = S.live ? S.karts.filter(o => o.remote).map(o => [o, o.slowT, o.blind, o.parrot || 0]) : []; useCombo(k, ck); return; } k.item = it2; }
    const snap = S.live ? S.karts.filter(o => o.remote).map(o => [o, o.slowT, o.blind, o.parrot || 0, o.kiss || 0, o.zap || 0, o.acai || 0]) : [];
    const nOil = S.oils.length; useItem0(k, it);
    snap.forEach(([o, a0, b0, c0, d0, e0, g0]) => { const f = {}; if (o.slowT > a0) { f.slowT = o.slowT; f.slowE = o.slowE; } if (o.blind > b0) f.blind = o.blind; if ((o.parrot || 0) > c0) f.parrot = o.parrot; if ((o.kiss || 0) > d0) f.kiss = o.kiss; if ((o.zap || 0) > e0) { f.zap = o.zap; f.zapOn = 0; } if ((o.acai || 0) > g0) f.acai = o.acai; if (Object.keys(f).length) liveEmit({t: 'fx', race: S.live.id, to: o.peer, ai: o.aiIdx, f}); });
    if (S.live) S.oils.slice(nOil).forEach(o => liveEmit({t: 'oil', race: S.live.id, x: Math.round(o.x), y: Math.round(o.y), beer: o.beer ? 1 : 0, stink: o.stink ? 1 : 0, puke: o.puke ? 1 : 0, banana: o.banana ? 1 : 0, bang: o.bang ? 1 : 0}));
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
    // Mehrfach-Items
    const n0 = k.item === it ? icnt(k) : 0, nn = it.cnt ? ' ' + (it.cnt - n0) + '/' + it.cnt : '';
    if (it.k === 'turbo3') { k.boost = Math.max(k.boost, 1.25); if (k.me) SFX.turbo(); floatTxt(k, '🍹 Prost!' + nn); }
    if (it.k === 'flip2') { S.coatis.push({i: k.idx + 5, l: k.lat, tgt: null, t: 3.2, by: k, x: k.x, y: k.y, flip: 1}); SFX.throw(); }
    if (it.k === 'coco3') { const ahead = S.karts.filter(o => o !== k && !o.done && progress(o) > progress(k) && progress(o) - progress(k) < 260).sort((a, b) => progress(a) - progress(b))[0];
      S.coatis.push({i: k.idx + 5, l: k.lat, tgt: ahead || null, t: 3.5, by: k, x: k.x, y: k.y, coco: 1}); SFX.throw(); }
    if (it.k === 'banana3') { const [x, y] = [k.x - Math.cos(k.a) * 36, k.y - Math.sin(k.a) * 36]; S.oils.push({x, y, t: 16, by: k, banana: 1}); SFX.oil(); }
    if (it.k === 'boller3') { const [x, y] = [k.x - Math.cos(k.a) * 34, k.y - Math.sin(k.a) * 34]; S.oils.push({x, y, t: 3, by: k, bang: .9}); beep(1400, .05, 'square', .04, 900); }
    if (it.k === 'shield') { k.shield = 8; floatTxt(k, '⛱️ Schirm auf!', '#7fd3ff'); if (k.me) SFX.pick(); }
    if (it.k === 'uru') { const ld = S.karts.filter(o => o !== k && !o.done).sort((a, b) => progress(b) - progress(a))[0];   // Urubu: fliegt über alle hinweg auf den Führenden (bist du vorne, auf den Zweiten)
      S.coatis.push({i: k.idx + 6, l: k.lat, tgt: ld || null, t: 8, by: k, x: k.x, y: k.y, golf: 1, uru: 1}); floatTxt(k, '🦅 Urubu, hol ihn dir!', '#ffd23f'); beep(380, .25, 'sawtooth', .05, 900); if (ld && ld.me) say('uru', 'Ein Urubu kreist über dir!'); }
    if (it.k === 'blitz') { S.flash = Math.max(S.flash, k.me ? .3 : .55); noise(1.6, .22, 0, 0, 0, 90); floatTxt(k, '⚡ Cristo-Blitz!', '#fff7a8');   // alle anderen schrumpfen, werden langsamer und verlieren ihr Item; wer vor dir ist, länger
      S.karts.forEach(o => { if (o === k || o.done || o.inv > 0) return; if (o.shield > 0) { o.shield = 0; floatTxt(o, '⛱️ geblockt'); return; } o.zap = progress(o) > progress(k) ? 4 : 2.6; o.zapOn = 0; }); }
    if (it.k === 'acai') { floatTxt(k, '🫐 Açaí-Bombe!', '#c9a0ff'); noise(.35, .14, 600);   // alle vor dir: Matsch auf der Scheibe (Spieler: Bildschirm, Gegner: eiern)
      S.karts.forEach(o => { if (o === k || o.done || o.inv > 0 || progress(o) <= progress(k) || progress(o) - progress(k) > 700) return; if (o.shield > 0) { o.shield = 0; floatTxt(o, '⛱️ geblockt'); return; } o.acai = 4; o.say = pick(['Ich seh nix!', 'Wer hat mit Açaí geworfen?!', 'Lila! Alles lila!']); o.sayT = 1.3; }); }
    if (it.k === 'bus') { k.bus = 4.5; k.inv = Math.max(k.inv, 4.6); k.dr = 0; floatTxt(k, '🚌 Ônibus-Express!', '#ffd23f'); if (k.me) { SFX.turbo(); vib(40); say('bus', 'Der Ônibus kommt! Aus dem Weg!'); } beep(330, .35, 'square', .07); setTimeout(() => beep(262, .45, 'square', .07), 380); }
    // Spezial-Items
    const near0 = Math.hypot(k.x - S.karts[0].x, k.y - S.karts[0].y) < 700;
    if (SPECIAL[k.id] && it === SPECIAL[k.id]) { if (k.me || near0) voice(k, 'sp'); floatTxt(k, it.e + ' ' + it.n + '!', '#fff'); }
    if (it.k === 'bill') { S.karts.forEach(o => { if (o !== k && !o.done && progress(o) > progress(k) && o.inv <= 0) { o.slowT = 1.4; o.slowE = '🧾'; o.say = 'Zahlungserinnerung?!'; o.sayT = 1.4; } }); beep(880, .1, 'square', .06); setTimeout(() => beep(660, .2, 'square', .06), 110); }
    if (it.k === 'burn') { k.glow = 2; S.karts.forEach(o => { if (o !== k && o.inv <= 0 && Math.hypot(o.x - k.x, o.y - k.y) < 260) { o.blind = Math.max(o.blind || 0, .9); if (o.me) S.flash = .55; } });   /* abgeschwächt 10.10. (vorher 1,3 s, Umkreis 280) */ noise(.5, .12, 300); }
    if (it.k === 'wheel') { k.boost = Math.max(k.boost, 2.3); k.inv = 2.3; SFX.turbo(); }
    if (it.k === 'golf') { const ld = S.karts.filter(o => o !== k && !o.done).sort((a, b) => progress(b) - progress(a))[0];
      S.coatis.push({i: k.idx + 6, l: k.lat, tgt: ld || null, t: 7, by: k, x: k.x, y: k.y, ball: 1, golf: 1}); floatTxt(k, '⛳ FORE!', '#9dffb4'); real('kick', .5) || beep(520, .08, 'triangle', .08, 900); }
    if (it.k === 'ball') { const ahead = S.karts.filter(o => o !== k && !o.done && progress(o) > progress(k)).sort((a, b) => progress(a) - progress(b))[0];
      S.coatis.push({i: k.idx + 6, l: k.lat, tgt: ahead || null, t: 9, by: k, x: k.x, y: k.y, ball: 1}); real('kick', .6) || beep(300, .15, 'square', .08, 120); }
    if (it.k === 'beer') { const [x, y] = [k.x - Math.cos(k.a) * 46, k.y - Math.sin(k.a) * 46]; S.oils.push({x, y, t: 8, by: k, beer: 1}); real('splash', .4); }
    // Spezial-Items der Zusatz-Fahrer
    const nearK = (r, f) => S.karts.filter(o => o !== k && !o.done && o.inv <= 0 && Math.hypot(o.x - k.x, o.y - k.y) < r && (!f || f(o)));
    const shielded = o => { if (o.shield > 0) { o.shield = 0; floatTxt(o, '⛱️ geblockt'); return true; } return false; };
    if (it.k === 'kiss') { nearK(280).forEach(o => { if (shielded(o)) return; o.kiss = 1.1;   /* abgeschwächt 10.10. (vorher 1,8 s, Umkreis 320) */ o.say = pick(['Verknallt!', 'Ich bin verliebt …', 'Was für ein Kuss!']); o.sayT = 1.3; }); floatTxt(k, '💋 Muah!', '#ff5fa2'); beep(1300, .12, 'sine', .06, 700); }
    if (it.k === 'burp') { nearK(220).forEach(o => { if (shielded(o)) return; const dx = o.x - k.x, dy = o.y - k.y, d = Math.hypot(dx, dy) || 1, pu = 46 * (1 - d / 260) + 10; if (o.remote) { if (S.live && o.aiIdx === undefined) liveEmit({t: 'bump', race: S.live.id, to: o.peer, nx: -dx / d, ny: -dy / d, p: 12}); } else { o.x += dx / d * pu; o.y += dy / d * pu; o.vr += (dx / d * -Math.sin(o.a) + dy / d * Math.cos(o.a)) * pu * 4; } o.slowT = .9; o.slowE = '🤢'; o.say = 'Was hast du gegessen?!'; o.sayT = 1.2; });
      if (k.me || Math.hypot(k.x - S.karts[0].x, k.y - S.karts[0].y) < 300) S.shake = Math.max(S.shake, .4); noise(.6, .2, 140); for (let j = 0; j < 16; j++) { const an = j / 16 * TAU; S.fx.push({x: k.x + Math.cos(an) * 30, y: k.y + Math.sin(an) * 30, dust: 1, t: 0, c: '150,200,90'}); } }
    if (it.k === 'stink') { const [x, y] = [k.x - Math.cos(k.a) * 50, k.y - Math.sin(k.a) * 50]; S.oils.push({x, y, t: 9, by: k, stink: 1}); noise(.7, .12, 90); }
    if (it.k === 'puke') { [40, 80, 120].forEach(dd => S.oils.push({x: k.x - Math.cos(k.a) * dd + rnd(-14, 14), y: k.y - Math.sin(k.a) * dd + rnd(-14, 14), t: 12, by: k, puke: 1})); noise(.4, .15, 400); }
    if (it.k === 'disco') { k.glow = 2.5; nearK(340).forEach(o => { if (shielded(o)) return; o.blind = 2; if (o.me) S.flash = .9; }); beep(660, .1, 'square', .05); setTimeout(() => beep(880, .1, 'square', .05), 120); }
    if (it.k === 'meter') { S.karts.forEach(o => { if (o !== k && !o.done && progress(o) > progress(k) && progress(o) - progress(k) < 260 && o.inv <= 0) { o.slowT = 1.3; o.slowE = '🚖'; o.say = 'Was, so teuer?!'; o.sayT = 1.3; } }); beep(990, .08, 'square', .05); setTimeout(() => beep(990, .08, 'square', .05), 140); }
    if (it.k === 'steal') { const ah = S.karts.filter(o => o !== k && !o.done && progress(o) > progress(k)).sort((a, b) => progress(a) - progress(b))[0];
      if (ah && !shielded(ah)) { if (ah.item && !ah.remote) { k.item = ah.item; ah.item = null; floatTxt(k, '🦝 ' + k.item.e + ' geklaut!'); } ah.slowT = .9; ah.slowE = '🦝'; ah.say = 'Mein Item!'; ah.sayT = 1.3; } SFX.throw(); }
    if (it.k === 'ticket') { nearK(330).forEach(o => { if (shielded(o)) return; o.slowT = 1.7; o.slowE = '🛂'; o.say = 'Ich hab nichts dabei!'; o.sayT = 1.3; }); beep(960, .18, 'square', .06); setTimeout(() => beep(720, .18, 'square', .06), 200); }
    if (it.k === 'caiman') { const ah = S.karts.filter(o => o !== k && !o.done && progress(o) > progress(k)).sort((a, b) => progress(a) - progress(b))[0];
      S.coatis.push({i: k.idx + 6, l: k.lat, tgt: ah || null, t: 6, by: k, x: k.x, y: k.y, cai: 1}); SFX.throw(); }
    if (it.k === 'trolley') { S.coatis.push({i: k.idx + 5, l: k.lat, tgt: null, t: 3.6, by: k, x: k.x, y: k.y, flip: 1, tro: 1}); SFX.throw(); }
    if (it.k === 'grant') { nearK(340).forEach(o => { if (shielded(o)) return; const own = ['jonas', 'greisel', 'marco'].includes(baseOf(o.id)); o.slowT = own ? 2.2 : 1.4; o.slowE = '💢'; o.parrot = Math.max(o.parrot || 0, own ? 1.4 : .8);
      o.say = own ? pick(['Ja, Erich …', 'Sorry, Erich!', 'Wir laufen ja schon!']) : pick(['Was hat der denn?!', 'Ist ja gut!', 'Reg di ab, Erich!']); o.sayT = 1.4; }); floatTxt(k, '📢 KABINENPREDIGT!', '#ff6b6b'); beep(170, .4, 'sawtooth', .07, 110); if (k.me) vib(40); }
    if (it.k === 'polo') { nearK(360).forEach(o => { if (shielded(o)) return; const own = ['jonas', 'greisel', 'marco'].includes(baseOf(o.id));
        if (own && !o.remote) { o.boost = Math.max(o.boost, .8); o.say = pick(['Polonaise!', 'Ich bin dabei, Rasmus!', 'Party!']); } else if (!own) { o.slowT = 1.3; o.slowE = '💃'; o.say = pick(['Ich muss mittanzen!', 'Polonaise Blankenese!', 'Nicht schon wieder!']); } o.sayT = 1.4; });
      k.boost = Math.max(k.boost, 1.2); floatTxt(k, '💃 POLONAISE!', '#c79bf0'); if (k.me) SFX.turbo(); [523, 659, 784].forEach((f, j) => setTimeout(() => beep(f, .12, 'square', .05), j * 110)); }
    if (it.k === 'taco') { k.boost = Math.max(k.boost, 2.2); k.fire = 2.2; nearK(270).forEach(o => { if (shielded(o)) return; o.blind = Math.max(o.blind || 0, 1.1); o.say = pick(['Meine Augen!', 'Zu scharf!', 'Wasser! Wasser!', 'Ohne Zwiebeln, bitte!']); o.sayT = 1.3; if (o.me) S.flash = .6; });
      floatTxt(k, '🌮 SCHARF MIT ALLES!', '#ff8a2a'); if (k.me) { SFX.turbo(); vib(30); } }
    if (it.k === 'mum') { k.boost = Math.max(k.boost, 1.9); const [sx, sy] = [k.x - Math.cos(k.a) * 55, k.y - Math.sin(k.a) * 55]; S.oils.push({x: sx, y: sy, t: 9, by: k, stink: 1});   // Qualm-Taxi: Turbo, Qualmwolke hinten, Husten ringsum, Patrick wird abgeholt
      nearK(260).forEach(o => { if (shielded(o)) return; o.blind = Math.max(o.blind || 0, .9); o.say = pick(['*hust* *hust*', 'Mach das Fenster auf!', 'Ich seh nix!', 'Rauchen kann tödlich sein!']); o.sayT = 1.3; if (o.me) S.flash = .35; });
      S.karts.forEach(o => { if (o !== k && baseOf(o.id) === 'patrick' && !o.remote && !o.done) { o.boost = Math.max(o.boost, 1.1); o.say = pick(['Danke, Mama!', 'Mama holt mich ab!', 'Mama, nicht vor allen!']); o.sayT = 1.5; } });
      floatTxt(k, '🚬 QUALM-TAXI!', '#d8c8ff'); noise(.7, .12, 90); if (k.me) { SFX.turbo(); vib(25); } }
    if (it.k === 'mini') { k.mini = 4; k.inv = Math.max(k.inv, 4); k.boost = Math.max(k.boost, 1.1); if (!k.vsz0) k.vsz0 = k.vsz || 1; k.vsz = k.vsz0 * .55; floatTxt(k, '🤏 Wo ist er hin?', '#ffd23f'); if (k.me) SFX.turbo(); }
    if (it.k === 'chomp') { nearK(90).forEach(o => { if (!o.air) hitBy(o, 'caiman', k); }); SFX.chomp(); }
    if (it.k === 'snack') { k.boost = Math.max(k.boost, .8); S.karts.forEach(o => { if (o !== k && !o.done && progress(o) < progress(k) && progress(k) - progress(o) < 110 && o.inv <= 0) { o.slowT = 1.2; o.slowE = '🥟'; o.say = 'Mmmh, Snacks!'; o.sayT = 1.2; } }); }
  }
  const INPUT = {L: false, R: false, keys: {}, ax: null, brake: false, drift: false, dtap: null};
  const anyInput = () => INPUT.L || INPUT.R || INPUT.keys.ArrowLeft || INPUT.keys.ArrowRight || INPUT.keys.a || INPUT.keys.d;
  /* Strecken-Vorschau (Wunsch Patrick 09.10. spät, Idee 5): vor dem Countdown fliegt die Kamera eine Runde über die Strecke (wie im TV), mit Name, Bestzeit,
     Runden/Richtung/Klasse und Hinweisen an den Stellen (Tunnel, Brücke, Berg, Kuppe, Schanze, Schranke, Schleichweg, Welle …). Antippen = überspringen.
     Nur Einzelrennen/Grand Prix, je Strecke einmal pro Sitzung (INTROSEEN), Schalter in den Einstellungen (SET.intro). */
  let INTROSEEN = {};
  const introU = t => { const u = clamp((t - .9) / 5.3, 0, 1); return u * u * (3 - 2 * u); }, introZoom = t => t < .9 ? 1 - .45 * clamp(t / .9, 0, 1) : t > 6.2 ? .55 + .45 * clamp((t - 6.2) / .8, 0, 1) : .55;
  function introMake() { const i0 = S.karts[0].idx, mk = [], add = (i, e, t0) => mk.push({u: wrap(Math.round(i) - i0) / N, e, t: t0});
    TUN.forEach(q => add(q.i0, '🚇', q.nm || 'Tunnel'));
    BRG.forEach(q => add(q.i0, '🌉', q.nm || 'Brücke'));
    HILLS.forEach(q => { const up0 = Math.max(1, Math.round(q.len * q.r)), pct = Math.round(q.h * Math.PI / (2 * up0) * 900); add(q.i0 + up0 * .5, '⛰️', (q.o.n || 'Berg') + ' · ' + pct + ' % Steigung'); });
    CRESTS.forEach(i => add(i - 10, '🛫', 'Kuppe: hier hebst du ab!'));
    if (RAMP >= 0) add(RAMP - 10, '🛫', 'Schanze: in der Luft tippen = Trick');
    if (CUT && SECRET[T.id] && T.cut !== false) add(CUT.i1 - 6, '🤫', 'Schleichweg: ' + secretOf()[0]);
    (S.gates || []).forEach(g => add(g.i - 10, '🚧', g.kind === 'train' ? 'Bahnschranke: wenn zu, anhalten!' : 'Mautschranke: wenn zu, anhalten!'));
    (T.belts || []).forEach(b => add(b[0] * N, '🧳', b[2] > 0 ? 'Gepäckband: mitfahren = schneller' : 'Gepäckband gegen dich: langsamer'));
    if (DECK) add(DECK.i0 + 20, '🛣️', 'Hochstraße über die Kreuzung');
    if (T.wave) { const cx = (T.wave.x0 + T.wave.x1) / 2; add(nearest(cx, shore(cx) - 90, -1)[0] - 20, '🌊', 'Hier schwappt die Welle über die Straße'); }
    if (S.dolphins.length) add(S.dolphins[0].i - 10, '🐬', 'Delfine: durchfahren = Turbo');
    const MVN = {vendor: 'Caipi-Verkäufer läuft quer', corn: 'Maisverkäufer auf der Strecke', coati: 'Nasenbären! Nicht anfahren', caiman: 'Kaimane im Fluss', horse: 'Pferdekutsche hat Vorfahrt', dog: 'Streunende Hunde', tram: 'Straßenbahn kreuzt', moto: 'Motoboys drängeln', monkey: 'Affen klauen dein Item!', tug: 'Gepäckschlepper', fork: 'Gabelstapler', bus: 'Bus auf der Brücke', soccer: 'Fußball fliegt quer'}, mvs = {};
    S.movers.forEach(m => { if (mvs[m.kind] || !MVN[m.kind]) return; mvs[m.kind] = 1; add(m.i - 12, MVE[m.kind] || '⚠️', MVN[m.kind]); });
    if (T.wind) add(i0 + N * .03, '💨', 'Seitenwind-Böen: gegenlenken!'); if (T.rain) add(i0 + N * .02, '🌧️', 'Regen: rutschig, früh bremsen'); if (T.fog) add(i0 + N * .02, '🌫️', 'Nebel: Kurven kommen plötzlich');
    mk.sort((a, b) => a.u - b.u); const out = []; mk.forEach(m => { if (!out.length || m.u - out[out.length - 1].u > .045) out.push(m); });   // zu dicht beieinander: nur der erste
    return {t: 0, dur: T.long ? 10 : 7, i0, mk: out}; }
  function introHud() { const it = S.intro, t = it.t, now = performance.now(), fin = clamp((it.dur - t) / .6, 0, 1), inA = clamp(t / .5, 0, 1), a = Math.min(inA, fin), lb = 54 * a;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb);   // Kino-Balken
    const nr = TRACKS.findIndex(x => x.id === T.id) + 1, r0 = lbList(LB, T.id)[0], bt0 = best()[tkey(T.id)], cc = S.cc || 150, tf = tkeyInfo();
    // Titel unten links
    const x0 = 18, y0 = H - lb - 112; ctx.globalAlpha = a; { const g = ctx.createLinearGradient(0, y0 - 40, 0, H - lb); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.35, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,.78)'); ctx.fillStyle = g; ctx.fillRect(0, y0 - 40, W, H - lb - y0 + 40); }   // dunkler Verlauf hinter dem Titel
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 8;
    ctx.font = '900 12px system-ui,sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText((CUP ? CUP.e + ' ' + CUP.n + ' · Rennen ' + (CUP.i + 1) + '/' + CUP.list.length : 'Strecke ' + nr + ' von ' + TRACKS.length).toUpperCase(), x0, y0, W - 36);
    ctx.font = 'italic 900 34px system-ui,sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(T.e + ' ' + T.name.toUpperCase(), x0, y0 + 36, W - 36);
    ctx.font = '700 13px system-ui,sans-serif'; ctx.fillStyle = '#d6e6f5'; ctx.fillText(T.sub || '', x0, y0 + 56, W - 36);
    ctx.font = '800 12px system-ui,sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(tf, x0, y0 + 76, W - 36);
    ctx.fillStyle = '#ffd23f'; ctx.fillText(r0 ? '👑 Bestzeit ' + fmt(r0.ms) + ' · ' + NAME(r0.who) + (bt0 ? ' · ⏱ deine ' + fmt(bt0) : '') : '👑 Bestzeit noch frei: hol sie dir!', x0, y0 + 96, W - 36);
    // Hinweis an der aktuellen Stelle (oben, unter dem Balken)
    const u = introU(t); let cur = null; it.mk.forEach(m => { if (u >= m.u - .005 && u < m.u + .07) cur = m; });
    if (cur && t > .9 && t < 6.3) { const ca = clamp(Math.min((u - cur.u + .005) / .015, (cur.u + .07 - u) / .015), 0, 1); ctx.globalAlpha = a * ca; ctx.shadowBlur = 0; ctx.font = '800 15px system-ui,sans-serif'; const tw0 = Math.min(W - 36, ctx.measureText(cur.e + '  ' + cur.t).width + 28), y1 = lb + 22;
      ctx.beginPath(); ctx.roundRect(W / 2 - tw0 / 2, y1, tw0, 36, 18); ctx.fillStyle = 'rgba(8,18,38,.88)'; ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cur.e + '  ' + cur.t, W / 2, y1 + 18, tw0 - 20); }
    // Fortschritt + Überspringen
    ctx.globalAlpha = a; ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 11px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('Antippen = überspringen', W / 2, H - lb / 2);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(18, H - lb - 6, W - 36, 3); ctx.fillStyle = '#ffd23f'; ctx.fillRect(18, H - lb - 6, (W - 36) * u, 3);
    ctx.restore(); }
  const tkeyInfo = () => { const lp = LAPS, chips = [lp + (lp === 1 ? ' Runde' : ' Runden'), T.id === 'minhocao' ? '∞ Acht' : CWT[T.id] ? '↻ rechtsherum' : '↺ linksherum', CCE[S.cc || 150] + ' ' + CCN[S.cc || 150]];
    if (FALL) chips.push('⚠️ Abgrund: keine Bande'); if (LAPX[T.id] && LAPS > 1) chips.push('🔁 Strecke ändert sich'); return chips.join(' · '); };
  // Strecke ändert sich je Runde (LAPX): Stufe auslösen, sobald der Führende die Runde erreicht; herabfallende Hindernisse landen nach 0,7 s mit Staub
  function lapxStep() { const L = LAPX[T.id]; if (!L || S.tut || S.t <= 0) return; const lead = Math.max(...S.karts.map(k => k.lap));
    while (S.lx < L.length) { const st = L[S.lx], li = st.r === 'last' ? LAPS - 1 : Math.min(st.r - 1, LAPS - 1); if (li < 1) { S.lx++; continue; } if (lead < li) break; S.lx++; lapxApply(st, li); }
    if (S.lxDrop) S.obst.forEach(o => { if (o.drop === undefined || o.landed || S.t - o.drop < .7) return; o.landed = 1; for (let j = 0; j < 8; j++) S.fx.push({x: o.x + rnd(-14, 14), y: o.y + rnd(-14, 14), dust: 1, t: 0, c: '210,190,160'});
      const m0 = S.karts[0]; if (Math.hypot(m0.x - o.x, m0.y - o.y) < 520) { S.shake = Math.max(S.shake, .1); noise(.12, .09, 0, 0, 0, 160); } }); }
  function lapxApply(st, li) {
    if (st.tod && st.alt) { const tg = SET.tod === 'day' && st.tod === 'night' ? 'dusk' : st.tod; if (T.night || S.tod === tg || S.tod === 'night') st = st.alt; }   // ist es schon so dunkel, passiert stattdessen etwas anderes
    if (st.obst) { S.lxDrop = 1; st.obst.forEach(([f, l, kind]) => { const i = wrap(f * N), l2 = kind === 'car' || kind === 'van' ? l : Math.abs(l) * (LINE[i] > 0 ? -1 : 1), [x, y] = at(i, l2); S.obst.push({x, y, kind, r: OBR[kind] || 20, drop: S.t}); }); }   // fallende Dinge landen neben der Ideallinie (Stau-Autos bleiben auf ihrer Spur)
    if (st.mov) st.mov.forEach(([f, kind, range, speed]) => S.movers.push({i: wrap(f * N), l: -range, dir: 1, range, speed, kind, say: 1.5, x: 0, y: 0}));
    if (st.pud) st.pud.forEach(([f, l, r]) => { const [x, y] = at(f * N, l); S.puddles.push({x, y, r, r0: r}); });
    if (st.dol) st.dol.forEach(f => { const [x, y] = at(f * N, 0); S.dolphins.push({x, y, i: wrap(f * N), t: 0, cd: 0}); });
    if (st.tod) S.tod = SET.tod === 'day' && st.tod === 'night' ? 'dusk' : st.tod;   // „immer Tag“ eingestellt: höchstens Abenddämmerung
    if (st.rain) S.rainX = st.rain; if (st.wave && S.wave) { S.waveEvery = st.wave; S.wave.next = Math.min(S.wave.next, st.wave[0]); } if (st.wh) S.waveH = st.wh;
    if (st.belt) S.beltX = st.belt; if (st.fog) S.fogX = st.fog; if (st.wind) S.windEvery = st.wind; if (st.flood) S.floodX = st.flood; if (st.fw) S.fwX = st.fw;
    const nw = performance.now(); if (S.lxMsg && nw - S.lxMsg.t0 < 600) { S.lxMsg.more = st.e + ' ' + st.t; S.lxMsg.until = nw + 4200; } else S.lxMsg = {e: st.e, t: st.t, last: li === LAPS - 1, n: li + 1, t0: nw, until: nw + 3400}; (S.lxLog || (S.lxLog = [])).push(st.e + ' ' + st.t);   // zwei Stufen gleichzeitig (z. B. live mit 2 Runden): beide zeigen
    beep(660, .12, 'square', .05, 990); setTimeout(() => beep(880, .16, 'square', .05, 1320), 140); vib([20, 40, 20]); }
  let CCF = 1, CCV = 1;   // Klasse im laufenden Rennen: Tempo-Faktor und (für Drift-Schwellen) höchstens 1
  function step(dt) {
    if (S.intro) { S.intro.t += dt; if (S.intro.t >= S.intro.dur) { S.intro = null; if (!S.grid) box.classList.remove('kr-intro'); } return; }   // Vorschau läuft: Rennuhr steht, danach Countdown
    if (S.grid) { S.grid.t += dt; S.karts.forEach((k, i) => { if (S.grid.ld[i] || S.grid.t < S.grid.lk[i] + GDROP) return; S.grid.ld[i] = 1; if (k.me) { SFX.land(); S.shake = Math.max(S.shake, .18); vib(25); } else noise(.09, .07, 0, 0, 0, 180); });   // Kart setzt in seiner Startbox auf
      const end = S.grid.t >= S.grid.dur || (S.grid.live && S.t > -3.1); if (end) { S.grid = null; box.classList.remove('kr-intro'); } else if (!S.grid.live) return; }   // Startaufstellung: Einzelrennen/Pokal mit stehender Uhr
    S.t += dt; S.shake = Math.max(0, S.shake - dt); CCF = ccF(S.cc || 150); CCV = Math.min(1, CCF);
    if (S.live && S.live.t0p && !(S.slow > 0)) { const w = (performance.now() - S.live.t0p) / 1000; if (w - S.t > .25) S.t = w; }   // Live: gemeinsame Rennuhr (nach App-Wechsel/Ruckeln aufholen)
    if (S.t < 0) { const c = Math.ceil(-S.t); if (c !== S.cd) { S.cd = c; if (c <= 3) SFX.count(1); } if (S.press === null && S.t > -3.05 && anyInput()) S.press = S.t; return; }
    if (S.cd !== 0) { S.cd = 0; SFX.count(0); MUS.on = true;
      S.karts.forEach(k => { const pr = k.me ? S.press : (k.rocket ? -.3 : null);
        // Start mit Technik: kurz vor „Los“ tippen; je näher am perfekten Moment (0,25–0,08 s vorher), desto stärker
        if (pr !== null && pr > -.25 && pr < -.08) { k.boost = 1.45; k.v = 150; if (k.me) { SFX.rocket(); ach('rocket'); floatTxt(k, '🚀 Perfekter Start!'); say('rocket', 'Was für ein Raketenstart!', 1); } }
        else if (pr !== null && pr > -.62 && pr < -.02) { k.boost = .6; k.v = 90; if (k.me) { SFX.rocket(); floatTxt(k, '👍 Guter Start', '#bfe8ff'); } }
        else if (k.me && pr !== null && pr <= -.62 && pr >= -2) { k.stall = .35; floatTxt(k, '🐢 Zu früh, kurzer Hänger', '#ffb0b0'); }
        else if (k.me && pr !== null && pr < -2) { k.stall = .9; SFX.stall(); floatTxt(k, '💨 Abgewürgt!', '#ff8a8a'); say('stall', 'Abgewürgt! Zu früh gestartet!', 1); } });
      if (!S.karts[0].stall && S.karts[0].boost <= 0) say('go', 'Und los geht\'s!', 1); }
    const ks = S.karts;
    { const k0 = ks[0], gi = Math.floor(S.t / .1); if (!k0.done && S.rec.length <= gi) S.rec.push([Math.round(k0.x), Math.round(k0.y), Math.round(k0.a * 100)]); }
    ks.forEach(k => {
      if (k.remote) { liveRemote(k, dt); return; }
      if (k.fall > 0) { fallStep(k, dt); return; }
      // Lenken
      let target = 0;
      if (k.done) target = 0;
      else if (k.me) { const kb = (INPUT.keys.ArrowLeft || INPUT.keys.a ? -1 : 0) + (INPUT.keys.ArrowRight || INPUT.keys.d ? 1 : 0);
        k.brk = !!(INPUT.brake || INPUT.keys.ArrowDown || INPUT.keys.s || (SET.ctl !== 'analog' && INPUT.L && INPUT.R && !k.dr));   // im Drift heißt „beide Seiten“ nicht bremsen, sondern mittlerer Bogen
        target = SET.ctl === 'analog' && INPUT.ax !== null ? INPUT.ax : kb || ((INPUT.L ? -1 : 0) + (INPUT.R ? 1 : 0));
        k.inp = SET.ctl === 'analog' && INPUT.ax !== null ? Math.abs(INPUT.ax) > .12 : !!(kb || INPUT.L || INPUT.R);   // irgendein Finger/irgendeine Taste am Lenken
        // Drift sofort: Doppeltipp auf eine Seite (Halten) oder Drift-Knopf (Analog)
        if (!k.dr && k.v > 150 * CCV && !k.air && k.spin <= 0 && !k.done) { const dt0 = INPUT.dtap && performance.now() - INPUT.dtap.t < 380;
          if ((INPUT.drift && Math.abs(target) > .25) || dt0) { k.dr = INPUT.drift ? Math.sign(target) : INPUT.dtap.s; k.dt = 0; k.drIn = 0; k.drRel = 0; k.drS = 0; k.manual = INPUT.drift ? 'btn' : 'tap'; INPUT.dtap = null; SFX.drift(); vib(10); } } }
      else { k.laneT -= dt; if (k.laneT < 0) { k.laneT = rnd(1.5, 4); k.lane = rnd(-TW * .25, TW * .25); }
        const la = 14 + k.v / 30; let lane = k.lane, haz = null, hd = 170 + k.v * .25;   // je schneller, desto früher ausweichen (vorher fest 170 px: Koffer & Co. wurden oft mitgenommen)
        S.obst.concat(S.oils, S.puddles).forEach(o => { if (o.drop !== undefined && S.t - o.drop < .7) return; const dx = o.x - k.x, dy = o.y - k.y, d = Math.hypot(dx, dy); if (d < hd && dx * Math.cos(k.a) + dy * Math.sin(k.a) > 0) { hd = d; haz = o; } });
        if (haz) { const nl = nearest(haz.x, haz.y, k.idx)[1], gap = (haz.r || (haz.beer ? 44 : haz.stink ? 50 : 24)) + 34 * k.pp.care; lane = nl > 0 ? nl - gap : nl + gap; }
        else { const bx = S.boxes.find(b => b.off <= 0 && !k.item && k.roll <= 0 && b.i > k.idx && b.i - k.idx < 40); if (bx) lane = bx.l;
          const pd = PADS.find(p => p.i > k.idx && p.i - k.idx < 35); if (pd && k.skill > .93) lane = pd.l; }
        const mvr = S.movers.find(m => m.i > k.idx && m.i - k.idx < 30); if (mvr) lane = mvr.l > 0 ? -TW * .3 : TW * .3;
        if (!haz && !mvr) { const lw = clamp(DIFFS[DIFF].line * k.pp.line, 0, 1); lane = LINE[wrap(k.idx + la)] * lw + lane * (1 - lw * .7); }
        if (k.avT > 0) { k.avT -= dt; if (!haz && !mvr) lane += k.avS * 24 * Math.min(1, k.avT / .35); }   // nach einem Rempler kurz zur Seite (sonst drücken beide wieder auf dieselbe Linie)
        if (k.pp.ram && !haz) { const vic = S.karts.find(o => o !== k && !o.done && progress(o) - progress(k) > 2 && progress(o) - progress(k) < 14); if (vic) lane = vic.lat; }
        if (FALL && Math.abs(k.lat) > TW * .4) lane = -Math.sign(k.lat) * TW * .1;   // Abgrund-Strecken: nah am Rand sofort zur Mitte
        const [tx, ty] = at(k.idx + la, clamp(lane, -TW * .37, TW * .37)); const d = angd(Math.atan2(ty - k.y, tx - k.x), k.a); target = clamp(d * 2.6, -1, 1);
        if (k.misD > 0 && k.misK === 'wide' && !(FALL && Math.abs(k.lat) > TW * .3)) target *= .35; if (k.misD > 0 && k.misK === 'wobble') target = clamp(target + Math.sin(S.t * 9) * .8, -1, 1);
        if (k.item && k.roll <= 0) { k.useAt -= dt; if (k.useAt < 0) useItem(k); } }
      if (k.peg > 0 && !k.done) target = clamp(target + Math.sin(S.t * 2.3 + k.idx * .01) * k.peg * .45, -1, 1);   // Pegel vom Vorabend
      if (k.bus > 0) { const [tx, ty] = at(k.idx + Math.round(20 + k.v / 12), 0); target = clamp(angd(Math.atan2(ty - k.y, tx - k.x), k.a) * 2.4, -1, 1); }   // Ônibus-Express: Autopilot auf der Mitte
      else if (k.acai > 0 && !k.me) target = clamp(target + Math.sin(S.t * 9 + k.idx) * .5, -1, 1);   // Gegner mit Açaí im Gesicht eiern
      if (k.blind > 0) target = clamp(target + Math.sin(S.t * 13) * .65, -1, 1);
      if (k.parrot > 0) { k.parrot -= dt; target = clamp(target * .8 + Math.sin(S.t * 6) * .45, -1, 1); }
      if (k.kiss > 0) { k.kiss -= dt; const kf = clamp(k.kiss / .4, 0, 1), kt = k.me ? -target * .85 + Math.sin(S.t * 4) * .2 : clamp(target * .5 + Math.sin(S.t * 5 + k.idx) * .6, -1, 1); target = target + (kt - target) * kf; }   /* in den letzten 0,4 s kommt die Lenkung schrittweise zurück */
      if (k.shield > 0) k.shield -= dt;
      if (k.fire > 0) { k.fire -= dt; S.karts.forEach(o => { if (o !== k && !o.air && Math.hypot(o.x - (k.x - Math.cos(k.a) * 40), o.y - (k.y - Math.sin(k.a) * 40)) < 26) hitBy(o, 'fire', k); }); if (Math.random() < dt * 30) S.sp.push({x: k.x - Math.cos(k.a) * 26, y: k.y - Math.sin(k.a) * 26, vx: -Math.cos(k.a) * 120 + rnd(-40, 40), vy: -Math.sin(k.a) * 120 + rnd(-40, 40), t: 0, c: pick(['#ff5a1f', '#ffb21f', '#ff2a2a']), big: 1}); }
      if (k.air > 0) target *= .25;
      const rate = k.me ? (SET.ctl === 'analog' ? 6 : k.dr ? 5.5 : target ? 3.2 : 6) : 7;   // Spieler: Lenkeinschlag baut sich weich auf, Loslassen geht schnell zurück; im Drift reagiert der Bogen schneller auf die Gegenseite
      k.steer += clamp(target - k.steer, -rate * dt, rate * dt);
      // Drift: lange in eine Richtung lenken → rutschen, Funken; Loslassen → Mini-/Super-Turbo.
      // Neu (Feedback Patrick 09.10.: Drift schlug sofort viel zu steil ein, man flog beim Aufladen von der Strecke, deshalb driftete keiner):
      // Bogen lässt sich steuern wie bei Mario Kart: Richtung halten = eng, beide Seiten = mittel, Gegenseite = weiter Bogen (beendet den Drift nicht mehr),
      // erst ganz loslassen (0,13 s ohne Lenken) zündet den Turbo. Einschlag baut sich über 0,3 s auf statt sofort.
      const sgn = Math.sign(target);
      k.hold = sgn && Math.abs(k.steer) > .7 ? (Math.sign(k.steer) === sgn ? k.hold + dt : 0) : 0;
      if (!k.dr && k.hold > .38 && k.v > 190 * CCV && !k.air && k.spin <= 0 && !k.done && k.vtype !== 'horse' && !(k.bus > 0)) { k.dr = sgn; k.dt = 0; k.drIn = 0; k.drRel = 0; k.drS = 0; if (k.me) SFX.drift(); }
      if (k.dr) { k.drRel = k.me && k.manual !== 'btn' && !k.inp ? (k.drRel || 0) + dt : 0;
        const stop = k.manual === 'btn' ? !INPUT.drift : k.me ? k.drRel > .13 : sgn !== k.dr;
        if (stop || k.spin > 0 || k.v < 120 * CCV || k.done) { k.manual = null; const lvl = k.dt > 1.5 ? 2 : k.dt > .75 ? 1 : 0;
          if (lvl && k.spin <= 0) { k.boost = Math.max(k.boost, lvl > 1 ? 1.0 : .55); k.pop = .3; if (k.me) { SFX.mini(lvl); floatTxt(k, lvl > 1 ? '🔥 Super-Turbo!' : '💨 Mini-Turbo!', lvl > 1 ? '#ff9a3c' : '#7fd3ff'); S.tutMini = 1; if (S.rep && lvl === 1) S.rep.mini++; if (lvl > 1) { S.supers++; if (Math.random() < .7) voice(k, 'drift'); else say('super', 'Super-Turbo!'); } } }
          k.dr = 0; k.dt = 0; }
        else { k.drS = clamp(k.steer * k.dr, -1, 1); k.dt += dt * (1 + .2 * k.drS);   // eng lädt etwas schneller, weit etwas langsamer
          if (Math.random() < dt * 30) { const lvl = k.dt > 1.5 ? 2 : k.dt > .75 ? 1 : 0, bx = k.x - Math.cos(k.a) * 18, by = k.y - Math.sin(k.a) * 18;
            S.sp.push({x: bx + rnd(-8, 8), y: by + rnd(-8, 8), vx: -Math.cos(k.a) * 60 + rnd(-40, 40), vy: -Math.sin(k.a) * 60 + rnd(-40, 40), t: 0, c: ['#fff6c0', '#5ec8ff', '#ff8a2a'][lvl]}); } } }
      k.yaw += ((k.dr ? k.dr * (.3 + .12 * Math.max(0, k.drS || 0)) * (k.drIn || 0) : 0) - k.yaw) * Math.min(1, dt * 8);
      // Tempo
      const cq = onCut(k.x, k.y), edge = cq !== false ? -50 : Math.abs(k.lat) - TW / 2, offT = edge > -4 && !k.air, me1 = ks[0], deep = clamp((edge + 4) / 22, 0, 1);
      // Randsteine: rütteln, leicht bremsen
      if (!k.air && T.veh !== 'boat' && edge > -16 && edge < 8 && k.v > 80) { k.rumble -= dt; if (k.rumble <= 0) { k.rumble = .07; if (k.me) { S.shake = Math.max(S.shake, .06); noise(.04, .05, 0, 0, 0, 180); } } }
      const blt = T.belts && !k.air && !k.onCut ? T.belts.find(q => k.idx >= q[0] * N && k.idx <= q[1] * N) : null;
      let vmax = (blt ? 1 + blt[2] * .16 * (blt[2] > 0 ? S.beltX || 1 : 1) : 1) * (k.me ? 1 + S.tu.m * .01 + Math.min(10, k.coins) * .004 : 1 + S.tu.m * .005 + (S.tu.a + S.tu.r + S.tu.s + S.tu.t + S.tu.p) * .0006 + Math.min(10, k.coins) * .004) * VMAX * CCF * k.skill * (.97 + k.cs.spd * .06) * k.vt[0] * k.pf.v * (k.slowT > 0 ? .55 : 1) * (k.blind > 0 ? .8 : 1) * (offT ? 1 - Math.min(.75, (1 - T.off) * 1.35) * deep * k.pf.off * (k.voff || 1) * (k.me ? 1 - S.tu.r * .03 : 1) : 1) * (edge > 0 && edge < 8 && !k.air ? .99 : 1) * (1 + .1 * (k.str || 0)) * (k.draftOn ? 1.07 : 1) * (k.wet > 0 && !VDRY[k.vtype] ? .68 : 1) * (k.boost > 0 ? 1.45 : 1) * (k.done ? .6 : 1) * (k.dr ? .97 : 1 - Math.abs(k.steer) * (k.vtype === 'horse' ? .05 : .1)) * (k.brk ? .35 : 1) * (cq !== false ? (k.boost > 0 || k.vtype === 'trak' ? .95 : CUT.f || .86) : 1);   // starkes Einlenken kostet Tempo (Reifenabrieb)
      // Endtempo baut sich auf langen Geraden auf (Lenkung ruhig, auf der Strecke) und fällt beim Einlenken schnell wieder ab
      k.str = clamp((k.str || 0) + (Math.abs(k.steer) < .18 && !offT && !k.dr && k.spin <= 0 ? dt * .45 : -dt * 2.2), 0, 1);
      if (SLP && !k.air && !k.onCut) vmax *= 1 - clamp(slp(k.idx) * 15, -.15, .15) * (k.vx.m > 1.2 ? 1.2 : 1);   // Berg: hoch langsamer, runter schneller (schwere Fahrzeuge stärker)
      // Neue Items: Bus (Autopilot, schnell, mäht um), Cristo-Blitz (klein + langsam), Açaí (Matsch)
      if (k.bus > 0) { k.bus -= dt; vmax *= 1.55; k.vr *= Math.exp(-6 * dt); k.dr = 0; if (k.bus <= 0) { k.boost = Math.max(k.boost, .5); floatTxt(k, '🚌 Endstation!', '#ffd23f'); }
        S.karts.forEach(o => { if (o !== k && !o.done && !o.air && !(o.fall > 0) && !(o.inv > 0) && Math.hypot(o.x - k.x, o.y - k.y) < 40) hitBy(o, 'bus', k); }); }
      if (k.zap > 0) { if (!k.zapOn) { k.zapOn = 1; if (k.item && !k.remote) { k.item = null; k.icntFor = null; } k.spin = Math.max(k.spin, .25); if (k.me) { S.flash = Math.max(S.flash, .5); vib([20, 30, 20]); } } k.zap -= dt; vmax *= .8; if (k.zap <= 0) { k.zapOn = 0; if (k.me) floatTxt(k, '⬆️ Wieder groß!', '#fff7a8'); } }
      if (k.acai > 0) { k.acai -= dt; if (!k.me) vmax *= .92; else if (!S.acaiB || S.acaiB.k !== k.acaiT) { k.acaiT = (k.acaiT || 0) + 1; S.acaiB = {k: k.acaiT, b: Array.from({length: 9}, () => [Math.random(), .15 + Math.random() * .7, .08 + Math.random() * .12])}; vib(25); } }
      // Fahrzeug-Eigenheiten (Wunsch Patrick 09.10.: jedes Fahrzeug fährt sich spürbar anders)
      if (VNEW[k.vtype] && !k.remote) {
        if (k.vtype === 'sail') { if (S.sailW === undefined) S.sailW = wr('sail') * TAU; k.windF = k.air ? 0 : Math.cos(k.mv - S.sailW); vmax *= 1 + .13 * k.windF; }
        else if (k.vtype === 'horse') { const g = Math.sin(S.t * 10); vmax *= 1 + .045 * g + .05 * (k.str || 0); if (k.me && S.t > 0 && k.v > 60 && (k.gal || 0) < 0 && g >= 0) noise(.03, .05, 1200); k.gal = g; }
        else if (k.vtype === 'rocket') { if (k.ovh > 0) { k.ovh -= dt; vmax *= .62; if (Math.random() < dt * 25) S.fx.push({x: k.x - Math.cos(k.a) * 22 + rnd(-6, 6), y: k.y - Math.sin(k.a) * 22 + rnd(-6, 6), dust: 1, t: 0, c: '90,90,90'}); }
          else { k.heat = clamp((k.heat || 0) + (k.boost > 0 ? dt : -dt * .8), 0, 4); if (k.heat > 3.4) { k.heat = 0; k.ovh = 1.3; k.boost = 0; floatTxt(k, '🔥 Überhitzt!', '#ff8a5c'); if (k.me) { noise(.5, .12, 300); vib(30); } } } }
        else if (k.vtype === 'coco' && S.t > 2 && !k.done) { k.cocoT = (k.cocoT === undefined ? 4 : k.cocoT) - dt; if (k.cocoT <= 0) { k.cocoT = 6; cocoDrop(k, 34, 0); } }
        else if (k.vtype === 'trio' && S.t > 1 && !k.done) { k.bassT = (k.bassT === undefined ? 3 : k.bassT) - dt; if (k.bassT <= 0) { k.bassT = 4.5; bassPulse(k); } }
        else if (k.vtype === 'moto' && S.t > 1) { k.nmCd = Math.max(0, (k.nmCd || 0) - dt); const nm = k.nm || (k.nm = {}); S.karts.forEach(o => { if (o === k || o.done) return; const d = progress(k) - progress(o), pv = nm[o.id]; nm[o.id] = d;   /* knapp vorbei = Mini-Turbo */
            if (pv !== undefined && pv < 0 && d >= 0 && d < 30 && !k.nmCd && Math.hypot(o.x - k.x, o.y - k.y) < 54) { k.nmCd = 1.2; k.boost = Math.max(k.boost, .5); floatTxt(k, '🛵 Durchgeschlängelt!', '#7fd3ff'); if (k.me) SFX.mini(1); } }); } }
      if (!k.me && !k.done) { const gap = (progress(me1) - progress(k)) / N; vmax *= clamp(1 + gap * DIFFS[DIFF].rb, .9, 1.12);   // Gummiband: knapp bleibt spannend
        let ca = 0; for (let j = 10; j < 60; j += 6) ca = Math.max(ca, Math.abs(CURV[wrap(k.idx + j)])); vmax *= 1 - clamp((ca - .003) * 55 * (CCF > 1 ? 1.7 : 1), 0, CCF > 1 ? .36 : .2) * k.pp.brake;   // 200 ccm: vor Kurven deutlich stärker bremsen
        if (k.pp.straight && ca < .002) vmax *= 1.025; if (k.pp.late && k.lap >= LAPS - 1) vmax *= 1.035;
        if (k.pp.burst && S.t > 3) { k.burstT -= dt; if (k.burstT < 0) { k.burstT = rnd(10, 20); k.boost = Math.max(k.boost, .9); } }
        // typische Fehler je Person
        if (S.t > 3) { k.misT -= dt; if (k.misT < 0 && !k.misD) { k.misT = rnd(9, 17) / k.pp.mis[0] / (DIFFS[DIFF].mis || 1); k.misK = k.pp.mis[1]; k.misD = k.misK === 'wide' ? 1.1 : k.misK === 'wobble' ? 1.6 : .9; }
          if (k.misD > 0) { k.misD = Math.max(0, k.misD - dt); if (k.misK === 'lapse') vmax *= .6; if (k.misK === 'brake') vmax *= .72; } } }   // vor engen Kurven bremsen
      if (!k.me && S.ev && S.ev.cur && S.ev.cur.k === 'police' && !k.evRaser && wrap(S.ev.cur.i - k.idx) < 70) vmax *= .5;
      if (k.pop > 0) k.pop -= dt;
      if (k.spin > 0) { k.spin -= dt; k.rot += dt * 14; vmax *= .25; if (k.spin <= 0 && k.wut) { k.wut = 0; k.boost = Math.max(k.boost, .9); floatTxt(k, '💢 Jetzt reicht’s!', '#ff6b6b'); } } else k.rot *= Math.max(0, 1 - dt * 10);
      if (k.stall > 0) { k.stall -= dt; vmax = 0; }
      k.v += (vmax - k.v) * Math.min(1, dt * (k.v < vmax ? (k.boost > 0 ? 4 : 1.6 * (.86 + k.cs.acc * .28) * k.vt[2] * k.pf.acc * (k.me ? 1 + S.tu.a * .05 : 1)) : 4));
      k.wallC = Math.max(0, (k.wallC || 0) - dt); k.inv = Math.max(0, k.inv - dt); k.glow = Math.max(0, k.glow - dt); k.blind = Math.max(0, k.blind - dt); k.slowT = Math.max(0, k.slowT - dt);
      k.boost = Math.max(0, k.boost - dt / ((k.me ? 1 + S.tu.t * .07 : 1) * k.vx.b)); k.wet = Math.max(0, k.wet - dt);
      let turn = k.steer;   // Drift-Bogen als Anteil am vollen Lenkeinschlag: innen 1,02, mittel 0,62, außen 0,26 (vorher immer 1,25 × 1,14 ≈ 200° in 1,5 s)
      if (k.dr) { const s0 = k.drS || 0, dT = k.dr * (s0 >= 0 ? .62 + .4 * s0 : .62 + .36 * s0); k.drIn = Math.min(1, (k.drIn || 0) + dt / .3); turn = k.steer + (dT - k.steer) * k.drIn; }
      // Lenkung: im Stand wenig, bei Höchsttempo etwas weniger als in der Mitte
      const sf = k.v < 120 ? Math.max(0, k.v) / 120 : 1 - clamp((k.v - 260) / 420, 0, .2);
      const dA = turn * (k.me ? STEERS[STEER][1] : 2.7) * (.94 + k.cs.hdl * .12) * k.vt[1] * (k.me ? 1 + S.tu.s * .03 : 1) * (k.boost > 0 ? k.pf.bs : 1) * (CCF > 1 ? 1.08 : 1) * dt * sf;
      k.a += dA;
      // Querbewegung: Schwung bleibt beim Einlenken erhalten und wird über die Haftung abgebaut (Drift = wenig Haftung = Rutschen)
      const grip0 = T.grip * (1 - S.storm.f * .2) * (S.rainX ? 1 - .08 * S.rainX : 1), lg = k.air ? .4 : k.spin > 0 ? 1.5 : k.dr ? Math.min(grip0, 4.5) : grip0 * (offT ? .8 : 1) * (k.me ? 1 + S.tu.r * .04 : 1) * k.vx.g;
      k.vr = (k.vr - k.v * dA * .92 + (k.dr ? -k.dr * k.v * .3 * (k.drIn || 0) * k.vx.d * dt : 0)) * Math.exp(-lg * dt);
      k.vr = clamp(k.vr, -k.v * .8 - 20, k.v * .8 + 20);
      const ca = Math.cos(k.a), sa = Math.sin(k.a);
      k.x = clamp(k.x + (ca * k.v - sa * k.vr + (k.kx || 0)) * dt, 20, WW - 20); k.y = clamp(k.y + (sa * k.v + ca * k.vr + (k.ky || 0)) * dt, 20, Math.min(WH - 20, shore(k.x) - 10));
      if (k.kx || k.ky) { const kd = Math.exp(-7 * dt); k.kx *= kd; k.ky *= kd; if (Math.abs(k.kx) + Math.abs(k.ky) < 3) k.kx = k.ky = 0; }   // Schubs nach einem Rempler klingt ab (~15 px)
      k.mv = Math.atan2(sa * k.v + ca * k.vr, ca * k.v - sa * k.vr);
      // Reifenqualm beim Rutschen
      if (!k.air && T.veh !== 'boat' && (Math.abs(k.vr) > 70 || k.dr) && Math.random() < dt * 14) S.fx.push({x: k.x - ca * 16 + rnd(-6, 6), y: k.y - sa * 16 + rnd(-6, 6), dust: 1, t: 0, c: '235,235,235'});
      // weiche Bande: weit neben der Strecke ist Schluss (Dschungel/Häuser/Absperrung), Kart gleitet an ihr entlang
      { const [ni, nl] = nearest(k.x, k.y, k.idx), brg = BRG.length && inBrg(ni), lim = TW / 2 + (brg ? 12 : T.veh === 'boat' ? 55 : T.id === 'paraty' ? 60 : 85);   // Brücke: Geländer dicht an der Fahrbahn
        if (FALL && !inTun(ni) && !brg && !k.air && cq === false && !k.done && S.t > 0 && Math.abs(nl) > TW / 2 + FALL.m) fallStart(k);
        else if ((!FALL || inTun(ni) || brg) && Math.abs(nl) > lim && !k.air && cq === false) { const sg = Math.sign(nl), [bx, by] = at(ni, sg * (lim - 4)); k.x = bx; k.y = by; k.v *= k.wallC > 0 ? .95 : .72; k.wallC = .35; k.vr = -sg * 40; k.kx = k.ky = 0; k.dr = 0; k.str = 0;
          if (k.me && !S.wallT) { S.wallT = .3; if (S.rep) S.rep.wall++; noise(.07, .09, 0, 0, 0, 500); vib(12); S.shake = Math.max(S.shake, .12); for (let q = 0; q < 5; q++) S.sp.push({x: bx, y: by, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: '#ffe08a'}); } } }
      // weit weg oder festgefahren: zurück auf die Strecke
      if (!k.done && !k.air && (edge > 230 || (edge > 10 && k.v < 30) || (T.sea && k.y >= shore(k.x) - 11))) k.lost += dt; else k.lost = Math.max(0, k.lost - dt * 2);
      if (k.lost > 2.2) { const i = wrap(k.idx - 8), [x, y] = at(i, 0); k.x = x; k.y = y; k.a = k.mv = Math.atan2(P[wrap(i + 1)][1] - P[i][1], P[wrap(i + 1)][0] - P[i][0]); k.v = 60; k.vr = 0; k.kx = k.ky = 0; k.lost = 0; k.dr = 0; k.spin = 0;
        floatTxt(k, '🔄 Zurück auf die Strecke', '#fff'); if (k.me) { S.fade = .5; vib(40); } }
      if (offT && k.v > 120) { k.dust -= dt; if (k.dust < 0) { k.dust = .06; S.fx.push({x: k.x - Math.cos(k.a) * 18, y: k.y - Math.sin(k.a) * 18, dust: 1, t: 0, c: T.veh === 'boat' ? '120,150,90' : T.id === 'iguacu' ? '150,70,40' : '200,160,100'}); } }
      // Kielwasser (Boot) bzw. Reifenspuren
      if (T.veh === 'boat' && k.v > 60 && Math.random() < dt * 20) S.sp.push({x: k.x - Math.cos(k.a) * 26 + rnd(-6, 6), y: k.y - Math.sin(k.a) * 26 + rnd(-6, 6), vx: rnd(-20, 20), vy: rnd(-20, 20), t: 0, c: 'rgba(255,255,255,.8)', big: 1});
      if ((k.dr || k.spin > 0) && !k.air && T.veh !== 'boat') { const c = Math.cos(k.a), s = Math.sin(k.a), rx = k.x - c * 14, ry = k.y - s * 14;
        [[-s * 11, c * 11], [s * 11, -c * 11]].forEach(([ox, oy], j) => { const p = k['mk' + j]; if (p) S.marks.push([p[0], p[1], rx + ox, ry + oy]); k['mk' + j] = [rx + ox, ry + oy]; });
        if (S.marks.length > 700) S.marks.splice(0, S.marks.length - 700); } else { k.mk0 = k.mk1 = null; }
      // Fortschritt und Runden
      // Auf dem Schleichweg zählt der Fortschritt anteilig zwischen Ein- und Ausfahrt (sonst springt der nächste Streckenpunkt wild hin und her, Platz und Runde stimmen nicht)
      const prev = k.idx, cqp = onCut(k.x, k.y);
      if (cqp !== false && CUT.i2 - CUT.i1 > 30) { const ax = CUT.b[0] - CUT.a[0], ay = CUT.b[1] - CUT.a[1], l = Math.hypot(ax, ay) || 1; k.idx = wrap(Math.round(CUT.i1 + cqp * (CUT.i2 - CUT.i1))); k.lat = ((k.x - CUT.a[0]) * -ay + (k.y - CUT.a[1]) * ax) / l * .3; }
      else [k.idx, k.lat] = nearest(k.x, k.y, k.idx);
      k.onCut = cqp !== false;   // Schranken, Pfeile, Schanze, Gepäckbänder liegen auf der normalen Strecke, nicht auf dem Schleichweg
      if (k.idx > N * .4 && k.idx < N * .6) k.half = true;
      // Zwischenzeiten: zwei Messpunkte pro Runde (1/3, 2/3), Vergleich mit der eigenen besten Zwischenzeit
      if (k.me && !k.done && k.lap >= 0 && S.t > 0) [1, 2].forEach(j => { const bi = Math.round(N * j / 3); if (prev < bi && k.idx >= bi && k.idx - prev < 40) { const st = S.t - k.lapT0, key = 'kartSec.' + tkey(T.id); let bs = []; try { bs = JSON.parse(store.get(key) || '[]'); } catch (e) {}
        const d = bs[j - 1] ? st - bs[j - 1] / 1000 : null; S.secMsg = {t: 'Zwischenzeit ' + j + ': ' + fmt(st * 1000), d, until: performance.now() + 2200}; if (!bs[j - 1] || st * 1000 < bs[j - 1]) { bs[j - 1] = Math.round(st * 1000); store.set(key, JSON.stringify(bs)); } } });
      if (prev > N * .85 && k.idx < N * .15 && k.half) { k.lap++; k.half = false;
        if (k.me && k.lap >= 1) { const lt = S.t - k.lapT0, key = 'kartLap.' + tkey(T.id), bl = +store.get(key) || 0; if (S.rep) S.rep.laps.push(lt); S.lapMsg = {t: 'Runde ' + k.lap + ': ' + fmt(lt * 1000), d: bl ? lt - bl / 1000 : null, until: performance.now() + 2800};
          if (!bl || lt * 1000 < bl) store.set(key, Math.round(lt * 1000)); if (k.lap < LAPS && place(k) === S.karts.length && S.karts.length > 2) say('ann_last', '💐 Letzter Platz. Die Crew hat schon Blumen bestellt.', 1); }
        k.lapT0 = S.t;
        if (k.lap >= LAPS && !k.done) { k.done = S.t; if (k.me) { const wn = S.karts.filter(o => o.done).sort((x, y) => x.done - y.done)[0] || k; S.pose = {id: wn.id, t0: performance.now(), me: wn === k, live: !!S.live}; if (!S.live) setTimeout(() => { if (S) voice(wn, 'win', 1); }, 700); SFX.finish(); S.over = 3.4; S.slow = 1.6; say('finish', 'Zielflagge!', 1); fireworks(place(k) <= 3 ? 70 : 25); } }
        else if (k.me && k.lap === LAPS - 1) { say('last', 'Letzte Runde!', 1); MUS.fast = true; floatTxt(k, '🏁 Letzte Runde!', '#fff'); } }
      if (prev < N * .15 && k.idx > N * .85 && k.lap >= 0 && !k.half) { k.lap--; k.half = true; }   // rückwärts über die Linie
      if (cq !== false) { if (k.me && S.cutSaid !== k.lap) { S.cutSaid = k.lap; say('cut', 'Abkürzung!'); ach('cut'); } if (Math.random() < dt * 10) S.fx.push({x: k.x, y: k.y, dust: 1, t: 0, c: '150,110,70'}); }
      // Münzen sammeln auch die Computer-Gegner (wie bei Mario Kart; je Münze +0,4 % Tempo), nicht im Live-Rennen (Münzen sind dort pro Handy)
      if (!k.air && (k.me || (!S.live && !k.remote))) S.coins.forEach(c => { if (c.off <= 0 && Math.hypot(c.x - k.x, c.y - k.y) < 26) { c.off = 9; k.coins++; if (k.me) { S.got++; SFX.coin ? SFX.coin() : beep(1560, .06, 'square', .05); } } });
      if (k.me && S.t > 4 && !k.done) { const rv = S.karts.find(o => o.id === S.rival); if (rv && !rv.done) { const ah = progress(rv) > progress(k);
          if (S.rivalAhead && !ah && S.t - S.rivalSaid > 12) { S.rivalSaid = S.t; floatTxt(k, '⚔️ Rivale überholt!', '#ffb86b'); say('rival', 'Der Rivale ist überholt!'); } S.rivalAhead = ah; } }
      // Schranken: geschlossen = Anhalten
      S.gates.forEach(g => { const shut = gateShut(g) && !k.onCut; if (shut && prev < g.i && k.idx >= g.i && k.idx - prev < 30 && !k.air) { const [bx, by] = at(g.i - 4, k.lat); k.x = bx; k.y = by; k.v = 0; k.vr = 0; k.bump = .4; if (k.me) { S.shake = .25; vib(40); SFX.land(); k.say = HITSAY.gate; k.sayT = 1.2; } }
        if (!k.me && shut && g.i - k.idx > 0 && g.i - k.idx < 45) k.v = Math.min(k.v, 60);
        if (k.me && shut && g.i - k.idx > 0 && g.i - k.idx < 70 && g.said !== k.lap) { g.said = k.lap; say('gate', 'Achtung, Schranke!'); } });
      // Boost-Pfeile, Schanze, Luft
      if (!k.air && k.pad <= 0 && !k.onCut) { const pd = PADS.find(p => Math.abs(p.i - k.idx) < 5 && Math.abs(p.l - k.lat) < 24); if (pd) { k.boost = Math.max(k.boost, .8); k.pad = .5; if (k.me) { SFX.pad(); vib(15); } } }
      k.pad -= dt;
      if (RAMP >= 0 && !k.onCut && prev < RAMP && k.idx >= RAMP && k.idx - prev < 30 && !k.air && Math.abs(k.lat) < TW / 2 && k.v > 170) { k.airT = k.air = (.55 + k.v / 1400) * k.pf.air; k.trick = 0; if (k.me) { SFX.jump(); say('jump', 'Abflug!'); } else if (Math.random() < .5) k.trick = 1; }
      if (CRESTS.length && !k.air && !k.onCut && k.v > 200 && Math.abs(k.lat) < TW / 2 && CRESTS.some(c0 => prev < c0 && k.idx >= c0 && k.idx - prev < 30)) { k.airT = k.air = (.3 + k.v / 2200) * k.pf.air; k.trick = 0; if (k.me) { SFX.jump(); floatTxt(k, '⛰️ Kuppe!', '#fff'); } else if (Math.random() < .4) k.trick = 1; }   // Kuppe: kurz abheben
      if (k.air > 0) { k.air -= dt; if (k.me && k.trick === 0 && anyInput() && k.airT - k.air > .08) { k.trick = 1; SFX.trick(); ach('trick'); }
        if (k.air <= 0) { k.air = 0; k.squash = .3; if (k.pf.land) { k.boost = Math.max(k.boost, .9); if (k.me) floatTxt(k, "🏄 Surf-Landung!", "#7fd3ff"); } for (let j = 0; j < 10; j++) { const an = j / 10 * TAU; S.fx.push({x: k.x + Math.cos(an) * 14, y: k.y + Math.sin(an) * 14, dust: 1, t: 0, c: '210,190,150'}); } if (k.me) { SFX.land(); vib(25); } if (k.trick) { k.boost = Math.max(k.boost, .7); if (k.me) { floatTxt(k, '🤸 Trick!', '#7fffa5'); say('trick', 'Was für ein Trick!'); } } } }
      // Item-Roulette
      if (k.roll > 0) { k.roll -= dt; if (k.roll <= 0) { k.item = rollItem(k); k.icntFor = null; if (k.item.cnt && k.me) floatTxt(k, k.item.e + ' ' + k.item.n + ' ×' + k.item.cnt, '#ffd23f'); k.useAt = rnd(.8, 3) * (k.pp ? k.pp.item : 1) * (k.item.orb || k.item.trail ? 2.5 : 1); if (k.me) SFX.pick(); } }
      k.squash = Math.max(0, k.squash - dt * 1.6); k.icd = Math.max(0, (k.icd || 0) - dt);
      if (k.mini > 0) { k.mini -= dt; if (k.mini <= 0) { k.vsz = k.vsz0 || 1; floatTxt(k, '👋 Wieder da!'); } }
      if (k.sayT > 0) k.sayT -= dt; k.dol = Math.max(0, k.dol - dt); k.bump = Math.max(0, (k.bump || 0) - dt);
    });
    // Kart gegen Kart: leichter Abprall wie beim Autoscooter (Wunsch Patrick 09.10.: vorher klebten Karts aneinander, weil alle auf dieselbe Ideallinie drücken
    // und jedes Bild mit Berührung 3 % Tempo kostete; gemessen sackten zwei Karts Seite an Seite in 1 s von 250 auf 100–150 ab). Jetzt: Stoß entlang der Verbindungslinie
    // (Rückprall KBE, nach vorn nur halb), danach trennen sie sich mit mindestens KBS px/s über einen eigenen, abklingenden Schubs (k.kx/k.ky, KBD), Tempo kostet nur
    // der Aufprall (bis 5 %) und leichtes Reiben; Computerfahrer weichen danach kurz zur Seite aus (k.avT). Abgrund-Strecken: am Rand kein Schubs nach außen.
    const KBE = .45, KBS = 110, kvel = k => { const c = Math.cos(k.a), s = Math.sin(k.a), r = k.vr || 0; return [c * k.v - s * r + (k.kx || 0), s * k.v + c * r + (k.ky || 0)]; };
    const kedge = (k, x, y) => { if (FALL && Math.abs(k.lat) > TW / 2 - 16 && !inTun(k.idx)) { const s0 = Math.sign(k.lat), ox = NX[k.idx] * s0, oy = NY[k.idx] * s0, o = x * ox + y * oy; if (o > 0) { x -= ox * o; y -= oy * o; } } return [x, y]; };
    const kimp = (k, x, y) => { if (k.remote) return; [x, y] = kedge(k, x, y); const c = Math.cos(k.a), s = Math.sin(k.a); k.v = Math.max(0, k.v + (x * c + y * s) * .5); k.vr = (k.vr || 0) + (-x * s + y * c); };
    const kkick = (k, x, y) => { if (k.remote) return; [x, y] = kedge(k, x, y); k.kx = (k.kx || 0) + x; k.ky = (k.ky || 0) + y; };
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const a = ks[i], b = ks[j]; if (a.air || b.air || a.fall > 0 || b.fall > 0) continue; if (DECK && Math.min(wrap(a.idx - b.idx), wrap(b.idx - a.idx)) > N * .15) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      const R0 = 15 * ((a.vsz || 1) * (a.zap > 0 ? .6 : 1) + (b.vsz || 1) * (b.zap > 0 ? .6 : 1)); if (d < R0 && d > .01) { if ((a.zap > 0) !== (b.zap > 0)) { const sm = a.zap > 0 ? a : b, bg = sm === a ? b : a; if (!sm.remote && !(sm.spin > 0)) hitBy(sm, 'squash', bg); } const p = (R0 - d) / 2, nx = dx / d, ny = dy / d, ma = a.vx.m, mb = b.vx.m, fa = b.remote ? 2 : a.remote ? 0 : 2 * mb / (ma + mb), fb = a.remote ? 2 : b.remote ? 0 : 2 * ma / (ma + mb); a.x -= nx * p * fa; a.y -= ny * p * fa; b.x += nx * p * fb; b.y += ny * p * fb;
        // Live: gegen einen echten Mitspieler rechnet jedes Handy nur sein eigenes Kart, mit dem Massen-Anteil (das andere Handy macht dasselbe für seins)
        const sa = a.remote ? 0 : b.remote ? mb / (ma + mb) : fa / 2, sb = b.remote ? 0 : a.remote ? ma / (ma + mb) : fb / 2, va = kvel(a), vb = kvel(b), vn = (vb[0] - va[0]) * nx + (vb[1] - va[1]) * ny;   // vn < 0: aufeinander zu
        if (vn < 0) { const j0 = -(1 + KBE) * vn, ls = 1 - clamp(-vn * .0004, 0, .05); kimp(a, -nx * j0 * sa, -ny * j0 * sa); kimp(b, nx * j0 * sb, ny * j0 * sb); if (!a.remote) a.v *= ls; if (!b.remote) b.v *= ls; if (vn < -25) { const jl = clamp(-vn / 700, .1, .25); a.jolt = Math.max(a.jolt || 0, jl); b.jolt = Math.max(b.jolt || 0, jl); } }
        const vs = vn < 0 ? -KBE * vn : vn; if (vs < KBS) { const e0 = KBS - vs; kkick(a, -nx * e0 * sa, -ny * e0 * sa); kkick(b, nx * e0 * sb, ny * e0 * sb); }
        const rb = Math.exp(-.6 * dt); if (!a.remote) a.v *= rb; if (!b.remote) b.v *= rb;
        [[a, b], [b, a]].forEach(([k, o]) => { if (!k.me && !k.remote) { k.avS = k.lat - o.lat >= 0 ? 1 : -1; k.avT = .8; } });
        if ((a.me || b.me) && (a.remote || b.remote)) { const o = a.me ? b : a; if (o.aiIdx === undefined) (S.kkPeer = S.kkPeer || {})[o.peer] = S.t; }
        if (S.live && (p > 2 || vn < -30) && (a.me || b.me) && !S.bumpSent) { const o = a.me ? b : a; if (o.remote && o.aiIdx === undefined) { S.bumpSent = .35; liveEmit({t: 'bump', race: S.live.id, to: o.peer, nx: +(a.me ? nx : -nx).toFixed(2), ny: +(a.me ? ny : -ny).toFixed(2), p: Math.round(p), v: Math.round(Math.max(0, -vn)), m: +(a.me ? ma : mb).toFixed(2)}); } }
        if ((vn < -45 || p > 4) && (a.me || b.me) && !S.bumpT) { S.bumpT = .25; noise(.08, clamp(-vn / 1400, .06, .13), 0, 0, 0, 900); vib(clamp(Math.round(-vn / 8), 10, 30)); for (let q = 0; q < 6; q++) S.sp.push({x: a.x + nx * 15, y: a.y + ny * 15, vx: rnd(-140, 140), vy: rnd(-140, 140), t: 0, c: '#ffe08a'}); } } }
    ks.forEach(k => { if (k.jolt > 0) k.jolt = Math.max(0, k.jolt - dt); });
    S.bumpT = Math.max(0, (S.bumpT || 0) - dt); S.bumpSent = Math.max(0, (S.bumpSent || 0) - dt); S.wallT = Math.max(0, (S.wallT || 0) - dt); S.fade = Math.max(0, (S.fade || 0) - dt);
    const ground = k => !k.air && !(k.fall > 0);
    // Kisten, Hindernisse, Öl, Nasenbären
    S.boxes.forEach((b, bi) => { if (b.off > 0) { b.off = Math.max(0, b.off - dt); return; } ks.forEach(k => { if (!k.remote && !(k.fall > 0) && b.off <= 0 && !(k.boxI === b.i && S.t - k.boxAt < 1.5) && Math.hypot(k.x - b.x, k.y - b.y) < 28) { b.off = 3; k.boxI = b.i; k.boxAt = S.t;   /* nur eine Kiste pro Reihe (vorher fuhr man zwischen zwei Kisten durch und bekam beide) */ if (S.live) liveEmit({t: 'box', race: S.live.id, i: bi}); for (let j = 0; j < 8; j++) S.sp.push({x: b.x, y: b.y, vx: rnd(-120, 120), vy: rnd(-120, 120), t: 0, c: '#ffd23f'}); if (!k.item && k.roll <= 0) { k.roll = .9; if (k.me) beep(660, .06, 'square', .05); } else if (k.me && k.item && !k.item2 && k.roll <= 0) { k.item2 = rollItem(k, 1); SFX.pick(); floatTxt(k, k.item2.e + ' 2. Item' + (comboOf(k.item, k.item2) ? ' · KOMBO!' : ''), '#ffd23f'); } } }); });
    // feste Hindernisse: Anprall (zurückschieben, bremsen, wackeln) statt Dreher
    S.obst.forEach(o => ks.forEach(k => { const dx = k.x - o.x, dy = k.y - o.y, d = Math.hypot(dx, dy); if (k.remote || !ground(k) || d >= o.r + 8 || d < .01 || (o.drop !== undefined && S.t - o.drop < .7)) return;
      k.x = o.x + dx / d * (o.r + 8); k.y = o.y + dy / d * (o.r + 8); if (FALL) { const [ni, nl] = nearest(k.x, k.y, k.idx); if (Math.abs(nl) > TW / 2 - 6) { [k.x, k.y] = at(ni, Math.sign(nl) * (TW / 2 - 6)); } }   /* Abgrund-Strecken: ein Hindernis schiebt nie über den Rand */ if (k.bump > 0) return; k.bump = .45; k.v *= .4; k.dr = 0; k.dt = 0; S.hl[o.kind] = (S.hl[o.kind] || 0) + 1; k.obH = (k.obH || 0) + 1; if (k.me) { S.shake = .2; SFX.land(); }
      if (Math.random() < .5 && HITSAY[o.kind]) { k.say = HITSAY[o.kind]; k.sayT = 1.3; } }));
    S.oils = S.oils.filter(o => { o.t -= dt;
      if (o.bang) { o.bang -= dt; if (o.bang > 0) return true; const me0 = S.karts[0]; ks.forEach(k => { if (!k.air && !(k.fall > 0) && Math.hypot(k.x - o.x, k.y - o.y) < 74) hitBy(k, 'bang', o.by); });   // Böller: Zündschnur, dann Knall
        if (Math.hypot(me0.x - o.x, me0.y - o.y) < 600) { noise(.35, .22, 0, 0, 0, 260); S.shake = Math.max(S.shake, .25); } for (let j = 0; j < 22; j++) { const an = j / 22 * TAU, sp = rnd(80, 240); S.sp.push({x: o.x, y: o.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, c: pick(['#ffd23f', '#ff5a1f', '#fff', '#ff2a6a'])}); } return false; }
      if (o.stink) { ks.forEach(k => { if (ground(k) && o.by !== k && !k.remote && Math.hypot(k.x - o.x, k.y - o.y) < 58) { if (k.slowT < .45) { k.slowT = .45; k.slowE = '💨'; if (!k.sayT) { k.say = pick(['Wer war das?!', 'Boah, Marco!', 'Ich krieg keine Luft!']); k.sayT = 1.2; } } } }); return o.t > 0; }
      if (o.nut) { ks.forEach(k => { if (o.t > 0 && ground(k) && !k.remote && !(k.inv > 0) && Math.hypot(k.x - o.x, k.y - o.y) < 22 && !(o.by === k && o.t > 11)) { o.t = 0; if (k.vtype === 'trak') return; k.v *= .7; k.bump = .35; k.vr += rnd(-60, 60); floatTxt(k, '🥥 Bonk!', '#c8f08f'); if (k.me) { S.shake = Math.max(S.shake, .2); vib(20); noise(.08, .12, 500); } } }); return o.t > 0; }   // Kokosnuss vom Kokos-Karren: Bonk statt Dreher
      ks.forEach(k => { if (ground(k) && Math.hypot(k.x - o.x, k.y - o.y) < (o.beer ? 44 : 24) && !(o.by === k && (o.fire || o.t > (o.beer ? 7 : 11)))) { if (k.vtype === 'trak' && !o.fire) { if (k.me && !o.tk) { o.tk = 1; floatTxt(k, '🚜 Drübergerollt!', '#c8f08f'); } return; } if (o.beer || o.fire) { o.hk = o.hk || []; if (o.hk.includes(k)) return; o.hk.push(k); }   // Bier-/Feuerpfütze erwischt jedes Kart nur einmal (vorher drehte man sich darin mehrmals hintereinander)
        hitBy(k, o.beer ? 'beer' : o.fire ? 'fire' : o.puke ? 'puke' : o.banana ? 'banana' : 'oil', o.by); if (!o.beer && !o.fire) o.t = 0; } }); return o.t > 0; });
    S.brk.forEach(b => { if (b.dead >= 0) { if (S.t - b.dead > 20) b.dead = -1; return; } const k = ks.find(k0 => ground(k0) && !k0.remote && Math.hypot(k0.x - b.x, k0.y - b.y) < 26); if (k) brkBreak(b, k); });
    S.brkP = S.brkP.filter(q => { q.t += dt; const fr = Math.exp(-3.5 * dt); q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= fr; q.vy *= fr; q.r += q.vr * dt; q.vr *= fr; return q.t < 2.2; });
    S.deb = S.deb.filter(d => { d.t -= dt; ks.forEach(k => { if (ground(k) && !k.remote && Math.hypot(k.x - d.x, k.y - d.y) < 22 && k.slowT < .3) { k.slowT = .3; k.slowE = d.e; } }); return d.t > 0; });
    S.coatis = S.coatis.filter(c => { c.t -= dt; c.i += (c.uru ? 880 : c.golf ? 1250 : c.ball ? 1000 : c.flip ? 1150 : 560) / 6 * dt; const tl = c.tgt ? c.tgt.lat : c.l; c.l += clamp(tl - c.l, -90 * dt, 90 * dt);
      if (c.tgt && c.i > c.tgt.idx + (c.tgt.lap - c.by.lap) * N - 4) { c.x += (c.tgt.x - c.x) * Math.min(1, dt * 8); c.y += (c.tgt.y - c.y) * Math.min(1, dt * 8); } else [c.x, c.y] = at(c.i, c.l);
      const v = c.golf ? (c.tgt && ground(c.tgt) && Math.hypot(c.tgt.x - c.x, c.tgt.y - c.y) < 30 ? c.tgt : null) : ks.find(k => k !== c.by && ground(k) && Math.hypot(k.x - c.x, k.y - c.y) < 26); /* Golfball fliegt über alle hinweg, trifft nur das Ziel */ if (v) { hitBy(v, c.uru ? 'uru' : c.ball ? 'ball' : c.coco ? 'coco' : c.tro ? 'trolley' : c.flip ? 'flip' : c.cai ? 'caiman' : 'coati', c.by); return false; }
      // Kokos-Trio (kreisend) und Bananen (hinten) fangen Geschosse ab und verbrauchen dabei eins
      const gd = !c.golf && ks.find(k => k !== c.by && !k.remote && k.item && (k.item.orb || k.item.trail) && k.roll <= 0 && Math.hypot(k.x - c.x, k.y - c.y) < 46);
      if (gd) { const e0 = gd.item.e; gd.icnt = icnt(gd) - 1; if (gd.icnt <= 0) { gd.item = null; gd.icntFor = null; } floatTxt(gd, e0 + ' abgewehrt!', '#7fd3ff'); for (let j = 0; j < 8; j++) S.sp.push({x: c.x, y: c.y, vx: rnd(-120, 120), vy: rnd(-120, 120), t: 0, c: '#fff6c0'}); return false; }
      return c.t > 0; });
    // Kokos-Trio kreist um den Fahrer und rammt Gegner im Vorbeifahren
    ks.forEach(k => { if (k.remote || !k.item || !k.item.orb || k.roll > 0 || k.fall > 0) return; const n = icnt(k); for (let j = 0; j < n; j++) { const an = S.t * 5 + j * TAU / n, ox = k.x + Math.cos(an) * 34, oy = k.y + Math.sin(an) * 34;
      const v = ks.find(o => o !== k && ground(o) && o.spin <= 0 && o.inv <= 0 && Math.hypot(o.x - ox, o.y - oy) < 20); if (v) { hitBy(v, 'coco', k); k.icnt = n - 1; if (k.icnt <= 0) { k.item = null; k.icntFor = null; } break; } } });
    // Querläufer (Verkäufer, Nasenbären, Kaimane, Pferdekutsche, Hund)
    S.movers.forEach(m => { m.l += m.dir * m.speed * dt; if (Math.abs(m.l) > m.range) { m.dir *= -1; m.l = clamp(m.l, -m.range, m.range); } [m.x, m.y] = at(m.i, m.l);
      m.say = m.say > 0 ? m.say - dt : (Math.random() < dt * .2 ? 2 : 0);
      ks.forEach(k => { if (ground(k) && Math.hypot(k.x - m.x, k.y - m.y) < (m.kind === 'tram' || m.kind === 'bus' ? 44 : m.kind === 'tug' || m.kind === 'fork' ? 32 : m.kind === 'horse' ? 30 : 24) && k.spin <= 0) { hit(k, m.kind); if (m.kind === 'monkey') k.item = null; if (k.me && m.kind === 'vendor') say('vendor', 'Der Caipi-Verkäufer! Mitten auf der Strecke!'); } }); });
    // Tauben fliegen auf
    S.birds.forEach(b => { if (!b.f) { if (ks.some(k => Math.hypot(k.x - b.x, k.y - b.y) < 85)) { b.f = 1; const a = rnd(0, TAU); b.vx = Math.cos(a) * rnd(80, 160); b.vy = Math.sin(a) * rnd(80, 160); if (Math.hypot(ks[0].x - b.x, ks[0].y - b.y) < 120) SFX.birds(); } }
      else { b.f += dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.f > 9) { b.f = 0; b.x = b.x0; b.y = b.y0; } } });
    // Pfützen / Hochwasser (Paraty: Flut steigt und fällt)
    if (T.flood) { S.flood += dt; const f = (.75 + .45 * Math.sin(S.flood * TAU / 14)) * (S.floodX || 1); S.puddles.forEach(p => { p.r = p.r0 * f; }); if (f > 1.15 && !S.floodSaid) { S.floodSaid = 1; say('flood', 'Land unter!'); } if (f < .9) S.floodSaid = 0; }
    S.puddles.forEach(p => ks.forEach(k => { if (ground(k) && Math.hypot(k.x - p.x, k.y - p.y) < p.r) { if (!k.wet) { if (k.me) SFX.splash(); for (let j = 0; j < 6; j++) S.sp.push({x: k.x, y: k.y, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: '#bff3ff'}); } k.wet = .35; } }));
    // Delfine (Amazonas): springen auf, durchfahren = Turbo
    S.dolphins.forEach(d => { d.t += dt; d.cd = Math.max(0, d.cd - dt); const up = (d.t % 3.2) < 1.1;
      if (up && d.cd <= 0) ks.forEach(k => { if (k.dol <= 0 && Math.hypot(k.x - d.x, k.y - d.y) < 40) { k.boost = Math.max(k.boost, 1.1); k.dol = 2; d.cd = 1.2; if (k.me) { SFX.mini(2); ach('dolphin'); floatTxt(k, '🐬 Delfin-Turbo!', '#ff9ed2'); say('dolphin', 'Delfin-Turbo!'); } } }); });
    // Welle schwappt über die Uferstraße (Copacabana)
    if (T.wave) { const wv = S.wave; wv.next -= dt;
      if (wv.next < 2.2 && wv.next + dt >= 2.2) { wv.warn = 2.2; const p = ks[0]; if (p.x > T.wave.x0 - 500 && p.x < T.wave.x1 + 400 && p.y > 1050) say('wave', 'Achtung, die Welle!'); }
      wv.warn = Math.max(0, wv.warn - dt);
      if (wv.next <= 0 && !wv.on) { wv.on = 3.2; SFX.splash(); }
      if (wv.on > 0) { wv.on -= dt; const k2 = 1 - Math.abs(wv.on - 1.6) / 1.6; wv.h = 260 * (S.waveH || 1) * Math.sqrt(clamp(k2, 0, 1)); if (wv.on <= 0) { wv.on = 0; wv.h = 0; const ev0 = S.waveEvery || T.wave.every; wv.next = ev0 ? wrnd('wave', ev0[0], ev0[1]) : wrnd('wave', 12, 18); } }
      if (wv.h > 10) ks.forEach(k => { if (ground(k) && k.x > T.wave.x0 && k.x < T.wave.x1 && k.y > shore(k.x) - wv.h) { if (!k.wet && k.me) SFX.splash(); if (!k.wet) for (let j = 0; j < 6; j++) S.sp.push({x: k.x, y: k.y, vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0, c: '#bff3ff'}); k.wet = .35; } }); }
    // Ansager: Führungswechsel, Überholen
    if (S.t > 4 && !ks[0].done) { const lead = ks.slice().sort((a, b) => progress(b) - progress(a))[0];
      if (S.leader && lead !== S.leader) { if (lead === ks[0] && TRIP.kartvo && TRIP.kartvo.ann_lead && Math.random() < .5) say('ann_lead', '👑 Neuer Führender! Die anderen können ihr Testament schreiben.'); else say('lead_' + lead.id, NAME(lead.id) + ' übernimmt die Führung!'); if (lead === ks[0] && performance.now() - (S.hymnAt || -1e9) > 25000) { S.hymnAt = performance.now(); hymn(lead.id); } } S.leader = lead;
      const pl = place(ks[0]); if (pl < S.lastPlace && S.rep) S.rep.ov += S.lastPlace - pl; if (pl < S.lastPlace && Math.random() < .85) { Math.random() < .8 ? voice(ks[0], 'over') : say('over', 'Überholt!'); }
      else if (pl > S.lastPlace && Math.random() < .75) { const by = ks.find(o => o !== ks[0] && place(o) === pl - 1); if (by) voice(by, 'over'); }
      S.lastPlace = pl; }
    // Gezänk (Wunsch Patrick 09.10.: die Figuren sollen sich die ganze Zeit beschimpfen): sobald gerade niemand redet, pöbelt alle ~2–3,5 s ein Fahrer in Sichtweite
    // seinen nächsten Nachbarn an (meist der vordere den hinteren), bevorzugt rund um den Spieler und abwechselnd verschiedene Fahrer
    if (S.t > 2.5 && !ks[0].done && !S.pod && S.t > (S.talkAt || 0)) { const nw = performance.now(); if (nw > voiceBusy && nw > annBusy) { S.talkAt = S.t + rnd(1.8, 3.4); const me0 = ks[0], vis = ks.filter(k => !k.done && !k.out && !(k.fall > 0) && Math.hypot(k.x - me0.x, k.y - me0.y) < 650);
        let best = null, bd = 1e9; vis.forEach(a => vis.forEach(b => { if (a === b) return; const d = Math.hypot(a.x - b.x, a.y - b.y) + (a.me || b.me ? -120 : 0) + ((a.vAt || 0) > nw - 6000 ? 260 : 0); if (d < bd) { bd = d; best = [a, b]; } }));
        if (best && bd < 420) { const [a, b] = best, front = progress(a) >= progress(b) ? a : b, sp = Math.random() < .7 ? front : (front === a ? b : a), ks0 = sp === front ? ['pass', 'over'] : ['drift', 'item', 'hit'], kd = Math.random() < .4 ? 'talk' : pick(ks0.filter(x => x !== sp.lastKind).concat(ks0.length === 1 ? ks0 : []));   /* 40 % allgemeine Sprüche */
          voice(sp, kd); sp.vAt = nw; } } }
    if (S.t > 1.2 && S.t - dt <= 1.2 && T.id === 'iguacu') { const m = S.movers[0]; if (m) say('coatis', 'Die Nasenbären sind los!'); }
    S.flash = Math.max(0, S.flash - dt);
    // Seitenwind auf der Brücke: Böen schieben alle zur Seite
    if (T.wind && S.t > 0) { const w0 = S.wind || (S.wind = {next: wrnd('wind', 4, 7), on: 0, dir: 1, warn: 0}); w0.next -= dt; if (w0.next < 1.2 && !w0.on) w0.warn = 1; if (w0.next < 0 && !w0.on) { w0.on = 1.6; w0.dir = wr('wind') < .5 ? -1 : 1; w0.warn = 0; noise(1.6, .12, 300); }
      if (w0.on > 0) { w0.on -= dt; ks.forEach(k => { if (!k.air) k.vr += w0.dir * 150 * (S.windEvery ? 1.12 : 1) * dt; }); if (w0.on <= 0) { w0.on = 0; w0.next = wrnd('wind', (S.windEvery || T.wind.every)[0], (S.windEvery || T.wind.every)[1]); } } }
    // Tropengewitter: zieht auf, Regen, Blitze, Donner, rutschiger, neue Pfützen auf der Strecke
    { const st = S.storm; if (st.at > 0 && S.t > st.at) { st.f = Math.min(1, st.f + dt / 4);
        if (!st.said) { st.said = 1; say('storm', 'Tropengewitter! Achtung, rutschig!'); }
        st.next -= dt; if (st.next < 0 && st.f > .6) { st.next = wrnd('storm', 2.5, 6); S.flash = Math.max(S.flash, .35); st.bolt = .25; setTimeout(() => { if (S) noise(1.6, .22, 0, 0, 0, 90); }, rnd(150, 700)); }
        st.bolt = Math.max(0, (st.bolt || 0) - dt);
        if (st.f > .7 && st.pud < 6) { st.pud++; const k0 = S.karts[0], [x, y] = S.seed ? at(wr('storm') * N, wrnd('storm', -TW * .3, TW * .3)) : at(k0.idx + rnd(40, 160), rnd(-TW * .3, TW * .3)); S.puddles.push({x, y, r: 0, r0: wrnd('storm', 26, 40), grow: 1}); } }
      S.puddles.forEach(p0 => { if (p0.grow && p0.r < p0.r0) p0.r = Math.min(p0.r0, p0.r + dt * 20); }); } S.coins.forEach(c => { if (c.off > 0) c.off -= dt; });
    if (T.fw) { S.fwT -= dt; if (S.fwT < 0) { S.fwT = rnd(.6, 1.4) / (S.fwX || 1); const n0 = S.fw.length; fwBurst(); S.fw.slice(n0).forEach(p0 => { p0.t = 0; }); noise(.4, .05, 0, 0, 0, 120); } }
    S.fx = S.fx.filter(f => (f.t += dt) < (f.dust ? .5 : f.txt ? 1.3 : 1));
    S.sp = S.sp.filter(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; return p.t < (p.big ? .9 : .45); }); if (S.rings) S.rings = S.rings.filter(r => (r.t += dt) < .45);
    ks.forEach(k => { if (k.boost > 0 && Math.random() < dt * 25) S.sp.push({x: k.x - Math.cos(k.a) * 26, y: k.y - Math.sin(k.a) * 26, vx: -Math.cos(k.a) * 80, vy: -Math.sin(k.a) * 80, t: .15, c: '#ffb13b'}); });
    { const k = ks[0]; if (S.t > 0 && !k.done && k.v > 150 && !k.air) { const o = ks.find(o => o !== k && !o.out && (d => d > 26 && d < 190)(Math.hypot(o.x - k.x, o.y - k.y)) && Math.abs(angd(Math.atan2(o.y - k.y, o.x - k.x), k.a)) < .26 && Math.abs(angd(o.a, k.a)) < .5);
        k.draftOn = !!o; S.draft = o ? (S.draft || 0) + dt * (k.vtype === 'moto' ? 2 : 1) : Math.max(0, (S.draft || 0) - dt * 2); if (S.draft > .9) { S.draft = 0; k.boost = Math.max(k.boost, .85); floatTxt(k, '💨 Windschatten!', '#bfe8ff'); vib(15); } } else k.draftOn = false; }
    ks.forEach(k => { if (!(k.flameT > 0) || k.remote) return; k.flameT -= dt; k.flameD = (k.flameD || 0) - dt; if (k.flameD <= 0) { k.flameD = .12; const x = k.x - Math.cos(k.a) * 30, y = k.y - Math.sin(k.a) * 30; S.oils.push({x, y, t: 6, by: k, fire: 1}); if (S.live) liveEmit({t: 'oil', race: S.live.id, x: Math.round(x), y: Math.round(y), fire: 1}); } });
    // Rennbericht: Werte des eigenen Fahrers sammeln (Drift-, Neben-der-Strecke- und Führungszeit, Top-Speed, bester Platz)
    { const k = ks[0], R = S.rep; if (R && k && !k.remote && S.t > 0 && !k.done) { R.tT += dt; if (k.dr) R.drT += dt; if (!k.air && !k.onCut && Math.abs(k.lat) > TW / 2 + 4) R.offT += dt; R.top = Math.max(R.top, Math.hypot(k.v, k.vr) * .45); const pl0 = place(k); if (pl0 === 1) R.leadT += dt; R.bestPl = Math.min(R.bestPl, pl0); } }
    // Falsche Richtung (Wunsch Patrick 09.10. spät): fährt der Spieler ~1,3 s gegen die Fahrtrichtung, steht groß „FALSCHE RICHTUNG“ mit Wende-Pfeil im Bild
    { const k = ks[0]; if (k && !k.remote) { const a0 = P[wrap(k.idx - 5)], b0 = P[wrap(k.idx + 5)], td = Math.atan2(b0[1] - a0[1], b0[0] - a0[0]), off = Math.abs(angd(k.mv, td)), ok = S.t > 0 && !k.done && !k.air && !k.fall && !(k.spin > 0) && !k.onCut && !(k.bus > 0) && k.v > 40;
        if (ok && off > 1.95) k.wwT = Math.min(2, (k.wwT || 0) + dt); else if (!ok || off < 1.4) k.wwT = Math.max(0, (k.wwT || 0) - dt * (ok ? 2.5 : 1));
        const on = k.wwT > 1.3 || (S.ww && k.wwT > .35);
        if (on) { if (!S.ww) { S.ww = {t0: performance.now(), bp: 0}; S.wwN = (S.wwN || 0) + 1; vib([40, 60, 40]); } S.ww.turn = angd(td, k.a) > 0 ? 1 : -1; S.ww.bp -= dt; if (S.ww.bp <= 0) { S.ww.bp = 1.5; beep(620, .11, 'square', .05); setTimeout(() => beep(440, .16, 'square', .05), 140); } }
        else S.ww = null; } }
    lapxStep();
    evStep(dt);
    if (S.live && S.karts[0]) liveSend(S.karts[0]);
    if (S.tut && S.t > 0) { const st = TUT[S.tut.i]; if (S.tut.t0 === undefined) S.tut.t0 = S.t; if (st && (st.ok(S.karts[0]) || (S.tut.i < TUT.length - 1 && S.t - S.tut.t0 > 30))) { S.tut.i++; S.tut.t0 = S.t; S.tut.ok = performance.now(); SFX.pick(); vib(20); } }
    if (S.pose && S.pose.live) { const wn = S.karts.filter(o => o.done && !o.out).sort((x, y) => x.done - y.done)[0]; if (wn) S.pose.id = wn.id; }
    if (S.live && S.over > 0 && S.over - dt <= 0 && S.karts.some(o => o.remote && o.aiIdx === undefined && !o.done && (o.gone || 0) < 5) && (S.liveWait = S.t - (S.liveW0 = S.liveW0 || S.t)) < 30) S.over = .3;   // max. 30 s echte Wartezeit (vorher zählte nur ein Bild je 0,3 s)
    if (S.over > 0) { S.over -= dt; if (S.over <= 0) finish(); }
    // Motor
    const p = ks[0]; if (eng && AC) { const gs = 95, gear = Math.min(4, Math.floor(Math.max(0, p.v) / gs)), rpm = (Math.max(0, p.v) - gear * gs) / gs, base = T.veh === 'cart' && p.vtype === 'cart' ? 90 : T.veh === 'boat' ? 42 : 52;
      const fr = base + gear * 9 + rpm * 70 + (p.boost > 0 ? 35 : 0) + (p.air > 0 ? 40 : 0), now = AC.currentTime;
      eng.o.frequency.setTargetAtTime(fr, now, .04); eng.o2.frequency.setTargetAtTime(fr * .5, now, .04); eng.sub.frequency.setTargetAtTime(fr * .5, now, .04);
      eng.f.frequency.setTargetAtTime(380 + p.v * 2.2 + (p.boost > 0 ? 600 : 0), now, .06);
      eng.g.gain.setTargetAtTime(S.over > 0 || p.done ? .0 : (T.veh === 'cart' && p.vtype === 'cart' ? .012 : .028), now, .1);
      const slide = !p.air && T.veh !== 'boat' && !p.done ? clamp((Math.abs(p.vr) - 50) / 160, 0, 1) + (p.dr ? .5 : 0) : 0; eng.sg.gain.setTargetAtTime(Math.min(.05, slide * .04), now, .05); eng.sf.frequency.setTargetAtTime(2200 + p.v * 2, now, .1); }
  }
  // echte Rakete: ein Zentrum, Funkenkreis in einer Farbe (Réveillon-Himmel)
  function fwBurst() { const cx = rnd(.12, .88), cy = rnd(.1, .38), c = pick(['#ffd23f', '#ff4d4d', '#3fa7ff', '#3ccf6e', '#ff5fa2', '#fff']), n = 20, v0 = rnd(120, 175); for (let j = 0; j < n; j++) { const a = j / n * TAU + rnd(-.08, .08), v = v0 * rnd(.85, 1.08); S.fw.push({x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, c}); } }
  function fireworks(n) { for (let j = 0; j < n; j++) { const cx = rnd(.15, .85), cy = rnd(.12, .45), c = pick(['#ffd23f', '#ff4d4d', '#3fa7ff', '#3ccf6e', '#ff5fa2', '#fff']), a = rnd(0, TAU), v = rnd(60, 260);
    S.fw.push({x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: -Math.floor(j / 14) * .45, c}); } }

  /* ---- Zeichnen ---- */
  const camY = () => H * (W > H ? .56 : .66);
  // Brücke (Acht): Fahrbahn der zweiten Durchfahrt mit Schatten, Geländer und Pfeilern über der ersten
  function drawDeck(phi) { const D = DECK; ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = TW + 40; ctx.save(); ctx.translate(14, 18); ctx.stroke(D.pth); ctx.restore();
    ctx.strokeStyle = '#d8d4cc'; ctx.lineWidth = TW + 26; ctx.stroke(D.pth); ctx.strokeStyle = '#6b6e74'; ctx.lineWidth = TW + 2; ctx.stroke(D.pth);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.setLineDash([26, 22]); ctx.stroke(D.pth); ctx.setLineDash([]);
    [-1, 1].forEach(sd => { ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 4; ctx.beginPath(); for (let q = 0; q <= D.len; q++) { const [x, y] = at(D.i0 + q, sd * (TW / 2 + 8)); q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); });
    const [mx, my] = at(D.i0 + 6, -(TW / 2 + 30)); ctx.translate(mx, my); ctx.rotate(-phi); ctx.fillStyle = '#ffd23f'; ctx.font = '900 22px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌉 Minhocão', 0, 0); ctx.restore(); }
  // Tunnel: halbdurchsichtiges Dach mit Lampen, Portale mit Namen; drinnen sieht man die Karts nur gedämpft
  function drawTunnels(tt, phi) { TUN.forEach(U => { ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.globalAlpha = .78; ctx.strokeStyle = '#3a3d44'; ctx.lineWidth = TW + 60; ctx.stroke(U.pth);
      ctx.globalAlpha = .55; ctx.strokeStyle = '#2a2c31'; ctx.lineWidth = TW - 10; ctx.stroke(U.pth); ctx.globalAlpha = 1;
      for (let q = 6; q < U.len; q += 14) { const [x, y] = at(U.i0 + q, 0); const fl = .75 + .25 * Math.sin(tt * 6 + q); ctx.fillStyle = `rgba(255,214,120,${.85 * fl})`; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
      [0, U.len].forEach((q, e) => { const a0 = at(U.i0 + q, -(TW / 2 + 34)), a1 = at(U.i0 + q, TW / 2 + 34); ctx.strokeStyle = '#c9c2b4'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
        if (!e) { ctx.save(); const [lx, ly] = at(U.i0 - 8, TW / 2 + 60); ctx.translate(lx, ly); ctx.rotate(-phi); ctx.fillStyle = 'rgba(20,20,30,.85)'; ctx.font = '900 20px system-ui,sans-serif'; ctx.textAlign = 'center'; const w = ctx.measureText('🚇 ' + U.nm).width + 18; ctx.fillRect(-w / 2, -18, w, 30); ctx.fillStyle = '#ffd23f'; ctx.fillText('🚇 ' + U.nm, 0, 4); ctx.restore(); } });
      ctx.restore(); }); }
  // Echte Dunkelheit (Stromausfall, Nachtfahrt, Nacht): schwarze Ebene, aus der die Scheinwerfer-Kegel aller Karts ausgeschnitten werden
  let DK = null;
  function darkness(alpha, sc, phi) {
    // in 35 % Auflösung: weiche Verläufe, spart bei Nacht bis zu 90 % Rechenzeit
    const DKS = .35; if (!DK) DK = document.createElement('canvas'); if (DK.width !== Math.round(W * DKS) || DK.height !== Math.round(H * DKS)) { DK.width = Math.round(W * DKS); DK.height = Math.round(H * DKS); }
    const d = DK.getContext('2d'); d.setTransform(DKS, 0, 0, DKS, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H); d.fillStyle = `rgba(3,6,18,${alpha})`; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    S.karts.forEach(k => { if (k.out) return; const p = toScreen(k.x, k.y, sc, phi); if (p[0] < -400 || p[0] > W + 400 || p[1] < -400 || p[1] > H + 400) return;
      const L = (k.me ? 380 : 210) * sc, q = toScreen(k.x + Math.cos(k.a) * 100, k.y + Math.sin(k.a) * 100, sc, phi), an = Math.atan2(q[1] - p[1], q[0] - p[0]), spr = k.me ? .5 : .38;
      let g = d.createRadialGradient(p[0], p[1], 8, p[0], p[1], L); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.beginPath(); d.moveTo(p[0], p[1]); d.arc(p[0], p[1], L, an - spr, an + spr); d.closePath(); d.fill();
      g = d.createRadialGradient(p[0], p[1], 4, p[0], p[1], (k.me ? 48 : 30) * sc); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.beginPath(); d.arc(p[0], p[1], (k.me ? 48 : 30) * sc, 0, TAU); d.fill();
      if (k.boost > 0 || k.fire > 0) { const r = toScreen(k.x - Math.cos(k.a) * 30, k.y - Math.sin(k.a) * 30, sc, phi); g = d.createRadialGradient(r[0], r[1], 2, r[0], r[1], 46 * sc); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.beginPath(); d.arc(r[0], r[1], 46 * sc, 0, TAU); d.fill(); } });
    d.globalCompositeOperation = 'source-over';
    ctx.drawImage(DK, 0, 0, W, H);
    // Rücklichter bleiben sichtbar, damit man die Gegner im Dunkeln ahnt
    S.karts.forEach(k => { if (k.me || k.out) return; const r = toScreen(k.x - Math.cos(k.a) * 26, k.y - Math.sin(k.a) * 26, sc, phi); ctx.fillStyle = 'rgba(255,40,40,.9)'; ctx.beginPath(); ctx.arc(r[0], r[1], 3, 0, TAU); ctx.fill(); });
  }
  const OBE = {car: '🚗', van: '🚐', crate: '📦', umbrella: '⛱️', log: '🪵', suitcase: '🧳', stone: '🪨', nut: '🥥', cone: '🚧', champ: '🍾', stall: '🍉', table: '🪑', barrel: '🛢️', fish: '🐟', cart: '🛒'}, MVE = {jogger: '🏃', bike: '🚴', skate: '🛹', tug: '🚚', fork: '🚜', bus: '🚌', soccer: '⚽', vendor: null, corn: '🌽', coati: '🦝', caiman: '🐊', horse: '🐴', dog: '🐕', tram: '🚋', moto: '🛵', monkey: '🐒'};
  const MVSAY = {jogger: 'Bom dia!', bike: 'Trimm trimm!', skate: 'Radical!', tug: 'Gepäck kommt!', fork: 'Bip bip bip!', bus: 'Fiiiip!', soccer: 'Gooool!', tram: 'Plim plim!', moto: 'Saaai da frente!', monkey: 'Uh uh uh!', vendor: 'Olha o Caipi! 🍹', corn: 'Milho verde! 🌽', horse: 'Ôa, ôa!', dog: 'Wuff!', caiman: '…', coati: '!!'};
  function draw() {
    const k0 = S.karts[0], nowT = performance.now() / 1000, cdt = clamp(nowT - (S.camT || nowT), 0, .05); S.camT = nowT;
    const spd = Math.hypot(k0.v, k0.vr), zt = S.intro ? introZoom(S.intro.t) : S.grid ? .82 : 1 - clamp((spd - 250) / 700, 0, .14) - (k0.boost > 0 ? .03 : 0) - hgt(k0.idx) * .1;   /* oben auf dem Berg etwas mehr Weitblick; Vorschau = weit raus */ S.zoom += (zt - S.zoom) * (1 - Math.exp(-cdt * (S.intro ? 6 : 3)));
    const sc = Math.min(W, H) / (W > H ? 380 : 390) * S.zoom * [1.12, 1, .86][SET.cam] * (window.__kzoom || 1);   // __kzoom nur für Tests (Nahaufnahme)
    // Kamera folgt weich: Blickrichtung zwischen Nase und Fahrtrichtung, Vorausblick in Fahrtrichtung
    const la = k0.done ? 0 : 1, wantA = k0.a + angd(k0.mv, k0.a) * .45, kr = 1 - Math.exp(-cdt * 6), kp = 1 - Math.exp(-cdt * 14);
    if (S.intro) { const it = S.intro, i = it.i0 + introU(it.t) * N, [x, y] = at(i, 0), [xa, ya] = at(i - 8, 0), [xb, yb] = at(i + 16, 0), q = 1 - Math.exp(-cdt * 9);   // Strecken-Vorschau: Kamera fliegt eine Runde ab
      S.camA += angd(Math.atan2(yb - ya, xb - xa), S.camA) * (1 - Math.exp(-cdt * 3.5)); S.camX += (x - S.camX) * q; S.camY += (y - S.camY) * q; }
    else if (S.grid) { let cx = 0, cy = 0; S.karts.forEach(k => { cx += k.x; cy += k.y; }); cx /= S.karts.length; cy /= S.karts.length; const off = H * .17 / sc;   // Auslosung: ganzes Startfeld in der oberen Bildhälfte (unten steht die Tafel)
      S.camA += angd(k0.a, S.camA) * kr; S.camX += (cx - Math.cos(k0.a) * off - S.camX) * kp; S.camY += (cy - Math.sin(k0.a) * off - S.camY) * kp; }
    else { S.camA += angd(wantA, S.camA) * kr;
    S.camX += (k0.x + Math.cos(k0.mv) * spd * .12 * la - S.camX) * kp; S.camY += (k0.y + Math.sin(k0.mv) * spd * .12 * la - S.camY) * kp; }
    const phi = -Math.PI / 2 - S.camA, sh = S.shake > 0 ? S.shake * 18 : 0, tt = performance.now() / 1000;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#0b5d8f'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2 + rnd(-sh, sh), camY() + rnd(-sh, sh)); ctx.scale(sc, sc); ctx.rotate(phi); ctx.translate(-S.camX, -S.camY);
    // außerhalb der Karte: passende Fläche
    const outer = {gru: '#c4c8ce', bridge: '#0b4a6e', manaus: '#34383d', lopes: '#f6ead0', guaruja: '#f1d9a2', copa: '#f1d9a2', reveillon: '#f1d9a2', ilha: '#ecd7a4', iguacu: '#2d6b35', amazon: '#1e5a2c', paraty: '#b9b1a3', sp: '#7d8187', cristo: '#2f7a3a'}[T.id];
    ctx.fillStyle = outer; ctx.fillRect(-3000, -3000, WW + 6000, WH + 6000); if (T.sea) { ctx.fillStyle = '#1694b8'; ctx.fillRect(-3000, shore(0) - 20, WW + 6000, WH + 3000); }
    ctx.drawImage(BG, 0, 0, WW, WH);
    const nz = Math.max(1, 1 / S.zoom), near = (x, y, r) => Math.abs(x - S.camX) < (r || 760) * nz && Math.abs(y - S.camY) < (r || 760) * nz;   // weiter rausgezoomt (Vorschau): größerer Sichtbereich
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
    if (S.marks.length) { ctx.strokeStyle = 'rgba(40,30,25,.32)'; ctx.lineWidth = 4; ctx.lineCap = 'butt'; ctx.beginPath(); S.marks.forEach(m => { if (Math.abs(m[2] - m[0]) + Math.abs(m[3] - m[1]) > 60 || !near(m[0], m[1])) return; ctx.moveTo(m[0], m[1]); ctx.lineTo(m[2], m[3]); }); ctx.stroke(); }   /* nur sichtbare, kurze Stücke (lange Sprünge nach Rettung/Neustart kosteten bis 25 ms) */
    const up = (x, y, img, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-phi); ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); ctx.restore(); };
    // Wackelkopf: Kopf neigt sich in Kurven, wippt mit dem Tempo, staucht bei der Landung (Drehpunkt = Hals)
    const upB = (x, y, img, s, r, q) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-phi); ctx.translate(0, img.height * s * .42); ctx.rotate(r); ctx.scale(1 / Math.sqrt(q), q); ctx.drawImage(img, -img.width * s / 2, -img.height * s * .92, img.width * s, img.height * s); ctx.restore(); };
    // Fahrer im Sitz (im gedrehten Fahrzeug-Koordinatensystem): Schultern im Shirt, Arme zum Lenkrad bzw. Lenker, bei Drehern und im Ziel Arme hoch
    function rider(k, tt) { const st = STY[k.id] || {}, seat = T.veh === 'boat' ? 'bar' : VSEAT[k.vtype] || st.seat || 'wheel'; if (seat === 'none') return;
      const col = (LOOK[k.id] || {}).shirt || '#00a651', fat = st.fat ? 1.4 : 1, skin = st.skin || '#e8b48a', sy = 9, wy = -6, sw = k.steer * .7;
      if (seat === 'wheel') { ctx.save(); ctx.translate(0, wy); ctx.rotate(sw); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-5.5, 0); ctx.lineTo(5.5, 0); ctx.stroke(); ctx.restore(); }
      else { ctx.save(); ctx.translate(0, wy - 2); ctx.rotate(sw * .5); ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); ctx.restore(); }
      const up0 = k.spin > 0 || (k.done && !k.out), hl = seat === 'wheel' ? 5.5 : 8.5;
      ctx.lineCap = 'round'; [-1, 1].forEach(sd => { let hx, hy; if (up0) { hx = sd * 14; hy = sy - 13 + Math.sin(tt * 18 + sd) * 2; } else { const a = sw * (seat === 'wheel' ? 1 : .5); hx = sd * hl * Math.cos(a); hy = wy - (seat === 'wheel' ? 0 : 2) + sd * hl * Math.sin(a); }
        ctx.strokeStyle = col; ctx.lineWidth = 3.6 * (fat > 1 ? 1.25 : 1); ctx.beginPath(); ctx.moveTo(sd * 8.5 * fat, sy - 2); ctx.lineTo(hx, hy); ctx.stroke(); ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, 2.3, 0, TAU); ctx.fill(); });
      ctx.lineCap = 'butt'; ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, sy, 11 * fat, 6.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-2, sy - 2, 7 * fat, 2.5, 0, 0, TAU); ctx.fill(); }
    // Zuschauer (winken, springen, wenn du vorbeifährst)
    SPECT.forEach(s => { if (!near(s.x, s.y)) return; const close = Math.hypot(k0.x - s.x, k0.y - s.y) < 160, j = close ? Math.abs(Math.sin(tt * 9 + s.ph)) * 6 : 0, w = Math.sin(tt * (close ? 12 : 4) + s.ph);
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(-phi); ctx.scale(1 + j / 30, 1 + j / 30); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(3, 10, 9, 5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = s.s; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-12, -10 - w * 5 - j); ctx.moveTo(6, -2); ctx.lineTo(12, -10 + w * 5 - j); ctx.stroke();
      ctx.fillStyle = s.c; ctx.beginPath(); ctx.ellipse(0, 2 - j, 8, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = s.s; ctx.beginPath(); ctx.arc(0, -10 - j, 6, 0, TAU); ctx.fill(); ctx.restore(); });
    (S.rings || []).forEach(r => { const p = r.t / .45; ctx.strokeStyle = `hsla(${(r.t * 900 + 280) % 360},100%,62%,${(1 - p) * .85})`; ctx.lineWidth = 7 * (1 - p) + 2; ctx.beginPath(); ctx.arc(r.x, r.y, 30 + p * 150, 0, TAU); ctx.stroke(); });   // Bass-Stoß vom Trio Elétrico
    S.oils.forEach(o => { if (o.nut) { if (near(o.x, o.y)) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(o.x + 3, o.y + 4, 11, 8, 0, 0, TAU); ctx.fill(); up(o.x, o.y, E('🥥', 22), .95); } return; } if (o.stink) { const a = .35 * Math.min(1, o.t); for (let j = 0; j < 5; j++) { const an = tt * .8 + j * 1.26; ctx.fillStyle = `rgba(130,190,60,${a})`; ctx.beginPath(); ctx.arc(o.x + Math.cos(an) * 22, o.y + Math.sin(an) * 18, 24 + 4 * Math.sin(tt * 3 + j), 0, TAU); ctx.fill(); } if (near(o.x, o.y)) up(o.x, o.y - 10 - Math.sin(tt * 4) * 5, E('💨', 26), .9); return; }
      if (o.puke) { ctx.fillStyle = 'rgba(190,200,70,.85)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 20, 15, o.x % 3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(150,120,40,.6)'; [[-6, -3], [5, 4], [2, -6]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(o.x + a, o.y + b, 3, 0, TAU); ctx.fill(); }); return; }
      if (o.fire) { const fl = .7 + .3 * Math.sin(tt * 20 + o.x); ctx.fillStyle = `rgba(255,${90 + 60 * fl | 0},20,${.55 * Math.min(1, o.t)})`; ctx.beginPath(); ctx.ellipse(o.x, o.y, 22, 16, 0, 0, TAU); ctx.fill(); if (near(o.x, o.y)) up(o.x, o.y - 6, E('🔥', 26), .8 + .2 * fl); return; } if (o.beer) { ctx.fillStyle = 'rgba(255,250,235,.9)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 46, 36, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(240,190,60,.55)'; ctx.beginPath(); ctx.ellipse(o.x + 5, o.y + 3, 31, 22, 0, 0, TAU); ctx.fill(); up(o.x, o.y, E('🍺', 26), 1); return; }
      if (o.banana) { if (near(o.x, o.y)) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(o.x + 3, o.y + 4, 14, 8, 0, 0, TAU); ctx.fill(); up(o.x, o.y, E('🍌', 24), .95); } return; }
      if (o.bang) { if (near(o.x, o.y)) { up(o.x, o.y, E('🧨', 24), 1 + (.9 - o.bang) * .5); if (Math.floor(tt * 14) % 2) { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(o.x + 9, o.y - 12, 4, 0, TAU); ctx.fill(); } ctx.strokeStyle = 'rgba(255,60,40,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, 74, 0, TAU); ctx.stroke(); } return; }
      ctx.fillStyle = 'rgba(255,240,170,.85)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 22, 16, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(o.x - 6, o.y - 4, 7, 4, 0, 0, TAU); ctx.fill(); up(o.x, o.y, E('🧴', 22), .8); });
    S.deb.forEach(d => { if (near(d.x, d.y)) { ctx.globalAlpha = Math.min(1, d.t); up(d.x, d.y, E(d.e, 16), .8); ctx.globalAlpha = 1; } });
    S.brk.forEach(b => { if (b.dead >= 0 || !near(b.x, b.y)) return; const K = BRKK[b.kind];
      if (b.kind === 'chair') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-13, -6, 30, 16); K.c.forEach((c, n) => { ctx.fillStyle = c; ctx.fillRect(-15 + n * 10, -8, 10, 16); }); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2; ctx.strokeRect(-15, -8, 30, 16); ctx.restore(); return; }
      if (b.kind === 'box') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a + .3); [[-9, -9], [9, -7], [0, 8]].forEach(([a, c0], n) => { ctx.fillStyle = K.c[n]; ctx.fillRect(a - 9, c0 - 9, 18, 18); ctx.strokeStyle = 'rgba(60,30,10,.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(a - 9, c0 - 9, 18, 18); ctx.beginPath(); ctx.moveTo(a - 9, c0); ctx.lineTo(a + 9, c0); ctx.stroke(); }); ctx.restore(); return; }
      if (b.kind === 'fruit') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-20, -11, 40, 22); ctx.fillStyle = '#ffd23f'; ctx.fillRect(-20, -11, 40, 4); ctx.restore(); up(b.x - 8, b.y, E('🍉', 18), 1); up(b.x + 8, b.y - 3, E('🍍', 16), 1); up(b.x + 2, b.y + 6, E('🥭', 13), 1); return; }
      if (b.kind === 'coco') { [[-9, 5], [0, 5], [9, 5], [-4.5, -2], [4.5, -2], [0, -9]].forEach(([a, c0]) => up(b.x + a * Math.cos(-phi) - c0 * Math.sin(-phi), b.y + a * Math.sin(-phi) + c0 * Math.cos(-phi), E('🥥', 14), 1)); } });
    S.brkP.forEach(q => { if (!near(q.x, q.y)) return; ctx.globalAlpha = clamp(2.2 - q.t, 0, 1); if (q.e) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); const im = E(q.e, 14); ctx.drawImage(im, -7, -7, 14, 14); ctx.restore(); } else { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillStyle = q.c; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); } ctx.globalAlpha = 1; });
    S.obst.forEach(o => { if (!near(o.x, o.y)) return; const im = E(OBE[o.kind] || '🥥', 30), s0 = o.kind === 'umbrella' ? 1.3 : o.kind === 'car' || o.kind === 'van' ? 1.45 : o.kind === 'crate' && o.drop !== undefined ? 1.5 : 1;
      if (o.drop !== undefined && S.t - o.drop < .7) { const p = clamp((S.t - o.drop) / .7, 0, 1), s1 = s0 * (1 + (1 - p) * 1.3); ctx.fillStyle = 'rgba(0,0,0,' + (.08 + p * .22) + ')'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 6 + 12 * p, 4 + 6 * p, 0, 0, TAU); ctx.fill();   // fällt von oben: Schatten wächst, Bild schrumpft auf
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(-phi); ctx.globalAlpha = .4 + .6 * p; ctx.drawImage(im, -im.width * s1 / 2, -im.height * s1 / 2 - (1 - p) * 150, im.width * s1, im.height * s1); ctx.restore(); }
      else up(o.x, o.y, im, s0); });
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
    const onDeck = k => DECK && wrap(k.idx - DECK.i0) <= DECK.len, KORD = S.karts.slice().sort((a, b) => (a.air > 0) - (b.air > 0) || a.y - b.y);
    const KD = k => {
      const z = k.air > 0 ? Math.sin(Math.PI * (1 - k.air / k.airT)) : 0, he = k.fall > 0 ? 0 : hgt(k.idx), s = (1 + z * .38) * (1 + he * .2), tr = k.trick && k.air > 0 ? (1 - k.air / k.airT) * TAU : 0;   // he = Höhe: oben größer, Schatten weiter weg
      ctx.save(); ctx.translate(k.x, k.y); ctx.fillStyle = `rgba(0,0,0,${.25 - z * .12 - he * .05})`; ctx.beginPath(); ctx.ellipse(3 + z * 16 + he * 14, 4 + z * 16 + he * 14, 20 * (1 - z * .2), 26 * (1 - z * .2), k.a + Math.PI / 2, 0, TAU); ctx.fill();
      const vz = (k.vsz || 1) * (k.zap > 0 ? .6 : 1); ctx.scale(s * vz, s * vz); ctx.rotate(k.a + Math.PI / 2 + k.rot + k.yaw + tr + (k.bump > 0 ? Math.sin(k.bump * 40) * .25 * k.bump : 0) + (k.jolt > 0 ? Math.sin(k.jolt * 55) * .55 * k.jolt : 0) + clamp(k.vr / 900, -.12, .12)); if (k.squash > 0) ctx.scale(1 + k.squash * .5, 1 - k.squash * .35);
      if (k.boost > 0 && VNOX[k.vtype]) { ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(rnd(-9, 9), 26 + j * 9 + Math.random() * 6, 5 + j * 2.2, 0, TAU); ctx.fill(); } }   // ohne Motor: Staubwolken statt Flamme
      else if (k.boost > 0) { const fl = 40 + Math.random() * 18; ctx.fillStyle = 'rgba(255,90,0,.55)'; ctx.beginPath(); ctx.moveTo(-11, 24); ctx.quadraticCurveTo(0, fl + 14, 11, 24); ctx.fill(); ctx.fillStyle = `rgba(255,${190 + Math.random() * 60 | 0},60,.95)`; ctx.beginPath(); ctx.moveTo(-6, 24); ctx.quadraticCurveTo(0, fl, 6, 24); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(-3, 24); ctx.quadraticCurveTo(0, fl * .7, 3, 24); ctx.fill(); }
      if (k.stall > 0) { ctx.fillStyle = 'rgba(120,120,120,.6)'; ctx.beginPath(); ctx.arc(rnd(-6, 6), 34 + rnd(0, 8), 9, 0, TAU); ctx.fill(); }
      if (k.glow > 0) { ctx.fillStyle = `rgba(255,70,30,${.35 + .2 * Math.sin(tt * 20)})`; ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fill(); }
      if (k.inv > 0) { ctx.strokeStyle = `hsl(${tt * 600 % 360},90%,60%)`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke(); }
      const fw = k.fw === undefined ? FW[k.vtype] : k.fw; if (fw) { ctx.fillStyle = '#111'; fw.forEach(([wx, wy]) => { ctx.save(); ctx.translate(wx, wy); ctx.rotate(k.steer * .5); ctx.fillRect(-3, -7, 6, 14); ctx.restore(); }); }
      // Auspuff: zwei kleine Flammen bei Tempo (flackern), Fehlzündung beim Gaswegnehmen; Rauchwölkchen hinten
      if (k.v > 140 && !(k.fall > 0) && T.veh !== 'boat' && !VNOX[k.vtype]) { const f0 = (k.boost > 0 ? 1.6 : 1) * (4 + Math.random() * 6) * Math.min(1, (k.v - 140) / 120); ctx.fillStyle = `rgba(255,${120 + Math.random() * 100 | 0},40,.85)`; [-7, 7].forEach(ex => { ctx.beginPath(); ctx.moveTo(ex - 2.2, 27); ctx.quadraticCurveTo(ex, 27 + f0 * 1.6, ex + 2.2, 27); ctx.fill(); });
        if (Math.random() < .25) { ctx.fillStyle = 'rgba(120,200,255,.8)'; [-7, 7].forEach(ex => { ctx.beginPath(); ctx.arc(ex, 28, 1.6, 0, TAU); ctx.fill(); }); } }
      if (k.pop > 0 && !VNOX[k.vtype]) { ctx.fillStyle = `rgba(255,${150 + Math.random() * 90 | 0},40,${Math.min(1, k.pop * 4)})`; [-7, 7].forEach(ex => { ctx.beginPath(); ctx.arc(ex, 31, 4 + Math.random() * 4, 0, TAU); ctx.fill(); }); }
      if (k.bus > 0) { ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#3a2a00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-17, -36, 34, 72, 7) : ctx.rect(-17, -36, 34, 72); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1d9a5b'; ctx.fillRect(-17, -6, 34, 7);   // Ônibus-Express von oben
        ctx.fillStyle = 'rgba(150,210,255,.9)'; ctx.fillRect(-13, -33, 26, 7); for (let j = 0; j < 4; j++) { ctx.fillRect(-16, -22 + j * 13, 4, 9); ctx.fillRect(12, -22 + j * 13, 4, 9); } ctx.fillStyle = '#3a2a00'; ctx.font = '900 6px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.save(); ctx.rotate(-Math.PI / 2); ctx.fillText('ÔNIBUS EXPRESS', 0, 2); ctx.restore(); }
      else ctx.drawImage(VEH[k.vkey || k.id] || VEH[k.id], -22, -30, 44, 60);
      if (k.vtype === 'trio') for (let j = 0; j < 8; j++) { ctx.fillStyle = `hsl(${(tt * 360 + j * 45) % 360},100%,${58 + 14 * Math.sin(tt * 12 + j)}%)`; ctx.fillRect(j % 2 ? 12 : -15, -13 + (j >> 1) * 9, 3, 6); }   // Partylichter
      if (k.vtype === 'rocket' && !(k.fall > 0)) { const fl = 8 + Math.random() * 8 + (k.boost > 0 ? 22 : 0); ctx.fillStyle = `rgba(140,210,255,${.55 + Math.random() * .35})`; ctx.beginPath(); ctx.moveTo(-4, 28); ctx.quadraticCurveTo(0, 28 + fl, 4, 28); ctx.fill(); }   // Raketen-Düse
      { const ro = (VHEAD[k.vtype] === undefined ? 7 : VHEAD[k.vtype]) - 7; if (ro) ctx.translate(0, ro); rider(k, tt); }
      if (k.brk && k.v > 20) { ctx.fillStyle = '#ff2020'; ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 8; ctx.fillRect(-11, 22, 6, 4); ctx.fillRect(5, 22, 6, 4); ctx.shadowBlur = 0; }
      ctx.restore();
      if (k.slowT > 0 && k.slowE) up(k.x + 18, k.y - 18, E(k.slowE, 22), .9); if (k.blind > 0) up(k.x - 18, k.y - 18, E('😵', 22), .9);
      if (k.out) { up(k.x, k.y - 34, E('📴', 22), .9); }
      { const st = STY[k.id] || {}, back = (VHEAD[k.vtype] !== undefined ? VHEAD[k.vtype] : st.seat === 'none' ? 0 : 7) * vz, sp0 = Math.min(1, k.v / 250), hop = k.bump > 0 ? Math.abs(Math.sin(k.bump * 30)) * 5 : 0;
        const rot = Math.sin(tt * 11 + k.idx * .3) * .07 * sp0 + (k.spin > 0 ? Math.sin(tt * 28) * .4 : 0) + clamp(k.steer * -.18 - k.vr / 2000, -.3, .3) + (k.done ? Math.sin(tt * 9) * .15 : 0);
        const q = 1 + Math.sin(tt * 16 + k.idx) * .045 * sp0 - (k.squash || 0) * .35;
        upB(k.x - Math.cos(k.a) * back, k.y - Math.sin(k.a) * back - z * 2 - hop + (T.veh === 'cart' && k.vtype === 'cart' ? -8 : 0), headImg(k.id), (k.me ? .31 : .275) * s * (st.hs || 1) * HSET() * Math.sqrt(vz), rot, q); }
      // Gesicht reagiert auf Treffer: Sterne um den Kopf, Schmerz-Emoji als Aufkleber, Pflaster sammeln sich übers Rennen
      { const ha = S.t - (k.hitAt === undefined ? -9 : k.hitAt); if (ha >= 0 && ha < 1.5) { for (let j = 0; j < 3; j++) { const an = tt * 7 + j * TAU / 3; up(k.x + Math.cos(an) * 20, k.y - 26 + Math.sin(an) * 7, E(j % 2 ? '⭐' : '💫', 14), .9); } up(k.x + 12, k.y - 8, E(k.hitE || '😵', 20), 1 + Math.max(0, .3 - ha) * 2); }
        if (k.hits >= 3) up(k.x - 9, k.y - 24, E('🩹', 14), .9); if (k.hits >= 6) up(k.x + 9, k.y - 30, E('🩹', 12), .9); if (k.hits >= 9) up(k.x, k.y - 40, E('⚰️', 14), .9); }
      if (k.id === S.rival && !k.done) up(k.x + 20, k.y - 22, E('⚔️', 20), .75);
      if (k.shield > 0 && (k.shield > 1.5 || Math.floor(tt * 8) % 2)) { ctx.save(); ctx.globalAlpha = .9; up(k.x, k.y - 30, E('⛱️', 40), .9); ctx.restore(); ctx.strokeStyle = 'rgba(127,211,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(k.x, k.y, 36, 0, TAU); ctx.stroke(); }
      if (k.parrot > 0) up(k.x - 18, k.y - 24, E('🦜', 24), .9);
      if (k.zap > 0 && Math.floor(tt * 6) % 2) up(k.x + 14, k.y - 26, E('⚡', 18), .9); if (k.acai > 0 && !k.me) up(k.x - 16, k.y - 20, E('🫐', 20), .9);
      if (k.kiss > 0) up(k.x + 16, k.y - 26 - Math.sin(tt * 6) * 4, E('💘', 22), .9);
      if (k.item && k.item.orb && k.roll <= 0) { const n = icnt(k); for (let j = 0; j < n; j++) { const an = S.t * 5 + j * TAU / n; up(k.x + Math.cos(an) * 34, k.y + Math.sin(an) * 34, E('🥥', 20), .95); } }
      else if (k.item && k.item.trail && k.roll <= 0) { const n = icnt(k); for (let j = 0; j < n; j++) { const d0 = 34 + j * 15, w0 = Math.sin(tt * 6 + j) * 4; up(k.x - Math.cos(k.a) * d0 - Math.sin(k.a) * w0, k.y - Math.sin(k.a) * d0 + Math.cos(k.a) * w0, E('🍌', 18), .9); } }
      else if (k.item && !k.me && k.roll <= 0) up(k.x, k.y, E(k.item.e, 20), .7);
    };
    // Absturz: kleiner + blasser beim Fallen, beim Zurückbringen groß (hoch oben) am Seil unter dem Retter
    // Startaufstellung (Wunsch Patrick 10.10.): vor dem Einrasten ist der Platz leer, dann fällt das Kart aus der Höhe in seine Box (Schatten wächst, Staubring beim Aufsetzen)
    const KDG = k => { const g = S.grid, i = S.karts.indexOf(k), u = (g.t - g.lk[i]) / GDROP; if (u < 0) return; if (u >= 1) { KD(k); const w = (u - 1) * GDROP; if (w < .5) { ctx.save(); ctx.globalAlpha = (1 - w / .5) * .7; ctx.fillStyle = 'rgb(220,205,170)'; for (let j = 0; j < 10; j++) { const an = j / 10 * TAU, rr = 18 + w * 70; ctx.beginPath(); ctx.arc(k.x + Math.cos(an) * rr, k.y + Math.sin(an) * rr, 7 + w * 10, 0, TAU); ctx.fill(); } ctx.restore(); } return; }
      const e = u * u, sc0 = 1 + 2.4 * (1 - e); ctx.save(); ctx.fillStyle = `rgba(0,0,0,${.08 + e * .28})`; ctx.beginPath(); ctx.ellipse(k.x + 3, k.y + 4, 8 + e * 14, 10 + e * 18, k.a + Math.PI / 2, 0, TAU); ctx.fill();
      ctx.globalAlpha = Math.min(1, u * 4); ctx.translate(k.x, k.y); ctx.scale(sc0, sc0); ctx.rotate((1 - e) * .5); ctx.translate(-k.x, -k.y); KD(k); ctx.restore(); };
    const KDF = k => { if (S.grid) return KDG(k); if (!(k.fall > 0)) return KD(k); const f = k.fall;
      if (f < 1.1) { const p = f / 1.1; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p * .95); ctx.translate(k.x, k.y); ctx.scale(1 - p * .8, 1 - p * .8); ctx.translate(-k.x, -k.y); KD(k); ctx.restore(); return; }
      const p = clamp((f - 1.1) / 1.4, 0, 1), e = 1 - (1 - p) * (1 - p), hgt = (1 - e) * 1, h = 70 + hgt * 160, sw = Math.sin(tt * 5) * 8 * (1 - e), rx = k.x - h * Math.sin(phi) + sw * Math.cos(phi), ry = k.y - h * Math.cos(phi) - sw * Math.sin(phi);
      ctx.strokeStyle = 'rgba(40,40,40,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(rx, ry); ctx.stroke();
      ctx.save(); ctx.translate(k.x, k.y); ctx.scale(1 + hgt * .45, 1 + hgt * .45); ctx.translate(-k.x, -k.y); KD(k); ctx.restore();
      up(rx, ry, E(FALL ? FALL.e : '🚁', 60), 1.05 + Math.sin(tt * 20) * .02); };
    if (S.grid) S.karts.forEach(k => { const lb = 'P' + (k.slot + 1), sp = GBOX[lb] || (GBOX[lb] = sprite(64, 34, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 9); x.fill(); x.fillStyle = '#fff'; x.font = 'italic 900 19px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(lb, w / 2, h / 2 + 1); }));   // leere Startboxen mit Nummer
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.a + Math.PI / 2); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-17, -24); ctx.lineTo(-17, 22); ctx.lineTo(17, 22); ctx.lineTo(17, -24); ctx.stroke(); ctx.restore(); if (S.grid.t < S.grid.lk[S.karts.indexOf(k)] + GDROP) up(k.x, k.y, sp, .9); });
    KORD.filter(k => !onDeck(k)).forEach(KDF); if (DECK) drawDeck(phi); KORD.filter(onDeck).forEach(KDF); drawTunnels(tt, phi);
    S.coatis.forEach(c => c.uru ? (ctx.fillStyle = 'rgba(0,0,0,.18)', ctx.beginPath(), ctx.ellipse(c.x + 18, c.y + 22, 14, 6, 0, 0, TAU), ctx.fill(), up(c.x, c.y - 10 + Math.sin(tt * 14) * 3, E('🦅', 38), 1 + Math.sin(tt * 18) * .08)) : up(c.x, c.y, E(c.golf ? '⚪' : c.ball ? '⚽' : c.coco ? '🥥' : c.tro ? '🛒' : c.flip ? '🩴' : c.cai ? '🐊' : '🦝', c.tro || c.cai ? 38 : c.ball || c.flip ? 26 : 34), 1));
    // Geist: halbdurchsichtig, ohne Zusammenstoß
    const G = S.ghost; if (G && G.g && S.t >= 0) { const f = S.t / .1, i = Math.min(G.g.length - 2, Math.floor(f)), r = clamp(f - i, 0, 1), a0 = G.g[Math.max(0, i)], a1 = G.g[Math.max(0, i + 1)];
      if (a0 && a1) { const gx = a0[0] + (a1[0] - a0[0]) * r, gy = a0[1] + (a1[1] - a0[1]) * r, ga = (a0[2] + angd(a1[2] / 100, a0[2] / 100) * 100 * r) / 100; G.x = gx; G.y = gy;
        ctx.save(); ctx.globalAlpha = .45; ctx.translate(gx, gy); ctx.rotate(ga + Math.PI / 2); ctx.drawImage(VEH[G.drv] || VEH[me], -22, -30, 44, 60); ctx.restore();
        ctx.save(); ctx.globalAlpha = .55; up(gx, gy, HEAD[G.drv] || HEAD[me], .25); ctx.restore(); ctx.save(); ctx.globalAlpha = .8; up(gx, gy - 30, E('👻', 18), .8); ctx.restore(); } }
    ctx.restore();
    // Wetter im Bild: Regen (Iguaçu), Gischt-Nebel am Wasserfall
    if (S.storm.f > 0) { ctx.save(); ctx.fillStyle = `rgba(10,20,40,${.38 * S.storm.f})`; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = `rgba(200,225,255,${.5 * S.storm.f})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let j = 0; j < [50, 90, 130][SET.q] * S.storm.f; j++) { const x = (j * 97 + tt * 520) % (W + 60) - 30, y = (j * 53 + tt * 1100) % (H + 40) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 20); } ctx.stroke();
      if (S.storm.bolt > 0) { ctx.strokeStyle = 'rgba(255,255,240,.95)'; ctx.lineWidth = 3; ctx.beginPath(); let bx = W * (.2 + ((S.t * 7) % 1) * .6), by = 0; ctx.moveTo(bx, by); while (by < H * .45) { bx += rnd(-30, 30); by += rnd(20, 45); ctx.lineTo(bx, by); } ctx.stroke(); } ctx.restore(); }
    if (T.rain || S.rainX) { ctx.save(); ctx.strokeStyle = 'rgba(200,225,255,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let j = 0; j < [40, 70, 90][SET.q] * (S.rainX > 1 ? 1.6 : 1); j++) { const x = (j * 97 + tt * 420) % (W + 60) - 30, y = (j * 53 + tt * 900) % (H + 40) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); } ctx.stroke();
      ctx.fillStyle = S.rainX > 1 ? 'rgba(30,50,70,.22)' : 'rgba(30,60,80,.12)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (T.mist) { const dm = Math.hypot(k0.x - T.mist.x, k0.y - T.mist.y), f = clamp(1 - (dm - T.mist.r * .4) / T.mist.r, 0, 1) * .6;
      if (f > .02) { const g = ctx.createRadialGradient(W / 2, camY(), 60, W / 2, camY(), Math.max(W, H) * .8); g.addColorStop(0, `rgba(240,250,255,${f * .25})`); g.addColorStop(1, `rgba(240,250,255,${f})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
    { const ni = (S.ev && S.ev.cur && S.ev.cur.k === 'blackout') ? 1 : T.night ? .78 : S.tod === 'night' ? .7 : 0;
      if (ni > 0) darkness(ni >= 1 ? .97 : ni > .75 ? .86 : .8, sc, phi);
      else if (S.tod === 'dusk') { ctx.fillStyle = 'rgba(255,120,40,.16)'; ctx.fillRect(0, 0, W, H); } else if (S.tod === 'dawn') { ctx.fillStyle = 'rgba(255,170,190,.12)'; ctx.fillRect(0, 0, W, H); }
      if (T.fog) { const g = ctx.createRadialGradient(W / 2, camY(), 80, W / 2, camY(), Math.max(W, H) * .6); g.addColorStop(0, 'rgba(235,240,245,' + (S.fogX ? .18 : .05) + ')'); g.addColorStop(1, 'rgba(235,240,245,' + Math.min(.9, .72 * (S.fogX || 1)) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
    { const sp0 = Math.hypot(k0.v, k0.vr), inten = clamp((sp0 - 300) / 140, 0, 1) + (k0.boost > 0 ? .6 : 0);
      if (inten > .05 && !k0.done) { ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${Math.min(.55, inten * .35)})`; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j < 22; j++) { const an = rnd(0, TAU), r0 = Math.max(W, H) * rnd(.42, .55), r1 = r0 * rnd(.72, .86), cx = W / 2, cy = camY() - 40; ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); }
        ctx.stroke(); ctx.restore(); } }
    if (S.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(.8, S.fade * 1.6)})`; ctx.fillRect(0, 0, W, H); }
    if (S.flash > 0) { ctx.fillStyle = `rgba(255,170,120,${Math.min(.85, S.flash)})`; ctx.fillRect(0, 0, W, H); }
    if (k0.acai > 0 && S.acaiB) { const al = Math.min(1, k0.acai / 1.2) * .88; S.acaiB.b.forEach(([fx, fy, fr], j) => { const r = fr * Math.min(W, H) * (1 + .06 * Math.sin(tt * 3.3 + j)); ctx.fillStyle = `rgba(${90 + j * 6},20,${110 + j * 8},${al})`; ctx.beginPath(); ctx.arc(fx * W, fy * H, r, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(fx * W + r * .7, fy * H + r * .9, r * .35, 0, TAU); ctx.fill(); }); ctx.fillStyle = `rgba(255,255,255,${al * .9})`; ctx.font = '900 18px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🫐 Açaí im Gesicht!', W / 2, H * .3); }   // Açaí-Bombe getroffen
    if (k0.peg > .3 && !k0.done) { ctx.fillStyle = `rgba(255,120,200,${k0.peg * .08})`; ctx.fillRect(0, 0, W, H); }
    // Bildschirm: schwebende Texte, Sprechblasen (weichen Tacho, ITEM-Knopf und einander aus)
    LBL = [];
    S.fx.forEach(f => { if (!f.txt) return; const p = toScreen(f.x, f.y, sc, phi); ctx.save(); ctx.globalAlpha = clamp(1.3 - f.t, 0, 1); ctx.font = '900 20px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.6)';
      const y = dodge(p[0], p[1] - 55 - f.t * 40, ctx.measureText(f.txt).width + 8, 26) + 7; ctx.strokeText(f.txt, p[0], y); ctx.fillStyle = f.col; ctx.fillText(f.txt, p[0], y); ctx.restore(); });
    S.karts.forEach(k => { if (k.sayT <= 0) return; const p = toScreen(k.x, k.y, sc, phi); bubble(p[0], p[1] - 34 * sc, k.say, Math.min(1, k.sayT * 3)); });
    if (S.grid) { ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; S.karts.forEach((k, i) => { if (S.grid.t < S.grid.lk[i] + GDROP || k.out) return; const p = toScreen(k.x, k.y, sc, phi), tx = 'P' + (k.slot + 1) + (k.me ? ' · DU' : ''), y = p[1] - 40 * sc;   // Startplatz über dem Kart
      ctx.font = 'italic 900 ' + (k.me ? 15 : 13) + 'px system-ui,sans-serif'; const w = ctx.measureText(tx).width + 14; ctx.fillStyle = k.me ? '#ffd23f' : 'rgba(0,0,0,.62)'; ctx.beginPath(); ctx.roundRect(p[0] - w / 2, y - 11, w, 22, 11); ctx.fill(); ctx.fillStyle = k.me ? '#1a1a1a' : '#fff'; ctx.fillText(tx, p[0], y + 1); }); ctx.restore(); }
    if (S.live) { const tn = performance.now(); ctx.save(); ctx.textAlign = 'center'; S.karts.forEach(k => { if (k.me || k.out) return; const p = toScreen(k.x, k.y, sc, phi); if (p[0] < -40 || p[0] > W + 40 || p[1] < -40 || p[1] > H + 40) return;
        if (k.aiIdx === undefined) { const t = NAME(k.who || k.id) + (k.lagging ? ' 📶' : ''); ctx.font = '800 12px system-ui,sans-serif'; const w = ctx.measureText(t).width + 12; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(p[0] - w / 2, p[1] + 22 * sc, w, 18, 9) : ctx.rect(p[0] - w / 2, p[1] + 22 * sc, w, 18); ctx.fill(); ctx.fillStyle = '#9ff0b4'; ctx.fillText(t, p[0], p[1] + 22 * sc + 13); } });
      S.karts.forEach(k => { if (!(k.emoU > tn)) return; const p = toScreen(k.x, k.y, sc, phi), a = clamp((k.emoU - tn) / 400, 0, 1), up = (2400 - (k.emoU - tn)) / 2400; ctx.globalAlpha = a; ctx.font = '40px system-ui,sans-serif'; ctx.fillText(k.emo, p[0], dodge(p[0], p[1] - 52 * sc - up * 26 - 14, 46, 46) + 14); ctx.globalAlpha = 1; }); ctx.restore(); }
    S.movers.forEach(m => { if (m.say > 0 && near(m.x, m.y, 500) && MVSAY[m.kind] && m.kind !== 'coati' && m.kind !== 'caiman' && m.kind !== 'monkey') { const p = toScreen(m.x, m.y, sc, phi); bubble(p[0], p[1] - 30 * sc, MVSAY[m.kind], Math.min(1, m.say)); } });
    itemSee(sc, phi); hud(sc);
    if (S.pod) podDraw();
  }
  // HUD-Flächen (Tacho unten links, ITEM-Knopf) in Bildschirm-Koordinaten: schwebende Texte und Sprechblasen weichen nach oben aus
  let HUDR = null, HUDT = 0, ITSEE = false;
  function hudRects() { const now = performance.now(); if (HUDR && now - HUDT < 800 && HUDR.w === W && HUDR.h === H) return HUDR; HUDT = now; HUDR = [[8, H - 196, 102, H - 104]].concat(RKR ? [RKR.slice()] : []); HUDR.w = W; HUDR.h = H; HUDR.it = null;
    const b = itemBtn.getBoundingClientRect(), c = box.getBoundingClientRect(); if (b.width) { HUDR.it = [b.left - c.left, b.top - c.top, b.right - c.left, b.bottom - c.top]; HUDR.push([HUDR.it[0] - 6, HUDR.it[1] - 6, HUDR.it[2] + 6, HUDR.it[3] + 6]); } return HUDR; }
  let LBL = [];   // in diesem Bild schon gesetzte Texte/Sprechblasen (weichen sich gegenseitig aus)
  const dodge = (x, y, w, h) => { const obs = hudRects().concat(LBL); for (let n = 0; n < 8; n++) { let mv = false; obs.forEach(r => { if (x + w / 2 > r[0] && x - w / 2 < r[2] && y + h / 2 > r[1] && y - h / 2 < r[3]) { y = r[1] - h / 2 - 4; mv = true; } }); if (!mv) break; } LBL.push([x - w / 2, y - h / 2, x + w / 2, y + h / 2]); return y; };
  // ITEM-Knopf halbdurchsichtig, solange ein Kart oder Geschoss dahinter fährt (im Hochformat sonst unsichtbare Verfolger)
  function itemSee(sc, phi) { const it = hudRects().it; let under = false; if (it && !S.pod) { const m = 22 * sc, hit = (x, y) => { const p = toScreen(x, y, sc, phi); return p[0] > it[0] - m && p[0] < it[2] + m && p[1] > it[1] - m && p[1] < it[3] + m; };
      under = S.karts.some(k => !k.me && hit(k.x, k.y)) || S.coatis.some(o => hit(o.x, o.y)); }
    const now = performance.now(); if (under) S.itSee = now; const see = now - (S.itSee || -1e9) < 350; if (see !== ITSEE) { ITSEE = see; itemBtn.classList.toggle('kr-see', see); } }
  function toScreen(x, y, sc, phi) { const dx = x - S.camX, dy = y - S.camY, c = Math.cos(phi), s = Math.sin(phi); return [W / 2 + (dx * c - dy * s) * sc, camY() + (dx * s + dy * c) * sc]; }
  function bubble(x, y, t, a) { ctx.save(); ctx.globalAlpha = a; ctx.font = '700 14px system-ui,sans-serif'; const w = ctx.measureText(t).width + 16; x = clamp(x, w / 2 + 6, W - w / 2 - 6); y = dodge(x, y - 17, w, 28) + 17;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 30, w, 26, 12) : ctx.rect(x - w / 2, y - 30, w, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y - 17); ctx.restore(); }
  // Platzierungsleiste (Wunsch Patrick 10.10.: immer sehen, wer auf welchem Platz ist und wann jemand überholt): links unter der Minikarte (Querformat daneben),
  // je Fahrer Platz + Kopf, eigener Platz gelb, Plätze gleiten beim Überholen weich an die neue Stelle, kurz ▲ grün / ▼ rot; live mit 🤖/📴/📶, im Ziel 🏁
  let RKR = null;
  function standings(mh) { if (S.tut || S.pose || S.karts.length < 2) { RKR = null; return; } const n = S.karts.length, now = performance.now(), land = W > H, rh = land ? 22 : 29, hs = land ? 18 : 24, x0 = land ? 12 + 92 + 14 : 8, y0 = land ? 58 : 12 + 50 + mh + 8 + 51 + 10, w = hs + 34;
    const ord = S.karts.slice().sort((a, b) => place(a) - place(b)), R = S.rk || (S.rk = {}), dt0 = Math.min(.1, (now - (R.t || now)) / 1000); R.t = now;
    ctx.save(); ctx.textBaseline = 'middle';
    ord.forEach((o, r) => { const i = S.karts.indexOf(o), q = R[i] || (R[i] = {y: r, r, at: 0, d: 0}); if (q.r !== r) { q.d = q.r - r; q.at = now; q.r = r; } q.y += (r - q.y) * Math.min(1, dt0 * 9); });   // Wechsel merken, Position weich nachziehen
    ord.slice().sort((a, b) => (a.me ? 1 : 0) - (b.me ? 1 : 0)).forEach(o => { const i = S.karts.indexOf(o), q = R[i], y = y0 + q.y * rh, fl = now - q.at < 1100 && S.t > 1 ? 1 - (now - q.at) / 1100 : 0, up = q.d > 0;
      ctx.globalAlpha = o.out ? .45 : 1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, y, w, rh - 3, (rh - 3) / 2) : ctx.rect(x0, y, w, rh - 3);
      ctx.fillStyle = o.me ? (fl > .35 ? (up ? '#3fd47a' : '#ff5a5a') : 'rgba(255,210,63,.95)') : 'rgba(0,0,0,.45)'; ctx.fill();   // nur die eigene Reihe färbt sich (grün = überholt, rot = überholt worden), bei den anderen nur Pfeile
      if (o.me) { ctx.strokeStyle = fl ? (up ? '#2ecc71' : '#ff4a4a') : 'rgba(255,255,255,.9)'; ctx.lineWidth = fl ? 2.5 : 1.5; ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.font = 'italic 900 ' + (land ? 11 : 13) + 'px system-ui,sans-serif'; ctx.fillStyle = o.me ? '#1a1a1a' : q.r === 0 ? '#ffd23f' : '#fff'; ctx.fillText(String(q.r + 1), x0 + 10, y + (rh - 3) / 2 + 1);
      const hd = HEAD[o.id]; if (hd) ctx.drawImage(hd, x0 + 20, y + (rh - 3 - hs) / 2, hs, hs); else { ctx.fillStyle = (LOOK[o.id] || {}).shirt || '#888'; ctx.beginPath(); ctx.arc(x0 + 20 + hs / 2, y + (rh - 3) / 2, hs / 2, 0, TAU); ctx.fill(); }
      const tag = o.done ? '🏁' : o.out ? '📴' : o.lagging ? '📶' : o.aiIdx !== undefined && S.live ? '🤖' : ''; if (tag) { ctx.font = (land ? 9 : 11) + 'px system-ui,sans-serif'; ctx.fillText(tag, x0 + w - 7, y + (rh - 3) / 2 + 1); }
      if (fl) { ctx.globalAlpha = Math.min(1, fl * 2); ctx.font = '900 ' + (land ? 12 : 14) + 'px system-ui,sans-serif'; ctx.fillStyle = up ? '#4cff8a' : '#ff6b6b'; ctx.fillText(up ? '▲' : '▼', x0 + w + 9, y + (rh - 3) / 2 + 1); } });
    ctx.restore(); ctx.globalAlpha = 1; RKR = [x0, y0, x0 + w + 18, y0 + n * rh]; }
  function hud() {
    if (S.intro) { introHud(); return; }
    if (S.grid) { gridHud(); return; }
    const k = S.karts[0], pl = place(k), top = 12, now = performance.now();
    ctx.save(); ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
    ctx.fillStyle = pl === 1 ? '#ffd23f' : '#fff'; ctx.font = '900 44px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(pl + '.', W / 2, top + 30);
    ctx.font = '700 14px system-ui,sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Runde ' + clamp(k.lap + 1, 1, LAPS) + '/' + LAPS + ' · ' + fmt(Math.max(0, (k.done || S.t)) * 1000), W / 2, top + 78, W - 236);   // schmale Handys: nicht in Minikarte/Item-Fenster
    if (S.live && LIVE.gp) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText((LIVE.gp.e || '🏆') + ' ' + (LIVE.gp.n || 'Grand Prix') + ' · Rennen ' + (LIVE.gp.i + 1) + '/' + LIVE.gp.list.length + ' · ' + T.e + ' ' + T.name, W / 2, top + 98, W - 236); }
    else if (CUP) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(CUP.e + ' ' + CUP.n + ' · Rennen ' + (CUP.i + 1) + '/' + CUP.list.length + ' · ' + T.e + ' ' + T.name, W / 2, top + 98, W - 236); }
    else if (S.ghost) { ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('👻 Geist: ' + NAME(S.ghost.who) + ' · ' + fmt(S.ghost.ms), W / 2, top + 98, W - 236); }
    // Ansager-Zeile
    // Ansager-Zeile ganz oben zwischen Pause-Knopf und rechtem Rand (dort liegt sonst nichts; vorher über Abständen/Rivale)
    if (banner && now < banner.until) { const a0 = clamp((banner.until - now) / 300, 0, 1), age = now - (banner.t0 || 0), sl = Math.max(0, 1 - age / 180); ctx.globalAlpha = a0; ctx.font = '800 15px system-ui,sans-serif'; const t = '🎙 ' + banner.t, x0 = 60, x1 = W - 10, w = Math.min(x1 - x0, ctx.measureText(t).width + 24), cx = (x0 + x1) / 2, by = top - 4 - sl * 30;
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(200,20,40,.92)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - w / 2, by, w, 28, 14) : ctx.rect(cx - w / 2, by, w, 28); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillText(t, cx, by + 6, w - 16); ctx.globalAlpha = 1; }
    if (S.wind && (S.wind.warn || S.wind.on > 0) && Math.floor(now / 250) % 2) { ctx.font = '900 22px system-ui,sans-serif'; ctx.fillStyle = '#d9f2ff'; ctx.shadowBlur = 8; ctx.fillText(S.wind.on > 0 ? (S.wind.dir > 0 ? '💨 Seitenwind →' : '← Seitenwind 💨') : '💨 Böe kommt!', W / 2, top + 178); }
    if (T.wave && S.wave.warn > 0 && Math.floor(now / 250) % 2) { ctx.font = '900 22px system-ui,sans-serif'; ctx.fillStyle = '#7fe9ff'; ctx.shadowBlur = 8; ctx.fillText('🌊 Welle kommt!', W / 2, top + 178); }
    ctx.shadowBlur = 0;
    { const rv = S.karts.find(o => o.id === S.rival), t1 = '🪙 ' + S.got, t2 = rv ? '⚔️ ' + NAME(rv.id) + ' ' + (S.rivalAhead ? '▲' : '▼') : '';   // dunkles Feld: auf Sand/Schnee sonst kaum lesbar
      ctx.font = '700 12px system-ui,sans-serif'; const w2 = rv ? Math.min(110, ctx.measureText(t2).width) : 0; ctx.font = '800 14px system-ui,sans-serif'; const pw = Math.max(ctx.measureText(t1).width, w2) + 14;
      ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W - 8 - pw, top + 106, pw, rv ? 40 : 22, 9) : ctx.rect(W - 8 - pw, top + 106, pw, rv ? 40 : 22); ctx.fill();
      ctx.textAlign = 'right'; ctx.fillStyle = '#ffd23f'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4; ctx.fillText(t1, W - 14, top + 110);
      if (rv) { ctx.fillStyle = S.rivalAhead ? '#ffb86b' : '#9dffb4'; ctx.font = '700 12px system-ui,sans-serif'; ctx.fillText(t2, W - 14, top + 129, 110); } ctx.textAlign = 'center'; ctx.shadowBlur = 0; }
    // Fahrzeug-Anzeige (neue Fahrzeuge): Wind beim Strandsegler, Hitze bei der Rakete, Bass-Takt beim Trio, nächste Kokosnuss
    if (VNEW[k.vtype] && S.t > 0 && !k.done) { const vt = k.vtype, y0 = top + 152; let txt = '', col = '#fff', bar = -1;
      if (vt === 'sail' && S.sailW !== undefined) { const f = k.windF || 0; txt = (f > .3 ? 'Rückenwind' : f < -.3 ? 'Gegenwind' : 'Seitenwind') + ' ' + (f >= 0 ? '+' : '−') + Math.abs(Math.round(13 * f)) + ' %'; col = f > .3 ? '#9dffb4' : f < -.3 ? '#ffb0b0' : '#fff'; }
      else if (vt === 'rocket') { txt = k.ovh > 0 ? '🔥 Überhitzt!' : '🌡️ Düse'; bar = k.ovh > 0 ? 1 : (k.heat || 0) / 3.4; col = bar > .7 ? '#ff8a5c' : '#fff'; }
      else if (vt === 'trio') { txt = '🔊 Bass in ' + Math.max(0, k.bassT || 0).toFixed(1) + ' s'; bar = 1 - Math.max(0, k.bassT || 0) / 4.5; col = '#ffd23f'; }
      else if (vt === 'coco') { txt = '🥥 nächste in ' + Math.ceil(Math.max(0, k.cocoT || 0)) + ' s'; bar = 1 - Math.max(0, k.cocoT || 0) / 6; col = '#c8f08f'; }
      if (txt) { ctx.save(); ctx.font = '700 12px system-ui,sans-serif'; ctx.textBaseline = 'top'; const pw = Math.max(ctx.measureText(txt).width + 16 + (vt === 'sail' ? 22 : 0), 96), hh = bar >= 0 ? 30 : 22, x0 = W - 8 - pw;
        ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, y0, pw, hh, 9) : ctx.rect(x0, y0, pw, hh); ctx.fill(); ctx.textAlign = 'right'; ctx.fillStyle = col; ctx.fillText(txt, W - 15, y0 + 4);
        if (bar >= 0) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + 8, y0 + 21, pw - 16, 4); ctx.fillStyle = col; ctx.fillRect(x0 + 8, y0 + 21, (pw - 16) * clamp(bar, 0, 1), 4); }
        if (vt === 'sail') { ctx.translate(x0 + 14, y0 + 11); ctx.rotate(S.sailW - k.mv); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, -5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-4.5, -3); ctx.lineTo(4.5, -3); ctx.closePath(); ctx.fill(); }
        ctx.restore(); } }
    if (S.evBan && now < S.evBan.until) { ctx.save(); ctx.globalAlpha = clamp((S.evBan.until - now) / 400, 0, 1); ctx.font = '900 17px system-ui,sans-serif'; ctx.textAlign = 'center'; const w0 = Math.min(W - 20, ctx.measureText(S.evBan.t).width + 28); ctx.fillStyle = 'rgba(120,20,160,.9)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W / 2 - w0 / 2, top + 186, w0, 32, 16) : ctx.rect(W / 2 - w0 / 2, top + 186, w0, 32); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(S.evBan.t, W / 2, top + 202, W - 36); ctx.restore(); ctx.textBaseline = 'top'; }
    if (S.ev && S.ev.cur && S.ev.cur.k === 'police' && !k.done) { const d = wrap(S.ev.cur.i - k.idx); if (d < 160 && Math.floor(now / 250) % 2) { ctx.font = '900 18px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = Math.hypot(k.v, k.vr) > 165 ? '#ff5a4a' : '#9dffb4'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 6; ctx.fillText('🚔 Kontrolle voraus: ' + (Math.hypot(k.v, k.vr) > 165 ? 'BREMSEN!' : 'gut so'), W / 2, top + 226); ctx.shadowBlur = 0; } }
    // Item-Fenster
    const ix = W - 70, iy = top + 44; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(ix, iy, 58, 58, 14) : ctx.rect(ix, iy, 58, 58); ctx.fill(); ctx.stroke();
    const show = k.roll > 0 ? ILIST[Math.floor(now / 90) % ILIST.length] : k.item, sn = k.roll > 0 || !show ? 1 : icnt(k);
    if (show && sn > 1) { for (let j = sn - 1; j >= 0; j--) ctx.drawImage(E(show.e, 36), ix + 29 - 17 + (j - (sn - 1) / 2) * 12, iy + 29 - 17 - j * 3, 34, 34);   // Mehrfach-Item: Stapel + ×n
      ctx.font = '900 13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('×' + sn, ix + 46, iy + 52); ctx.fillText('×' + sn, ix + 46, iy + 52); }
    else if (show) ctx.drawImage(E(show.e, 36), ix + 29 - 23, iy + 29 - 23, 46, 46);
    if (k.item || k.item2) { const jx = ix - 44, jy = iy + 14; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.strokeStyle = 'rgba(255,210,63,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(jx, jy, 36, 36, 10) : ctx.rect(jx, jy, 36, 36); ctx.fill(); ctx.stroke(); if (k.item2) ctx.drawImage(E(k.item2.e, 28), jx + 4, jy + 4, 28, 28);
      const cb = comboOf(k.item, k.item2); if (cb) { ctx.font = '900 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = Math.floor(now / 200) % 2 ? '#ff7ae0' : '#fff'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 4; ctx.fillText(cb.e + ' KOMBO', ix + 6, iy + 70); ctx.shadowBlur = 0; } }
    // Kurven-Warnung: scharfe Kurve voraus
    if (S.t > 0 && !k.done && SCURV.length) { let w = 0; for (let j = 25; j < 120; j += 5) { const c = SCURV[wrap(k.idx + j)]; if (Math.abs(c) > 1 / 330) { w = c; break; } }
      if (w) { const hard = Math.abs(w) > 1 / 250 && k.v > 230, txt = (w > 0 ? '↱ ' : '↰ ') + (hard ? 'Bremsen!' : w > 0 ? 'Rechtskurve' : 'Linkskurve');
        ctx.font = '900 17px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 6; ctx.fillStyle = hard ? (Math.floor(now / 180) % 2 ? '#ff5a4a' : '#fff') : '#ffd23f'; ctx.fillText(txt, W / 2, top + 122); ctx.shadowBlur = 0; } }
    // Tacho (unten links) und Rundenzeit-Hinweis
    { const kmh = Math.round(Math.hypot(k.v, k.vr) * .45), cx = 54, cy = H - 150, r = 34, f = clamp(kmh / (200 * ccF(S.cc || 150)), 0, 1);
      ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * .8, Math.PI * 2.2); ctx.stroke();
      ctx.strokeStyle = k.boost > 0 ? '#ff8a2a' : f > .85 ? '#ffd23f' : '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * .8, Math.PI * (.8 + 1.4 * f)); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4; ctx.textAlign = 'center'; ctx.font = '900 18px system-ui,sans-serif'; ctx.fillText(kmh, cx, cy - 10); ctx.font = '700 9px system-ui,sans-serif'; ctx.fillText('km/h', cx, cy + 9);
      if (S.cc && S.cc !== 150) { ctx.font = '900 10px system-ui,sans-serif'; ctx.fillStyle = S.cc === 200 ? '#ff9a6b' : '#9fe8b0'; ctx.fillText(CCE[S.cc] + ' ' + CCN[S.cc], cx, cy - r - 12); ctx.fillStyle = '#fff'; }   // Klasse über dem Tacho
      { const g0 = Math.round(slp(k.idx) * 900); if (Math.abs(g0) >= 3 && !k.air) { ctx.font = '900 11px system-ui,sans-serif'; ctx.fillStyle = g0 > 0 ? '#ffb86b' : '#7fe0ff'; ctx.fillText((g0 > 0 ? '⬆ ' : '⬇ ') + Math.abs(g0) + ' %', cx, cy + 24); } }   // Steigung/Gefälle unter dem Tacho
      ctx.shadowBlur = 0; }
    if (S.lapMsg && now < S.lapMsg.until && !S.pose) { const m = S.lapMsg, a0 = clamp((m.until - now) / 400, 0, 1); ctx.globalAlpha = a0; ctx.font = '800 15px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
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
      ctx.font = '700 11px system-ui,sans-serif'; ctx.textBaseline = 'top'; if (rows.length) { ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(8, top + 50 + mh + 8, mw + 8, rows.length * 15 + 6, 7) : ctx.rect(8, top + 50 + mh + 8, mw + 8, rows.length * 15 + 6); ctx.fill(); }
      ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4;
      rows.forEach((r, i) => { const y = top + 50 + mh + 12 + i * 15; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; let t0 = r[0]; while (t0.length > 4 && ctx.measureText(t0).width > 64) t0 = t0.slice(0, -2) + '…'; ctx.fillText(t0, 10, y); ctx.textAlign = 'right'; ctx.fillStyle = r[2]; ctx.fillText(r[1], 108, y); }); ctx.shadowBlur = 0; ctx.textAlign = 'center'; }
    standings(mh);
    if (S.live && S.liveWait > 0) { ctx.font = '800 16px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 6; ctx.fillText('⏳ Warte auf die anderen … ' + Math.ceil(30 - S.liveWait) + ' s', W / 2, H * .25); ctx.shadowBlur = 0; }
    // Fahrschule: Aufgabe oben einblenden
    if (S.tut) { const st = TUT[Math.min(S.tut.i, TUT.length - 1)], fresh = performance.now() - S.tut.ok < 900; ctx.save(); const bw = Math.min(W - 24, 420), bx = (W - bw) / 2, by = H - (W > H ? 180 : 250);
      ctx.fillStyle = fresh ? 'rgba(40,160,80,.92)' : 'rgba(6,26,48,.88)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, 64, 14) : ctx.rect(bx, by, bw, 64); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffd23f'; ctx.font = '900 12px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText((fresh ? '✅ ' : '🎓 ') + 'Fahrschule ' + Math.min(S.tut.i + 1, TUT.length) + '/' + TUT.length, bx + 12, by + 8);
      ctx.fillStyle = '#fff'; ctx.font = '700 13px system-ui,sans-serif'; const words = st.t.split(' '); let line = '', ly = by + 26; words.forEach(w0 => { if (ctx.measureText(line + w0).width > bw - 24) { ctx.fillText(line, bx + 12, ly); line = ''; ly += 16; } line += w0 + ' '; }); ctx.fillText(line, bx + 12, ly); ctx.restore(); }
    // Siegerpose
    if (S.pose) { const ps = S.pose, a0 = clamp((performance.now() - ps.t0) / 400, 0, 1), el = (performance.now() - ps.t0) / 1000; ctx.save(); ctx.globalAlpha = a0;
      const g = ctx.createRadialGradient(W / 2, H * .42, 40, W / 2, H * .42, Math.max(W, H) * .7); g.addColorStop(0, 'rgba(255,210,63,.35)'); g.addColorStop(1, 'rgba(4,18,34,.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const PE = {jonas: '💸', simon: '☀️', patrick: '♿', marco: '⚽', greisel: '🍺', dajo: '🥟'}[ps.id] || (XBY[ps.id] || {}).e || '🎉';
      for (let j = 0; j < 22; j++) { const x = (j * 97 + 30) % W, y = ((el * (140 + (j % 5) * 40) + j * 71) % (H + 80)) - 40; ctx.save(); ctx.translate(x, y); ctx.rotate(el * (j % 2 ? 2 : -2) + j); ctx.drawImage(E(PE, 30), -18, -18, 36, 36); ctx.restore(); }
      const hb = Math.abs(Math.sin(el * 6)) * 18, hs = 150, img = headImg(ps.id); ctx.save(); ctx.translate(W / 2, H * .42 - hb); ctx.rotate(ps.id === 'patrick' ? Math.sin(el * 12) * .25 : Math.sin(el * 5) * .08);
      if (ps.id === 'simon') { ctx.fillStyle = `rgba(255,60,30,${.35 + .2 * Math.sin(el * 10)})`; ctx.beginPath(); ctx.arc(0, 0, hs * .62, 0, TAU); ctx.fill(); }
      ctx.drawImage(img, -img.width / 2 * hs / 116, -img.height / 2 * hs / 116, img.width * hs / 116, img.height * hs / 116); ctx.restore();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffd23f'; ctx.font = 'italic 900 30px system-ui,sans-serif';
      ctx.fillText('🏆 ' + NAME(ps.id).toUpperCase() + ' GEWINNT!', W / 2, H * .42 + hs * .7, W - 30);
      const wl = ps.wl || (VTXT2[ps.id] || {}).win; if (wl) { ctx.font = '700 16px system-ui,sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('„' + wl + '“', W / 2, H * .42 + hs * .7 + 36, W - 30); }
      ctx.shadowBlur = 0; ctx.restore(); }
    if (S.lxMsg && now < S.lxMsg.until && !S.pose) { const m = S.lxMsg, age = now - m.t0, a0 = clamp(Math.min(age / 180, (m.until - now) / 450), 0, 1), sc = 1 + Math.max(0, 1 - age / 240) * .4, bw = Math.min(W - 36, 330), ex = m.more ? 22 : 0;   // Strecke ändert sich (LAPX)
      ctx.save(); ctx.globalAlpha = a0; ctx.shadowBlur = 0; ctx.translate(W / 2, H * .45); ctx.scale(sc, sc); ctx.beginPath(); ctx.roundRect(-bw / 2, -36, bw, 74 + ex, 16); ctx.fillStyle = 'rgba(8,18,38,.88)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = m.last ? '#ff9a3c' : '#ffd23f'; ctx.stroke();
      if (m.more) { ctx.font = '800 12px system-ui,sans-serif'; ctx.fillStyle = '#ffd9a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+ ' + m.more, 0, 46, bw - 24); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 11px system-ui,sans-serif'; ctx.fillStyle = m.last ? '#ff9a3c' : '#ffd23f'; ctx.fillText(m.last ? '🏁 LETZTE RUNDE · DIE STRECKE ÄNDERT SICH' : '🔁 RUNDE ' + m.n + ' · DIE STRECKE ÄNDERT SICH', 0, -20, bw - 24);
      ctx.font = '900 30px system-ui,sans-serif'; ctx.fillText(m.e, -bw / 2 + 30, 10); ctx.textAlign = 'left'; ctx.font = '800 15px system-ui,sans-serif'; ctx.fillStyle = '#fff';
      { const words = m.t.split(' '), mw = bw - 76; let l1 = '', l2 = ''; words.forEach(w0 => { if (!l2 && ctx.measureText(l1 + (l1 ? ' ' : '') + w0).width <= mw) l1 += (l1 ? ' ' : '') + w0; else l2 += (l2 ? ' ' : '') + w0; }); if (l2) { ctx.fillText(l1, -bw / 2 + 56, 2, mw); ctx.fillText(l2, -bw / 2 + 56, 21, mw); } else ctx.fillText(l1, -bw / 2 + 56, 10, mw); }
      ctx.restore(); }
    if (S.ww && !S.pose && !k.done) { const ww = S.ww, age = now - ww.t0, bl = Math.floor(now / 380) % 2, sc = 1 + Math.max(0, 1 - age / 180) * .5, bw = Math.min(W - 40, 310), sub = ['Das Ziel liegt hinter dir!', 'Geisterfahrer! 👻', 'Brasilien ist da hinten!', 'Falsch abgebogen, Gringo!'][(S.wwN - 1) % 4];
      ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = .55 + bl * .35; ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, W - 12, H - 12); ctx.globalAlpha = 1;   // roter Rahmen ums Bild
      ctx.translate(W / 2, H * .27); ctx.scale(sc, sc); ctx.beginPath(); ctx.roundRect(-bw / 2, -40, bw, 92, 16); ctx.fillStyle = bl ? 'rgba(205,10,10,.9)' : 'rgba(130,0,0,.9)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = 'italic 900 22px system-ui,sans-serif'; ctx.fillText('⛔ FALSCHE RICHTUNG!', 0, -18, bw - 20);
      ctx.font = '900 18px system-ui,sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText((ww.turn > 0 ? '↻' : '↺') + ' Umdrehen', 0, 8, bw - 20); ctx.font = '700 12px system-ui,sans-serif'; ctx.fillStyle = '#ffe3e3'; ctx.fillText(sub, 0, 32, bw - 20); ctx.restore(); }
    // Zwischenzeit-Meldung
    if (S.tdMsg && performance.now() < S.tdMsg.until) { const m = S.tdMsg, left = m.until - performance.now(), age = 1700 - left, sc = 1 + Math.max(0, 1 - age / 160) * .6; ctx.save(); ctx.globalAlpha = clamp(left / 350, 0, 1); ctx.translate(W / 2, H * .38); ctx.scale(sc, sc); ctx.rotate(-.05);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'italic 900 30px system-ui,sans-serif'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,0,0,.85)'; ctx.strokeText(m.t, 0, 0, W - 30); ctx.fillStyle = '#ff3b3b'; ctx.fillText(m.t, 0, 0, W - 30);
      ctx.font = '700 13px system-ui,sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(m.sub, 0, 30, W - 30); ctx.fillStyle = '#ffe3e3'; ctx.fillText(m.sub, 0, 30, W - 30); ctx.restore(); }
    if (S.secMsg && performance.now() < S.secMsg.until && !S.pose) { const m = S.secMsg; ctx.globalAlpha = clamp((m.until - performance.now()) / 400, 0, 1); ctx.font = '800 14px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
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
    if (k.done && S.pose) { ctx.fillStyle = '#fff'; ctx.font = 'italic 900 34px system-ui,sans-serif'; ctx.fillText('🏁 ZIEL · Platz ' + place(k), W / 2, H * .17, W - 30); }   // Siegerpose läuft: ZIEL! klein oben statt über dem Sieger-Kopf
    else if (k.done) { ctx.fillStyle = '#ffd23f'; ctx.font = '900 70px system-ui,sans-serif'; ctx.fillText('ZIEL!', W / 2, H * .38); }
    if (S.t >= 0 && S.t < 6 && !k.done) { ctx.shadowBlur = 0; ctx.globalAlpha = clamp(6 - S.t, 0, 1) * .85; ctx.fillStyle = '#fff'; ctx.font = '700 14px system-ui,sans-serif';
      ctx.fillText(T.veh === 'boat' ? 'Boot: träge Lenkung, früh einlenken · 🐬 = Turbo' : T.gates ? 'Schranken im Takt · 🚧 ausweichen' : T.wind ? 'Brücke: Seitenwind-Böen, gegenlenken!' : T.belts ? 'Gepäckbänder: mit dem Band schneller, dagegen langsamer' : T.fog ? 'Nebel! Achte auf die Kurven-Schilder' : T.rain ? 'Rutschig! Früh einlenken · Nasenbären!' : T.flood ? 'Pfützen bremsen · die Flut steigt!' : T.veh === 'cart' ? 'Gepäckkarren-Rennen · Koffer und Hund ausweichen!' : 'Halten = lenken · lange halten = Drift + Turbo', W / 2, H * .5, W - 24); }
    ctx.restore();
    // Feuerwerk / Konfetti
    if (S.fw.length) { ctx.save(); S.fw.forEach(p => { if (p.t < 0) return; ctx.globalAlpha = clamp(1.4 - p.t, 0, 1); ctx.fillStyle = p.c; ctx.fillRect(p.x * W + p.vx * p.t - 2.5, p.y * H + p.vy * p.t + 60 * p.t * p.t - 2.5, 5, 5); }); ctx.restore(); }   /* Quadrate statt Kreise: 10× schneller bei Hunderten Teilchen */
  }

  /* ---- Ablauf ---- */
  function resize() { DPR = Math.min([1, 1.5, 2][SET.q], window.devicePixelRatio || 1); box.classList.toggle('ana', SET.ctl === 'analog'); W = box.clientWidth; H = box.clientHeight; cv.width = W * DPR; cv.height = H * DPR; }
  // Ruckel-Schutz: läuft das Rennen über 4 s mit unter ~40 Bildern/s, Grafik automatisch eine Stufe runter (höchstens bis Niedrig)
  const PERF = {acc: 0, n: 0, t: 0, done: false};
  function perfCheck(raw) { if (!S || S.paused || S.t < 1 || PERF.done || SET.q === 0 || document.hidden) return; PERF.acc += raw; PERF.n++; PERF.t += raw;
    if (PERF.t < 4) return; const avg = PERF.acc / PERF.n; PERF.acc = PERF.n = PERF.t = 0;
    if (avg > 1 / 40) { SET.q--; SET.qAuto = 1; saveSet(); resize(); setTxt(); toast('⚙️ Grafik: <b>' + ['Niedrig', 'Normal', 'Hoch'][SET.q] + '</b>, läuft flüssiger'); if (SET.q === 0) PERF.done = true; } }
  // Fehler-Protokoll (Abstürze finden, Wunsch Patrick 09.10.): Fehler im Spiel landen in db karterr (je Meldung einmal pro Sitzung, höchstens 10), lesbar mit ArtifactData.
  // Ein Fehler in einem Bild hält das Spiel nicht mehr an; häufen sie sich, geht es zurück ins Menü statt einzufrieren.
  const ERRSEEN = {}; let errN = 0, visAt = 0;
  function kerr(w, e, x) { try { const m0 = String(e && e.message || e || '').slice(0, 220), key = w + ':' + m0; if (ERRSEEN[key] || errN >= 10) return; ERRSEEN[key] = 1; errN++;
    const doc = Object.assign({w, m: m0, st: String(e && e.stack || '').split('\n').slice(0, 6).join('\n').slice(0, 900), ts: Date.now(), v: (typeof MODV === 'object' && MODV.kart) || '', trk: T ? T.id : null, mode: MODE, veh: myVeh(), drv: me, live: !!(S && S.live), t: S && isFinite(S.t) ? Math.round(S.t * 10) / 10 : null,
      who: PME() || '', dev: devName(), ua: (navigator.userAgent || '').replace(/^Mozilla\/5\.0 /, '').slice(0, 140), mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, q: SET.q}, x || {});
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), send = n => { if (DB) DB.doc('karterr/' + id).set(doc).catch(() => {}); else if (n < 6) setTimeout(() => send(n + 1), 4000); }; send(0); } catch (z) {} }
  function oops() { if (!S) return; S.errs = (S.errs || 0) + 1; if (S.errs === 30) { try { toast('😬 Da hat sich das Spiel verschluckt – zurück ins Menü. Einfach neu starten!', 5000); } catch (e) {} try { toMenu(); } catch (e) { kerr('toMenu', e); } } }
  addEventListener('error', e => { if (!box.hidden) kerr('win', e.error || e.message, {src: String(e.filename || '').split('/').pop().slice(0, 60) + ':' + e.lineno}); });
  addEventListener('unhandledrejection', e => { if (!box.hidden) kerr('promise', e.reason); });
  function loop(ts) { raf = requestAnimationFrame(loop); const raw = (ts - (last || ts)) / 1000; let dt = Math.min(.05, raw); last = ts; if (!S) return; if (raw > 0 && raw < .5) perfCheck(raw);
    if (raw > 2.5 && !document.hidden && performance.now() - visAt > 4000 && !S.paused) kerr('stall', 'Bild hing über 2,5 s', {sec: Math.round(raw * 10) / 10});   // Hänger ohne App-Wechsel
    try { if (S.fw.length) { S.fw.forEach(p => { p.t += dt; }); S.fw = S.fw.filter(p => p.t < 1.5); if (S.fw.length > 320) S.fw.splice(0, S.fw.length - 320); }
      if (!S.paused) { if (S.slow > 0) { S.slow -= dt; dt *= .3; step(dt); } else { const n = S.live && raw > .05 && raw < .3 ? Math.ceil(raw / .05) : 1; for (let i = 0; i < n; i++) step(n > 1 ? raw / n : dt); } } } catch (e) { kerr('step', e); oops(); }   /* live: unter 20 Bildern/s mehrere Schritte, sonst fährt das langsame Handy (und als Gastgeber alle Computer-Gegner) in Zeitlupe hinterher */
    try { musTick(); if (S) draw(); } catch (e) { kerr('draw', e); oops(); } }
  const headCv = (id, n) => { const c = document.createElement('canvas'); c.width = c.height = n || 64; c.getContext('2d').drawImage(HEAD[id], 0, 0, c.width, c.height); return c; };
  function finish() {
    if (S.live && S.pose) { const wk = S.karts.find(o => o.id === S.pose.id); if (wk) voice(wk, 'win', 1); }
    const ks = S.karts; ks.forEach(k => { if (!k.done) k.est = k.out ? 1e6 : S.t + (LAPS * N - progress(k)) * 6 / (VMAX * .9 * ccF(S.cc || 150)); });
    const order = ks.slice().sort((a, b) => (a.done || a.est) - (b.done || b.est)), mine = ks[0], bkey = tkey(T.id), b = best(), prev = b[bkey], ok = !!mine.done && mine.done > 15 && !mine.out, rec = ok && (!prev || mine.done * 1000 < prev), ms = Math.round((mine.done || 0) * 1000);   /* nie eine unmögliche Zeit (abgebrochen/Test) speichern */
    if (rec) { b[bkey] = ms; store.set('kartBest', JSON.stringify(b)); try { localStorage.setItem('br26.kartGhost.' + tkey(T.id), JSON.stringify({ms, drv: me, g: S.rec})); } catch (e) {} }
    // Crew-Bestenliste (nur mit Schreibrecht)
    let crewMsg = ''; PEND = null;
    const wasTut = TUTON;
    if (TUTON) { TUTON = false; if (!store.get('kartTutDone')) { store.set('kartTutDone', '1'); addCoins(20); setTimeout(() => toast('🎓 <b>Fahrschule bestanden!</b><br>+20 🪙'), 600); } }
    else if (!ok) { /* abgebrochen: nichts eintragen */ }
    else { let top = lbList(LB, T.id)[0]; const mineLB = LB[tkey(T.id) + '__' + player()];   /* live: schnellere Mitspieler aus diesem Rennen zählen schon mit (ihre Bestzeit ist hier evtl. noch nicht geladen) */
      if (S.live) S.karts.forEach(o => { if (o !== mine && o.aiIdx === undefined && o.done > 15 && !o.out && (!top || o.done * 1000 < top.ms)) top = {who: o.who || o.id, ms: Math.round(o.done * 1000)}; });
      { const pd = {kind: 'best', track: T.id, drv: me, veh: vehOf(me), ms, g: S.rec}; if (PME()) saveLB(pd); else PEND = pd; }   // auch ohne Schreibrecht: Gäste-Zeiten warten auf dem Handy (gPend)
      crewMsg = !top || ms < top.ms ? (WR ? '👑 Neue Crew-Bestzeit auf ' + T.name + (S.cc !== 150 ? ' in ' + CCN[S.cc] : '') + '!' : '👑 Schneller als die Crew-Bestzeit, aber nur eingeladene Bearbeiter kommen in die Bestenliste.') : '⏱ Crew-Bestzeit: ' + NAME(top.who) + ' ' + fmt(top.ms); }
    const pl = order.indexOf(mine) + 1;
    let msg = pl === 1 ? ['Campeão! 🏆', 'Der Pokal geht nach Hause!'] : pl === 6 ? ['Rote Laterne 🏮', 'Immerhin heil angekommen.'] : pl <= 3 ? ['Podium! ' + (pl === 2 ? '🥈' : '🥉'), 'Stark gefahren.'] : ['Mittelfeld', 'Nächstes Mal mehr Caipi-Turbo.'];
    if (wasTut) msg = ['Fahrschule bestanden! 🎓', 'Jetzt ab ins erste echte Rennen.'];
    else if (!mine.done) msg = ['Zeit abgelaufen ⏱️', 'Die anderen waren schon alle im Ziel.'];
    if (CUP) { order.forEach((k, i) => { CUP.pts[k.id] = (CUP.pts[k.id] || 0) + PTS[i]; }); CUP.races.push(order.map(k => k.id)); }
    if (S.live) { liveGpScore(order); liveSave(order); }
    const mi0 = order.indexOf(mine), nbF = [order[mi0 - 1], order[mi0 + 1]].filter(o => o && o.done && mine.done && Math.abs(o.done - mine.done) < .15)[0], photo = nbF ? '📸 Fotofinish gegen ' + NAME(nbF.who || nbF.id) + ': ' + Math.round(Math.abs(nbF.done - mine.done) * 1000) + ' ms ' + (nbF.done > mine.done ? 'vorne!' : 'hinten.') + ' ' : '';
    const st0 = stats(), st1 = Object.assign({}, st0, {races: st0.races + 1, wins: st0.wins + (pl === 1 && !wasTut ? 1 : 0), ilha: st0.ilha + (T.id === 'ilha' ? 1 : 0), supers: st0.supers + S.supers});
    const rv = ks.find(o => o.id === S.rival), beatRival = rv && order.indexOf(mine) < order.indexOf(rv), earn = S.got + [10, 6, 4, 2, 1, 1][pl - 1] + (beatRival ? 5 : 0);
    st1.smash = (st0.smash || 0) + (S.myBrk || 0); st1.coinsTot = st0.coinsTot + S.got; st1.rivals = st0.rivals + (beatRival ? 1 : 0); if (!st1.tracks.split(',').includes(T.id)) st1.tracks = (st1.tracks ? st1.tracks + ',' : '') + T.id; st1.tracksN = st1.tracks.split(',').filter(Boolean).length; st1.tds = (st0.tds || 0) + (S.td ? S.td.n : 0); st1.vtds = (st0.vtds || 0) + (S.td ? S.td.n : 0); st1.vsup = (st0.vsup || 0) + S.supers; addCoins(earn);
    if (S.rival) { const rr = loadJ('kartRival'), mi = order.indexOf(mine), nb = order[mi + 1] || order[mi - 1]; rr[me] = beatRival && nb ? nb.id : S.rival; store.set('kartRival', JSON.stringify(rr)); }   /* Fahrschule/ohne Rivale: gespeicherten Rivalen nicht löschen */
    store.set('kartStats', JSON.stringify(st1)); if (st1.smash >= 25) ach('smash'); const newV = VEHS.filter(v => v.need && st0[v.need[0]] < v.need[1] && st1[v.need[0]] >= v.need[1]);
    const lastCup = CUP && CUP.i === CUP.list.length - 1;
    if (!lastCup) { if (pl === 1) say('win', 'Sieg! Der Pokal geht nach Hause!', 1); else if (pl <= 3) say('podium', 'Aufs Podest! Stark gefahren!', 1); else say('lose', 'Na ja, dabei sein ist alles!', 1); }
    if (pl === 1) fireworks(90);
    if (beatRival) setTimeout(() => say('rivalwin', 'Duell gewonnen! Rivale geschlagen!', 1), 2600);
    setTimeout(() => { ach('first'); if (pl === 1 && !wasTut && S && S.cc === 200) ach('cc200'); if (pl === 1 && !wasTut && S && S.cc === 100) ach('cc100'); if (pl === 1) { ach('win'); if (['sp', 'reveillon', 'cristo'].includes(T.id)) ach(T.id); } if (!S.myHits) ach('nohit'); if (st1.supers >= 10) ach('super10'); if (st1.coinsTot >= 100) ach('coins100');
      if (S.tod === 'night' || T.night) ach('night'); if (TRACKS.every(x => st1.tracks.split(',').includes(x.id))) ach('all'); if (st1.rivals >= 5) ach('rival5'); }, 900);
    res.querySelector('.kr-res-t').textContent = (CUP ? T.e + ' ' : '') + msg[0];
    res.querySelector('.kr-res-s').textContent = photo + msg[1] + (mine.done ? ' Deine Zeit: ' + fmt(mine.done * 1000) + (S.cc && S.cc !== 150 ? ' (' + CCN[S.cc] + ')' : '') + (rec ? ' · Neue Bestzeit!' : prev ? ' · Bestzeit: ' + fmt(prev) : '') : ' Nicht im Ziel angekommen.');   // vorher „0:00.0 · Bestzeit: NaN“, wenn das Rennen ohne eigenen Zieleinlauf endete oder es noch keine Bestzeit gab
    const ol = res.querySelector('ol'); ol.innerHTML = '';
    order.forEach((k, i) => { const li = document.createElement('li'); if (k.me) li.className = 'me'; li.innerHTML = '<b>' + (i + 1) + '.</b>'; li.appendChild(headCv(k.id));
      li.insertAdjacentHTML('beforeend', '<span>' + esc(S.live && k.aiIdx === undefined && !k.me && k.who && k.who !== k.id ? NAME(k.who) + ' (' + NAME(k.id) + ')' : NAME(k.id)) + (S.live && k.aiIdx !== undefined ? ' 🤖' : '') + '</span><small>' + (k.done ? fmt(k.done * 1000) : k.out ? '📴 raus' : mine.done ? '+ ' + (k.est - mine.done).toFixed(1) + ' s' : 'noch unterwegs') + (CUP ? ' · +' + PTS[i] : '') + '</small>'); ol.appendChild(li); });
    res.querySelector('.kr-crew').textContent = crewMsg; res.querySelector('.kr-crew').hidden = !crewMsg || !!CUP;
    { const rp = res.querySelector('.kr-rep'); if (rp) { const h0 = wasTut ? '' : repHtml(mine, pl, order.length); rp.innerHTML = h0; rp.hidden = !h0; rp.open = store.get('kartRepOpen') !== '0'; } }   // Rennbericht
    { const wr = res.querySelector('.kr-whores'); wr.innerHTML = PEND ? whoHtml('🙋 <b>Wer bist du?</b> Tippe dich an, dann kommt deine Zeit (' + fmt(ms) + ') in die Crew-Bestenliste.') : ''; whoHeads(wr); }
    res.querySelector('.kr-coins').innerHTML = '<b>🪙 +' + earn + '</b><span>' + S.got + ' gesammelt</span><span>+' + [10, 6, 4, 2, 1, 1][pl - 1] + ' für Platz ' + pl + '</span>' + (beatRival ? '<span>+5 ⚔️ ' + esc(NAME(rv.id)) + ' geschlagen</span>' : rv ? '<span class="kr-no">⚔️ ' + esc(NAME(rv.id)) + ' war schneller</span>' : '') + '<em>Kasse ' + coins() + '</em>';   // Münzen als kleine Chips statt Klammer-Satz
    const ul = res.querySelector('.kr-unlock'); ul.hidden = !newV.length; ul.innerHTML = newV.map(v => '🔓 Neues Fahrzeug: <b>' + v.e + ' ' + esc(v.n) + '</b>').join('<br>'); if (newV.length) setTimeout(() => SFX.fanfare(), 600);
    const st = res.querySelector('.kr-stand'); st.innerHTML = ''; st.hidden = !CUP;
    if (CUP) { const tbl = Object.entries(CUP.pts).sort((a, b) => b[1] - a[1]); st.innerHTML = '<p class="kr-lbl">Gesamtwertung nach ' + (CUP.i + 1) + ' von ' + CUP.list.length + ' Rennen</p>' +
      '<div class="kr-st">' + tbl.map(([id, p], i) => '<span' + (id === me ? ' class="me"' : '') + '><b>' + (i + 1) + '.</b> ' + esc(NAME(id)) + ' <i>' + p + '</i></span>').join('') + '</div>'; }
    if (S.live && LIVE.gp && LIVE.gp.pts && !LIVE.gp.end) { const g = LIVE.gp, last0 = !!g.done, tb = gpTable(g), pv = g.prev || {}, ga = g.gain || {}; st.hidden = false;
      st.innerHTML = gpCard(g, 1) + (last0 ? '' : '<p class="kr-gpnx">▶ Nächstes Rennen ' + ((g.k || 0) + 1) + '/' + g.list.length + ': ' + esc((TBY[g.list[g.k]] || {}).e || '') + ' ' + esc((TBY[g.list[g.k]] || {}).name || '') + '</p>'); gpHeads(st);
      if (last0 && tb[0]) { res.querySelector('.kr-res-t').textContent = tb[0].me ? '🏆 Grand Prix gewonnen!' : '🏆 Sieger: ' + tb[0].nm; } }
    { const w0 = res.querySelector('.kr-gpw'); if (w0) w0.hidden = true; ['no', 'yes', 'go'].forEach(x => res.querySelector('.kr-again').classList.remove('kr-gr-' + x)); }
    if (S.live) { const g = LIVE.gp && LIVE.gp.pts && !LIVE.gp.end ? LIVE.gp : null; res.querySelector('.kr-again').textContent = g ? (g.done ? '🏆 Zur Siegerehrung' : '👍 Bereit') : '🔁 Revanche (bereit)'; } else res.querySelector('.kr-again').textContent = CUP ? (lastCup ? '🏆 Zur Siegerehrung' : '▶ Nächstes Rennen: ' + TBY[CUP.list[CUP.i + 1]].e + ' ' + TBY[CUP.list[CUP.i + 1]].name) : 'Nochmal';
    res.querySelector('.kr-rnd2').hidden = !(RNDR && !S.live && !CUP);
    res.querySelector('.kr-res .kr-back').textContent = CUP ? '☰ Menü (Grand Prix abbrechen)' : S.live ? '👥 Zur Lobby' : '☰ Zurück ins Menü'; if (S.live && LIVE.gp && LIVE.gp.done && !LIVE.gp.end) { LIVE.rdy = false; liveLeave(); }   /* letztes Rennen: Endstand sofort an alle */
    if (S.live && gpLive()) { res.querySelector('.kr-res .kr-back').textContent = '👥 Lobby · Fahrer wechseln'; LIVE.rdy = false; liveLeave(); gpResUpd(); clearInterval(LIVE.gpResT); LIVE.gpResT = setInterval(() => { if (box.hidden || MODE !== 'live' || !gpLive() || LIVE.race || (res.hidden && (!S || !S.pod))) { clearInterval(LIVE.gpResT); return; } gpResUpd(); }, 1000); }   /* Grand Prix: Zwischenstand, man zählt ab jetzt zur Lobby (nicht bereit) */
    S.paused = true; MUS.on = false; racing(false); engOff();
    if (TUTON || order.length < 2) { res.hidden = false; return; }
    // Siegerehrung auf der Strecke: Podest, Sekt, Konfetti, Hymne des Siegers, der Letzte hält den Eimer; antippen = überspringen
    const nm = o => o.me ? (S.live ? NAME(PME() || me) : NAME(o.id)) : NAME(o.who || o.id);
    S.pose = null; S.pod = {t0: performance.now(), top: order.slice(0, 3).map(o => ({id: o.id, n: nm(o), me: !!o.me})), last: order.length > 3 ? {id: order[order.length - 1].id, n: nm(order[order.length - 1]), me: !!order[order.length - 1].me, roast: roastOf(nm(order[order.length - 1]))} : null, p: [], cf: []};
    for (let j = 0; j < 90; j++) S.pod.cf.push({x: Math.random(), y: -Math.random() * .6, v: .12 + Math.random() * .2, r: Math.random() * TAU, c: ['#ffd23f', '#5fe783', '#ff5a8a', '#5ec8ff', '#fff'][j % 5]});
    SFX.fanfare(); setTimeout(() => { real('applause', .7); hymn(order[0].id); }, 700);
    clearTimeout(podT); podT = setTimeout(podEnd, 6500);
  }
  let podT = 0;
  /* Rennbericht (Wunsch Patrick 09.10. spät, Idee 1): Werte aus S.rep, Erzfeind (wer dich am öftesten abgeschossen hat), Lieblingsopfer, Rundenzeiten als Balken
     und ein bissiger Kommentar der Rennleitung (die zwei passendsten aus REPC, schwarzer Humor wie überall im Kart) */
  function repHtml(mine, pl, n) { const R = S.rep; if (!R || R.tT < 3) return '';
    const pc = x => Math.round(100 * x / Math.max(1, R.tT)), drP = pc(R.drT), offP = pc(R.offT), leadP = pc(R.leadT), top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
    const foe0 = top(R.by), foe = foe0 && foe0[1] >= 2 ? foe0 : null, vic = top(R.vic), td = S.td ? S.td.n : 0, falls = mine.falls || 0, ww = S.wwN || 0, smash = S.myBrk || 0, sup = S.supers || 0, laps = R.laps, bl = laps.length ? Math.min(...laps) : 0, bi = laps.indexOf(bl);   // Balken: beste Runde voll, je 1 % langsamer 4 % kürzer
    const C = [], c = (p, t) => C.push([p, t]);
    if (foe && foe[1] >= 3) c(9, '😈 ' + NAME(foe[0]) + ' hat dich ' + foe[1] + '× abgeschossen. Das ist keine Rivalität mehr, das ist Stalking.');
    if (falls) c(8, '🪂 ' + falls + (falls > 1 ? ' Abstürze' : ' Absturz') + '. Die Rettungsflieger kennen dich inzwischen beim Vornamen.');
    if (ww) c(8, '⛔ Falschfahrer-Alarm! Die Polizei sucht noch nach deinem Kennzeichen.');
    if (R.hits >= 6) c(7, '🩹 ' + R.hits + ' Treffer kassiert. Dein Kart sieht aus wie Patricks Leber nach Silvester.');
    if (td >= 3) c(7, '💀 ' + td + ' Takedowns. Die Rennleitung prüft, ob das noch Sport ist oder schon Vorsatz.');
    if (pl === n && n > 2) c(6, '🪣 Letzter. Wenigstens hattest du die beste Aussicht auf alle anderen.');
    if (R.wall >= 8) c(6, '🧱 ' + R.wall + '× in der Bande. Die Leitplanke hat sich einen Anwalt genommen.');
    if (offP >= 15) c(5, '🌴 ' + offP + ' % neben der Strecke. Der Strand gehört nicht zur Strecke, Gringo.');
    if (!td && R.items >= 4) c(5, '🎯 ' + R.items + ' Items verballert, null Takedowns. Zielwasser vergessen?');
    if (drP < 5 && R.tT > 40 && mine.vtype !== 'horse') c(4, '🛞 Driftanteil ' + drP + ' %. Deine Reifen sind noch originalverpackt.');
    if (drP >= 35) c(4, '🔥 ' + drP + ' % der Zeit quer. Fährst du Rennen oder tanzt du Samba?');
    if (pl === 1 && leadP >= 70) c(4, '👑 ' + leadP + ' % in Führung. Start-Ziel-Sieg: langweilig, aber effektiv.');
    if (pl === 1 && leadP < 15) c(4, '🦊 Nur ' + Math.round(R.leadT) + ' s in Führung, aber genau die richtigen. Taktik oder Glück? Egal.');
    if (R.ov >= 8) c(3, '⬆️ ' + R.ov + ' Überholmanöver. Die anderen haben sich dein Kennzeichen notiert.');
    if (smash >= 5) c(3, '💥 ' + smash + ' Sachen zerlegt. Die Rechnung kommt per Splitwise.');
    if (!C.length) c(0, '✅ Sauberes Rennen. Niemand ist gestorben. Diesmal.');
    C.sort((a, b) => b[0] - a[0]);
    const T0 = [['⏱', bl ? fmt(bl * 1000) : '–', 'beste Runde' + (bl && R.lap0 && bl * 1000 < R.lap0 ? ' · 🆕 Rekord' : '')], ['🏎️', Math.round(R.top) + ' km/h', 'Top-Speed'], ['🔥', drP + ' %', 'Drift · ' + sup + ' Super, ' + R.mini + ' Mini'],
      ['💀', td, 'Takedowns' + (vic ? ' · meist ' + NAME(vic[0]) : '')], ['🎯', R.hits, 'mal getroffen'], ['⬆️', R.ov, 'Überholmanöver'], ['👑', Math.round(R.leadT) + ' s', 'in Führung'], ['🎁', R.items, 'Items benutzt']].concat(
      R.wall ? [['🧱', R.wall, 'Bandenkontakte']] : [], offP ? [['🌴', offP + ' %', 'neben der Strecke']] : [], falls ? [['🪂', falls, 'Abstürze']] : [], ww ? [['⛔', ww, 'Falschfahrten']] : [], smash ? [['💥', smash, 'Deko zerlegt']] : []);
    return '<summary><b>📊 Rennbericht</b><span>' + (foe ? '😈 ' + esc(NAME(foe[0])) + ' · ' : '') + (bl ? '⏱ ' + fmt(bl * 1000) + ' · ' : '') + Math.round(R.top) + ' km/h</span></summary><div class="kr-repb">' +
      '<div class="kr-repc">' + C.slice(0, 2).map(x => '<p>' + esc(x[1]) + '</p>').join('') + '<small>– die Rennleitung</small></div>' +
      (foe ? '<p class="kr-foe">😈 <b>Erzfeind des Rennens:</b> ' + esc(NAME(foe[0])) + ' (' + foe[1] + '× abgeschossen)</p>' : '') + (vic ? '<p class="kr-foe kr-vic">🎯 <b>Lieblingsopfer:</b> ' + esc(NAME(vic[0])) + ' (' + vic[1] + '× erledigt)</p>' : '') +
      '<div class="kr-rept">' + T0.map(([e0, v0, l0]) => '<div><i>' + e0 + '</i><b>' + esc(String(v0)) + '</b><small>' + esc(l0) + '</small></div>').join('') + '</div>' +
      (laps.length ? '<p class="kr-lbl">Rundenzeiten' + (R.lap0 ? ' · deine beste vorher ' + fmt(R.lap0) : '') + '</p><div class="kr-laps">' + laps.map((t0, i) => '<div' + (i === bi ? ' class="b"' : '') + '><span>R' + (i + 1) + '</span><i><u style="width:' + Math.round(clamp(100 - (t0 - bl) / bl * 400, 30, 100)) + '%"></u></i><b>' + fmt(t0 * 1000) + (i === bi ? ' ⭐' : '') + '</b></div>').join('') + '</div>' : '') + '</div>'; }
  function podEnd() { clearTimeout(podT); if (!S || !S.pod) return; S.pod = null; res.hidden = false; gpResUpd(); }
  // Schwarzhumorige Nachrufe für den Letzten (Wunsch Patrick: so schwarz wie möglich)
  const ROAST = ['Die Familie von {n} wurde bereits informiert.', '{n} hält den Kotzeimer. Für immer.', 'Der Leichenwagen war schneller als {n}.', '{n} wird im Testament nicht mehr erwähnt.',
    'Für {n} wird eine Schweigeminute eingelegt. Mehr ist es nicht wert.', '{n} hat die Rente vor dem Ziel erreicht.', 'Sogar der Kaiman hatte Mitleid mit {n}. Und der frisst Kinder.',
    '{n} fährt wie er lebt: ohne Ziel und ohne Hoffnung.', 'Organspender-Ausweis für {n} wäre jetzt eine gute Idee.', 'Der Bestatter hat {n} schon mal vermessen.',
    '{n}: Selbst die Schnecke im Hostel ist enttäuscht.', 'Die Crew hat für {n} gesammelt. Für den Sarg.', '{n} wurde vom Pfarrer überholt. Auf dem Weg zur eigenen Beerdigung.',
    'Wenn {n} so weiterfährt, reicht ein Urnengrab.', 'Mama von {n} schaut zu. Und weint.', '{n} muss die nächste Runde zahlen. Und die Beerdigung.'];
  // Schwarzhumorige Untertitel in der Fahrer-Vorschau (Wunsch Patrick: Ansage nur der Name wie bei Smash, Witz als Text)
  const TAGS = {jonas: 'Rechnet nach jedem Unfall sofort ab. Auch mit den Hinterbliebenen.', simon: 'Leuchtet im Dunkeln. Sonnenbrand Stufe Hautkrebs.',
    patrick: 'Fährt jedes Rennen, als wäre es sein letztes. Statistisch gesehen bald richtig.', marco: 'Schwächster Fahrer im Feld. Hat trotzdem einen Führerschein. Keiner weiß, wie.',
    greisel: 'Promille sind auch nur Zahlen. Die Leber sieht das anders.', dajo: 'Bringt Snacks mit. Notfalls für den Leichenschmaus.',
    simon_love: 'Hat sein Herz verloren. Und das Portemonnaie. Und 400 Euro.', patrick_fat: 'Zwölf Spieße Picanha. Der Defibrillator fährt mit.',
    marco_dia: 'Bremsspuren garantiert. Nicht nur auf der Straße.', jonas_kater: 'Fährt mit Restalkohol von vorgestern. Und gestern.',
    greisel_wb: 'Die Leber hat bereits gekündigt. Fristlos.', dajo_party: 'Seit drei Tagen wach. Was soll schon passieren?',
    taxi: 'Hat noch keinen Fahrgast lebend abgeliefert. Fast keinen.', coati: 'Tollwut nicht ausgeschlossen. Eher wahrscheinlich.',
    officer: 'Hat schon Omas wegen Nagelfeilen in Handschellen gelegt.', dona: 'Hat drei Ehemänner überlebt. Du bist Nummer vier.',
    guide: 'Bringt jeden Touristen zurück. Meistens am Stück.', steward: 'Die Notausgänge befinden sich … ach, egal.',
    caimanx: 'Hat den letzten Guide gefressen. Und dessen Fischerhut.', manuel: 'Kommt nicht an die Pedale. Fährt trotzdem. Gott steh uns bei.',
    erich: 'Hat seit 1987 nicht mehr gelächelt. Und fängt jetzt nicht damit an.', rasmus: 'Organisiert auch deine Trauerfeier. Mit Polonaise und Freibier.', ilkay: 'Deutscher Pass, mexikanischer Schnurrbart, türkische Soße. Macht dich zu Hackfleisch.', patmum: 'Lunge aus Teer, Herz aus Gold. Holt dich nachts um vier ab und schmückt vorher noch schnell den Vorgarten.', felix: 'Hat mehr Spitznamen als Sommersprossen. Diskutiert sogar mit dem Bestatter über den Sargpreis.'};
  const roastOf = n => pick(ROAST).replace(/\{n\}/g, n);
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
    // Der Letzte: eigene Leiste unten vor dem Podest (Kopf, Eimer, schwarzhumoriger Nachruf), überdeckt keinen Podestplatz
    if (P0.last && el > 1.4) { const pw = Math.min(W - 24, 360), px = (W - pw) / 2, py = H - 132, img = headImg(P0.last.id), hs = 50; ctx.globalAlpha = clamp((el - 1.4) / .5, 0, 1);
      ctx.fillStyle = 'rgba(14,6,22,.9)'; ctx.strokeStyle = 'rgba(255,120,120,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, pw, 70, 12) : ctx.rect(px, py, pw, 70); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(px + 36, py + 35); ctx.rotate(Math.sin(el * 2) * .12); ctx.drawImage(img, -img.width / 2 * hs / 116, -img.height / 2 * hs / 116, img.width * hs / 116, img.height * hs / 116); ctx.restore(); ctx.drawImage(E('🪣', 26), px + 52, py + 38, 26, 26);
      ctx.textAlign = 'left'; ctx.font = '800 12px system-ui,sans-serif'; ctx.fillStyle = '#ff9a9a'; ctx.fillText('🪦 LETZTER: ' + P0.last.n.toUpperCase(), px + 84, py + 22, pw - 94); ctx.font = 'italic 600 12px system-ui,sans-serif'; ctx.fillStyle = '#ffe3e3';
      const rw = P0.last.roast.split(' '), lines = ['']; rw.forEach(w0 => { const t2 = (lines[lines.length - 1] + ' ' + w0).trim(); if (ctx.measureText(t2).width > pw - 96 && lines[lines.length - 1]) lines.push(w0); else lines[lines.length - 1] = t2; });
      lines.slice(0, 2).forEach((l0, i) => ctx.fillText(l0, px + 84, py + 42 + i * 15, pw - 94)); ctx.textAlign = 'center'; ctx.globalAlpha = 1; }
    ctx.font = '700 13px system-ui,sans-serif'; ctx.fillStyle = `rgba(255,255,255,${.5 + .3 * Math.sin(el * 4)})`; ctx.fillText('Antippen zum Überspringen', cx, H - 40);
    ctx.restore(); }
  // Siegerehrung nach dem Grand Prix: Podest auf dem Canvas, Tabelle im Kasten
  function ceremony() {
    const tbl = Object.entries(CUP.pts).sort((a, b) => b[1] - a[1]), myPl = tbl.findIndex(([id]) => id === me) + 1;
    if (myPl === 1) { setTimeout(() => ach('cup'), 1200); const c = loadJ('kartCups'); c[me] = (c[me] || 0) + 1; store.set('kartCups', JSON.stringify(c)); const s1 = stats(), had = s1.vcup; s1.cups++; s1.vcup = (s1.vcup || 0) + 1; store.set('kartStats', JSON.stringify(s1));
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
  // Siegerehrung nach dem letzten Rennen des Live-Grand-Prix (gleiche Tabelle auf allen Handys)
  function liveCeremony() { const g = LIVE.gp; if (!g) return; const tb = gpTable(g), myPl = tb.findIndex(r => r.me) + 1; g.cer = 1;
    if (myPl === 1) { setTimeout(() => ach('cup'), 1200); const s1 = stats(), had = s1.vcup; s1.cups++; s1.vcup = (s1.vcup || 0) + 1; store.set('kartStats', JSON.stringify(s1)); const ul = res.querySelector('.kr-unlock'); ul.hidden = had > 0; ul.innerHTML = had > 0 ? '' : '🔓 Neues Fahrzeug: <b>🏆 Goldenes Kart</b>'; }
    else res.querySelector('.kr-unlock').hidden = true;
    res.querySelector('.kr-res-t').textContent = (g.e || '🏆') + ' ' + (g.n || 'Grand Prix');
    res.querySelector('.kr-res-s').textContent = myPl === 1 ? 'Du hast den Live-Grand-Prix gewonnen! Campeão!' : myPl ? 'Du bist ' + myPl + '. geworden. Sieger: ' + (tb[0] || {}).nm + '.' : 'Sieger: ' + (tb[0] || {}).nm + '.';
    const ol = res.querySelector('ol'); ol.innerHTML = ''; const pc = (r, n) => { const c = portrait(r.dr || 'jonas', n, Math.round(n * 1.15)); c.className = 'kr-gppc'; return c; };
    const pod = document.createElement('li'); pod.className = 'kr-podium'; [1, 0, 2].forEach(i => { const r = tb[i]; if (!r) return; const d = document.createElement('div'); d.className = 'p' + (i + 1) + (r.me ? ' me' : ''); d.appendChild(pc(r, 72));
      d.insertAdjacentHTML('beforeend', '<span>' + esc(r.nm) + '</span><b>' + ['🥇', '🥈', '🥉'][i] + ' ' + r.pts + ' P.</b>'); pod.appendChild(d); }); ol.appendChild(pod);
    tb.slice(3).forEach((r, i) => { const li = document.createElement('li'); if (r.me) li.className = 'me'; li.innerHTML = '<b>' + (i + 4) + '.</b>'; li.appendChild(pc(r, 34)); li.insertAdjacentHTML('beforeend', '<span>' + esc(r.nm) + '</span><small>' + r.pts + ' P.</small>'); ol.appendChild(li); });
    ['.kr-stand', '.kr-rnd2'].forEach(q => { const x = res.querySelector(q); if (x) x.hidden = true; });
    res.querySelector('.kr-again').textContent = '👥 Zur Lobby'; const bk = res.querySelector('.kr-res .kr-back'); bk.hidden = true;
    SFX.fanfare(); real('applause', .8); say('cupwin', 'Der Grand-Prix-Sieger steht fest!', 1); if (myPl === 1 && S) fireworks(120); gpSave(); }
  const THEME = {serra: ['#9aa0a8', '#2f7a3a'], cataratas: ['#2d6b35', '#b5855a'], costa: ['#36c2d0', '#2f7a3a'], riotour: ['#f1d9a2', '#1694b8'], minhocao: ['#8a8e95', '#ffd23f'], gru: ['#d7dbe0', '#2b5f9e'], bridge: ['#1d7fa8', '#0b2e4a'], manaus: ['#3a3f45', '#0a2a33'], lopes: ['#fff3d6', '#22c3c9'], guaruja: ['#ffe3a3', '#2fb8cc'], sp: ['#9aa0a8', '#3f444c'], copa: ['#f8d98f', '#1694b8'], reveillon: ['#2a2f6e', '#05081c'], cristo: ['#5fae66', '#1d5a2b'],
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
    if (!rows.length) { el.hidden = true; return; } el.hidden = false;
    const ME = PME(), lost = ME ? rows.filter(r => seen[r.tr.id] === ME && r.list[0].who !== ME) : [];   // Gäste sehen ihre eigenen Rekord-Hinweise
    if (!Object.keys(seen).length) { const s0 = {}; rows.forEach(r => { s0[r.tr.id] = r.list[0].who; }); store.set('kartRecSeen', JSON.stringify(s0)); }
    const cnt = {}; rows.forEach(r => { cnt[r.list[0].who] = (cnt[r.list[0].who] || 0) + 1; });
    { const h = document.querySelector('[data-hint="kart-tab"]'), k0 = Object.entries(cnt).sort((x, y) => y[1] - x[1])[0]; if (h && k0 && !h.dataset.live) { h.textContent = '👑 ' + NAME(k0[0]) + ' · ' + rows.length + '/' + TRACKS.length + ' Bestzeiten'; h.classList.add('live'); } }
    // Auf der Seite nur Hinweise auf neue Rekorde (Rekordhalter hat gewechselt), die ganze Bestenliste gibt es im Spiel
    const fresh = Object.keys(seen).length ? rows.filter(r => seen[r.tr.id] !== r.list[0].who && r.list[0].who !== ME) : [];
    const allB = '<button type="button" class="kb-all">🏆 Bestenliste & Gesamtwertung ansehen</button>';
    if (!fresh.length) { el.innerHTML = allB; return; }
    el.innerHTML = allB + fresh.map(r => { const top = r.list[0], mine = ME && seen[r.tr.id] === ME;
      return '<button type="button" class="' + (mine ? 'kb-lost' : 'kb-new') + '" data-t="' + r.tr.id + '">' + (mine ? '😱 <b>' + esc(NAME(top.who)) + '</b> hat deine Bestzeit auf ' + esc(r.tr.name) + ' geknackt (' + fmt(top.ms) + ')! Hol ihn dir zurück. ⚔️'
        : '🏆 <b>' + esc(NAME(top.who)) + '</b> hat eine neue Bestzeit auf ' + esc(r.tr.name) + ' geholt: ' + fmt(top.ms) + ' ⚔️') + '</button>'; }).join('') +
      '<button type="button" class="kb-x" aria-label="Hinweise ausblenden">✕ gesehen</button>'; }
  document.addEventListener('click', e => { if (!e.target.closest('#kt-board .kb-all')) return; open(); setTimeout(() => { const d = menu.querySelector('.kr-recs'); if (d) { d.open = true; d.scrollIntoView({behavior: 'smooth', block: 'start'}); } }, 350); });
  document.addEventListener('click', e => { if (!e.target.closest('#kt-board .kb-x')) return; const s0 = {}; TRACKS.forEach(tr => { const top = lbList(LB, tr.id)[0]; if (top) s0[tr.id] = top.who; }); store.set('kartRecSeen', JSON.stringify(s0)); board(); });
  document.addEventListener('click', e => { const b = e.target.closest('#kt-board button[data-t]'); if (!b) return; TRK = b.dataset.t; store.set('kartTrack', TRK);
    MODE = 'single'; store.set('kartMode', MODE); GHOST.mode = 'crew'; store.set('kartGhost', 'crew'); open(); });
  // Erklärtexte zu den Fahrer-Werten (Antippen im Menü)
  const BXK = ['spd', 'hdl', 'acc', 'tgh'], BXT = {spd: ['Tempo', '🏎️ Höchstgeschwindigkeit auf der Geraden (bis ±3 %). Kommt vom Trinktempo (TTP) der FIFA-Karte.'],
    hdl: ['Lenkung', '🎯 Wie scharf das Kart einlenkt, enge Kurven gehen leichter (bis ±6 %). Kommt von der Orientierung (ORI).'],
    acc: ['Start', '🚦 Wie schnell das Kart beim Start und nach Unfällen wieder auf Tempo ist (bis ±14 %). Kommt von der Pünktlichkeit (PÜN).'],
    tgh: ['Nehmer', '💥 Wie gut man Treffer wegsteckt: Nach Öl, Nasenbär oder Hindernis dreht man sich kürzer (bis ein Viertel schneller wieder unterwegs). Kommt von der Kater-Resistenz (KAT).']};
  let BX = null;
  // Hochaufgelöste Porträts fürs Menü: direkt aus dem Foto (nicht aus dem kleinen Renn-Kopf), eckig, mit Zeichnungen der Zustände
  const PIMG = {}; let PCACHE = {}, PRT = 0;
  function pimg(id, alt) { const p = CREW.find(c => c.id === id), X0 = XBY[id], src = X0 && X0.photo ? X0.photo : p && kPhoto(p, alt).src, key = id + '#' + src; if (!src) return null; const im = PIMG[key]; if (im) return im.ok ? im : null;
    const n = new Image(); PIMG[key] = n; n.onload = () => { n.ok = 1; PCACHE = {}; clearTimeout(PRT); PRT = setTimeout(() => { if (!box.hidden && !menu.hidden) renderMenu(); }, 60); }; n.src = src; return null; }
  function portrait(id, w, h, zm) { const dpr = Math.min(w > 140 ? 3 : 2, Math.max(2, window.devicePixelRatio || 1)),   /* kleine Kacheln mit 2-facher Dichte: halber Speicher (26 Fahrer, jedes Menü-Bild doppelt) */ key = id + ':' + w + 'x' + h + ':' + (zm || 1); if (PCACHE[key]) return cloneCv(PCACHE[key], w, h);
    const X = XBY[id], b = X && X.base ? X.base : (X ? null : id), alt = !!(X && X.base), col = (LOOK[id] || {}).shirt || '#00a651', im = b ? pimg(b, alt) : X && X.photo ? pimg(id) : null;
    const c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); const x = c.getContext('2d'); x.scale(dpr, dpr); x.imageSmoothingQuality = 'high';
    const g = x.createRadialGradient(w * .5, h * .38, 4, w * .5, h * .5, h * .85); g.addColorStop(0, col); g.addColorStop(1, '#0b1220'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.save(); x.globalAlpha = .12; x.strokeStyle = '#fff'; x.lineWidth = w * .05; for (let q = -h; q < w + h; q += w * .16) { x.beginPath(); x.moveTo(q, h); x.lineTo(q + h * .6, 0); x.stroke(); } x.restore();
    const em = (e, px, ex, ey, rot) => { x.save(); x.translate(ex, ey); if (rot) x.rotate(rot); x.font = px + 'px system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = px * .15; x.fillText(e, 0, 0); x.restore(); };
    let eyeY = h * .45;
    if (X && X.npc && !X.photo) em(X.e, h * .66, w / 2, h * .54);
    else if (im) { const f = (X && X.photo ? X.face : kPhoto(CREW.find(c => c.id === b), alt).f) || {x: .5, y: .5, z: 1, e: .45}, D = Math.min(w, h) * 1.15 * (zm || 1) * f.z, cx = w / 2, cy = h * .5, sx = X && X.ov === 'fat' ? 1.18 : 1;
      x.save(); x.translate(cx, cy); x.scale(sx, 1); x.drawImage(im, -f.x * D, -f.y * D, D, D); x.restore(); eyeY = cy + ((f.e || .45) - f.y) * D;
      const v = x.createLinearGradient(0, h * .55, 0, h); v.addColorStop(0, 'rgba(11,18,32,0)'); v.addColorStop(1, 'rgba(11,18,32,.85)'); x.fillStyle = v; x.fillRect(0, 0, w, h); }
    else { x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '900 ' + h * .5 + 'px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(NAME(id)[0], w / 2, h * .52); }
    if (X && X.ov) { const tint = {love: 'rgba(255,80,160,.28)', sick: 'rgba(110,200,40,.36)', hang: 'rgba(150,190,140,.22)', fat: 'rgba(255,120,80,.16)', grump: 'rgba(220,40,40,.14)', disco: null, foam: null}[X.ov]; if (tint) { x.fillStyle = tint; x.fillRect(0, 0, w, h); }
      const s0 = Math.min(w, h);
      if (X.ov === 'love') { em('💋', s0 * .3, w * .78, h * .72, -.25); em('❤️', s0 * .22, w * .16, h * .16); em('💕', s0 * .2, w * .84, h * .18); em('😍', s0 * .2, w * .16, h * .78); }
      if (X.ov === 'fat') { em('🍗', s0 * .34, w * .8, h * .76, .5); em('🍖', s0 * .22, w * .17, h * .8, -.4); em('💦', s0 * .17, w * .16, h * .2); }
      if (X.ov === 'sick') { em('💩', s0 * .3, w * .8, h * .78); em('💦', s0 * .18, w * .16, h * .22); em('🧻', s0 * .22, w * .18, h * .8); }
      if (X.ov === 'hippie') { em('🌼', s0 * .22, w * .2, h * .14, -.3); em('✌️', s0 * .24, w * .82, h * .18, .2); em('🎉', s0 * .24, w * .18, h * .8, -.2); }
      if (X.ov === 'taco') { em('🌮', s0 * .24, w * .18, h * .15, -.3); em('🥙', s0 * .22, w * .84, h * .17, .2); em('🤙', s0 * .26, w * .18, h * .8, -.2); }
      if (X.ov === 'mum') { em('💐', s0 * .24, w * .18, h * .15, -.3); em('🚬', s0 * .22, w * .84, h * .62, -.2); em('🏡', s0 * .24, w * .84, h * .15, .1); em('💨', s0 * .2, w * .18, h * .8, .2); }
      if (X.ov === 'golf') { em('⛳', s0 * .24, w * .18, h * .15, -.2); em('🗯️', s0 * .24, w * .84, h * .17, .2); em('🏌️', s0 * .26, w * .18, h * .8, -.1); }
      if (X.ov === 'grump') { em('💢', s0 * .26, w * .82, h * .17); em('🗯️', s0 * .2, w * .17, h * .2, -.2); em('📋', s0 * .24, w * .18, h * .8, -.2); }
      if (X.ov === 'hang') { em('🕶️', s0 * .6, w / 2, eyeY); em('💫', s0 * .22, w * .84, h * .16); em('🥴', s0 * .2, w * .16, h * .8); }
      if (X.ov === 'foam') { x.fillStyle = '#fffaf0'; [[.15, .05, .18], [.38, 0, .2], [.62, .02, .19], [.86, .06, .16]].forEach(([a, b0, r]) => { x.beginPath(); x.arc(a * w, b0 * h, r * s0, 0, TAU); x.fill(); }); em('🍺', s0 * .34, w * .8, h * .76, -.15); }
      if (X.ov === 'disco') { x.save(); x.globalCompositeOperation = 'screen'; ['#ff5fa2', '#ffd23f', '#22c3c9', '#9b5de5'].forEach((cc, n) => { x.fillStyle = cc; x.globalAlpha = .28; x.beginPath(); x.moveTo(w / 2, -h * .1); x.arc(w / 2, -h * .1, h * 1.4, Math.PI * (.25 + n * .14), Math.PI * (.32 + n * .14)); x.fill(); }); x.restore(); em('🪩', s0 * .26, w * .82, h * .16); em('🕺', s0 * .22, w * .17, h * .8); } }
    if (!im && b && CREW.some(c0 => c0.id === b && c0.photo)) return c;   // Foto lädt noch: nicht zwischenspeichern
    PCACHE[key] = c; return cloneCv(c, w, h); }
  const cloneCv = (src, w, h) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.style.aspectRatio = w + '/' + h; return c; };
  // Vorschau im Menü: eigenes Fahrzeug von oben mit Kopf und Größe der Figur
  function vehPreview(id) { const c = document.createElement('canvas'), st = STY[id] || {}, vt = T ? vehOf(id) : 'kart', vz = VSZ[vt] || st.vs || 1, W2 = 130, H2 = 160; c.width = W2 * 2; c.height = H2 * 2; c.className = 'kr-vp'; const x = c.getContext('2d'); x.scale(2, 2);
    const v = VEH[id]; x.save(); x.translate(W2 / 2, H2 / 2 + 6); x.scale(1.75 * vz, 1.75 * vz); x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(2, 4, 20, 27, 0, 0, TAU); x.fill(); if (v) x.drawImage(v, -22, -30, 44, 60); x.restore();
    const h = headImg(id); if (h) { const sz = h.width * .26 * 1.75 * (st.hs || 1) * Math.sqrt(vz); x.drawImage(h, W2 / 2 - sz / 2, H2 / 2 + 6 + (VHEAD[vt] !== undefined ? VHEAD[vt] * 1.6 : st.seat === 'none' ? 0 : 6) * vz - sz / 2 - sz * .05, sz, sz * (h.height / h.width)); }
    x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '700 10px system-ui'; x.textAlign = 'center'; x.fillText(vz > 1.04 ? '⬆ groß' : vz < .96 ? '⬇ klein' : '', W2 / 2, H2 - 4); return c; }
  let FSL = null, RSPIN = 0, WHOOPEN = false;
  const VSHORT = {kart: 'ausgewogen', uber: 'schwer, stabil', uno: 'zieht stark an', cart: 'rutschig, wendig', wheel: 'leicht, lange Turbos', gold: 'von allem mehr',
    capi: 'tiefenentspannt, Gelände', moto: 'spritzig, Lücken-Turbo', coco: 'legt Kokos-Fallen', sail: 'Wind, rutschig', horse: 'kein Drift, Galopp', trak: 'Gelände egal, langsam', rocket: 'Endtempo, lenkt mies', trio: 'Bass-Stoß, riesig'};
  let VINFO = null;   // Fahrzeug, dessen Infos gerade aufgeklappt sind (antippen = Infos, freie Fahrzeuge werden dabei gewählt)
  // Fahrer-Infos stehen oben unter der Vorschau (Wunsch Patrick 09.10. spät: vorher unter der Reihe des Fahrers, dann sah man bei den unteren Fahrern die Werte oben nicht).
  // Nach dem Antippen eines Fahrers springt das Menü zurück nach oben, falls die Vorschau aus dem Bild gescrollt ist.
  function drvTop() { requestAnimationFrame(() => { const dv = menu.querySelector('.kr-drv'); if (!dv) return; const st = dv.previousElementSibling || dv, r = st.getBoundingClientRect(), mr = menu.getBoundingClientRect();
    if (r.top < Math.max(0, mr.top) - 2) st.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'}); }); }
  // Strecken wie die Stage-Auswahl bei Smash Bros: Raster aus Kacheln, Info-Kasten unter der Reihe der gewählten Strecke.
  // Werte 1–5 (Kurven, Tempo = lange Geraden, Chaos = Hindernisse/Querläufer/Wetter), gemessen am 09.10. über die abgetastete Ideallinie (Kurvigkeit, Anteil Geraden, längste Gerade) und die Hindernis-Listen
  const TINFO = {
    gru: [2, 4, 4, 'Lange Geraden übers Vorfeld, hoch auf die Abflugebene und unten durch die Unterführung. Gepäckbänder geben Schub oder bremsen, Gepäckwagen kreuzen, ohne zu gucken.'],
    guaruja: [3, 3, 3, 'Am Strand los, dann hoch auf den Morro do Maluf: Kuppe mit Sprung, Brücke über die Schlucht, im Tunnel wieder runter. Der Maisverkäufer läuft trotzdem, wann er will.'],
    sp: [3, 3, 4, 'Großstadt-Chaos: Mautschranke, Straßenbahn und Motoboys. Wer die Schranke verpasst, steht.'],
    riotour: [3, 5, 4, 'Einmal quer durch Rio: lange Copacabana-Gerade, um die Lagoa mit Brücke und Überführung, durch den Túnel Rebouças hoch zum Cristo, über Santa Teresa und am Aterro an der Bucht entlang, um den Zuckerhut und durch den Túnel Novo zurück.'],
    costa: [4, 4, 4, 'Durch die Kopfsteinpflaster-Gassen von Paraty, die Küstenstraße entlang, in Kehren hoch in die Serra da Bocaina und runter nach Angra, mit der Fähre (Schranke!) rüber nach Abraão, durch den Inseldschungel an den Traumstrand Lopes Mendes und über die Brücke zurück.'],
    cataratas: [4, 3, 4, 'Von Foz über die Grenzbrücke nach Argentinien (Zoll!), in Schlangenlinien durch den Urwald, über den Holzsteg an der Garganta do Diabo zurück nach Brasilien und die Trilha rauf und runter. Rote Erde: rutschig. Nasenbären!'],
    serra: [4, 4, 4, 'Von der Avenida in São Paulo über die Imigrantes mit Mautstelle, Tunneln und Viadukten über die Schlucht runter an den Strand von Guarujá und über die Serpentinen der alten Estrada wieder hoch.'],
    minhocao: [3, 3, 3, 'Die Acht über die Hochstraße: durch den Tunnel, über sich selbst drüber und ohne Geländer. Wer zu weit rausfährt, fällt.'],
    copa: [4, 2, 3, 'Der Klassiker an der Promenade: enge Kurven, und die Welle schwappt regelmäßig über die Uferstraße.'],
    reveillon: [4, 2, 4, 'Copacabana zu Silvester bei Nacht: Feuerwerk, Sektflaschen auf der Fahrbahn und die Welle kommt doppelt so oft.'],
    cristo: [4, 3, 5, 'Hoch auf den Corcovado und in Serpentinen wieder runter: Nebel, Zahnradbahn-Schranke, Affen klauen Items, und neben der Straße geht es steil bergab.'],
    bridge: [1, 5, 3, 'Fast 3 km Vollgas über die Guanabara-Bucht, in der Mitte hoch über den Vão central. Seitenwind-Böen schieben dich zum Rand, und da ist kein Geländer.'],
    iguacu: [2, 3, 5, 'Rutschpartie im Regenwald: nasse Fahrbahn, Pfützen, Nasenbären und die Gischt der Fälle. Abgrund inklusive.'],
    amazon: [3, 3, 3, 'Bootsrennen auf dem Fluss: alle fahren Boot, Kaimane und Baumstämme sind im Weg, Delfine schenken Turbo.'],
    manaus: [3, 4, 4, 'Nachts im Hafen: Container, Kräne, Gabelstapler. Lange Geraden, aber du siehst nur, was die Laternen zeigen.'],
    paraty: [4, 2, 4, 'Kopfsteinpflaster in der Altstadt: rutschig und verwinkelt, die Flut lässt Pfützen wachsen, die Kutsche hat Vorfahrt.'],
    ilha: [5, 1, 3, 'Die kurvigste Strecke: keine Autos auf der Insel, nur Gepäckkarren, Koffer und ein Hund, der alles jagt.'],
    lopes: [2, 5, 3, 'Traumstrand mit den längsten Geraden im Sand, über den Dschungelhügel mit Kuppe und über die Holzbrücke am Bach. Auf dem Feld wird Fußball gespielt.']};
  const perim = t => { let s0 = 0; t.cp.forEach((p0, i) => { const q = t.cp[(i + 1) % t.cp.length]; s0 += Math.hypot(q[0] - p0[0], q[1] - p0[1]); }); return s0 * (t.k || 1.15); }, PSHORT = TRACKS.filter(t => !t.long).reduce((a, t) => a + perim(t), 0) / Math.max(1, TRACKS.filter(t => !t.long).length);
  function tinfo(t, bt) { const [ku, te, ch, x] = TINFO[t.id] || [3, 3, 3, ''], r0 = lbList(LB, t.id)[0], dots = n => '<em>' + '●'.repeat(n) + '<u>' + '●'.repeat(5 - n) + '</u></em>', lp = t.laps || 3;
    const chips = [t.long && '🛣️ Langstrecke · ' + (perim(t) / PSHORT).toFixed(1).replace('.', ',') + '× so lang', '🔁 ' + lp + (lp === 1 ? ' Runde' : ' Runden'), t.id === 'minhocao' ? '∞ Acht' : CWT[t.id] ? '↻ rechtsherum' : '↺ linksherum', (t.tunnels || TUNT[t.id]) && '🚇 Tunnel', (t.hills || HILLT[t.id]) && '⛰️ Berg', (t.hills || HILLT[t.id] || []).some(h => h[3] && h[3].jump) && '🛫 Kuppe', (t.bridges || BRGT[t.id]) && '🌉 Brücke', FALLT[t.id] && '⚠️ Abgrund', t.rain && '🌧️ Regen', t.fog && '🌫️ Nebel',
      (t.id === 'manaus' || t.id === 'reveillon') && '🌙 Nacht', t.wave && '🌊 Welle', t.wind && '💨 Seitenwind', t.flood && '🌊 Flut', t.belts && '🧳 Gepäckbänder', t.gates && '🚧 Schranke', t.veh === 'boat' && '🛶 alle im Boot', t.veh === 'cart' && '🧳 Gegner im Gepäckkarren', SECRET[t.id] && t.cut !== false && '🤫 Schleichweg'].filter(Boolean);
    const el = document.createElement('div'); el.className = 'kr-tinfo';
    el.innerHTML = '<div class="kr-tih"><span class="kr-tic"></span><div><b><em class="kr-sn">' + (TRACKS.indexOf(t) + 1) + '</em>' + t.e + ' ' + esc(t.name) + '</b><small>' + esc(t.sub) + '</small></div></div><p class="kr-tix">' + esc(x) + '</p><div class="kr-tim"><span><b>Kurven</b>' + dots(ku) + '</span><span><b>Tempo</b>' + dots(te) + '</span><span><b>Chaos</b>' + dots(ch) + '</span></div>' +
      '<p class="kr-tch">' + chips.map(c => '<i>' + c + '</i>').join('') + '</p><p class="kr-tbt">' + (ccNow() !== 150 ? CCE[ccNow()] + ' ' + CCN[ccNow()] + ': ' : '') + (r0 ? '👑 Bestzeit ' + fmt(r0.ms) + ' · ' + esc(NAME(r0.who)) : '👑 Bestzeit noch frei') + (bt && bt[tkey(t.id)] ? ' · ⏱ deine ' + fmt(bt[tkey(t.id)]) : '') + '</p>';
    const c = thumb(t), d = document.createElement('canvas'); d.width = c.width; d.height = c.height; d.getContext('2d').drawImage(c, 0, 0); el.querySelector('.kr-tic').appendChild(d); return el; }
  /* Strecken-Infos stehen fest über dem Raster (Wunsch Patrick 09.10. spät: unter der Reihe der Strecke verschob sich das Raster bei jedem Antippen,
     man fand die nächste Strecke nicht oder traf aus Versehen eine andere). Der Kasten wird nie kleiner (TIH), damit das Raster darunter ruhig bleibt. */
  let TIH = 0, TIL = null;   // TIL = Strecke, deren Kasten zuletzt eingeblendet wurde (Animation nur beim Wechsel)
  function tinfoTop(inf) { const tr = menu.querySelector('.kr-sgrid'); menu.querySelectorAll('.kr-tinfo').forEach(x => { if (x !== inf) x.remove(); }); if (!tr || !inf) return; tr.before(inf);
    inf.style.minHeight = ''; const h = inf.offsetHeight; if (h > TIH) TIH = h; if (TIH) inf.style.minHeight = TIH + 'px'; }
  // nach dem Antippen zurück zum Info-Kasten, falls er (fast) ganz aus dem Bild gescrollt ist; ist er noch teilweise zu sehen, bleibt alles stehen
  function showTop(el) { requestAnimationFrame(() => { if (!el) return; const r = el.getBoundingClientRect(), mr = menu.getBoundingClientRect();
    if (r.bottom < Math.max(0, mr.top) + Math.min(160, r.height * .6)) el.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'}); }); }
  /* Fahrzeug-Infos fest über dem Raster (Wunsch Patrick 09.10. spät, wie bei Fahrern und Strecken: unter der Reihe des Fahrzeugs verschob sich das Raster bei jedem Antippen).
     Der Kasten wird nie kleiner (VIH), damit das Raster darunter ruhig bleibt; Einblenden nur bei neuem Fahrzeug (VIL). */
  let VIH = 0, VIL = null;
  function placeVInfo(inf) { const vc = menu.querySelector('.kr-vcar'); inf = inf || menu.querySelector('.kr-vinfo'); menu.querySelectorAll('.kr-vinfo').forEach(x => { if (x !== inf) x.remove(); }); if (!vc || !inf) return; vc.before(inf);
    inf.style.minHeight = ''; const h = inf.offsetHeight; if (h > VIH) VIH = h; if (VIH) inf.style.minHeight = VIH + 'px'; }
  // Werkstatt: Fahrzeug wählen, Leistungsbalken (grün = Tuning), 6 Teile mit Vorher/Nachher und Preis
  let WSV = null;
  const vbase = v => { const t = VTUNE[v] || VTUNE.kart, x = VTX[v] || VTX.kart, n = (a, lo, hi) => clamp((a - lo) / (hi - lo), .04, 1); return [n(t[0], .88, 1.1), n(t[2], .7, 1.3), n(x.g, .7, 1.35), n(t[1], .75, 1.2), n(x.b, .8, 1.7), n(x.m, .5, 2.4)]; };
  function wsRender() { const b0 = menu.querySelector('.kr-wsb'); if (!b0) return; const vs = VEHS.filter(unlocked), v = vs.some(x => x.id === WSV) ? WSV : myVeh(), V = VEHS.find(x => x.id === v) || VEHS[0], tu = tuneOf(v), cn = coins(), sum = id => TKEYS.reduce((a, q) => a + tuneOf(id)[q], 0), bs = vbase(v);
    const bars = [['Tempo', bs[0], tu.m * .06], ['Beschleunigung', bs[1], tu.a * .06], ['Haftung', bs[2], tu.r * .05], ['Lenkung', bs[3], tu.s * .05], ['Turbo', bs[4], tu.t * .06], ['Nehmer', bs[5], tu.p * .06]];
    b0.innerHTML = '<div class="kr-wsv">' + vs.map(x => '<button type="button" data-wv="' + x.id + '" aria-pressed="' + (x.id === v) + '" title="' + esc(x.n) + '"><i>' + x.e + '</i><small>' + sum(x.id) + '/30</small></button>').join('') + '</div>' +
      '<div class="kr-wsh"><span class="kr-wsc"></span><div><b>' + V.e + ' ' + esc(v === 'kart' && STYK(me) ? STN[STYK(me)] || V.n : V.n) + (v === myVeh() ? ' <em>✓ fährst du</em>' : '') + '</b><small>Tuning ' + sum(v) + ' von 30 Stufen · 🪙 ' + cn + '</small><div class="kr-wsbars">' +
      bars.map(([n, b, ad]) => '<div><span>' + n + '</span><i><s style="width:' + Math.round(b * 100) + '%"></s><u style="width:' + Math.round(Math.min(ad, 1 - b) * 100) + '%"></u></i></div>').join('') + '</div></div></div>' +
      '<div class="kr-wsl">' + TUNE.map(u => { const lv = tu[u.k], c = TCOST[lv], mx = lv >= 5; return '<div class="kr-wsr"><i>' + u.e + '</i><div><b>' + esc(u.n) + ' <span class="kr-wsd">' + '<em class="on"></em>'.repeat(lv) + '<em></em>'.repeat(5 - lv) + '</span></b><small>' + (lv ? esc(u.f(lv)) : esc(u.x)) + (mx ? '' : ' → <b>' + esc(u.f(lv + 1)) + '</b>') + '</small></div><button type="button" class="kr-wsbuy" data-k="' + u.k + '"' + (mx || cn < c ? ' disabled' : '') + '>' + (mx ? '✓ Max' : '⬆ ' + c + ' 🪙') + '</button></div>'; }).join('') + '</div>' +
      '<p class="kr-rkx">Antippen oben wählt das Fahrzeug auch fürs Rennen. Tuning gilt nur für dieses Fahrzeug und bleibt am Konto gespeichert. Gegner ziehen ein wenig mit, damit Rennen spannend bleiben.</p>';
    { const pt = Object.assign({}, paintOf(me), partsPt()), c = vehSprite(pt.c || (LOOK[me] || {}).shirt || '#00a651', v, pt, me), d = document.createElement('canvas'); d.width = c.width; d.height = c.height; d.getContext('2d').drawImage(c, 0, 0); b0.querySelector('.kr-wsc').replaceWith(d); }
    sumBadge('ws', sum(myVeh()) + '/30'); }
  const sumBadge = (k, t) => { const sm = menu.querySelector('.kr-' + k + ' summary'); if (!sm) return; let b = sm.querySelector('em'); if (!b) { b = document.createElement('em'); sm.appendChild(b); } b.textContent = t; };
  function pickDrv(id) { const ch = me !== id; me = id; makeVehicles(); renderMenu(); newRace(); S.paused = true; if (ch) announce(me); }
  // Ansage des Fahrernamens wie im Prügelspiel (Handy-Stimme), Auswahl-Geräusch
  // Ansage bei der Fahrerwahl wie bei Super Smash Bros (Wunsch Patrick 08.10.): je Figur Beiname + Name mit Hall, Aufnahme h_<id> in audio/kart7.mp3 (lädt beim Öffnen des Menüs)
  let ANNSRC = null;
  // Zufallsrennen (Einzelrennen): Fahrer, Fahrzeug und Strecke laufen wie an einem Spielautomaten durch, halten nacheinander an, dann geht es sofort los
  const slot = document.createElement('div'); slot.className = 'kr-slot'; slot.hidden = true; box.appendChild(slot); let SLOTRUN = false;
  function slotShow(d, t, v, boat, live, then, cc) { SLOTRUN = true; cc = CCS.includes(cc) ? cc : 150; const pick = a => a[Math.floor(Math.random() * a.length)], vs = VEHS.filter(unlocked);
    const dEmo = id => (XBY[id] && XBY[id].e) || (SPECIAL[id] || {}).e || '🙂', vName = (v0, id) => v0.id === 'kart' && STYK(id) ? STN[STYK(id)] || v0.n : v0.n;
    slot.innerHTML = '<div class="kr-slotc" role="dialog" aria-label="Zufallsrennen"><p class="kr-slott">🎲 Zufallsrennen' + (live ? ' für alle' : '') + '</p><div class="kr-reels">' + ['Fahrer', 'Fahrzeug', 'Strecke', 'Klasse'].map(n => '<div class="kr-reel spin"><small>' + n + '</small><span class="kr-rv"></span><b></b></div>').join('') + '</div><p class="kr-slotx">' + (live ? 'Der Automat lost für jeden …' : 'Der Automat entscheidet …') + '</p></div>';
    slot.hidden = false; res.hidden = true; const R = [...slot.querySelectorAll('.kr-reel')], t0 = performance.now(), STOP = [950, 1550, 2150, 2750], done = [0, 0, 0, 0];
    const show = (r, emo, nm) => { R[r].querySelector('.kr-rv').textContent = emo; R[r].querySelector('b').textContent = nm; };
    const fin = r => { done[r] = 1; const el = R[r]; el.classList.remove('spin'); el.classList.add('stop'); const rv = el.querySelector('.kr-rv'); rv.textContent = ''; try { SFX.pick(); } catch (e) {}
      if (r === 0) { rv.appendChild(portrait(d, 92, 92, .9)); el.querySelector('b').textContent = NAME(d); try { announce(d); } catch (e) {} }
      if (r === 1) { if (boat || !v) show(1, '🛶', 'Boot (Amazonas)'); else { const c = vehSprite(paintOf(d).c || (LOOK[d] || {}).shirt || '#00a651', v.id, Object.assign({}, paintOf(d), partsPt()), d), cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); cv.className = 'kr-rveh'; rv.appendChild(cv); el.querySelector('b').textContent = vName(v, d); } }
      if (r === 2) { const c = thumb(t), cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); rv.appendChild(cv); el.querySelector('b').textContent = t.e + ' ' + t.name; }
      if (r === 3) { show(3, CCE[cc], CCN[cc]); slot.querySelector('.kr-slotx').textContent = cc === 200 ? '🚀 Vollgas! Los geht’s!' : cc === 100 ? '🐢 Gemütlich … los geht’s!' : '🏁 Los geht’s!'; } };
    const iv = setInterval(() => { const el = performance.now() - t0; if (box.hidden) { clearInterval(iv); slot.hidden = true; SLOTRUN = false; return; }
      [0, 1, 2, 3].forEach(r => { if (done[r]) return; if (el >= STOP[r]) return fin(r); if (r === 0) { const q = pick(DRVS); show(0, dEmo(q), NAME(q)); } else if (r === 1) { const q = pick(vs); show(1, q.e, q.n); } else if (r === 2) { const q = pick(TRACKS); show(2, q.e, q.name); } else { const q = pick(CCS); show(3, CCE[q], CCN[q]); } });
      if (!done[3]) try { beep(1500 + Math.random() * 500, .018, 'square', .018); } catch (e) {}
      if (done[3]) { clearInterval(iv); setTimeout(() => { slot.hidden = true; SLOTRUN = false; if (!box.hidden) then(); }, 1200); } }, 75); }
  function randomRace() { if (SLOTRUN || MODE !== 'single') return; const pick = a => a[Math.floor(Math.random() * a.length)];
    const d = pick(DRVS), t = pick(TRACKS), boat = t.veh === 'boat', v = pick(VEHS.filter(unlocked)), cc = pick(CCS), base = RNDR || {me0: me, trk0: TRK};   // Klasse wird mit ausgelost (Wunsch Patrick 10.10.), gilt nur für dieses Zufallsrennen
    slotShow(d, t, v, boat, false, () => { RNDR = {me0: base.me0, trk0: base.trk0, veh: boat ? myVeh0() : v.id, cc}; me = d; TRK = t.id; makeVehicles(); startRace(); }, cc); }
  const myVeh0 = () => { const r = RNDR; RNDR = null; const v = myVeh(); RNDR = r; return v; };
  function announce(id) { try { SFX.pick(); noise(.22, .08, 2400); beep(120, .35, 'sawtooth', .07, 50); } catch (e) {}
    const hv = TRIP.kartvo && TRIP.kartvo['h_' + id], hb = hv && BUF['ann' + (hv.f > 1 ? hv.f : '')];
    if (SOUND && ANN && hb && AC) { try { if (ANNSRC) ANNSRC.stop(); } catch (e) {} const s0 = AC.createBufferSource(), g = AC.createGain(); s0.buffer = hb; const t0 = AC.currentTime + .12, d0 = hv.dur / 1000; g.gain.setValueAtTime(1.25, t0); g.gain.setValueAtTime(1.25, t0 + d0 - .08); g.gain.linearRampToValueAtTime(0, t0 + d0); s0.connect(g); g.connect(FXG); s0.start(t0, hv.o / 1000, d0); ANNSRC = s0;   /* genau die Länge der Aufnahme (vorher +0,35 s → Anfang der nächsten Ansage hörbar) */
      if (MM.g) { MM.g.gain.setTargetAtTime(.2, AC.currentTime, .05); MM.g.gain.setTargetAtTime(.55, AC.currentTime + hv.dur / 1000 + .3, .4); } return; }
    if (!SOUND || !ANN || !window.speechSynthesis) return; try { const u = new SpeechSynthesisUtterance(NAME(id) + '!'); u.lang = 'de-DE'; u.rate = 1.05; u.pitch = .55; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }
  // Item-Anleitung im Menü: Kurztext + Mini-Animation aus CSS und Emojis (keine Bilder/Videos, kostet fast nichts)
  const GUIDE = [
    ['turbo', 'boost', 'Antippen = kurzer Turbo. Am besten vor Geraden zünden oder um über eine Abkürzung zu kommen.'],
    ['turbo3', 'boost', 'Drei Turbos: jedes Antippen zündet einen. Schnell hintereinander = langer Schub.'],
    ['pimenta', 'fire', 'Langer Turbo mit Feuer am Heck: Wer dir direkt folgt, verbrennt sich und dreht sich.'],
    ['oil', 'drop', 'Legt eine Pfütze hinter dich. Wer drüberfährt, dreht sich. Gut, wenn jemand dicht hinter dir ist.'],
    ['banana3', 'trail', 'Drei Bananen hängen hinter dir und fangen Geschosse von hinten ab. Antippen = eine Schale ablegen.'],
    ['boller3', 'bang', 'Antippen legt einen Böller ab. Knapp 1 s Zündschnur, dann dreht es alle im Umkreis. Nicht selbst zurückfahren!'],
    ['flip', 'throw', 'Fliegt schnurgerade nach vorn und trifft, wer im Weg ist. Vorher auf den Vordermann zielen.'],
    ['flip2', 'throw', 'Zwei Flip-Flops für zwei Schüsse. Daneben? Gleich nochmal werfen.'],
    ['coati', 'home', 'Der Nasenbär sucht sich den Kart direkt vor dir und bringt ihn ins Schleudern. Zielen unnötig.'],
    ['coco3', 'orbit', 'Drei Kokosnüsse kreisen um dich: rammen Gegner neben dir und blocken Geschosse. Antippen = Kokosnuss jagt den Vordermann.'],
    ['parrot', 'area', 'Alle knapp vor dir bekommen den Papagei ins Gesicht: Ihre Lenkung wackelt ein paar Sekunden.'],
    ['shield', 'shield', 'Schirm auf: 8 Sekunden Schutz, blockt genau einen Treffer.'],
    ['acai', 'area', 'Açaí-Bombe: Alle vor dir kriegen lila Matsch ins Gesicht. Gegner eiern herum; erwischt es dich, ist dein Bildschirm ein paar Sekunden voller Açaí.'],
    ['uru', 'home', 'Der Urubu (Rabengeier) fliegt über alle hinweg und stürzt sich auf den Führenden. Nur ein Schirm hilft. Bist du selbst vorne, trifft er den Zweiten.'],
    ['blitz', 'area', 'Cristo-Blitz: Alle anderen schrumpfen, werden langsamer und verlieren ihr Item. Wer klein ist, wird beim Rammen plattgefahren. Wer vor dir liegt, bleibt länger klein.'],
    ['bus', 'boost', 'Ônibus-Express: Du wirst 4,5 s lang zum Bus, fährst von selbst, bist unverwundbar und mähst alles um. Gibt es nur weiter hinten.']];
  const GANI = {mum: 'boost', golf: 'home', taco: 'fire', mini: 'boost', grant: 'area', polo: 'area', bill: 'area', burn: 'area', wheel: 'boost', ball: 'home', beer: 'drop', snack: 'area', kiss: 'area', burp: 'area', stink: 'drop', puke: 'drop', disco: 'area', meter: 'area', steal: 'home', ticket: 'area', caiman: 'home', trolley: 'throw', chomp: 'area'};
  const GCOMBO = {'oil+pimenta': 'Langer Turbo, hinter dir brennt der Asphalt.', 'coati+parrot': 'Drei Nasenbären jagen die drei Karts vor dir.', 'turbo+turbo': 'Extra langer Turbo und kurz unverwundbar.',
    'pimenta+turbo': 'Längster Turbo im Spiel, mit Feuer am Heck.', 'flip+flip': 'Drei Flip-Flops gleichzeitig im Fächer.', 'oil+oil': 'Drei Pfützen hintereinander.', 'shield+shield': '16 Sekunden Schirm.', 'coati+coati': 'Zwei Nasenbären für die zwei vor dir.'};
  // eine Mini-Szene: eigener Kart (🚙 rot mit Leuchten, gespiegelt = fährt nach rechts), Item, Gegner
  const gAni = (a, e) => { const me = '<i class="kg-k"><u class="kg-me">🚙</u></i>', foe = '<i class="kg-t"><u>🚙</u></i>', it = '<i class="kg-p">' + e + '</i>';
    const x = {boost: '<i class="kg-k"><u class="kg-me">🚙</u><b>🔥</b></i>', fire: '<i class="kg-k"><u class="kg-me">🚙</u><b>🔥</b></i><i class="kg-t"><u>🚙</u></i>', drop: me + it + foe, trail: '<i class="kg-k"><u class="kg-me">🚙</u><b>' + e + e + e + '</b></i>',
      bang: me + it + '<i class="kg-x">💥</i>' + foe, throw: me + it + foe, home: me + it + foe, orbit: '<i class="kg-k"><u class="kg-me">🚙</u></i><i class="kg-o"><b>' + e + '</b><b>' + e + '</b><b>' + e + '</b></i>',
      area: me + '<i class="kg-r"></i>' + foe + '<i class="kg-t kg-t2"><u>🚗</u></i>', shield: '<i class="kg-k"><u class="kg-me">🚙</u><b>⛱️</b></i><i class="kg-p">🩴</i>'}[a];
    return '<div class="kg-st kg-' + a + '" aria-hidden="true">' + x + '</div>'; };
  function guideHtml() {
    const row = (it, a, x, who) => '<div class="kg-row">' + gAni(a, it.e) + '<div><b>' + it.e + ' ' + esc(it.n) + (it.cnt ? ' <em>×' + it.cnt + '</em>' : '') + (who ? ' <small>' + esc(who) + '</small>' : '') + '</b><p>' + esc(x) + '</p></div></div>';
    const sp = DRVS.map(id => { const it = SPECIAL[id]; if (!it) return ''; const d = XBY && XBY[id], nm = d ? d.name : NAME(id); return row(it, GANI[it.k] || 'area', it.x ? it.x.charAt(0).toUpperCase() + it.x.slice(1) + '.' : '', nm); }).join('');
    return '<p class="kg-how">🎁 Durch ❓-Kisten fahren, dann <b>ITEM</b> unten tippen (oder das Item-Fenster oben rechts, am PC die Leertaste). Vorne gibt es eher Verteidigung, hinten eher Turbos und Angriffe.<br>✌️ Hast du schon ein Item, landet das nächste im kleinen Fenster daneben. Passende Paare ergeben eine <b>Kombo</b>.</p>' +
      '<p class="kr-lbl">Items für alle</p>' + GUIDE.map(([k, a, x]) => row(ITEMS[k], a, x)).join('') +
      '<p class="kr-lbl">✨ Spezial-Items (22 % Chance, je Fahrer)</p>' + sp +
      '<p class="kr-lbl">💥 Kombos (zwei Items gleichzeitig halten)</p><div class="kg-cb">' + Object.entries(COMBOS).map(([key, c]) => { const [a, b] = key.split('+').map(q => ITEMS[q].e); return '<div><b>' + a + ' + ' + b + ' = ' + c.e + ' ' + esc(c.n) + '</b><small>' + esc(GCOMBO[key] || '') + '</small></div>'; }).join('') + '</div>'; }
  document.addEventListener('toggle', e => { const d = e.target; if (!d.classList || !d.classList.contains('kr-guide') || !d.open) return; const b = d.querySelector('.kr-guideb'); if (b && !b.dataset.ok) { b.innerHTML = guideHtml(); b.dataset.ok = 1; } }, true);
  function renderMenu() {
    const pk = menu.querySelector('.kr-pick:not(.kr-whop)'); pk.innerHTML = '';
    // Fahrerauswahl im Stil von Smash Bros./Tekken: schräge Porträt-Kacheln, P1-Rahmen, Zufalls-Kachel
    // Smash-Raster (Wunsch Patrick 09.10.: wieder alle Fahrer auf einen Blick statt Reitern): Gruppen-Balken mit Anzahl, Farbleiste je Fahrer, Spezial-Item oben rechts, Auswahl-Blitz, Zufall am Ende
    const GR = [['crew', 'Crew', CREW.map(c => c.id)], ['x', 'Crew im Ausnahmezustand', XDRV.filter(x => x.base).map(x => x.id)], ['guest', 'Gastfahrer', XDRV.filter(x => x.guest).map(x => x.id)], ['npc', 'Figuren aus der Serie', XDRV.filter(x => x.npc && !x.guest).map(x => x.id)]], pkNew = FSL !== me;
    const grp = (g, t, ids, rnd0) => { const h = document.createElement('p'); h.className = 'kr-pgh'; h.innerHTML = esc(t) + ' <small>' + ids.length + '</small>'; pk.appendChild(h);
      ids.forEach(id => { const X = XBY[id], nm = NAME(id), b = document.createElement('button'), sp0 = SPECIAL[id]; b.type = 'button'; b.dataset.id = id; b.dataset.grp = g; b.className = 'kr-tile' + (id === me && pkNew ? ' kr-pk' : ''); b.style.setProperty('--tc', (LOOK[id] || {}).shirt || '#00a651'); b.setAttribute('aria-pressed', id === me); b.setAttribute('aria-label', nm + (sp0 ? ', Spezial: ' + sp0.n : ''));
        b.appendChild(portrait(id, 112, 132)); b.insertAdjacentHTML('beforeend', (sp0 ? '<i class="kr-tsp" aria-hidden="true">' + sp0.e + '</i>' : '') + '<span lang="de">' + (X && X.base ? esc(NAME(X.base)) + '<small>' + esc(X.sh) + '</small>' : X && X.guest ? esc(X.name) + '<small>' + esc(X.sh) + '</small>' : esc(X ? X.sh : nm)) + '</span>'); if (X && !X.base && !X.guest && X.sh.length > 6) b.classList.add(X.sh.length > 8 ? 'kr-xl' : 'kr-lg'); if (X && X.guest && X.name.length > 7) b.classList.add('kr-lg'); pk.appendChild(b); });
      if (rnd0) { const b = document.createElement('button'); b.type = 'button'; b.className = 'kr-tile kr-rnd'; b.dataset.rnd = '1'; b.setAttribute('aria-label', 'Zufälliger Fahrer'); b.innerHTML = '<b>?</b><span>Zufall</span>'; pk.appendChild(b); } };
    GR.forEach(([g, t, ids], i) => grp(g, t, ids, i === GR.length - 1));
    menu.querySelectorAll('.kr-mode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === MODE));
    const cs = CS[me], bar = v => '<i style="--v:' + Math.round(20 + clamp(v, 0, 1) * 80) + '%"></i>', sp = SPECIAL[me], pg = pegel(baseOf(me));
    const fresh = FSL !== me; FSL = me; const X0 = XBY[me], gl = X0 ? (X0.base ? 'Ausnahmezustand' : X0.guest ? X0.gl || 'Gastfahrer' : 'Serien-Figur') : 'Crew';
    const dv = menu.querySelector('.kr-drv'), cosE = (COS.find(c => c.id === cosOf(me)) || {}).e; dv.innerHTML = '<div class="kr-fs' + (fresh ? ' in' : '') + '" style="--dc:' + ((LOOK[me] || {}).shirt || '#00a651') + '"><span class="kr-fsp"><span class="kr-dch"></span></span><div class="kr-fst"><small class="kr-fsg"><b' + (MODE === 'live' && myP() ? ' style="background:' + PCOL[(myP() - 1) % 6] + '"' : '') + '>P' + (MODE === 'live' && myP() ? myP() : 1) + '</b> ' + gl + '</small><p class="kr-dn' + (NAME(me).split(' ').some(w0 => w0.length > 9) ? ' kr-dnl' : '') + '">' + esc(NAME(me)) + '</p><p class="kr-fss">' + sp.e + ' ' + esc(sp.n) + (cosE && cosOf(me) ? ' · ' + cosE + ' Kostüm' : '') + '</p>' + (TAGS[me] ? '<p class="kr-ftag">„' + esc(TAGS[me]) + '“</p>' : '') + '</div></div><div class="kr-dc2"><div class="kr-bars">' + BXK.map(k => '<button type="button" class="kr-bk" data-k="' + k + '" aria-pressed="' + (BX === k) + '"><span>' + BXT[k][0] + ' <u>ⓘ</u></span>' + bar(cs[k]) + '</button>').join('') + '</div>' +
      '<p class="kr-bx">' + (BX ? esc(BXT[BX][1]) + ' <b>' + esc(NAME(me)) + ': ' + (cs[BX] < .34 ? 'eher schwach' : cs[BX] < .67 ? 'mittel' : 'stark') + '.</b>' : 'ⓘ Einen Wert oben antippen, dann steht hier, was er bewirkt.') + '</p>' +
      (XBY[me] ? '<p class="kr-sp kr-xd">' + esc(XBY[me].x) + '</p>' : '') + '<p class="kr-sp">' + sp.e + ' <b>' + esc(sp.n) + '</b>: ' + esc(sp.x) + '</p>' + ((PERS[me] || {}).x ? '<p class="kr-sp kr-pp">🤖 Als Gegner: ' + esc(PERS[me].x) + '</p>' : '') + (pg > 0 ? '<p class="kr-sp">🍹 Heute schon ' + ((MEHUB.drinks || {})[baseOf(me)] || {}).today + ' Drinks: Lenkung wackelt!</p>' : '') + '</div>'; dv.querySelector('.kr-dch').replaceWith(portrait(me, 300, 300, .8)); { const bars0 = dv.querySelector('.kr-dc2 .kr-bars'); if (bars0) dv.querySelector('.kr-fst').appendChild(bars0); const bx0 = dv.querySelector('.kr-dc2 .kr-bx'); if (bx0) { if (BX) dv.querySelector('.kr-fst').appendChild(bx0); else bx0.remove(); } }   /* Erklärung zum angetippten Wert direkt unter den Balken */ { const x2 = document.createElement('div'), d2 = dv.querySelector('.kr-dc2'); x2.className = 'kr-drvx kr-dinfo' + (fresh ? ' in' : ''); x2.innerHTML = '<b>' + (sp ? sp.e + ' ' : '') + esc(NAME(me)) + ' <em>' + esc(gl) + '</em></b>'; d2.prepend(vehPreview(me)); x2.appendChild(d2); dv.appendChild(x2); }
    menu.querySelectorAll('.kr-diff button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.d === DIFF));
    { const cr = menu.querySelector('.kr-cc'); if (cr) { cr.hidden = MODE === 'live'; cr.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.cc === CC)); } }   // Live: Klasse kommt aus den Einstellungen für alle
    const mv = myVeh(), vc = menu.querySelector('.kr-vcar'), st0 = stats(), pt0 = Object.assign({}, paintOf(me), partsPt()), col0 = paintOf(me).c || (LOOK[me] || {}).shirt || '#00a651';
    if (!VINFO || !VEHS.some(v => v.id === VINFO)) VINFO = mv; const cn0 = coins();
    vc.innerHTML = VEHS.map(v0 => { const ok = unlocked(v0), nm = v0.id === 'kart' && STYK(me) ? STN[STYK(me)] || v0.n : v0.n, nd = v0.need, hv = nd ? Math.min(nd[1], +st0[nd[0]] || 0) : 0;
      const sub = ok ? esc(VSHORT[v0.id] || '') : v0.c ? '<em>🪙 ' + v0.c + '</em>' : '🏅 ' + esc(v0.t) + (nd[1] > 1 ? ' · ' + hv + '/' + nd[1] : ''), pr = ok ? -1 : v0.c ? Math.min(1, cn0 / v0.c) : nd[1] > 1 ? hv / nd[1] : -1;
      return '<button type="button" data-v="' + v0.id + '" aria-pressed="' + (v0.id === mv) + '"' + (ok ? '' : ' class="kr-vlk"') + ' aria-label="' + esc(nm + (ok ? '' : v0.c ? ', kaufen für ' + v0.c + ' Münzen' : ', freischalten: ' + v0.t)) + '"><span class="kr-vcv"></span>' + (ok ? '' : '<i class="kr-lock">' + (v0.c ? '🔒' : '🏅') + '</i>') + '<b>' + esc(nm) + '</b><small>' + sub + '</small>' + (pr >= 0 ? '<s style="--p:' + Math.round(pr * 100) + '%"></s>' : '') + '</button>'; }).join('');
    vc.querySelectorAll('button').forEach(b0 => { const c = vehSprite(col0, b0.dataset.v, pt0, me), d = document.createElement('canvas'), x0 = d.getContext('2d'); d.width = c.width; d.height = c.height; x0.drawImage(c, 0, 0);
      const h = !b0.disabled && !b0.classList.contains('kr-vlk') && headImg(me), st = STY[me] || {}, vh = VHEAD[b0.dataset.v]; if (h) { const sz = h.width * (vh !== undefined ? .4 : .52) * (st.hs || 1); x0.drawImage(h, d.width / 2 - sz / 2, d.height / 2 + (vh !== undefined ? vh * 2 : st.seat === 'none' ? 0 : 7) - sz * .55, sz, sz * h.height / h.width); }   // neue Fahrzeuge: Kopf kleiner und am Sitzplatz, damit man das Fahrzeug sieht   // eigener Fahrer sitzt drin
      b0.querySelector('.kr-vcv').replaceWith(d); });
    { const V = VEHS.find(v => v.id === VINFO) || VEHS[0], ok = unlocked(V), tu = tuneOf(V.id), bs = vbase(V.id), sumT = TKEYS.reduce((a, q) => a + tu[q], 0), nd = V.need, hv = nd ? Math.min(nd[1], +st0[nd[0]] || 0) : 0, nm = V.id === 'kart' && STYK(me) ? STN[STYK(me)] || V.n : V.n;
      const bars = [['Tempo', bs[0], tu.m * .06], ['Beschleunigung', bs[1], tu.a * .06], ['Haftung', bs[2], tu.r * .05], ['Lenkung', bs[3], tu.s * .05], ['Turbo', bs[4], tu.t * .06], ['Nehmer', bs[5], tu.p * .06]];
      const inf = document.createElement('div'); inf.className = 'kr-vinfo' + (ok ? '' : ' kr-vinfol') + (VIL !== V.id ? ' in' : ''); VIL = V.id;   // Infos fest über dem Raster, mit Bild des Fahrzeugs
      inf.innerHTML = '<div class="kr-vih"><span class="kr-vic"></span><b>' + V.e + ' ' + esc(nm) + (V.id === mv ? ' <em>✓ gewählt</em>' : ok ? ' <em class="kr-vlf">frei</em>' : V.c ? ' <em class="kr-vlc">🔒 🪙 ' + V.c + '</em>' : ' <em class="kr-vlc">🏅 Erfolg</em>') + '<small>' + esc(VSHORT[V.id] || '') + '</small></b></div><p>' + esc((VTX[V.id] || VTX.kart).x) + '</p><div class="kr-wsbars">' +
        bars.map(([n, b, ad]) => '<div><span>' + n + '</span><i><s style="width:' + Math.round(b * 100) + '%"></s><u style="width:' + Math.round(Math.min(ad, 1 - b) * 100) + '%"></u></i></div>').join('') + '</div>' +
        (ok ? '<button type="button" class="kr-vws" data-v="' + V.id + '">🔧 Werkstatt · Tuning ' + sumT + '/30</button>' : V.c ? '<button type="button" class="kr-vbuy" data-v="' + V.id + '"' + (cn0 < V.c ? ' disabled' : '') + '>' + (cn0 < V.c ? '🪙 ' + V.c + ' · dir fehlen noch ' + (V.c - cn0) : '🛒 Für ' + V.c + ' 🪙 kaufen') + '</button>' : '<small class="kr-vneed">🏅 Freischalten: ' + esc(V.t) + (nd[1] > 1 ? ' · ' + hv + '/' + nd[1] : '') + '</small>');
      { const t0 = vc.querySelector('button[data-v="' + V.id + '"] canvas'); if (t0) { const d = document.createElement('canvas'); d.width = t0.width; d.height = t0.height; d.getContext('2d').drawImage(t0, 0, 0); inf.querySelector('.kr-vic').appendChild(d); } else inf.querySelector('.kr-vic').remove(); }
      vc.querySelectorAll('button[data-v]').forEach(b0 => b0.classList.toggle('kr-vsel', b0.dataset.v === V.id && V.id !== mv));   // angezeigtes, aber nicht gewähltes Fahrzeug (gesperrt) markieren
      placeVInfo(inf); }
    // Hinweis, wenn die gewählte Strecke ein anderes Fahrzeug verlangt (nur der Amazonas: Boot für alle)
    { let vn = vc.nextElementSibling; if (!vn || !vn.classList.contains('kr-vnote')) { vn = document.createElement('p'); vn.className = 'kr-vnote'; vc.after(vn); }
      const tl = MODE === 'cup' ? CUPSEL.t : [TRK], bo = tl.filter(id => TBY[id] && TBY[id].veh === 'boat'), mvn = mv === 'kart' && STYK(me) ? STN[STYK(me)] || 'Gringo-Kart' : VEHS.find(v => v.id === mv).n;
      vn.hidden = !bo.length; vn.textContent = !bo.length ? '' : tl.length > 1 ? '🛶 Auf dem Amazonas fahren alle Boot, in den anderen Pokal-Rennen fährst du: ' + mvn + '.' : '🛶 Auf dem Amazonas fahren alle Boot. Dein Fahrzeug (' + mvn + ') fährst du auf allen anderen Strecken.'; }
    const tu = tune(), own = cosOwn(), mc = cosOf(me), cn = coins();
    sumBadge('garage', '🪙 ' + cn); { const pl = menu.querySelector('.kr-prog'); if (pl) pl.innerHTML = progLine(); }
    { const mv0 = myVeh(), V0 = VEHS.find(v => v.id === mv0) || VEHS[0];
      const st0 = menu.querySelector('.kr-shopt'); if (st0) st0.textContent = 'Tuning für ' + V0.e + ' ' + V0.n + ' (jedes Fahrzeug einzeln)'; }
    { const pt = paintOf(me), so = loadJ('kartStkOwn'), pe = menu.querySelector('.kr-paintb');
      if (pe) { pe.innerHTML = '<p class="kr-lbl">Lack & Aufkleber für ' + esc(NAME(me)) + '</p><div class="kr-pv"><span class="kr-pvc"></span><div class="kr-paints">' + PAINTS.map(c => '<button type="button" data-p="' + (c || '') + '" aria-pressed="' + ((pt.c || '') === (c || '')) + '" aria-label="' + (c ? 'Farbe ' + c : 'Shirt-Farbe') + '" style="--pc:' + (c || (LOOK[me] || {}).shirt || '#00a651') + '">' + (c ? '' : '👕') + '</button>').join('') + '</div></div>' +
        '<div class="kr-stks">' + STK.map(x0 => { const own = so[x0.id], on = pt.s.includes(x0.id); return '<button type="button" data-s="' + x0.id + '" aria-pressed="' + on + '"' + (!own && cn < x0.c ? ' disabled' : '') + '><i>' + x0.e + '</i><small>' + esc(x0.n) + (own ? '' : ' · ' + x0.c + ' 🪙') + '</small></button>'; }).join('') + '</div>';
        const pv = vehSprite(pt.c || (LOOK[me] || {}).shirt || '#00a651', myVeh(), Object.assign({}, pt, partsPt()), me), cv0 = document.createElement('canvas'); cv0.width = 88; cv0.height = 120; cv0.getContext('2d').drawImage(pv, 0, 0); pe.querySelector('.kr-pvc').replaceWith(cv0); } }
    wsRender();
    { const pb0 = menu.querySelector('.kr-parts'), pp = partsOf(); if (pb0) pb0.innerHTML = '<p class="kr-lbl">🔧 Baukasten: Reifen & Flügel (gilt für jedes Fahrzeug außer Boot)</p>' + ['tire', 'wing'].map(sl => '<div class="kr-vehs kr-pts">' + PARTS[sl].map(X => { const own = !X.c || pp.own[X.id], on = pp[sl] === X.id; return '<button type="button" data-slot="' + sl + '" data-part="' + X.id + '" aria-pressed="' + on + '"' + (!own && cn < X.c ? ' disabled' : '') + ' title="' + esc(X.x) + '"><i>' + X.e + '</i><small>' + esc(X.n) + (own ? '' : ' · ' + X.c + ' 🪙') + '</small></button>'; }).join('') + '</div>').join('') +
        '<p class="kr-vx">' + [PARTS.tire.find(x => x.id === pp.tire), PARTS.wing.find(x => x.id === pp.wing)].filter(X => X.c).map(X => X.e + ' ' + esc(X.x)).join(' · ') + '</p>'; }
    menu.querySelector('.kr-cos').innerHTML = '<p class="kr-lbl">Kostüm für ' + esc(NAME(me)) + '</p>' + COS.map(c => { const ok = own(c), A = c.ach && ACH.find(x => x.id === c.ach); return '<button type="button" data-c="' + c.id + '" aria-pressed="' + (c.id === mc) + '"' + (!ok && (A || c.from || cn < c.c) ? ' disabled' : '') + ' title="' + esc(c.n) + '"><i>' + (ok || (!A && !c.from) ? c.e : '🔒') + '</i><small>' + (ok ? esc(c.n) : c.from ? esc(c.fl) : A ? esc(A.n) : c.c + ' 🪙') + '</small></button>'; }).join('');
    const ah = achs(); sumBadge('achs', ACH.filter(x => ah[x.id]).length + '/' + ACH.length);
    menu.querySelector('.kr-ach').innerHTML = ACH.map(x => '<span class="' + (ah[x.id] ? 'on' : '') + '"><i>' + (ah[x.id] ? x.e : '🔒') + '</i><b>' + esc(x.n) + '</b>' + (x.x ? '<small>' + esc(x.x) + '</small>' : '') + '</span>').join('');
    const bt = best(), tr = menu.querySelector('.kr-tracks:not(.kr-cups)'); tr.hidden = MODE !== 'single' && MODE !== 'live'; lbInit();
    const cu = menu.querySelector('.kr-cups'); cu.hidden = MODE !== 'cup'; cu.innerHTML = CUPS.map(c => '<button type="button" data-c="' + c.id + '" aria-pressed="' + (c === CUPSEL) + '"><i>' + c.e + '</i><b>' + esc(c.n) + '</b><small>' + c.t.map(id => TBY[id].e).join('') + '</small><small>' + c.t.length + ' Strecken</small></button>').join('');
    const nS = TRACKS.filter(t => !t.long).length, nL = TRACKS.length - nS;   // Abschnitte Kurz-/Langstrecken (Wunsch Patrick 10.10.)
    tr.innerHTML = TRACKS.map((t, n) => (n === 0 ? '<p class="kr-sgh"><b>🏁 Kurzstrecken</b><small>' + nS + ' Strecken · 1–' + nS + '</small></p>' : '') + (t.long && !(TRACKS[n - 1] || {}).long ? '<p class="kr-sgh kr-sgl"><b>🛣️ Langstrecken</b><small>' + nL + (nL === 1 ? ' Strecke' : ' Strecken') + ' · je Runde doppelt so lang</small></p>' : '') +
      '<button type="button" class="kr-st' + (t.name.length > 15 ? ' kr-lg' : '') + (t.long ? ' kr-long' : '') + '" data-t="' + t.id + '" aria-pressed="' + (t.id === TRK) + '" aria-label="' + (n + 1) + '. ' + esc(t.name) + (t.long ? ' (Langstrecke)' : '') + '"><i>' + t.e + '</i><em class="kr-sn">' + (n + 1) + '</em><span>' + esc(t.name) + '</span></button>').join('') + '<button type="button" class="kr-st kr-strnd" aria-label="Zufällige Strecke"><b>?</b><span>Zufall</span></button>';
    tr.querySelectorAll('button[data-t]').forEach(b0 => { const c = thumb(TBY[b0.dataset.t]), d = document.createElement('canvas'); d.width = c.width; d.height = c.height; d.getContext('2d').drawImage(c, 0, 0); b0.prepend(d); });
    if (MODE !== 'cup') { const ti = tinfo(TBY[TRK] || TRACKS[0], bt); if (TIL !== TRK) { ti.classList.add('in'); TIL = TRK; } tinfoTop(ti); } else menu.querySelectorAll('.kr-tinfo').forEach(x => x.remove());   // Nummer je Strecke (1–14 in Reise-Reihenfolge), Info oben über dem Raster
    menu.querySelector('.kr-tl').innerHTML = '<em>3</em> ' + (MODE === 'cup' ? 'Pokal' : 'Strecke');
    menu.querySelector('.kr-pc').textContent = coins(); menu.querySelector('.kr-pa').textContent = Object.keys(achs()).length + '/' + ACH.length;
    const cups = loadJ('kartCups'), cw = cups[me] || 0, cx = menu.querySelector('.kr-cupx'); cx.hidden = MODE !== 'cup';
    cx.textContent = CUPSEL.t.map(id => TBY[id].e + ' ' + TBY[id].name).join(' · ') + '. Punkte 10-8-6-5-4-3, am Ende Siegerehrung.' + (cw ? ' Deine Grand-Prix-Siege: ' + cw + ' 🏆' : '');
    { const V1 = VEHS.find(v => v.id === mv) || VEHS[0], av = menu.querySelector('.kr-sumav'), vn = ((MODE === 'single' || MODE === 'live') && TBY[TRK] && TBY[TRK].veh === 'boat' ? '🛶 Boot' : mv === 'kart' && STYK(me) ? STN[STYK(me)] : V1.n) + ' · '; menu.querySelector('.kr-sum1').textContent = NAME(me);
      av.innerHTML = ''; av.appendChild(portrait(me, 46, 46, .85));
      menu.querySelector('.kr-best').textContent = vn + (MODE === 'cup' ? CUPSEL.e + ' ' + CUPSEL.n + ' · ' + DIFFS[DIFF].n + (CC !== 150 ? ' · ' + CCN[CC] : '') : MODE === 'live' ? '👥 Live · ' + lobby().length + ' im Raum'
        : TBY[TRK].e + ' ' + TBY[TRK].name + ' · ' + DIFFS[DIFF].n + (CC !== 150 ? ' · ' + CCN[CC] : '') + (bt[tkey(TRK)] ? ' · ⏱ ' + fmt(bt[tkey(TRK)]) : '')); }
    liveBox(); livePres();
    { const dc = menu.querySelector('.kr-dice'); if (dc) dc.hidden = MODE === 'cup'; }
    { const go = menu.querySelector('.kr-go'); go.textContent = MODE === 'cup' ? '🏆 Starten' : 'Los!'; go.classList.remove('kr-wait'); liveFoot(); }   // Live: der Knopf schaltet „bereit“, los geht es erst, wenn alle bereit sind
    const lb = menu.querySelector('.kr-lb'), gh = menu.querySelector('.kr-ghost:not(.kr-diff):not(.kr-cc)');
    gh.hidden = MODE !== 'single'; gh.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.g === GHOST.mode));
    if (MODE === 'single') lb.innerHTML = lbHtml(lbList(Object.assign({}, LB, gPendLB()), TRK), '⏱️ Bestzeiten ' + TBY[TRK].name);
    else lb.innerHTML = '';
    lb.hidden = MODE === 'cup';
    menu.querySelector('.kr-wr').textContent = WR ? 'Deine Zeiten landen als ' + NAME(player()) + ' in der Crew-Bestenliste' + (PME() ? '' : ' (wähle oben auf der Seite „Ich bin …“)') + '.' : 'Bestenliste nur ansehen: Eintragen können nur eingeladene Bearbeiter, deine Zeiten bleiben auf diesem Handy.';
    menu.querySelector('.kr-wr').hidden = true;   // steht jetzt im „Wer spielt?“-Kasten (auch für Kommentatoren und Gäste)
    menu.querySelector('.kr-tutb').hidden = !!store.get('kartTutDone') && stats().races > 2;
    const wb = menu.querySelector('.kr-whobox'), pm = PME(), gi0 = wb.querySelector('.kr-gname'), gv0 = gi0 && gi0.value, gf0 = gi0 && document.activeElement === gi0; wb.innerHTML = !pm || WHOOPEN ? whoHtml(pm ? '🙋 <b>Wer spielt jetzt?</b> Antippen, unter diesem Namen landen die Zeiten in der Bestenliste.' : '🙋 <b>Wer spielt an diesem Handy?</b> Einmal antippen, dann landen deine Zeiten unter deinem Namen in der Bestenliste.')
      : '<p class="kr-wholn"><span>🙋 <b>' + esc(NAME(pm)) + '</b> spielt' + (KG ? ' als Gast 👤' : '') + ' · ' + (WR ? 'Zeiten zählen für die Bestenliste' : KG ? 'Zeiten kommen über ein Crew-Handy in die Bestenliste' : 'Zeiten bleiben auf diesem Handy') + '</span><button type="button" class="kr-whochg">ändern</button></p>'; whoHeads(wb);
    { const gi = wb.querySelector('.kr-gname'); if (gi && gv0) gi.value = gv0; if (gi && gf0) gi.focus(); }   // Neuzeichnen (z. B. neue Bestzeit von jemand anderem) löscht den angefangenen Namen nicht
    const rc = menu.querySelector('.kr-recs'); rc.querySelector('.kr-recb').innerHTML = recsHtml(); sumBadge('recs', '🏁 ' + TRACKS.filter(x => lbList(LB, x.id).length).length + '/' + TRACKS.length);
  }
  function preview(id) { loadTrack(id); newRace(); S.paused = true; }
  const TIPS = ['Gewitter? Pfützen meiden, früher bremsen.', 'Mehrfach-Items (×2, ×3): mehrmals antippen! 🥥 Kokos-Trio kreist um dich und wehrt Geschosse ab, 🍌 Bananen hinten auch.', 'Brücke, Minhocão, Cristo und Iguaçu haben keine Bande: Wer über den Rand fährt, stürzt ab und verliert gut 2 Sekunden.', '⛱️ Schirm blockt einen Treffer, 🩴 Flip-Flop fliegt geradeaus, 🦜 Papagei verdreht den Vorderleuten die Lenkung.', '🌶️ Pimenta: langer Turbo, wer direkt hinter dir fährt, verbrennt sich.', 'Doppeltipp und halten = sofort driften. Länger driften = blauer, dann oranger Turbo.', 'Drift zu eng? Andere Seite dazutippen = weiterer Bogen, beide Seiten = mittel. Erst ganz loslassen zündet den Turbo.', 'Bergauf wird jeder langsamer, bergab schneller: Turbo am Gipfel zünden. Auf der Kuppe kurz in der Luft: tippen = Trick.', 'Auf Brücken ist das Geländer dicht an der Fahrbahn: lieber sauber durch als an der Bande schleifen.', 'Beide Seiten gleichzeitig halten = bremsen.', 'Bei der 1 tippen = Raketenstart.',
    'Auf der Schanze tippen = Trick und Turbo bei der Landung.', 'Rot-weiße Pfeiltafeln warnen vor scharfen Kurven.', 'Abkürzungen sind holprig, aber mit Turbo-Pfeil in der Mitte.',
    'Schranken öffnen im Takt. Kurz warten lohnt sich manchmal.', 'Im Pause-Menü: Steuerung „Analog“ für stufenloses Lenken.', 'Wer hinten liegt, bekommt bessere Items.',
    'Delfine auf dem Amazonas geben Turbo.', 'Im Nebel helfen die Kurven-Schilder.', 'Die Tageszeit im Spiel folgt der Uhrzeit in Rio.'];
  function showLoad(id, fn) { const L = box.querySelector('.kr-load'), tr = TBY[id] || TRACKS[0]; L.querySelector('.kr-load-t').textContent = tr.e + ' ' + tr.name; L.querySelector('.kr-load-s').textContent = tr.sub;
    L.querySelector('.kr-load-tip').textContent = '💡 ' + pick(TIPS); L.hidden = false; const t0 = performance.now(); setTimeout(() => { fn(); setTimeout(() => { L.hidden = true; }, Math.max(0, 900 - (performance.now() - t0))); }, 40); }
  function startRace() { if (MODE === 'live' && !LIVE.pending) { liveGo(); return; } const tid = CUP ? CUP.list[CUP.i] : TRK; menu.hidden = true; res.hidden = true; pm.hidden = true; racing(true); if (S) S.paused = true; showLoad(tid, startRace0); }
  function startRace0() {
    setTimeout(() => { if (BUF.more) BUF.more(); }, 1200); 
    menu.hidden = true; res.hidden = true; pm.hidden = true; racing(true);
    if (CUP) loadTrack(CUP.list[CUP.i]); else loadTrack(TRK);
    if (LIVE.pending) { LIVE.race = LIVE.pending; LIVE.pending = null; } else if (MODE !== 'live') LIVE.race = null;
    const LR0 = LIVE.race, CF = LR0 && LR0.cfg || {}; if (LR0 && CF.laps) LAPS = CF.laps;
    makeVehicles(); { const MR = Math.random; if (LR0 && LR0.seed) Math.random = mulberry(hashS(LR0.seed)); if (LR0 && CF.diff >= 0) { if (LIVE.diff0 == null) LIVE.diff0 = DIFF; DIFF = CF.diff; } try { newRace(); } finally { Math.random = MR; } }
    if (LR0) { S.seed = LR0.seed || LR0.id; S.wave.next = wrnd('wave', 9, 13); S.storm.at = CF.storm === 'on' ? wrnd('storm', 12, 26) : CF.storm === 'rnd' && T.id !== 'cristo' && wr('storm') < .33 ? wrnd('storm', 22, 40) : -1; if (CF.items === 'off') S.boxes = []; }
    S.ev = {next: wrnd('ev', 15, 24), cur: null}; S.evOn = !TUTON && (LR0 ? CF.ev !== 'off' : SET.ev !== 'off');
    if (TUTON) { S.tut = {i: 0, ok: 0}; S.karts.length = 1; LAPS = 2; S.storm.at = -1; S.rival = null; }
    S.rep.lap0 = +store.get('kartLap.' + tkey(T.id)) || 0; Object.values(VUSE).forEach(U => { U.last = null; });   // neues Rennen: Reihenfolge der Sprüche läuft weiter, nur die Sperre „gerade gesagt“ fällt weg   // beste Runde vor diesem Rennen (für den Rennbericht)
    if (!LIVE.race && !TUTON && SET.intro !== 'off' && !INTROSEEN[T.id]) { INTROSEEN[T.id] = 1; S.intro = introMake(); box.classList.add('kr-intro'); } else box.classList.remove('kr-intro');   // Strecken-Vorschau (einmal je Strecke und Sitzung)
    if (LIVE.race) { S.live = LIVE.race; S.live.t0p = LIVE.race.delay && LIVE.race.rt ? LIVE.race.rt + LIVE.race.delay : performance.now() + clamp(LIVE.race.at - Date.now(), 500, 6000); S.t = clamp((performance.now() - S.live.t0p) / 1000, -6, -.5); LIVE.buf = {}; LIVE.lastN = {}; S.live.curHost = S.live.host; liveRejoinRestore(); liveClockSync(); } if (!TUTON && !(S.live && S.t > -3.4)) { S.grid = gridMake(!!S.live); box.classList.add('kr-intro'); } box.classList.toggle('live', !!S.live); S.tod = T.night || SET.tod === 'day' ? 'day' : (h => h >= 19 || h < 6 ? 'night' : h >= 17 ? 'dusk' : h < 7 ? 'dawn' : 'day')(+new Intl.DateTimeFormat('en-GB', {timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false}).format(new Date()) % 24);
    if (!CUP && GHOST.mode !== 'off') { const tid = T.id, s0 = S; ghostFor(tid).then(g => { if (S === s0 && g) { S.ghost = g; ghostProg(g); } }); } audio(); MUS.on = false; MUS.fast = false; MUS.step = 0; MUS.next = 0; banner = null; last = 0; if (MG && AC) MG.gain.value = .5;
    setTimeout(() => { if (S && S.tod === 'night' && !T.night) setTimeout(() => say('night', 'Es wird Nacht! Licht an!'), 2600); if (S && S.t < 0) say('t_' + T.id, 'Willkommen in ' + T.name + '!', 1); }, 150);
    // Gastfahrer im Feld: eigene Ansage (Aufnahme g_<id> in kart6.mp3, sonst Handy-Stimme)
    { const gx = S.karts.map(k => XBY[k.id]).find(x => x && x.guest && x.ann); if (gx) setTimeout(() => { if (!S || S.t > 0) return; const gv = TRIP.kartvo && TRIP.kartvo['g_' + gx.id]; say(gv ? 'g_' + gx.id : 'guest', gx.ann, 1); if (gv && BUF['ann' + (gv.f > 1 ? gv.f : '')]) return; if (SOUND && ANN && window.speechSynthesis) try { const u = new SpeechSynthesisUtterance(gx.ann); u.lang = 'de-DE'; u.rate = 1.1; u.pitch = .7; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }, 2500); }
  }
  function open() {
    if (!Object.keys(HEAD).length) makeHeads();
    if (box.parentElement !== document.body) document.body.appendChild(box);   // Kapitel hat content-visibility, sonst unsichtbar
    box.hidden = false; document.body.style.overflow = 'hidden'; document.documentElement.classList.add('kart-on'); resize();
    // kein echtes Vollbild mehr: Chrome blendet dabei jedes Mal „… claudeusercontent.com – zum Beenden des Vollbildmodus …“ ein (Wunsch Patrick 08.10.); das Overlay füllt den Bildschirm auch so
    CUP = null; S = null; lbInit(); progSync(true); { const s0 = {}; TRACKS.forEach(tr => { const top = lbList(LB, tr.id)[0]; if (top) s0[tr.id] = top.who; }); if (Object.keys(s0).length) store.set('kartRecSeen', JSON.stringify(s0)); } preview(MODE === 'cup' ? CUPSEL.t[0] : TRK); renderMenu(); setTimeout(renderMenu, 900); menu.hidden = false; res.hidden = true; pm.hidden = true; racing(false);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    audio(); loadBufs(); mmStart(); resKeep();
  }
  function close() {
    mmStop(); resClear(); try { localStorage.removeItem('br26.kartBeat'); } catch (e) {}
    Object.keys(BUF).forEach(k => { if (k !== 'more') BUF[k] = null; }); BUF.moreDone = 0; loading = false; PCACHE = {};   // entpackte Stimmen (~75 MB) und Bilder freigeben, solange das Spiel zu ist
    if (LIVE.diff0 != null) { DIFF = LIVE.diff0; LIVE.diff0 = null; } liveLeave(); cancelAnimationFrame(raf); S = null; MUS.on = false; box.hidden = true; if (LIVE.room) livePres(); teaser(); board(); document.body.style.overflow = ''; document.documentElement.classList.remove('kart-on');
    engOff(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  }
  function gpToLobby() { requestAnimationFrame(() => { const el = menu.querySelector('.kr-live'); if (el && !el.hidden) el.scrollIntoView({block: 'start'}); }); }
  function toMenu() { if (RNDR) { me = RNDR.me0; TRK = RNDR.trk0; RNDR = null; makeVehicles(); }   // nach dem Zufallsrennen wieder die eigene Auswahl
    if (LIVE.diff0 != null) { DIFF = LIVE.diff0; LIVE.diff0 = null; } TUTON = false; CUP = null; res.hidden = true; pm.hidden = true; racing(false); MUS.on = false; menu.hidden = false; preview(MODE === 'cup' ? CUPSEL.t[0] : TRK); renderMenu(); }
  openBtn.addEventListener('click', open);
  const racing = on => { box.classList.toggle('racing', on); ITSEE = false; itemBtn.classList.remove('kr-see'); HUDT = 0; };
  function pause() { if (!S || !box.classList.contains('racing') || !res.hidden) return; pm.querySelector('.kr-restart').hidden = !!S.live;
    if (S.live) { ptr.clear(); upd(); pm.hidden = false; return; }   // Live: Rennen läuft weiter, nur das Menü kommt
    S.paused = true; ptr.clear(); upd(); pm.hidden = false; if (AC) try { AC.suspend(); } catch (e) {} }
  const engOff = () => { if (eng && AC) { eng.g.gain.setTargetAtTime(0, AC.currentTime, .05); eng.sg.gain.setTargetAtTime(0, AC.currentTime, .05); } };
  function resume() { pm.hidden = true; if (S) S.paused = false; last = 0; audio(); }
  const setT = (sel, txt) => box.querySelectorAll(sel).forEach(b => { b.textContent = txt; });
  const sndTxt = () => setT('.kr-snd', SOUND ? '🔊 Ton: an' : '🔇 Ton: aus'), steerTxt = () => setT('.kr-steer', '🎚 Lenkstärke: ' + STEERS[STEER][0]), annTxt = () => setT('.kr-ann', '🎙 Ansager: ' + (ANN ? 'an' : 'aus'));
  const setTxt = () => { sndTxt(); steerTxt(); annTxt(); setT('.kr-ctl', '🎮 Steuerung: ' + (SET.ctl === 'analog' ? 'Analog (Daumen-Position)' : 'Halten links/rechts'));
    setT('.kr-q', '✨ Grafik: ' + ['Sparsam', 'Normal', 'Hoch'][SET.q]); setT('.kr-cam', '🎥 Kamera: ' + ['Nah', 'Normal', 'Weit'][SET.cam]); setT('.kr-tod', '🌗 Tageszeit: ' + (SET.tod === 'day' ? 'immer Tag' : 'wie in Rio')); setT('.kr-evt', '🎲 Ereignisse: ' + (SET.ev === 'off' ? 'aus' : 'an')); setT('.kr-intb', '🎬 Strecken-Vorschau: ' + (SET.intro === 'off' ? 'aus' : 'an')); setT('.kr-hd', '🗿 Köpfe: ' + ['Mini', 'Normal', 'Wackelkopf XXL'][SET.hd === undefined ? 1 : SET.hd]); setT('.kr-mm', '🎵 Menü-Musik: ' + (SET.mm === 'off' ? 'aus' : 'an' + (MM.song ? ' · ' + SONGS[MM.song].n : ''))); };
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
    if (e.target.closest('.kr-intb')) { SET.intro = SET.intro === 'off' ? 'on' : 'off'; saveSet(); if (SET.intro !== 'off') INTROSEEN = {}; }
    if (e.target.closest('.kr-hd')) { SET.hd = ((SET.hd === undefined ? 1 : SET.hd) + 1) % 3; saveSet(); }
    if (e.target.closest('.kr-mm')) { SET.mm = SET.mm === 'off' ? 'on' : 'off'; saveSet(); audio(); mmTick(); }
    if (e.target.closest('.kr-steer, .kr-ann, .kr-snd, .kr-ctl, .kr-q, .kr-cam, .kr-tod, .kr-evt, .kr-intb, .kr-hd, .kr-mm')) setTxt(); if (e.target.closest('.kr-snd')) { audio(); mmTick(); } });
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
  box.addEventListener('click', e => { if (e.target.closest('.kr-menu .kr-dice, .kr-menu .kr-rndtog')) { if (MODE === 'live') { SFX.pick(); cfgStep('rnd'); toast(liveCfg().rnd === 'on' ? '🎲 <b>Zufallsrennen für alle: an</b><br>Beim Start lost der Automat Fahrer, Fahrzeug, Strecke und Klasse.' : '🎲 Zufallsrennen: aus'); } else randomRace(); } if (e.target.closest('.kr-menu .kr-quit, .kr-res .kr-quit')) close(); });
  menu.addEventListener('click', e => {
    { const ui = e.target.closest('.kr-mode button, .kr-sgrid button, .kr-cups button, .kr-vcar button, .kr-ghost button, .kr-set > summary, .kr-pill'); if (ui && !ui.disabled) { const f = ui.matches('.kr-set > summary, .kr-pill') ? 660 : 990; beep(f, .035, 'triangle', .035, f * 1.25); } }   // kurzer Klick-Ton bei jeder Auswahl
    const rb = e.target.closest('.kr-pick:not(.kr-whop) .kr-rnd'); if (rb) { if (RSPIN) return; RSPIN = 1; const ids = DRVS.filter(id => id !== me), fin = pick(ids), tile = id => menu.querySelector('.kr-roster .kr-tile[data-id="' + id + '"]'); let n = 0, cur = null;
      const spin = () => { if (cur && tile(cur)) tile(cur).classList.remove('kr-rl'); n++; cur = n >= 16 ? fin : pick(ids); const t0 = tile(cur); if (t0) t0.classList.add('kr-rl'); beep(500 + n * 40, .04, 'square', .04);
        if (n < 16) setTimeout(spin, 40 + n * n * 1.4); else setTimeout(() => { RSPIN = 0; pickDrv(fin); drvTop(); }, 260); }; spin(); return; }
    const b = e.target.closest('.kr-pick:not(.kr-whop) button[data-id]'); if (b) { pickDrv(b.dataset.id); drvTop(); }
    const m = e.target.closest('.kr-mode button'); if (m) { MODE = m.dataset.mode; store.set('kartMode', MODE); preview(MODE === 'cup' ? CUPSEL.t[0] : TRK); renderMenu();
      if (MODE === 'cup') setTimeout(() => { const t0 = menu.querySelector('.kr-tl'); if (t0) t0.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 60); }   // Pokal: gleich zur Auswahl springen (steht unter Fahrer und Fahrzeug)
    const cb = e.target.closest('.kr-cups button'); if (cb) { CUPSEL = CUPS.find(c => c.id === cb.dataset.c) || CUPS[0]; store.set('kartCup', CUPSEL.id); preview(CUPSEL.t[0]); renderMenu(); }
    const pb = e.target.closest('.kr-paints button'); if (pb) { const all = loadJ('kartPaint'), pt = paintOf(me); pt.c = pb.dataset.p || null; all[me] = pt; store.set('kartPaint', JSON.stringify(all)); makeVehicles(); renderMenu(); return; }
    const skb = e.target.closest('.kr-stks button'); if (skb && !skb.disabled) { const id0 = skb.dataset.s, X = STK.find(x0 => x0.id === id0), so = loadJ('kartStkOwn'), all = loadJ('kartPaint'), pt = paintOf(me);
      if (!so[id0]) { if (coins() < X.c) return; addCoins(-X.c); so[id0] = 1; store.set('kartStkOwn', JSON.stringify(so)); SFX.pick(); }
      pt.s = pt.s.includes(id0) ? pt.s.filter(z => z !== id0) : pt.s.concat(id0); all[me] = pt; store.set('kartPaint', JSON.stringify(all)); makeVehicles(); renderMenu(); return; }
    const ptb = e.target.closest('.kr-pts button'); if (ptb && !ptb.disabled) { const o = loadJ('kartParts'), sl = ptb.dataset.slot, X = PARTS[sl].find(x0 => x0.id === ptb.dataset.part); o.own = o.own || {};
      if (X.c && !o.own[X.id]) { if (coins() < X.c) return; addCoins(-X.c); o.own[X.id] = 1; SFX.pick(); }
      o[sl] = X.id; store.set('kartParts', JSON.stringify(o)); makeVehicles(); renderMenu(); return; }
    const wv = e.target.closest('.kr-wsv button'); if (wv) { WSV = wv.dataset.wv; const wV = VEHS.find(x => x.id === WSV); if (wV && unlocked(wV) && WSV !== myVeh()) { VINFO = WSV; store.set('kartVeh', WSV); makeVehicles(); newRace(); S.paused = true; renderMenu(); } else wsRender(); return; }   // Werkstatt-Wahl = Fahrzeug fürs Rennen (Fehler 09.10.: vorher nur zum Tunen gewählt, gefahren wurde das alte)
    const wb = e.target.closest('.kr-wsbuy'); if (wb && !wb.disabled) { const v = VEHS.filter(unlocked).some(x => x.id === WSV) ? WSV : myVeh(), tu = tuneOf(v), q = wb.dataset.k, c = TCOST[tu[q]];
      if (tu[q] < 5 && coins() >= c) { addCoins(-c); tu[q]++; tuneSet(v, tu); SFX.pick(); vib(15); if (tu[q] >= 5) ach('tuned'); if (v === myVeh() && S) { S.tu = tune(); } wsRender(); const r0 = menu.querySelector('.kr-wsbuy[data-k="' + q + '"]'); if (r0) r0.closest('.kr-wsr').classList.add('kr-wsup'); sumBadge('garage', '🪙 ' + coins()); } return; }
    const sb = e.target.closest('.kr-shop button'); if (sb && !sb.disabled) { const tu = tune(), c = TCOST[tu[sb.dataset.k]]; if (tu[sb.dataset.k] < 5 && coins() >= c) { addCoins(-c); tu[sb.dataset.k]++; tuneSet(myVeh(), tu); SFX.pick(); if (tu[sb.dataset.k] >= 5) ach('tuned'); renderMenu(); } }
    const ob = e.target.closest('.kr-cos button'); if (ob && !ob.disabled) { const C = COS.find(x => x.id === ob.dataset.c), o = loadJ('kartCosOwn');
      if (C && !cosOwn()(C) && !C.ach && coins() >= C.c) { addCoins(-C.c); o[C.id] = 1; store.set('kartCosOwn', JSON.stringify(o)); SFX.pick(); }
      if (C && cosOwn()(C)) { const m = loadJ('kartCos'); m[me] = C.id; store.set('kartCos', JSON.stringify(m)); HEADC = {}; } renderMenu(); }
    const bk = e.target.closest('.kr-bk'); if (bk) { BX = BX === bk.dataset.k ? null : bk.dataset.k; renderMenu(); return; }
    const rcc = e.target.closest('.kr-recc button[data-rcc]'); if (rcc) { RECCC = +rcc.dataset.rcc; const rb = menu.querySelector('.kr-recs .kr-recb'); if (rb) rb.innerHTML = recsHtml(); return; }
    const rec0 = e.target.closest('.kr-rec'); if (rec0) { RECOPEN = RECOPEN === rec0.dataset.t ? null : rec0.dataset.t; const rb = menu.querySelector('.kr-recs .kr-recb'); if (rb) rb.innerHTML = recsHtml(); return; }
    const rec = e.target.closest('.kr-recgo'); if (rec) { TRK = rec.dataset.t; store.set('kartTrack', TRK); if (CCS.includes(+rec.dataset.rcc) && +rec.dataset.rcc !== CC) { CC = +rec.dataset.rcc; store.set('kartCC', CC); if (S) S.cc = CC; } if (lbList(LB, TRK).length) { GHOST.mode = 'crew'; store.set('kartGhost', 'crew'); } if (MODE !== 'single') menu.querySelector('.kr-mode button[data-mode="single"]').click(); else { preview(TRK); renderMenu(); } menu.querySelector('.kr-sgrid').scrollIntoView({behavior: 'smooth', block: 'center'}); return; }
    if (e.target.closest('.kr-tutgo')) { tutStart(); return; }
    const cfb = e.target.closest('.kr-cfgt[data-cfg]'); if (cfb) { SFX.pick(); cfgStep(cfb.dataset.cfg); return; }
    if (e.target.closest('.kr-tnt')) { LIVE.tauntOpen = !LIVE.tauntOpen; liveBox(); return; }
    const tnb = e.target.closest('.kr-tlist button'); if (tnb) { tauntSend(+tnb.dataset.tn); LIVE.tauntOpen = false; liveBox(); return; }
    if (e.target.closest('.kr-ptest')) { liveTest(); return; }
    if (e.target.closest('.kr-rjb')) { liveRejoin(); return; }
    if (e.target.closest('.kr-rdy, .kr-rdybig')) { LIVE.rdy = !LIVE.rdy; SFX.pick(); livePres(); renderMenu(); liveAuto(); return; }
    const lmb = e.target.closest('.kr-lmode [data-lm]'); if (lmb) { SFX.pick(); cfgStep('gp:' + (lmb.dataset.lm === 'gp' ? (lgpc(store.get('kartLiveCup')) ? store.get('kartLiveCup') : 'r4') : 'off')); return; }
    const lcb = e.target.closest('.kr-lcups [data-lc]'); if (lcb) { SFX.pick(); cfgStep('gp:' + lcb.dataset.lc); return; }
    if (e.target.closest('.kr-gpx')) { if (!LIVE.gpX) { LIVE.gpX = 1; liveBox(); setTimeout(() => { LIVE.gpX = 0; if (!menu.hidden && MODE === 'live') liveBox(); }, 4000); return; } LIVE.gpX = 0; if (LIVE.gp) { LIVE.gp.end = Date.now(); LIVE.gp.ts = Date.now(); gpSave(); } livePres(); liveBox(); toast('✖ Grand Prix abgebrochen.'); return; }
    if (e.target.closest('.kr-gphide')) { if (LIVE.gp) LIVE.gp.hid = 1; liveBox(); return; }
    if (e.target.closest('.kr-liveai')) { store.set('kartLiveAI', store.get('kartLiveAI') === '0' ? '1' : '0'); renderMenu(); return; }
    const pl0 = e.target.closest('.kr-pill'); if (pl0) { const d = menu.querySelector('.kr-' + pl0.dataset.open); if (d) { d.open = true; setTimeout(() => d.scrollIntoView({behavior: 'smooth', block: 'center'}), 30); } }
    const db0 = e.target.closest('.kr-diff button'); if (db0) { DIFF = +db0.dataset.d; store.set('kartDiff', DIFF); renderMenu(); }
    const ccb = e.target.closest('.kr-cc button[data-cc]'); if (ccb) { CC = +ccb.dataset.cc; store.set('kartCC', CC); if (S && !box.classList.contains('racing')) S.cc = CC; renderMenu(); if (CC === 200) toast('🚀 <b>200 ccm</b>: Kurven früh bremsen oder driften!'); }
    const gb = e.target.closest('.kr-ghost:not(.kr-diff):not(.kr-cc) button'); if (gb) { GHOST.mode = gb.dataset.g; store.set('kartGhost', GHOST.mode); renderMenu(); }
    const t = e.target.closest('.kr-sgrid button[data-t]'); if (t) { TRK = t.dataset.t; store.set('kartTrack', TRK); preview(TRK); renderMenu(); showTop(menu.querySelector('.kr-tinfo')); }
    const sr = e.target.closest('.kr-sgrid .kr-strnd'); if (sr) { if (RSPIN) return; RSPIN = 1; const ids = TRACKS.map(t0 => t0.id).filter(id => id !== TRK), fin = pick(ids), tile = id => menu.querySelector('.kr-sgrid .kr-st[data-t="' + id + '"]'); let n = 0, cur = null;   // Zufalls-Kachel: Lauflicht über die Strecken
      const spin = () => { if (cur && tile(cur)) tile(cur).classList.remove('kr-rl'); n++; cur = n >= 14 ? fin : pick(ids); const t0 = tile(cur); if (t0) t0.classList.add('kr-rl'); beep(500 + n * 40, .04, 'square', .04);
        if (n < 14) setTimeout(spin, 40 + n * n * 1.6); else setTimeout(() => { RSPIN = 0; TRK = fin; store.set('kartTrack', TRK); preview(TRK); renderMenu(); showTop(menu.querySelector('.kr-tinfo')); }, 260); }; spin(); }
    const vws = e.target.closest('.kr-vws'); if (vws) { WSV = vws.dataset.v; const d = menu.querySelector('details.kr-ws'); if (d) { d.open = true; wsRender(); requestAnimationFrame(() => d.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'})); } return; }   // Fahrzeug-Infos: direkt in die Werkstatt
    const vbuy = e.target.closest('.kr-vbuy'); if (vbuy) { const V = VEHS.find(v => v.id === vbuy.dataset.v); if (!V || !V.c) return;
      if (coins() < V.c) { toast('🪙 Noch ' + (V.c - coins()) + ' Münzen, dann gehört ' + V.e + ' ' + esc(V.n) + ' dir.'); return; }
      addCoins(-V.c); const vo = loadJ('kartVehOwn2'); vo[V.id] = 1; store.set('kartVehOwn2', JSON.stringify(vo)); store.set('kartVeh', V.id); VINFO = V.id; SFX.pick(); fireworks(30); toast('🎉 ' + V.e + ' <b>' + esc(V.n) + '</b> gehört jetzt dir!'); makeVehicles(); newRace(); S.paused = true; renderMenu(); return; }
    const vlk = e.target.closest('.kr-vcar button.kr-vlk'); if (vlk) { VINFO = VINFO === vlk.dataset.v ? myVeh() : vlk.dataset.v; renderMenu(); showTop(menu.querySelector('.kr-vinfo')); return; }   // gesperrt: nur Infos (Preis bzw. Erfolg) zeigen
    const vb = e.target.closest('.kr-vehs:not(.kr-cos) > button:not(.kr-vlk)'); if (vb && !vb.disabled) { const inV = !!vb.closest('.kr-vcar'); VINFO = vb.dataset.v; store.set('kartVeh', vb.dataset.v); makeVehicles(); newRace(); S.paused = true; renderMenu(); if (inV) showTop(menu.querySelector('.kr-vinfo')); }
    if (e.target.closest('.kr-go') && MODE === 'live') { LIVE.rdy = !LIVE.rdy; SFX.pick(); livePres(); renderMenu(); liveAuto(); return; }
    if (e.target.closest('.kr-go')) { CUP = MODE === 'cup' ? {i: 0, pts: {}, races: [], list: CUPSEL.t, n: CUPSEL.n, e: CUPSEL.e} : null; startRace(); }
  });
  res.addEventListener('click', e => {
    if (e.target.closest('.kr-gpgo')) { const g = gpLive(); if (g) { SFX.pick(); liveEmit({t: 'gpgo', id: g.id}); LIVE.gpGo = g.id; liveAuto(); gpResUpd(); } return; }   // Grand Prix: ohne die Abwesenden starten (Zwischenstand liegt im Ergebnis-Kasten)
    if (e.target.closest('.kr-rnd2')) { randomRace(); return; }
    if (e.target.closest('.kr-again')) {
      if (CUP && CUP.done) { CUP = {i: 0, pts: {}, races: [], list: CUPSEL.t, n: CUPSEL.n, e: CUPSEL.e}; startRace(); }
      else if (CUP && CUP.i === CUP.list.length - 1) ceremony();
      else if (CUP) { CUP.i++; say('cupnext', 'Auf zum nächsten Rennen!', 1); startRace(); }
      else if (MODE === 'live') { const g = LIVE.gp && LIVE.gp.pts && !LIVE.gp.end ? LIVE.gp : null;
        if (g && g.done && !g.cer) { liveCeremony(); return; }
        if (gpLive() && !LIVE.race) { LIVE.rdy = !LIVE.rdy; SFX.pick(); vib(15); livePres(); gpResUpd(); return; }   /* Grand Prix: im Zwischenstand bereit melden (nochmal tippen = doch nicht) */
        liveLeave(); LIVE.rdy = !(LIVE.gp && LIVE.gp.pts); toMenu(); if (g) gpToLobby(); }
      else startRace(); }
    if (e.target.closest('.kr-res .kr-back')) { liveLeave(); LIVE.rdy = false; toMenu(); if (MODE === 'live' && LIVE.gp) gpToLobby(); }
  });
  // Steuerung: Daumen links/rechts, Item-Knopf; Tastatur
  const ptr = new Map();
  const lastTap = {L: 0, R: 0};
  const upd = () => { const v = [...ptr.values()]; INPUT.L = v.some(o => o.s === 'L'); INPUT.R = v.some(o => o.s === 'R');
    if (SET.ctl === 'analog') { INPUT.brake = v.length >= 2; const o = v[v.length - 1]; if (!o) INPUT.ax = null; else { const r = (o.x - W / 2) / (W * .3); INPUT.ax = Math.abs(r) < .08 ? 0 : clamp(r, -1, 1); } }
    else { INPUT.ax = null; INPUT.brake = false; } };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); if (S && S.pod) { podEnd(); return; } if (S && S.intro) { S.intro.t = Math.max(S.intro.t, S.intro.dur - .7); return; } if (S && S.grid && !S.grid.live) { S.grid.t = Math.max(S.grid.t, S.grid.dur - .35); return; }   // Vorschau überspringen
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
  { const rp = res.querySelector('.kr-rep'); if (rp) rp.addEventListener('toggle', () => { if (!rp.hidden && rp.innerHTML) store.set('kartRepOpen', rp.open ? '1' : '0'); }); }   // Rennbericht auf/zu merken
  box.addEventListener('touchmove', e => { if (!e.target.closest('.kr-menu, .kr-res, .kr-pm')) e.preventDefault(); }, {passive: false});
  box.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape' || e.key === 'p') { if (!pm.hidden) resume(); else if (box.classList.contains('racing')) pause(); else close(); return; } INPUT.keys[e.key] = true; if (e.key === ' ') { e.preventDefault(); if (S) useItem(S.karts[0]); } if (e.key.startsWith('Arrow')) e.preventDefault(); });
  addEventListener('keyup', e => { INPUT.keys[e.key] = false; });
  addEventListener('resize', () => { if (!box.hidden) { resize(); VIH = 0; placeVInfo(); TIH = 0; tinfoTop(menu.querySelector('.kr-tinfo')); } });
  document.addEventListener('visibilitychange', () => { visAt = performance.now(); if (document.hidden && !box.hidden) { pause(); resKeep(); } beat(document.hidden); if (LIVE.room && !LIVE.race) livePres(); });
  function beat(clean) { try { if (box.hidden) { localStorage.removeItem('br26.kartBeat'); return; } store.set('kartBeat', JSON.stringify({ts: Date.now(), clean: clean ? 1 : 0, trk: T ? T.id : null, mode: MODE, veh: myVeh(), drv: me, race: !!(S && box.classList.contains('racing') && res.hidden), live: !!(S && S.live), t: S && isFinite(S.t) ? Math.round(S.t) : null,
    mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, q: SET.q, fps: PERF.n ? Math.round(PERF.n / Math.max(.01, PERF.acc)) : null, v: (typeof MODV === 'object' && MODV.kart) || ''})); } catch (e) {} }
  setInterval(() => { if (!document.hidden) beat(false); }, 4000); addEventListener('pagehide', () => beat(true));
  { let b0 = null; try { b0 = JSON.parse(store.get('kartBeat') || 'null'); } catch (e) {} try { localStorage.removeItem('br26.kartBeat'); } catch (e) {}
    if (b0 && !b0.clean && Date.now() - b0.ts < 20 * 60000) kerr('crash', 'Seite endete, während das Spiel offen war' + (b0.race ? ' (im Rennen)' : ' (im Menü)'), {last: b0, gap: Math.round((Date.now() - b0.ts) / 1000)}); }
  // Wieder ins Spiel (Wunsch Patrick 09.10.): die claude.ai-App lädt die Seite nach einem App-Wechsel oft neu, dann war das Spiel zu.
  // Solange es offen ist, merkt sich das Handy das (br26.kartResume); beim nächsten Laden innerhalb von 30 min geht es von selbst wieder auf
  // (die Seite lädt dafür mods/kart.js sofort). Ein laufendes Einzelrennen lässt sich nicht retten, ein Live-Rennen schon (Wiedereinstieg).
  function resKeep() { if (box.hidden) return; try { store.set('kartResume', JSON.stringify({ts: Date.now(), race: !!(S && box.classList.contains('racing') && res.hidden && !TUTON), live: !!(S && S.live), trk: S && T ? T.id : null, my: Math.round(menu.scrollTop || 0)})); } catch (e) {} }
  function resClear() { try { localStorage.removeItem('br26.kartResume'); } catch (e) {} }
  addEventListener('pagehide', resKeep); setInterval(resKeep, 15000);
  box.addEventListener('pointerdown', () => { if (AC && AC.state === 'suspended' && !(S && S.paused)) audio(); }, {passive: true});   // ohne Antippen darf kein Ton starten: erster Tipper weckt ihn
  { let r = null; try { r = JSON.parse(store.get('kartResume') || 'null'); } catch (e) {}
    if (r && Date.now() - r.ts < 30 * 60000 && !PRINT && box.hidden) {
      try { jump('kartsec'); } catch (e) {} open();
      if (r.my && !r.race) setTimeout(() => { if (!menu.hidden) menu.scrollTop = r.my; }, 1000);
      if (r.race && !r.live) setTimeout(() => toast('😬 Die Seite wurde neu geladen, das Rennen' + (r.trk && TBY[r.trk] ? ' auf ' + esc(TBY[r.trk].name) : '') + ' ist leider weg. Einfach neu starten!', 6500), 700);
      if (r.live && r.race) { const t0 = Date.now(); toast('🔄 Suche dein Live-Rennen …', 6000);
        const iv = setInterval(() => { const sv = liveRun(); if (!sv || box.hidden || menu.hidden || Date.now() - t0 > 20000) { clearInterval(iv); return; }
          if (LIVE.room && LIVE.peers.some(p0 => p0.presence && p0.presence.race === sv.race.id)) { clearInterval(iv); if (MODE !== 'live') { MODE = 'live'; renderMenu(); } liveRejoin(); } }, 1000); } } }
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
  box.addEventListener('click', e => { const w = e.target.closest('.kr-whop button[data-who]'); if (w) { WHOOPEN = false; setMe(w.dataset.who); if (!menu.hidden) renderMenu(); }
    const g = e.target.closest('.kr-whop button[data-gst]'); if (g) { WHOOPEN = false; setGuest(g.dataset.gst); }
    if (e.target.closest('.kr-gother')) { GOTHER = !GOTHER; const wx = e.target.closest('.kr-whobox, .kr-whores'); if (wx && wx.classList.contains('kr-whores')) { wx.innerHTML = whoHtml(wx.querySelector('.kr-who > p').innerHTML); whoHeads(wx); } else renderMenu(); setTimeout(() => { const ip = box.querySelector('.kr-gname'); if (ip) ip.focus(); }, 60); }
    if (e.target.closest('.kr-gok')) { const ip = e.target.closest('.kr-gform').querySelector('.kr-gname'), nm = (ip.value || '').trim().slice(0, 16), sl = gSlug(nm);
      if (!sl) { toast('✍️ Bitte erst deinen Vornamen eintippen.'); ip.focus(); return; } WHOOPEN = false; setGuest('gast_' + sl, nm); }
    if (e.target.closest('.kr-whochg')) { WHOOPEN = true; renderMenu(); } });
  box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('kr-gname')) { e.preventDefault(); const b = e.target.parentNode.querySelector('.kr-gok'); if (b) b.click(); } });
  window.__kartAt = (i, l) => at(i, l); window.__kartBG = () => [BG.width, BG.height, WW, WH]; window.__kartBGimg = w => { const c = document.createElement("canvas"); c.width = w; c.height = Math.round(w * BG.height / BG.width); c.getContext("2d").drawImage(BG, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", .8); }; window.__kartTW = () => TW; window.__kartDeck = () => DECK && {i0: DECK.i0, len: DECK.len, under: DECK.under}; window.__kartTun = () => TUN.map(u => ({i0: u.i0, len: u.len, nm: u.nm})); window.__kartN = () => N;
  window.__kart = {toMenu: () => toMenu(), voice: (i, kd) => { voice(S.karts[i], kd, 1); return S.karts[i].say; }, mm: () => ({on: MM.on, step: MM.step}), mmRender: async (sec, song) => { const A0 = AC, G0 = MM.g, D0 = MM.dl, S0 = MM.song, oc = new OfflineAudioContext(1, 44100 * sec, 44100); AC = oc; MM.g = null; MM.song = song || S0 || 'phonk'; mmGraph(); MM.g.gain.value = .8 * SONGS[MM.song].v; MM.dl.delayTime.value = 60 / SONGS[MM.song].bpm * .75; const sp = 60 / SONGS[MM.song].bpm / 4; for (let st = 0, t = 0; t < sec; st++, t += sp) mmNote(st, t);
    const buf = await oc.startRendering(); AC = A0; MM.g = G0; MM.dl = D0; MM.song = S0; const d = buf.getChannelData(0); let pk = 0, ss = 0; for (let i = 0; i < d.length; i++) { pk = Math.max(pk, Math.abs(d[i])); ss += d[i] * d[i]; }
    const pcm = new Int16Array(d.length); for (let i = 0; i < d.length; i++) pcm[i] = Math.max(-1, Math.min(1, d[i])) * 32767; let bin = ''; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
    return {peak: pk, rms: Math.sqrt(ss / d.length), pcm: btoa(bin)}; }, song: () => MM.song, ls: pr => liveSample(pr, q => q), hitK0: (i, w) => hit(S.karts[i], w), give: (i, k) => { const kk = S.karts[i]; kk.item = ITEMS[k] || Object.values(SPECIAL).find(q => q && q.k === k); kk.icntFor = null; kk.roll = 0; }, use: i => useItem(S.karts[i]), icnt: i => icnt(S.karts[i]), hymn: id => hymn(id), cut: () => CUT, live: () => LIVE, liveGo: a => liveGo(a), emo: e => { const b = [...box.querySelectorAll('.kr-emol button')].find(x => x.textContent === e); if (b) b.click(); }, hitK: (i, why) => hit(S.karts[i], why), open, pause, resume, state: () => S, input: INPUT, step: dt => step(dt), draw: () => draw(), finish: () => finish(), say, bufs: () => BUF, load: id => preview(id), cup: () => CUP, lb: () => [LB, WR], tracks: TRACKS.map(t => t.id)};
})();
