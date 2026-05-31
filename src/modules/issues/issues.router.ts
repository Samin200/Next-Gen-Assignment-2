import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import * as issuesController from "./issues.controller.js";

const router = Router();

router.get("/", issuesController.list);
router.get("/:id", issuesController.getById);
router.post("/", requireAuth, issuesController.create);
router.patch("/:id", requireAuth, issuesController.update);

export default router;
