# Specification

## Context

Both datasets live behind ArcGIS Feature Services that return paginated GeoJSON-like responses. The application needs a reusable client that abstracts pagination and ArcGIS-specific details away from the importers.

---

## Goal

Implement an ArcGIS HTTP client that handles pagination and returns normalized Feature collections.

---

## Acceptance Criteria

- [ ] `ArcGISClient` class accepts a base URL and optional query parameters
- [ ] `fetchAll()` method iterates through all pages and returns all features
- [ ] `fetchPage(offset, limit)` returns a single page of features
- [ ] Pagination uses ArcGIS `resultOffset` and `resultRecordCount` parameters
- [ ] Client uses `fetch` (Node.js 18+ built-in) — no axios or external HTTP library
- [ ] Client returns a typed `ArcGISFeatureCollection` interface
- [ ] Errors (HTTP, network, malformed JSON) are wrapped in a custom `ArcGISError`
- [ ] Client is unit-testable — HTTP calls can be mocked via dependency injection
- [ ] Max record count per page is configurable (default 1000)

---

## Technical Notes

**ArcGIS Pagination**

ArcGIS Feature Services use:

- `resultOffset=N` — skip N features
- `resultRecordCount=M` — return M features per page

The response includes `features` array and `exceededTransferLimit` boolean.

When `exceededTransferLimit` is true, the client must fetch the next page.

**Interfaces**

```typescript
interface ArcGISFeature {
  attributes: Record<string, unknown>;
  geometry: ArcGISGeometry | null; // geometry may be null for some features
}

interface ArcGISGeometry {
  rings: number[][][];
  spatialReference?: { wkid: number }; // may be absent at feature level
}

interface ArcGISFeatureCollection {
  features: ArcGISFeature[];
  exceededTransferLimit: boolean;
}

interface ArcGISClientOptions {
  baseUrl: string;
  pageSize?: number;
}
```

**Spatial Reference Discovery** — ArcGIS `spatialReference` is returned at the **layer metadata level** (service `?f=json`), not per feature. The client does **not** need to extract SRID from features; this is handled by the importers using known values:

- Zoning service: SRID 2277 (NAD83 / Texas Central ftUS)
- Parcels service: SRID 2278 (NAD83 / Texas South ftUS)

**Error Handling**

- HTTP status !== 200 → `ArcGISError` with status code and body
- JSON parse failure → `ArcGISError` with parse error
- Network failure → `ArcGISError` wrapping the original error

**Testing Approach**

Accept `fetchFn` as a constructor parameter so tests can inject `fetch` mock.

```typescript
constructor(
  private options: ArcGISClientOptions,
  private fetchFn: typeof globalThis.fetch = globalThis.fetch
)
```

---

## Out of Scope

- Business logic
- Data transformation
- Writing to database
- Retry logic or circuit breakers

---

## Definition of Done

- [ ] `ArcGISClient` successfully downloads all pages from the Parcels ArcGIS endpoint
- [ ] `ArcGISClient` successfully downloads all pages from the Zoning ArcGIS endpoint
- [ ] Each dataset returns at least one feature in a test run
- [ ] Errors are caught and reported with meaningful messages
