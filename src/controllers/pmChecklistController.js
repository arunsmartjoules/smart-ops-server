import pmChecklistService from "../services/pmChecklistService.js";
import { validatePMChecklist } from "../models/pmChecklistModel.js";

/**
 * PM Checklist Controller
 */

export const create = async (req, res) => {
  try {
    const validation = validatePMChecklist(req.body);
    if (!validation.isValid) {
      return res
        .status(400)
        .json({ success: false, errors: validation.errors });
    }

    const checklist = await pmChecklistService.createPMChecklist(req.body);
    res.status(201).json({ success: true, data: checklist });
  } catch (error) {
    console.error("Create PM checklist error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const checklist = await pmChecklistService.getPMChecklistById(
      req.params.checklistId
    );
    if (!checklist) {
      return res
        .status(404)
        .json({ success: false, error: "PM checklist not found" });
    }
    res.json({ success: true, data: checklist });
  } catch (error) {
    console.error("Get PM checklist error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBySite = async (req, res) => {
  try {
    const { asset_type, status } = req.query;
    const checklists = await pmChecklistService.getPMChecklistBySite(
      req.params.siteId,
      {
        asset_type,
        status,
      }
    );
    res.json({ success: true, data: checklists });
  } catch (error) {
    console.error("Get PM checklists error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getByMaintenanceType = async (req, res) => {
  try {
    const { site_id } = req.query;
    const checklists = await pmChecklistService.getPMChecklistByMaintenanceType(
      req.params.maintenanceType,
      site_id
    );
    res.json({ success: true, data: checklists });
  } catch (error) {
    console.error("Get PM checklists error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const existing = await pmChecklistService.getPMChecklistById(
      req.params.checklistId
    );
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "PM checklist not found" });
    }

    const checklist = await pmChecklistService.updatePMChecklist(
      req.params.checklistId,
      req.body
    );
    res.json({ success: true, data: checklist });
  } catch (error) {
    console.error("Update PM checklist error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const existing = await pmChecklistService.getPMChecklistById(
      req.params.checklistId
    );
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "PM checklist not found" });
    }

    await pmChecklistService.deletePMChecklist(req.params.checklistId);
    res.json({ success: true, message: "PM checklist deleted successfully" });
  } catch (error) {
    console.error("Delete PM checklist error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Checklist Responses
export const createResponse = async (req, res) => {
  try {
    const response = await pmChecklistService.createChecklistResponse(req.body);
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error("Create checklist response error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getResponses = async (req, res) => {
  try {
    const responses = await pmChecklistService.getChecklistResponses(
      req.params.instanceId
    );
    res.json({ success: true, data: responses });
  } catch (error) {
    console.error("Get checklist responses error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateResponse = async (req, res) => {
  try {
    const response = await pmChecklistService.updateChecklistResponse(
      req.params.responseId,
      req.body
    );
    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Update checklist response error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  create,
  getById,
  getBySite,
  getByMaintenanceType,
  update,
  remove,
  createResponse,
  getResponses,
  updateResponse,
};
