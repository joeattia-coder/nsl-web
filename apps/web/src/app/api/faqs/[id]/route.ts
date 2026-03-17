import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFaqPublished, parseFaqSortOrder, sanitizeFaqHtml } from "@/lib/faq";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const faq = await prisma.faqItem.findUnique({ where: { id } });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json(faq);
  } catch (error) {
    console.error("GET /api/faqs/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch FAQ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await prisma.faqItem.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const body = await request.json();
    const question = String(body.question ?? "").trim();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const faq = await prisma.faqItem.update({
      where: { id },
      data: {
        question,
        answerHtml: sanitizeFaqHtml(String(body.answerHtml ?? "")),
        answerJson: body.answerJson ?? null,
        sortOrder: parseFaqSortOrder(body.sortOrder),
        isPublished: parseFaqPublished(body.isPublished),
      },
    });

    return NextResponse.json(faq);
  } catch (error) {
    console.error("PUT /api/faqs/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update FAQ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.faqItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/faqs/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete FAQ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
