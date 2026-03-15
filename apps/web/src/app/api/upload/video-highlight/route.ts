import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error: "Blob storage is not configured",
          details: "Set BLOB_READ_WRITE_TOKEN before uploading videos.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only MP4, WebM, OGG, and MOV files are allowed." },
        { status: 400 }
      );
    }

    const extension = path.extname(file.name) || ".mp4";
    const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
    const pathname = `videos/${randomUUID()}-${safeName || `video${extension}`}`;

    const blob = await put(pathname, file, {
      access: "public",
      token,
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload video error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}