"""Erzeugt die MP3-Dateien für den Sprachführer (web/audio/*.mp3) aus web/trip.json.

    apt-get install espeak-ng mbrola mbrola-br3 mbrola-de4     # einmalig
    pip install lameenc
    python3 tools/gen_audio.py

Jede Aufnahme: erst der deutsche Satz (MBROLA „de4“), kurze Pause, dann der portugiesische Satz
(MBROLA „br3“, Brasilianisches Portugiesisch), beides langsam gesprochen (140 Wörter/Minute).
Regieanweisungen in Klammern, z. B. „(auf Jonas zeigen)“, werden nicht vorgelesen. Vorhandene MP3s werden nicht neu erzeugt;
der Dateiname enthält die Stimmversion, damit Browser nach einem Stimmwechsel nichts Altes aus dem Cache nehmen.
"""
import hashlib, io, json, os, re, subprocess, tempfile, warnings, wave
with warnings.catch_warnings():
    warnings.simplefilter('ignore', DeprecationWarning)
    import audioop

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, 'web', 'audio')
VOICE = 'mb-br3'
VOICE_DE = 'mb-de4'
SPEED = '140'
RATE = 22050
PAUSE_S = 0.7
VERSION = 'de4-br3-140'


def spoken(pt):
    """Text so aufbereiten, dass er gut vorgelesen wird (Alternativen als kurze Pausen)."""
    t = pt.replace('…', '').replace(' – ', '. ').replace(' / ', '. ')
    return re.sub(r'\s+', ' ', t).strip()


def spoken_de(de):
    """Deutschen Satz ohne Regieanweisungen in Klammern."""
    return spoken(re.sub(r'\s*\([^)]*\)', '', de))


def audio_name(pt, de=''):
    return hashlib.sha1((VERSION + '|' + spoken_de(de) + '|' + spoken(pt)).encode('utf-8')).hexdigest()[:10] + '.mp3'


def pcm(voice, text):
    """Text sprechen, als 16-bit-Mono-PCM mit RATE Hz."""
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        subprocess.run(['espeak-ng', '-v', voice, '-s', SPEED, '-g', '4', '-w', f.name, text], check=True, stderr=subprocess.DEVNULL)
        with wave.open(f.name) as w:
            rate, data = w.getframerate(), w.readframes(w.getnframes())
    if rate != RATE:
        data, _ = audioop.ratecv(data, 2, 1, rate, RATE, None)
    return data


def synth(de, pt):
    data = (pcm(VOICE_DE, de) if de else b'') + b'\x00\x00' * int(RATE * PAUSE_S) + pcm(VOICE, pt)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(data)
    return buf.getvalue()


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
    wanted = {audio_name(p['pt'], p['de']): (spoken_de(p['de']), spoken(p['pt'])) for c in trip['phrases'] for p in c['items']}
    todo = {n: t for n, t in wanted.items() if not os.path.exists(os.path.join(AUDIO, n))}
    for name, (de, pt) in todo.items():
        with open(os.path.join(AUDIO, name), 'wb') as f:
            f.write(to_mp3(synth(de, pt)))
        print('erzeugt:', name, de, '→', pt)
    for n in os.listdir(AUDIO):
        if n.endswith('.mp3') and n not in wanted:
            os.remove(os.path.join(AUDIO, n))
            print('entfernt:', n)
    print(len(wanted), 'Sätze,', len(todo), 'neu')


if __name__ == '__main__':
    main()
