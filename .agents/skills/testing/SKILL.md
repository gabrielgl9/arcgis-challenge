---
name: testing
description: >
  Every feature should be verified. Use Vitest for unit/integration tests and
  Playwright for E2E. Never disable, comment, or skip tests.
---

# Testing

Every feature should be verified.

## Rules

- Never disable tests
- Never comment tests to make CI pass
- Never skip tests unless explicitly requested

## Testing Pyramid

| Layer | Tool |
|-------|------|
| Unit | Vitest |
| Integration | Vitest |
| E2E | Playwright |

## By Layer

- **Repository**: Use integration tests
- **Services**: Prefer unit tests
- **Controllers**: Prefer integration tests
- **E2E**: Validate complete user flows

## Assertions

- Prefer explicit assertions
- Avoid snapshot abuse

## Coverage

Cover the following paths for every feature:
- Happy path
- Error path
- Edge cases
- Invalid inputs

## Review

Before finishing:
1. Run Vitest
2. Run Playwright
3. If any test fails: fix implementation
4. Do NOT modify tests simply to make them pass
