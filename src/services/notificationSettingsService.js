import supabase from "../config/supabase.js";

/**
 * Get a specific notification setting by key
 */
export const getSetting = async (key) => {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("setting_key", key)
    .maybeSingle();

  if (error) throw new Error(`Failed to get setting: ${error.message}`);
  return data?.setting_value || null;
};

/**
 * Get all notification settings
 */
export const getAllSettings = async () => {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*");

  if (error) throw new Error(`Failed to get settings: ${error.message}`);

  // Convert to key-value object
  const settings = {};
  data.forEach((item) => {
    settings[item.setting_key] = item.setting_value;
  });

  return settings;
};

/**
 * Update a notification setting
 */
export const updateSetting = async (key, value, updatedBy) => {
  const { data, error } = await supabase
    .from("notification_settings")
    .upsert({
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to update setting: ${error.message}`);
  return data;
};

/**
 * Get check-in notification message
 */
export const getCheckInMessage = async () => {
  return await getSetting("check_in_message");
};

/**
 * Get check-out notification message
 */
export const getCheckOutMessage = async () => {
  return await getSetting("check_out_message");
};

/**
 * Get check-in reminder time (HH:MM format)
 */
export const getCheckInTime = async () => {
  return await getSetting("check_in_time");
};

/**
 * Get check-out reminder time (HH:MM format)
 */
export const getCheckOutTime = async () => {
  return await getSetting("check_out_time");
};

/**
 * Update check-in notification message
 */
export const updateCheckInMessage = async (message, updatedBy) => {
  return await updateSetting("check_in_message", message, updatedBy);
};

/**
 * Update check-out notification message
 */
export const updateCheckOutMessage = async (message, updatedBy) => {
  return await updateSetting("check_out_message", message, updatedBy);
};

/**
 * Update check-in reminder time
 */
export const updateCheckInTime = async (time, updatedBy) => {
  return await updateSetting("check_in_time", time, updatedBy);
};

/**
 * Update check-out reminder time
 */
export const updateCheckOutTime = async (time, updatedBy) => {
  return await updateSetting("check_out_time", time, updatedBy);
};

/**
 * Get user notification preferences
 */
export const getUserPreferences = async (userId) => {
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error)
    throw new Error(`Failed to get user preferences: ${error.message}`);

  // Return default preferences if not set
  if (!data) {
    return {
      user_id: userId,
      attendance_notifications_enabled: true,
    };
  }

  return data;
};

/**
 * Update user notification preferences
 */
export const updateUserPreferences = async (userId, preferences) => {
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error)
    throw new Error(`Failed to update user preferences: ${error.message}`);
  return data;
};

export default {
  getSetting,
  getAllSettings,
  updateSetting,
  getCheckInMessage,
  getCheckOutMessage,
  getCheckInTime,
  getCheckOutTime,
  updateCheckInMessage,
  updateCheckOutMessage,
  updateCheckInTime,
  updateCheckOutTime,
  getUserPreferences,
  updateUserPreferences,
};
