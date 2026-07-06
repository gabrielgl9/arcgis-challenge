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

## Module Decomposition

| Module               | Files                               | Responsibility                                                                                                                                                                   |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ArcGIS Client**    | `src/ingestion/arcgis.client.ts`    | HTTP communication with ArcGIS Feature Services. Handles pagination (`resultOffset`/`resultRecordCount`). Returns typed `ArcGISFeatureCollection`. Contains zero business logic. |
| **Normalizer**       | `src/ingestion/normalize.ts`        | Converts ArcGIS `rings` geometry to WKT. Maps ArcGIS field names to database column names. Returns typed normalized objects or `null` for invalid geometries.                    |
| **Zoning Importer**  | `src/ingestion/zoning.importer.ts`  | Orchestrates download → normalize → UPSERT for the zoning dataset. Uses `ST_Transform` to convert from SRID 2277 to 4326.                                                        |
| **Parcels Importer** | `src/ingestion/parcels.importer.ts` | Same pattern for parcels. Computes `calculatedAreaAcres` via `ST_Area(geom::geography)`. Uses SRID 2278 source.                                                                  |
| **Repositories**     | `src/database/repositories/`        | Raw SQL queries against PostgreSQL. Never contain business rules. Each function is a single SQL query with typed parameters and return types.                                    |
| **Services**         | `src/services/`                     | Application business logic. Orchestrates repositories. Contains rules like "residential = category starts with R OR description starts with Residential".                        |
| **Controllers**      | `src/api/controllers/`              | HTTP request parsing and response formatting. Validates query parameters. Delegates to services. Never contains business logic.                                                  |
| **Routes**           | `src/api/routes/`                   | Fastify route registration. Wires HTTP methods + paths to controllers.                                                                                                           |
| **Migration Runner** | `src/database/migrate.ts`           | Applies `.sql` migration files sequentially. Enables PostGIS extension, creates tables and GiST indexes.                                                                         |

---

## Key Decisions

### 1. Raw SQL for Spatial Queries

**Decision**: Use Drizzle ORM for schema definitions but raw SQL (`sql.unsafe()`) for all spatial queries.

**Rationale**: Drizzle ORM does not natively support PostGIS geometry types. Using `customType` works for TypeScript awareness, but spatial predicates (`ST_Intersects`, `ST_Area`, `ST_Transform`) require raw SQL. This is explicitly recommended by the project guidelines.

**Tradeoff**: Lose some ORM type safety on spatial queries. Mitigated by explicit TypeScript return types on repositories.

---

### 2. SRID Normalization at Ingestion Time

**Decision**: Convert all geometries to EPSG:4326 (WGS84) during ingestion, regardless of source projection.

| Dataset | Source SRID | Source Projection            |
| ------- | ----------- | ---------------------------- |
| Zoning  | 2277        | NAD83 / Texas Central (ftUS) |
| Parcels | 2278        | NAD83 / Texas South (ftUS)   |

**Rationale**: Storing everything in a single SRID avoids runtime transformations in every query. WGS84 was chosen because it's the universal standard for geographic coordinates.

**Tradeoff**: Area calculations require a `::geography` cast for meter-accurate results, adding minor complexity to the area computation.

---

### 3. Area Computed from Geometry

**Decision**: Parcel area is never read from the source dataset. It's always computed via `ST_Area(geom::geography) / 4046.86` and stored in `calculatedAreaAcres`.

**Rationale**: Source area fields may be outdated or use different measurement standards. Computing from the authoritative geometry guarantees consistency.

**Tension with performance**: Computing `ST_Area` during ingestion (and storing the result) means queries are fast — no runtime computation needed. If we had computed on-the-fly per request, each query would pay the cost. Storing it is the right choice for read-heavy workloads.

---

### 4. Spatial Join Instead of Foreign Key

**Decision**: No `zoning_id` foreign key in the parcels table. The relationship is determined by `ST_Intersects` at query time.

**Rationale**: A parcel may intersect multiple zoning districts. A foreign key would force a single zoning designation, losing information. The spatial join is more flexible and accurate.

**Tradeoff**: Queries are slightly more expensive (spatial index lookups). Mitigated by GiST indexes on geometry columns.

---

### 5. Individual UPSERT (Not Batch)

**Decision**: Each feature is upserted individually in a loop.

**Rationale**: Simplicity. The 103k parcels ingest in ~5 minutes, which is acceptable for a take-home assessment. Batch inserts would be faster but add complexity.

**Tradeoff**: Slower ingestion for large datasets. Could be optimized with batch upserts if needed. This was deliberately deferred.

---

### 6. Idempotent Pipeline

**Decision**: Use `ON CONFLICT (id) DO UPDATE` for all inserts.

**Rationale**: Running ingestion multiple times produces identical results. This simplifies development and recovery workflows.

---

### 7. ArcGISClient with Dependency Injection

**Decision**: `ArcGISClient` accepts an optional `fetchFn` parameter.

**Rationale**: Enables unit testing without HTTP calls and allows future customization (retries, timeouts, logging).

---

## Deferred Decisions

These were intentionally left out of scope for the assessment:

| Decision                  | Reason                                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| **Batch UPSERT**          | Individual inserts are simpler and fast enough (~5 min for 103k parcels) |
| **Data validation layer** | ArcGIS data is trusted; malformed records are skipped gracefully         |
| **Authentication**        | Not needed for a data pipeline demo                                      |
| **Frontend**              | Explicitly out of scope per assessment                                   |
| **Scheduled sync**        | Not needed for static datasets                                           |
| **Caching**               | Dataset fits in memory, DB queries are fast enough                       |
| **Dataset versioning**    | No historical tracking required                                          |
| **Incremental ingestion** | Delta detection would add complexity without assessment requirement      |
| **GeoJSON output**        | Not requested; would be trivial to add as an Accept header option        |

---

## Ambiguities and Tensions

### "Group by area" — what is "area"?

The assessment asks to "group by area" but does not define the term. This is ambiguous because:

- **Possible meaning 1**: Neighborhood (a named subdivision in the parcels dataset)
- **Possible meaning 2**: Zoning category (from the zoning dataset)
- **Possible meaning 3**: Geographic area (e.g., grid cells, zip codes)

**What we assumed**: "Area" means zoning category (neighborhood = zoning district). This was chosen because the zoning dataset is the only one with meaningful categorical groupings beyond individual parcel IDs.

### Area computed from geometry vs. source area field

The assessment explicitly requires computing area from geometry, but the source dataset also includes an `Acres` field. We deliberately ignore it. This means our `calculatedAreaAcres` may differ from the source's `Acres` value — this is intentional and by design.

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
│   ├── constants.ts       # SRID and conversion constants
│   ├── zoning.importer.ts # Zoning ingestion
│   └── parcels.importer.ts# Parcels ingestion
└── services/              # Application business logic
```

---

## Tech Stack

| Component | Choice                    | Rationale                                  |
| --------- | ------------------------- | ------------------------------------------ |
| Language  | TypeScript                | Type safety, ecosystem                     |
| Runtime   | Node.js 22                | Required by assessment                     |
| Framework | Fastify                   | Fast, schema validation, TypeScript-native |
| ORM       | Drizzle                   | Lightweight, raw SQL support, no magic     |
| Database  | PostgreSQL 16             | Required by assessment                     |
| Spatial   | PostGIS 3.4               | Required by assessment                     |
| Container | Docker Compose            | Reproducible environment                   |
| Testing   | Vitest + Playwright       | Fast unit tests + E2E validation           |
| Linting   | ESLint + Prettier + Biome | Multiple layers of static analysis         |
