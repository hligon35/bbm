#!/usr/bin/env node
/*
  Local helper to create an invite token payload.

  This does NOT write to Cloudflare automatically.
  It prints a secure token and a `wrangler kv:key put` command you can run.

  Usage:
    node scripts/createScheduleInviteToken.mjs --email user@example.com --days 7

  Output:
    - token
    - JSON payload
    - KV put commands (both key formats supported by the Worker)
    - invite URL path
*/

import crypto from 'node:crypto';

function getArg(flag, fallback = null) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const email = String(getArg('--email', '')).trim();
const daysRaw = getArg('--days', '7');
const days = Number(daysRaw);

if (!email || !email.includes('@')) {
  console.error('Missing/invalid --email');
  process.exit(1);
}

if (!Number.isFinite(days) || days <= 0 || days > 365) {
  console.error('Invalid --days (1-365)');
  process.exit(1);
}

// 32 bytes => 256-bit token, base64url encoded
const token = crypto.randomBytes(32).toString('base64url');
const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

const payload = {
  token,
  email,
  expiresAt,
  used: false,
};

const json = JSON.stringify(payload);

console.log('Token:');
console.log(token);
console.log('');
console.log('KV JSON value:');
console.log(json);
console.log('');
console.log('Wrangler KV put (choose ONE key strategy):');
console.log('  Option A (recommended on Windows): write JSON to a file, then use --path (avoids quoting/BOM issues)');
console.log('  From repo root (PowerShell):');
console.log(`    $token = "${token}"`);
console.log(`    $json = '${json.replaceAll("'", "''")}'`);
console.log('    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)');
console.log('    $path = Join-Path $PWD "worker\\tmp-schedule-token.json"');
console.log('    [System.IO.File]::WriteAllText($path, $json, $utf8NoBom)');
console.log('    # Write to PRODUCTION namespace (when wrangler.toml has preview_id too):');
console.log('    wrangler kv key put $token --path $path --binding SCHEDULE_TOKENS --remote --preview false --cwd worker');
console.log('    # Or write using prefixed key format:');
console.log('    wrangler kv key put ("token:" + $token) --path $path --binding SCHEDULE_TOKENS --remote --preview false --cwd worker');
console.log('');
console.log('  Option B: inline value (works on some shells; can be fragile on Windows)');
console.log(`    (cd worker; wrangler kv key put "${token}" '${json}' --binding SCHEDULE_TOKENS --remote --preview false)`);
console.log(`    (cd worker; wrangler kv key put "token:${token}" '${json}' --binding SCHEDULE_TOKENS --remote --preview false)`);
console.log('');
console.log('Invite URL path:');
console.log('/schedule/' + token);

if (hasFlag('--demo')) {
  console.log('');
  console.log('NOTE: --demo flag is not used in production; it is only for local dev mode tokens (demo-...).');
}
