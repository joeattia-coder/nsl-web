import { prisma } from "@/lib/prisma";
import { publicApiJson, publicApiOptions } from "@/lib/public-api-response";

export function OPTIONS() {
  return publicApiOptions();
}

export async function GET() {
  try {
    const faqs = await prisma.faqItem.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        question: true,
        answerHtml: true,
        sortOrder: true,
        updatedAt: true,
      },
    });

    return publicApiJson({ faqs });
  } catch (error) {
    console.error("GET /api/public/faqs error:", error);

    return publicApiJson(
      {
        error: "Failed to fetch public FAQs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
