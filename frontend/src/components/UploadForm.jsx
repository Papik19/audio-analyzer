import { useEffect, useRef, useState } from "react";
import "./UploadForm.css";

const ALLOWED_EXTENSIONS = [".wav", ".mp3", ".flac", ".ogg"];
const MAX_BYTES = 100 * 1024 * 1024;

function ElapsedTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <strong>{seconds} s</strong>;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

function validate(file) {
  const name = file.name.toLowerCase();

  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Nieobsługiwany format pliku. Dozwolone: WAV, MP3, FLAC, OGG.";
  }
  if (file.size === 0) {
    return "Plik jest pusty.";
  }
  if (file.size > MAX_BYTES) {
    return "Plik jest zbyt duży (maksymalnie 100 MB).";
  }
  return "";
}

function UploadForm({ onAnalyze, progress }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);
  const busy = progress.phase !== "idle";

  useEffect(() => {
    // Upuszczenie pliku poza strefą nie może otwierać go w przeglądarce.
    const prevent = (event) => event.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);

    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const chooseFile = (candidate) => {
    if (!candidate) {
      return;
    }

    const problem = validate(candidate);
    if (problem) {
      setFile(null);
      setLocalError(problem);
      return;
    }

    setLocalError("");
    setFile(candidate);
  };

  const openPicker = () => {
    if (!busy) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!busy) {
      setDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    if (!busy) {
      chooseFile(event.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (event) => {
    chooseFile(event.target.files[0]);
    event.target.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || busy) {
      return;
    }

    const succeeded = await onAnalyze(file);
    if (succeeded) {
      setFile(null);
    }
  };

  const zoneClass = ["dropzone", dragging ? "dragging" : "", busy ? "disabled" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="card">
      <h2>Nowa analiza</h2>
      <form onSubmit={handleSubmit} className="upload-panel">
        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3,.flac,.ogg"
          hidden
          disabled={busy}
          onChange={handleInputChange}
        />

        <div
          className={zoneClass}
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-disabled={busy}
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <>
              <strong className="dropzone-file">{file.name}</strong>
              <span className="muted">
                {formatSize(file.size)} · kliknij lub upuść inny plik, aby zmienić
              </span>
            </>
          ) : (
            <>
              <strong>Przeciągnij plik audio tutaj</strong>
              <span className="muted">
                albo kliknij, aby go wybrać (WAV, MP3, FLAC, OGG, do 100 MB)
              </span>
            </>
          )}
        </div>

        {localError && <p className="upload-error">{localError}</p>}

        <div className="upload-actions">
          <button type="submit" disabled={!file || busy}>
            {busy ? "Analizowanie..." : "Analizuj"}
          </button>
        </div>

        {progress.phase === "uploading" && (
          <div className="upload-status">
            <span>Wysyłanie pliku: {progress.percent}%</span>
            <progress className="upload-progress" max="100" value={progress.percent} />
          </div>
        )}

        {progress.phase === "analyzing" && (
          <div className="upload-status">
            <span>
              Analiza w toku... <ElapsedTimer />
            </span>
            <progress className="upload-progress" max="100" />
            <span className="muted">
              Pierwsza analiza po uruchomieniu serwisu może potrwać do minuty.
            </span>
          </div>
        )}
      </form>
    </section>
  );
}

export default UploadForm;