import supabase from "../config/supabase.js";

/**
 * Site Users Service
 * Handles site-user mapping operations
 */

// Get all site-user mappings with pagination and filters
export const getAll = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    siteId = null,
    userId = null,
    search = "",
  } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("site_user")
    .select(
      "*, sites(name, site_code), users(name, employee_code, department)",
      { count: "exact" }
    );

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (search) {
    query = query.or(
      `users.name.ilike.%${search}%,sites.name.ilike.%${search}%,users.employee_code.ilike.%${search}%`
    );
  }

  query = query
    .order("site_id", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to get site users: ${error.message}`);

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

// Get users assigned to a specific site
export const getBySite = async (siteId) => {
  const { data, error } = await supabase
    .from("site_user")
    .select("*, users(name)")
    .eq("site_id", siteId);

  if (error) throw new Error(`Failed to get site users: ${error.message}`);
  return data;
};

// Get sites assigned to a specific user
export const getByUser = async (userId) => {
  const { data, error } = await supabase
    .from("site_user")
    .select("*, sites(name)")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to get user sites: ${error.message}`);
  return data;
};

// Assign user to a site (insert into site_users table)
export const assignUser = async (
  siteId,
  userId,
  roleAtSite,
  isPrimary = false
) => {
  const { data, error } = await supabase
    .from("site_user")
    .insert({
      site_id: siteId,
      user_id: userId,
      role_at_site: roleAtSite,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to assign user to site: ${error.message}`);
  return data;
};

// Update site-user assignment
export const updateAssignment = async (siteId, userId, updates) => {
  const { role_at_site, is_primary } = updates;

  const { data, error } = await supabase
    .from("site_user")
    .update({ role_at_site, is_primary })
    .eq("site_id", siteId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update assignment: ${error.message}`);
  return data;
};

// Remove user from site
export const removeAssignment = async (siteId, userId) => {
  const { error } = await supabase
    .from("site_user")
    .delete()
    .eq("site_id", siteId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to remove assignment: ${error.message}`);
  return true;
};

export default {
  getAll,
  getBySite,
  getByUser,
  assignUser,
  updateAssignment,
  removeAssignment,
};
