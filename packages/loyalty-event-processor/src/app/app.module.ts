import { Module } from '@nestjs/common';
import { ProcessPurchaseUseCase } from './use-cases/process-purchase.use-case';
import { SQSHandler } from './infrastructure/sqs-handler';
import {
  OtriumAssignmentSharedModule,
  SharedModuleOptions
} from '@otrium-assignment/shared';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoyaltyEventProcessorService } from './loyalty-event-processor.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.dev', '.env.prod'],
      isGlobal: true,
    }),
    OtriumAssignmentSharedModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<SharedModuleOptions> => ({
        dynamoDBModuleOptions: {
          loyalty: {
            tableName: configService.getOrThrow<string>('dynamodb_loyalty_tableName'),
          },
          awsConfig: {
            region: configService.getOrThrow<string>('aws_region'),
          },
        }
      }),
      inject: [ConfigService],
    })
  ],
  providers: [ProcessPurchaseUseCase, SQSHandler, LoyaltyEventProcessorService],
})
export class AppModule {}