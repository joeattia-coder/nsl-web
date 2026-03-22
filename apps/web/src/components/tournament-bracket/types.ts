export type BracketPlayer = {
  id: string;
  name: string;
  seed?: number;
  flagCode?: string;
  score?: number | null;
  isWinner?: boolean;
};

export type BracketMatch = {
  id: string;
  matchNumber?: number;
  scheduledAt?: string;
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
};

export type BracketRound = {
  id: string;
  name: string;
  matches: BracketMatch[];
};

export type KnockoutBracketProps = {
  rounds: BracketRound[];
  title?: string;
  subtitle?: string;
  className?: string;
  onMatchClick?: (match: BracketMatch) => void;
  getMatchHref?: (match: BracketMatch) => string | undefined;
};
