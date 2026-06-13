import { Request, Response } from "express"
import { prisma } from "../lib/prisma"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import asyncWrapper from "../utils/asyncWrapper"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwt"
import { JwtPayload } from "../schema/jwt.schema"
import { BadRequestError } from "../errors"
import asyncHandler from "../utils/asyncWrapper"
import { RegisterSchema, loginSchema } from "../schema/auth.schema"
export const register = asyncWrapper(async (req: Request, res: Response) => {
  console.log("Register endpoint hit with data:", req.body) // Debug log
  const { username, email, password } = RegisterSchema.parse(req.body)
  if (!username || !email || !password) {
    throw new BadRequestError("Username, email and password are required")
  }
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new BadRequestError("User with this email already exists")
  }
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword, // In production, hash the password before storing
    },
  })
  res.status(201).json({
    message: "User registered successfully",
    user: { id: user.id, username: user.username, email: user.email },
  })
})

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }
  const user = await prisma.user.findUnique({
    where: { email },
  })
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" })
  }
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" })
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    username: user.username,
  })
  const refreshToken = generateRefreshToken({
    sub: user.id,
    username: user.username,
  })

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.json({
    accessToken,
    message: "login successfull",
    user: {
      username: user?.username,
      email: user?.email,
      id: user?.id,
      bio: user?.bio,
      avatarUrl: user?.avatarUrl,
    },
  })
}

export const refreshSession = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" })
  }
  try {
    const decode = verifyToken(refreshToken, "refresh")
    const user = await prisma.user.findUnique({ where: { id: decode.sub } })
    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }
    const accessToken = generateAccessToken({
      sub: user.id,
      username: user.username,
    })
    res.status(200).json({
      accessToken,
      user: {
        username: user?.username,
        email: user?.email,
        id: user?.id,
        bio: user?.bio,
        avatarUrl: user?.avatarUrl,
      },
    })
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" })
  }
}
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  })
  res.status(200).json({ message: "Logged out Successfully" })
})
