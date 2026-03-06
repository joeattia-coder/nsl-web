import "./globals.css";
import type { Metadata } from "next";
import { FiGrid, FiBarChart2, FiCalendar, FiPieChart, FiUser } from "react-icons/fi";
import Link from "next/link";

export const metadata: Metadata = {
  title: "National Snooker League",
  description: "Your professional snooker platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-logo">
  <Link href="/">
    <img
      src="/images/nsl-logo.svg"
      alt="National Snooker League Logo"
      className="sidebar-logo-img"
    />
  </Link>
</div>

            <ul className="sidebar-list">
              <li className="sidebar-item">
                <FiGrid size={28} />
                <span>Dashboard</span>
              </li>

              <li className="sidebar-item">
                <FiBarChart2 size={28} />
                <span>Rankings</span>
              </li>

              <li className="sidebar-item">
                <FiCalendar size={28} />
                <span>League</span>
              </li>

              <li className="sidebar-item">
                <FiPieChart size={28} />
                <span>Statistics</span>
              </li>
            </ul>
          </aside>

          {/* Main Area */}
          <div className="main">
            {/* Navbar */}
            <nav className="navbar">
              <div className="nav-links">
                <Link href="/">Home</Link>
                <Link href="/players">Players</Link>
                <Link href="/tournaments">Tournaments</Link>
                <Link href="/contact">Contact</Link>
              </div>

              <div className="navbar-right">
                <a
                  href="https://a.leaguerepublic.com/myaccount/login/index.html?lver=2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-link"
                >
                  <FiUser size={28} className="login-icon" />
                </a>
              </div>
            </nav>

            {/* Page content */}
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}