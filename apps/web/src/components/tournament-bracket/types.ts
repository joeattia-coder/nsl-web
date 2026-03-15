export type BracketPlayer = {
  name: string;
  score?: number | string | null;
  isWinner?: boolean;
  isPlaceholder?: boolean;
};

export type BracketMatch = {
  id?: string;
  player1: BracketPlayer | string;
  player2: BracketPlayer | string;
  score1?: number | string | null;
  score2?: number | string | null;
};

export type BracketRoundData = {
  id?: string;
  name: string;
  matches: BracketMatch[];
};
