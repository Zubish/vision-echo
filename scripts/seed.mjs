import { rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dbPath = path.join(root, "data", "visionecho-db.json");

await rm(dbPath, { force: true });
console.log("Local database reset. Start the app to regenerate seed data.");
