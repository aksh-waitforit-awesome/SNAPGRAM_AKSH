import { CustomError } from "../errors/index"
import { Request, Response, NextFunction } from "express"
import { StatusCodes } from "http-status-codes"
const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("err", err)
  if (err instanceof CustomError) {
    return res.status(err?.statusCode).json({ message: err.message })
  }
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: err.message || "internal server error" })
}

export default errorHandler
