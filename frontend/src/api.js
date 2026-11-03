const API_URL = "http://localhost:5000/api/analyses";

async function parseError(response) {
  try {
    const data = await response.json();
    if (data.error) {
      return data.error;
    }
  } catch {
    // odpowiedź bez JSON-a
  }
  return `Błąd serwera (${response.status}).`;
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Nie można połączyć się z serwerem. Sprawdź, czy backend jest uruchomiony.");
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response;
}

export function getAudioUrl(id) {
  return `${API_URL}/${id}/audio`;
}

export function getSpectrogramUrl(id, kind) {
  return `${API_URL}/${id}/spectrogram?kind=${kind}`;
}

export async function getTimeline(id) {
  const response = await request(`${API_URL}/${id}/timeline`);
  return response.json();
}

export function analyzeFile(file, { onUploadProgress, onUploadComplete } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onUploadProgress) {
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.upload.onload = () => {
      if (onUploadComplete) {
        onUploadComplete();
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.response) {
          resolve(xhr.response);
        } else {
          reject(new Error("Serwer zwrócił nieprawidłową odpowiedź."));
        }
        return;
      }

      reject(new Error(xhr.response?.error ?? `Błąd serwera (${xhr.status}).`));
    };

    xhr.onerror = () => {
      reject(new Error("Nie można połączyć się z serwerem. Sprawdź, czy backend jest uruchomiony."));
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export async function getAnalyses() {
  const response = await request(API_URL);
  return response.json();
}

export async function deleteAnalysis(id) {
  await request(`${API_URL}/${id}`, { method: "DELETE" });
}