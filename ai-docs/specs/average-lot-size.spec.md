# Specification

## Context

A stretch goal: compute the average lot size within a 1 km radius of a given point. This demonstrates advanced PostGIS spatial query capability.

---

## Goal

Implement `GET /api/parcels/average-lot-size?lat=...&lng=...` that returns the average `calculatedAreaAcres` of all parcels within 1 km of the given coordinates.

---

## Acceptance Criteria

- [ ] Endpoint accepts `lat` and `lng` query parameters (required)
- [ ] Endpoint returns `{ averageLotSizeAcres: number, parcelCount: number }`
- [ ] Radius calculation uses `ST_DWithin` with geography cast for meter-accurate distance
- [ ] Invalid coordinates (non-numeric, out of range) return 400 with error message
- [ ] If no parcels are found within 1 km, returns `{ averageLotSizeAcres: 0, parcelCount: 0 }`

---

## Technical Notes

**SQL Query**

```sql
SELECT
  AVG(p."calculatedAreaAcres") AS avg_lot_size,
  COUNT(*) AS parcel_count
FROM parcels p
WHERE ST_DWithin(
  p.geometry::geography,
  ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography,
  1000
);
```

Using `::geography` cast ensures the 1000 meter distance is calculated correctly on the spheroid.

**Route Registration**

```
GET /api/parcels/average-lot-size
```

**Response Format**

```json
{
  "averageLotSizeAcres": 0.42,
  "parcelCount": 87
}
```

---

## Out of Scope

- Optional radius parameter (fixed at 1 km)
- GeoJSON output
- Caching

---

## Definition of Done

- [ ] Endpoint returns correct results for known coordinates
- [ ] Invalid input returns 400
- [ ] No parcels in range returns zeroes, not an error
