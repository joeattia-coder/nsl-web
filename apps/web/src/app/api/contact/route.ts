import { NextResponse } from "next/server";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { sendContactEmail } from "@/lib/email";
import { validateHumanVerification } from "@/lib/human-verification";

const CONTACT_EMAIL = "info@nsl-tv.com";

type ContactRequestBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  details?: string;
  verificationToken?: string;
  verificationAnswer?: string;
  website?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as ContactRequestBody | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (String(body.website ?? "").trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const currentUser = await resolveCurrentUser();

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const details = String(body.details ?? "").trim();

    if (!firstName) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }

    if (!lastName) {
      return NextResponse.json({ error: "Last name is required." }, { status: 400 });
    }

    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (!details) {
      return NextResponse.json({ error: "Details are required." }, { status: 400 });
    }

    if (subject.length > 160) {
      return NextResponse.json({ error: "Subject must be 160 characters or fewer." }, { status: 400 });
    }

    if (details.length > 5000) {
      return NextResponse.json({ error: "Details must be 5000 characters or fewer." }, { status: 400 });
    }

    const verificationError = validateHumanVerification(
      String(body.verificationToken ?? ""),
      String(body.verificationAnswer ?? "")
    );

    if (verificationError) {
      return NextResponse.json({ error: verificationError }, { status: 400 });
    }

    await sendContactEmail({
      to: CONTACT_EMAIL,
      firstName,
      lastName,
      email,
      subject,
      details,
      replyTo: email,
      accountEmail: currentUser?.email ?? null,
      accountUsername: currentUser?.username ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to submit contact form:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send your message. Please try again later.",
      },
      { status: 500 }
    );
  }
}