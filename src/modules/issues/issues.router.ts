import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import * as issuesController from "./issues.controller.js";

const router = Router();

router.get("/", issuesController.list);
router.post("/", requireAuth, issuesController.create);

export default router;
