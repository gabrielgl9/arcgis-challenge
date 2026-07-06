import { config } from "../config";
import { sql } from "../database/connection";
import { ArcGISClient } from "./arcgis.client";
import { STORAGE_SRID, ZONING_SRID } from "./constants";
import { normalizeZoningFeature } from "./normalize";

export async function importZoning(): Promise<number> {
  const client = new ArcGISClient({ baseUrl: config.arcgis.zoningUrl });
  const features = await client.fetchAll();

  for (const feature of features) {
    const normalized = normalizeZoningFeature(feature);
    if (!normalized) continue;

    await sql.unsafe(
      `
      INSERT INTO zoning (id, category, description, "landUse", geometry)
      VALUES ($1, $2, $3, $4, ST_Transform(ST_GeomFromText($5, ${ZONING_SRID}), ${STORAGE_SRID}))
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        "landUse" = EXCLUDED."landUse",
        geometry = EXCLUDED.geometry
      `,
      [
        normalized.id,
        normalized.category,
        normalized.description,
        normalized.landUse,
        normalized.wkt,
      ],
    );
  }

  return features.length;
}
