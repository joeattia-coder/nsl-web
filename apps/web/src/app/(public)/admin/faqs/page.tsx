import { prisma } from "@/lib/prisma";
import FaqsTable from "./faqs-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const faqs = await prisma.faqItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      question: true,
      isPublished: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">FAQs</h1>
        <p className="admin-page-subtitle">
          Manage frequently asked questions with clear titles, rich answers, visibility, and sort order.
        </p>
      </div>

      <FaqsTable
        faqs={faqs.map((faq) => ({
          ...faq,
          updatedAt: faq.updatedAt.toISOString(),
        }))}
      />
    </section>
  );
}
