import { describe, expect, it } from "vitest";
import type { ArcGISFeature } from "./arcgis.client";
import { normalizeParcelFeature, normalizeZoningFeature } from "./normalize";

function makeFeature(overrides: Partial<ArcGISFeature> = {}): ArcGISFeature {
  return {
    attributes: {
      OBJECTID: 42,
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
          [0, 1],
          [0, 0],
        ],
      ],
      spatialReference: { wkid: 2277 },
    },
    ...overrides,
  };
}

describe("normalizeZoningFeature", () => {
  it("maps OBJECTID to id", () => {
    const result = normalizeZoningFeature(makeFeature());
    expect(result?.id).toBe(42);
  });

  it("maps Zoning_Category to category", () => {
    const result = normalizeZoningFeature(makeFeature());
    expect(result?.category).toBe("R1");
  });

  it("maps Zoning_Description to description", () => {
    const result = normalizeZoningFeature(makeFeature());
    expect(result?.description).toBe("Estate Residential");
  });

  it("maps Land_Use to landUse", () => {
    const result = normalizeZoningFeature(makeFeature());
    expect(result?.landUse).toBe("Single Family");
  });

  it("converts single-ring geometry to POLYGON WKT", () => {
    const result = normalizeZoningFeature(makeFeature());
    expect(result?.wkt).toBe("POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))");
  });

  it("converts multi-ring geometry to MULTIPOLYGON WKT", () => {
    const feature = makeFeature({
      geometry: {
        rings: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
          [
            [2, 2],
            [3, 2],
            [3, 3],
            [2, 2],
          ],
        ],
        spatialReference: { wkid: 2277 },
      },
    });
    const result = normalizeZoningFeature(feature);
    expect(result?.wkt).toBe("MULTIPOLYGON(((0 0, 1 0, 1 1, 0 0)), ((2 2, 3 2, 3 3, 2 2)))");
  });

  it("returns null when feature has null geometry", () => {
    const feature = makeFeature({ geometry: null });
    const result = normalizeZoningFeature(feature);
    expect(result).toBeNull();
  });

  it("returns null when rings array is empty", () => {
    const feature = makeFeature({
      geometry: { rings: [], spatialReference: { wkid: 2277 } },
    });
    const result = normalizeZoningFeature(feature);
    expect(result).toBeNull();
  });

  it("handles missing optional attributes as null", () => {
    const feature = makeFeature({
      attributes: { OBJECTID: 99, Zoning_Category: "B3" },
    });
    const result = normalizeZoningFeature(feature);
    expect(result?.description).toBeNull();
    expect(result?.landUse).toBeNull();
  });

  it("uses empty string for missing category", () => {
    const feature = makeFeature({
      attributes: { OBJECTID: 99 },
    });
    const result = normalizeZoningFeature(feature);
    expect(result?.category).toBe("");
  });
});

describe("normalizeParcelFeature", () => {
  it("maps OBJECTID to id", () => {
    const result = normalizeParcelFeature(makeFeature());
    expect(result?.id).toBe(42);
  });

  it("converts single-ring geometry to POLYGON WKT", () => {
    const result = normalizeParcelFeature(makeFeature());
    expect(result?.wkt).toBe("POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))");
  });

  it("returns null when geometry is null", () => {
    const result = normalizeParcelFeature(makeFeature({ geometry: null }));
    expect(result).toBeNull();
  });
});
