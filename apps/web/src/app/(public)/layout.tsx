"use client";

import "../globals.css";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthContext";
import AdminIdleSessionManager from "./AdminIdleSessionManager";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiChevronDown,
  FiFileText,
  FiFilm,
  FiHelpCircle,
  FiInfo,
  FiUser,
  FiLogOut,
  FiHome,
  FiUsers,
  FiMapPin,
  FiShield,
  FiMenu,
  FiX,
  FiCalendar,
  FiSettings,
} from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import TermsFooterLink from "./TermsFooterLink";

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: string[];
};

type AdminTopLink = {
  href: string;
  label: string;
  permissions?: string[];
};

type UserNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresLinkedPlayer?: boolean;
};

const adminSidebarItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: FiHome },
  { href: "/admin/leagues", label: "Leagues", icon: FiBarChart2 },
  { href: "/admin/seasons", label: "Seasons", icon: FiCalendar },
  { href: "/admin/venues", label: "Venues", icon: FiMapPin },
  { href: "/admin/tournaments", label: "Tournaments", icon: FiAward },
  { href: "/admin/players", label: "Players", icon: FiUsers },
  { href: "/admin/matches", label: "Matches", icon: FiActivity },
  { href: "/admin/news", label: "News", icon: FiFileText },
  { href: "/admin/about", label: "About", icon: FiInfo },
  { href: "/admin/terms", label: "Terms", icon: FiFileText },
  { href: "/admin/documents", label: "Documents", icon: FiFileText },
  { href: "/admin/faqs", label: "FAQs", icon: FiHelpCircle },
  { href: "/admin/videos", label: "Videos", icon: FiFilm },
  {
    href: "/admin/security",
    label: "Security",
    icon: FiShield,
    permissions: ["users.view", "roles.view", "permissions.view"],
  },
];

const adminTopLinks: AdminTopLink[] = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/rankings", label: "Rankings" },
  { href: "/documents", label: "Documents" },
  { href: "/faqs", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const loggedInUserNavItems: UserNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: FiHome, requiresLinkedPlayer: true },
  { href: "/my-matches", label: "My matches", icon: FiActivity, requiresLinkedPlayer: true },
  { href: "/profile", label: "Profile", icon: FiUser },
  { href: "/settings", label: "Settings", icon: FiSettings },
];

function LayoutChrome({
  children,
  isAdminRoute,
  mobileMenuOpen,
  setMobileMenuOpen,
  theme,
  onToggleTheme,
}: {
  children: React.ReactNode;
  isAdminRoute: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const { currentUser, hasPermission, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const showAdminNavigation = isAdminRoute || Boolean(currentUser?.isAdmin);
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

  const visibleDropdownUserNavItems = currentUser
    ? loggedInUserNavItems.filter((item) => !item.requiresLinkedPlayer || Boolean(currentUser.linkedPlayerId))
    : [];

  const visibleSidebarUserNavItems = currentUser?.isPlayer ? visibleDropdownUserNavItems : [];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, mobileMenuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (userMenuRef.current?.contains(target)) {
        return;
      }

      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      closeMenu();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

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
          <Link href={isAdminRoute ? "/admin" : "/"} onClick={closeMobileMenu}>
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

                {visibleSidebarUserNavItems.map((item) => {
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
                    href="/matches"
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
                    href="/venues"
                    className="sidebar-item"
                    onClick={closeMobileMenu}
                  >
                    <FiMapPin className="sidebar-icon" />
                    <span className="sidebar-label">Venues</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/rankings"
                    className="sidebar-item"
                    onClick={closeMobileMenu}
                  >
                    <FiBarChart2 className="sidebar-icon" />
                    <span className="sidebar-label">Rankings</span>
                  </Link>
                </li>

                {visibleSidebarUserNavItems.map((item) => {
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
            )}
          </ul>
        </nav>
      </aside>

      <div className={`main${isAdminRoute ? " main-admin" : ""}`}>
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
                <Link href="/news">News</Link>
                <Link href="/rankings">Rankings</Link>
                <Link href="/documents">Documents</Link>
                <Link href="/faqs">FAQ</Link>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
              </>
            )}
          </div>

          <div className="navbar-right">
            <button
              type="button"
              className="theme-toggle-button"
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            {currentUser ? (
              <div className="admin-user-menu-shell" ref={userMenuRef}>
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
                    {visibleDropdownUserNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="admin-user-menu-item"
                        role="menuitem"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    ))}
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

        <div className="main-content">{children}</div>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-copy">
              <span className="site-footer-brand">National Snooker League</span>
              <span className="site-footer-separator" aria-hidden="true">
                /
              </span>
              <span className="site-footer-meta">Official league information and policies</span>
            </div>

            <div className="site-footer-links">
              <TermsFooterLink />
            </div>
          </div>
        </footer>
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("nsl-theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }

    setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("nsl-theme", theme);
  }, [theme]);

  return (
    <AdminAuthProvider enabled>
      <AdminIdleSessionManager />
      <LayoutChrome
        isAdminRoute={isAdminRoute}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
      >
        {children}
      </LayoutChrome>
    </AdminAuthProvider>
  );
}