import { memo, useState } from "react";
import { getSpectrogramUrl } from "../api";
import "./SpectrogramView.css";

const KINDS = [
  { value: "mel", label: "Melspektrogram" },
  { value: "linear", label: "Spektrogram liniowy" },
];

function SpectrogramView({ analysisId }) {
  const [kind, setKind] = useState("mel");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleKindChange = (value) => {
    if (value === kind) {
      return;
    }
    setKind(value);
    setLoaded(false);
    setFailed(false);
  };

  return (
    <div className="spectrogram">
      <h3>Spektrogram</h3>

      <div className="spectrogram-tabs">
        {KINDS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={item.value === kind ? "tab active" : "tab"}
            onClick={() => handleKindChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!loaded && !failed && (
        <p className="muted">
          Generowanie spektrogramu... Za pierwszym razem może potrwać kilkanaście sekund.
        </p>
      )}
      {failed && <p className="spectrogram-error">Nie udało się wygenerować spektrogramu.</p>}

      {!failed && (
        <img
          key={`${analysisId}-${kind}`}
          className={loaded ? "spectrogram-image" : "spectrogram-image hidden"}
          src={getSpectrogramUrl(analysisId, kind)}
          alt={kind === "mel" ? "Melspektrogram nagrania" : "Spektrogram liniowy nagrania"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default memo(SpectrogramView);