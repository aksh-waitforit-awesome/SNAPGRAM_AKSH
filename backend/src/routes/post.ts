import { Router } from "express"
import authMiddleware from "../middleware/authMiddleware"
import {
  createPost,
  deletePost,
  getFeed,
  getPostById,
  toggleLike,
  updatePost,
} from "../controllers/post"
import asyncHandler from "../utils/asyncWrapper"

const router = Router()
router.route("/").post(authMiddleware, createPost).get(authMiddleware, getFeed)
router
  .route("/:postId")
  .get(getPostById)
  .delete(authMiddleware, deletePost)
  .put(authMiddleware, updatePost)
export default router
router.route("/liked/:postId").post(authMiddleware, toggleLike)
