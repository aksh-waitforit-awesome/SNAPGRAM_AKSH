import { Router } from "express"
import authMiddleware from "../middleware/authMiddleware"
import {
  createOrGetConversation,
  findConversations,
  getConversationById,
} from "../controllers/conversation"
const router = Router()

router.route("/").get(authMiddleware, findConversations)
router
  .route("/:id")
  .get(authMiddleware, getConversationById)
  .post(authMiddleware, createOrGetConversation)
export default router
