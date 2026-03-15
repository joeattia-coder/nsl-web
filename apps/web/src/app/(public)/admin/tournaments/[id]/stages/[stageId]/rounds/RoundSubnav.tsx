"use client";

import Link from "next/link";

type Props = {
  tournamentId: string;
  stageId: string;
  roundId: string;
  active: "groups";
};

export default function RoundSubnav({
  tournamentId,
  stageId,
  roundId,
  active,
}: Props) {
  const links = [
    {
      key: "groups" as const,
      label: "Groups",
      href: `/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}/groups`,
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