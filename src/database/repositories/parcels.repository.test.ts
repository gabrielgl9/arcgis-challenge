import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUnsafe = vi.fn();

vi.mock("../connection", () => ({
  sql: { unsafe: mockUnsafe },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parcels.repository", () => {
  it("findStatsByNeighborhood builds correct query", async () => {
    mockUnsafe.mockResolvedValueOnce([
      { neighborhood: "R1", parcelCount: 10, medianParcelSize: 0.35 },
      { neighborhood: "R2", parcelCount: 25, medianParcelSize: 0.18 },
    ]);

    const { findStatsByNeighborhood } = await import("./parcels.repository");
    const result = await findStatsByNeighborhood();

    expect(mockUnsafe).toHaveBeenCalledTimes(1);
    const [sql] = mockUnsafe.mock.calls[0];
    expect(sql).toContain("PERCENTILE_CONT(0.5)");
    expect(sql).toContain("ST_Intersects");
    expect(sql).toContain("GROUP BY z.category");
    expect(result).toHaveLength(2);
  });

  it("findStatsByNeighborhood returns empty when no data", async () => {
    mockUnsafe.mockResolvedValueOnce([]);

    const { findStatsByNeighborhood } = await import("./parcels.repository");
    const result = await findStatsByNeighborhood();

    expect(result).toEqual([]);
  });

  it("returns correct shape with multiple stats rows", async () => {
    const rows = [
      { neighborhood: "AG", parcelCount: 5, medianParcelSize: 3.5 },
      { neighborhood: "B1", parcelCount: 12, medianParcelSize: 0.97 },
      { neighborhood: "R1", parcelCount: 8, medianParcelSize: 1.92 },
    ];
    mockUnsafe.mockResolvedValueOnce(rows);

    const { findStatsByNeighborhood } = await import("./parcels.repository");
    const result = await findStatsByNeighborhood();

    expect(result).toHaveLength(3);
    expect(result[0].neighborhood).toBe("AG");
    expect(result[0].parcelCount).toBe(5);
    expect(result[0].medianParcelSize).toBe(3.5);
  });
});
