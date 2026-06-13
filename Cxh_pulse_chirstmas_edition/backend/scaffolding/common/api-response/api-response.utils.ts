import { HttpStatus } from '@nestjs/common'
import { ApiResponseMessageEnum } from '../enum/enum';

export class ApiResponse<T> {
  constructor(
    public data: T,
    public message: string = ApiResponseMessageEnum.SUCCESS,
    public statusCode: HttpStatus = HttpStatus.OK
  ) {}
}