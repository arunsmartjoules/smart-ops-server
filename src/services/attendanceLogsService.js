import supabase from "../config/supabase.js";
import { formatAttendanceLogForInsert } from "../models/attendanceLogModel.js";

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Get user's work location type
 */
export const getUserWorkLocationType = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("work_location_type")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get user: ${error.message}`);
  }
  return data?.work_location_type;
};

/**
 * Get sites assigned to a user with their coordinates
 */
/**
 * Get sites assigned to a user with their coordinates
 */
export const getUserSitesWithCoordinates = async (userId) => {
  // First get assigned site IDs from the table
  const { data: userSites, error: userSitesError } = await supabase
    .from("site_user")
    .select("site_id")
    .eq("user_id", userId);

  if (userSitesError)
    throw new Error(`Failed to get assigned sites: ${userSitesError.message}`);

  if (!userSites || userSites.length === 0) return [];

  const siteIds = userSites.map((us) => us.site_id);

  // Then fetch site details with coordinates
  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select(
      "site_id, name, site_code, address, city, state, latitude, longitude, radius"
    )
    .in("site_id", siteIds);

  if (sitesError)
    throw new Error(`Failed to get site details: ${sitesError.message}`);

  return sites;
};

/**
 * Validate user location against their assigned sites
 * @param userId - User ID
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param radiusMeters - Allowed radius in meters (default 500m)
 * @returns Object with validation result and nearby sites
 */
export const validateUserLocation = async (
  userId,
  latitude,
  longitude,
  radiusMeters = 500
) => {
  // Check if user is WFH
  const workLocationType = await getUserWorkLocationType(userId);
  const isWFH = workLocationType === "WHF" || workLocationType === "WFH";

  if (isWFH) {
    // WFH users can check in from anywhere, return all their sites
    const sites = await getUserSitesWithCoordinates(userId);
    return {
      isValid: true,
      isWFH: true,
      allowedSites: sites,
      message: "Work from home user - can check in from anywhere",
    };
  }

  // Get user's assigned sites
  const sites = await getUserSitesWithCoordinates(userId);

  // If not WFH and no coordinates, validation fails
  if (!latitude || !longitude) {
    return {
      isValid: false,
      isWFH: false,
      allowedSites: [],
      message: "Location coordinates required for non-WFH check-in",
    };
  }

  if (!sites || sites.length === 0) {
    return {
      isValid: false,
      isWFH: false,
      allowedSites: [],
      message: "No sites assigned to this user",
    };
  }

  // Check which sites are within range
  const sitesWithDistance = sites.map((site) => {
    if (!site.latitude || !site.longitude) {
      return { ...site, distance: null, inRange: false };
    }
    const distance = calculateDistance(
      latitude,
      longitude,
      parseFloat(site.latitude),
      parseFloat(site.longitude)
    );
    const siteRadius = site.radius || radiusMeters;
    return {
      ...site,
      distance: Math.round(distance),
      inRange: distance <= siteRadius,
      radius: siteRadius, // Include the used radius for UI feedback
    };
  });

  const allowedSites = sitesWithDistance.filter((s) => s.inRange);
  const nearestSite = sitesWithDistance
    .filter((s) => s.distance !== null)
    .sort((a, b) => a.distance - b.distance)[0];

  return {
    isValid: allowedSites.length > 0,
    isWFH: false,
    allowedSites,
    allSites: sitesWithDistance,
    nearestSite,
    message:
      allowedSites.length > 0
        ? `${allowedSites.length} site(s) within range`
        : nearestSite
        ? `You are ${nearestSite.distance}m away from the nearest site (${nearestSite.name}). Must be within ${radiusMeters}m.`
        : "No sites with coordinates found",
  };
};

const getISTDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

export const createAttendanceLog = async (data) => {
  const formattedData = formatAttendanceLogForInsert(data);

  const { data: result, error } = await supabase
    .from("attendance_logs")
    .insert(formattedData)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create attendance log: ${error.message}`);
  return result;
};

