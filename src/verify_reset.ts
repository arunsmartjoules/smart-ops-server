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

async function verifyReset() {
  const testEmail = "reset_test@smartjoules.in";
  const testCode = "SJ-TEST-001";
  const oldPass = "OldPass123";
  const newPass = "NewPass456";

  console.log("--- Forgot Password Verification ---");

  // 1. Cleanup
  await supabase.from("users").delete().eq("email", testEmail);

  // 2. Seed a user with employee_code and an old password
  console.log("Seeding test user...");
  const salt = await bcrypt.genSalt(10);
  const oldHashedPassword = await bcrypt.hash(oldPass, salt);

  const { data: user, error: seedError } = await supabase
    .from("users")
    .insert({
      user_id: "reset-uuid-1234",
      email: testEmail,
      employee_code: testCode,
      password: oldHashedPassword,
      name: "Reset Test User",
      role: "staff",
      is_active: true,
    })
    .select()
    .single();

  if (seedError) {
    console.error("[FAIL] Seeding failed:", seedError.message);
    return;
  }
  console.log("[OK] Seeded user with ID:", user.user_id);

  // 3. Mock the reset logic (simulating authController.resetPassword)
  console.log("Simulating reset password...");

  // Verify matching logic
  const { data: match, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("email", testEmail)
    .eq("employee_code", testCode)
    .single();

  if (fetchError || !match) {
    console.error("[FAIL] Could not find user with matching email and code");
    return;
  }
  console.log("[OK] Found matching user");

  const newSalt = await bcrypt.genSalt(10);
  const newHashedPassword = await bcrypt.hash(newPass, newSalt);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      password: newHashedPassword,
    })
    .eq("user_id", match.user_id);

  if (updateError) {
    console.error("[FAIL] Reset update failed:", updateError.message);
  } else {
    console.log("[OK] Password reset successfully");
  }

  // 4. Verify new password works
  const { data: updated } = await supabase
    .from("users")
    .select("password")
    .eq("email", testEmail)
    .single();
  if (updated && updated.password) {
    const isMatch = await bcrypt.compare(newPass, updated.password);
    if (isMatch) {
      console.log("[OK] New password verified correctly");
    } else {
      console.error("[FAIL] New password does not match hash");
    }
  }

  // Cleanup
  console.log("Cleaning up...");
  await supabase.from("users").delete().eq("email", testEmail);
  console.log("Done.");
}

verifyReset();
