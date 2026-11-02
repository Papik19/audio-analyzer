import { formatDate } from "../format";
import ExportButtons from "./ExportButtons";
import "./HistoryList.css";

function HistoryList({ items, selectedId, compareIds, onSelect, onDelete, onToggleCompare }) {
  const compareFull = compareIds.length >= 2;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="card">
      <h2>Historia analiz</h2>

      <ExportButtons
        items={items}
        fileName={`historia-analiz-${today}`}
        label="Eksportuj całą historię:"
      />

      {items.length > 1 && (
        <p className="muted">Zaznacz dwie analizy (pole „Porównaj”), aby zobaczyć ich zestawienie.</p>
      )}

      {items.length === 0 ? (
        <p className="muted">Brak zapisanych analiz.</p>
      ) : (
        <ul className="history">
          {items.map((item) => {
            const checked = compareIds.includes(item.id);

            return (
              <li
                key={item.id}
                className={item.id === selectedId ? "history-item active" : "history-item"}
              >
                <div className="history-info">
                  <strong>{item.fileName}</strong>
                  <span className="muted">
                    {formatDate(item.createdAt)} · {item.tempoBpm} BPM
                  </span>
                </div>
                <div className="history-actions">
                  <label className="history-compare">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && compareFull}
                      onChange={() => onToggleCompare(item.id)}
                    />
                    Porównaj
                  </label>
                  <button type="button" onClick={() => onSelect(item)}>
                    Pokaż
                  </button>
                  <button type="button" className="danger" onClick={() => onDelete(item.id)}>
                    Usuń
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default HistoryList;