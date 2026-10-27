import { useRef, useState } from "react";

function UploadForm({ onAnalyze, loading }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      return;
    }

    await onAnalyze(file);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <section className="card">
      <h2>Nowa analiza</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3,.flac,.ogg"
          disabled={loading}
          onChange={(event) => setFile(event.target.files[0] ?? null)}
        />
        <button type="submit" disabled={!file || loading}>
          {loading ? "Analizowanie..." : "Analizuj"}
        </button>
      </form>
      {loading && (
        <p className="muted">
          Analiza może potrwać do minuty, zwłaszcza przy pierwszym pliku po uruchomieniu serwisu.
        </p>
      )}
      <p className="muted">Obsługiwane formaty: WAV, MP3, FLAC, OGG.</p>
    </section>
  );
}

export default UploadForm;