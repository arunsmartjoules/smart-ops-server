import supabase from "../config/supabase.js";
import { formatTaskForInsert } from "../models/taskModel.js";

export const createTask = async (data) => {
  const formattedData = formatTaskForInsert(data);

  const { data: result, error } = await supabase
    .from("tasks")
    .insert(formattedData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return result;
};

export const getTaskById = async (taskId) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("task_id", taskId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get task: ${error.message}`);
  }
  return data;
};

export const getTasksBySite = async (siteId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    task_status = null,
    priority = null,
    assigned_to = null,
    sortBy = "created_at",
    sortOrder = "desc",
  } = options;

  const offset = (page - 1) * limit;

  let query = supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (task_status) {
    query = query.eq("task_status", task_status);
  }

  if (priority) {
    query = query.eq("priority", priority);
  }

  if (assigned_to) {
    query = query.eq("assigned_to", assigned_to);
  }

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to get tasks: ${error.message}`);

  return {
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

export const getTasksByUser = async (userId, options = {}) => {
  const { task_status = null, limit = 20 } = options;

  let query = supabase.from("tasks").select("*").eq("assigned_to", userId);

  if (task_status) {
    query = query.eq("task_status", task_status);
  }

  query = query.order("due_date", { ascending: true }).limit(limit);

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get tasks: ${error.message}`);
  return data;
};

export const getTasksDueToday = async (siteId) => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("site_id", siteId)
    .gte("due_date", `${today}T00:00:00`)
    .lte("due_date", `${today}T23:59:59`)
    .order("due_date", { ascending: true });

  if (error) throw new Error(`Failed to get tasks: ${error.message}`);
  return data;
};

export const updateTask = async (taskId, updateData) => {
  const { task_id, created_at, ...allowedUpdates } = updateData;

  const { data, error } = await supabase
    .from("tasks")
    .update(allowedUpdates)
    .eq("task_id", taskId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return data;
};

export const updateTaskStatus = async (taskId, status) => {
  const updateData = { task_status: status };

  if (status === "Completed") {
    updateData.end_time = new Date().toISOString();
  } else if (status === "In Progress") {
    updateData.start_time = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("task_id", taskId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task status: ${error.message}`);
  return data;
};

export const deleteTask = async (taskId) => {
  const { error } = await supabase.from("tasks").delete().eq("task_id", taskId);

  if (error) throw new Error(`Failed to delete task: ${error.message}`);
  return true;
};

export const getTaskStats = async (siteId) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("task_status, priority")
    .eq("site_id", siteId);

  if (error) throw new Error(`Failed to get stats: ${error.message}`);

  const stats = {
    total: data.length,
    byStatus: {},
    byPriority: {},
  };

  data.forEach((task) => {
    stats.byStatus[task.task_status] =
      (stats.byStatus[task.task_status] || 0) + 1;
    stats.byPriority[task.priority] =
      (stats.byPriority[task.priority] || 0) + 1;
  });

  return stats;
};

export default {
  createTask,
  getTaskById,
  getTasksBySite,
  getTasksByUser,
  getTasksDueToday,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
};
