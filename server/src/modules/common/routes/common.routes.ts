import { Router } from "express";
import { CommonController } from "../controllers/common.controller";
import { authenticateToken } from "server/src/shared/middleware/auth";
const router = Router();

const commonController = new CommonController();

router.get("/", authenticateToken, (req, res) =>
	commonController.getCommonData(req, res),
);

export { router as commonRoutes };
