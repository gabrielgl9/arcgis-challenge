import { findResidentialParcels } from "../database/repositories/zoning.repository";

export interface ResidentialParcel {
  id: number;
  calculatedAreaAcres: number;
  category: string;
  description: string | null;
}

export interface ResidentialParcelsResult {
  parcels: ResidentialParcel[];
  count: number;
}

export async function getResidentialParcels(
  minArea: number = 0,
): Promise<ResidentialParcelsResult> {
  const parcels = await findResidentialParcels(minArea);
  return { parcels, count: parcels.length };
}
