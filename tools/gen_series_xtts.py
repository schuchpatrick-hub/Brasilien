#!/usr/bin/env python3
"""Stimmen der Serie mit XTTS v2 (Coqui) statt Piper: natürlicher, mit Betonung.

Braucht eine eigene Python-Umgebung mit coqui-tts, torch, torchcodec, sherpa-onnx, scipy
(Modell kommt von huggingface.co, das muss im Netzwerk erlaubt sein) und Whisper (sherpa-onnx-whisper-small)
unter $WHISPER zum Prüfen. XTTS hängt am Satzende gern Fantasiewörter an: jede Zeile wird bis zu N-mal erzeugt,
an Pausen gekürzt und die Version behalten, die Whisper am besten versteht.

Stimmen je Rolle: trip.json → series.xtts {who: [Sprecher, Sprache]}; danach wie gewohnt nachbearbeitet (POLISH,
Effekt `fx` aus series.voices, z. B. Funk beim Kapitän) und als web/audio/epN-<key>.mp3 gespeichert.
Aufruf: python tools/gen_series_xtts.py ep1 [key …]   — danach tools/build_series_audio.py (Paket) laufen lassen.
Ergebnisse (Dauer, Mundkurve) landen in trip.json → series.epN.voice; vorher die Zeiten sichern, wenn die Folge neu getaktet werden soll.
"""
import difflib, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf

os.environ['COQUI_TOS_AGREED'] = '1'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_dance_audio as G   # POLISH, env_of, ffmpeg, TRIP, OUT

N = int(os.environ.get('TRIES', '4'))
WH = os.environ.get('WHISPER', '')

