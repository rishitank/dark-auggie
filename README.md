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

