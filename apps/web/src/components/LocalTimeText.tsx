"use client";

import type { ReactNode } from "react";

type LocalTimeTextProps = {
  value: string | null | undefined;
  fallback?: ReactNode;
  className?: string;
  options?: Intl.DateTimeFormatOptions;
  titleOptions?: Intl.DateTimeFormatOptions;
};

function normalizeDate(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    normalized,
    parsed,
  };
}

function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export default function LocalTimeText({
  value,
  fallback = null,
  className,
  options,
  titleOptions,
}: LocalTimeTextProps) {
  const normalized = normalizeDate(value);

  if (!normalized) {
    return className ? <span className={className}>{fallback}</span> : <>{fallback}</>;
  }

  const formatted = formatDate(normalized.parsed, options);
  const title = titleOptions ? formatDate(normalized.parsed, titleOptions) : undefined;

  return (
    <time className={className} dateTime={normalized.normalized} suppressHydrationWarning title={title}>
      {formatted}
    </time>
  );
}