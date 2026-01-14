import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local", override: true });

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !key) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(url, key);

async function verifyUnifiedSignup() {
  const claimEmail = "claim_unified@smartjoules.in";
  const newEmail = "new_unified@smartjoules.in";
  const testPass = "TestPass123";

  console.log("--- Unified Signup Verification ---");

  // Cleanup
  await supabase.from("users").delete().in("email", [claimEmail, newEmail]);

  // 1. Scenario A: Claiming Existing
  console.log("\n[Scenario A] Claiming Existing User...");
  await supabase.from("users").insert({
    user_id: uuidv4(),
    email: claimEmail,
    name: "Original Name",
    role: "staff",
    is_active: true,
  });

  // Simulation of signup logic
  const saltA = await bcrypt.genSalt(10);
  const hashA = await bcrypt.hash(testPass, saltA);
  const { data: userA, error: errA } = await supabase
    .from("users")
    .update({
      password: hashA,
      name: "Claimed Name",
    })
    .eq("email", claimEmail)
    .select()
    .single();

  if (errA) console.error("[FAIL] Claim failed:", errA.message);
  else console.log("[OK] Claimed successfully. Name:", userA.name);

  // 2. Scenario B: New Registration
  console.log("\n[Scenario B] Registering New User...");
  const saltB = await bcrypt.genSalt(10);
  const hashB = await bcrypt.hash(testPass, saltB);
  const { data: userB, error: errB } = await supabase
    .from("users")
    .insert({
      user_id: uuidv4(),
      email: newEmail,
      password: hashB,
      name: "New User",
      role: "staff",
      is_active: true,
    })
    .select()
    .single();

  if (errB) console.error("[FAIL] Registration failed:", errB.message);
  else console.log("[OK] Registered successfully. ID:", userB.user_id);

  // Cleanup
  console.log("\nCleaning up...");
  await supabase.from("users").delete().in("email", [claimEmail, newEmail]);
  console.log("Done.");
}

verifyUnifiedSignup();
