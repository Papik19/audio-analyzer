export function formatDuration(totalSeconds) {
  const total = Math.round(totalSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatDate(value) {
  if (!value) {
    return "";
  }

  const hasTimeZone = /(Z|[+-]\d{2}:\d{2})$/.test(value);
  const date = new Date(hasTimeZone ? value : `${value}Z`);
  return date.toLocaleString("pl-PL");
}