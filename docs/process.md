# Process Note

## Development Approach

This project was developed using **Spec-Driven Development (SDD)** with AI assistance.

---

## Spec-Driven Development

Every feature began as a specification document before any code was written:

1. **Spec creation** — a spec was written following the project template (`ai-docs/specs/spec-template.md`)
2. **Implementation** — code was written to satisfy the spec's acceptance criteria
3. **Validation** — linters, type checker, tests, and E2E tests were run
4. **Review** — code review was performed against the spec

All specs are stored in `ai-docs/specs/`.

---

## AI Usage

An AI coding agent (Zed) was used to assist with:

### Code Generation
- Scaffolding project structure (Docker, Fastify, Drizzle, TypeScript config)
- Implementing ArcGIS client with pagination
- Writing normalization functions (field mapping, WKT conversion)
- Implementing UPSERT-based importers
- Creating REST controllers, services, and repositories
- Writing unit tests (Vitest) and E2E tests (Playwright)

### Configuration
- Setting up linters (ESLint, Prettier, Biome)
- Configuring type checking (strict TypeScript)
- Setting up test infrastructure (Vitest + Playwright)

### Documentation
- Creating specification documents
- Writing this process note
- Updating README

### Validation

AI-generated code was validated through:

1. **TypeScript compilation** (`tsc --noEmit`) — zero errors
2. **Linters** (ESLint, Biome, Prettier) — zero errors
3. **Unit tests** (Vitest, 55 tests) — 100% pass
4. **E2E tests** (Playwright, 7 tests) — 100% pass
5. **Manual verification** against live ArcGIS APIs
6. **Idempotency verification** — ingestion re-run produces identical results

### Human Oversight

Key decisions were reviewed by the developer:

- Field name mappings (actual API response inspected to confirm `Zoning_Category`, etc.)
- SRID discovery (queried ArcGIS service metadata for `spatialReference`)
- WKT format for multi-ring geometries
- Error handling strategy for null geometries
