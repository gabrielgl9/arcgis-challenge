# Parcels & Zoning Data Pipeline

Ingests two ArcGIS Feature Services (Hays County Parcels + City of Buda Zoning) into PostgreSQL/PostGIS and exposes a REST API for spatial queries.

> **Goal**: Answer questions like "Show all residential parcels larger than one acre."

---

## Quick Start

```bash
# 1. Start PostgreSQL with PostGIS
docker compose up -d

# 2. Install dependencies
npm install

# 3. Run migrations (creates tables + indexes)
npm run migrate

# 4. Start the server (development)
npm run dev
```

## API Endpoints

### Ingestion

Downloads both datasets from ArcGIS and upserts into PostgreSQL. Takes ~5 minutes.

```bash
curl -X POST http://localhost:3000/api/ingestion
```

### Residential Parcels

Returns parcels that intersect residential zoning (category starts with `R` or description starts with `Residential`), filtered by minimum acreage.

```bash
curl "http://localhost:3000/api/parcels/residential?minArea=1"
```

### Statistics

Returns parcel count and median parcel size grouped by zoning category.

```bash
curl "http://localhost:3000/api/stats?groupBy=neighborhood"
```

### Health

```bash
curl http://localhost:3000/health
```

---

## Tech Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Runtime   | Node.js 22 + TypeScript     |
| Framework | Fastify                     |
| Database  | PostgreSQL 16 + PostGIS 3.4 |
| ORM       | Drizzle                     |
| Testing   | Vitest + Playwright         |
| Linting   | ESLint, Prettier, Biome     |
| Container | Docker Compose              |

---

## Project Structure

```
.agents/skills/           # Agent skills (workflows)
ai-docs/specs/            # Specification documents
docs/                     # Design docs, requirements, process
e2e/                      # Playwright E2E tests
src/
├── api/
│   ├── controllers/      # HTTP handlers
│   └── routes/           # Fastify route registration
├── database/
│   ├── schema/           # Drizzle table definitions
│   ├── migrations/       # SQL migration files
│   └── repositories/     # Raw SQL queries
├── ingestion/
│   ├── arcgis.client.ts  # HTTP client with pagination
│   ├── normalize.ts      # Field mapping + WKT conversion
│   ├── constants.ts      # SRID and conversion constants
│   ├── zoning.importer.ts
│   └── parcels.importer.ts
└── services/             # Business logic orchestration
```

---

## Scripts

| Script                  | Purpose                        |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start server with hot reload   |
| `npm run migrate`       | Apply database migrations      |
| `npm test`              | Run unit tests (Vitest)        |
| `npm run test:e2e`      | Run E2E tests (Playwright)     |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck`     | TypeScript type checking       |
| `npm run lint`          | ESLint                         |
| `npm run format`        | Prettier check                 |
| `npm run check`         | Biome check                    |

---

## Key Design Decisions

- **Spatial join** — parcels and zoning have no foreign key; relationship is via `ST_Intersects`
- **SRID normalization** — all geometries stored in EPSG:4326 (converted from source SRIDs 2277/2278)
- **Area from geometry** — `ST_Area(geom::geography) / 4046.86`, never from source fields
- **Idempotent ingestion** — `ON CONFLICT (id) DO UPDATE` prevents duplicates
- **No direct ArcGIS access** — API queries local database only

---

## Docs

| Document               | Description                        |
| ---------------------- | ---------------------------------- |
| `docs/design.md`       | Architecture, decisions, tradeoffs |
| `docs/requirements.md` | Assumptions, open questions        |
| `docs/process.md`      | Development process, AI usage      |

---

## License

Take-home assessment. Not for production use.
