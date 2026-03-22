const CONNECTOR_OFFSET = 32;

type BracketConnectorProps = {
  connectorAnchorY: number;
  connectorSpan: number;
  isLastRound: boolean;
  matchIndex: number;
};

export function BracketConnector({ connectorAnchorY, connectorSpan, isLastRound, matchIndex }: BracketConnectorProps) {
  if (isLastRound) {
    return null;
  }

  const isTopMatchInPair = matchIndex % 2 === 0;
  const centerY = connectorSpan / 2;
  const branchY = isTopMatchInPair ? connectorSpan : 0;
  const stemTop = Math.min(centerY, branchY);
  const stemHeight = Math.abs(branchY - centerY);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-full top-0"
      style={{
        width: `${CONNECTOR_OFFSET * 2}px`,
        height: `${connectorSpan}px`,
        top: `${connectorAnchorY}px`,
        transform: `translateY(-${centerY}px)`,
      }}
    >
      {/* The top match in each pair draws the carry line into the next round; both matches draw into the shared stem. */}
      <span
        className="absolute left-0 h-px"
        style={{ top: `${centerY}px`, width: `${CONNECTOR_OFFSET}px`, backgroundColor: "var(--theme-border-soft)" }}
      />

      <span
        className="absolute"
        style={{
          backgroundColor: "var(--theme-border-soft)",
          left: `${CONNECTOR_OFFSET}px`,
          top: `${stemTop}px`,
          width: "1px",
          height: `${stemHeight}px`,
        }}
      />

      {isTopMatchInPair ? (
        <span
          className="absolute h-px"
          style={{
            backgroundColor: "var(--theme-border-soft)",
            left: `${CONNECTOR_OFFSET}px`,
            top: `${branchY}px`,
            width: `${CONNECTOR_OFFSET}px`,
          }}
        />
      ) : null}
    </div>
  );
}