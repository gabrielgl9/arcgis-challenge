import { beforeEach, describe, expect, it, vi } from "vitest";

const mockImportZoning = vi.fn();
const mockImportParcels = vi.fn();

vi.mock("../ingestion/zoning.importer", () => ({
  importZoning: mockImportZoning,
}));
vi.mock("../ingestion/parcels.importer", () => ({
  importParcels: mockImportParcels,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ingestion.service", () => {
  it("runIngestion calls both importers and returns counts", async () => {
    mockImportZoning.mockResolvedValueOnce(126);
    mockImportParcels.mockResolvedValueOnce(103168);

    const { runIngestion } = await import("./ingestion.service");
    const result = await runIngestion();

    expect(mockImportZoning).toHaveBeenCalledTimes(1);
    expect(mockImportParcels).toHaveBeenCalledTimes(1);
    expect(result.zoningCount).toBe(126);
    expect(result.parcelsCount).toBe(103168);
  });

  it("runIngestion calls importers sequentially", async () => {
    const calls: string[] = [];
    mockImportZoning.mockImplementationOnce(async () => {
      calls.push("zoning");
      return 10;
    });
    mockImportParcels.mockImplementationOnce(async () => {
      calls.push("parcels");
      return 20;
    });

    const { runIngestion } = await import("./ingestion.service");
    await runIngestion();

    expect(calls).toEqual(["zoning", "parcels"]);
  });
});
