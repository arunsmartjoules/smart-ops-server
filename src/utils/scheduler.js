import {
  sendMissedCheckInNotifications,
  sendMissedCheckOutNotifications,
} from "../services/attendanceNotificationService.js";
import {
  getCheckInTime,
  getCheckOutTime,
} from "../services/notificationSettingsService.js";

/**
 * Simple scheduler for attendance notifications
 * Checks every minute if it's time to send notifications
 */

let checkInScheduled = false;
let checkOutScheduled = false;

const parseTime = (timeString) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours, minutes };
};

const getCurrentISTTime = () => {
  const now = new Date();
  const istTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const [hours, minutes] = istTime.split(":").map(Number);
  return { hours, minutes };
};

const isSameTime = (time1, time2) => {
  return time1.hours === time2.hours && time1.minutes === time2.minutes;
};

/**
 * Check and send notifications at scheduled times
 */
const checkScheduledNotifications = async () => {
  try {
    const currentTime = getCurrentISTTime();

    // Get configured times from database
    const checkInTimeStr = await getCheckInTime();
    const checkOutTimeStr = await getCheckOutTime();

    const checkInTime = parseTime(checkInTimeStr || "09:30");
    const checkOutTime = parseTime(checkOutTimeStr || "18:30");

    // Check-in notifications
    if (isSameTime(currentTime, checkInTime) && !checkInScheduled) {
      console.log(
        `[Scheduler] Sending check-in notifications at ${checkInTimeStr}`
      );
      checkInScheduled = true;
      await sendMissedCheckInNotifications();
    } else if (!isSameTime(currentTime, checkInTime)) {
      checkInScheduled = false; // Reset for next day
    }

    // Check-out notifications
    if (isSameTime(currentTime, checkOutTime) && !checkOutScheduled) {
      console.log(
        `[Scheduler] Sending check-out notifications at ${checkOutTimeStr}`
      );
      checkOutScheduled = true;
      await sendMissedCheckOutNotifications();
    } else if (!isSameTime(currentTime, checkOutTime)) {
      checkOutScheduled = false; // Reset for next day
    }
  } catch (error) {
    console.error("[Scheduler] Error checking notifications:", error);
  }
};

/**
 * Start the notification scheduler
 */
export const startNotificationScheduler = () => {
  console.log("[Scheduler] Starting attendance notification scheduler");

  // Check every minute
  setInterval(checkScheduledNotifications, 60 * 1000);

  // Run immediately on start
  checkScheduledNotifications();
};

export default {
  startNotificationScheduler,
};
