"""Erzeugt die MP3-Dateien für den Sprachführer (web/audio/*.mp3) aus web/trip.json.

    apt-get install espeak-ng mbrola mbrola-br3     # einmalig
    pip install lameenc
    python3 tools/gen_audio.py

Stimme: eSpeak NG mit der MBROLA-Stimme „br3“ (Brasilianisches Portugiesisch, männlich), langsam
gesprochen (140 Wörter/Minute) für gute Verständlichkeit. Vorhandene MP3s werden nicht neu erzeugt;
der Dateiname enthält die Stimmversion, damit Browser nach einem Stimmwechsel nichts Altes aus dem Cache nehmen.
"""
import hashlib, io, json, os, re, subprocess, tempfile, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, 'web', 'audio')
VOICE = 'mb-br3'
SPEED = '140'
VERSION = 'mbrola-br3-140'


def spoken(pt):
    """Text so aufbereiten, dass er gut vorgelesen wird (Alternativen als kurze Pausen)."""
    t = pt.replace('…', '').replace(' – ', '. ').replace(' / ', '. ')
    return re.sub(r'\s+', ' ', t).strip()


def audio_name(pt):
    return hashlib.sha1((VERSION + '|' + spoken(pt)).encode('utf-8')).hexdigest()[:10] + '.mp3'


def synth(text):
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        subprocess.run(['espeak-ng', '-v', VOICE, '-s', SPEED, '-g', '4', '-w', f.name, text], check=True)
        return open(f.name, 'rb').read()


def to_mp3(wav_bytes):
    import lameenc
    with wave.open(io.BytesIO(wav_bytes)) as w:
        rate, ch, pcm = w.getframerate(), w.getnchannels(), w.readframes(w.getnframes())
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
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
    for name, text in todo.items():
        with open(os.path.join(AUDIO, name), 'wb') as f:
            f.write(to_mp3(synth(text)))
        print('erzeugt:', name, text)
    for n in os.listdir(AUDIO):
        if n.endswith('.mp3') and n not in wanted:
            os.remove(os.path.join(AUDIO, n))
            print('entfernt:', n)
    print(len(wanted), 'Sätze,', len(todo), 'neu')


if __name__ == '__main__':
    main()
