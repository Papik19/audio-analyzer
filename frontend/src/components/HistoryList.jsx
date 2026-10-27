import { formatDate } from "../format";

function HistoryList({ items, selectedId, onSelect, onDelete }) {
  return (
    <section className="card">
      <h2>Historia analiz</h2>
      {items.length === 0 ? (
        <p className="muted">Brak zapisanych analiz.</p>
      ) : (
        <ul className="history">
          {items.map((item) => (
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
                <button type="button" onClick={() => onSelect(item)}>
                  Pokaż
                </button>
                <button type="button" className="danger" onClick={() => onDelete(item.id)}>
                  Usuń
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default HistoryList;