import type { StreamScoreOverlayData } from "@/components/stream-overlay/types";

export const mockOverlayData: StreamScoreOverlayData = {
  leftPlayer: {
    name: "Mark Allen",
    flagUrl: "https://flagcdn.com/w40/gb-nir.png",
    flagAlt: "Northern Ireland",
    score: 37,
    currentBreak: 37,
    breakSequence: [
      { color: "red" },
      { color: "black" },
      { color: "red" },
      { color: "pink" },
      { color: "red" },
      { color: "blue" },
    ],
  },
  rightPlayer: {
    name: "Judd Trump",
    flagUrl: "https://flagcdn.com/w40/gb-eng.png",
    flagAlt: "England",
    score: 8,
    currentBreak: 0,
    breakSequence: [],
  },
  frameScoreLeft: 5,
  frameScoreRight: 4,
  bestOf: 11,
  activeSide: "left",
  matchLabel: "Quarter Final",
  tournamentLabel: "National Snooker League",
  tableLabel: "Table 1",
  status: "LIVE",
  showLiveBadge: true,
};