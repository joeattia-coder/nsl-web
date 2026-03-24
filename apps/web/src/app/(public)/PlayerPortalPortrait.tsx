type PlayerPortalPortraitProps = {
  photoUrl?: string | null;
  alt: string;
  className?: string;
};

export default function PlayerPortalPortrait({
  photoUrl,
  alt,
  className = "",
}: PlayerPortalPortraitProps) {
  const resolvedPhotoUrl = photoUrl?.trim() || "";
  const frameClassName = className
    ? `player-portal-photo-frame ${className}`
    : "player-portal-photo-frame";

  return (
    <div className={frameClassName}>
      {resolvedPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolvedPhotoUrl} alt={alt} className="player-portal-photo-image" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/player_silhouette.svg"
          alt=""
          aria-hidden="true"
          className="player-portal-photo-silhouette"
        />
      )}
    </div>
  );
}