import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext adapter configuration for Cloudflare Workers.
 *
 * `buildCommand` is pinned to the plain `next build` script so OpenNext's
 * internal build can never recurse into the Cloudflare build (the same fix
 * Syllabus Sync needed; see its open-next.config.ts).
 *
 * No incremental cache: Sylla's pages are client-rendered and its API is
 * dynamic, so there is no ISR payload to persist.
 */
const config = {
  ...defineCloudflareConfig(),
  buildCommand: 'npm run build',
};

export default config;
