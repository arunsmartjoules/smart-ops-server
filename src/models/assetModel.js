export const VALID_STATUSES = [
  "Active",
  "Inactive",
  "Under Maintenance",
  "Decommissioned",
];

export const validateAsset = (data) => {
  const errors = [];

  if (!data.asset_id) {
    errors.push("asset_id is required");
  }

  if (!data.asset_name) {
    errors.push("asset_name is required");
  }

  if (!data.site_id) {
    errors.push("site_id is required");
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatAssetForInsert = (data) => {
  return {
    asset_id: data.asset_id,
    asset_name: data.asset_name,
    asset_type: data.asset_type || null,
    site_id: data.site_id,
    location: data.location || null,
    floor: data.floor || null,
    make: data.make || null,
    model: data.model || null,
    serial_number: data.serial_number || null,
    installation_date: data.installation_date || null,
    warranty_end_date: data.warranty_end_date || null,
    status: data.status || "Active",
  };
};

export default {
  VALID_STATUSES,
  validateAsset,
  formatAssetForInsert,
};
