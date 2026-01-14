export const VALID_ROLES = ["admin", "manager", "technician", "staff"];

export const validateUser = (data) => {
  const errors = [];

  if (!data.user_id && !data.email) {
    errors.push("user_id or email is required");
  }

  if (data.role && !VALID_ROLES.includes(data.role)) {
    errors.push(`role must be one of: ${VALID_ROLES.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatUserForInsert = (data) => {
  return {
    user_id: data.user_id,
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || "staff",
    site_id: data.site_id || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
    is_superadmin:
      data.is_superadmin !== undefined ? data.is_superadmin : false,
    employee_code: data.employee_code || null,
    date_of_birth: data.date_of_birth || null,
    site_code: data.site_code || null,
    platform_email: data.platform_email || null,
    mobile: data.mobile || null,
    approving_authority: data.approving_authority || null,
    designation: data.designation || null,
    department: data.department || null,
    status: data.status || null,
    travel_approver: data.travel_approver || null,
    assigned_shift_code: data.assigned_shift_code || null,
    supervisor: data.supervisor || null,
    date_of_joining: data.date_of_joining || null,
    project_type: data.project_type || null,
    work_location_type: data.work_location_type || null,
  };
};

export default {
  VALID_ROLES,
  validateUser,
  formatUserForInsert,
};
