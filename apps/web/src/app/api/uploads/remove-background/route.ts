import { NextResponse } from "next/server";

/**
 * Background removal API route
 * Accepts an image file and uses remove.bg API to remove the background
 * Returns the image data as base64 with transparent background
 *
 * Environment variables required:
 * - REMOVE_BG_API_KEY: API key from remove.bg
 */

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

export async function POST(request: Request) {
  try {
    if (!REMOVE_BG_API_KEY) {
      return NextResponse.json(
        {
          error: "Background removal service not configured. Set REMOVE_BG_API_KEY environment variable.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Convert file to buffer for remove.bg API
    const buffer = await file.arrayBuffer();

    // Call remove.bg API
    const removeFormData = new FormData();
    removeFormData.append("image_file", new Blob([buffer], { type: file.type }));
    removeFormData.append("format", "png"); // Transparent PNG with background removed
    removeFormData.append("type", "auto");

    const removeResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: removeFormData,
    });

    if (!removeResponse.ok) {
      const error = await removeResponse.text();
      console.error("remove.bg API error:", error);
      return NextResponse.json(
        {
          error: "Failed to remove background. Please try again.",
          details: process.env.NODE_ENV === "development" ? error : undefined,
        },
        { status: 500 }
      );
    }

    // Get the processed image as a buffer
    const processedBuffer = await removeResponse.arrayBuffer();

    // Convert to base64 for sending to client
    const base64 = Buffer.from(processedBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      dataUrl, // Client can use this as an img src or canvas source
      mimeType: "image/png",
    });
  } catch (error) {
    console.error("Background removal error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
