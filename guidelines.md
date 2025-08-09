# Project Guidelines

These guidelines coordinate contributions across lanes and sub-agents.

## Communication style
- Use concise, actionable language.
- Always include helpful emojis to improve scannability and delight 😎🚀✨
  - Examples: status ✅/❌, warnings ⚠️, ideas 💡, performance 🚀, security 🔒, tests ✅, docs 📚, release 🏷️
- Prefer short sections and bullet points.

## Conventional commits
- Format: `<type>(scope): short summary`
- Common types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert

## Code quality
- TypeScript strict mode on
- ESLint + Prettier enforced via pre-commit
- Tests with Jest; target useful unit tests and fast feedback
- Maintain zero new critical security findings; document residuals if unfixable without breakage

## Git workflow
- Use feature/auggie-orchestration-* lanes (worktrees) for parallel tasks
- Keep each lane scoped and independently buildable
- One umbrella PR to main after consolidation

## CI
- PRs must pass: lint → typecheck → tests → build
- Releases are automated and follow conventional commits

## Docs
- Keep README up to date
- Place asset variants under src/nodes/DarkAuggie/icons/

## Security
- Avoid forceful dependency updates that introduce breaking changes
- Prefer targeted npm overrides for transitives; document trade-offs

## Sub-agent orchestration
- Lanes may spawn sub-agents when work benefits from specialization
- Plans and logs live in each lane under logs/


