"use client";

import "../globals.css";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthContext";
import AdminIdleSessionManager from "./AdminIdleSessionManager";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiChevronDown,
  FiCompass,
  FiFileText,
  FiFilm,
  FiFolder,
  FiHelpCircle,
  FiInfo,
  FiLock,
  FiRepeat,
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
  FiSun,
} from "react-icons/fi";
import { FaFacebookF } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import PrivacyFooterLink from "./PrivacyFooterLink";
import TermsFooterLink from "./TermsFooterLink";

const socialLinks = [
  {
    href: "https://www.facebook.com/NationalSnookerLeague",
    label: "NSL on Facebook",
    platform: "facebook",
  },
  {
    href: "https://www.youtube.com/@NSLTV-Snooker",
    label: "NSL on YouTube",
    platform: "youtube",
  },
] as const;

function YoutubeBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#FF0033"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8Z"
      />
      <path fill="#FFFFFF" d="M9.75 8.4 16.2 12l-6.45 3.6V8.4Z" />
    </svg>
  );
}

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

type NavigationMode = "admin" | "personal" | "public";

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
  { href: "/admin/privacy", label: "Privacy", icon: FiLock },
  { href: "/admin/terms", label: "Terms", icon: FiFileText },
  { href: "/admin/documents", label: "Documents", icon: FiFolder },
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
  { href: "/my-tournaments", label: "My Tournaments", icon: FiAward, requiresLinkedPlayer: true },
  { href: "/my-matches", label: "My matches", icon: FiActivity, requiresLinkedPlayer: true },
  { href: "/profile", label: "Profile", icon: FiUser },
  { href: "/settings", label: "Change Password", icon: FiSettings },
];

const publicSidebarItems: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/matches", label: "Match Hub", icon: FiActivity },
  { href: "/competitions", label: "Competitions", icon: FiAward },
  { href: "/venues", label: "Venues", icon: FiMapPin },
  { href: "/rankings", label: "Rankings", icon: FiBarChart2 },
];

