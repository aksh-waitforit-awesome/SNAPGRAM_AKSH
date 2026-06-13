import { config } from "dotenv"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
config()
const connectionString = process.env.DATABASE_URL || "file:./dev.db"
console.log("Connecting to database at", connectionString)
const adapter = new PrismaPg(connectionString)
const prisma = new PrismaClient({ adapter })
export { prisma }
