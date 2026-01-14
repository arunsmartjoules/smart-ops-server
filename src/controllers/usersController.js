import usersService from "../services/usersService.js";
import { validateUser } from "../models/userModel.js";
import { logActivity } from "../services/logsService.js";

/**
 * Users Controller
 */

export const create = async (req, res) => {
  try {
    // Security check: Only superadmins can create users
    if (!req.user || !req.user.is_superadmin) {
      return res
        .status(403)
        .json({ success: false, error: "Only superadmins can create users" });
    }

    const validation = validateUser(req.body);
    if (!validation.isValid) {
      return res
        .status(400)
        .json({ success: false, errors: validation.errors });
    }

    const user = await usersService.createUser(req.body);

    // Log user creation
    await logActivity({
      user_id: req.user.user_id,
      action: "USER_CREATE",
      module: "USERS",
      description: `Admin created user ${user.email} with role ${user.role}`,
      metadata: { target_user: user.user_id },
      ip_address: req.ip,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getByPhone = async (req, res) => {
  try {
    const user = await usersService.getUserByPhone(req.params.phone);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBySite = async (req, res) => {
  try {
    const { role, is_active } = req.query;
    const users = await usersService.getUsersBySite(req.params.siteId, {
      role,
      is_active:
        is_active === "true" ? true : is_active === "false" ? false : null,
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const { page, limit, role, is_active, search } = req.query;
    const result = await usersService.getAllUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      role,
      is_active:
        is_active === "true" ? true : is_active === "false" ? false : null,
      search,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const existing = await usersService.getUserById(req.params.userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = await usersService.updateUser(req.params.userId, req.body);

    // Log user update
    await logActivity({
      user_id: req.user.user_id,
      action: "USER_UPDATE",
      module: "USERS",
      description: `Admin updated user ${user.email}`,
      metadata: {
        target_user: user.user_id,
        updates: Object.keys(req.body).filter((k) => k !== "password"),
      },
      ip_address: req.ip,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    // Security check: Only superadmins can delete users
    if (!req.user || !req.user.is_superadmin) {
      return res
        .status(403)
        .json({ success: false, error: "Only superadmins can delete users" });
    }

    const existing = await usersService.getUserById(req.params.userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await usersService.deleteUser(req.params.userId);

    // Log deletion
    await logActivity({
      user_id: req.user.user_id,
      action: "USER_DELETE",
      module: "USERS",
      description: `Admin deleted user ${existing.email}`,
      metadata: { target_user: req.params.userId },
      ip_address: req.ip,
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkUpdate = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No user IDs provided" });
    }

    const users = await usersService.bulkUpdateUsers(ids, updates);

    // Log bulk update
    await logActivity({
      user_id: req.user.user_id,
      action: "USER_BULK_UPDATE",
      module: "USERS",
      description: `Admin updated ${ids.length} users`,
      metadata: { target_users: ids, updates: Object.keys(updates) },
      ip_address: req.ip,
    });

    res.json({ success: true, count: users.length });
  } catch (error) {
    console.error("Bulk update users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkRemove = async (req, res) => {
  try {
    // Security check: Only superadmins can delete users
    if (!req.user || !req.user.is_superadmin) {
      return res
        .status(403)
        .json({ success: false, error: "Only superadmins can delete users" });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No user IDs provided" });
    }

    await usersService.bulkDeleteUsers(ids);

    // Log bulk deletion
    await logActivity({
      user_id: req.user.user_id,
      action: "USER_BULK_DELETE",
      module: "USERS",
      description: `Admin deleted ${ids.length} users`,
      metadata: { target_users: ids },
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: `Successfully deleted ${ids.length} users`,
    });
  } catch (error) {
    console.error("Bulk delete users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  create,
  getById,
  getByPhone,
  getBySite,
  getAll,
  update,
  remove,
  bulkUpdate,
  bulkRemove,
};
