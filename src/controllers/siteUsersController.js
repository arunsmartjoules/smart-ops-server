import siteUsersService from "../services/siteUsersService.js";
import { logActivity } from "../services/logsService.js";

/**
 * Site Users Controller
 * Handles site-user mapping API endpoints
 */

// Get all site-user mappings
export const getAll = async (req, res) => {
  try {
    const { page, limit, site_id, user_id, search } = req.query;
    const result = await siteUsersService.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      siteId: site_id,
      userId: user_id,
      search,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Get site users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get users at a specific site
export const getBySite = async (req, res) => {
  try {
    const data = await siteUsersService.getBySite(req.params.siteId);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get site users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get sites for a specific user
export const getByUser = async (req, res) => {
  try {
    const data = await siteUsersService.getByUser(req.params.userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get user sites error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Assign user(s) to site - supports single or multiple users
export const assignUser = async (req, res) => {
  try {
    const { site_id, user_id, user_ids, role_at_site, is_primary } = req.body;

    // Support both single user_id and array of user_ids
    const usersToAssign = user_ids || (user_id ? [user_id] : []);

    if (!site_id || usersToAssign.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Site ID and at least one User ID are required",
      });
    }

    const results = [];
    const errors = [];

    for (const uid of usersToAssign) {
      try {
        const data = await siteUsersService.assignUser(
          site_id,
          uid,
          role_at_site || "staff",
          is_primary || false
        );
        results.push(data);
      } catch (err) {
        console.error(
          `Assignment failed for user ${uid} at site ${site_id}:`,
          err.message
        );
        errors.push({ user_id: uid, error: err.message });
      }
    }

    // Log activity
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_USER_ASSIGN",
      module: "SITE_USERS",
      description: `Assigned ${results.length} user(s) to site ${site_id}`,
      metadata: { site_id, user_ids: usersToAssign, role_at_site },
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      data: results,
      assigned: results.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Assign user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const { siteId, userId } = req.params;
    const { role_at_site, is_primary } = req.body;

    const data = await siteUsersService.updateAssignment(siteId, userId, {
      role_at_site,
      is_primary,
    });

    // Log activity
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_USER_UPDATE",
      module: "SITE_USERS",
      description: `Updated assignment for user ${userId} at site ${siteId}`,
      metadata: { site_id: siteId, user_id: userId, role_at_site, is_primary },
      ip_address: req.ip,
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remove assignment
export const removeAssignment = async (req, res) => {
  try {
    const { siteId, userId } = req.params;

    await siteUsersService.removeAssignment(siteId, userId);

    // Log activity
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_USER_REMOVE",
      module: "SITE_USERS",
      description: `Removed user ${userId} from site ${siteId}`,
      metadata: { site_id: siteId, user_id: userId },
      ip_address: req.ip,
    });

    res.json({ success: true, message: "Assignment removed successfully" });
  } catch (error) {
    console.error("Remove assignment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getAll,
  getBySite,
  getByUser,
  assignUser,
  updateAssignment,
  removeAssignment,
};
