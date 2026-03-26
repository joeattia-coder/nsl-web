import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PRIVACY_CONTENT_HTML,
  DEFAULT_PRIVACY_TITLE,
  getPrivacyPolicyVersionDelegate,
  isPrivacyTableMissingError,
} from "@/lib/privacy";
import PrivacyForm, { type PrivacyVersionRow } from "./privacy-form";
import PrivacyHistoryTable from "./privacy-history-table";

export const dynamic = "force-dynamic";

const adminPrivacyDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export default async function AdminPrivacyPage() {
  let versions: Array<{
    id: string;
    title: string;
    contentHtml: string;
    contentJson: unknown;
    publishedAt: Date;
    createdAt: Date;
  }> = [];

  try {
    const privacyPolicyVersions = getPrivacyPolicyVersionDelegate(prisma);

    if (privacyPolicyVersions) {
      versions = await privacyPolicyVersions.findMany({
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
    }
  } catch (error) {
    if (!isPrivacyTableMissingError(error)) {
      throw error;
    }
  }

  const latest = versions[0] ?? null;

  const rows: PrivacyVersionRow[] = versions.map((version, index) => ({
    id: version.id,
    title: version.title,
    contentHtml: version.contentHtml,
    contentJson: version.contentJson,
    publishedAt: version.publishedAt.toISOString(),
    publishedAtLabel: adminPrivacyDateFormatter.format(version.publishedAt),
    createdAt: version.createdAt.toISOString(),
    createdAtLabel: adminPrivacyDateFormatter.format(version.createdAt),
    isLatest: index === 0,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Privacy Policy</h1>
        <p className="admin-page-subtitle">
          Save new Privacy Policy versions, review revision history in date order, and delete older archived entries.
        </p>
      </div>

      <PrivacyForm
        initialTitle={latest?.title ?? DEFAULT_PRIVACY_TITLE}
        initialContentHtml={latest?.contentHtml ?? DEFAULT_PRIVACY_CONTENT_HTML}
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

        <PrivacyHistoryTable versions={rows} />
      </div>
    </section>
  );
}