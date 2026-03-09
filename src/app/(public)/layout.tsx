"use client";

import "../globals.css";
import { FiActivity, FiAward, FiBarChart2, FiUser, FiHome, FiUsers, FiCalendar, FiMapPin, FiShield } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link href={isAdmin ? "/admin" : "/"}>
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

        <nav className="sidebar-nav" aria-label={isAdmin ? "Admin navigation" : "Sidebar navigation"}>
          <ul>
            {isAdmin ? (
              <>
                <li>
                  <Link href="/admin" className="sidebar-item">
                    <FiHome className="sidebar-icon" />
                    <span className="sidebar-label">Dashboard</span>
                  </Link>
                </li>

                <li>
                  <Link href="/admin/players" className="sidebar-item">
                    <FiUsers className="sidebar-icon" />
                    <span className="sidebar-label">Players</span>
                  </Link>
                </li>

                <li>
                  <Link href="/admin/tournaments" className="sidebar-item">
                    <FiAward className="sidebar-icon" />
                    <span className="sidebar-label">Tournaments</span>
                  </Link>
                </li>

                <li>
                  <Link href="/admin/matches" className="sidebar-item">
                    <FiActivity className="sidebar-icon" />
                    <span className="sidebar-label">Matches</span>
                  </Link>
                </li>

                <li>
                  <Link href="/admin/venues" className="sidebar-item">
                    <FiMapPin className="sidebar-icon" />
                    <span className="sidebar-label">Venues</span>
                  </Link>
                </li>

                <li>
                  <Link href="/admin/users" className="sidebar-item">
                    <FiShield className="sidebar-icon" />
                    <span className="sidebar-label">Users</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/match-hub" className="sidebar-item">
                    <FiActivity className="sidebar-icon" />
                    <span className="sidebar-label">Match Hub</span>
                  </Link>
                </li>

                <li>
                  <Link href="/competitions" className="sidebar-item">
                    <FiAward className="sidebar-icon" />
                    <span className="sidebar-label">Competitions</span>
                  </Link>
                </li>

                <li>
                  <Link href="/statistics" className="sidebar-item">
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