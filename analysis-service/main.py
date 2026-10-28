import io
import os
import tempfile
import time

import librosa
import librosa.display
import numpy as np
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from matplotlib.figure import Figure

app = FastAPI(title="Audio Analysis Service")

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg"}
SAMPLE_RATE = 22050
SPECTROGRAM_KINDS = {"mel", "linear"}


def load_audio(file: UploadFile):
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Nieobsługiwany format pliku: '{extension}'. "
                   f"Dozwolone formaty: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    with tempfile.TemporaryDirectory() as temp_dir:
        path = os.path.join(temp_dir, "audio" + extension)
        with open(path, "wb") as saved_file:
            saved_file.write(file.file.read())

        try:
            y, sr = librosa.load(path, sr=SAMPLE_RATE, mono=True)
        except Exception as error:
            raise HTTPException(
                status_code=422,
                detail=f"Nie udało się wczytać pliku audio: {error}",
            )

    if len(y) == 0:
        raise HTTPException(status_code=422, detail="Plik audio jest pusty.")

    return y, sr


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(file: UploadFile = File(...)):
    started = time.perf_counter()
    y, sr = load_audio(file)

    duration = librosa.get_duration(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    rms = librosa.feature.rms(y=y)[0]
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    zcr = librosa.feature.zero_crossing_rate(y)[0]
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

    rms_mean = float(np.mean(rms))
    loudness_db = 20 * np.log10(rms_mean + 1e-10)

    return {
        "file_name": file.filename,
        "duration_seconds": round(float(duration), 2),
        "sample_rate": int(sr),
        "tempo_bpm": round(float(np.atleast_1d(tempo)[0]), 1),
        "rms_mean": round(rms_mean, 4),
        "loudness_db": round(float(loudness_db), 2),
        "spectral_centroid_hz": round(float(np.mean(centroid)), 1),
        "spectral_rolloff_hz": round(float(np.mean(rolloff)), 1),
        "zero_crossing_rate": round(float(np.mean(zcr)), 4),
        "mfcc_mean": [round(float(v), 2) for v in np.mean(mfcc, axis=1)],
        "processing_time_seconds": round(time.perf_counter() - started, 2),
    }


@app.post("/spectrogram")
def spectrogram(file: UploadFile = File(...), kind: str = Query("mel")):
    if kind not in SPECTROGRAM_KINDS:
        raise HTTPException(
            status_code=400,
            detail="Nieprawidłowy typ spektrogramu. Dozwolone: mel, linear.",
        )

    y, sr = load_audio(file)
    hop_length = 512

    figure = Figure(figsize=(10, 4), dpi=100)
    ax = figure.subplots()

    if kind == "mel":
        mel = librosa.feature.melspectrogram(
            y=y, sr=sr, n_fft=2048, hop_length=hop_length, n_mels=128
        )
        data_db = librosa.power_to_db(mel, ref=np.max)
        image = librosa.display.specshow(
            data_db, sr=sr, hop_length=hop_length, x_axis="time", y_axis="mel", ax=ax
        )
        ax.set_title("Melspektrogram")
        ax.set_ylabel("Częstotliwość [Hz, skala mel]")
    else:
        stft = librosa.stft(y, n_fft=2048, hop_length=hop_length)
        data_db = librosa.amplitude_to_db(np.abs(stft), ref=np.max)
        image = librosa.display.specshow(
            data_db, sr=sr, hop_length=hop_length, x_axis="time", y_axis="hz", ax=ax
        )
        ax.set_title("Spektrogram liniowy")
        ax.set_ylabel("Częstotliwość [Hz]")

    ax.set_xlabel("Czas [s]")
    figure.colorbar(image, ax=ax, format="%+2.0f dB")

    buffer = io.BytesIO()
    figure.savefig(buffer, format="png", bbox_inches="tight")

    return Response(content=buffer.getvalue(), media_type="image/png")