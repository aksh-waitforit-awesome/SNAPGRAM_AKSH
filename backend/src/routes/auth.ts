import { Router } from "express"
const router = Router()
import { login, register, refreshSession, logout } from "../controllers/auth"
router.post("/register", register)
router.post("/login", login)
router.post("/logout",logout)
router.get("/refresh", refreshSession)

export default router
