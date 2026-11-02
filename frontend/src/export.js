import { formatDate } from "./format";

const MFCC_COUNT = 13;

const BASE_COLUMNS = [
  ["Id", (a) => a.id],
  ["Nazwa pliku", (a) => a.fileName],
  ["Data analizy", (a) => formatDate(a.createdAt)],
  ["Czas trwania [s]", (a) => a.durationSeconds],
  ["Częstotliwość próbkowania [Hz]", (a) => a.sampleRate],
  ["Tempo [BPM]", (a) => a.tempoBpm],
  ["Średnie RMS", (a) => a.rmsMean],
  ["Głośność [dB]", (a) => a.loudnessDb],
  ["Centroid spektralny [Hz]", (a) => a.spectralCentroidHz],
  ["Rolloff spektralny [Hz]", (a) => a.spectralRolloffHz],
  ["Zero-crossing rate", (a) => a.zeroCrossingRate],
  ["Czas analizy [s]", (a) => a.processingTimeSeconds],
];

const MFCC_COLUMNS = Array.from({ length: MFCC_COUNT }, (_, index) => [
  `MFCC ${index + 1}`,
  (a) => a.mfccMean?.[index],
]);

const COLUMNS = [...BASE_COLUMNS, ...MFCC_COLUMNS];

function formatCell(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "number") {
    return String(value).replace(".", ",");
  }

  const text = String(value);
  if (/[;"\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(items) {
  const header = COLUMNS.map(([label]) => formatCell(label)).join(";");
  const rows = items.map((item) =>
    COLUMNS.map(([, getValue]) => formatCell(getValue(item))).join(";"),
  );
  return [header, ...rows].join("\r\n");
}

function toExportObject(a) {
  return {
    id: a.id,
    fileName: a.fileName,
    createdAt: a.createdAt,
    durationSeconds: a.durationSeconds,
    sampleRate: a.sampleRate,
    tempoBpm: a.tempoBpm,
    rmsMean: a.rmsMean,
    loudnessDb: a.loudnessDb,
    spectralCentroidHz: a.spectralCentroidHz,
    spectralRolloffHz: a.spectralRolloffHz,
    zeroCrossingRate: a.zeroCrossingRate,
    mfccMean: a.mfccMean,
    processingTimeSeconds: a.processingTimeSeconds,
  };
}

export function toJson(items) {
  return JSON.stringify(items.map(toExportObject), null, 2);
}

function download(content, mimeType, fileName) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCsv(items, baseName) {
  download(`\uFEFF${toCsv(items)}`, "text/csv;charset=utf-8", `${baseName}.csv`);
}

export function downloadJson(items, baseName) {
  download(toJson(items), "application/json;charset=utf-8", `${baseName}.json`);
}