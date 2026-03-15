import { NextResponse } from "next/server";

const publicApiHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function publicApiJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...publicApiHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export function publicApiOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: publicApiHeaders,
  });
}