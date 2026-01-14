import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET;
console.log("JWT_SECRET present:", !!secret);
if (secret) {
  console.log("JWT_SECRET length:", secret.length);
}

const payload = { test: true };
const token = jwt.sign(payload, secret || "fallback");
try {
  const decoded = jwt.verify(token, secret || "fallback");
  console.log("Verification successful:", decoded);
} catch (e) {
  console.log("Verification failed:", e.message);
}
