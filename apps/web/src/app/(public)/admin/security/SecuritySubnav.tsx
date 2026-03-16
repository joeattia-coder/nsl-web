"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "../../AdminAuthContext";

const links = [
  {
    label: "Users",
    href: "/admin/security/users",
    permissions: ["users.view"],
  },
  {
    label: "Roles",
    href: "/admin/security/roles",
    permissions: ["roles.view"],
  },
  {
    label: "Permissions",
    href: "/admin/security/permissions",
    permissions: ["permissions.view"],
  },
  {
    label: "Assignments",
    href: "/admin/security/assignments",
    permissions: ["users.view", "roles.view"],
  },
];

export default function SecuritySubnav() {
  const pathname = usePathname();
  const { hasPermission } = useAdminAuth();

  const visibleLinks = links.filter((link) =>
    link.permissions.some((permission) => hasPermission(permission))
  );

  return (
    <nav className="admin-tournament-subnav" aria-label="Security sections">
      {visibleLinks.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-tournament-subnav-link ${
              isActive ? "is-active" : ""
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}