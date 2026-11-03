import { useMemo, useState } from "react";
import { formatDate } from "../format";
import ExportButtons from "./ExportButtons";
import "./HistoryList.css";

const SORT_OPTIONS = [
  { value: "date-desc", label: "Najnowsze" },
  { value: "date-asc", label: "Najstarsze" },
  { value: "name-asc", label: "Nazwa A–Z" },
  { value: "name-desc", label: "Nazwa Z–A" },
  { value: "tempo-asc", label: "Tempo rosnąco" },
  { value: "tempo-desc", label: "Tempo malejąco" },
  { value: "duration-desc", label: "Najdłuższe" },
  { value: "duration-asc", label: "Najkrótsze" },
];

const collator = new Intl.Collator("pl", { numeric: true, sensitivity: "base" });

function timestamp(item) {
  const value = item.createdAt;
  if (!value) {
    return item.id;
  }

  const hasTimeZone = /(Z|[+-]\d{2}:\d{2})$/.test(value);
  const parsed = Date.parse(hasTimeZone ? value : `${value}Z`);
  return Number.isNaN(parsed) ? item.id : parsed;
}

const COMPARATORS = {
  "date-desc": (a, b) => timestamp(b) - timestamp(a) || b.id - a.id,
  "date-asc": (a, b) => timestamp(a) - timestamp(b) || a.id - b.id,
  "name-asc": (a, b) => collator.compare(a.fileName, b.fileName) || b.id - a.id,
  "name-desc": (a, b) => collator.compare(b.fileName, a.fileName) || b.id - a.id,
  "tempo-asc": (a, b) => a.tempoBpm - b.tempoBpm || b.id - a.id,
  "tempo-desc": (a, b) => b.tempoBpm - a.tempoBpm || b.id - a.id,
  "duration-desc": (a, b) => b.durationSeconds - a.durationSeconds || b.id - a.id,
  "duration-asc": (a, b) => a.durationSeconds - b.durationSeconds || b.id - a.id,
};

function HistoryList({ items, selectedId, compareIds, onSelect, onDelete, onToggleCompare }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("date-desc");

  const compareFull = compareIds.length >= 2;
  const today = new Date().toISOString().slice(0, 10);
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");

  const visible = useMemo(() => {
    const filtered = normalizedQuery
      ? items.filter((item) => item.fileName.toLocaleLowerCase("pl").includes(normalizedQuery))
      : items;

    return [...filtered].sort(COMPARATORS[sortKey]);
  }, [items, normalizedQuery, sortKey]);

  const exportLabel = normalizedQuery
    ? `Eksportuj wyniki wyszukiwania (${visible.length}):`
    : "Eksportuj całą historię:";

  return (
    <section className="card">
      <h2>Historia analiz</h2>

      <ExportButtons items={visible} fileName={`historia-analiz-${today}`} label={exportLabel} />

      {items.length > 0 && (
        <>
          <div className="history-controls">
            <input
              type="search"
              className="history-search"
              placeholder="Szukaj po nazwie pliku..."
              aria-label="Szukaj po nazwie pliku"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              aria-label="Sortowanie"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className="muted history-count">
            Wyświetlono {visible.length} z {items.length}
          </p>
        </>
      )}

      {items.length > 1 && (
        <p className="muted">Zaznacz dwie analizy (pole „Porównaj”), aby zobaczyć ich zestawienie.</p>
      )}

      {items.length === 0 && <p className="muted">Brak zapisanych analiz.</p>}

      {items.length > 0 && visible.length === 0 && (
        <p className="muted">
          Brak analiz pasujących do wyszukiwania.{" "}
          <button type="button" className="link-button" onClick={() => setQuery("")}>
            Wyczyść wyszukiwanie
          </button>
        </p>
      )}

      {visible.length > 0 && (
        <ul className="history">
          {visible.map((item) => {
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