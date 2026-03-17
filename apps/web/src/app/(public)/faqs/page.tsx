import { prisma } from "@/lib/prisma";
import FaqSearchPanel, { type PublicFaqItem } from "./FaqSearchPanel";

export const dynamic = "force-dynamic";

export default async function PublicFaqsPage() {
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

  const serializedFaqs: PublicFaqItem[] = faqs.map((faq) => ({
    ...faq,
    updatedAt: faq.updatedAt.toISOString(),
  }));

  return <FaqSearchPanel faqs={serializedFaqs} />;
}
