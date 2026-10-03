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

def main():
    from TTS.api import TTS
    import sherpa_onnx, scipy.signal as ss
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=WH + '/small-encoder.int8.onnx', decoder=WH + '/small-decoder.int8.onnx',
                                                     tokens=WH + '/small-tokens.txt', language='de', task='transcribe', num_threads=4)
    def asr(x):
        y = ss.resample_poly(x, 2, 3).astype(np.float32); s = rec.create_stream(); s.accept_waveform(16000, y); rec.decode_stream(s); return s.result.text
    norm = lambda s: re.sub(r'[^a-zäöüßãõçéêáíóú0-9 ]', '', s.lower().replace('ß', 'ss')).split()
    tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2').to('cpu')
    ep = sys.argv[1]; only = set(sys.argv[2:])
    trip = json.load(open(G.TRIP, encoding='utf-8')); se = trip['series']; X = se['xtts']; VO = se.get('voices', {})
    os.makedirs(os.path.join(G.ROOT, 'tools', 'data'), exist_ok=True)   # Zwischenstand (gitignored)
    side = os.path.join(G.ROOT, 'tools', 'data', f'{ep}-xtts.json'); done = json.load(open(side)) if os.path.exists(side) else {}
    for ln in se[ep]['lines']:
        k = ln['key']
        if (only and k not in only) or (not only and k in done): continue
        spk, lang = X[ln.get('voice', ln['who'])]
        say = ln['say']; score = lambda t: difflib.SequenceMatcher(None, ' '.join(norm(t)), ' '.join(norm(say))).ratio()
        best = None
        for i in range(N):
            w = np.array(tts.tts(text=say, speaker=spk, language=lang, temperature=0.4, repetition_penalty=5.0, top_p=0.8, split_sentences=True), dtype=np.float32)
            nz = np.where(np.abs(w) > .015)[0]; w = w[max(0, nz[0] - 600):nz[-1] + 2400] if len(nz) else w
            txt = asr(w); opts = [(score(txt), len(w), w, txt)]
            # Gebrabbel am Ende: an Pausen (>= 120 ms, nach dem ersten Drittel) kürzen und die beste Fassung nehmen
            fr = 960; q = [np.sqrt((w[j:j + fr] ** 2).mean()) < .012 for j in range(0, len(w) - fr, fr)]; j = 0
            while j < len(q):
                if q[j]:
                    e = j
                    while e < len(q) and q[e]: e += 1
                    if e - j >= 3 and j * fr > len(w) * .35:
                        y = w[:j * fr + fr + 2400]; t2 = asr(y); opts.append((score(t2), len(y), y, t2))
                    j = e
                else: j += 1
            top = max(o[0] for o in opts); cand = max([o for o in opts if o[0] >= top - .005], key=lambda o: o[1])
            if best is None or cand[0] > best[0]: best = cand
            if best[0] > .95 or lang != 'de' and best[0] > .6: break
        with tempfile.TemporaryDirectory() as tmp:
            raw = os.path.join(tmp, 'raw.wav'); sf.write(raw, best[2], 24000)
            fx = VO.get(ln['who'], {}).get('fx'); pcm = os.path.join(tmp, 'pcm.wav')
            G.run_ff(raw, pcm, G.POLISH + (',' + fx if fx else '') + ',aresample=44100')
            env, dur = G.env_of(pcm)
            subprocess.run([G.ffmpeg(), '-y', '-loglevel', 'error', '-i', pcm, '-b:a', '128k', os.path.join(G.OUT, f'{ep}-{k}.mp3')], check=True)
        done[k] = {'dur': dur, 'env': env}; json.dump(done, open(side, 'w'))
        print(ep, k, spk, round(best[0], 2), dur, 'ms |', best[3], flush=True)
    trip = json.load(open(G.TRIP, encoding='utf-8'))   # frisch laden, dann nur die Stimmen eintragen
    trip['series'][ep]['voice'].update({k: dict(trip['series'][ep]['voice'].get(k, {}), **v) for k, v in done.items()})
    open(G.TRIP, 'w', encoding='utf-8').write(json.dumps(trip, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main()
