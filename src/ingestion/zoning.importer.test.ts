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

function makeZoningFeature(overrides: Partial<ArcGISFeature> = {}): ArcGISFeature {
  return {
    attributes: {
      OBJECTID: 1,
      Zoning_Category: "R1",
      Zoning_Description: "Estate Residential",
      Land_Use: "Single Family",
    },
    geometry: {
      rings: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
      spatialReference: { wkid: 2277 },
    },
    ...overrides,
  };
}

describe("zoning.importer", () => {
  it("inserts features and returns count", async () => {
    mockFetchAll.mockResolvedValueOnce([makeZoningFeature()]);
    mockUnsafe.mockResolvedValueOnce(undefined);

    const { importZoning } = await import("./zoning.importer");
    const count = await importZoning();

    expect(count).toBe(1);
    expect(mockUnsafe).toHaveBeenCalledTimes(1);
    const [sql, params] = mockUnsafe.mock.calls[0];
    expect(sql).toContain("INSERT INTO zoning");
    expect(sql).toContain("ON CONFLICT (id) DO UPDATE");
    expect(params[0]).toBe(1);
    expect(params[1]).toBe("R1");
    expect(params[4]).toContain("POLYGON");
  });

  it("skips features with null geometry", async () => {
    mockFetchAll.mockResolvedValueOnce([
      makeZoningFeature({ geometry: null }),
      makeZoningFeature({ attributes: { OBJECTID: 2, Zoning_Category: "B3" } }),
      makeZoningFeature(),
    ]);

    const { importZoning } = await import("./zoning.importer");
    const count = await importZoning();

    expect(count).toBe(3);
    expect(mockUnsafe).toHaveBeenCalledTimes(2);
  });

  it("handles empty feature list", async () => {
    mockFetchAll.mockResolvedValueOnce([]);

    const { importZoning } = await import("./zoning.importer");
    const count = await importZoning();

    expect(count).toBe(0);
    expect(mockUnsafe).not.toHaveBeenCalled();
  });

  it("uses UPSERT for idempotency", async () => {
    mockFetchAll.mockResolvedValueOnce([makeZoningFeature()]);
    mockUnsafe.mockResolvedValueOnce(undefined);

    const { importZoning } = await import("./zoning.importer");
    await importZoning();

    const [sql] = mockUnsafe.mock.calls[0];
    expect(sql).toContain("ON CONFLICT (id) DO UPDATE");
  });
});
