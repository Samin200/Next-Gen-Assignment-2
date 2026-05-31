import { Router } from "express";

import * as authController from "./auth.controller.js";

const router = Router();

// Auth routes — public signup and login.

router.post("/signup", authController.signup);
router.post("/login", authController.login);

export default router;
