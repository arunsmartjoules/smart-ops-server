import tasksService from "../services/tasksService.js";
import { validateTask, VALID_STATUSES } from "../models/taskModel.js";

/**
 * Tasks Controller
 */

export const create = async (req, res) => {
  try {
    const validation = validateTask(req.body);
    if (!validation.isValid) {
      return res
        .status(400)
        .json({ success: false, errors: validation.errors });
    }

    const task = await tasksService.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const task = await tasksService.getTaskById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBySite = async (req, res) => {
  try {
    const {
      page,
      limit,
      task_status,
      priority,
      assigned_to,
      sortBy,
      sortOrder,
    } = req.query;
    const result = await tasksService.getTasksBySite(req.params.siteId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      task_status,
      priority,
      assigned_to,
      sortBy,
      sortOrder,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const { task_status, limit } = req.query;
    const tasks = await tasksService.getTasksByUser(req.params.userId, {
      task_status,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDueToday = async (req, res) => {
  try {
    const tasks = await tasksService.getTasksDueToday(req.params.siteId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const existing = await tasksService.getTaskById(req.params.taskId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const task = await tasksService.updateTask(req.params.taskId, req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const existing = await tasksService.getTaskById(req.params.taskId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const task = await tasksService.updateTaskStatus(req.params.taskId, status);
    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const existing = await tasksService.getTaskById(req.params.taskId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    await tasksService.deleteTask(req.params.taskId);
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await tasksService.getTaskStats(req.params.siteId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  create,
  getById,
  getBySite,
  getByUser,
  getDueToday,
  update,
  updateStatus,
  remove,
  getStats,
};
