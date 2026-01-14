export const validateSite = (data) => {
  const errors = [];

  if (!data.site_id) {
    errors.push("site_id is required");
  }

  if (!data.name) {
    errors.push("name is required");
  }

  if (data.radius !== undefined && data.radius !== null) {
    const radius = parseInt(data.radius);
    if (isNaN(radius) || radius < 100 || radius > 1000) {
      errors.push("radius must be between 100 and 1000 meters");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatSiteForInsert = (data) => {
  return {
    site_id: data.site_id,
    name: data.name,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || "India",
    is_active: data.is_active !== undefined ? data.is_active : true,
    radius: data.radius ? parseInt(data.radius) : 500,
  };
};

export default {
  validateSite,
  formatSiteForInsert,
};
