CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS parcels;
DROP TABLE IF EXISTS zoning;

CREATE TABLE zoning (
    id INTEGER PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    "landUse" VARCHAR(100),
    geometry geometry(Geometry, 4326) NOT NULL
);

CREATE TABLE parcels (
    id INTEGER PRIMARY KEY,
    geometry geometry(Geometry, 4326) NOT NULL,
    "calculatedAreaAcres" DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_zoning_geometry ON zoning USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_parcels_geometry ON parcels USING GIST (geometry);
