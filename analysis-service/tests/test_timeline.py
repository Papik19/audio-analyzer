import io

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from main import SAMPLE_RATE, app

client = TestClient(app)


def wav_bytes(signal):
    buffer = io.BytesIO()
    sf.write(buffer, signal, SAMPLE_RATE, format="WAV")
    return buffer.getvalue()


def click_track(bpm=120, duration=20.0):
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


def test_timeline_structure():
    response = client.post(
        "/timeline",
        files={"file": ("click.wav", wav_bytes(click_track()), "audio/wav")},
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["times"]) == len(data["rms_db"]) == len(data["centroid_hz"])
    assert 0 < len(data["times"]) <= 600
    assert data["beats"] == sorted(data["beats"])


def test_timeline_detects_beats():
    response = client.post(
        "/timeline",
        files={"file": ("click.wav", wav_bytes(click_track(bpm=120)), "audio/wav")},
    )
    beats = response.json()["beats"]
    # 120 BPM przez 20 s to ok. 40 uderzeń; szeroki zakres, bo algorytm bywa o połowę mniej lub więcej
    assert 15 <= len(beats) <= 90


def test_timeline_rejects_unsupported_extension():
    response = client.post(
        "/timeline",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400