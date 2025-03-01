import { Inject, Injectable } from '@nestjs/common'
import { Context, SQSEvent } from 'aws-lambda'
import { ProcessPurchaseUseCase } from '../use-cases/process-purchase.use-case'
import { plainToInstance } from 'class-transformer'
import { PurchaseEventDto } from '@otrium-assignment/shared'
import { validate } from 'class-validator'

@Injectable()
export class SQSHandler {
  private readonly processPurchaseUseCase: ProcessPurchaseUseCase

  constructor(
    @Inject(ProcessPurchaseUseCase)
    processPurchaseUseCase: ProcessPurchaseUseCase,
  ) {
    this.processPurchaseUseCase = processPurchaseUseCase
  }

  async handle(event: SQSEvent, _context?: Context): Promise<void> {
    for (const record of event.Records) {
      try {
        const purchaseEvent = plainToInstance(PurchaseEventDto, JSON.parse(record.body) as object)

        // Validate the DTO
        const errors = await validate(purchaseEvent)
        if (errors.length > 0) {
          console.error('Validation errors:', errors)
          // Handle errors properly (e.g., send to DLQ)
          continue
        }

        await this.processPurchaseUseCase.execute(purchaseEvent)
      } catch (error) {
        console.error('Error processing SQS message:', error)
        // Handle errors properly (e.g., send to DLQ)
        continue
      }
    }
  }
}
