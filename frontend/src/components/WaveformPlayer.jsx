import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { formatDuration } from "../format";
import "./WaveformPlayer.css";

function WaveformPlayer({ url, beats = [], duration = 0, onTimeUpdate }) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showBeats, setShowBeats] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 96,
      waveColor: "#93b4f5",
      progressColor: "#2563eb",
      cursorColor: "#1f2933",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
    });
    waveSurferRef.current = waveSurfer;

    waveSurfer.on("ready", (loadedDuration) => {
      setAudioDuration(loadedDuration);
      setReady(true);
    });
    waveSurfer.on("play", () => setPlaying(true));
    waveSurfer.on("pause", () => setPlaying(false));
    waveSurfer.on("finish", () => setPlaying(false));
    waveSurfer.on("timeupdate", (time) => {
      setCurrentTime(time);
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    });

    waveSurfer.load(url).catch((err) => {
      if (err?.name !== "AbortError") {
        setError("Nie udało się wczytać pliku audio.");
      }
    });

    return () => {
      waveSurfer.destroy();
    };
  }, [url, onTimeUpdate]);

  const overlayDuration = duration || audioDuration;

  const beatPath = useMemo(() => beats.map((time) => `M${time} 0V1`).join(""), [beats]);

  const handlePlayPause = () => {
    waveSurferRef.current?.playPause();
  };

  return (
    <div className="player">
      <div className="player-wave">
        <div ref={containerRef} className="player-waveform" />
        {showBeats && beats.length > 0 && overlayDuration > 0 && (
          <svg
            className="beat-markers"
            viewBox={`0 0 ${overlayDuration} 1`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={beatPath} />
          </svg>
        )}
      </div>
      <div className="player-controls">
        <button type="button" onClick={handlePlayPause} disabled={!ready}>
          {playing ? "Pauza" : "Odtwórz"}
        </button>
        <span className="player-time">
          {formatDuration(currentTime)} / {formatDuration(audioDuration)}
        </span>
        {beats.length > 0 && (
          <label className="player-toggle">
            <input
              type="checkbox"
              checked={showBeats}
              onChange={(event) => setShowBeats(event.target.checked)}
            />
            Pokaż uderzenia ({beats.length})
          </label>
        )}
        {!ready && !error && <span className="muted">Wczytywanie przebiegu fali...</span>}
        {error && <span className="player-error">{error}</span>}
      </div>
    </div>
  );
}

export default WaveformPlayer;