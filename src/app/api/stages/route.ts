import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Stages API placeholder",
    data: []
  });
}