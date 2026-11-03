# Tung Tung Initiatives Manager

Draft agent skill based on the supplied workflow and existing Notion Skills Library pattern.

- `SKILL.md` — agent operating instructions, entity classification, change protocol, audit and safety rules
- `knowledge.md` — known business context and a checklist for database schema discovery
- `lessons.md` — context-specific corrections and case-based decision guidance

For a production installation, add append-only `logs/` storage, an integration-specific Notion mapping, verified database IDs, authorization controls, and optional Neon schema/migrations. Git can be the canonical reviewed source of these Markdown files. Do not enable writes until the target workspace's schemas and permissions are verified.
