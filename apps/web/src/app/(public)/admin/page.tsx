import { prisma } from "@/lib/prisma";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFlag,
  FiMapPin,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-CA").format(value);
}

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-CA", { month: "short" });
}

function getDashboardMetricVisual(label: string): {
  icon: IconType;
  accentClassName: string;
} {
  const normalized = label.toLowerCase();

  if (normalized.includes("player") || normalized.includes("account") || normalized.includes("user")) {
    return {
      icon: FiUsers,
      accentClassName: "admin-dashboard-metric-accent-users",
    };
  }

  if (normalized.includes("league")) {
    return {
      icon: FiFlag,
      accentClassName: "admin-dashboard-metric-accent-leagues",
    };
  }

  if (normalized.includes("season")) {
    return {
      icon: FiCalendar,
      accentClassName: "admin-dashboard-metric-accent-seasons",
    };
  }

  if (normalized.includes("venue")) {
    return {
      icon: FiMapPin,
      accentClassName: "admin-dashboard-metric-accent-venues",
    };
  }

  if (normalized.includes("confirm") || normalized.includes("published")) {
    return {
      icon: FiEye,
      accentClassName: "admin-dashboard-metric-accent-published",
    };
  }

  if (normalized.includes("in progress") || normalized.includes("active") || normalized.includes("live")) {
    return {
      icon: FiActivity,
      accentClassName: "admin-dashboard-metric-accent-active",
    };
  }

  if (normalized.includes("tbc") || normalized.includes("without date")) {
    return {
      icon: FiClock,
      accentClassName: "admin-dashboard-metric-accent-attention",
    };
  }

  if (normalized.includes("tournament")) {
    return {
      icon: FiBarChart2,
      accentClassName: "admin-dashboard-metric-accent-tournaments",
    };
  }

  if (normalized.includes("match")) {
    return {
      icon: FiUserCheck,
      accentClassName: "admin-dashboard-metric-accent-matches",
    };
  }

  return {
    icon: FiCheckCircle,
    accentClassName: "admin-dashboard-metric-accent-default",
  };
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    playerCount,
    playersWithAccountsCount,
    leagueCount,
    tournamentCount,
    venueCount,
    matchCount,
    seasonCount,
    publishedTournamentCount,
    activeTournamentCount,
    completedMatchCount,
    inProgressMatchCount,
    confirmedMatchCount,
    matchStatusGroups,
    recentMatches,
    recentMatchCreates,
    draftTournamentCount,
    unpublishedTournamentCount,
    tbcMatchCount,
    unscheduledMatchCount,
    tournamentsForProgress,
    totalMatchesByTournament,
    completedMatchesByTournament,
  ] = await Promise.all([
    prisma.player.count(),
    prisma.player.count({
      where: {
        userId: {
          not: null,
        },
      },
    }),
    prisma.league.count(),
    prisma.tournament.count(),
    prisma.venue.count(),
    prisma.match.count(),
    prisma.season.count(),
    prisma.tournament.count({ where: { isPublished: true } }),
    prisma.tournament.count({ where: { status: "IN_PROGRESS" } }),
    prisma.match.count({ where: { matchStatus: "COMPLETED" } }),
    prisma.match.count({ where: { matchStatus: "IN_PROGRESS" } }),
    prisma.match.count({ where: { scheduleStatus: "CONFIRMED" } }),
    prisma.match.groupBy({
      by: ["matchStatus"],
      _count: {
        _all: true,
      },
    }),
    prisma.match.findMany({
      select: {
        id: true,
        createdAt: true,
        matchDate: true,
        matchTime: true,
        matchStatus: true,
        tournament: {
          select: {
            tournamentName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.match.findMany({
      where: {
        createdAt: {
          gte: trendStart,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.tournament.count({ where: { status: "DRAFT" } }),
    prisma.tournament.count({ where: { isPublished: false } }),
    prisma.match.count({ where: { scheduleStatus: "TBC" } }),
    prisma.match.count({ where: { matchDate: null } }),
    prisma.tournament.findMany({
      select: {
        id: true,
        tournamentName: true,
      },
      orderBy: [{ updatedAt: "desc" }, { tournamentName: "asc" }],
      take: 24,
    }),
    prisma.match.groupBy({
      by: ["tournamentId"],
      _count: {
        _all: true,
      },
    }),
    prisma.match.groupBy({
      by: ["tournamentId"],
      where: {
        matchStatus: "COMPLETED",
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const accountCoveragePercent =
    playerCount > 0 ? Math.round((playersWithAccountsCount / playerCount) * 100) : 0;

  const confirmedSchedulePercent =
    matchCount > 0 ? Math.round((confirmedMatchCount / matchCount) * 100) : 0;

  const snapshotMetrics = [
    { label: "Players", value: playerCount, hint: "Total player records", href: "/admin/players" },
    {
      label: "Player Accounts",
      value: playersWithAccountsCount,
      hint: `${accountCoveragePercent}% linked to user logins`,
      href: "/admin/security/users",
    },
    { label: "Leagues", value: leagueCount, hint: "Configured league entities", href: "/admin/leagues" },
    { label: "Tournaments", value: tournamentCount, hint: "All tournament records", href: "/admin/tournaments" },
    {
      label: "Published Tournaments",
      value: publishedTournamentCount,
      hint: "Visible in public channels",
      href: "/admin/tournaments",
    },
    {
      label: "Active Tournaments",
      value: activeTournamentCount,
      hint: "Currently in progress",
      href: "/admin/tournaments",
    },
    { label: "Venues", value: venueCount, hint: "Registered match venues", href: "/admin/venues" },
    { label: "Seasons", value: seasonCount, hint: "Season records in the system", href: "/admin/seasons" },
    { label: "Matches", value: matchCount, hint: "Scheduled and played matches", href: "/admin/matches" },
    {
      label: "Completed Matches",
      value: completedMatchCount,
      hint: "Results finalized",
      href: "/admin/matches",
    },
    {
      label: "Matches In Progress",
      value: inProgressMatchCount,
      hint: "Live in scoring workflow",
      href: "/admin/matches",
    },
    {
      label: "Schedule Confirmed",
      value: confirmedMatchCount,
      hint: `${confirmedSchedulePercent}% of all matches`,
      href: "/admin/matches",
    },
  ];

  const actionCards = [
    {
      label: "Draft Tournaments",
      value: draftTournamentCount,
      hint: "Need setup before opening registration",
      href: "/admin/tournaments",
    },
    {
      label: "Unpublished Tournaments",
      value: unpublishedTournamentCount,
      hint: "Not visible on public pages",
      href: "/admin/tournaments",
    },
    {
      label: "TBC Matches",
      value: tbcMatchCount,
      hint: "Schedule status still to be confirmed",
      href: "/admin/matches",
    },
    {
      label: "Matches Without Date",
      value: unscheduledMatchCount,
      hint: "No match date assigned",
      href: "/admin/matches",
    },
  ];

  const matchStatusRows = matchStatusGroups
    .map((group) => ({
      label: formatStatusLabel(group.matchStatus),
      value: group._count._all,
    }))
    .sort((a, b) => b.value - a.value);

  const maxMatchStatusValue = Math.max(1, ...matchStatusRows.map((item) => item.value));

  const totalMatchMap = new Map(totalMatchesByTournament.map((row) => [row.tournamentId, row._count._all]));
  const completedMatchMap = new Map(
    completedMatchesByTournament.map((row) => [row.tournamentId, row._count._all])
  );

  const tournamentProgressRows = tournamentsForProgress
    .map((tournament) => {
      const total = totalMatchMap.get(tournament.id) ?? 0;
      const completed = completedMatchMap.get(tournament.id) ?? 0;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: tournament.id,
        name: tournament.tournamentName,
        completed,
        total,
        progressPercent,
      };
    })
    .sort((a, b) => b.progressPercent - a.progressPercent || a.name.localeCompare(b.name));

  const monthBuckets: Array<{ key: string; label: string; value: number }> = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    monthBuckets.push({ key: monthKey(date), label: monthLabel(date), value: 0 });
  }

  const monthIndex = new Map(monthBuckets.map((bucket, index) => [bucket.key, index]));
  for (const match of recentMatchCreates) {
    const key = monthKey(match.createdAt);
    const index = monthIndex.get(key);
    if (index !== undefined) {
      monthBuckets[index].value += 1;
    }
  }

  const maxTrendValue = Math.max(1, ...monthBuckets.map((bucket) => bucket.value));

  const gaugeStyle = {
    "--gauge-pct": `${accountCoveragePercent}%`,
  } as CSSProperties;

  return (
    <section className="admin-page admin-dashboard-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome to the National Snooker League admin panel.
          </p>
        </div>
      </div>

      <div className="admin-dashboard-layout">
        <section className="admin-dashboard-panel admin-dashboard-panel-wide">
          <div className="admin-dashboard-panel-header">
            <h2 className="admin-dashboard-panel-title">System Snapshot</h2>
            <p className="admin-dashboard-panel-subtitle">Core data volume and operational KPIs</p>
          </div>

          <div className="admin-dashboard-metrics-grid">
            {snapshotMetrics.map((metric) => {
              const { icon: Icon, accentClassName } = getDashboardMetricVisual(metric.label);

              return (
                <Link
                  className={`admin-dashboard-metric-card admin-dashboard-metric-link ${accentClassName}`}
                  key={metric.label}
                  href={metric.href}
                >
                  <div className="admin-dashboard-metric-header">
                    <p className="admin-dashboard-metric-label">{metric.label}</p>
                    <span className="admin-dashboard-metric-icon" aria-hidden="true">
                      <Icon />
                    </span>
                  </div>
                  <p className="admin-dashboard-metric-value">{formatCount(metric.value)}</p>
                  <p className="admin-dashboard-metric-hint">{metric.hint}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h2 className="admin-dashboard-panel-title">Action Center</h2>
            <p className="admin-dashboard-panel-subtitle">Priority items that usually need admin follow-up</p>
          </div>

          <div className="admin-dashboard-action-grid">
            {actionCards.map((card) => {
              const { icon: Icon, accentClassName } = getDashboardMetricVisual(card.label);

              return (
                <Link className={`admin-dashboard-action-card ${accentClassName}`} href={card.href} key={card.label}>
                  <div className="admin-dashboard-metric-header">
                    <p className="admin-dashboard-metric-label">{card.label}</p>
                    <span className="admin-dashboard-metric-icon" aria-hidden="true">
                      <Icon />
                    </span>
                  </div>
                  <p className="admin-dashboard-metric-value">{formatCount(card.value)}</p>
                  <p className="admin-dashboard-metric-hint">{card.hint}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="admin-dashboard-panel admin-dashboard-panel-gauge">
          <div className="admin-dashboard-panel-header">
            <h2 className="admin-dashboard-panel-title">Account Coverage</h2>
            <p className="admin-dashboard-panel-subtitle">Players linked to user accounts</p>
          </div>

          <div className="admin-dashboard-gauge-wrap">
            <div className="admin-dashboard-gauge-ring" style={gaugeStyle}>
              <div className="admin-dashboard-gauge-center">
                <span className="admin-dashboard-gauge-percent">{accountCoveragePercent}%</span>
                <span className="admin-dashboard-gauge-label">Coverage</span>
              </div>
            </div>
            <p className="admin-dashboard-gauge-meta">
              {formatCount(playersWithAccountsCount)} of {formatCount(playerCount)} players have accounts.
            </p>
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h2 className="admin-dashboard-panel-title">Match Status Breakdown</h2>
            <p className="admin-dashboard-panel-subtitle">Distribution by current match status</p>
          </div>

          <div className="admin-dashboard-bars">
            {matchStatusRows.map((row) => (
              <div className="admin-dashboard-bar-row" key={row.label}>
                <div className="admin-dashboard-bar-label-row">
                  <span>{row.label}</span>
                  <span>{formatCount(row.value)}</span>
                </div>
                <div className="admin-dashboard-bar-track">
                  <div
                    className="admin-dashboard-bar-fill"
                    style={{ width: `${Math.max(8, (row.value / maxMatchStatusValue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h2 className="admin-dashboard-panel-title">Tournament Progress</h2>
            <p className="admin-dashboard-panel-subtitle">Completed matches versus total matches in each tournament</p>
          </div>

          <div className="admin-dashboard-progress-list">
            {tournamentProgressRows.length === 0 ? (
              <p className="admin-dashboard-empty">No tournaments found.</p>
            ) : (
              tournamentProgressRows.map((row) => (
                <Link
                  key={row.id}
                  href={`/admin/tournaments/${row.id}/matches`}
                  className="admin-dashboard-progress-item"
                >
                  <div className="admin-dashboard-bar-label-row">
                    <span className="admin-dashboard-progress-name">{row.name}</span>
                    <span>
                      {row.progressPercent}% ({formatCount(row.completed)}/{formatCount(row.total)})
                    </span>
                  </div>
                  <div className="admin-dashboard-bar-track">
                    <div
                      className="admin-dashboard-bar-fill admin-dashboard-bar-fill-tournament"
                      style={{ width: `${row.progressPercent}%` }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h2 className="admin-dashboard-panel-title">Recent Match Creation Trend</h2>
            <p className="admin-dashboard-panel-subtitle">Last six months</p>
          </div>

          <div className="admin-dashboard-trend">
            {monthBuckets.map((bucket) => (
              <div className="admin-dashboard-trend-col" key={bucket.key}>
                <div className="admin-dashboard-trend-value">{bucket.value}</div>
                <div
                  className="admin-dashboard-trend-bar"
                  style={{ height: `${Math.max(8, (bucket.value / maxTrendValue) * 100)}%` }}
                />
                <div className="admin-dashboard-trend-label">{bucket.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h2 className="admin-dashboard-panel-title">Recent Match Activity</h2>
            <p className="admin-dashboard-panel-subtitle">Latest records created in the system</p>
          </div>

          <div className="admin-dashboard-activity-list">
            {recentMatches.length === 0 ? (
              <p className="admin-dashboard-empty">No matches found.</p>
            ) : (
              recentMatches.map((match) => (
                <article className="admin-dashboard-activity-item" key={match.id}>
                  <div>
                    <p className="admin-dashboard-activity-title">{match.tournament.tournamentName}</p>
                    <p className="admin-dashboard-activity-meta">
                      {formatStatusLabel(match.matchStatus)}
                      {match.matchDate ? ` • ${match.matchDate.toLocaleDateString("en-CA")}` : " • Date TBD"}
                      {match.matchTime ? ` ${match.matchTime}` : ""}
                    </p>
                  </div>
                  <span className="admin-dashboard-activity-created">
                    {match.createdAt.toLocaleDateString("en-CA")}
                  </span>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}