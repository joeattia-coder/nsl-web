export type PlayerSide = "home" | "away";

export type SnookerBall = "red" | "yellow" | "green" | "brown" | "blue" | "pink" | "black";

export type SnookerFormat = "REDS_6" | "REDS_10" | "REDS_15";

export type ExpectedShot = "red" | "color" | "yellow" | "green" | "brown" | "blue" | "pink" | "black" | "none";

export type RecordedBreak = {
  id: string;
  side: PlayerSide;
  points: number;
  balls: SnookerBall[];
};

export type LiveBreak = {
  side: PlayerSide;
  points: number;
  balls: SnookerBall[];
};

export type LiveFrameState = {
  frameNumber: number;
  homePoints: number;
  awayPoints: number;
  breaks: RecordedBreak[];
  currentBreak: LiveBreak | null;
  activeSide: PlayerSide;
  redsRemaining: number;
  expectedShot: ExpectedShot;
  winnerSide: PlayerSide | null;
  isComplete: boolean;
};

export type MatchScoringState = {
  matchId: string;
  bestOfFrames: number;
  snookerFormat: SnookerFormat;
  startedAt: string;
  frames: LiveFrameState[];
  currentFrameIndex: number;
};

export type ScoringAction =
  | { type: "pot"; side: PlayerSide; ball: SnookerBall; scoredAs?: SnookerBall; isFreeBall?: boolean }
  | { type: "foul"; side: PlayerSide; points: number }
  | { type: "endTurn" }
  | { type: "awardFrame"; side: PlayerSide }
  | { type: "startNextFrame" }
  | { type: "resetMatch"; nextState: MatchScoringState };