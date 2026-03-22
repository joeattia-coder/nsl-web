import type { ReactNode } from "react";
import PlayerSubnav from "./PlayerSubnav";

type PlayerPortalHeaderProps = {
  kicker: string;
  title: ReactNode;
  subtitle: ReactNode;
  avatarLabel: string;
  avatarUrl?: string | null;
  actions?: ReactNode;
};

export default function PlayerPortalHeader({
  kicker,
  title,
  subtitle,
  avatarLabel,
  avatarUrl,
  actions,
}: PlayerPortalHeaderProps) {
  const avatarText = avatarLabel.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="player-portal-header-block">
      <div className="player-dashboard-hero player-portal-header">
        <div className="player-dashboard-identity">
          <div className="player-dashboard-avatar">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={typeof title === "string" ? title : avatarLabel} />
            ) : (
              <span>{avatarText}</span>
            )}
          </div>
          <div className="login-page-copy player-portal-copy">
            <p className="login-page-kicker">{kicker}</p>
            <h1 className="login-page-title">{title}</h1>
            <p className="login-page-subtitle">{subtitle}</p>
          </div>
        </div>

        {actions ? <div className="player-dashboard-actions player-portal-actions">{actions}</div> : null}
      </div>

      <PlayerSubnav />
    </div>
  );
}