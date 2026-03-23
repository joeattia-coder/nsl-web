export const SECURITY_SCOPE_OPTIONS = [
  { value: "GLOBAL", label: "Global" },
  { value: "LEAGUE", label: "League" },
  { value: "SEASON", label: "Season" },
  { value: "TOURNAMENT", label: "Tournament" },
  { value: "PLAYER", label: "Player" },
] as const;

export async function getApiErrorMessage(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);
  return payload?.details || payload?.error || fallbackMessage;
}

export function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function createClientKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function groupOptionsByCategory<T extends { category: string }>(values: T[]) {
  return values.reduce<Record<string, T[]>>((groups, value) => {
    if (!groups[value.category]) {
      groups[value.category] = [];
    }

    groups[value.category].push(value);
    return groups;
  }, {});
}