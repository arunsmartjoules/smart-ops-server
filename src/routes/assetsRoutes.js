import express from "express";
import assetsController from "../controllers/assetsController.js";
import { verifyToken, verifyApiKey } from "../middleware/auth.js";

const router = express.Router();

/**
 * Assets Routes
 * Base path: /api/assets
 */

router.post("/", verifyToken, assetsController.create);
router.get("/site/:siteId", verifyToken, assetsController.getBySite);
router.get("/site/:siteId/search", verifyToken, assetsController.search);
router.get(
  "/site/:siteId/type/:assetType",
  verifyToken,
  assetsController.getByType
);
router.get(
  "/site/:siteId/location/:location",
  verifyToken,
  assetsController.getByLocation
);
router.get(
  "/site/:siteId/warranty",
  verifyToken,
  assetsController.getUnderWarranty
);
router.get(
  "/site/:siteId/warranty-expiring",
  verifyToken,
  assetsController.getWarrantyExpiring
);
router.get("/site/:siteId/stats", verifyToken, assetsController.getStats);
router.get("/:assetId", verifyToken, assetsController.getById);
router.put("/:assetId", verifyToken, assetsController.update);
router.patch("/:assetId/status", verifyToken, assetsController.updateStatus);
router.delete("/:assetId", verifyToken, assetsController.remove);

export default router;
