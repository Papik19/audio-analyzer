import { getAudioUrl } from "../api";
import { formatDate, formatDuration } from "../format";
import WaveformPlayer from "./WaveformPlayer";

function ResultCard({ result }) {
  const rows = [
    ["Czas trwania", formatDuration(result.durationSeconds)],
    ["Częstotliwość próbkowania", `${result.sampleRate} Hz`],
    ["Tempo", `${result.tempoBpm} BPM`],
    ["Głośność (średnia, RMS)", `${result.loudnessDb} dB`],
    ["Centroid spektralny", `${result.spectralCentroidHz} Hz`],
    ["Rolloff spektralny", `${result.spectralRolloffHz} Hz`],
    ["Zero-crossing rate", result.zeroCrossingRate],
    ["Czas analizy", `${result.processingTimeSeconds} s`],
  ];

  return (
    <section className="card">
      <h2>Wyniki analizy</h2>
      <p className="muted">
        {result.fileName} · {formatDate(result.createdAt)}
      </p>

      {result.hasAudio ? (
        <WaveformPlayer key={result.id} url={getAudioUrl(result.id)} />
      ) : (
        <p className="muted">Brak zapisanego pliku audio dla tej analizy.</p>
      )}

      <table className="results-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Współczynniki MFCC (średnie)</h3>
      <p className="mfcc">{result.mfccMean.join(", ")}</p>
    </section>
  );
}

export default ResultCard;