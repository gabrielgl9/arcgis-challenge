import { customType, doublePrecision, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

/**
 * PostGIS geometry column type.
 * Spatial queries use raw SQL — this type provides TypeScript awareness only.
 */
const geometry = customType<{ data: string; driverParam: string }>({
  dataType() {
    return "geometry(Geometry, 4326)";
  },
});

export const zoning = pgTable("zoning", {
  id: integer("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  landUse: varchar("landUse", { length: 100 }),
  geometry: geometry("geometry").notNull(),
});

export const parcels = pgTable("parcels", {
  id: integer("id").primaryKey(),
  geometry: geometry("geometry").notNull(),
  calculatedAreaAcres: doublePrecision("calculatedAreaAcres").notNull().default(0),
});
