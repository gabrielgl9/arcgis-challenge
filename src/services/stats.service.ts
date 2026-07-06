import { findStatsByNeighborhood } from "../database/repositories/parcels.repository";

export interface NeighborhoodStat {
  neighborhood: string;
  parcelCount: number;
  medianParcelSize: number;
}

export async function getStats(
  _groupBy: string = "neighborhood",
): Promise<{ stats: NeighborhoodStat[] }> {
  const stats = await findStatsByNeighborhood();
  return { stats };
}
