export interface ArcGISFeature {
  attributes: Record<string, unknown>;
  geometry: ArcGISGeometry | null;
}

export interface ArcGISGeometry {
  rings: number[][][];
  spatialReference: { wkid: number };
}

export interface ArcGISFeatureCollection {
  features: ArcGISFeature[];
  exceededTransferLimit: boolean;
}

export interface ArcGISClientOptions {
  baseUrl: string;
  pageSize?: number;
}

export class ArcGISError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public body?: string,
  ) {
    super(message);
    this.name = "ArcGISError";
  }
}

export class ArcGISClient {
  private baseUrl: string;
  private pageSize: number;

  constructor(
    options: ArcGISClientOptions,
    private fetchFn: typeof globalThis.fetch = globalThis.fetch,
  ) {
    this.baseUrl = options.baseUrl;
    this.pageSize = options.pageSize ?? 1000;
  }

  async fetchPage(offset: number, limit: number): Promise<ArcGISFeatureCollection> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("resultRecordCount", String(limit));
    url.searchParams.set("where", "1=1");
    url.searchParams.set("outFields", "*");
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("f", "json");

    const res = await this.fetchFn(url.toString());

    if (!res.ok) {
      const body = await res.text();
      throw new ArcGISError(
        `ArcGIS request failed: ${res.status} ${res.statusText}`,
        res.status,
        body,
      );
    }

    try {
      return (await res.json()) as ArcGISFeatureCollection;
    } catch (err) {
      throw new ArcGISError(`Failed to parse ArcGIS response: ${(err as Error).message}`);
    }
  }

  async fetchAll(): Promise<ArcGISFeature[]> {
    const allFeatures: ArcGISFeature[] = [];
    let offset = 0;

    while (true) {
      const page = await this.fetchPage(offset, this.pageSize);
      allFeatures.push(...page.features);

      if (!page.exceededTransferLimit) break;
      offset += this.pageSize;
    }

    return allFeatures;
  }
}
