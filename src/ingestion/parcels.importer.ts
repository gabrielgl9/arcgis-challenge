import { config } from "../config";
import { sql } from "../database/connection";
import { ArcGISClient } from "./arcgis.client";
import { PARCELS_SRID, SQ_METERS_PER_ACRE, STORAGE_SRID } from "./constants";
import { normalizeParcelFeature } from "./normalize";

export async function importParcels(): Promise<number> {
  const client = new ArcGISClient({ baseUrl: config.arcgis.parcelsUrl });
  const features = await client.fetchAll();

  for (const feature of features) {
    const normalized = normalizeParcelFeature(feature);
    if (!normalized) continue;

    await sql.unsafe(
      `
      INSERT INTO parcels (id, geometry, "calculatedAreaAcres")
      VALUES (
        $1,
        ST_Transform(ST_GeomFromText($2, ${PARCELS_SRID}), ${STORAGE_SRID}),
        ST_Area(ST_Transform(ST_GeomFromText($2, ${PARCELS_SRID}), ${STORAGE_SRID})::geography) / ${SQ_METERS_PER_ACRE}
      )
      ON CONFLICT (id) DO UPDATE SET
        geometry = EXCLUDED.geometry,
        "calculatedAreaAcres" = EXCLUDED."calculatedAreaAcres"
      `,
      [normalized.id, normalized.wkt],
    );
  }

  return features.length;
}
