import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "documents.view") && !hasAdminPermission(currentUser, "news.view")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("GET /api/documents/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "documents.edit") && !hasAdminPermission(currentUser, "news.edit")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
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

    const updated = await prisma.document.update({
      where: { id },
      data: {
        title,
        fileUrl,
        fileName: fileName || null,
        mimeType: mimeType || null,
        sizeBytes,
        showOnPublicDocumentsPage,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/documents/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "documents.delete") && !hasAdminPermission(currentUser, "news.delete")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
