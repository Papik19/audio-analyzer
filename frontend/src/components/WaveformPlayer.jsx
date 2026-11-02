import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { formatDuration } from "../format";
import "./WaveformPlayer.css";

const SVG_NS = "http://www.w3.org/2000/svg";
const NO_BEATS = [];
const TIME_UPDATE_INTERVAL_MS = 100;

const ZOOM_LEVELS = [
  { value: 0, label: "Całość" },
  { value: 20, label: "Małe" },
  { value: 50, label: "Średnie" },
  { value: 100, label: "Duże" },
];

function WaveformPlayer({ url, beats = NO_BEATS, onTimeUpdate }) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const lastEmitRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showBeats, setShowBeats] = useState(true);
  const [zoom, setZoom] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

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
      const now = performance.now();
      if (now - lastEmitRef.current < TIME_UPDATE_INTERVAL_MS) {
        return;
      }
      lastEmitRef.current = now;
      setCurrentTime(time);
      if (onTimeUpdateRef.current) {
        onTimeUpdateRef.current(time);
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
  }, [url]);

  useEffect(() => {
    const waveSurfer = waveSurferRef.current;
    if (!ready || !waveSurfer || !showBeats || beats.length === 0) {
      return undefined;
    }

    const trackDuration = waveSurfer.getDuration();
    if (!trackDuration) {
      return undefined;
    }

    const wrapper = waveSurfer.getWrapper();
    wrapper.style.position = "relative";

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${trackDuration} 1`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", beats.map((time) => `M${time} 0.72V1`).join(""));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgb(220, 38, 38)");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("vector-effect", "non-scaling-stroke");

    svg.appendChild(path);
    wrapper.appendChild(svg);

    return () => {
      svg.remove();
    };
  }, [ready, beats, showBeats, zoom]);

  const handlePlayPause = () => {
    waveSurferRef.current?.playPause();
  };

  const handleZoom = (value) => {
    if (value === zoom) {
      return;
    }
    setZoom(value);
    waveSurferRef.current?.zoom(value);
  };

  return (
    <div className="player">
      <div ref={containerRef} className="player-waveform" />
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
      <div className="player-zoom">
        <span>Powiększenie:</span>
        {ZOOM_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            className={level.value === zoom ? "zoom-btn active" : "zoom-btn"}
            disabled={!ready}
            onClick={() => handleZoom(level.value)}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default WaveformPlayer;