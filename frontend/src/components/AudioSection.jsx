import { useEffect, useState } from "react";
import { getAudioUrl, getTimeline } from "../api";
import SpectrogramView from "./SpectrogramView";
import TimeSeriesChart from "./TimeSeriesChart";
import WaveformPlayer from "./WaveformPlayer";

const NO_BEATS = [];

function AudioSection({ analysisId, duration }) {
  const [timeline, setTimeline] = useState(null);
  const [timelineError, setTimelineError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getTimeline(analysisId)
      .then((data) => {
        if (!cancelled) {
          setTimeline(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTimelineError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  return (
    <>
      <WaveformPlayer
        url={getAudioUrl(analysisId)}
        beats={timeline?.beats ?? NO_BEATS}
        duration={duration}
        onTimeUpdate={setCurrentTime}
      />

      {timelineError && <p className="spectrogram-error">{timelineError}</p>}
      {!timeline && !timelineError && (
        <p className="muted">
          Wyznaczanie uderzeń i przebiegów w czasie... Za pierwszym razem może potrwać kilkanaście
          sekund.
        </p>
      )}

      {timeline && (
        <div className="timeline">
          <h3>Przebiegi w czasie</h3>
          <TimeSeriesChart
            title="Głośność w czasie (RMS)"
            unit="dB"
            times={timeline.times}
            values={timeline.rmsDb}
            duration={duration}
            currentTime={currentTime}
            color="#2563eb"
          />
          <TimeSeriesChart
            title="Jasność brzmienia w czasie (centroid spektralny)"
            unit="Hz"
            times={timeline.times}
            values={timeline.centroidHz}
            duration={duration}
            currentTime={currentTime}
            color="#16a34a"
          />
        </div>
      )}

      <SpectrogramView analysisId={analysisId} />
    </>
  );
}

export default AudioSection;