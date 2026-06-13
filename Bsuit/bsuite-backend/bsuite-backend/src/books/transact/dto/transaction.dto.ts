import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TransactionTypeName } from "src/common/enum/transaction-type.enum";

export class TransactionDto {
  @IsEnum(TransactionTypeName)
  @IsNotEmpty()
  transactionTypeName:TransactionTypeName

  @IsNotEmpty()
  transactionTypeId:string

  @IsOptional()
  paymentId:string
}
