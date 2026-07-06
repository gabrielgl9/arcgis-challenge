import { describe, expect, it, vi } from "vitest";
import type { ArcGISFeatureCollection } from "./arcgis.client";
import { ArcGISClient, ArcGISError } from "./arcgis.client";

function createMockResponse(body: ArcGISFeatureCollection, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(status === 200 ? JSON.stringify(body) : "Not Found"),
  } as Response;
}

describe("ArcGISClient", () => {
  describe("fetchPage", () => {
    it("makes a GET request with correct query params", async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        createMockResponse({
          features: [],
          exceededTransferLimit: false,
        }),
      );

      const client = new ArcGISClient(
        {
          baseUrl: "https://example.com/arcgis/rest/services/Layer/FeatureServer/0/query",
          pageSize: 500,
        },
        fetchFn,
      );

      await client.fetchPage(100, 500);

      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("resultOffset=100");
      expect(url).toContain("resultRecordCount=500");
      expect(url).toContain("where=1%3D1");
      expect(url).toContain("outFields=*");
      expect(url).toContain("returnGeometry=true");
      expect(url).toContain("f=json");
    });

    it("returns the feature collection on success", async () => {
      const mockResponse: ArcGISFeatureCollection = {
        features: [
          {
            attributes: { OBJECTID: 1 },
            geometry: { rings: [], spatialReference: { wkid: 4326 } },
          },
        ],
        exceededTransferLimit: false,
      };

      const fetchFn = vi.fn().mockResolvedValue(createMockResponse(mockResponse));
      const client = new ArcGISClient({ baseUrl: "http://example.com/query" }, fetchFn);

      const result = await client.fetchPage(0, 10);
      expect(result.features).toHaveLength(1);
      expect(result.features[0].attributes.OBJECTID).toBe(1);
    });

    it("throws ArcGISError on non-200 response", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValue(createMockResponse({ features: [], exceededTransferLimit: false }, 404));
      const client = new ArcGISClient({ baseUrl: "http://example.com/query" }, fetchFn);

      await expect(client.fetchPage(0, 10)).rejects.toThrow(ArcGISError);
      await expect(client.fetchPage(0, 10)).rejects.toThrow("ArcGIS request failed: 404");
    });

    it("throws ArcGISError on malformed JSON", async () => {
      const fetchFn = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.reject(new Error("Unexpected token")),
        text: () => Promise.resolve("not json"),
      } as Response);

      const client = new ArcGISClient({ baseUrl: "http://example.com/query" }, fetchFn);

      await expect(client.fetchPage(0, 10)).rejects.toThrow(ArcGISError);
      await expect(client.fetchPage(0, 10)).rejects.toThrow("Failed to parse ArcGIS response");
    });

    it("uses custom fetchFn when provided", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ features: [], exceededTransferLimit: false }));
      const client = new ArcGISClient({ baseUrl: "http://example.com/query" }, mockFetch);

      await client.fetchPage(0, 10);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchAll", () => {
    it("fetches all pages when exceededTransferLimit is true", async () => {
      let callCount = 0;

      const fetchFn = vi.fn().mockImplementation(() => {
        callCount++;
        const isLastPage = callCount >= 3;
        return Promise.resolve(
          createMockResponse({
            features: [
              {
                attributes: { OBJECTID: callCount },
                geometry: null,
              },
            ],
            exceededTransferLimit: !isLastPage,
          }),
        );
      });

      const client = new ArcGISClient(
        { baseUrl: "http://example.com/query", pageSize: 2 },
        fetchFn,
      );

      const result = await client.fetchAll();
      expect(result).toHaveLength(3);
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });

    it("uses default pageSize of 1000", async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        createMockResponse({
          features: [],
          exceededTransferLimit: false,
        }),
      );

      const client = new ArcGISClient({ baseUrl: "http://example.com/query" }, fetchFn);

      await client.fetchAll();
      const url = fetchFn.mock.calls[0][0] as string;
      expect(url).toContain("resultRecordCount=1000");
    });

    it("returns empty array when no features", async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        createMockResponse({
          features: [],
          exceededTransferLimit: false,
        }),
      );

      const client = new ArcGISClient({ baseUrl: "http://example.com/query" }, fetchFn);

      const result = await client.fetchAll();
      expect(result).toEqual([]);
    });
  });
});
