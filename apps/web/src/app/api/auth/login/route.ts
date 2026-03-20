import { NextResponse } from "next/server";
import {
  buildAdminSessionCookieValue,
  findUserForLogin,
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  getLoginSuccessPath,
} from "@/lib/admin-auth";
import { verifyPassword } from "@/lib/passwords";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");
    const requestedNextPath = String(body.nextPath ?? "").trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username or email and password are required." },
        { status: 400 }
      );
    }

    const user = await findUserForLogin(identifier);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      nextPath: getLoginSuccessPath(user.isAdmin, requestedNextPath),
    });
    response.cookies.set(
      getAdminSessionCookieName(),
      buildAdminSessionCookieValue(user.id),
      getAdminSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);

    return NextResponse.json(
      {
        error: "Failed to log in",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}