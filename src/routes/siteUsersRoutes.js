import express from "express";
import siteUsersController from "../controllers/siteUsersController.js";
import { verifyToken } from "../middleware/auth.ts";

const router = express.Router();

/**
 * Site Users Routes
 * Base path: /api/site-users
 */

// Get all site-user mappings with filters
router.get("/", verifyToken, siteUsersController.getAll);

// Get users at a specific site
router.get("/by-site/:siteId", verifyToken, siteUsersController.getBySite);

// Get sites for a specific user
router.get("/by-user/:userId", verifyToken, siteUsersController.getByUser);

// Assign user to site
router.post("/", verifyToken, siteUsersController.assignUser);

// Update assignment
router.put(
  "/:siteId/:userId",
  verifyToken,
  siteUsersController.updateAssignment
);

// Remove assignment
router.delete(
  "/:siteId/:userId",
  verifyToken,
  siteUsersController.removeAssignment
);

export default router;
