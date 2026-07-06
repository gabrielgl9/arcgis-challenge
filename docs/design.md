# Design Document

## Architecture Overview

```text
External ArcGIS APIs (Zoning + Parcels)
        │
        ▼
  ArcGIS Client (HTTP + pagination)
        │
        ▼
  Importers (Zoning + Parcels)
        │
        ▼
  Normalization (field mapping + WKT conversion)
        │
        ▼
  PostgreSQL + PostGIS (SRID 4326)
        │
        ▼
  REST API (Fastify)
        │
        ▼
  External Consumers
```

The system has a strict data flow: ArcGIS is only accessed during ingestion. All API requests query the local database exclusively.

---

## Key Decisions

### 1. Raw SQL for Spatial Queries

**Decision**: Use Drizzle ORM for schema definitions but raw SQL (`sql.unsafe()`) for all spatial queries.

**Rationale**: Drizzle ORM does not natively support PostGIS geometry types. Using `customType` works for TypeScript awareness, but spatial predicates (`ST_Intersects`, `ST_Area`, `ST_Transform`) require raw SQL. This is explicitly recommended by the project guidelines.

**Tradeoff**: Lose some ORM type safety on spatial queries. Mitigated by explicit TypeScript return types on repositories.

---

### 2. SRID Normalization at Ingestion Time

**Decision**: Convert all geometries to EPSG:4326 (WGS84) during ingestion, regardless of source projection.

| Dataset | Source SRID | Source Projection |
|---------|-------------|-------------------|
| Zoning  | 2277        | NAD83 / Texas Central (ftUS) |
| Parcels | 2278        | NAD83 / Texas South (ftUS) |

**Rationale**: Storing everything in a single SRID avoids runtime transformations in every query. WGS84 was chosen because it's the universal standard for geographic coordinates.

**Tradeoff**: Area calculations require a `::geography` cast for meter-accurate results, adding minor complexity to the area computation.

---

### 3. Area Computed from Geometry

**Decision**: Parcel area is never read from the source dataset. It's always computed via `ST_Area(geom::geography) / 4046.86`.

**Rationale**: Source area fields may be outdated or use different measurement standards. Computing from the authoritative geometry guarantees consistency.

---

### 4. Spatial Join Instead of Foreign Key

**Decision**: No `zoning_id` foreign key in the parcels table. The relationship is determined by `ST_Intersects` at query time.

**Rationale**: A parcel may intersect multiple zoning districts. A foreign key would force a single zoning designation, losing information. The spatial join is more flexible and accurate.

**Tradeoff**: Queries are slightly more expensive (spatial index lookups). Mitigated by GiST indexes on geometry columns.

---

### 5. Individual UPSERT (Not Batch)

**Decision**: Each feature is upserted individually in a loop.

**Rationale**: Simplicity. The 103k parcels ingest in ~5 minutes, which is acceptable for a take-home assessment. Batch inserts would be faster but add complexity.

**Tradeoff**: Slower ingestion for large datasets. Could be optimized with batch upserts if needed.

---

### 6. Idempotent Pipeline

**Decision**: Use `ON CONFLICT (id) DO UPDATE` for all inserts.

**Rationale**: Running ingestion multiple times produces identical results. This simplifies development and recovery workflows.

---

### 7. ArcGISClient with Dependency Injection

**Decision**: `ArcGISClient` accepts an optional `fetchFn` parameter.

**Rationale**: Enables unit testing without HTTP calls and allows future customization (retries, timeouts, logging).

---

## Project Structure

```
src/
├── api/controllers/       # HTTP request/response handling
│   └── routes/            # Fastify route registration
├── database/
│   ├── schema/            # Drizzle table definitions
│   ├── migrations/        # SQL migration files
│   └── repositories/      # Raw SQL queries
├── ingestion/
│   ├── arcgis.client.ts   # HTTP client with pagination
│   ├── normalize.ts       # Field mapping + WKT conversion
│   ├── zoning.importer.ts # Zoning ingestion
│   └── parcels.importer.ts# Parcels ingestion
└── services/              # Application business logic
```

---

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | TypeScript | Type safety, ecosystem |
| Runtime | Node.js 22 | Required by assessment |
| Framework | Fastify | Fast, schema validation, TypeScript-native |
| ORM | Drizzle | Lightweight, raw SQL support, no magic |
| Database | PostgreSQL 16 | Required by assessment |
| Spatial | PostGIS 3.4 | Required by assessment |
| Container | Docker Compose | Reproducible environment |
| Testing | Vitest + Playwright | Fast unit tests + E2E validation |

---

## Deferred Decisions

- Authentication — not needed for a data pipeline demo
- Frontend — explicitly out of scope per assessment
- Scheduled sync — not needed for static datasets
- Caching — dataset fits in memory, DB queries are fast enough
- Dataset versioning — no historical tracking required
