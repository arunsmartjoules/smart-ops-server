export const VALID_STATUSES = ["Present", "Absent", "Half Day", "Leave"];

export const validateAttendanceLog = (data) => {
  const errors = [];

  if (!data.user_id) {
    errors.push("user_id is required");
  }

  // site_id is optional for WFH
  /* if (!data.site_id) {
    errors.push("site_id is required");
  } */

  if (!data.date) {
    errors.push("date is required");
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatAttendanceLogForInsert = (data) => {
  return {
    user_id: data.user_id,
    site_id: data.site_id,
    check_in_time: data.check_in_time || null,
    check_out_time: data.check_out_time || null,
    check_in_latitude: data.check_in_latitude || null,
    check_in_longitude: data.check_in_longitude || null,
    check_out_latitude: data.check_out_latitude || null,
    check_out_longitude: data.check_out_longitude || null,
    check_in_address: data.check_in_address || null,
    check_out_address: data.check_out_address || null,
    shift_id: data.shift_id || null,
    status: data.status || "Present",
    remarks: data.remarks || null,
    date: data.date,
  };
};

export default {
  VALID_STATUSES,
  validateAttendanceLog,
  formatAttendanceLogForInsert,
};
