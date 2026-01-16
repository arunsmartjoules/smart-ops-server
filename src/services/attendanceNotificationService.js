import supabase from "../config/supabase.js";
import { getTodayAttendance } from "./attendanceLogsService.js";
import { sendNotificationToUser } from "./pushNotificationService.js";
import {
  getCheckInMessage,
  getCheckOutMessage,
  getUserPreferences,
} from "./notificationSettingsService.js";

/**
 * Find users who haven't checked in by the specified time
 * @returns Array of user IDs who missed check-in
 */
export const findMissedCheckIns = async () => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Get all active users (excluding admins if needed)
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("user_id, name, work_location_type")
    .eq("is_active", true);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return [];
  }

  const missedCheckIns = [];

  for (const user of users) {
    // Skip if work location type is not set (might be admins)
    if (!user.work_location_type) continue;

    // Check if user has checked in today
    const attendance = await getTodayAttendance(user.user_id);

    if (!attendance) {
      // User hasn't checked in
      missedCheckIns.push(user.user_id);
    }
  }

  return missedCheckIns;
};

/**
 * Find users who checked in but haven't checked out by the specified time
 * @returns Array of user IDs who missed check-out
 */
export const findMissedCheckOuts = async () => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Find attendance records with check-in but no check-out for today
  const { data: attendanceRecords, error } = await supabase
    .from("attendance_logs")
    .select("user_id")
    .eq("date", today)
    .not("check_in_time", "is", null)
    .is("check_out_time", null);

  if (error) {
    console.error("Error fetching attendance records:", error);
    return [];
  }

  return attendanceRecords.map((record) => record.user_id);
};

/**
 * Send check-in reminder notifications to users who haven't checked in
 */
export const sendMissedCheckInNotifications = async () => {
  try {
    const missedUserIds = await findMissedCheckIns();

    if (missedUserIds.length === 0) {
      console.log("No users found who missed check-in");
      return { success: true, count: 0 };
    }

    const message = await getCheckInMessage();
    let sentCount = 0;

    for (const userId of missedUserIds) {
      // Check user preferences
      const preferences = await getUserPreferences(userId);

      if (!preferences.attendance_notifications_enabled) {
        console.log(`User ${userId} has disabled attendance notifications`);
        continue;
      }

      const result = await sendNotificationToUser(
        userId,
        "Check-In Reminder",
        message || "Don't forget to check in!",
        { type: "check_in_reminder", screen: "attendance" }
      );

      if (result.success) {
        sentCount++;
      }
    }

    console.log(`Sent ${sentCount} check-in reminder notifications`);
    return { success: true, count: sentCount };
  } catch (error) {
    console.error("Error sending check-in notifications:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send check-out reminder notifications to users who haven't checked out
 */
export const sendMissedCheckOutNotifications = async () => {
  try {
    const missedUserIds = await findMissedCheckOuts();

    if (missedUserIds.length === 0) {
      console.log("No users found who missed check-out");
      return { success: true, count: 0 };
    }

    const message = await getCheckOutMessage();
    let sentCount = 0;

    for (const userId of missedUserIds) {
      // Check user preferences
      const preferences = await getUserPreferences(userId);

      if (!preferences.attendance_notifications_enabled) {
        console.log(`User ${userId} has disabled attendance notifications`);
        continue;
      }

      const result = await sendNotificationToUser(
        userId,
        "Check-Out Reminder",
        message || "Remember to check out!",
        { type: "check_out_reminder", screen: "attendance" }
      );

      if (result.success) {
        sentCount++;
      }
    }

    console.log(`Sent ${sentCount} check-out reminder notifications`);
    return { success: true, count: sentCount };
  } catch (error) {
    console.error("Error sending check-out notifications:", error);
    return { success: false, error: error.message };
  }
};

export default {
  findMissedCheckIns,
  findMissedCheckOuts,
  sendMissedCheckInNotifications,
  sendMissedCheckOutNotifications,
};
