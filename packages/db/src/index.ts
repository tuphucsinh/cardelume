import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const client = postgres(connectionString, { max: 4, prepare: false });
  return { db: drizzle(client, { schema }), client };
}
export { schema };

export * from "./recovery";

export * from "./final-render";

export * from "./checkout-payment";

export * from "./photo-assets";

export * from "./generation";

export * from "./operations";

export * from "./templates";

export * from "./funnel";
