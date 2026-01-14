import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });

const url = process.env.SUPABASE_URL;
let keySource = "NONE";
let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (key) keySource = "SUPABASE_SERVICE_ROLE_KEY";
if (!key) {
  key = process.env.SUPABASE_SERVICE_KEY;
  if (key) keySource = "SUPABASE_SERVICE_KEY";
}
if (!key) {
  key = process.env.SUPABASE_ANON_KEY;
  if (key) keySource = "SUPABASE_ANON_KEY";
}
if (!key) {
  key = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (key) keySource = "SUPABASE_PUBLISHABLE_DEFAULT_KEY";
}

console.log("--- Supabase Diagnostics ---");
console.log("URL:", url || "MISSING");
console.log(
  "SUPABASE_PUBLISHABLE_DEFAULT_KEY:",
  process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY ? "PRESENT" : "MISSING"
);
console.log(
  "SUPABASE_ANON_KEY:",
  process.env.SUPABASE_ANON_KEY ? "PRESENT" : "MISSING"
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "PRESENT" : "MISSING"
);
console.log(
  "SUPABASE_SERVICE_KEY:",
  process.env.SUPABASE_SERVICE_KEY ? "PRESENT" : "MISSING"
);
console.log("Selected Key Source:", keySource);

if (!url || !key) {
  console.error(
    "Error: SUPABASE_URL or Supabase Key is missing in environment."
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log("Testing tables...");
  const commonTables = [
    "users",
    "user",
    "profiles",
    "accounts",
    "employees",
    "staff",
  ];
  for (const table of commonTables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (!error) {
      console.log(`[OK] Table found: ${table}`);
      if (table === "users") {
        const { data: colData, error: colError } = await supabase
          .from("users")
          .select("password")
          .limit(1);
        if (colError) {
          console.log(
            `[FAIL] Column 'password' in 'users': [${colError.code}] ${colError.message}`
          );
        } else {
          console.log(`[OK] Column 'password' found in 'users'`);
        }
      }
    } else {
      console.log(`[FAIL] Table ${table}: [${error.code}] ${error.message}`);
    }
  }
}

test();
