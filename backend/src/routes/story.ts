import { createStory, getStoryFeed } from "./../controllers/story"
import { Router } from "express"
import authMiddleware from "../middleware/authMiddleware"
const router = Router()
router.route("/").post( authMiddleware, createStory).get(authMiddleware,getStoryFeed)
export default router
