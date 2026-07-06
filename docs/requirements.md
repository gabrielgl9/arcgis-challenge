# Requirements Document

## Functional Requirements

1. Ingest two ArcGIS Feature Services (Zoning + Parcels) into PostgreSQL
2. Normalize field names and geometry formats
3. Store geometries in PostGIS (SRID 4326)
4. Expose REST API to query the local database (never ArcGIS directly)
5. Identify residential parcels (category starts with "R" OR description starts with "Residential")
6. Compute parcel area from geometry (never from source)
7. Support idempotent re-ingestion (UPSERT)
8. Return parcel statistics grouped by neighborhood (zoning category)

---

## Assumptions

| Assumption | Rationale |
|------------|-----------|
| "Area" in "group by area" means neighborhood (zoning category) | Clarified with stakeholder questions in spec |
| Parcels outside zoning polygons are ignored | They have no zoning classification, so residential rule cannot apply |
| ArcGIS geometry is authoritative | It's the source of truth for parcel boundaries |
| Area is always computed from geometry | Source area fields may be stale or inconsistent |
| Datasets do not change frequently | Assessment does not require incremental sync |
| Single-server deployment | No microservices or horizontal scaling needed |
| The API is consumed programmatically | No UI required |

---

## Open Questions

| Question | Status |
|----------|--------|
| What exactly does "group by area" mean? | **Assumed**: neighborhood = zoning category |
| Should parcels outside Buda be ignored or returned as "Unknown"? | **Assumed**: ignored |
| How should mixed-use zoning be classified? | **Not implemented** — mixed categories (e.g. "R3/R4") are treated as-is |
| Can zoning polygons overlap? | **Assumed**: yes. `ST_Intersects` may return multiple matches per parcel |
| Should imported datasets be versioned? | **Deferred**: not needed for assessment |
| Is incremental synchronization required? | **Deferred**: not needed for assessment |

---

## Constraints

- Time budget: ~4 hours
- No authentication, frontend, caching, or background workers
- All spatial operations must use PostGIS, not TypeScript
- The project must run locally with Docker Compose
