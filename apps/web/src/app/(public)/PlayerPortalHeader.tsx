import type { ReactNode } from "react";
import PlayerPortalPortrait from "./PlayerPortalPortrait";
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
  return (
    <div className="player-portal-header-block">
      <div className="player-dashboard-hero player-portal-header">
        <div className="player-dashboard-identity">
          <PlayerPortalPortrait
            photoUrl={avatarUrl}
            alt={typeof title === "string" ? title : avatarLabel}
            className="player-dashboard-avatar"
          />
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