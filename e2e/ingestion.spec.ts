import { test, expect } from "@playwright/test";

test.describe("Ingestion E2E", () => {
  test("POST /api/ingestion imports both datasets", async ({ request }) => {
    test.setTimeout(600000);

    const response = await request.post("/api/ingestion", {
      timeout: 600000,
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("zoningCount");
    expect(body).toHaveProperty("parcelsCount");
    expect(body.zoningCount).toBeGreaterThan(0);
    expect(body.parcelsCount).toBeGreaterThan(0);
  });

  test("ingestion is idempotent — re-running produces same counts", async ({ request }) => {
    test.setTimeout(600000);

    const res1 = await request.post("/api/ingestion", { timeout: 600000 });
    const body1 = await res1.json();

    const res2 = await request.post("/api/ingestion", { timeout: 600000 });
    const body2 = await res2.json();

    expect(res1.ok()).toBeTruthy();
    expect(res2.ok()).toBeTruthy();

    // UPSERT should keep counts identical between runs
    expect(body1.zoningCount).toBe(body2.zoningCount);
    expect(body1.parcelsCount).toBe(body2.parcelsCount);

    // Verify counts match what's expected
    expect(body1.zoningCount).toBeGreaterThanOrEqual(100);
    expect(body1.parcelsCount).toBeGreaterThanOrEqual(1000);
  });
});
