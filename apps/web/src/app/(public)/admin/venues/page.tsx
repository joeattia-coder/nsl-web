import { prisma } from "@/lib/prisma";
import VenuesTable from "./venues-table";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: [{ venueName: "asc" }],
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
      showOnVenuesPage: true,
      isActive: true,
    },
  });

  const formattedVenues = venues.map((venue) => ({
    id: venue.id,
    venueName: venue.venueName,
    logoUrl: venue.logoUrl ?? "",
    address: [
      venue.addressLine1,
      venue.addressLine2,
      venue.city,
      venue.stateProvince,
      venue.postalCode,
      venue.country,
    ]
      .filter(Boolean)
      .join(", "),
    phoneNumber: venue.phoneNumber ?? "",
    mapLink: venue.mapLink ?? "",
    showOnVenuesPage: venue.showOnVenuesPage,
    isActive: venue.isActive,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Venues</h1>
        <p className="admin-page-subtitle">
          Manage venue details, location information, and availability.
        </p>
      </div>

      <VenuesTable venues={formattedVenues} />
    </section>
  );
}