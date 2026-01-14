export const VALID_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
export const VALID_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled",
];

export const validateTask = (data) => {
  const errors = [];

  if (!data.task_title) {
    errors.push("task_title is required");
  }

  if (!data.site_id) {
    errors.push("site_id is required");
  }

  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }

  if (data.task_status && !VALID_STATUSES.includes(data.task_status)) {
    errors.push(`task_status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatTaskForInsert = (data) => {
  return {
    task_id: data.task_id || null,
    task_title: data.task_title,
    task_type: data.task_type || null,
    category: data.category || null,
    priority: data.priority || "Medium",
    task_status: data.task_status || "Pending",
    due_date: data.due_date || null,
    shift_id: data.shift_id || null,
    linked_shift_id: data.linked_shift_id || null,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    duration: data.duration || null,
    date: data.date || null,
    assignment_date: data.assignment_date || null,
    time_log_start: data.time_log_start || null,
    time_log_end: data.time_log_end || null,
    remarks: data.remarks || null,
    location: data.location || null,
    gps_latitude: data.gps_latitude || null,
    gps_longitude: data.gps_longitude || null,
    source_reference_id: data.source_reference_id || null,
    attachments: data.attachments || null,
    created_by: data.created_by || null,
    sla_status: data.sla_status || null,
    assigned_to: data.assigned_to || null,
    signature: data.signature || null,
    support_users: data.support_users || null,
    site_id: data.site_id,
    teams: data.teams || null,
    spares: data.spares || null,
    assigned_to_name: data.assigned_to_name || null,
    teams_name: data.teams_name || null,
    support_users_name: data.support_users_name || null,
  };
};

export default {
  VALID_PRIORITIES,
  VALID_STATUSES,
  validateTask,
  formatTaskForInsert,
};
