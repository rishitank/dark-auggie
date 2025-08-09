#!/usr/bin/env node
/*
  Auggie-powered AI Changelog Generator
  - Collects recent commits (and optionally PR metadata) from the current repo
  - Sends a structured summary to Auggie via --print and writes CHANGELOG_AI.md

  Usage examples:
    node scripts/generate-ai-changelog.mjs
    node scripts/generate-ai-changelog.mjs --from v0.1.0 --to HEAD
    node scripts/generate-ai-changelog.mjs --since 2025-01-01 --max-commits 100
    node scripts/generate-ai-changelog.mjs --github-repo owner/repo --output docs/CHANGELOG_AI.md

  Env:
    - AUGMENT_SESSION_AUTH (preferred), or AUGMENT_API_TOKEN (+ optional AUGMENT_API_URL)
    - GITHUB_TOKEN (optional, enrich with PR details when --github-repo is set or GITHUB_REPOSITORY exists)
*/

import { spawn } from 'node:child_process';
import { execFile as _execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const execFile = promisify(_execFile);

function parseArgs(argv) {
  const out = {
    from: undefined,
    to: 'HEAD',
    since: undefined,
    maxCommits: 100,
    output: 'CHANGELOG_AI.md',
    githubRepo: process.env.GITHUB_REPOSITORY || undefined,
    includePulls: true,
    title: undefined,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--from') out.from = next();
    else if (a === '--to') out.to = next();
    else if (a === '--since') out.since = next();
    else if (a === '--max-commits') out.maxCommits = Number(next() || out.maxCommits) || out.maxCommits;
    else if (a === '--output') out.output = next();
    else if (a === '--github-repo') out.githubRepo = next();
    else if (a === '--no-pulls') out.includePulls = false;
    else if (a === '--title') out.title = next();
    else if (a === '--help' || a === '-h') {
      console.log(`Auggie AI Changelog\n\nFlags:\n  --from <ref>           Start ref/tag/sha (default: last tag if available)\n  --to <ref>             End ref/tag/sha (default: HEAD)\n  --since <date>         Alternative to --from, e.g. '2025-01-01' or '2 weeks ago'\n  --max-commits <n>      Limit number of commits scanned (default: 100)\n  --github-repo <owner/repo>  Use GitHub API to enrich PR metadata (requires GITHUB_TOKEN)\n  --no-pulls             Disable PR lookup even if github repo present\n  --output <path>        Where to write the changelog (default: CHANGELOG_AI.md)\n  --title <text>         Optional changelog title override\n`);
      process.exit(0);
    }
  }
  return out;
}

async function git(args, opts = {}) {
  try {
    const { stdout } = await execFile('git', args, { ...opts });
    return stdout.toString('utf8').trim();
  } catch (e) {
    return '';
  }
}

async function resolveRange(from, to, since) {
  const toRef = to || 'HEAD';
  let fromRef = from;
  if (!fromRef && !since) {
    // Try last annotated or lightweight tag
    const lastTag = await git(['describe', '--tags', '--abbrev=0']);
    if (lastTag) fromRef = lastTag;
  }
  return { from: fromRef, to: toRef, since };
}

async function getCommits({ from, to, since, max }) {
  const format = ['%H', '%an <%ae>', '%ad', '%s', '%b', '==END=='].join('\n');
  const args = ['log', `--max-count=${max}`, `--pretty=format:${format}`, '--date=iso'];
  if (since) args.push(`--since=${since}`);
  if (from) args.push(`${from}..${to || 'HEAD'}`); else if (to && !since) args.push(to);
  const out = await git(args);
  if (!out) return [];
  const chunks = out.split('\n==END==').map(s => s.trim()).filter(Boolean);
  const commits = [];
  for (const c of chunks) {
    const lines = c.split(/\r?\n/);
    const [sha, author, date, subject, ...bodyLines] = lines;
    commits.push({ sha, author, date, subject, body: bodyLines.join('\n').trim() });
  }
  return commits;
}

async function tryFetch(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) return null;
  return await res.json();
}

