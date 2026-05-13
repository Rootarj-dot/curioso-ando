/**
 * AdSlot — Google AdSense ad unit component
 *
 * Usage:
 *   <AdSlot slotId="1234567890" format="auto" />
 *
 * Requirements:
 *   Set VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXXX in your .env
 *   AdSense script is loaded automatically by analytics.ts on app start.
 *
 * Slot IDs are created in your AdSense dashboard under "Ads > By ad unit".
 */

import { useEffect, useRef } from "react";

interface AdSlotProps {
  /** Ad unit slot ID from AdSense dashboard */
  slotId: string;
  /** Ad format: "auto" | "rectangle" | "vertical" | "horizontal" */
  format?: string;
  /** Additional CSS class names */
  className?: string;
  /** Whether to use full-width responsive */
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdSlot({
  slotId,
  format = "auto",
  className = "",
  fullWidthResponsive = true,
}: AdSlotProps) {
  const pubId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined;
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!pubId || !pubId.startsWith("ca-pub-")) return;
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet — safe to ignore
    }
  }, [pubId]);

  // Don't render if AdSense is not configured
  if (!pubId || !pubId.startsWith("ca-pub-")) {
    return null;
  }

  return (
    <div className={`ad-slot-wrapper ${className}`} aria-label="Publicidad">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={pubId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
