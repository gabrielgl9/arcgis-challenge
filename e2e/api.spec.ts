import { expect, test } from "@playwright/test";

test.describe("API E2E", () => {
  test("GET /health returns ok", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("GET /api/parcels/residential returns residential parcels", async ({ request }) => {
    const response = await request.get("/api/parcels/residential?minArea=1");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("parcels");
    expect(body).toHaveProperty("count");
    expect(Array.isArray(body.parcels)).toBeTruthy();
    expect(body.count).toBeGreaterThanOrEqual(0);

    for (const parcel of body.parcels) {
      expect(parcel).toHaveProperty("id");
      expect(parcel).toHaveProperty("calculatedAreaAcres");
      expect(parcel).toHaveProperty("category");
      expect(parcel).toHaveProperty("description");
      expect(parcel.calculatedAreaAcres).toBeGreaterThan(1);

      const isResidential =
        parcel.category.startsWith("R") ||
        (parcel.description && parcel.description.startsWith("Residential"));
      expect(isResidential).toBeTruthy();
    }
  });

  test("GET /api/parcels/residential without minArea returns all residential", async ({
    request,
  }) => {
    const response = await request.get("/api/parcels/residential");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.count).toBeGreaterThanOrEqual(0);
  });

  test("GET /api/parcels/residential with invalid minArea returns 400", async ({ request }) => {
    const response = await request.get("/api/parcels/residential?minArea=abc");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/parcels/residential with negative minArea returns 400", async ({ request }) => {
    const response = await request.get("/api/parcels/residential?minArea=-1");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/parcels/average-lot-size returns result", async ({ request }) => {
    const response = await request.get("/api/parcels/average-lot-size?lat=30.1&lng=-97.9");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("averageLotSizeAcres");
    expect(body).toHaveProperty("parcelCount");
    expect(typeof body.averageLotSizeAcres).toBe("number");
    expect(typeof body.parcelCount).toBe("number");
  });

  test("GET /api/parcels/average-lot-size with missing params returns 400", async ({ request }) => {
    const response = await request.get("/api/parcels/average-lot-size");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/parcels/average-lot-size with invalid lat returns 400", async ({ request }) => {
    const response = await request.get("/api/parcels/average-lot-size?lat=abc&lng=-97.9");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/stats returns stats grouped by neighborhood", async ({ request }) => {
    const response = await request.get("/api/stats?groupBy=neighborhood");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("stats");
    expect(Array.isArray(body.stats)).toBeTruthy();
    expect(body.stats.length).toBeGreaterThan(0);

    for (const stat of body.stats) {
      expect(stat).toHaveProperty("neighborhood");
      expect(stat).toHaveProperty("parcelCount");
      expect(stat).toHaveProperty("medianParcelSize");
      expect(typeof stat.neighborhood).toBe("string");
      expect(typeof stat.parcelCount).toBe("number");
      expect(typeof stat.medianParcelSize).toBe("number");
    }
  });

  test("GET /api/stats with invalid groupBy returns 400", async ({ request }) => {
    const response = await request.get("/api/stats?groupBy=invalid");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
