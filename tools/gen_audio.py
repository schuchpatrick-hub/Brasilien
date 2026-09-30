"""Erzeugt die MP3-Dateien für den Sprachführer (web/audio/*.mp3) aus web/trip.json.

    pip install piper-tts lameenc
    python3 tools/gen_audio.py

Stimme: Piper „pt-br-edresson-low“ (Brasilianisches Portugiesisch, CC BY 4.0,
https://github.com/Edresson/TTS-Portuguese-Corpus). Das Modell (~60 MB) wird beim ersten Lauf
nach tools/data/ geladen und nicht eingecheckt. Vorhandene MP3s werden nicht neu erzeugt.
"""
import hashlib, io, json, os, re, tarfile, urllib.request, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'tools', 'data')
AUDIO = os.path.join(ROOT, 'web', 'audio')
VOICE_URL = 'https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-pt-br-edresson-low.tar.gz'
MODEL = os.path.join(DATA, 'pt-br-edresson-low.onnx')


def spoken(pt):
    """Text so aufbereiten, dass er gut vorgelesen wird (Alternativen als kurze Pausen)."""
    t = pt.replace('…', '').replace(' – ', '. ').replace(' / ', '. ')
    return re.sub(r'\s+', ' ', t).strip()


def audio_name(pt):
    return hashlib.sha1(spoken(pt).encode('utf-8')).hexdigest()[:10] + '.mp3'


def ensure_model():
    if os.path.exists(MODEL):
        return
    os.makedirs(DATA, exist_ok=True)
    with urllib.request.urlopen(VOICE_URL) as r:
        buf = io.BytesIO(r.read())
    with tarfile.open(fileobj=buf) as tf:
        for m in tf.getmembers():
            if m.name.endswith(('.onnx', '.onnx.json')):
                m.name = os.path.basename(m.name)
                tf.extract(m, DATA)


def to_mp3(wav_bytes):
    import lameenc
    with wave.open(io.BytesIO(wav_bytes)) as w:
        rate, ch, pcm = w.getframerate(), w.getnchannels(), w.readframes(w.getnframes())
    enc = lameenc.Encoder()
    enc.set_bit_rate(48)
    enc.set_in_sample_rate(rate)
    enc.set_channels(ch)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def main():
    with open(os.path.join(ROOT, 'web', 'trip.json'), encoding='utf-8') as f:
        trip = json.load(f)
    os.makedirs(AUDIO, exist_ok=True)
    wanted = {audio_name(p['pt']): spoken(p['pt']) for c in trip['phrases'] for p in c['items']}
    todo = {n: t for n, t in wanted.items() if not os.path.exists(os.path.join(AUDIO, n))}
    if todo:
        ensure_model()
        from piper import PiperVoice
        voice = PiperVoice.load(MODEL)
        for name, text in todo.items():
            buf = io.BytesIO()
            with wave.open(buf, 'wb') as w:
                voice.synthesize_wav(text, w)
            with open(os.path.join(AUDIO, name), 'wb') as f:
                f.write(to_mp3(buf.getvalue()))
            print('erzeugt:', name, text)
    for n in os.listdir(AUDIO):
        if n.endswith('.mp3') and n not in wanted:
            os.remove(os.path.join(AUDIO, n))
            print('entfernt:', n)
    print(len(wanted), 'Sätze,', len(todo), 'neu')


if __name__ == '__main__':
    main()
