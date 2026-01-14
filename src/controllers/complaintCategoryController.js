import complaintCategoryService from "../services/complaintCategoryService.js";

/**
 * Get all complaint categories
 */
export const getAll = async (req, res) => {
  try {
    const categories = await complaintCategoryService.getAllCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get category by ID
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await complaintCategoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create a new category
 */
export const create = async (req, res) => {
  try {
    const { category, description } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: "Category name is required",
      });
    }

    const newCategory = await complaintCategoryService.createCategory({
      category,
      description,
    });

    res.status(201).json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update a category
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description } = req.body;

    const updatedCategory = await complaintCategoryService.updateCategory(id, {
      category,
      description,
    });

    res.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete a category
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await complaintCategoryService.deleteCategory(id);

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
