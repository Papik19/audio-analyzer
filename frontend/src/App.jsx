import { useEffect, useState } from "react";
import { analyzeFile, deleteAnalysis, getAnalyses } from "./api";
import ComparisonCard from "./components/ComparisonCard";
import HistoryList from "./components/HistoryList";
import ResultCard from "./components/ResultCard";
import UploadForm from "./components/UploadForm";
import "./App.css";

const IDLE = { phase: "idle", percent: 0 };

function App() {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [upload, setUpload] = useState(IDLE);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAnalyses()
      .then((items) => {
        if (!cancelled) {
          setHistory(items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAnalyze = async (file) => {
    setError("");
    setUpload({ phase: "uploading", percent: 0 });

    try {
      const result = await analyzeFile(file, {
        onUploadProgress: (percent) => setUpload({ phase: "uploading", percent }),
        onUploadComplete: () => setUpload({ phase: "analyzing", percent: 100 }),
      });
      setSelected(result);
      setHistory((current) => [result, ...current]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setUpload(IDLE);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Na pewno usunąć tę analizę z historii?")) {
      return;
    }

    try {
      await deleteAnalysis(id);
      setHistory((current) => current.filter((item) => item.id !== id));
      setSelected((current) => (current && current.id === id ? null : current));
      setCompareIds((current) => current.filter((compareId) => compareId !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleCompare = (id) => {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((compareId) => compareId !== id);
      }
      if (current.length >= 2) {
        return current;
      }
      return [...current, id];
    });
  };

  const compared = compareIds
    .map((id) => history.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Analiza cech audio utworów muzycznych</h1>
      </header>

      {error && <div className="error">{error}</div>}

      <main className="layout">
        <div className="column">
          <UploadForm onAnalyze={handleAnalyze} progress={upload} />
          {compared.length === 2 && (
            <ComparisonCard
              first={compared[0]}
              second={compared[1]}
              onClose={() => setCompareIds([])}
            />
          )}
          {selected && <ResultCard result={selected} />}
        </div>
        <div className="column">
          <HistoryList
            items={history}
            selectedId={selected?.id}
            compareIds={compareIds}
            onSelect={setSelected}
            onDelete={handleDelete}
            onToggleCompare={handleToggleCompare}
          />
        </div>
      </main>
    </div>
  );
}

export default App;