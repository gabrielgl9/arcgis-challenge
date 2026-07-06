---
name: code-review
description: >
  Review implementation correctness, architecture, DRY, YAGNI, KISS, clean code,
  performance, and security. Use after EVERY completed task.
---

# Code Review

Execute after EVERY completed task. Review using the checklist below.

## Correctness

- Does the implementation satisfy the specification?
- Are edge cases handled?
- Are failures handled?

## Architecture

- Is each class responsible for only one thing?
- Does any class know too much?
- Are dependencies inverted correctly?
- Are abstractions useful?
- Can the implementation be extended without modification?

## DRY

- Is duplicated code present?
- Can duplicated code become a reusable component?
- Avoid premature abstraction.

## YAGNI

- Was anything implemented that the specification did not require?
- If yes: recommend removal.

## KISS

- Can the implementation become simpler?
- Would a junior developer understand it?

## Clean Code

- Methods: small, descriptive
- Variables: meaningful names
- Classes: cohesive
- Avoid boolean flags
- Avoid nested conditionals when possible
- Avoid magic numbers

## Performance

- Avoid unnecessary queries
- Avoid loading unnecessary data
- Avoid unnecessary loops

## Security

- Validate inputs
- Never trust external APIs
- Handle malformed data

## Final Verdict

Provide:
- Strengths
- Weaknesses
- Suggested Refactoring
- Risk Level (low / medium / high)