def squeeze(x, sr, thr=.01, keep=.16):
    """Pausen innerhalb der Zeile auf höchstens `keep` Sekunden kürzen (XTTS macht zwischen Sätzen lange Pausen)."""
    fr = int(sr * .01); q = np.array([np.sqrt((x[j:j + fr] ** 2).mean()) < thr for j in range(0, len(x) - fr + 1, fr)])
    out, j, k = [], 0, int(keep / .01)
    while j < len(q):
        e = j
        while e < len(q) and q[e] == q[j]: e += 1
        seg = x[j * fr:e * fr]
        if q[j] and j > 0 and e < len(q) and e - j > k: seg = np.concatenate([seg[:k * fr // 2], seg[-(k * fr - k * fr // 2):]])
        out.append(seg); j = e
    return np.concatenate(out + [x[len(q) * fr:]]) if out else x

CLEAN = os.path.join(G.ROOT, 'tools', 'data', 'xtts')   # unbearbeitete XTTS-Fassungen (gitignored), Grundlage für --comedy

def comedy(src, dst, c):
    """Comic-Klang je Figur (trip.json → series.comedy {who: {tempo, pitch, style, tight}}): schneller, höher, Cartoon-Klangfarbe, kurze Pausen."""
    c = c or {}; t, p = c.get('tempo', 1), c.get('pitch', 1)
    # Klangfarben (c.style): nasal = Terrance-&-Phillip-Nase, opa = Zittern, mega = Megafon, sleepy = langsames Wabern
    STY = {'nasal': 'highpass=f=280,equalizer=f=1150:t=q:w=1.1:g=8,equalizer=f=2600:t=q:w=1:g=3,lowpass=f=6500',
           'nasal2': 'highpass=f=220,equalizer=f=1300:t=q:w=1.3:g=5,lowpass=f=7000',
           'opa': 'vibrato=f=6.5:d=0.18,highpass=f=200,equalizer=f=1500:t=q:w=1:g=4',
           'mega': 'highpass=f=450,lowpass=f=3200,equalizer=f=1800:t=q:w=1:g=5,acrusher=bits=10:mode=log:mix=0.15',
           'sleepy': 'vibrato=f=2.2:d=0.12,equalizer=f=1200:t=q:w=1:g=3'}
    # tight: Pausen in der Zeile auf ~70 ms kürzen (Sprecher soll flott durchsprechen)
    # apad vorne: rubberband und silenceremove schnitten sonst das leise Satzende ab („Faktor zeh…“); am Schluss nur die Stille wieder weg
    af = ','.join(x for x in ['apad=pad_dur=0.5',
                              'silenceremove=stop_periods=-1:stop_duration=0.12:stop_threshold=-44dB:stop_silence=0.08' if c.get('tight') else '',
                              f'rubberband=tempo={t}:pitch={p}:pitchq=quality:formant=shifted' if (t, p) != (1, 1) else '',
                              STY.get(c.get('style'), ''), 'loudnorm=I=-16:TP=-1.5:LRA=7' if c.get('style') else '',
                              'areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1,areverse'] if x)
    with tempfile.TemporaryDirectory() as tmp:
        pcm = os.path.join(tmp, 'c.wav')
        G.run_ff(src, pcm, af)
        env, dur = G.env_of(pcm)
        subprocess.run([G.ffmpeg(), '-y', '-loglevel', 'error', '-i', pcm, '-b:a', '128k', dst], check=True)
    return dur, env

def cfg(se, ep, ln):
    """Comedy-Werte je Figur: series.comedy, überschreibbar je Folge (series.epN.comedy {who: {…}}) und je Zeile (ln.comedy)."""
    who = ln['who']
    return dict(se.get('comedy', {}).get(who) or {}, **(se[ep].get('comedy', {}).get(who) or {}), **(ln.get('comedy') or {}))

def recomedy(eps):
    """--comedy ep1 ep2 …: Comedy-Klang aus den sauberen Fassungen neu anwenden (schnell, ohne XTTS) und Dauer/Mundkurve eintragen."""
    trip = json.load(open(G.TRIP, encoding='utf-8')); se = trip['series']
    for ep in eps:
        for ln in se[ep]['lines']:
            if ln['who'] == 'card': continue
            k = ln['key']; dur, env = comedy(os.path.join(CLEAN, f'{ep}-{k}.mp3'), os.path.join(G.OUT, f'{ep}-{k}.mp3'), cfg(se, ep, ln))
            se[ep]['voice'][k].update(dur=dur, env=env)
        print(ep, 'ok', flush=True)
    open(G.TRIP, 'w', encoding='utf-8').write(json.dumps(trip, ensure_ascii=False, indent=2) + '\n')

def main():
    if sys.argv[1] == '--comedy': return recomedy(sys.argv[2:])
    os.makedirs(CLEAN, exist_ok=True)
    from TTS.api import TTS
    import sherpa_onnx, scipy.signal as ss
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=WH + '/small-encoder.int8.onnx', decoder=WH + '/small-decoder.int8.onnx',
                                                     tokens=WH + '/small-tokens.txt', language='de', task='transcribe', num_threads=4)
    def asr(x):
        y = ss.resample_poly(x, 2, 3).astype(np.float32); s = rec.create_stream(); s.accept_waveform(16000, y); rec.decode_stream(s); return s.result.text
    norm = lambda s: re.sub(r'[^a-zäöüßãõçéêáíóú0-9 ]', '', s.lower().replace('ß', 'ss')).split()
    tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2').to('cpu')
    ep = sys.argv[1]; only = set(sys.argv[2:])
    trip = json.load(open(G.TRIP, encoding='utf-8')); se = trip['series']; X = dict(se['xtts'], **se[ep].get('xtts', {})); VO = se.get('voices', {})
    os.makedirs(os.path.join(G.ROOT, 'tools', 'data'), exist_ok=True)   # Zwischenstand (gitignored)
    side = os.path.join(G.ROOT, 'tools', 'data', f'{ep}-xtts.json'); done = json.load(open(side)) if os.path.exists(side) else {}
    new = {}
    for ln in se[ep]['lines']:
        k = ln['key']
        if ln['who'] == 'card' or (only and k not in only) or (not only and k in done): continue
        spk, lang = X[ln.get('voice', ln['who'])]
        say = ln['say']; lastw = (norm(say) or [''])[-1]
        # Verständlichkeit; fehlt das letzte Wort (XTTS verschluckt es gern), deutlich abwerten
        score = lambda t: difflib.SequenceMatcher(None, ' '.join(norm(t)), ' '.join(norm(say))).ratio() - (0 if any(difflib.SequenceMatcher(None, lastw, x).ratio() > .6 for x in norm(t)[-3:]) else .2)
        best = None
        for i in range(N):
            w = np.array(tts.tts(text=say, speaker=spk, language=lang, temperature=0.4, repetition_penalty=5.0, top_p=0.8, speed=1.05, split_sentences=True), dtype=np.float32)   # Sätze einzeln (sonst verschluckt XTTS den zweiten), Pausen kürzt squeeze()
            nz = np.where(np.abs(w) > .015)[0]; nz2 = np.where(np.abs(w) > .003)[0]   # Ende großzügig: leise Endlaute (‚t‘, ‚s‘) nicht abschneiden
            w = w[max(0, nz[0] - 600):min(len(w), max(nz[-1] + 2400, nz2[-1] + 1200))] if len(nz) else w
            w = squeeze(w, 24000)
            txt = asr(w); opts = [(score(txt), len(w), w, txt)]
            # Gebrabbel am Ende: an Pausen (>= 120 ms, nach dem ersten Drittel) kürzen und die beste Fassung nehmen
            fr = 960; q = [np.sqrt((w[j:j + fr] ** 2).mean()) < .012 for j in range(0, len(w) - fr, fr)]; j = 0
            while j < len(q):
                if q[j]:
                    e = j
                    while e < len(q) and q[e]: e += 1
                    if e - j >= 3 and j * fr > len(w) * .35:
                        y = w[:j * fr + fr + 3600]; t2 = asr(y); opts.append((score(t2), len(y), y, t2))
                    j = e
                else: j += 1
            lim = 24000 * max(1.6, len(say) * .085)   # deutlich zu lang = lange Pausen oder Gebrabbel → abwerten
            opts = [(o[0] - (.25 if o[1] > lim else 0),) + o[1:] for o in opts]
            top = max(o[0] for o in opts)
            # gleich gut verstanden → kürzeste (Gebrabbel überhört Whisper); bei kurzen Zeilen nur kürzen, wenn es klar besser wird (sonst fehlt das letzte Wort)
            cand = min([o for o in opts if o[0] >= top - .01], key=lambda o: o[1]) if len(say) > 45 else max(opts[1:] and [o for o in opts[1:] if o[0] >= opts[0][0] + .04] or [opts[0]], key=lambda o: o[0])   # gleich gut verstanden → kürzeste (Gebrabbel ignoriert Whisper)
            if best is None or cand[0] > best[0]: best = cand
            if best[0] > .95 or lang != 'de' and best[0] > .6: break
        with tempfile.TemporaryDirectory() as tmp:
            raw = os.path.join(tmp, 'raw.wav'); sf.write(raw, best[2], 24000)
            fx = VO.get(ln['who'], {}).get('fx'); pcm = os.path.join(tmp, 'pcm.wav')
            G.run_ff(raw, pcm, G.POLISH + (',' + fx if fx else '') + ',aresample=44100')
            clean = os.path.join(CLEAN, f'{ep}-{k}.mp3')
            subprocess.run([G.ffmpeg(), '-y', '-loglevel', 'error', '-i', pcm, '-b:a', '128k', clean], check=True)
            dur, env = comedy(clean, os.path.join(G.OUT, f'{ep}-{k}.mp3'), cfg(se, ep, ln))
        done[k] = new[k] = {'dur': dur, 'env': env}; json.dump(done, open(side, 'w'))
        print(ep, k, spk, round(best[0], 2), dur, 'ms |', best[3], flush=True)
    trip = json.load(open(G.TRIP, encoding='utf-8'))   # frisch laden, dann nur die Stimmen eintragen
    trip['series'][ep]['voice'].update({k: dict(trip['series'][ep]['voice'].get(k, {}), **v) for k, v in new.items()})   # nur diese Runde, nachträglich gekürzte Aufnahmen nicht überschreiben
    open(G.TRIP, 'w', encoding='utf-8').write(json.dumps(trip, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main()
