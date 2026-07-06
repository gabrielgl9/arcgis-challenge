import { importParcels } from "../ingestion/parcels.importer";
import { importZoning } from "../ingestion/zoning.importer";

export async function runIngestion(): Promise<{ zoningCount: number; parcelsCount: number }> {
  const zoningCount = await importZoning();
  const parcelsCount = await importParcels();
  return { zoningCount, parcelsCount };
}
