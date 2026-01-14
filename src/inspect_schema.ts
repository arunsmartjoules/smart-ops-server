import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });

const url = process.env.SUPABASE_URL;
let key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Error: SUPABASE_URL or Supabase Key is missing.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log("Checking for 'is_superadmin' in 'users'...");
  const { data, error } = await supabase
    .from("users")
    .select("is_superadmin")
    .limit(1);

  if (error) {
    console.error("FAILED to find column 'is_superadmin':", error.message);
  } else {
    console.log("SUCCESS! Column 'is_superadmin' found.");
  }
}

check();
