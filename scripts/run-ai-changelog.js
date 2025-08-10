#\!/usr/bin/env node
const { spawnSync } = require(node:child_process);
const { existsSync } = require(node:fs);

function run(cmd, args) {
  return spawnSync(cmd, args, { stdio: inherit });
}

// Try direct TypeScript execution
let result = run(node, [scripts/generate-ai-changelog.ts, ...process.argv.slice(2)]);
if (result.status === 0) process.exit(0);

// Fallback: build then run compiled JS
run(npm, [run, -s, build]);
const jsPath = dist/scripts/generate-ai-changelog.js;
if (\!existsSync(jsPath)) {
  console.error(ERROR: