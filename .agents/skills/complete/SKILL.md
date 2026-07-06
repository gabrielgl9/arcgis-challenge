---
name: complete
description: >
  Run this skill after EVERY task implementation. It runs linters, type checker,
  tests, E2E, and code review. If any step fails, fix and retry before reporting done.
---

# Completion Workflow

Execute this skill after EVERY completed implementation task.

## Steps (in order)

### 1. Format all files

```bash
npx prettier --write src/
npx biome check --write src/
```

If errors occur, fix them before proceeding.

### 2. Run type checker

```bash
npm run typecheck
```

If `tsc --noEmit` fails, fix all type errors before proceeding.

### 3. Run linters

```bash
npm run lint
npm run check
```

If ESLint or Biome reports errors, fix them before proceeding.
Warnings are acceptable but should be minimized.

### 4. Run unit tests

```bash
npm test
```

If any test fails, fix the implementation — do NOT modify tests to make them pass.

### 5. Run E2E tests

```bash
npm run test:e2e
```

If any E2E test fails, fix the implementation or the test.

### 6. Code Review

Review the implementation using the following checklist:

**Correctness**
- Does the implementation satisfy the specification?
- Are edge cases handled (null, empty, invalid inputs)?
- Are failures handled (network, DB, parse errors)?

**Architecture**
- Is each class/function responsible for only one thing?
- Are dependencies inverted correctly?
- Are abstractions useful?

**DRY / YAGNI / KISS**
- Is there duplicated code that could be extracted?
- Was anything implemented that the spec did not require? If yes, remove it.
- Can the implementation be simpler?

**Clean Code**
- Are functions small and descriptive?
- Are variable names meaningful?
- Are there magic numbers that should be named constants?
- Are there boolean flags or nested conditionals that could be simplified?

**Performance & Security**
- Are unnecessary queries, loops, or data loads avoided?
- Are inputs validated?
- Is external API data handled safely (null checks, type coercion)?

### 7. Final Verdict

If all steps pass without errors:

- Summarize what was implemented
- Report test counts and lint status
- Present the final verdict: **APPROVED**

If any step failed and was fixed, note what was corrected.

If any step cannot be resolved after 2 attempts, report to the user with the error details and ask for guidance.