async function enrichWithPRs(commits, githubRepo, token) {
  if (!githubRepo || !token) return commits;
  const [owner, repo] = githubRepo.split('/');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ai-changelog-script',
  };
  const limited = commits.slice(0, 200); // hard cap
  const out = [];
  for (const c of limited) {
    const pulls = await tryFetch(`https://api.github.com/repos/${owner}/${repo}/commits/${c.sha}/pulls`, { headers });
    let pr = null;
    if (Array.isArray(pulls) && pulls.length) {
      const p = pulls[0];
      pr = {
        number: p.number,
        title: p.title,
        html_url: p.html_url,
        user: p.user?.login,
        merged_at: p.merged_at,
        labels: (p.labels || []).map(l => (typeof l === 'object' ? l.name : l)),
      };
    }
    out.push({ ...c, pr });
  }
  return out;
}

function buildInstruction(meta) {
  const { title, from, to, since, githubRepo } = meta;
  const heading = title || 'AI Changelog';
  const rangeText = since ? `since ${since}` : (from ? `${from}..${to}` : `up to ${to}`);
  return [
    `${heading} — generate a clean Markdown changelog ${rangeText}.`,
    '',
    'Requirements:',
    '- Use top-level H1 with the title and today\'s date (YYYY-MM-DD).',
    '- Group entries under H2 sections: Features, Fixes, Performance, Docs, Refactor, Chore, Other (omit empty).',
    '- Use concise bullet points (imperative mood). Include PR numbers like #123 when present and link to PRs if html_url is given.',
    '- Avoid duplicating the same change if both a commit and PR refer to it.',
    '- Include a small Unreleased/Next section only if there are commits after the last tag but before a release tag.',
    '- End with a short summary section with counts by type.',
    '',
    'You will receive JSON input with fields: commits[], each {sha, author, date, subject, body, pr?{number,title,html_url,user,labels[]}}, and meta{repo, from, to, since}.',
    'Return only Markdown. No extra commentary.',
  ].join('\n');
}

function runAuggie(instruction, inputJson) {
  const localBin = resolve('node_modules/.bin/auggie');
  const cmd = existsSync(localBin) ? localBin : 'auggie';
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, ['--print', instruction], { stdio: ['pipe', 'pipe', 'pipe'] });
    const out = [];
    const err = [];
    child.stdout.on('data', c => out.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
    child.stderr.on('data', c => err.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
    child.on('error', reject);
    child.on('close', (code) => {
      const stdout = Buffer.concat(out).toString('utf8');
      const stderr = Buffer.concat(err).toString('utf8');
      if (code !== 0) {
        reject(new Error(`Auggie exited with code ${code}: ${stderr}`));
      } else {
        resolvePromise({ stdout, stderr });
      }
    });
    child.stdin.write(JSON.stringify(inputJson, null, 2));
    child.stdin.end();
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const range = await resolveRange(args.from, args.to, args.since);
  const commits = await getCommits({ from: range.from, to: range.to, since: range.since, max: args.maxCommits });
  if (!Array.isArray(commits) || commits.length === 0) {
    console.error('No commits found in the specified range.');
    process.exit(1);
  }

  const githubRepo = args.githubRepo;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_API_TOKEN;
  const commitsWithPRs = args.includePulls && githubRepo && token
    ? await enrichWithPRs(commits, githubRepo, token)
    : commits;

  const meta = {
    repo: githubRepo || (await git(['config', '--get', 'remote.origin.url'])),
    from: range.from || null,
    to: range.to || 'HEAD',
    since: range.since || null,
    generatedAt: new Date().toISOString(),
  };

  const input = { meta, commits: commitsWithPRs };
  const instruction = buildInstruction({ title: args.title, ...range, githubRepo });

  // Sanity check for Auggie credentials
  if (!process.env.AUGMENT_SESSION_AUTH && !process.env.AUGMENT_API_TOKEN) {
    console.warn('Warning: AUGMENT_SESSION_AUTH or AUGMENT_API_TOKEN not set. Auggie may fail to authenticate.');
  }

  const { stdout } = await runAuggie(instruction, input);

  const outPath = resolve(args.output);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, stdout, 'utf8');
  console.log(`Wrote ${outPath} (${stdout.length} bytes)`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});

