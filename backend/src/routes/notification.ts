import express from "express"
import {
  getAllNotifications,
  getUnreadCount,
  getUnreadNotifications,
  markAllNotificationsAsRead,
} from "../controllers/notification"
import asyncHandler from "../utils/asyncWrapper"
const router = express.Router()
import authMiddleware from "../middleware/authMiddleware"
router.get("/", authMiddleware, asyncHandler(getAllNotifications))
router.get("/unread", authMiddleware, asyncHandler(getUnreadNotifications))
router.get("/unread-count", authMiddleware, getUnreadCount)
router.get("/read", authMiddleware, asyncHandler(markAllNotificationsAsRead))
router.patch("/marked",authMiddleware,markAllNotificationsAsRead)
export default router
