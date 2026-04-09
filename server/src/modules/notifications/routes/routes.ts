import { Router } from "express"
import { NotificationsController } from "../controllers/notifications.controller"
import { authenticateToken } from "server/src/shared/middleware/auth"
const router = Router()

const notificationsController = new NotificationsController()

router.post("/fcm-token", authenticateToken, (req, res) => notificationsController.storeFcmToken(req, res))

export {router as notificationRoutes}