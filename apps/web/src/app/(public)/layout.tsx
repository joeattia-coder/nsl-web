"use client";

import "../globals.css";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthContext";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiChevronDown,
  FiFileText,
  FiFilm,
  FiHelpCircle,
  FiUser,
  FiLogOut,
  FiHome,
  FiUsers,
  FiMapPin,
  FiShield,
  FiMenu,
  FiX,
  FiCalendar,
} from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: string[];
};

const adminSidebarItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: FiHome },
  { href: "/admin/leagues", label: "Leagues", icon: FiBarChart2 },
  { href: "/admin/players", label: "Players", icon: FiUsers },
  { href: "/admin/seasons", label: "Seasons", icon: FiCalendar },
  { href: "/admin/tournaments", label: "Tournaments", icon: FiAward },
  { href: "/admin/matches", label: "Matches", icon: FiActivity },
  { href: "/admin/venues", label: "Venues", icon: FiMapPin },
  { href: "/admin/news", label: "News", icon: FiFileText },
  { href: "/admin/faqs", label: "FAQs", icon: FiHelpCircle },
  { href: "/admin/videos", label: "Videos", icon: FiFilm },
  {
    href: "/admin/security",
    label: "Security",
    icon: FiShield,
    permissions: ["users.view", "roles.view", "permissions.view"],
  },
];

const adminTopLinks = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/seasons", label: "Seasons" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/videos", label: "Videos" },
  {
    href: "/admin/security",
    label: "Security",
    permissions: ["users.view", "roles.view", "permissions.view"],
  },
];

function LayoutChrome({
  children,
  isAdminRoute,
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  children: React.ReactNode;
  isAdminRoute: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { currentUser, hasPermission, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const showAdminNavigation = isAdminRoute || Boolean(currentUser);
  const closeMenu = () => setMenuOpen(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const visibleSidebarItems = adminSidebarItems.filter((item) => {
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }

    return item.permissions.some((permission) => hasPermission(permission));
  });

  const visibleTopLinks = adminTopLinks.filter((item) => {
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }

    return item.permissions.some((permission) => hasPermission(permission));
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    closeMenu();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="layout">
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
        onClick={() => {
          closeMenu();
          setMobileMenuOpen((prev) => !prev);
        }}
      >
        {mobileMenuOpen ? <FiX /> : <FiMenu />}
      </button>

      <div
        className={`mobile-sidebar-overlay${mobileMenuOpen ? " is-open" : ""}`}
        onClick={closeMobileMenu}
      />

      <aside className={`sidebar${mobileMenuOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-logo">
          <Link href={showAdminNavigation ? "/admin" : "/"} onClick={closeMobileMenu}>
            <Image
              src="/images/nsl-logo.svg"
              alt="National Snooker League Logo"
              width={140}
              height={60}
              className="sidebar-logo-img"
              priority
            />
          </Link>
        </div>

        <nav
          className="sidebar-nav"
          aria-label={showAdminNavigation ? "Admin navigation" : "Sidebar navigation"}
        >
          <ul>
            {showAdminNavigation ? (
              <>
                {visibleSidebarItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="sidebar-item"
                        onClick={closeMobileMenu}
                      >
                        <Icon className="sidebar-icon" />
                        <span className="sidebar-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/match-hub"
                    className="sidebar-item"
                    onClick={closeMobileMenu}
                  >
                    <FiActivity className="sidebar-icon" />
                    <span className="sidebar-label">Match Hub</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/competitions"
                    className="sidebar-item"
                    onClick={closeMobileMenu}
                  >
                    <FiAward className="sidebar-icon" />
                    <span className="sidebar-label">Competitions</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/statistics"
                    className="sidebar-item"
                    onClick={closeMobileMenu}
                  >
                    <FiBarChart2 className="sidebar-icon" />
                    <span className="sidebar-label">Statistics</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>

      <div className="main">
        <nav className="navbar">
          <div className="nav-links">
            {showAdminNavigation ? (
              <>
                {visibleTopLinks.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link href="/">Home</Link>
                <Link href="/players">Players</Link>
                <Link href="/tournaments">Tournaments</Link>
                <Link href="/faqs">FAQs</Link>
                <Link href="/contact">Contact</Link>
              </>
            )}
          </div>

          <div className="navbar-right">
            {currentUser ? (
              <div className="admin-user-menu-shell">
                <button
                  type="button"
                  className="admin-current-user-chip admin-user-menu-trigger"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <FiLogOut size={18} className="login-icon" />
                  <div className="admin-current-user-copy">
                    <span className="admin-current-user-name">{currentUser.displayName}</span>
                    <span className="admin-current-user-meta">Logged in</span>
                  </div>
                  <FiChevronDown className="admin-user-menu-chevron" />
                </button>

                {menuOpen ? (
                  <div className="admin-user-menu-dropdown" role="menu">
                    <Link
                      href="/profile"
                      className="admin-user-menu-item"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="admin-user-menu-item"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      className="admin-user-menu-item admin-user-menu-item-danger"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/login" className="login-link">
                <FiUser size={28} className="login-icon" />
              </Link>
            )}
          </div>
        </nav>

        {children}
      </div>
    </div>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  return (
    <AdminAuthProvider enabled>
      <LayoutChrome
        isAdminRoute={isAdminRoute}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      >
        {children}
      </LayoutChrome>
    </AdminAuthProvider>
  );
}