export const checkIn = async (data) => {
  const istDateString = getISTDate();
  console.log(
    `[checkIn] Checking in for user ${data.user_id} on date: ${istDateString}`
  );

  const { data: result, error } = await supabase
    .from("attendance_logs")
    .insert({
      user_id: data.user_id,
      site_id: data.site_id,
      check_in_time: new Date().toISOString(),
      check_in_latitude: data.latitude || null,
      check_in_longitude: data.longitude || null,
      check_in_address: data.address || null,
      shift_id: data.shift_id || null,
      status: "Present",
      date: istDateString,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to check in: ${error.message}`);
  return result;
};

export const checkOut = async (attendanceId, data) => {
  const { data: result, error } = await supabase
    .from("attendance_logs")
    .update({
      check_out_time: new Date().toISOString(),
      check_out_latitude: data.latitude || null,
      check_out_longitude: data.longitude || null,
      check_out_address: data.address || null,
      remarks: data.remarks || null,
    })
    .eq("id", attendanceId)
    .select()
    .single();

  if (error) throw new Error(`Failed to check out: ${error.message}`);
  return result;
};

export const getAttendanceById = async (id) => {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error)
    throw new Error(`Failed to fetch attendance log: ${error.message}`);
  return data;
};

export const getTodayAttendance = async (userId) => {
  const today = getISTDate();
  console.log(
    `[getTodayAttendance] Fetching for user ${userId} on date: ${today}`
  );

  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .order("check_in_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get attendance: ${error.message}`);
  }
  return data;
};

export const getAttendanceByUser = async (userId, options = {}) => {
  const { page = 1, limit = 30, date_from = null, date_to = null } = options;

  const offset = (page - 1) * limit;

  let query = supabase
    .from("attendance_logs")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (date_from) {
    query = query.gte("date", date_from);
  }

  if (date_to) {
    query = query.lte("date", date_to);
  }

  query = query
    .order("date", { ascending: false })
    .order("check_in_time", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to get attendance: ${error.message}`);

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

export const getAttendanceBySite = async (siteId, options = {}) => {
  const { date = new Date().toISOString().split("T")[0], status = null } =
    options;

  let query = supabase
    .from("attendance_logs")
    .select(
      `
            *,
            users (
                name,
                phone,
                role
            )
        `
    )
    .eq("site_id", siteId)
    .eq("date", date);

  if (status) {
    query = query.eq("status", status);
  }

  query = query.order("check_in_time", { ascending: true });

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get attendance: ${error.message}`);
  return data;
};

export const getAttendanceReport = async (siteId, dateFrom, dateTo) => {
  let query = supabase.from("attendance_logs").select(`
            *,
            users (
                name,
                user_id,
                employee_code
            ),
            sites (
                name,
                site_code
            )
        `);

  if (siteId && siteId !== "all") {
    query = query.eq("site_id", siteId);
  }

  const { data, error } = await query
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: true });

  if (error)
    throw new Error(`Failed to get attendance report: ${error.message}`);

  return data;
};

export const updateAttendanceLog = async (id, updateData) => {
  const { created_at, ...allowedUpdates } = updateData;

  const { data, error } = await supabase
    .from("attendance_logs")
    .update(allowedUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to update attendance log: ${error.message}`);
  return data;
};

export const deleteAttendanceLog = async (id) => {
  const { error } = await supabase
    .from("attendance_logs")
    .delete()
    .eq("id", id);

  if (error)
    throw new Error(`Failed to delete attendance log: ${error.message}`);
  return true;
};

export default {
  createAttendanceLog,
  checkIn,
  checkOut,
  getAttendanceById,
  getTodayAttendance,
  getAttendanceByUser,
  getAttendanceBySite,
  getAttendanceReport,
  updateAttendanceLog,
  deleteAttendanceLog,
  getUserWorkLocationType,
  getUserSitesWithCoordinates,
  validateUserLocation,
};
