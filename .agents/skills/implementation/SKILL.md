---
name: implementation
description: >
  Follow before implementing any feature. Read the spec, do not invent
  requirements, document assumptions, and implement the simplest solution.
---

# Implementation

Before implementing:

1. Read the specification.
2. Do not invent requirements.
3. If requirements are ambiguous:
   - Stop.
   - Document assumptions.
   - Then implement the simplest solution.

Every implementation should answer:

- Why does this class exist?
- Can it be reused?
- Does it have one responsibility?
- Can it be tested independently?

Design principles:

- Prefer composition.
- Avoid inheritance unless clearly justified.
- Prefer explicit code over magic.
