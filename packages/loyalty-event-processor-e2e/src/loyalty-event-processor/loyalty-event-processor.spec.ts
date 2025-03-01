// packages/loyalty-writer/src/loyalty-event-processor.service.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyEventProcessorService } from '@otrium-assignment/loyalty-event-processor/src/app/loyalty-event-processor.service';
import { AppModule } from '@otrium-assignment/loyalty-event-processor/src/app/app.module';
import { SQSEvent, Context } from 'aws-lambda';
import { DynamoDBLoyaltyUserRepository } from '@otrium-assignment/shared';
import { v4 as uuidv4 } from 'uuid';

describe('LoyaltyEventProcessorService (E2E - Simulated SQS)', () => {
  let service: LoyaltyEventProcessorService;
  let repository: DynamoDBLoyaltyUserRepository;

  let userIdsToDelete: Array<string> = []

  const createTestUserId = async () => {
    const userId = uuidv4()
    await repository.deleteLoyalty(userId);
    userIdsToDelete.push(userId)
    return userId
  }


  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<LoyaltyEventProcessorService>(LoyaltyEventProcessorService);
    repository = module.get<DynamoDBLoyaltyUserRepository>(DynamoDBLoyaltyUserRepository);
  });

  afterAll(async () => {
    // Clean up DynamoDB *after* all tests
    for(const testUserId in userIdsToDelete) {
      await repository.deleteLoyalty(testUserId);
    }
    userIdsToDelete = []
  });

  it('should process a simulated SQS event and update DynamoDB', async () => {
    const testUserId = await createTestUserId();
    const orderId = uuidv4();
    const transactionId = uuidv4();
    const totalAmount = 125;
    const expectedPoints = Math.floor(totalAmount * 1);

    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: 'test-message-id',
          receiptHandle: 'test-receipt-handle',
          body: JSON.stringify({ userId: testUserId, orderId, totalAmount, transactionId }),
          attributes: {} as any,
          messageAttributes: {},
          md5OfBody: 'mock-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'mock-arn',
          awsRegion: 'us-east-1',
        },
      ],
    };

    const context: Context = {} as any;

    await service.handler(sqsEvent, context);

    const updatedUser = await repository.getUser(testUserId);

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.points).toBe(expectedPoints);
    expect(updatedUser?.rewardHistory.length).toBe(1);
    expect(updatedUser?.rewardHistory[0].type).toBe('EARN');
    expect(updatedUser?.rewardHistory[0].amount).toBe(expectedPoints);
    expect(updatedUser?.rewardHistory[0].orderId).toBe(orderId);
    expect(updatedUser?.rewardHistory[0].transactionId).toBe(transactionId);
  });

  it('should process a simulated SQS event and create user if not exits', async () => {
    const testUserId = await createTestUserId();
    const orderId = uuidv4();
    const transactionId = uuidv4();
    const totalAmount = 300;
    const expectedPoints = Math.floor(totalAmount * 1);

    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: 'test-message-id',
          receiptHandle: 'test-receipt-handle',
          body: JSON.stringify({ userId: testUserId, orderId, totalAmount, transactionId }),
          attributes: {} as any,
          messageAttributes: {},
          md5OfBody: 'mock-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'mock-arn',
          awsRegion: 'us-east-1',
        },
      ],
    };

    const context: Context = {} as any;

    // Call the *real* handler function with the *simulated* event.
    await service.handler(sqsEvent, context);

    // Query DynamoDB to check the result.
    const updatedUser = await repository.getUser(testUserId);

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.points).toBe(expectedPoints);
    expect(updatedUser?.rewardHistory.length).toBe(1);
    expect(updatedUser?.rewardHistory[0].type).toBe('EARN');
    expect(updatedUser?.rewardHistory[0].amount).toBe(expectedPoints);
    expect(updatedUser?.rewardHistory[0].orderId).toBe(orderId);
    expect(updatedUser?.rewardHistory[0].transactionId).toBe(transactionId);
  });
});