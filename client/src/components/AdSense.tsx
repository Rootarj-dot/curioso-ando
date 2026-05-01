interface AdSlotProps {
  slot: "header" | "mid-content" | "sidebar";
  className?: string;
}

const SLOT_CONFIG = {
  header: { label: "Publicidad — Header (728×90)", height: 90, width: "100%" },
  "mid-content": { label: "Publicidad — Mid Content (336×280)", height: 280, width: 336 },
  sidebar: { label: "Publicidad — Sidebar (300×250)", height: 250, width: 300 },
};

/**
 * AdSense placeholder component.
 * Replace the inner content with the real AdSense <ins> tag once approved.
 *
 * Example real implementation:
 * <ins className="adsbygoogle"
 *   style={{ display: "block" }}
 *   data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
 *   data-ad-slot="XXXXXXXXXX"
 *   data-ad-format="auto"
 *   data-full-width-responsive="true" />
 */
export function AdSlot({ slot, className = "" }: AdSlotProps) {
  const config = SLOT_CONFIG[slot];

  return (
    <div
      className={`adsense-slot ${className}`}
      style={{
        width: config.width,
        height: config.height,
        maxWidth: "100%",
        margin: "0 auto",
      }}
    >
      <span>{config.label}</span>
    </div>
  );
}
