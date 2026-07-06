import type { ArcGISFeature } from "./arcgis.client";

export interface NormalizedZoning {
  id: number;
  category: string;
  description: string | null;
  landUse: string | null;
  wkt: string;
}

export interface NormalizedParcel {
  id: number;
  wkt: string;
}

function ringsToWkt(rings: number[][][]): string | null {
  if (!rings || rings.length === 0 || rings[0].length === 0) return null;

  const toCoordString = (ring: number[][]) => ring.map((p) => `${p[0]} ${p[1]}`).join(", ");

  if (rings.length === 1) {
    return `POLYGON((${toCoordString(rings[0])}))`;
  }

  const polygons = rings.map((ring) => `((${toCoordString(ring)}))`).join(", ");

  return `MULTIPOLYGON(${polygons})`;
}

export function normalizeZoningFeature(feature: ArcGISFeature): NormalizedZoning | null {
  const attrs = feature.attributes;
  const wkt = feature.geometry ? ringsToWkt(feature.geometry.rings) : null;

  if (!wkt) return null;

  return {
    id: attrs.OBJECTID as number,
    category: (attrs.Zoning_Category as string) ?? "",
    description: (attrs.Zoning_Description as string | null) ?? null,
    landUse: (attrs.Land_Use as string | null) ?? null,
    wkt,
  };
}

export function normalizeParcelFeature(feature: ArcGISFeature): NormalizedParcel | null {
  const wkt = feature.geometry ? ringsToWkt(feature.geometry.rings) : null;

  if (!wkt) return null;

  return {
    id: feature.attributes.OBJECTID as number,
    wkt,
  };
}
