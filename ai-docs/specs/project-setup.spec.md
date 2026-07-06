# Specification

## Context

The project needs a Node.js/TypeScript environment with Fastify, Drizzle ORM, PostgreSQL + PostGIS, and Docker Compose. No infrastructure exists yet.

---

## Goal

Provision the complete development environment so that subsequent specs have a running foundation to build upon.

---

## Acceptance Criteria

- [ ] `docker-compose.yml` starts PostgreSQL 16 with PostGIS enabled
- [ ] `package.json` declares all Node.js dependencies
- [ ] `tsconfig.json` configures strict TypeScript
- [ ] Fastify server boots on a configurable port and responds to a health-check endpoint (`GET /health`)
- [ ] Drizzle ORM connects to the local PostgreSQL database
- [ ] `drizzle.config.ts` is present and points to the schema directory
- [ ] `.env` contains the two ArcGIS Feature Service URLs
- [ ] `src/config.ts` exports environment variables as typed constants

---

## Technical Notes

**Docker Compose**

- Use `postgis/postgis:16-3.4` image
- Expose port 5432
- Persist data with a named volume
- Set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

**Dependencies**

| Package | Purpose |
|---------|---------|
| fastify | HTTP framework |
| @fastify/cors | CORS support |
| drizzle-orm | ORM |
| postgres | Drizzle driver |
| dotenv | Environment loader |

**Dev Dependencies**

| Package | Purpose |
|---------|---------|
| typescript | Language |
| tsx | TypeScript executor |
| @types/node | Node types |
| drizzle-kit | Migrations & schema push |

**Config**

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/arcgis
ARCGIS_PARCELS_URL=https://gis.urbaneng.com/arcgis/rest/services/HaysCountyParcels/FeatureServer/0/query
ARCGIS_ZONING_URL=https://services6.arcgis.com/vXZW4vAaPRr14z2s/ArcGIS/rest/services/Zoning/FeatureServer/0/query
PORT=3000
```

**Project Structure**

```
src/
  config.ts          # typed env exports
  app.ts             # Fastify instance + plugins
  server.ts          # boot entry point
database/
  schema/            # Drizzle table definitions
    index.ts
```

---

## Out of Scope

- Business logic
- Routes other than `/health`
- Database migrations (covered in data-model spec)
- Tests

---

## Definition of Done

- [ ] Docker Compose starts successfully and PostGIS extension is available
- [ ] `npm run dev` boots Fastify and responds on `GET /health` with `{ status: "ok" }`
- [ ] Drizzle can connect to the database (verify with a raw query)
- [ ] `.env` is loaded via dotenv and `src/config.ts` exports typed values
