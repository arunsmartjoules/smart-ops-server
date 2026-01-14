import supabase from "../config/supabase.js";
import { logActivity } from "../services/logsService.js";

/**
 * Admin Controller
 * Handles admin management operations
 */

// Special superadmin email (hardcoded for initial setup)
const SUPERADMIN_EMAIL = "arun.kumar@smartjoules.in";

// List all admins and superadmin
export const listAdmins = async (req, res) => {
  try {
    const { data: admins, error } = await supabase
      .from("users")
      .select(
        "user_id, name, email, role, is_superadmin, is_active, created_at"
      )
      .or(`role.eq.admin,is_superadmin.eq.true,email.eq.${SUPERADMIN_EMAIL}`)
      .order("is_superadmin", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch admins: ${error.message}`);
    }

    // Mark the special email as superadmin if not already
    const enrichedAdmins = admins.map((admin) => ({
      ...admin,
      is_superadmin: admin.is_superadmin || admin.email === SUPERADMIN_EMAIL,
    }));

    res.json({
      success: true,
      data: enrichedAdmins,
    });
  } catch (error) {
    console.error("List admins error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Promote user to admin
export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Update user role to admin
    const { data, error } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to promote user: ${error.message}`);
    }

    // Log activity
    await logActivity({
      user_id: req.user.user_id,
      action: "PROMOTE_TO_ADMIN",
      module: "ADMIN",
      description: `Promoted user ${data.email} to admin`,
      ip_address: req.ip,
      device_info: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "User promoted to admin successfully",
      data,
    });
  } catch (error) {
    console.error("Promote to admin error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Demote admin
export const demoteAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Check if user is superadmin
    const { data: user } = await supabase
      .from("users")
      .select("is_superadmin, email")
      .eq("user_id", userId)
      .single();

    if (user?.is_superadmin) {
      return res.status(400).json({
        success: false,
        error: "Cannot demote superadmin. Change superadmin first.",
      });
    }

    // Update user role to staff
    const { data, error } = await supabase
      .from("users")
      .update({ role: "staff" })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to demote admin: ${error.message}`);
    }

    // Log activity
    await logActivity({
      user_id: req.user.user_id,
      action: "DEMOTE_ADMIN",
      module: "ADMIN",
      description: `Demoted admin ${data.email} to staff`,
      ip_address: req.ip,
      device_info: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Admin demoted successfully",
      data,
    });
  } catch (error) {
    console.error("Demote admin error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Request superadmin change (sends verification code)
export const requestSuperadminChange = async (req, res) => {
  try {
    const { newSuperadminUserId } = req.body;

    if (!newSuperadminUserId) {
      return res.status(400).json({
        success: false,
        error: "New superadmin user ID is required",
      });
    }

    // Verify current user is superadmin
    if (!req.user.is_superadmin) {
      return res.status(403).json({
        success: false,
        error: "Only superadmin can change superadmin",
      });
    }

    // Check if new superadmin exists and is an admin
    const { data: newUser, error: fetchError } = await supabase
      .from("users")
      .select("user_id, name, email, role")
      .eq("user_id", newSuperadminUserId)
      .single();

    if (fetchError || !newUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (newUser.role !== "admin") {
      return res.status(400).json({
        success: false,
        error: "User must be an admin to become superadmin",
      });
    }

    // Get current superadmin's email
    const { data: currentSuperadmin } = await supabase
      .from("users")
      .select("email")
      .eq("user_id", req.user.user_id)
      .single();

    // Send verification code to current superadmin
    const emailService = await import("../services/email.service.ts");
    const code = emailService.generateVerificationCode();
    emailService.storeVerificationCode(
      currentSuperadmin.email,
      code,
      "superadmin-change",
      newSuperadminUserId
    );
    await emailService.sendVerificationEmail(
      currentSuperadmin.email,
      code,
      "superadmin-change"
    );

    res.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Request superadmin change error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify and change superadmin
export const verifySuperadminChange = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Verification code is required",
      });
    }

    // Verify current user is superadmin
    if (!req.user.is_superadmin) {
      return res.status(403).json({
        success: false,
        error: "Only superadmin can change superadmin",
      });
    }

    // Get current superadmin email
    const { data: currentSuperadmin } = await supabase
      .from("users")
      .select("email")
      .eq("user_id", req.user.user_id)
      .single();

    // Verify code
    const emailService = await import("../services/email.service.ts");
    const verification = emailService.verifyCode(currentSuperadmin.email, code);

    if (!verification || verification.type !== "superadmin-change") {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification code",
      });
    }

    const newSuperadminUserId = verification.userId;

    // Remove superadmin from current user
    await supabase
      .from("users")
      .update({ is_superadmin: false })
      .eq("user_id", req.user.user_id);

    // Set new superadmin
    const { data: newSuperadmin, error: updateError } = await supabase
      .from("users")
      .update({ is_superadmin: true, role: "admin" })
      .eq("user_id", newSuperadminUserId)
      .select()
      .single();

    if (updateError) {
      // Rollback - restore current superadmin
      await supabase
        .from("users")
        .update({ is_superadmin: true })
        .eq("user_id", req.user.user_id);

      throw new Error(`Failed to change superadmin: ${updateError.message}`);
    }

    // Delete verification code
    emailService.deleteVerificationCode(currentSuperadmin.email);

    // Log activity
    await logActivity({
      user_id: req.user.user_id,
      action: "CHANGE_SUPERADMIN",
      module: "ADMIN",
      description: `Superadmin changed from ${currentSuperadmin.email} to ${newSuperadmin.email}`,
      ip_address: req.ip,
      device_info: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Superadmin changed successfully",
      data: newSuperadmin,
    });
  } catch (error) {
    console.error("Verify superadmin change error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  listAdmins,
  promoteToAdmin,
  demoteAdmin,
  requestSuperadminChange,
  verifySuperadminChange,
};
