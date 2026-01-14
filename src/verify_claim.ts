import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local", override: true });

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !key) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(url, key);

async function verifyClaim() {
  const testEmail = "claim_test@smartjoules.in";
  const testName = "Claim Test User";
  const testPass = "TestPass123";

  console.log("--- Claim Account Verification ---");

  // 1. Cleanup existing test user
  await supabase.from("users").delete().eq("email", testEmail);

  // 2. Seed a user without a password (as if imported from Excel)
  console.log("Seeding test user...");
  const { data: seededUser, error: seedError } = await supabase
    .from("users")
    .insert({
      user_id: "test-uuid-1234",
      email: testEmail,
      name: "Original Name",
      role: "staff",
      is_active: true,
      // password is left NULL
    })
    .select()
    .single();

  if (seedError) {
    console.error("[FAIL] Seeding failed:", seedError.message);
    return;
  }
  console.log("[OK] Seeded user with ID:", seededUser.user_id);

  // 3. Mock the signup logic
  console.log("Simulating signup...");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testPass, salt);

  const { data: updatedUser, error: updateError } = await supabase
    .from("users")
    .update({
      password: hashedPassword,
      name: testName,
      is_active: true,
    })
    .eq("email", testEmail)
    .select()
    .single();

  if (updateError) {
    console.error("[FAIL] Signup update failed:", updateError.message);
  } else {
    console.log("[OK] Account claimed successfully");

    // Verify password is set
    if (updatedUser.password) {
      console.log("[OK] Password field exists in response");
      const prefix = updatedUser.password.substring(0, 4);
      if (prefix === "$2a$" || prefix === "$2b$" || prefix === "$2y$") {
        console.log(
          `[OK] Password looks like a valid bcrypt hash (Prefix: ${prefix})`
        );
      } else {
        console.log(
          `[INFO] Password starts with: ${prefix}. Checking full string...`
        );
        if (updatedUser.password.length > 50) {
          console.log("[OK] Password length suggests it is hashed");
        } else {
          console.error(
            "[FAIL] Password value seems incorrect:",
            updatedUser.password
          );
        }
      }
    } else {
      console.error(
        "[FAIL] Password field is NULL in response. This is likely due to RLS or a hidden column."
      );

      // Fallback: Check if we can fetch it explicitly
      console.log("Attempting explicit fetch...");
      const { data: fetchedUser } = await supabase
        .from("users")
        .select("password")
        .eq("email", testEmail)
        .single();
      if (fetchedUser && fetchedUser.password) {
        console.log("[OK] Password found in database via explicit fetch");
      } else {
        console.error("[FAIL] Password still missing in database");
      }
    }
  }

  // Cleanup
  console.log("Cleaning up...");
  await supabase.from("users").delete().eq("email", testEmail);
  console.log("Done.");
}

verifyClaim();
