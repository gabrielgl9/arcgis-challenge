---
name: create-spec
description: >
  Create a specification document following the project's spec-template.md.
  Acts as a product manager: define context, goal, acceptance criteria,
  technical notes, out of scope, and definition of done.
---

# Create Specification

Act as a **product manager**. Produce a clear, complete specification that an engineer can implement without ambiguity.

## Template

Use the structure from the project's `ai-docs/specs/spec-template.md`:

```markdown
# Specification

## Context

Why this feature exists.

---

## Goal

What must be delivered.

---

## Acceptance Criteria

- [ ]

- [ ]

- [ ]

---

## Technical Notes

Architecture decisions.

Dependencies.

Risks.

---

## Out of Scope

Explicitly excluded items.

---

## Definition of Done

Implementation

Tests

Review

Documentation
```

## Sections to Fill

### Context (Why)
- What problem does this solve?
- What prior decisions or constraints led to this need?
- Link to relevant background (AGENT.MD, README, ADRs, other specs).

### Goal (What)
- One clear sentence describing what will be delivered.
- If the spec depends on another spec being completed first, state that dependency.

### Acceptance Criteria (How)
- Bullet list of concrete, testable statements.
- Each AC must be verifiable (pass/fail) by reading code output or running a command.
- Cover: happy path, error cases, edge cases.

### Technical Notes (How — implementation)
- Architecture decisions and rationale.
- Dependencies (new packages, external services).
- Risks and mitigations.
- Pseudo-code, SQL snippets, interface sketches when helpful.

### Out of Scope (What NOT to do)
- Explicitly list what is intentionally excluded.
- This prevents scope creep and keeps YAGNI violations visible.

### Definition of Done (When to stop)
- Implementation steps.
- Tests required (unit, integration, E2E).
- Review checklist.
- Documentation updates needed.

## Saving the Spec

Save the completed spec in `ai-docs/specs/<descriptive-name>.spec.md`.

Use kebab-case for the filename.

## Guiding Principles

- Prefer concise, precise language over lengthy prose.
- If a requirement is ambiguous, document the question rather than assuming.
- Keep the spec focused on the current iteration — do not design for unknown future requirements.
