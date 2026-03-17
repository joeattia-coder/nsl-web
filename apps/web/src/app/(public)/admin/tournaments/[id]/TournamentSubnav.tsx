"use client";

import Link from "next/link";

type Props = {
  tournamentId: string;
  active: "details" | "stages" | "rounds" | "groups" | "entries" | "matches";
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
      key: "rounds" as const,
      label: "Rounds",
      href: `/admin/tournaments/${tournamentId}/rounds`,
    },
    {
      key: "groups" as const,
      label: "Groups",
      href: `/admin/tournaments/${tournamentId}/groups`,
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
    <nav className="admin-tournament-subnav" aria-label="Tournament sections">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`admin-tournament-subnav-link ${
            active === link.key ? "is-active" : ""
          }`}
          aria-current={active === link.key ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}