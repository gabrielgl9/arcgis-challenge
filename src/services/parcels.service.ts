import { findResidentialParcels } from "../database/repositories/zoning.repository";
import { findAverageLotSize } from "../database/repositories/parcels.repository";

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

export interface AverageLotSizeResult {
  averageLotSizeAcres: number;
  parcelCount: number;
}

export async function getResidentialParcels(
  minArea: number = 0,
): Promise<ResidentialParcelsResult> {
  const parcels = await findResidentialParcels(minArea);
  return { parcels, count: parcels.length };
}

export async function getAverageLotSize(lat: number, lng: number): Promise<AverageLotSizeResult> {
  const row = await findAverageLotSize(lat, lng);
  return {
    averageLotSizeAcres: row.avgLotSize ?? 0,
    parcelCount: row.parcelCount,
  };
}
