# Dark Auggie (n8n community node)

Dark Auggie is an n8n community node that wraps the Augment Code Auggie CLI to power agentic coding workflows in your automations. It’s designed to be versatile and play well with both built-in and community MCP nodes.

## Requirements

- Node v24.5.0+ (see .nvmrc)
- n8n (self-hosted or Cloud with Community Nodes enabled)

## Install

1) Build this package
- npm ci
- npm run build

2) Load into n8n (Community Node)
- Follow n8n’s docs for installing a local community node package
- Ensure the dist/ folder is included

## Credentials: Augment Code API

Create credentials named "Augment Code API" with the following fields:
- Session Auth JSON (required): maps to AUGMENT_SESSION_AUTH
- API URL (optional): maps to AUGMENT_API_URL
- API Token (optional): maps to AUGMENT_API_TOKEN
- GitHub Token (optional): maps to GITHUB_API_TOKEN

## Node overview

Operations
- Run CLI: pass raw arguments to auggie
- Quick Print: one-shot response using --print | --quiet | --compact
- Interactive Step: non-tty step with --instruction plus session controls

Config flags
- Workspace Root → --workspace-root
- Rules File Path → --rules
- MCP Config → --mcp-config via one of: Inline JSON, File Path, From JSON Path

Stdin sources
- None
- From JSON Path: takes item.json path or expression and pipes to stdin
- Binary Property: pipes item’s binary data to stdin

Env injection
- Additional Env (JSON): merges a JSON object into the process env before spawning auggie

## Example 1 — GitHub PR auto-review with compact output

- GitHub Trigger: Pull request opened/updated
- GitHub: Get PR Diff (as text)
- Dark Auggie (Quick Print)
  - Print Mode: Compact
  - Instruction: "Review the following diff, focusing on correctness, security, and clarity. Output bullet points only."
  - Stdin Source: From JSON Path
  - Stdin JSON Path: previousNode.data.diff
- GitHub: Create PR review comment
  - Map to Dark Auggie’s json.compactLines joined by \n
## Example 2 — Logs summarizer (binary stdin) → Slack

- Source: HTTP Request / S3 / FS node to fetch logs as binary
- Dark Auggie (Quick Print)
  - Instruction: "Summarize errors and likely root causes; propose remediation steps."
  - Stdin Source: Binary Property (e.g., data)
  - MCP Config Source: File Path (optional)
- Slack: Post message with Dark Auggie json.stdout

## Example 3 — MCP toolchain orchestration

- Upstream: Node outputs MCP JSON (e.g., Extracted from secrets or built dynamically)
- Dark Auggie (Interactive Step)
  - Continue Previous Session: true
  - MCP Config Source: From JSON Path (e.g., previousNode.data.mcp)
  - Instruction: "Use the tools described in MCP to fetch recent issues and classify them."
  - Workspace Root / Rules File Path as needed
- Downstream: Create Jira tickets / send Slack alerts based on structured results

## Output fields

- json.success: boolean
- json.stdout: string
- json.stderr: string
- json.exitCode: number
- json.compactLines?: string[] (when Print Mode is Compact)

## Icon

The Dark Auggie icon is a Sith-helmed "A" with an Augment-green energy core — a minimalist homage to both Augment Code and the Dark Side. See src/nodes/DarkAuggie/dark-auggie.svg.


## Automated Releases and Conventional Changelog

This project uses semantic-release to automatically:
- Analyze commits (Conventional Commits) to determine the next version
- Generate/update CHANGELOG.md
- Create a GitHub Release with release notes
- Optionally publish to npm and update its dist-tag (only if explicitly enabled)

### How it works
- On push to main or master, the "Release" GitHub Action builds the package and runs semantic-release using .releaserc.cjs.
- On pull requests, the "Release (dry-run)" workflow shows what would be released without creating tags, releases, or changing files.

### Enable npm publishing (optional)
By default, publishing to npm is disabled. To enable it:
1) Add a repository variable: PUBLISH_NPM=true
2) Add a repository secret: NPM_TOKEN with an npm automation token that has publish rights

When both are present, the @semantic-release/npm plugin will publish and update the package's dist-tag accordingly.

### Conventional Commits
Commit messages must follow Conventional Commits so semantic-release can calculate version bumps.

Basic format:
- type(optional scope)!: short description
- (blank line)
- optional detailed body
- (blank line)
- optional footer; Breaking changes can also be noted as "BREAKING CHANGE: ..."

Common types:
- feat: a new feature (triggers a minor release)
- fix: a bug fix (triggers a patch release)
- perf, refactor, docs, test, build, ci, chore: do not trigger a release unless marked as breaking
- Use ! after the type/scope to indicate a breaking change (triggers a major release)

Examples:
- feat: add support for inline MCP config
- fix(DarkAuggie): handle empty stdin without error
- refactor!: drop Node 18 support in favor of Node 24

### Local dry-run (optional)
You can preview the next release locally:

- npx semantic-release --no-ci --dry-run

### Notes
- Do not manually edit the version in package.json; semantic-release manages versioning via git tags.
- The CHANGELOG.md file is updated automatically on release and committed back to the repo.
