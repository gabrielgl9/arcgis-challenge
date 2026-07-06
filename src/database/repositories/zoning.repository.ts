import { sql } from "../connection";

export interface ResidentialParcelRow {
  id: number;
  calculatedAreaAcres: number;
  category: string;
  description: string | null;
}

export async function findResidentialParcels(minArea: number): Promise<ResidentialParcelRow[]> {
  const result = await sql.unsafe<ResidentialParcelRow[]>(
    `
    SELECT p.id, p."calculatedAreaAcres", z.category, z.description
    FROM parcels p
    JOIN zoning z ON ST_Intersects(p.geometry, z.geometry)
    WHERE (z.category LIKE 'R%' OR z.description ILIKE 'Residential%')
      AND p."calculatedAreaAcres" > $1
    ORDER BY p.id
  `,
    [minArea],
  );
  return result;
}
