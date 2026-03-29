export type OverlayBreakBallColor = "red" | "yellow" | "green" | "brown" | "blue" | "pink" | "black";

export type OverlayBreakBall = {
  color: OverlayBreakBallColor;
  label?: string;
  isFreeBall?: boolean;
};

export type OverlayPlayerData = {
  name: string;
  flagUrl?: string | null;
  flagAlt?: string;
  score: number;
  currentBreak: number;
  breakSequence: OverlayBreakBall[];
};

export type OverlayStatus = "LIVE" | "INTERVAL" | "FINAL_FRAME" | "FINISHED" | "PREVIEW";

export type StreamScoreOverlayData = {
  leftPlayer: OverlayPlayerData;
  rightPlayer: OverlayPlayerData;
  frameScoreLeft: number;
  frameScoreRight: number;
  bestOf: number;
  activeSide: "left" | "right" | null;
  matchLabel?: string;
  tournamentLabel?: string;
  tableLabel?: string;
  sponsorLabel?: string;
  status?: OverlayStatus;
  showLiveBadge?: boolean;
};

export type StreamScoreOverlayProps = {
  data: StreamScoreOverlayData;
  compact?: boolean;
  breakDisplay?: "chips" | "text";
  accentColor?: string;
  className?: string;
};