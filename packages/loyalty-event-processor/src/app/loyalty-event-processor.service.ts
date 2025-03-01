import { Inject, Injectable } from '@nestjs/common'
import { SQSHandler } from './infrastructure/sqs-handler'
import { Context, SQSEvent } from 'aws-lambda'

@Injectable()
export class LoyaltyEventProcessorService {
  private readonly sqsHandler: SQSHandler

  constructor(
    @Inject(SQSHandler)
    sqsHandler: SQSHandler,
  ) {
    this.sqsHandler = sqsHandler
  }
  async handler(event: SQSEvent, context: Context) {
    return this.sqsHandler.handle(event, context)
  }
}
