import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindResidential = vi.fn();

vi.mock("../database/repositories/zoning.repository", () => ({
  findResidentialParcels: mockFindResidential,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parcels.service", () => {
  it("getResidentialParcels returns parcels and count", async () => {
    const fakeParcels = [
      { id: 1, calculatedAreaAcres: 2.0, category: "R1", description: "Estate" },
    ];
    mockFindResidential.mockResolvedValueOnce(fakeParcels);

    const { getResidentialParcels } = await import("./parcels.service");
    const result = await getResidentialParcels(1);

    expect(mockFindResidential).toHaveBeenCalledWith(1);
    expect(result.parcels).toEqual(fakeParcels);
    expect(result.count).toBe(1);
  });

  it("getResidentialParcels defaults minArea to 0", async () => {
    mockFindResidential.mockResolvedValueOnce([]);

    const { getResidentialParcels } = await import("./parcels.service");
    await getResidentialParcels();

    expect(mockFindResidential).toHaveBeenCalledWith(0);
  });

  it("getResidentialParcels returns zero count when no parcels", async () => {
    mockFindResidential.mockResolvedValueOnce([]);

    const { getResidentialParcels } = await import("./parcels.service");
    const result = await getResidentialParcels(5);

    expect(result.count).toBe(0);
    expect(result.parcels).toEqual([]);
  });

  it("getResidentialParcels handles multiple parcels", async () => {
    const parcels = [
      { id: 1, calculatedAreaAcres: 1.5, category: "R1", description: "A" },
      { id: 2, calculatedAreaAcres: 2.0, category: "R2", description: "B" },
      { id: 3, calculatedAreaAcres: 3.0, category: "R3", description: "C" },
    ];
    mockFindResidential.mockResolvedValueOnce(parcels);

    const { getResidentialParcels } = await import("./parcels.service");
    const result = await getResidentialParcels(1);

    expect(result.count).toBe(3);
    expect(result.parcels).toHaveLength(3);
  });
});
