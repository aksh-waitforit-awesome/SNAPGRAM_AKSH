import { Router } from "express"
import { sendMessage, markMessagesAsRead } from "../controllers/message"
import authMiddleware from "../middleware/authMiddleware"
const router = Router()
router.post("/send", authMiddleware, sendMessage)
router.patch("/mark", authMiddleware, markMessagesAsRead)
export default router
