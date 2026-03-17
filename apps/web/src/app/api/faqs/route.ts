import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFaqPublished, parseFaqSortOrder, sanitizeFaqHtml } from "@/lib/faq";

export async function GET() {
  try {
    const faqs = await prisma.faqItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("GET /api/faqs error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch FAQs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question = String(body.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const answerHtml = sanitizeFaqHtml(String(body.answerHtml ?? ""));
    const newSortOrder = parseFaqSortOrder(body.sortOrder);

    // Get the current max sort order to detect if we need to shift
    const maxExisting = await prisma.faqItem.aggregate({
      _max: { sortOrder: true },
    });

    const currentMax = maxExisting._max.sortOrder ?? -1;

    // If the new sort order is <= current max, shift all FAQs at that position up by 1
    if (newSortOrder <= currentMax) {
      await prisma.faqItem.updateMany({
        where: {
          sortOrder: {
            gte: newSortOrder,
          },
        },
        data: {
          sortOrder: {
            increment: 1,
          },
        },
      });
    }

    const faq = await prisma.faqItem.create({
      data: {
        question,
        answerHtml,
        answerJson: body.answerJson ?? null,
        sortOrder: newSortOrder,
        isPublished: parseFaqPublished(body.isPublished),
      },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error("POST /api/faqs error:", error);

    return NextResponse.json(
      {
        error: "Failed to create FAQ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
