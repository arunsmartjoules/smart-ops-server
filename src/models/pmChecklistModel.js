export const VALID_FIELD_TYPES = [
  "Text",
  "Number",
  "Yes/No",
  "Multiple Choice",
  "Date",
  "Image",
];
export const VALID_STATUSES = ["Active", "Inactive"];

export const validatePMChecklist = (data) => {
  const errors = [];

  if (!data.checklist_id) {
    errors.push("checklist_id is required");
  }

  if (!data.task_name) {
    errors.push("task_name is required");
  }

  if (data.field_type && !VALID_FIELD_TYPES.includes(data.field_type)) {
    errors.push(`field_type must be one of: ${VALID_FIELD_TYPES.join(", ")}`);
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatPMChecklistForInsert = (data) => {
  return {
    checklist_id: data.checklist_id,
    maintenance_type: data.maintenance_type || null,
    task_name: data.task_name,
    field_type: data.field_type || "Text",
    sla_code: data.sla_code || null,
    image_mandatory: data.image_mandatory || false,
    remarks_mandatory: data.remarks_mandatory || false,
    sequence_no: data.sequence_no || 1,
    version: data.version || 1,
    status: data.status || "Active",
    created_by: data.created_by || null,
    updated_by: data.updated_by || null,
    asset_type: data.asset_type || null,
    site_id: data.site_id || null,
    teams: data.teams || null,
    teams_name: data.teams_name || null,
  };
};

export default {
  VALID_FIELD_TYPES,
  VALID_STATUSES,
  validatePMChecklist,
  formatPMChecklistForInsert,
};
