import { Test, TestingModule } from '@nestjs/testing';
import { SQSHandler } from './sqs-handler';
import { ProcessPurchaseUseCase } from '../use-cases/process-purchase.use-case';
import { SQSEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const mockProcessPurchaseUseCase = {
  execute: jest.fn(),
};

describe('SQSHandler', () => {
  let handler: SQSHandler;
  let useCase: ProcessPurchaseUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SQSHandler,
        {
          provide: ProcessPurchaseUseCase,
          useValue: mockProcessPurchaseUseCase,
        },
      ],
    }).compile();

    handler = module.get<SQSHandler>(SQSHandler);
    useCase = module.get<ProcessPurchaseUseCase>(ProcessPurchaseUseCase);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should process a valid SQS event successfully', async () => {
      // Use v4() to create valid UUIDs
      const userId = uuidv4();
      const orderId = uuidv4();
      const transactionId = uuidv4();
      const validEvent: SQSEvent = {
        Records: [
          {
            messageId: '1',
            receiptHandle: '1',
            body: JSON.stringify({ userId, orderId, totalAmount: 100, transactionId }), // Use variables
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'mockMD5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'mockARN',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await handler.handle(validEvent);

      expect(useCase.execute).toHaveBeenCalledTimes(1);
      expect(useCase.execute).toHaveBeenCalledWith({ userId, orderId, totalAmount: 100, transactionId });
    });

    it('should handle an invalid SQS event (validation error) without calling the use case', async () => {
      const invalidEvent: SQSEvent = {
        Records: [
          {
            messageId: '2',
            receiptHandle: '2',
            body: JSON.stringify({ userId: 123, orderId: 'order789' }), // Invalid: userId is not a string
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'mockMD5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'mockARN',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await handler.handle(invalidEvent);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it('should handle multiple SQS records', async () => {
      const userId1 = uuidv4();
      const orderId1 = uuidv4();
      const transactionId1 = uuidv4();
      const userId2 = uuidv4();
      const orderId2 = uuidv4();
      const transactionId2 = uuidv4();
      const multiEvent: SQSEvent = {
        Records: [
          {
            messageId: '3',
            receiptHandle: '3',
            body: JSON.stringify({ userId: userId1, orderId: orderId1, totalAmount: 10, transactionId: transactionId1 }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'mockMD5_1',
            eventSource: 'aws:sqs',
            eventSourceARN: 'mockARN',
            awsRegion: 'us-east-1',
          },
          {
            messageId: '4',
            receiptHandle: '4',
            body: JSON.stringify({ userId: userId2, orderId: orderId2, totalAmount: 20, transactionId: transactionId2 }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'mockMD5_2',
            eventSource: 'aws:sqs',
            eventSourceARN: 'mockARN',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await handler.handle(multiEvent);

      expect(useCase.execute).toHaveBeenCalledTimes(2);
      expect(useCase.execute).toHaveBeenCalledWith({ userId: userId1, orderId: orderId1, totalAmount: 10, transactionId: transactionId1 });
      expect(useCase.execute).toHaveBeenCalledWith({ userId: userId2, orderId: orderId2, totalAmount: 20, transactionId: transactionId2 });
    });

    it('should handle errors during processing and not throw', async () => {
      const userId = uuidv4();
      const orderId = uuidv4();
      const transactionId = uuidv4();
      const errorEvent: SQSEvent = {
        Records: [
          {
            messageId: '5',
            receiptHandle: '5',
            body: JSON.stringify({ userId, orderId, totalAmount: 30, transactionId }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'mockMD5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'mockARN',
            awsRegion: 'us-east-1',
          },
        ],
      };

      mockProcessPurchaseUseCase.execute.mockRejectedValue(new Error('Test error'));

      await expect(handler.handle(errorEvent)).resolves.toBeUndefined();
      expect(useCase.execute).toHaveBeenCalledTimes(1);
    });
    it('should handle an invalid SQS event (invalid JSON) without calling the use case', async () => {
      const invalidEvent: SQSEvent = {
        Records: [
          {
            messageId: '2',
            receiptHandle: '2',
            body: "{ userId: 123, orderId: 'order789' }", // Invalid: Invalid JSON
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'mockMD5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'mockARN',
            awsRegion: 'us-east-1',
          },
        ],
      };
      await handler.handle(invalidEvent);
      expect(useCase.execute).not.toHaveBeenCalled();
    });

  });
});