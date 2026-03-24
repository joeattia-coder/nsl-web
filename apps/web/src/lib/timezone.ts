export const ADMIN_TIME_ZONE = "America/Toronto";

type TimeZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

function getTimeZoneParts(date: Date, timeZone: string): TimeZoneParts {
  const parts = getFormatter(timeZone).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;

    if (!value) {
      throw new Error(`Missing ${type} while formatting timezone parts.`);
    }

    return Number(value);
  };

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: lookup("hour"),
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const utcEquivalent = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );

  return utcEquivalent - date.getTime();
}

function zonedPartsToUtcDate(parts: TimeZoneParts, timeZone: string) {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );

  let resolvedDate = new Date(utcGuess);
  let offset = getTimeZoneOffsetMs(resolvedDate, timeZone);
  resolvedDate = new Date(utcGuess - offset);

  const adjustedOffset = getTimeZoneOffsetMs(resolvedDate, timeZone);

  if (adjustedOffset !== offset) {
    resolvedDate = new Date(utcGuess - adjustedOffset);
  }

  return resolvedDate;
}

function normalizeDate(value: Date | string | number | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateOnlyParts(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    throw new Error("Invalid date value.");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseDateTimeParts(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) {
    throw new Error("Invalid date/time value.");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
}

function isMidnightUtc(date: Date) {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

export function formatDateTimeLocalValue(
  value: Date | string | number | null | undefined,
  timeZone = ADMIN_TIME_ZONE
) {
  const date = normalizeDate(value);

  if (!date) {
    return "";
  }

  const parts = getTimeZoneParts(date, timeZone);

  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatDateInputValue(
  value: Date | string | number | null | undefined,
  timeZone = ADMIN_TIME_ZONE
) {
  const date = normalizeDate(value);

  if (!date) {
    return "";
  }

  const parts = getTimeZoneParts(date, timeZone);

  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function parseDateTimeInTimeZone(
  value: string | null | undefined,
  timeZone = ADMIN_TIME_ZONE
) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  return zonedPartsToUtcDate(parseDateTimeParts(normalized), timeZone);
}

export function parseDateInTimeZone(
  value: string | null | undefined,
  timeZone = ADMIN_TIME_ZONE
) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parts = parseDateOnlyParts(normalized);

  return zonedPartsToUtcDate(
    {
      ...parts,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone
  );
}

export function parseStoredMatchDateTime(
  matchDate: Date | string | number | null | undefined,
  matchTime?: string | null,
  timeZone = ADMIN_TIME_ZONE
) {
  const date = normalizeDate(matchDate);

  if (!date) {
    return null;
  }

  const normalizedTime = String(matchTime ?? "").trim();

  if (!normalizedTime || !isMidnightUtc(date)) {
    return date;
  }

  const datePortion = date.toISOString().slice(0, 10);
  return parseDateTimeInTimeZone(`${datePortion}T${normalizedTime}`, timeZone);
}

export function formatStoredMatchDateTimeLocalValue(
  matchDate: Date | string | number | null | undefined,
  matchTime?: string | null,
  timeZone = ADMIN_TIME_ZONE
) {
  return formatDateTimeLocalValue(
    parseStoredMatchDateTime(matchDate, matchTime, timeZone),
    timeZone
  );
}