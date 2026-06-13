import { HttpStatus } from '@nestjs/common'

export class ApiResponse<T> {
  constructor(
    public data: T,
    public message: string = 'Success',
    public statusCode: HttpStatus = HttpStatus.OK
  ) {}
}
