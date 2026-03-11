"use client";

import Link from "next/link";

type Props = {
  tournamentId: string;
  active: "details" | "stages" | "entries" | "matches";
};

export default function TournamentSubnav({
  tournamentId,
  active,
}: Props) {
  const links = [
    {
      key: "details" as const,
      label: "Details",
      href: `/admin/tournaments/${tournamentId}/edit`,
    },
    {
      key: "stages" as const,
      label: "Stages",
      href: `/admin/tournaments/${tournamentId}/stages`,
    },
    {
      key: "entries" as const,
      label: "Entries",
      href: `/admin/tournaments/${tournamentId}/entries`,
    },
    {
      key: "matches" as const,
      label: "Matches",
      href: `/admin/tournaments/${tournamentId}/matches`,
    },
  ];

  return (
    <div className="admin-tournament-subnav">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`admin-tournament-subnav-link ${
            active === link.key ? "is-active" : ""
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}