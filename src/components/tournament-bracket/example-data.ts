import type { BracketRoundData } from "./types";

export const demoBracketRounds: BracketRoundData[] = [
  {
    name: "Quarterfinals",
    matches: [
      {
        player1: { name: "John", score: 3, isWinner: true },
        player2: { name: "Mark", score: 1 },
      },
      {
        player1: { name: "Luke", score: 2 },
        player2: { name: "James", score: 3, isWinner: true },
      },
      {
        player1: { name: "Chris", score: 3, isWinner: true },
        player2: { name: "Alex", score: 0 },
      },
      {
        player1: { name: "Noah", score: 1 },
        player2: { name: "Ryan", score: 3, isWinner: true },
      },
    ],
  },
  {
    name: "Semifinals",
    matches: [
      {
        player1: { name: "John", score: 3, isWinner: true },
        player2: { name: "James", score: 2 },
      },
      {
        player1: { name: "Chris", score: 1 },
        player2: { name: "Ryan", score: 3, isWinner: true },
      },
    ],
  },
  {
    name: "Final",
    matches: [
      {
        player1: { name: "John", score: 4, isWinner: true },
        player2: { name: "Ryan", score: 2 },
      },
    ],
  },
];
