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
9. Average lot size within 1 km of a given point (stretch)

---

## Non-Functional Requirements (Implied)

| Requirement                            | Implication                                   |
| -------------------------------------- | --------------------------------------------- |
| Must run locally                       | Docker Compose for reproducibility            |
| No external dependencies at query time | ArcGIS only during ingestion                  |
| Must handle real datasets              | 126 zoning polygons, 103k parcels             |
| Must be explainable in an interview    | Clean architecture, simple code               |
| Time budget of ~4 hours                | Deliberate simplicity, avoid over-engineering |

---

## Assumptions

| Assumption                                                     | Rationale                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| "Area" in "group by area" means neighborhood (zoning category) | Clarified with stakeholder questions in spec                              |
| Parcels outside zoning polygons are ignored                    | They have no zoning classification, so residential rule cannot apply      |
| ArcGIS geometry is authoritative                               | It's the source of truth for parcel boundaries                            |
| Area is always computed from geometry                          | Source area fields may be stale or inconsistent                           |
| Datasets do not change frequently                              | Assessment does not require incremental sync                              |
| Single-server deployment                                       | No microservices or horizontal scaling needed                             |
| The API is consumed programmatically                           | No UI required                                                            |
| Both datasets use the same coordinate reference system (feet)  | Confirmed by inspecting API metadata: both use NAD83 / Texas zones (ftUS) |

---

## Ambiguities in the Brief

### "Group by area" — three possible meanings

The assessment asks to group statistics "by area" without defining the term. This is the most significant ambiguity:

| Interpretation                                  | Pros                                                              | Cons                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| **Zoning category** (what we chose)             | Dataset has clean categories; directly relates to zoning question | Parcels spanning multiple zones appear in multiple groups   |
| **Neighborhood name** (if available in parcels) | More intuitive "area" meaning                                     | Not present in the parcels dataset attributes we received   |
| **Geographic grid** (e.g., 1 km² cells)         | Purely spatial, no dataset dependency                             | Requires grid generation logic; harder to interpret results |

**What we assumed**: "Area" = zoning category. This felt closest to the original intent since the assessment is about zoning + parcels.

### Mixed-use zoning

Some zoning categories combine multiple designations (e.g., "R3/R4", "B2/R5"). The residential rule checks `category LIKE 'R%'`, which correctly identifies these as residential. But the statistics group treats them as a separate neighborhood, which may or may not be desired.

### "Show all residential parcels larger than one acre"

This requires a spatial join between parcels and zoning. But:

- A parcel may intersect **multiple** zoning districts
- If any intersecting zone is residential, the parcel qualifies
- But the response doesn't indicate **which** zone triggered the match

Our implementation returns one row per parcel-zone match, so a parcel in two residential zones appears twice. This is documentable behavior but may surprise consumers expecting unique parcels.

---

## Open Questions for Stakeholders

| Question                                                         | Current Status                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| What exactly does "group by area" mean?                          | **Assumed**: neighborhood = zoning category                              |
| Should parcels outside Buda be ignored or returned as "Unknown"? | **Assumed**: ignored                                                     |
| How should mixed-use zoning be classified?                       | **Not implemented** — treated as-is (e.g. "R3/R4" is its own group)      |
| Can zoning polygons overlap?                                     | **Assumed**: yes. `ST_Intersects` may return multiple matches per parcel |
| Should imported datasets be versioned?                           | **Deferred**: not needed for assessment                                  |
| Is incremental synchronization required?                         | **Deferred**: not needed for assessment                                  |

---

## Constraints

- Time budget: ~4 hours
- No authentication, frontend, caching, or background workers
- All spatial operations must use PostGIS, not TypeScript
- The project must run locally with Docker Compose
- No external services at query time — ArcGIS is ingestion-only
