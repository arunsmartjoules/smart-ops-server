import supabase from "../config/supabase.js";
import { formatPMChecklistForInsert } from "../models/pmChecklistModel.js";

export const createPMChecklist = async (data) => {
  const formattedData = formatPMChecklistForInsert(data);

  const { data: result, error } = await supabase
    .from("pm_checklist")
    .insert(formattedData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create PM checklist: ${error.message}`);
  return result;
};

export const getPMChecklistById = async (checklistId) => {
  const { data, error } = await supabase
    .from("pm_checklist")
    .select("*")
    .eq("checklist_id", checklistId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get PM checklist: ${error.message}`);
  }
  return data;
};

export const getPMChecklistBySite = async (siteId, options = {}) => {
  const { asset_type = null, status = "Active" } = options;

  let query = supabase.from("pm_checklist").select("*").eq("site_id", siteId);

  if (asset_type) {
    query = query.eq("asset_type", asset_type);
  }

  if (status) {
    query = query.eq("status", status);
  }

  query = query.order("sequence_no", { ascending: true });

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get PM checklist: ${error.message}`);
  return data;
};

export const getPMChecklistByMaintenanceType = async (
  maintenanceType,
  siteId = null
) => {
  let query = supabase
    .from("pm_checklist")
    .select("*")
    .eq("maintenance_type", maintenanceType)
    .eq("status", "Active");

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  query = query.order("sequence_no", { ascending: true });

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get PM checklist: ${error.message}`);
  return data;
};

export const updatePMChecklist = async (checklistId, updateData) => {
  const { checklist_id, created_at, ...allowedUpdates } = updateData;
  allowedUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("pm_checklist")
    .update(allowedUpdates)
    .eq("checklist_id", checklistId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update PM checklist: ${error.message}`);
  return data;
};

export const deletePMChecklist = async (checklistId) => {
  const { error } = await supabase
    .from("pm_checklist")
    .delete()
    .eq("checklist_id", checklistId);

  if (error) throw new Error(`Failed to delete PM checklist: ${error.message}`);
  return true;
};

// PM Checklist Responses
export const createChecklistResponse = async (data) => {
  const { data: result, error } = await supabase
    .from("pm_checklist_responses")
    .insert({
      instance_id: data.instance_id,
      checklist_id: data.checklist_id,
      response_value: data.response_value || null,
      remarks: data.remarks || null,
      image_url: data.image_url || null,
      completed_by: data.completed_by || null,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create checklist response: ${error.message}`);
  return result;
};

export const getChecklistResponses = async (instanceId) => {
  const { data, error } = await supabase
    .from("pm_checklist_responses")
    .select(
      `
            *,
            pm_checklist (
                task_name,
                field_type,
                sequence_no
            )
        `
    )
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: true });

  if (error)
    throw new Error(`Failed to get checklist responses: ${error.message}`);
  return data;
};

export const updateChecklistResponse = async (responseId, updateData) => {
  const { data, error } = await supabase
    .from("pm_checklist_responses")
    .update(updateData)
    .eq("id", responseId)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to update checklist response: ${error.message}`);
  return data;
};

export default {
  createPMChecklist,
  getPMChecklistById,
  getPMChecklistBySite,
  getPMChecklistByMaintenanceType,
  updatePMChecklist,
  deletePMChecklist,
  createChecklistResponse,
  getChecklistResponses,
  updateChecklistResponse,
};
