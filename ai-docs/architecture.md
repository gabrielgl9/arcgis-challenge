# Architecture Skill

Always prefer:

- KISS
- DRY
- YAGNI
- SOLID where appropriate
- Clean Code

Avoid:

- unnecessary abstractions
- overengineering
- generic factories
- design patterns without concrete value

Separate responsibilities into layers.

Repository

Responsible only for persistence.

Never contains business rules.

Service

Responsible for application rules.

May orchestrate repositories.

External Service

Responsible for communication with external systems.

Examples:

- ArcGIS
- Future CSV Import
- Future FTP Import

Controllers

Responsible only for HTTP.

Never contain business logic.

DTOs

Represent transport layer only.

Never expose database models directly.
