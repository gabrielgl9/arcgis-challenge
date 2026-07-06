import { sql } from "../connection";

export interface NeighborhoodStatRow {
  neighborhood: string;
  parcelCount: number;
  medianParcelSize: number;
}

export interface AverageLotSizeRow {
  avgLotSize: number | null;
  parcelCount: number;
}

export async function findStatsByNeighborhood(): Promise<NeighborhoodStatRow[]> {
  const result = await sql.unsafe<NeighborhoodStatRow[]>(
    `
    SELECT
      z.category AS neighborhood,
      COUNT(p.*)::int AS "parcelCount",
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY p."calculatedAreaAcres")::numeric, 4)::float8 AS "medianParcelSize"
    FROM parcels p
    JOIN zoning z ON ST_Intersects(p.geometry, z.geometry)
    GROUP BY z.category
    ORDER BY z.category
  `,
  );
  return result;
}

export async function findAverageLotSize(lat: number, lng: number): Promise<AverageLotSizeRow> {
  const result = await sql.unsafe<AverageLotSizeRow[]>(
    `
    SELECT
      AVG(p."calculatedAreaAcres") AS "avgLotSize",
      COUNT(*)::int AS "parcelCount"
    FROM parcels p
    WHERE ST_DWithin(
      p.geometry::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      1000
    )
  `,
    [lng, lat],
  );
  return result[0] ?? { avgLotSize: null, parcelCount: 0 };
}
