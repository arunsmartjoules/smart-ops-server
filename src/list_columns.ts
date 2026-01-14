import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Error: Missing env vars.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function listColumns(tableName: string) {
  console.log(`Fetching a single record from '${tableName}' to see keys...`);
  const { data, error } = await supabase.from(tableName).select("*").limit(1);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log("ACTUAL KEYS IN RECORD:", Object.keys(data[0]));
    console.log("Full record sample:", data[0]);
  } else {
    console.log(`No data found in '${tableName}' table to inspect keys.`);
  }
}

const table = process.argv[2] || "users";
listColumns(table);
