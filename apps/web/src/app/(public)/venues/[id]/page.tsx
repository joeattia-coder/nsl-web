import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiMapPin, FiPhone, FiShield } from "react-icons/fi";
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
        <header className={styles.venueHeader}>
          <Link href="/venues" className={styles.backLink}>
            Back to Venues
          </Link>

          <div className={styles.venueHeaderMain}>
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
              <p className={styles.venueEyebrow}>NSL Venue</p>
              <h1 className={styles.venueTitle}>{venue.venueName}</h1>
              <p className={styles.venueSubtitle}>Venue details, contact information, and map location.</p>
            </div>
          </div>

          <div className={styles.venueSummaryPanel}>
            <div className={styles.venueSummaryBadge}>
              <FiShield aria-hidden="true" />
              <span>Venue Profile</span>
            </div>
            <p className={styles.venueSummaryLead}>
              Use this page to confirm the location, contact details, and map placement for this venue before visiting or referencing it in league activity.
            </p>
          </div>
        </header>

        <div className={styles.venueContentGrid}>
          <div className={styles.venueDetailsColumn}>

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
              <div className={styles.detailMetaRow}>
                <span className={styles.detailBadge}>
                  <FiMapPin aria-hidden="true" />
                  <span>Location</span>
                </span>
              </div>
          </div>

          {venue.phoneNumber ? (
            <div className={styles.venueCard}>
              <h2 className={styles.sectionTitle}>Phone</h2>
                <p className={styles.detailText}>{venue.phoneNumber}</p>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailBadge}>
                    <FiPhone aria-hidden="true" />
                    <span>Direct Contact</span>
                  </span>
                </div>
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
        </div>
      </section>
    </main>
  );
}
