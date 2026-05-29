import type { SVGProps } from "react";

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M14 3v11.2a4.2 4.2 0 1 1-3.4-4.12" />
      <path d="M14 3c.45 3.1 2.25 5.1 5 5.6" />
    </svg>
  );
}
