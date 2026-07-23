import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as documents from "../controllers/documents.controller";
import * as versions from "../controllers/versions.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(documents.list));
router.post("/", asyncHandler(documents.create));
router.get("/:id", asyncHandler(documents.get));
router.patch("/:id", asyncHandler(documents.rename));
router.delete("/:id", asyncHandler(documents.remove));
router.post("/:id/collaborators", asyncHandler(documents.invite));

router.get("/:id/versions", asyncHandler(versions.list));
router.post("/:id/versions", asyncHandler(versions.save));
router.get("/:id/versions/:versionId", asyncHandler(versions.getSnapshot));
router.post("/:id/versions/:versionId/restore", asyncHandler(versions.restore));

export default router;
