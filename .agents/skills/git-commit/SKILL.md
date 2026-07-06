---
name: git-commit
description: >
  Write a clear, conventional Git commit message summarizing the changes.
  Follows the project's commit style: imperative mood, 50-char subject,
  72-char body wrap, no period at end of subject.
---

# Git Commit

Write a Git commit message following conventional best practices.

## Format

```
<subject>
<BLANK LINE>
<body (optional)>
```

## Subject Line Rules

- Limit to **50 characters**
- Capitalize the first letter
- Use **imperative mood** ("Add feature", not "Added feature")
- Do **not** end with a period
- If you can express the change in just the subject, omit the body

## Body Rules

- Only include the body when it provides **useful** information
- Don't repeat information from the subject line
- Wrap at **72 characters**
- Explain **what** and **why**, not **how**

## What NOT to Do

- Do not include the raw diff output
- Do not include meta-commentary about the task
- Do not list every file changed

## Example

```
Add residential parcels endpoint

Implements GET /api/parcels/residential with minArea query param.
Uses ST_Intersects spatial join between parcels and zoning tables.
```

## Workflow

1. Stage the changes: `git add <files>`
2. Run `GIT_EDITOR=true git commit` (prevents editor from opening)
3. Only return the commit message in the response
