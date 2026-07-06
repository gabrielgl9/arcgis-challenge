import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindStats = vi.fn();

vi.mock("../database/repositories/parcels.repository", () => ({
  findStatsByNeighborhood: mockFindStats,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("stats.service", () => {
  it("getStats returns stats grouped by neighborhood", async () => {
    const fakeStats = [
      { neighborhood: "R1", parcelCount: 10, medianParcelSize: 0.35 },
      { neighborhood: "R2", parcelCount: 25, medianParcelSize: 0.18 },
    ];
    mockFindStats.mockResolvedValueOnce(fakeStats);

    const { getStats } = await import("./stats.service");
    const result = await getStats("neighborhood");

    expect(mockFindStats).toHaveBeenCalledTimes(1);
    expect(result.stats).toEqual(fakeStats);
  });

  it("getStats returns empty stats when no data", async () => {
    mockFindStats.mockResolvedValueOnce([]);

    const { getStats } = await import("./stats.service");
    const result = await getStats("neighborhood");

    expect(result.stats).toEqual([]);
  });
});
