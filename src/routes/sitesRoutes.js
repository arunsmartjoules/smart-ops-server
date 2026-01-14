import express from "express";
import sitesController from "../controllers/sitesController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Sites Routes
 * Base path: /api/sites
 */

router.post("/", verifyToken, sitesController.create);
router.get("/", verifyToken, sitesController.getAll);
router.get("/:siteId", verifyToken, sitesController.getById);
router.put("/:siteId", verifyToken, sitesController.update);
router.delete("/:siteId", verifyToken, sitesController.remove);

// Bulk operations
router.post("/bulk-update", verifyToken, sitesController.bulkUpdate);
router.post("/bulk-delete", verifyToken, sitesController.bulkRemove);

export default router;
