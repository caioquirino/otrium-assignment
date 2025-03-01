import { NestFactory } from '@nestjs/core'
import { Context, SQSEvent } from 'aws-lambda'
import { AppModule } from './app/app.module'
import { LoyaltyEventProcessorService } from './app/loyalty-event-processor.service'

let cachedHandler: LoyaltyEventProcessorService

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  return app.get(LoyaltyEventProcessorService)
}
export const handler = async (event: SQSEvent, context: Context) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap()
  }
  return await cachedHandler.handler(event, context)
}
