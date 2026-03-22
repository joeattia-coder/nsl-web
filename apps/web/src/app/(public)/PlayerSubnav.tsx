"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiActivity, FiCalendar, FiSettings, FiUser } from "react-icons/fi";

const playerLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: FiActivity,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: FiUser,
  },
  {
    label: "My Matches",
    href: "/my-matches",
    icon: FiCalendar,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: FiSettings,
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PlayerSubnav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = playerLinks.find((link) => isActivePath(pathname, link.href))?.href ?? "/dashboard";

  return (
    <div className="player-subnav-wrap">
      <nav className="player-subnav-tabs" aria-label="Player sections">
        {playerLinks.map((link) => {
          const isActive = isActivePath(pathname, link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`player-subnav-tab ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="player-subnav-tab-icon" aria-hidden="true">
                <Icon />
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="player-subnav-mobile">
        <label className="player-subnav-mobile-label" htmlFor="player-subnav-select">
          Jump to player page
        </label>
        <select
          id="player-subnav-select"
          className="player-subnav-select"
          value={activeHref}
          onChange={(event) => router.push(event.target.value)}
        >
          {playerLinks.map((link) => (
            <option key={link.href} value={link.href}>
              {link.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}