function resolveNavigationMode(
  isAdminRoute: boolean,
  isAdmin: boolean,
  hasPersonalNavigation: boolean
): NavigationMode {
  if (isAdminRoute) {
    return "admin";
  }

  if (hasPersonalNavigation) {
    return "personal";
  }

  if (isAdmin) {
    return "admin";
  }

  return "public";
}

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/" || href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function LayoutChrome({
  children,
  isAdminRoute,
  mobileMenuOpen,
  setMobileMenuOpen,
  theme,
  onSetTheme,
}: {
  children: React.ReactNode;
  isAdminRoute: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  theme: "dark" | "light";
  onSetTheme: (theme: "dark" | "light") => void;
}) {
  const { currentUser, hasPermission, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavbarElevated, setIsNavbarElevated] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const isAdminUser = Boolean(currentUser?.isAdmin);
  const closeMenu = () => setMenuOpen(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const isPathActive = (href: string) => isNavigationItemActive(pathname, href);

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

  const hasPersonalNavigation = Boolean(currentUser) && visibleDropdownUserNavItems.length > 0;
  const canSwitchNavigationMode = isAdminUser && hasPersonalNavigation;
  const navigationMode = resolveNavigationMode(isAdminRoute, isAdminUser, hasPersonalNavigation);
  const showAdminNavigation = navigationMode === "admin";
  const playerHomeHref = currentUser?.linkedPlayerId ? "/dashboard" : "/profile";
  const navigationModeLabel =
    canSwitchNavigationMode && navigationMode === "admin"
      ? "Admin mode"
      : canSwitchNavigationMode && navigationMode === "personal"
        ? "Personal mode"
        : "Logged in";

  const visibleSidebarUserNavItems = hasPersonalNavigation ? visibleDropdownUserNavItems : [];
  const collapsedSidebarTitle = (label: string) => (isDesktopSidebarExpanded ? undefined : label);
  const collapsedNavigationSwitchHref = navigationMode === "admin" ? playerHomeHref : "/admin";
  const collapsedNavigationSwitchLabel = navigationMode === "admin" ? "Switch to personal area" : "Switch to admin area";

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setMenuOpen(false);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [pathname, mobileMenuOpen]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const animationFrame = window.requestAnimationFrame(() => {
      setIsNavbarElevated(Boolean(mainRef.current && mainRef.current.scrollTop > 10));
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [pathname]);

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
    <div className={`layout${isDesktopSidebarExpanded ? " layout-sidebar-expanded" : ""}`}>
      <button
        type="button"
        className={`mobile-menu-button${mobileMenuOpen ? " is-open" : ""}`}
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

      <aside
        className={`sidebar${mobileMenuOpen ? " sidebar-open" : ""}`}
        onMouseEnter={() => setIsDesktopSidebarExpanded(true)}
        onMouseLeave={() => setIsDesktopSidebarExpanded(false)}
      >
        <div className="sidebar-logo">
          <Link href={showAdminNavigation ? "/admin" : "/"} onClick={closeMobileMenu}>
            <Image
              src="/images/nsl-logo-small.png"
              alt=""
              width={36}
              height={36}
              className="sidebar-logo-badge"
              aria-hidden="true"
            />
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

        {canSwitchNavigationMode ? (
          <div className="sidebar-navigation-switcher">
            <div
              className="sidebar-control-group sidebar-mode-switcher"
              role="group"
              aria-label="Navigation mode"
              data-selected={navigationMode === "admin" ? "left" : "right"}
            >
              <span className="sidebar-control-active-pill" aria-hidden="true" />
              <Link
                href="/admin"
                className={`sidebar-control-option${navigationMode === "admin" ? " sidebar-control-option-active" : ""}`}
                onClick={closeMobileMenu}
              >
                <FiCompass className="sidebar-control-icon" />
                <span>Admin</span>
              </Link>
              <Link
                href={playerHomeHref}
                className={`sidebar-control-option${navigationMode === "personal" ? " sidebar-control-option-active" : ""}`}
                onClick={closeMobileMenu}
              >
                <FiUser className="sidebar-control-icon" />
                <span>Personal</span>
              </Link>
            </div>

            <Link
              href={collapsedNavigationSwitchHref}
              className="sidebar-control-collapsed"
              title={collapsedNavigationSwitchLabel}
              onClick={closeMobileMenu}
            >
              <FiRepeat className="sidebar-control-icon" />
            </Link>
          </div>
        ) : null}

        <nav
          className="sidebar-nav"
          aria-label={
            showAdminNavigation ? "Admin navigation" : hasPersonalNavigation ? "Personal navigation" : "Sidebar navigation"
          }
        >
          {showAdminNavigation ? (
            <ul>
              {visibleSidebarItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`sidebar-item${isPathActive(item.href) ? " sidebar-item-active" : ""}`}
                      aria-current={isPathActive(item.href) ? "page" : undefined}
                      title={collapsedSidebarTitle(item.label)}
                      onClick={closeMobileMenu}
                    >
                      <Icon className="sidebar-icon" />
                      <span className="sidebar-label">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <>
              <ul>
                {publicSidebarItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`sidebar-item${isPathActive(item.href) ? " sidebar-item-active" : ""}`}
                        aria-current={isPathActive(item.href) ? "page" : undefined}
                        title={collapsedSidebarTitle(item.label)}
                        onClick={closeMobileMenu}
                      >
                        <Icon className="sidebar-icon" />
                        <span className="sidebar-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {visibleSidebarUserNavItems.length > 0 ? (
                <>
                  <div className="sidebar-nav-divider" aria-hidden="true" />
                  <ul>
                    {visibleSidebarUserNavItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`sidebar-item${isPathActive(item.href) ? " sidebar-item-active" : ""}`}
                            aria-current={isPathActive(item.href) ? "page" : undefined}
                            title={collapsedSidebarTitle(item.label)}
                            onClick={closeMobileMenu}
                          >
                            <Icon className="sidebar-icon" />
                            <span className="sidebar-label">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle
            value={theme}
            onChange={onSetTheme}
            activePillColor="var(--theme-sidebar-bg)"
            className="sidebar-theme-switcher"
            ariaLabel="Theme mode"
          />

          <button
            type="button"
            className="sidebar-theme-collapsed"
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => onSetTheme(theme === "dark" ? "light" : "dark")}
          >
            <FiSun className="sidebar-control-icon" />
          </button>
        </div>
      </aside>

      <div
        ref={mainRef}
        className={`main${isAdminRoute ? " main-admin" : ""}`}
        onScroll={(event) => setIsNavbarElevated(event.currentTarget.scrollTop > 10)}
      >
        <nav className={`navbar${isNavbarElevated ? " navbar-elevated" : ""}`}>
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
            <div className="social-links" aria-label="Social links">
              {socialLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`social-nav-link social-link social-link-${item.platform}`}
                  aria-label={item.label}
                  title={item.label}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.platform === "youtube" ? (
                    <YoutubeBrandIcon className="social-link-icon social-link-icon-youtube" />
                  ) : (
                    <FaFacebookF size={16} className="social-link-icon social-link-icon-facebook" />
                  )}
                </a>
              ))}
            </div>

            {currentUser ? (
              <div className="admin-user-menu-shell" ref={userMenuRef}>
                <button
                  type="button"
                  className={`admin-current-user-chip admin-user-menu-trigger${menuOpen ? " admin-user-menu-trigger-open" : ""}`}
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <FiLogOut size={18} className="login-icon" />
                  <div className="admin-current-user-copy">
                    <span className="admin-current-user-name">{currentUser.displayName}</span>
                    <span className="admin-current-user-meta">{navigationModeLabel}</span>
                  </div>
                  <FiChevronDown className="admin-user-menu-chevron" />
                </button>

                {menuOpen ? (
                  <div className="admin-user-menu-dropdown" role="menu">
                    {canSwitchNavigationMode ? (
                      <>
                        <span className="admin-user-menu-section-label">Switch view</span>
                        <Link
                          href="/admin"
                          className="admin-user-menu-item"
                          role="menuitem"
                          onClick={closeMenu}
                        >
                          Open admin navigation
                        </Link>
                        <Link
                          href={playerHomeHref}
                          className="admin-user-menu-item"
                          role="menuitem"
                          onClick={closeMenu}
                        >
                          Open personal area
                        </Link>
                        <div className="admin-user-menu-separator" />
                      </>
                    ) : null}

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
              <Link
                href="/login"
                className={`login-link${isPathActive("/login") ? " login-link-active" : ""}`}
                aria-current={isPathActive("/login") ? "page" : undefined}
              >
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
              <PrivacyFooterLink />
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
    const animationFrame = window.requestAnimationFrame(() => {
      setMobileMenuOpen(false);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [pathname, setMobileMenuOpen]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("nsl-theme");
    const animationFrame = window.requestAnimationFrame(() => {
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }
    });

    return () => window.cancelAnimationFrame(animationFrame);
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
        onSetTheme={setTheme}
      >
        {children}
      </LayoutChrome>
    </AdminAuthProvider>
  );
}