export type PlayerSide = "home" | "away";

export type SnookerBall = "red" | "yellow" | "green" | "brown" | "blue" | "pink" | "black";

export type SnookerFormat = "REDS_6" | "REDS_10" | "REDS_15";

export type RecordedBreak = {
  id: string;
  side: PlayerSide;
  points: number;
};

export type LiveBreak = {
  side: PlayerSide;
  points: number;
};

export type LiveFrameState = {
  frameNumber: number;
  homePoints: number;
  awayPoints: number;
  breaks: RecordedBreak[];
  currentBreak: LiveBreak | null;
  activeSide: PlayerSide;
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
  | { type: "pot"; side: PlayerSide; ball: SnookerBall }
  | { type: "foul"; side: PlayerSide; points: number }
  | { type: "endTurn" }
  | { type: "awardFrame"; side: PlayerSide }
  | { type: "startNextFrame" }
  | { type: "resetMatch"; nextState: MatchScoringState };