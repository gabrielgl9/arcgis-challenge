import { sql } from "../connection";

export interface NeighborhoodStatRow {
  neighborhood: string;
  parcelCount: number;
  medianParcelSize: number;
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
