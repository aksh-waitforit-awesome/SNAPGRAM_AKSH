import { Router } from "express"
import authMiddleware from "../middleware/authMiddleware"
import {
  acceptFollowRequest,
  checkIsOnline,
  followUser,
  rejectFollowRequest,
  suggestedUsers,
} from "../controllers/users"
import asyncHandler from "../utils/asyncWrapper"

const router = Router()

router.get("/suggestions", authMiddleware, suggestedUsers)

router.post("/:followingId/follow", authMiddleware, followUser)
router.patch(
  "/follow-requests/:followerId/accept",
  authMiddleware,
  asyncHandler(acceptFollowRequest),
)
router.patch(
  "/follow-requests/:followerId/reject",
  authMiddleware,
  asyncHandler(rejectFollowRequest),
)
router.get("/online/:id", asyncHandler(checkIsOnline))
export default router
