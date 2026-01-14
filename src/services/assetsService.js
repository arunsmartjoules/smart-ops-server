import supabase from "../config/supabase.js";
import { formatAssetForInsert } from "../models/assetModel.js";

export const createAsset = async (data) => {
  const formattedData = formatAssetForInsert(data);

  const { data: result, error } = await supabase
    .from("assets")
    .insert(formattedData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create asset: ${error.message}`);
  return result;
};

export const getAssetById = async (assetId) => {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("asset_id", assetId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get asset: ${error.message}`);
  }
  return data;
};

export const getAssetsBySite = async (siteId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    asset_type = null,
    status = null,
    floor = null,
    sortBy = "asset_name",
    sortOrder = "asc",
  } = options;

  const offset = (page - 1) * limit;

  let query = supabase.from("assets").select("*", { count: "exact" });

  if (siteId !== "all") {
    query = query.eq("site_id", siteId);
  }

  if (asset_type) {
    query = query.eq("asset_type", asset_type);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (floor) {
    query = query.eq("floor", floor);
  }

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to get assets: ${error.message}`);

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

export const getAssetsByType = async (siteId, assetType) => {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("site_id", siteId)
    .eq("asset_type", assetType)
    .eq("status", "Active")
    .order("asset_name", { ascending: true });

  if (error) throw new Error(`Failed to get assets: ${error.message}`);
  return data;
};

export const getAssetsByLocation = async (siteId, location) => {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("site_id", siteId)
    .ilike("location", `%${location}%`)
    .order("asset_name", { ascending: true });

  if (error) throw new Error(`Failed to get assets: ${error.message}`);
  return data;
};

export const searchAssets = async (siteId, searchTerm) => {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("site_id", siteId)
    .or(
      `asset_name.ilike.%${searchTerm}%,asset_id.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
    )
    .order("asset_name", { ascending: true })
    .limit(20);

  if (error) throw new Error(`Failed to search assets: ${error.message}`);
  return data;
};

export const getAssetsUnderWarranty = async (siteId) => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("site_id", siteId)
    .gte("warranty_end_date", today)
    .order("warranty_end_date", { ascending: true });

  if (error) throw new Error(`Failed to get assets: ${error.message}`);
  return data;
};

export const getAssetsWarrantyExpiring = async (siteId, days = 30) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("site_id", siteId)
    .gte("warranty_end_date", today.toISOString().split("T")[0])
    .lte("warranty_end_date", futureDate.toISOString().split("T")[0])
    .order("warranty_end_date", { ascending: true });

  if (error) throw new Error(`Failed to get assets: ${error.message}`);
  return data;
};

export const updateAsset = async (assetId, updateData) => {
  const { asset_id, created_at, ...allowedUpdates } = updateData;

  const { data, error } = await supabase
    .from("assets")
    .update(allowedUpdates)
    .eq("asset_id", assetId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update asset: ${error.message}`);
  return data;
};

export const updateAssetStatus = async (assetId, status) => {
  const { data, error } = await supabase
    .from("assets")
    .update({ status })
    .eq("asset_id", assetId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update asset status: ${error.message}`);
  return data;
};

export const deleteAsset = async (assetId) => {
  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("asset_id", assetId);

  if (error) throw new Error(`Failed to delete asset: ${error.message}`);
  return true;
};

export const getAssetStats = async (siteId) => {
  const { data, error } = await supabase
    .from("assets")
    .select("status, asset_type")
    .eq("site_id", siteId);

  if (error) throw new Error(`Failed to get stats: ${error.message}`);

  const stats = {
    total: data.length,
    byStatus: {},
    byType: {},
  };

  data.forEach((asset) => {
    stats.byStatus[asset.status] = (stats.byStatus[asset.status] || 0) + 1;
    if (asset.asset_type) {
      stats.byType[asset.asset_type] =
        (stats.byType[asset.asset_type] || 0) + 1;
    }
  });

  return stats;
};

export default {
  createAsset,
  getAssetById,
  getAssetsBySite,
  getAssetsByType,
  getAssetsByLocation,
  searchAssets,
  getAssetsUnderWarranty,
  getAssetsWarrantyExpiring,
  updateAsset,
  updateAssetStatus,
  deleteAsset,
  getAssetStats,
};
