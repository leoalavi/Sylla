import type { NextConfig } from "next";

/**
 * Who may show Sylla inside a frame.
 *
 * Only /embed is frameable, and only by Syllabus Sync (its bottom-right Sylla
 * panel). Every other page refuses to be framed, which blocks clickjacking.
 * SYLLA_FRAME_ANCESTORS (space-separated origins) overrides the default.
 */
function embedFrameAncestors(): string {
  const configured = process.env.SYLLA_FRAME_ANCESTORS?.trim();
  if (configured) return configured;
  const origins = ["https://www.syllabus-sync.app", "https://syllabus-sync.app"];
  if (process.env.NODE_ENV !== "production") origins.push("http://localhost:3000");
  return origins.join(" ");
}

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!embed).*)",
        headers: [...baseHeaders, { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }],
      },
      {
        source: "/embed",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: `frame-ancestors 'self' ${embedFrameAncestors()}` },
        ],
      },
    ];
  },
};

export default nextConfig;
