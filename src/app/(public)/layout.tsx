"use client";

import "../globals.css";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiUser,
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
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="layout">
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        {mobileMenuOpen ? <FiX /> : <FiMenu />}
      </button>

      <div
        className={`mobile-sidebar-overlay${mobileMenuOpen ? " is-open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside className={`sidebar${mobileMenuOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-logo">
          <Link
            href={isAdmin ? "/admin" : "/"}
            onClick={() => setMobileMenuOpen(false)}
          >
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
          aria-label={isAdmin ? "Admin navigation" : "Sidebar navigation"}
        >
          <ul>
            {isAdmin ? (
              <>
                <li>
                  <Link
                    href="/admin"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiHome className="sidebar-icon" />
                    <span className="sidebar-label">Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/leagues"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiBarChart2 className="sidebar-icon" />
                    <span className="sidebar-label">Leagues</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/players"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiUsers className="sidebar-icon" />
                    <span className="sidebar-label">Players</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/seasons"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiCalendar className="sidebar-icon" />
                    <span className="sidebar-label">Seasons</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/tournaments"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiAward className="sidebar-icon" />
                    <span className="sidebar-label">Tournaments</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/matches"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiActivity className="sidebar-icon" />
                    <span className="sidebar-label">Matches</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/venues"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiMapPin className="sidebar-icon" />
                    <span className="sidebar-label">Venues</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/users"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiShield className="sidebar-icon" />
                    <span className="sidebar-label">Users</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/match-hub"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiActivity className="sidebar-icon" />
                    <span className="sidebar-label">Match Hub</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/competitions"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiAward className="sidebar-icon" />
                    <span className="sidebar-label">Competitions</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/statistics"
                    className="sidebar-item"
                    onClick={() => setMobileMenuOpen(false)}
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
            {isAdmin ? (
              <>
                <Link href="/admin">Admin Home</Link>
                <Link href="/admin/players">Players</Link>
                <Link href="/admin/seasons">Seasons</Link>
                <Link href="/admin/tournaments">Tournaments</Link>
                <Link href="/admin/matches">Matches</Link>
              </>
            ) : (
              <>
                <Link href="/">Home</Link>
                <Link href="/players">Players</Link>
                <Link href="/tournaments">Tournaments</Link>
                <Link href="/contact">Contact</Link>
              </>
            )}
          </div>

          <div className="navbar-right">
            {isAdmin ? (
              <Link href="/" className="login-link">
                <FiUser size={28} className="login-icon" />
              </Link>
            ) : (
              <a
                href="https://a.leaguerepublic.com/myaccount/login/index.html?lver=2"
                target="_blank"
                rel="noopener noreferrer"
                className="login-link"
              >
                <FiUser size={28} className="login-icon" />
              </a>
            )}
          </div>
        </nav>

        {children}
      </div>
    </div>
  );
}