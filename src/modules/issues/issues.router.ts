import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";
import * as issuesController from "./issues.controller.js";

const router = Router();

// Issue routes — public read, authenticated write, maintainer-only delete.

// Public list and detail
router.get("/", issuesController.list);
router.get("/:id", issuesController.getById);

// Authenticated creation
router.post("/", requireAuth, issuesController.create);

// Authenticated update (permission logic inside service layer)
router.patch("/:id", requireAuth, issuesController.update);

// Maintainer-only delete
router.delete("/:id", requireAuth, requireRole("maintainer"), issuesController.remove);

export default router;
