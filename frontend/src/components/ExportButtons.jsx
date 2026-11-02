import { downloadCsv, downloadJson } from "../export";
import "./ExportButtons.css";

function ExportButtons({ items, fileName, label }) {
  const disabled = items.length === 0;

  return (
    <div className="export-buttons">
      <span className="muted">{label}</span>
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={() => downloadCsv(items, fileName)}
      >
        CSV
      </button>
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={() => downloadJson(items, fileName)}
      >
        JSON
      </button>
    </div>
  );
}

export default ExportButtons;