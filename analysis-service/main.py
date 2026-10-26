import os
import tempfile
import time

import librosa
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI(title="Audio Analysis Service")

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg"}
SAMPLE_RATE = 22050


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(file: UploadFile = File(...)):
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Nieobsługiwany format pliku: '{extension}'. "
                   f"Dozwolone formaty: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    started = time.perf_counter()

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