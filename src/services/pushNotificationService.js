import supabase from "../config/supabase.js";
import {
  getUserTokens,
  getUsersTokens,
  getAllActiveTokens,
} from "./pushTokenService.js";

/**
 * Send push notification using Expo Push Notification API
 * @param {Array} tokens - Array of Expo push tokens
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional data to send with notification
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided for push notification");
    return { success: false, error: "No tokens provided" };
  }

  // Filter valid Expo push tokens
  const validTokens = tokens.filter(
    (token) =>
      token.startsWith("ExponentPushToken[") ||
      token.startsWith("ExpoPushToken[")
  );

  if (validTokens.length === 0) {
    console.log("No valid Expo push tokens found");
    return { success: false, error: "No valid tokens" };
  }

  // Prepare messages
  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title: title,
    body: body,
    data: data,
    priority: "high",
    channelId: "default",
  }));

  try {
    // Send to Expo Push Notification API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Push notification error:", result);
      return { success: false, error: result };
    }

    console.log("Push notification sent:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to a specific user
 */
export const sendNotificationToUser = async (
  userId,
  title,
  body,
  data = {}
) => {
  const tokenRecords = await getUserTokens(userId);

  if (!tokenRecords || tokenRecords.length === 0) {
    return { success: false, error: "No tokens found for user" };
  }

  const tokens = tokenRecords.map((record) => record.push_token);
  const result = await sendPushNotification(tokens, title, body, data);

  // Log the notification
  if (result.success) {
    await logNotification(userId, title, body, data.type || "custom", "sent");
  } else {
    await logNotification(userId, title, body, data.type || "custom", "failed");
  }

  return result;
};

/**
 * Send push notification to multiple users
 */
export const sendNotificationToUsers = async (
  userIds,
  title,
  body,
  data = {}
) => {
  const tokenRecords = await getUsersTokens(userIds);

  if (!tokenRecords || tokenRecords.length === 0) {
    return { success: false, error: "No tokens found for users" };
  }

  const tokens = tokenRecords.map((record) => record.push_token);
  const result = await sendPushNotification(tokens, title, body, data);

  // Log the notification for each user
  for (const userId of userIds) {
    if (result.success) {
      await logNotification(userId, title, body, data.type || "custom", "sent");
    } else {
      await logNotification(
        userId,
        title,
        body,
        data.type || "custom",
        "failed"
      );
    }
  }

  return result;
};

/**
 * Send push notification to all users
 */
export const sendNotificationToAll = async (title, body, data = {}) => {
  const tokenRecords = await getAllActiveTokens();

  if (!tokenRecords || tokenRecords.length === 0) {
    return { success: false, error: "No tokens found" };
  }

  const tokens = tokenRecords.map((record) => record.push_token);
  const result = await sendPushNotification(tokens, title, body, data);

  // Log the notification for each user
  for (const record of tokenRecords) {
    if (result.success) {
      await logNotification(
        record.user_id,
        title,
        body,
        data.type || "custom",
        "sent"
      );
    } else {
      await logNotification(
        record.user_id,
        title,
        body,
        data.type || "custom",
        "failed"
      );
    }
  }

  return result;
};

/**
 * Log a sent notification
 */
export const logNotification = async (
  userId,
  title,
  body,
  notificationType,
  status = "sent"
) => {
  try {
    const { error } = await supabase.from("notification_logs").insert({
      user_id: userId,
      title: title,
      body: body,
      notification_type: notificationType,
      status: status,
      sent_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log notification:", error);
    }
  } catch (err) {
    console.error("Error logging notification:", err);
  }
};

/**
 * Get notification logs with pagination
 */
export const getNotificationLogs = async (options = {}) => {
  const { page = 1, limit = 50, userId = null, type = null } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("notification_logs")
    .select("*, users(name, employee_code)", { count: "exact" });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (type) {
    query = query.eq("notification_type", type);
  }

  query = query
    .order("sent_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error)
    throw new Error(`Failed to get notification logs: ${error.message}`);

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

export default {
  sendPushNotification,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToAll,
  logNotification,
  getNotificationLogs,
};
