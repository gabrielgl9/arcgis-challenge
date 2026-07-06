import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResidentialParcelRow } from "./zoning.repository";

const mockUnsafe = vi.fn();

vi.mock("../connection", () => ({
  sql: { unsafe: mockUnsafe },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("zoning.repository", () => {
  it("findResidentialParcels builds correct query", async () => {
    mockUnsafe.mockResolvedValueOnce([
      { id: 1, calculatedAreaAcres: 2.5, category: "R1", description: "Estate Residential" },
    ]);

    const { findResidentialParcels } = await import("./zoning.repository");
    const result = await findResidentialParcels(1);

    expect(mockUnsafe).toHaveBeenCalledTimes(1);
    const [sql, params] = mockUnsafe.mock.calls[0];
    expect(params).toEqual([1]);
    expect(sql).toContain("ST_Intersects");
    expect(sql).toContain("LIKE 'R%'");
    expect(sql).toContain("ILIKE 'Residential%'");
    expect(sql).toContain("> $1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("findResidentialParcels returns empty array when no matches", async () => {
    mockUnsafe.mockResolvedValueOnce([]);

    const { findResidentialParcels } = await import("./zoning.repository");
    const result = await findResidentialParcels(100);

    expect(result).toEqual([]);
  });

  it("findResidentialParcels with minArea=0 returns all residential", async () => {
    mockUnsafe.mockResolvedValueOnce([
      { id: 1, calculatedAreaAcres: 0.1, category: "R1", description: "Estate Residential" },
      { id: 2, calculatedAreaAcres: 0.2, category: "R2", description: "Suburban Residential" },
    ]);

    const { findResidentialParcels } = await import("./zoning.repository");
    const result = await findResidentialParcels(0);

    expect(result).toHaveLength(2);
  });

  it("returns typed rows correctly", async () => {
    const fakeRow: ResidentialParcelRow = {
      id: 42,
      calculatedAreaAcres: 1.5,
      category: "R3",
      description: "1&2 Family Residential",
    };
    mockUnsafe.mockResolvedValueOnce([fakeRow]);

    const { findResidentialParcels } = await import("./zoning.repository");
    const [row] = await findResidentialParcels(0.5);

    expect(row.id).toBe(42);
    expect(row.calculatedAreaAcres).toBe(1.5);
    expect(row.category).toBe("R3");
    expect(row.description).toBe("1&2 Family Residential");
  });
});
