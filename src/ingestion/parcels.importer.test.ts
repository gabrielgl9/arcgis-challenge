import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArcGISFeature } from "./arcgis.client";

const mockFetchAll = vi.fn();
const mockUnsafe = vi.fn();

class MockArcGISClient {
  constructor(_options: unknown) {}
  fetchAll = mockFetchAll;
}

vi.mock("./arcgis.client", () => ({ ArcGISClient: MockArcGISClient }));
vi.mock("../database/connection", () => ({ sql: { unsafe: mockUnsafe } }));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeParcelFeature(overrides: Partial<ArcGISFeature> = {}): ArcGISFeature {
  return {
    attributes: { OBJECTID: 1 },
    geometry: {
      rings: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
      spatialReference: { wkid: 2278 },
    },
    ...overrides,
  };
}

describe("parcels.importer", () => {
  it("inserts features and returns count", async () => {
    mockFetchAll.mockResolvedValueOnce([makeParcelFeature()]);
    mockUnsafe.mockResolvedValueOnce(undefined);

    const { importParcels } = await import("./parcels.importer");
    const count = await importParcels();

    expect(count).toBe(1);
    expect(mockUnsafe).toHaveBeenCalledTimes(1);
    const [sql, params] = mockUnsafe.mock.calls[0];
    expect(sql).toContain("INSERT INTO parcels");
    expect(sql).toContain("ST_Area");
    expect(sql).toContain("ON CONFLICT (id) DO UPDATE");
    expect(params[0]).toBe(1);
    expect(params[1]).toContain("POLYGON");
  });

  it("skips features with null geometry", async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeParcelFeature({ geometry: null }),
      makeParcelFeature(),
    ]);

    const { importParcels } = await import("./parcels.importer");
    await importParcels();

    expect(mockUnsafe).toHaveBeenCalledTimes(1);
  });

  it("handles empty feature list", async () => {
    mockFetchAll.mockResolvedValueOnce([]);

    const { importParcels } = await import("./parcels.importer");
    const count = await importParcels();

    expect(count).toBe(0);
    expect(mockUnsafe).not.toHaveBeenCalled();
  });

  it("uses UPSERT for idempotency", async () => {
    mockFetchAll.mockResolvedValueOnce([makeParcelFeature()]);
    mockUnsafe.mockResolvedValueOnce(undefined);

    const { importParcels } = await import("./parcels.importer");
    await importParcels();

    const [sql] = mockUnsafe.mock.calls[0];
    expect(sql).toContain("ON CONFLICT (id) DO UPDATE");
  });
});
