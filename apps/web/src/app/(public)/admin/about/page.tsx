import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ABOUT_CONTENT_HTML,
  DEFAULT_ABOUT_SUBTITLE,
  DEFAULT_ABOUT_TITLE,
  isAboutTableMissingError,
} from "@/lib/about";
import AboutForm, { type AboutVersionRow } from "./about-form";
import AboutHistoryTable from "./about-history-table";

export const dynamic = "force-dynamic";

const adminAboutDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export default async function AdminAboutPage() {
  let versions: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    contentHtml: string;
    contentJson: unknown;
    publishedAt: Date;
    createdAt: Date;
  }> = [];

  try {
    versions = await prisma.aboutSectionVersion.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        contentHtml: true,
        contentJson: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (!isAboutTableMissingError(error)) {
      throw error;
    }
  }

  const latest = versions[0] ?? null;

  const rows: AboutVersionRow[] = versions.map((version, index) => ({
    id: version.id,
    title: version.title,
    subtitle: version.subtitle,
    contentHtml: version.contentHtml,
    contentJson: version.contentJson,
    publishedAt: version.publishedAt.toISOString(),
    publishedAtLabel: adminAboutDateFormatter.format(version.publishedAt),
    createdAt: version.createdAt.toISOString(),
    createdAtLabel: adminAboutDateFormatter.format(version.createdAt),
    isLatest: index === 0,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">About</h1>
        <p className="admin-page-subtitle">
          Save new About page versions, review history in date order, and delete older archived entries.
        </p>
      </div>

      <AboutForm
        initialTitle={latest?.title ?? DEFAULT_ABOUT_TITLE}
        initialSubtitle={latest?.subtitle ?? DEFAULT_ABOUT_SUBTITLE}
        initialContentHtml={latest?.contentHtml ?? DEFAULT_ABOUT_CONTENT_HTML}
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

        <AboutHistoryTable versions={rows} />
      </div>
    </section>
  );
}