import type { BracketRound } from "./types";

export const demoBracketRounds: BracketRound[] = [
  {
    id: "quarterfinals",
    name: "Quarterfinals",
    matches: [
      {
        id: "qf-1",
        matchNumber: 1,
        scheduledAt: "2026-04-04T18:00:00.000Z",
        player1: { id: "john", name: "John Murphy", flagCode: "IE", score: 3, isWinner: true },
        player2: { id: "mark", name: "Mark Selby", flagCode: "GB", score: 1 },
      },
      {
        id: "qf-2",
        matchNumber: 2,
        scheduledAt: "2026-04-04T20:30:00.000Z",
        player1: { id: "luke", name: "Luke Brecel", flagCode: "BE", score: 2 },
        player2: { id: "james", name: "James Cahill", flagCode: "GB", score: 3, isWinner: true },
      },
      {
        id: "qf-3",
        matchNumber: 3,
        scheduledAt: "2026-04-05T18:00:00.000Z",
        player1: { id: "chris", name: "Chris Wakelin", flagCode: "GB", score: 3, isWinner: true },
        player2: { id: "alex", name: "Alex Borg", flagCode: "MT", score: 0 },
      },
      {
        id: "qf-4",
        matchNumber: 4,
        scheduledAt: "2026-04-05T20:30:00.000Z",
        player1: { id: "noah", name: "Noah Parker", flagCode: "CA", score: 1 },
        player2: { id: "ryan", name: "Ryan Day", flagCode: "GB", score: 3, isWinner: true },
      },
    ],
  },
  {
    id: "semifinals",
    name: "Semifinals",
    matches: [
      {
        id: "sf-1",
        matchNumber: 5,
        scheduledAt: "2026-04-11T18:00:00.000Z",
        player1: { id: "john", name: "John Murphy", flagCode: "IE", score: 3, isWinner: true },
        player2: { id: "james", name: "James Cahill", flagCode: "GB", score: 2 },
      },
      {
        id: "sf-2",
        matchNumber: 6,
        scheduledAt: "2026-04-11T20:30:00.000Z",
        player1: { id: "chris", name: "Chris Wakelin", flagCode: "GB", score: 1 },
        player2: { id: "ryan", name: "Ryan Day", flagCode: "GB", score: 3, isWinner: true },
      },
    ],
  },
  {
    id: "final",
    name: "Final",
    matches: [
      {
        id: "final-1",
        matchNumber: 7,
        scheduledAt: "2026-04-18T19:00:00.000Z",
        player1: { id: "john", name: "John Murphy", flagCode: "IE", score: 4, isWinner: true },
        player2: { id: "ryan", name: "Ryan Day", flagCode: "GB", score: 2 },
      },
    ],
  },
];
