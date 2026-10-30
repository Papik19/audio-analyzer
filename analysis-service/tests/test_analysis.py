import io

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from main import SAMPLE_RATE, app

client = TestClient(app)


def wav_bytes(signal, sample_rate=SAMPLE_RATE):
    buffer = io.BytesIO()
    sf.write(buffer, signal, sample_rate, format="WAV")
    return buffer.getvalue()


def sine_wave(frequency=440.0, duration=5.0, amplitude=0.5):
    t = np.arange(int(duration * SAMPLE_RATE)) / SAMPLE_RATE
    return amplitude * np.sin(2 * np.pi * frequency * t)


def click_track(bpm=120, duration=30.0):
    signal = np.zeros(int(duration * SAMPLE_RATE))
    click_length = int(0.05 * SAMPLE_RATE)
    t = np.arange(click_length) / SAMPLE_RATE
    click = np.sin(2 * np.pi * 1000 * t) * np.exp(-t * 80)
    interval = 60.0 / bpm

    position = 0.0
    while position < duration - 0.1:
        start = int(position * SAMPLE_RATE)
        signal[start:start + click_length] += click
        position += interval

    return signal


def analyze(signal, filename="test.wav"):
    return client.post(
        "/analyze",
        files={"file": (filename, wav_bytes(signal), "audio/wav")},
    )


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_rejects_unsupported_extension():
    response = client.post(
        "/analyze",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400


def test_rejects_corrupted_audio():
    response = client.post(
        "/analyze",
        files={"file": ("broken.wav", b"to nie jest audio", "audio/wav")},
    )
    assert response.status_code == 422


def test_sine_wave_basic_features():
    response = analyze(sine_wave(frequency=440.0, duration=5.0, amplitude=0.5))
    assert response.status_code == 200

    data = response.json()
    assert abs(data["duration_seconds"] - 5.0) < 0.05
    assert data["sample_rate"] == SAMPLE_RATE
    assert len(data["mfcc_mean"]) == 13


def test_sine_wave_spectral_centroid_matches_frequency():
    data = analyze(sine_wave(frequency=440.0)).json()
    assert 380 <= data["spectral_centroid_hz"] <= 520


def test_sine_wave_loudness():
    # RMS sinusoidy o amplitudzie 0.5 to 0.5 / sqrt(2), czyli ok. 0.354 (ok. -9 dB)
    data = analyze(sine_wave(amplitude=0.5)).json()
    assert abs(data["rms_mean"] - 0.354) < 0.03
    assert -11 <= data["loudness_db"] <= -7


def test_sine_wave_zero_crossing_rate():
    # 440 Hz przy 22050 Hz: ok. 2 * 440 / 22050, czyli ok. 0.04 przejść na próbkę
    data = analyze(sine_wave(frequency=440.0)).json()
    assert 0.03 <= data["zero_crossing_rate"] <= 0.05


def test_click_track_tempo():
    data = analyze(click_track(bpm=120)).json()
    assert abs(data["tempo_bpm"] - 120) <= 5


def test_spectrogram_returns_png():
    for kind in ("mel", "linear"):
        response = client.post(
            f"/spectrogram?kind={kind}",
            files={"file": ("test.wav", wav_bytes(sine_wave(duration=2.0)), "audio/wav")},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
        assert response.content.startswith(b"\x89PNG")


def test_spectrogram_rejects_invalid_kind():
    response = client.post(
        "/spectrogram?kind=abc",
        files={"file": ("test.wav", wav_bytes(sine_wave(duration=2.0)), "audio/wav")},
    )
    assert response.status_code == 400