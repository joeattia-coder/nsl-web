import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TERMS_CONTENT_HTML,
  DEFAULT_TERMS_TITLE,
  isTermsTableMissingError,
} from "@/lib/terms";
import TermsForm, { type TermsVersionRow } from "./terms-form";
import TermsHistoryTable from "./terms-history-table";

export const dynamic = "force-dynamic";

const adminTermsDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export default async function AdminTermsPage() {
  let versions: Array<{
    id: string;
    title: string;
    contentHtml: string;
    contentJson: unknown;
    publishedAt: Date;
    createdAt: Date;
  }> = [];

  try {
    versions = await prisma.termsOfServiceVersion.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        contentHtml: true,
        contentJson: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (!isTermsTableMissingError(error)) {
      throw error;
    }
  }

  const latest = versions[0] ?? null;

  const rows: TermsVersionRow[] = versions.map((version, index) => ({
    id: version.id,
    title: version.title,
    contentHtml: version.contentHtml,
    contentJson: version.contentJson,
    publishedAt: version.publishedAt.toISOString(),
    publishedAtLabel: adminTermsDateFormatter.format(version.publishedAt),
    createdAt: version.createdAt.toISOString(),
    createdAtLabel: adminTermsDateFormatter.format(version.createdAt),
    isLatest: index === 0,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Terms of Service</h1>
        <p className="admin-page-subtitle">
          Save new Terms versions, review revision history in date order, and delete older archived entries.
        </p>
      </div>

      <TermsForm
        initialTitle={latest?.title ?? DEFAULT_TERMS_TITLE}
        initialContentHtml={latest?.contentHtml ?? DEFAULT_TERMS_CONTENT_HTML}
        initialContentJson={latest?.contentJson ?? null}
      />

      <div className="mt-8">
        <div className="admin-players-header" style={{ marginBottom: "12px" }}>
          <h2 className="admin-page-title" style={{ fontSize: "1.25rem" }}>
            History
          </h2>
          <p className="admin-page-subtitle">
            Entries are sorted by most recent published date and only archived versions can be deleted.
          </p>
        </div>

        <TermsHistoryTable versions={rows} />
      </div>
    </section>
  );
}