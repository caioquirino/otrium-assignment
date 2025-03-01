import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator'

export class PurchaseEventDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly orderId: string

  @IsNumber()
  @IsNotEmpty()
  readonly totalAmount: number

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly transactionId: string

  constructor(userId: string, orderId: string, totalAmount: number, transactionId: string) {
    this.userId = userId
    this.orderId = orderId
    this.totalAmount = totalAmount
    this.transactionId = transactionId
  }
}
