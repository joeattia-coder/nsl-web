"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

type PublicPlayerBackButtonProps = {
  className?: string;
  fallbackHref?: string;
};

export default function PublicPlayerBackButton({
  className,
  fallbackHref = "/rankings",
}: PublicPlayerBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer;

      if (window.history.length > 1 && referrer) {
        try {
          const referrerUrl = new URL(referrer);

          if (referrerUrl.origin === window.location.origin) {
            router.back();
            return;
          }
        } catch {
          // Fall through to the internal fallback route.
        }
      }
    }

    router.push(fallbackHref);
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      <span className="player-subnav-tab-icon" aria-hidden="true">
        <FiArrowLeft />
      </span>
      <span>Back</span>
    </button>
  );
}