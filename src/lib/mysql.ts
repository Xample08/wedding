import "server-only";

// Back-compat re-export. Canonical pool is in src/db/connection.ts.
export { pool as mysqlPool } from "@/db/connection";
