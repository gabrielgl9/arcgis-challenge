# Specification

## Context

After the ArcGIS client downloads raw features, the application must normalize the data (field mapping, geometry conversion) and persist it into PostgreSQL using idempotent UPSERT operations.

---

## Goal

Build the two importers (zoning, parcels) and the normalization layer that transforms ArcGIS features into database records.

---

## Acceptance Criteria

- [ ] `zoning.importer.ts` downloads, normalizes, and upserts zoning data
- [ ] `parcels.importer.ts` downloads, normalizes, and upserts parcel data
- [ ] `normalize.ts` contains shared normalization utilities
- [ ] Zoning normalization maps ArcGIS attributes to database columns
- [ ] Parcel normalization maps ArcGIS attributes to database columns
- [ ] ArcGIS geometry (`rings`) is converted to PostGIS-compatible WKT or GeoJSON
- [ ] Parcel `calculatedAreaAcres` is computed using `ST_Area` on the geometry (never from source)
- [ ] Upsert uses `ON CONFLICT (id) DO UPDATE` (Drizzle raw SQL)
- [ ] Running the pipeline twice produces no duplicate records
- [ ] `POST /api/ingestion` triggers both importers sequentially

---

## Technical Notes

### Field Mapping

**Zoning (confirmed from live API)**

| ArcGIS attribute   | DB column   | Notes                   |
| ------------------ | ----------- | ----------------------- |
| OBJECTID           | id          | Primary key             |
| Zoning_Category    | category    | Zoning category         |
| Zoning_Description | description | Zoning description      |
| Land_Use           | landUse     | Land use classification |

**Parcels (confirmed from live API)**

| ArcGIS attribute | DB column           | Notes                 |
| ---------------- | ------------------- | --------------------- |
| OBJECTID         | id                  | Primary key           |
| (geometry)       | geometry            | Converted from ArcGIS |
| (computed)       | calculatedAreaAcres | Computed via PostGIS  |

### Spatial Reference (SRID)

Each ArcGIS service uses a different projected coordinate system. The `spatialReference` is returned at the **layer level** (service metadata), not per feature.

| Dataset | Source SRID | Description                  |
| ------- | ----------- | ---------------------------- |
| Zoning  | EPSG:2277   | NAD83 / Texas Central (ftUS) |
| Parcels | EPSG:2278   | NAD83 / Texas South (ftUS)   |

All geometries must be transformed to EPSG:4326 (WGS84) for storage using `ST_Transform(geom, 4326)`.

### Geometry Conversion

ArcGIS polygons use `rings` format (already closed — first point equals last):

```json
{
  "rings": [[[x1,y1], [x2,y2], ..., [x1,y1]]]
}
```

Convert to **WKT** (Well-Known Text) for insertion:

- Single ring → `POLYGON((x1 y1, x2 y2, ...))`
- Multiple rings → `MULTIPOLYGON(((x1 y1, ...)), ((x2 y2, ...)))`

Note: Multi-ring geometries use **double parentheses** per polygon in WKT: `((coords))`.

### Null Geometry Handling

Some features may have `geometry: null` or empty `rings` arrays. These features must be **skipped** during normalization — the normalizer returns `null` and the importer calls `continue`.

```typescript
const normalized = normalizeZoningFeature(feature);
if (!normalized) continue;
```

### UPSERT

Use Drizzle raw SQL with `ST_Transform` to convert from source SRID to WGS84:

**Zoning** (source SRID 2277):

```sql
INSERT INTO zoning (id, category, description, "landUse", geometry)
VALUES ($1, $2, $3, $4, ST_Transform(ST_GeomFromText($5, 2277), 4326))
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  "landUse" = EXCLUDED."landUse",
  geometry = EXCLUDED.geometry;
```

**Parcels** (source SRID 2278) — area computed from geometry:

```sql
INSERT INTO parcels (id, geometry, "calculatedAreaAcres")
VALUES (
  $1,
  ST_Transform(ST_GeomFromText($2, 2278), 4326),
  ST_Area(ST_Transform(ST_GeomFromText($2, 2278), 4326)::geography) / 4046.86
)
ON CONFLICT (id) DO UPDATE SET
  geometry = EXCLUDED.geometry,
  "calculatedAreaAcres" = EXCLUDED."calculatedAreaAcres";
```

Area is always computed from geometry (`ST_Area` with geography cast for meter-accuracy), never from source fields.

### Pipeline Entry Point

```typescript
// src/ingestion/pipeline.ts
export async function runIngestionPipeline(): Promise<void> {
  await importZoning();
  await importParcels();
}
```

---

## Out of Scope

- Incremental / delta imports
- Data validation beyond basic type checks
- Transactional rollback on partial failure (single-pass is acceptable)
- Background scheduling

---

## Definition of Done

- [ ] `POST /api/ingestion` completes successfully and both tables have records
- [ ] Running it twice produces the same record count (no duplicates)
- [ ] Parcels have `calculatedAreaAcres` populated with values > 0
- [ ] Geometry is stored as PostGIS geometry, not as raw JSON
