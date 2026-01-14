import sitesService from "../services/sitesService.js";
import { validateSite } from "../models/siteModel.js";
import { logActivity } from "../services/logsService.js";

/**
 * Sites Controller
 */

export const create = async (req, res) => {
  try {
    const validation = validateSite(req.body);
    if (!validation.isValid) {
      return res
        .status(400)
        .json({ success: false, errors: validation.errors });
    }

    const site = await sitesService.createSite(req.body);

    // Log site creation
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_CREATE",
      module: "SITES",
      description: `Admin created site ${site.name}`,
      metadata: { target_site: site.id },
      ip_address: req.ip,
    });

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    console.error("Create site error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const site = await sitesService.getSiteById(req.params.siteId);
    if (!site) {
      return res.status(404).json({ success: false, error: "Site not found" });
    }
    res.json({ success: true, data: site });
  } catch (error) {
    console.error("Get site error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const { is_active, city, search } = req.query;
    const sites = await sitesService.getAllSites({
      is_active:
        is_active === "true" ? true : is_active === "false" ? false : null,
      city,
      search,
    });
    res.json({ success: true, data: sites });
  } catch (error) {
    console.error("Get sites error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const existing = await sitesService.getSiteById(req.params.siteId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Site not found" });
    }

    const site = await sitesService.updateSite(req.params.siteId, req.body);

    // Log site update
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_UPDATE",
      module: "SITES",
      description: `Admin updated site ${site.name}`,
      metadata: { target_site: site.id, updates: Object.keys(req.body) },
      ip_address: req.ip,
    });

    res.json({ success: true, data: site });
  } catch (error) {
    console.error("Update site error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const existing = await sitesService.getSiteById(req.params.siteId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Site not found" });
    }

    await sitesService.deleteSite(req.params.siteId);

    // Log site deletion
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_DELETE",
      module: "SITES",
      description: `Admin deleted site ${existing.name}`,
      metadata: { target_site: req.params.siteId },
      ip_address: req.ip,
    });

    res.json({ success: true, message: "Site deleted successfully" });
  } catch (error) {
    console.error("Delete site error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkUpdate = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No site IDs provided" });
    }

    const sites = await sitesService.bulkUpdateSites(ids, updates);

    // Log bulk update
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_BULK_UPDATE",
      module: "SITES",
      description: `Admin updated ${ids.length} sites`,
      metadata: { target_sites: ids, updates: Object.keys(updates) },
      ip_address: req.ip,
    });

    res.json({ success: true, count: sites.length });
  } catch (error) {
    console.error("Bulk update sites error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkRemove = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No site IDs provided" });
    }

    await sitesService.bulkDeleteSites(ids);

    // Log bulk deletion
    await logActivity({
      user_id: req.user?.user_id,
      action: "SITE_BULK_DELETE",
      module: "SITES",
      description: `Admin deleted ${ids.length} sites`,
      metadata: { target_sites: ids },
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: `Successfully deleted ${ids.length} sites`,
    });
  } catch (error) {
    console.error("Bulk delete sites error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  create,
  getById,
  getAll,
  update,
  remove,
  bulkUpdate,
  bulkRemove,
};
