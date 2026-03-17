import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "documents.view") && !hasAdminPermission(currentUser, "news.view")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const documents = await prisma.document.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("GET /api/documents error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "documents.create") && !hasAdminPermission(currentUser, "news.create")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const fileUrl = String(body.fileUrl ?? "").trim();
    const fileName = String(body.fileName ?? "").trim();
    const mimeType = String(body.mimeType ?? "").trim();
    const sizeCandidate = Number(body.sizeBytes);
    const sizeBytes = Number.isFinite(sizeCandidate) && sizeCandidate > 0 ? Math.round(sizeCandidate) : null;
    const showOnPublicDocumentsPage = Boolean(body.showOnPublicDocumentsPage);

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: "Title and uploaded document are required." },
        { status: 400 }
      );
    }

    const created = await prisma.document.create({
      data: {
        title,
        fileUrl,
        fileName: fileName || null,
        mimeType: mimeType || null,
        sizeBytes,
        showOnPublicDocumentsPage,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);

    return NextResponse.json(
      {
        error: "Failed to create document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
