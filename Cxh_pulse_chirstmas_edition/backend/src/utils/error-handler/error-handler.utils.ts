import {
  HttpException,
  Logger,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common'

export const throwServiceError = (
  error: any,
  logger: Logger,
  context: string
): never => {
  logger.error(`Error in module ${context}: ${error.stack}`)

  if (error instanceof BadRequestException) {
    throw error
  }

  if (error instanceof HttpException) {
    throw error
  }

  throw new InternalServerErrorException(
    error.message || 'Internal server error'
  )
}
