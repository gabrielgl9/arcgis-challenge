---
name: refactoring
description: >
  Improve existing code without changing behavior. Refactor only after tests
  are green. Prefer small, incremental refactors.
---

# Refactoring

Always look for opportunities to improve the existing code without changing behavior.

## Rules

- Refactor only after tests are green.
- Never refactor and implement a feature simultaneously if it increases review complexity.
- Small, incremental refactors are preferred.

## Techniques

Prefer:

- Extract Method
- Extract Class
- Rename for clarity
- Remove duplication
- Reduce coupling
- Improve cohesion
