# Specification

## Context

Two ArcGIS datasets (zoning and parcels) must be stored locally in PostgreSQL with PostGIS so the application never queries ArcGIS during normal API requests.

---

## Goal

Create the database tables, enable PostGIS, and generate the first Drizzle migration.

---

## Acceptance Criteria

- [ ] PostGIS extension is enabled via migration
- [ ] `zoning` table exists with columns defined below
- [ ] `parcels` table exists with columns defined below
- [ ] Both tables have a GiST spatial index on the geometry column
- [ ] Migration is generated with `drizzle-kit generate`
- [ ] Migration can be applied with `npm run migrate`

---

## Technical Notes

### zoning table

| Column      | Type                    | Constraints | Notes                                              |
| ----------- | ----------------------- | ----------- | -------------------------------------------------- |
| id          | integer                 | PRIMARY KEY | ArcGIS OBJECTID                                    |
| category    | varchar(50)             | NOT NULL    | Zoning category                                    |
| description | text                    | NULLABLE    | Zoning description                                 |
| landUse     | varchar(100)            | NULLABLE    | Land use classification                            |
| geometry    | geometry(Geometry,4326) | NOT NULL    | Polygon / MultiPolygon stored in WGS84 (SRID 4326) |

### parcels table

| Column              | Type                    | Constraints         | Notes                                              |
| ------------------- | ----------------------- | ------------------- | -------------------------------------------------- |
| id                  | integer                 | PRIMARY KEY         | Parcel identifier (APN or OBJECTID)                |
| geometry            | geometry(Geometry,4326) | NOT NULL            | Polygon / MultiPolygon stored in WGS84 (SRID 4326) |
| calculatedAreaAcres | double precision        | NOT NULL, DEFAULT 0 | Computed from geometry at ingestion                |

**Storage SRID** — All geometries are stored in **EPSG:4326 (WGS84)** regardless of source projection. Conversion from source SRID (Zoning: 2277, Parcels: 2278) happens during ingestion via `ST_Transform`.

**Drizzle Schema** — Use `customType` from `drizzle-orm/pg-core` to define the geometry column since Drizzle does not natively support PostGIS geometry types:

```typescript
const geometry = customType<{ data: string; driverParam: string }>({
  dataType() {
    return "geometry(Geometry, 4326)";
  },
});
```

**Spatial Index**

```sql
CREATE INDEX idx_zoning_geometry ON zoning USING GIST (geometry);
CREATE INDEX idx_parcels_geometry ON parcels USING GIST (geometry);
```

**Migration**

```bash
npx drizzle-kit generate
```

Named script:

```json
"migrate": "drizzle-kit push"
```

---

## Out of Scope

- Seed data
- Ingestion logic
- API routes
- Foreign keys between tables (relationship is spatial, not relational)

---

## Definition of Done

- [ ] `npm run migrate` creates both tables in the running PostgreSQL instance
- [ ] `\dt` inside the container shows `zoning` and `parcels`
- [ ] `\dx` shows `postgis` extension enabled
- [ ] GiST indexes exist on both geometry columns
