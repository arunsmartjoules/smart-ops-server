import supabase from "../config/supabase.js";

/**
 * Get all complaint categories
 */
export const getAllCategories = async () => {
  const { data, error } = await supabase
    .from("complaint_category")
    .select("*")
    .order("category", { ascending: true });

  if (error) throw new Error(`Failed to get categories: ${error.message}`);
  return data;
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id) => {
  const { data, error } = await supabase
    .from("complaint_category")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get category: ${error.message}`);
  }
  return data;
};

/**
 * Create a new category
 */
export const createCategory = async (categoryData) => {
  const { data, error } = await supabase
    .from("complaint_category")
    .insert({
      category: categoryData.category,
      description: categoryData.description || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  return data;
};

/**
 * Update a category
 */
export const updateCategory = async (id, updateData) => {
  const { data, error } = await supabase
    .from("complaint_category")
    .update({
      category: updateData.category,
      description: updateData.description,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update category: ${error.message}`);
  return data;
};

/**
 * Delete a category
 */
export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from("complaint_category")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete category: ${error.message}`);
  return true;
};

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
