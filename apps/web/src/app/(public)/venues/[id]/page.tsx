import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVenueAddressLines, getVenueMapEmbedUrl } from "@/lib/public-venues";
import styles from "./VenueDetailPage.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VenueDetailPage({ params }: PageProps) {
  const { id } = await params;

  const venue = await prisma.venue.findFirst({
    where: {
      id,
      isActive: true,
      showOnVenuesPage: true,
    },
    select: {
      id: true,
      venueName: true,
      logoUrl: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      stateProvince: true,
      country: true,
      postalCode: true,
      phoneNumber: true,
      mapLink: true,
    },
  });

  if (!venue) {
    notFound();
  }

  const addressLines = getVenueAddressLines(venue);
  const mapEmbedUrl = getVenueMapEmbedUrl(venue);

  return (
    <main className={styles.venuePage}>
      <section className={styles.venueLayout}>
        <div className={styles.venueDetailsColumn}>
          <header className={styles.venueHeader}>
            <div className={styles.venueLogoShell}>
              {venue.logoUrl ? (
                <Image
                  src={venue.logoUrl}
                  alt={`${venue.venueName} logo`}
                  width={180}
                  height={140}
                  className={styles.venueLogo}
                  unoptimized
                />
              ) : (
                <div className={styles.venueLogoFallback}>Venue</div>
              )}
            </div>

            <div className={styles.venueHeaderCopy}>
              <h1 className={styles.venueTitle}>{venue.venueName}</h1>
              <p className={styles.venueSubtitle}>Venue details and map location.</p>
            </div>
          </header>

          <div className={styles.venueCard}>
            <h2 className={styles.sectionTitle}>Address</h2>
            <div className={styles.addressBlock}>
              {addressLines.length > 0 ? (
                addressLines.map((line) => (
                  <p key={line} className={styles.addressLine}>
                    {line}
                  </p>
                ))
              ) : (
                <p className={styles.addressLine}>Address coming soon.</p>
              )}
            </div>
          </div>

          {venue.phoneNumber ? (
            <div className={styles.venueCard}>
              <h2 className={styles.sectionTitle}>Phone</h2>
              <p className={styles.detailText}>{venue.phoneNumber}</p>
            </div>
          ) : null}
        </div>

        <div className={styles.venueMapColumn}>
          <div className={styles.mapCard}>
            <h2 className={styles.sectionTitle}>Map</h2>
            {mapEmbedUrl ? (
              <iframe
                title={`${venue.venueName} map`}
                src={mapEmbedUrl}
                className={styles.mapFrame}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className={styles.mapEmpty}>
                Map preview is not available for this venue yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
