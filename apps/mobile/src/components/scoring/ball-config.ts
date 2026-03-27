import type { SnookerBall, SnookerFormat } from "../../types/scoring";

export const snookerBallOrder: SnookerBall[] = ["red", "yellow", "green", "brown", "blue", "pink", "black"];

export const snookerBallMeta: Record<
  SnookerBall,
  {
    label: string;
    points: number;
    gradient: [string, string, string];
    shadow: string;
  }
> = {
  red: {
    label: "Red",
    points: 1,
    gradient: ["#ffb0bc", "#d61f42", "#6f081f"],
    shadow: "rgba(214, 31, 66, 0.62)",
  },
  yellow: {
    label: "Yellow",
    points: 2,
    gradient: ["#fff8c8", "#f0c93f", "#9a7100"],
    shadow: "rgba(240, 201, 63, 0.58)",
  },
  green: {
    label: "Green",
    points: 3,
    gradient: ["#b7ffd3", "#1fc77c", "#0d5b38"],
    shadow: "rgba(31, 199, 124, 0.56)",
  },
  brown: {
    label: "Brown",
    points: 4,
    gradient: ["#efc39f", "#9f6030", "#542a10"],
    shadow: "rgba(159, 96, 48, 0.58)",
  },
  blue: {
    label: "Blue",
    points: 5,
    gradient: ["#c8ecff", "#228dff", "#0b467f"],
    shadow: "rgba(34, 141, 255, 0.58)",
  },
  pink: {
    label: "Pink",
    points: 6,
    gradient: ["#ffe0ef", "#ff69b4", "#96285f"],
    shadow: "rgba(255, 105, 180, 0.56)",
  },
  black: {
    label: "Black",
    points: 7,
    gradient: ["#aeb8c9", "#2d3644", "#05080f"],
    shadow: "rgba(8, 12, 18, 0.82)",
  },
};

export const freeBallOptions = snookerBallOrder.filter((ball) => ball !== "red");

export function getTotalReds(snookerFormat: SnookerFormat) {
  switch (snookerFormat) {
    case "REDS_6":
      return 6;
    case "REDS_10":
      return 10;
    default:
      return 15;
  }
}