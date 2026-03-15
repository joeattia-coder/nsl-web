import { prisma } from "@/lib/prisma";
import VideosTable from "./videos-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const videos = await prisma.videoHighlight.findMany({
    orderBy: [{ carouselSortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      sourceType: true,
      showInCarousel: true,
      carouselSortOrder: true,
      updatedAt: true,
    },
  });

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Videos</h1>
        <p className="admin-page-subtitle">
          Manage homepage video highlights, source links, upload files, and carousel order.
        </p>
      </div>

      <VideosTable
        videos={videos.map((video) => ({
          ...video,
          updatedAt: video.updatedAt.toISOString(),
        }))}
      />
    </section>
  );
}