# Audio Analyzer

System webowy do analizy cech audio utworów muzycznych. Użytkownik przesyła plik audio (WAV, MP3, FLAC, OGG), a system wyznacza jego cechy (tempo, głośność, centroid i rolloff spektralny, zero-crossing rate, MFCC), pokazuje przebieg fali z zaznaczonymi uderzeniami, wykresy głośności i jasności brzmienia w czasie oraz spektrogram i melspektrogram. Wyniki trafiają do historii analiz.

Projekt powstał w ramach pracy inżynierskiej „Projekt i implementacja systemu analizy cech audio utworów muzycznych".

## Architektura

```
React (Vite) :5173  -->  ASP.NET Core Web API :5000  -->  FastAPI + Librosa :8000
 interfejs                 walidacja, historia (SQLite),      analiza sygnału audio,
 WaveSurfer.js             przechowywanie plików              spektrogramy, uderzenia
```

- `frontend/` — interfejs użytkownika (React, Vite, WaveSurfer.js)
- `backend/` — API (ASP.NET Core 9, Entity Framework Core, SQLite)
- `analysis-service/` — serwis analizy (Python, FastAPI, Librosa)

## Wymagania

- .NET 9 SDK
- Node.js (LTS)
- Python 3.12 lub nowszy
- FFmpeg (dostępny w PATH)

## Instalacja (jednorazowo)

Serwis analizy:

```
cd analysis-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

Frontend:

```
cd frontend
npm install
cd ..
```

Backend nie wymaga osobnej instalacji. Pakiety pobierają się przy pierwszym uruchomieniu, a baza SQLite (`backend/audio-analyzer.db`) tworzy się automatycznie.

## Uruchomienie

Najprościej skryptem w głównym folderze (otwiera trzy okna PowerShell i przeglądarkę):

```
.\start.ps1
```

Ręcznie, w trzech osobnych terminalach:

```
cd analysis-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

```
cd backend
dotnet run --urls http://localhost:5000
```

```
cd frontend
npm run dev
```

Aplikacja jest dostępna pod adresem http://localhost:5173. Pierwsza analiza po uruchomieniu serwisu trwa dłużej (Librosa kompiluje funkcje przy pierwszym użyciu).

## Testy

Testy serwisu analizy (nie wymagają uruchomionych serwerów):

```
cd analysis-service
.\venv\Scripts\Activate.ps1
pytest -v
```

Testy używają sztucznych sygnałów o znanych parametrach (ton 440 Hz, seria kliknięć w tempie 120 BPM), więc oczekiwane wyniki można porównać z teorią.

## API backendu

| Metoda | Adres | Opis |
|---|---|---|
| POST | `/api/analyses` | Przesłanie pliku audio (pole `file`), analiza i zapis do historii |
| GET | `/api/analyses` | Lista zapisanych analiz (od najnowszej) |
| GET | `/api/analyses/{id}` | Szczegóły jednej analizy |
| GET | `/api/analyses/{id}/audio` | Zapisany plik audio |
| GET | `/api/analyses/{id}/spectrogram?kind=mel\|linear` | Obraz spektrogramu (PNG) |
| GET | `/api/analyses/{id}/timeline` | Uderzenia oraz przebiegi głośności i centroidu w czasie |
| DELETE | `/api/analyses/{id}` | Usunięcie analizy wraz z plikami |

Serwis analizy (port 8000): `GET /health`, `POST /analyze`, `POST /timeline`, `POST /spectrogram?kind=mel|linear`. Dokumentacja interaktywna: http://127.0.0.1:8000/docs

## Struktura plików

- `backend/Uploads/` — zapisane pliki audio i wygenerowane pliki pomocnicze (spektrogramy, przebiegi); nie trafia do repozytorium
- `backend/audio-analyzer.db` — baza SQLite; nie trafia do repozytorium
- `docs/` — materiały do pracy (zrzuty ekranu, notatki)

## Ograniczenia

- Wykrywanie tempa i uderzeń bywa niedokładne dla muzyki o zmiennym tempie (np. nagrania fortepianowe), algorytm może wskazać wielokrotność lub ułamek rzeczywistego tempa.
- Aplikacja jest przeznaczona do pracy lokalnej, bez uwierzytelniania użytkowników.
- Maksymalny rozmiar przesyłanego pliku to 100 MB.