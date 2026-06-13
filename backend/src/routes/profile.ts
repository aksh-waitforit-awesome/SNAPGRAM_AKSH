import { Router } from "express"
import authMiddleware from "../middleware/authMiddleware"
import {
  updateProfileBio,
  updateProfileAvatar,
  getUserProfile,
  searchUsers,
  togglePrivacy,
} from "../controllers/profile"
const router = Router()

router.get("/search", authMiddleware, searchUsers)
router.get("/:profileId", authMiddleware, getUserProfile)
router.patch("/toggle/privacy", authMiddleware, togglePrivacy)
router.route("/update/bio").put(authMiddleware, updateProfileBio)
router.route("/update/avatar").put(authMiddleware, updateProfileAvatar)
export default router
