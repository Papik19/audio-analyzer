import { useEffect, useState } from "react";
import { analyzeFile, deleteAnalysis, getAnalyses } from "./api";
import HistoryList from "./components/HistoryList";
import ResultCard from "./components/ResultCard";
import UploadForm from "./components/UploadForm";
import "./App.css";

function App() {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setError("");
    try {
      const result = await analyzeFile(file);
      setSelected(result);
      setHistory((current) => [result, ...current]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Analiza cech audio utworów muzycznych</h1>
      </header>

      {error && <div className="error">{error}</div>}

      <main className="layout">
        <div className="column">
          <UploadForm onAnalyze={handleAnalyze} loading={loading} />
          {selected && <ResultCard result={selected} />}
        </div>
        <div className="column">
          <HistoryList
            items={history}
            selectedId={selected?.id}
            onSelect={setSelected}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
}

export default App;