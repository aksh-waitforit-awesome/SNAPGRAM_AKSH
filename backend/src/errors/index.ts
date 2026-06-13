import { StatusCodes } from "http-status-codes"

interface CustomErrorParams {
  message: string
  statusCode: number
}

class CustomError extends Error {
  statusCode: number

  constructor({ message, statusCode }: CustomErrorParams) {
    super(message)

    this.name = "CustomError"
    this.statusCode = statusCode
  }
}
class BadRequestError extends CustomError {
  constructor(message: string) {
    super({ message, statusCode: StatusCodes.BAD_REQUEST })
    this.name = "BadRequestError"
  }
}
class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super({ message, statusCode: StatusCodes.UNAUTHORIZED })
    this.name = "UnauthorizedError"
  }
}
class NotFoundError extends CustomError {
  constructor(message: string) {
    super({ message, statusCode: StatusCodes.NOT_FOUND })
    this.name = "NotFoundError"
  }
}
class ConflictError extends CustomError {
  constructor(message: string) {
    super({ message, statusCode: StatusCodes.CONFLICT })
    this.name = "ConflictError"
  }
}
class ForbiddenError extends CustomError {
  constructor(message: string) {
    super({message,statusCode:StatusCodes.FORBIDDEN})
    this.name = "ForbiddenError"
  }
}
export { CustomError, BadRequestError, UnauthorizedError, NotFoundError, ConflictError, ForbiddenError }
