import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyEventProcessorService } from './loyalty-event-processor.service';
import { SQSHandler } from './infrastructure/sqs-handler';
import { SQSEvent, Context } from 'aws-lambda';

const mockSQSHandler = {
  handle: jest.fn(),
};

describe('LoyaltyEventProcessorService', () => {
  let service: LoyaltyEventProcessorService;
  let sqsHandler: SQSHandler;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyEventProcessorService,
        {
          provide: SQSHandler,
          useValue: mockSQSHandler,
        },
      ],
    }).compile();

    service = module.get<LoyaltyEventProcessorService>(LoyaltyEventProcessorService);
    sqsHandler = module.get<SQSHandler>(SQSHandler);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handler', () => {
    it('should call SQSHandler.handle with the event and context', async () => {
      const mockEvent: SQSEvent = { Records: [] };
      const mockContext: Context = {} as any;

      mockSQSHandler.handle.mockResolvedValue(undefined);

      await service.handler(mockEvent, mockContext);

      expect(sqsHandler.handle).toHaveBeenCalledWith(mockEvent, mockContext);
      expect(sqsHandler.handle).toHaveBeenCalledTimes(1);
    });
  });
});