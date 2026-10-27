import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { formatDuration } from "../format";
import "./WaveformPlayer.css";

function WaveformPlayer({ url }) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

    waveSurfer.on("ready", (audioDuration) => {
      setDuration(audioDuration);
      setReady(true);
    });
    waveSurfer.on("play", () => setPlaying(true));
    waveSurfer.on("pause", () => setPlaying(false));
    waveSurfer.on("finish", () => setPlaying(false));
    waveSurfer.on("timeupdate", (time) => setCurrentTime(time));

    waveSurfer.load(url).catch((err) => {
      if (err?.name !== "AbortError") {
        setError("Nie udało się wczytać pliku audio.");
      }
    });

    return () => {
      waveSurfer.destroy();
    };
  }, [url]);

  const handlePlayPause = () => {
    waveSurferRef.current?.playPause();
  };

  return (
    <div className="player">
      <div ref={containerRef} className="player-waveform" />
      <div className="player-controls">
        <button type="button" onClick={handlePlayPause} disabled={!ready}>
          {playing ? "Pauza" : "Odtwórz"}
        </button>
        <span className="player-time">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
        {!ready && !error && <span className="muted">Wczytywanie przebiegu fali...</span>}
        {error && <span className="player-error">{error}</span>}
      </div>
    </div>
  );
}

export default WaveformPlayer;