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

export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await request(API_URL, { method: "POST", body: formData });
  return response.json();
}

export async function getAnalyses() {
  const response = await request(API_URL);
  return response.json();
}

export async function deleteAnalysis(id) {
  await request(`${API_URL}/${id}`, { method: "DELETE" });
}