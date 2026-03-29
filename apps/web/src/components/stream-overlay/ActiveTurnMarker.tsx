import styles from "./ActiveTurnMarker.module.css";

type ActiveTurnMarkerProps = {
  direction: "left" | "right";
  compact?: boolean;
};

export default function ActiveTurnMarker({ direction, compact = false }: ActiveTurnMarkerProps) {
  return <span className={[styles.marker, styles[direction], compact ? styles.compact : ""].join(" ")} aria-hidden="true" />;
}