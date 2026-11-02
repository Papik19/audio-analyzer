import { formatDate, formatDuration, formatPercent, formatSigned } from "../format";
import "./ComparisonCard.css";

const METRICS = [
  {
    label: "Czas trwania",
    value: (r) => r.durationSeconds,
    display: (v) => formatDuration(v),
    unit: "s",
    digits: 1,
    percent: true,
  },
  {
    label: "Częstotliwość próbkowania",
    value: (r) => r.sampleRate,
    display: (v) => `${v} Hz`,
    unit: "Hz",
    digits: 0,
    percent: false,
  },
  {
    label: "Tempo",
    value: (r) => r.tempoBpm,
    display: (v) => `${v} BPM`,
    unit: "BPM",
    digits: 1,
    percent: true,
  },
  {
    label: "Głośność (średnia, RMS)",
    value: (r) => r.loudnessDb,
    display: (v) => `${v} dB`,
    unit: "dB",
    digits: 2,
    percent: false,
  },
  {
    label: "Centroid spektralny",
    value: (r) => r.spectralCentroidHz,
    display: (v) => `${v} Hz`,
    unit: "Hz",
    digits: 1,
    percent: true,
  },
  {
    label: "Rolloff spektralny",
    value: (r) => r.spectralRolloffHz,
    display: (v) => `${v} Hz`,
    unit: "Hz",
    digits: 1,
    percent: true,
  },
  {
    label: "Zero-crossing rate",
    value: (r) => r.zeroCrossingRate,
    display: (v) => String(v),
    unit: "",
    digits: 4,
    percent: true,
  },
  {
    label: "Czas analizy",
    value: (r) => r.processingTimeSeconds,
    display: (v) => `${v} s`,
    unit: "s",
    digits: 2,
    percent: false,
  },
];

function ColumnHeader({ letter, analysis }) {
  return (
    <th scope="col">
      <span className="comparison-label">Analiza {letter}</span>
      <span className="comparison-file">{analysis.fileName}</span>
      <span className="comparison-file">{formatDate(analysis.createdAt)}</span>
    </th>
  );
}

function ComparisonCard({ first, second, onClose }) {
  return (
    <section className="card">
      <div className="comparison-header">
        <h2>Porównanie analiz</h2>
        <button type="button" className="secondary" onClick={onClose}>
          Zamknij porównanie
        </button>
      </div>

      <div className="table-scroll">
        <table className="results-table comparison-table">
          <thead>
            <tr>
              <th scope="col"></th>
              <ColumnHeader letter="A" analysis={first} />
              <ColumnHeader letter="B" analysis={second} />
              <th scope="col">Różnica (B − A)</th>
              <th scope="col">Zmiana</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const a = metric.value(first);
              const b = metric.value(second);
              const unit = metric.unit ? ` ${metric.unit}` : "";

              return (
                <tr key={metric.label}>
                  <th scope="row">{metric.label}</th>
                  <td>{metric.display(a)}</td>
                  <td>{metric.display(b)}</td>
                  <td>{`${formatSigned(b - a, metric.digits)}${unit}`}</td>
                  <td>{metric.percent ? formatPercent(a, b) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="muted comparison-note">
        Różnica to wartość z analizy B minus wartość z analizy A. Zestawienie przydaje się np. do
        porównania tego samego nagrania w różnych formatach (WAV i MP3).
      </p>
    </section>
  );
}

export default ComparisonCard;