"use client";

import Link from "next/link";

type Props = {
  tournamentId: string;
  stageId: string;
  active: "rounds";
};

export default function StageSubnav({
  tournamentId,
  stageId,
  active,
}: Props) {
  const links = [
    {
      key: "rounds" as const,
      label: "Rounds",
      href: `/admin/tournaments/${tournamentId}/stages/${stageId}/rounds`,
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