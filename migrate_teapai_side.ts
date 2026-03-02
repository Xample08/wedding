import { pool } from "./src/db/connection";

async function migrate() {
    try {
        console.log("Starting migration...");
        await pool.execute("ALTER TABLE teapai ADD COLUMN invitation_side ENUM('GROOM', 'BRIDE') DEFAULT 'GROOM' AFTER type");
        console.log("Migration successful: Added invitation_side column.");
    } catch (error: any) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log("Column invitation_side already exists.");
        } else {
            console.error("Migration failed:", error);
        }
    } finally {
        process.exit();
    }
}

migrate();
