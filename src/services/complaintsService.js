import supabase from "../config/supabase.js";
import { formatComplaintForInsert } from "../models/complaintModel.js";

// CREATE - Insert new complaint
export const createComplaint = async (data) => {
  const formattedData = formatComplaintForInsert(data);

  const { data: result, error } = await supabase
    .from("complaints")
    .insert(formattedData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create complaint: ${error.message}`);
  }

  return result;
};

// READ - Get complaint by ticket_id
export const getComplaintById = async (ticketId) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("ticket_id", ticketId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get complaint: ${error.message}`);
  }

  return data;
};

// READ - Get complaints by site with pagination
export const getComplaintsBySite = async (siteId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    status = null,
    category = null,
    fromDate = null,
    toDate = null,
    sortBy = "created_at",
    sortOrder = "desc",
  } = options;

  const offset = (page - 1) * limit;

  // Resolve numeric siteId to site_code if necessary,
  // as complaints table uses site_code in its site_id column
  let targetSiteId = siteId;
  if (!isNaN(parseInt(siteId)) && siteId.length < 10) {
    const { data: site } = await supabase
      .from("sites")
      .select("site_code")
      .eq("site_id", siteId)
      .single();
    if (site?.site_code) {
      targetSiteId = site.site_code;
    }
  }

  let query = supabase.from("complaints").select("*", { count: "exact" });

  if (targetSiteId !== "all") {
    query = query.eq("site_id", targetSiteId);
  }

  // Apply filters
  if (status && status !== "All") {
    query = query.eq("status", status);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }

  if (toDate) {
    query = query.lte("created_at", toDate);
  }

  // Apply sorting and pagination
  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get complaints: ${error.message}`);
  }

  return {
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// READ - Get recent complaints by message_id
export const getComplaintByMessageId = async (messageId) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("message_id", messageId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get complaint: ${error.message}`);
  }

  return data;
};

// READ - Get recent complaints by group_id
export const getRecentComplaintsByGroup = async (groupId, limit = 5) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get complaints: ${error.message}`);
  }

  return data;
};

// UPDATE - Update complaint
export const updateComplaint = async (ticketId, updateData) => {
  // Remove fields that shouldn't be updated
  const { ticket_id, created_at, ...allowedUpdates } = updateData;

  const { data, error } = await supabase
    .from("complaints")
    .update(allowedUpdates)
    .eq("ticket_id", ticketId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update complaint: ${error.message}`);
  }

  return data;
};

// UPDATE - Update complaint status
export const updateComplaintStatus = async (
  ticketId,
  status,
  remarks = null
) => {
  const updateData = { status };

  if (remarks) {
    updateData.internal_remarks = remarks;
  }

  // Add timestamp based on status
  if (status === "Resolved") {
    updateData.resolved_at = new Date().toISOString();
  } else if (status === "Closed") {
    updateData.closed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("complaints")
    .update(updateData)
    .eq("ticket_id", ticketId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  return data;
};

// DELETE - Delete complaint
export const deleteComplaint = async (ticketId) => {
  const { error } = await supabase
    .from("complaints")
    .delete()
    .eq("ticket_id", ticketId);

  if (error) {
    throw new Error(`Failed to delete complaint: ${error.message}`);
  }

  return true;
};

// STATS - Get complaint statistics by site
export const getComplaintStats = async (siteId) => {
  // Resolve numeric siteId to site_code if necessary
  let targetSiteId = siteId;
  if (!isNaN(parseInt(siteId)) && siteId.length < 10) {
    const { data: site } = await supabase
      .from("sites")
      .select("site_code")
      .eq("site_id", siteId)
      .single();
    if (site?.site_code) {
      targetSiteId = site.site_code;
    }
  }

  let query = supabase.from("complaints").select("status, category");

  if (targetSiteId !== "all") {
    query = query.eq("site_id", targetSiteId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get stats: ${error.message}`);
  }

  const stats = {
    total: data.length,
    byStatus: {},
    byCategory: {},
  };

  data.forEach((complaint) => {
    // Count by status
    stats.byStatus[complaint.status] =
      (stats.byStatus[complaint.status] || 0) + 1;
    // Count by category
    stats.byCategory[complaint.category] =
      (stats.byCategory[complaint.category] || 0) + 1;
  });

  return stats;
};

export default {
  createComplaint,
  getComplaintById,
  getComplaintsBySite,
  getComplaintByMessageId,
  getRecentComplaintsByGroup,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStats,
};
