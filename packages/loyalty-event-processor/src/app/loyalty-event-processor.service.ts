// loyalty-writer/loyalty-service-writer.service.ts
import { Injectable } from '@nestjs/common';
import { SQSHandler } from './infrastructure/sqs-handler';
import { Context, SQSEvent } from 'aws-lambda';

@Injectable()
export class LoyaltyEventProcessorService {
  constructor(
    private readonly sqsHandler: SQSHandler,
  ) {}
  async handler(event: SQSEvent, context: Context) {
    return this.sqsHandler.handle(event, context)
  }
}