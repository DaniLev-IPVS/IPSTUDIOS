# Tung Tung Initiatives Manager — Contextual Lessons

This document is read before **every** board mutation. It stores corrections and reusable context-specific judgments, not a duplicate of the audit log. No production lessons have been observed or validated yet.

## Active lessons

_None yet._

## Proposed lesson entry template

### LESSON-YYYYMMDD-001 — Concise context-specific title
- **Status:** proposed | active | superseded | archived
- **Logged at:** ISO-8601 timestamp with timezone
- **Author / reviewer:** user/team member identifiers
- **Original request:** exact relevant words or safe excerpt
- **What went wrong:** observable mistake, not speculation
- **Corrected example:** desired action with project, initiative, task, department, and status
- **When applicable:** narrow conditions including scope, entity type, user intent, and board state
- **When NOT applicable:** counterexamples and exclusions
- **Decision rule:** precise behavior for this context only
- **Why:** rationale tied to the actual request and observed result
- **Evidence:** Notion record IDs/URLs, before/after facts, source comment
- **Audit event ID:** linked entry in `logs/` or event store
- **Validated by / at:** reviewer and timestamp
- **Supersedes:** optional previous lesson ID

## Archived / superseded lessons

_None yet._

## Maintenance policy
- Log every attempted change in append-only `logs/`; create a lesson only for a correction, a meaningful recurring error pattern, or an explicit team instruction with context.
- New lessons start as **proposed** until verified against board context or explicitly endorsed by an authorized reviewer; do not enforce unreviewed speculation.
- Never delete history. Supersede old rules, document conflicts, and retain links to evidence.
- Only apply active lessons if both their positive conditions and exclusions have been checked for the present update.
