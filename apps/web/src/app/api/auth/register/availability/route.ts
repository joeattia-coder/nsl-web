import { NextResponse } from "next/server";
import {
  getRegistrationAvailability,
  normalizeRegistrationEmail,
  normalizeRegistrationUsername,
} from "@/lib/register-availability";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const field = String(searchParams.get("field") ?? "").trim();
  const rawValue = String(searchParams.get("value") ?? "").trim();

  if (field !== "email" && field !== "username") {
    return NextResponse.json({ error: "Invalid availability field." }, { status: 400 });
  }

  if (!rawValue) {
    return NextResponse.json({ error: "A value is required." }, { status: 400 });
  }

  if (field === "email") {
    const email = normalizeRegistrationEmail(rawValue);

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const availability = await getRegistrationAvailability({ email });

    return NextResponse.json({
      field,
      available: !availability.emailTaken,
      duplicate: availability.emailTaken,
    });
  }

  const username = normalizeRegistrationUsername(rawValue);

  if (!USERNAME_PATTERN.test(rawValue)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-30 characters and can only include letters, numbers, periods, underscores, and hyphens.",
      },
      { status: 400 }
    );
  }

  const availability = await getRegistrationAvailability({ username });

  return NextResponse.json({
    field,
    available: !availability.usernameTaken,
    duplicate: availability.usernameTaken,
    normalizedValue: username,
  });
}