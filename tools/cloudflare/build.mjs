#!/usr/bin/env node
/**
 * Cloudflare/OpenNext build with version-skew protection.
 *
 * Every deploy replaces the app's JS/CSS chunks. Without a deployment ID, a tab
 * opened before the deploy keeps navigating client-side with the old code and
 * fails when it requests chunks or page data that no longer exist (errors when
 * switching tabs). With NEXT_DEPLOYMENT_ID set, Next.js detects the version
 * mismatch on navigation and does a full reload instead. Vercel sets this
 * automatically; on Cloudflare we set it here, once per build, so every part of
 * the build shares the same value.
 *
 * An explicit NEXT_DEPLOYMENT_ID in the environment wins (for CI or reproducible builds).
 *
 * It also passes the NEXT_PUBLIC_* values from wrangler.jsonc "vars" into the
 * build. Wrangler vars only exist at runtime, but Next.js compiles NEXT_PUBLIC_*
 * values into the browser bundle at build time; without this, a deploy that
 * forgot to export them shipped a bundle without them (e.g. the shared Sylla
 * login cookie domain). Values already in the environment win.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Parse JSONC: drop comments outside strings and trailing commas. */
function parseJsonc(text) {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (ch === '\\') out += text[++i] ?? '';
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    } else if (ch === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
    } else {
      out += ch;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

function publicVarsFromWrangler() {
  const { vars = {} } = parseJsonc(
    readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'),
  );
  return Object.fromEntries(
    Object.entries(vars).filter(
      ([key, value]) => key.startsWith('NEXT_PUBLIC_') && typeof value === 'string',
    ),
  );
}

// Recursion guard: refuse to start a Cloudflare build from inside one (that
// shape once hung a Syllabus Sync deploy for ~27 minutes).
if (process.env.SS_CF_BUILD_ACTIVE === '1') {
  console.error('[cf:build] Recursive Cloudflare build detected; aborting.');
  process.exit(1);
}

function shortSha() {
  try {
    return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

const deploymentId =
  process.env.NEXT_DEPLOYMENT_ID?.trim() || `${shortSha()}-${Date.now().toString(36)}`;

// Sent as a header and a query parameter, so keep it URL- and header-safe.
if (!/^[A-Za-z0-9_-]{1,64}$/.test(deploymentId)) {
  console.error(`[cf:build] Invalid NEXT_DEPLOYMENT_ID: ${JSON.stringify(deploymentId)}`);
  process.exit(1);
}

console.log(`[cf:build] NEXT_DEPLOYMENT_ID=${deploymentId}`);

const fromWrangler = {};
for (const [key, value] of Object.entries(publicVarsFromWrangler())) {
  if (process.env[key] === undefined) fromWrangler[key] = value;
}
const passed = Object.keys(fromWrangler);
console.log(
  `[cf:build] NEXT_PUBLIC_* from wrangler.jsonc: ${passed.length ? passed.join(', ') : '(none; all set in env)'}`,
);

const buildEnv = { ...fromWrangler, ...process.env, NEXT_DEPLOYMENT_ID: deploymentId };

const result = spawnSync('npx', ['opennextjs-cloudflare', 'build'], {
  stdio: 'inherit',
  env: { ...buildEnv, SS_CF_BUILD_ACTIVE: '1' },
});

process.exit(result.status ?? 1);
