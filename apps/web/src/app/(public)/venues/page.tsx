import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVenueAddressLines } from "@/lib/public-venues";
import styles from "./VenuesPage.module.css";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const venues = await prisma.venue.findMany({
    where: {
      isActive: true,
      showOnVenuesPage: true,
    },
    orderBy: {
      venueName: "asc",
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
    },
  });

  return (
    <main className={styles.venuesPage}>
      <section className={styles.venuesSection}>
        <header className={styles.venuesHeader}>
          <h1 className={styles.venuesTitle}>Venues</h1>
          <p className={styles.venuesSubtitle}>
            Explore the clubs and locations hosting National Snooker League competition.
          </p>
        </header>

        {venues.length === 0 ? (
          <div className={styles.emptyState}>No venues are available right now.</div>
        ) : (
          <div className={styles.venuesGrid}>
            {venues.map((venue) => {
              const addressLines = getVenueAddressLines(venue);

              return (
                <Link key={venue.id} href={`/venues/${venue.id}`} className={styles.venueCard}>
                  <div className={styles.venueCardLogoShell}>
                    {venue.logoUrl ? (
                      <Image
                        src={venue.logoUrl}
                        alt={`${venue.venueName} logo`}
                        width={160}
                        height={120}
                        className={styles.venueCardLogo}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.venueCardLogoFallback}>Venue</div>
                    )}
                  </div>

                  <div className={styles.venueCardBody}>
                    <h2 className={styles.venueCardTitle}>{venue.venueName}</h2>
                    <div className={styles.venueCardAddress}>
                      {addressLines.length > 0 ? (
                        addressLines.map((line) => (
                          <p key={line} className={styles.venueCardAddressLine}>
                            {line}
                          </p>
                        ))
                      ) : (
                        <p className={styles.venueCardAddressLine}>Address coming soon.</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
