import supabase from "../config/supabase.js";

/**
 * Register or update a push token for a user's device
 */
export const registerPushToken = async (
  userId,
  pushToken,
  deviceId,
  platform
) => {
  // First check if this token already exists
  const { data: existing, error: findError } = await supabase
    .from("push_tokens")
    .select("*")
    .eq("push_token", pushToken)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to check existing token: ${findError.message}`);
  }

  if (existing) {
    // Update existing token
    const { data, error } = await supabase
      .from("push_tokens")
      .update({
        user_id: userId,
        device_id: deviceId,
        platform: platform,
        enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("push_token", pushToken)
      .select()
      .single();

    if (error) throw new Error(`Failed to update push token: ${error.message}`);
    return data;
  } else {
    // Insert new token
    const { data, error } = await supabase
      .from("push_tokens")
      .insert({
        user_id: userId,
        push_token: pushToken,
        device_id: deviceId,
        platform: platform,
        enabled: true,
      })
      .select()
      .single();

    if (error)
      throw new Error(`Failed to register push token: ${error.message}`);
    return data;
  }
};

/**
 * Get all active push tokens for a specific user
 */
export const getUserTokens = async (userId) => {
  const { data, error } = await supabase
    .from("push_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (error) throw new Error(`Failed to get user tokens: ${error.message}`);
  return data;
};

/**
 * Get all active push tokens (for broadcasting)
 */
export const getAllActiveTokens = async () => {
  const { data, error } = await supabase
    .from("push_tokens")
    .select("push_token, user_id")
    .eq("enabled", true);

  if (error) throw new Error(`Failed to get all tokens: ${error.message}`);
  return data;
};

/**
 * Remove a push token (e.g., on logout or when invalid)
 */
export const removeToken = async (pushToken) => {
  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("push_token", pushToken);

  if (error) throw new Error(`Failed to remove token: ${error.message}`);
  return true;
};

/**
 * Disable a push token (soft delete)
 */
export const disableToken = async (pushToken) => {
  const { error } = await supabase
    .from("push_tokens")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("push_token", pushToken);

  if (error) throw new Error(`Failed to disable token: ${error.message}`);
  return true;
};

/**
 * Get tokens for multiple users
 */
export const getUsersTokens = async (userIds) => {
  const { data, error } = await supabase
    .from("push_tokens")
    .select("push_token, user_id")
    .in("user_id", userIds)
    .eq("enabled", true);

  if (error) throw new Error(`Failed to get users tokens: ${error.message}`);
  return data;
};

export default {
  registerPushToken,
  getUserTokens,
  getAllActiveTokens,
  removeToken,
  disableToken,
  getUsersTokens,
};
