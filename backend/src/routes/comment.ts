import { Router } from "express"
import authMiddleware from "../middleware/authMiddleware"
import {
  createComment,
  getPostComments,
  deleteComment,
  toggleCommentLike,
  getCommentReplies,
} from "../controllers/comment"
const router = Router()

router.post("/", authMiddleware, createComment)
router.get("/post/:postId", authMiddleware, getPostComments)
router.get("/replies/:commentId", authMiddleware, getCommentReplies)
router.put("/like/:commentId", authMiddleware, toggleCommentLike)
router.delete("/:commentId", authMiddleware, deleteComment)

export default router
