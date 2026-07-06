# Specification

## Context

After data is ingested, the application must expose REST endpoints that answer spatial questions — specifically: "show residential parcels larger than one acre" and "show statistics grouped by neighborhood."

---

## Goal

Implement three REST endpoints: ingestion trigger, residential parcels query, and statistics aggregation.

---

## Acceptance Criteria

- [ ] `POST /api/ingestion` triggers full pipeline and returns `{ status: "ok" }`
- [ ] `GET /api/parcels/residential?minArea=1` returns residential parcels > minArea acres
- [ ] Residential rule: category starts with "R" OR description starts with "Residential"
- [ ] Parcels outside zoning polygons are excluded from results
- [ ] `GET /api/stats?groupBy=neighborhood` returns parcel count and median parcel size
- [ ] "Neighborhood" refers to the zoning `landUse` or `category` field
- [ ] All responses are JSON with appropriate HTTP status codes
- [ ] Errors return `{ error: string }` with appropriate status code
- [ ] Fastify route registration is clean and follows the project's structure

---

## Technical Notes

All geometries are stored in **EPSG:4326 (WGS84)**, so spatial predicates work directly without SRID transformations at query time.

### Residential Query

Use a spatial join between parcels and zoning. A parcel is residential when its intersecting zoning polygon has a category starting with `R` or a description starting with `Residential`:

```sql
SELECT p.id, p."calculatedAreaAcres", z.category, z.description
FROM parcels p
JOIN zoning z ON ST_Intersects(p.geometry, z.geometry)
WHERE (z.category LIKE 'R%' OR z.description ILIKE 'Residential%')
  AND p."calculatedAreaAcres" > $1
ORDER BY p.id;
```

`minArea` defaults to 0 if not provided.

Parcels that do not intersect any zoning polygon are excluded from results.

### Stats Query

Average (median) parcel size grouped by zoning category (neighborhood):

```sql
SELECT
  z.category AS neighborhood,
  COUNT(p.*)::int AS "parcelCount",
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY p."calculatedAreaAcres")::numeric, 4)::float8 AS "medianParcelSize"
FROM parcels p
JOIN zoning z ON ST_Intersects(p.geometry, z.geometry)
GROUP BY z.category
ORDER BY z.category;
```

Median uses `PERCENTILE_CONT(0.5)` for accurate percentile calculation.

`groupBy` parameter determines the grouping column. Currently only `neighborhood` (mapped to `z.category`) is valid.

### Controllers & Routes

```
src/
  api/
    controllers/
      ingestion.controller.ts
      parcels.controller.ts
      stats.controller.ts
    routes/
      ingestion.routes.ts
      parcels.routes.ts
      stats.routes.ts
```

Controllers handle request parsing and response formatting. Routes register paths on the Fastify instance. Controllers must NOT contain business logic — they delegate to services.

### Services

```
src/
  services/
    ingestion.service.ts
    parcels.service.ts
    stats.service.ts
```

Services contain application rules and use repositories for data access.

### Repositories

```
src/
  database/
    repositories/
      zoning.repository.ts
      parcels.repository.ts
```

Repositories contain only raw SQL / Drizzle queries.

### Response Format

**POST /api/ingestion**

```json
{ "status": "ok" }
```

**GET /api/parcels/residential?minArea=1**

```json
{
  "parcels": [
    {
      "id": 123,
      "calculatedAreaAcres": 2.5,
      "category": "R1",
      "description": "Residential Single Family"
    }
  ],
  "count": 1
}
```

**GET /api/stats?groupBy=neighborhood**

```json
{
  "stats": [
    {
      "neighborhood": "R1",
      "parcelCount": 150,
      "medianParcelSize": 0.35
    }
  ]
}
```

---

## Out of Scope

- Authentication
- Pagination on query endpoints (datasets are small enough)
- CSV/GeoJSON export
- Rate limiting

---

## Definition of Done

- [ ] All three endpoints return correct data against the ingested database
- [ ] Residential query correctly applies the "starts with R / starts with Residential" rule
- [ ] Stats query returns correct counts and median values
- [ ] Parcels outside zoning polygons are not returned
- [ ] API responds within reasonable time (< 5s on local machine)
