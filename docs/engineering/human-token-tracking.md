# Human-token tracking — setup for engineers

This repo is **instrumented** for the human-token-tracker data pipeline. Every Claude
Code session that runs here is attributed to the Edge8 client and the pilot project, and
the work in each PR is credited to the real human who did it. This page is the one thing
you must set up locally for that attribution to work.

## TL;DR — set your local git email to your Edge8 email

Attribution resolves by your **git `user.email`**. The session-ingest hooks read it and the
Edge Function maps it to your Edge8 team member (via `resolve_team_member(email)`,
case-insensitive). If your git email is anything other than your registered Edge8 email,
your sessions land **unattributed**.

After cloning this repo, set the email **on this clone** (repo-local, not global):

```bash
git config user.email "you@edge8.ai"   # your registered Edge8 team-member email
```

Verify:

```bash
git config user.email
```

> Do **not** commit anyone's email into the repo. It lives only in your local git config.
> The example above is illustrative — use your own Edge8 email.

## What's already wired in this repo (no action needed)

| File | Purpose |
|---|---|
| `.claude/project.json` | Non-secret IDs the ingest hooks read: `client_id`, `project_id`, `primary_role`, `token_source`. Tells a session which client/project to charge. |
| `.github/pull_request_template.md` | Includes the `<!-- author: … -->` block. Replace the placeholder + uncomment so the daily sync credits the human author. |
| `.github/workflows/authorship-guard.yml` | Warn-only CI. Comments a reminder if a PR lacks a resolvable author block. **Never blocks merge.** |

`.claude/project.json` is non-secret (IDs only). Secrets (`INGEST_SECRET`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY`) live in machine env / `~/.claude/.env` and are **never** committed.

## What you install once per machine (not per repo)

The two session-ingest hooks live in the agent templates, not here. Per their SKILL:

1. Copy `session-ingest-start.py` + `session-ingest-end.py` to `~/.claude/hooks/` and merge
   `hooks.json` (SessionStart → start hook, SessionEnd → end hook).
2. Create `~/.claude/.env` (never committed) with `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `INGEST_SECRET`.

In a repo without `.claude/project.json`, the hooks no-op. Every failure path is silent —
they never block or slow a session.

## Two things to remember per PR

1. **Set your git email** (above) — credits your *sessions* (tokens + hours).
2. **Fill in the author block** in the PR description — credits the *PR* to you. Replace the
   placeholder in the template and uncomment it. The email is the resolution key.

## References

- `docs/architecture/session-ingest-contract.md` (human-token-tracker repo) — ingest payload schema.
- `docs/architecture/authorship-contract.md` (human-token-tracker repo) — PR-body author-block format.
- `session-ingest` SKILL — `talentedgeai/infiniteleverage-8-agents-template`, `.claude/skills/session-ingest/SKILL.md`.
