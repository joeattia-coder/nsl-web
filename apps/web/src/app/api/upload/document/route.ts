import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (
      !hasAdminPermission(currentUser, "documents.create") &&
      !hasAdminPermission(currentUser, "documents.edit") &&
      !hasAdminPermission(currentUser, "news.create") &&
      !hasAdminPermission(currentUser, "news.edit")
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and common office document formats are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 25 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeExt = path.extname(file.name || "").toLowerCase() || ".pdf";
    const fileName = `${randomUUID()}${safeExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/documents/${fileName}`,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (error) {
    console.error("Upload document error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
