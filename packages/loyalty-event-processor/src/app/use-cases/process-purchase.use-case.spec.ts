import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPurchaseUseCase } from './process-purchase.use-case';
import { DynamoDBLoyaltyUserRepository, PointCalculatorService, PurchaseEventDto, LoyaltyUser } from '@otrium-assignment/shared';
import { v4 as uuidv4 } from 'uuid';

const mockLoyaltyUserRepository = {
  updatePoints: jest.fn(),
  getUser: jest.fn()
};

const mockPointCalculatorService = {
  calculatePointsWithTier: jest.fn(),
};

describe('ProcessPurchaseUseCase', () => {
  let useCase: ProcessPurchaseUseCase;
  let loyaltyUserRepository: DynamoDBLoyaltyUserRepository;
  let pointCalculatorService: PointCalculatorService;

  beforeEach(async () => {
    jest.resetAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPurchaseUseCase,
        {
          provide: DynamoDBLoyaltyUserRepository,
          useValue: mockLoyaltyUserRepository,
        },
        {
          provide: PointCalculatorService,
          useValue: mockPointCalculatorService,
        },
      ],
    }).compile();

    useCase = module.get<ProcessPurchaseUseCase>(ProcessPurchaseUseCase);
    loyaltyUserRepository = module.get<DynamoDBLoyaltyUserRepository>(DynamoDBLoyaltyUserRepository);
    pointCalculatorService = module.get<PointCalculatorService>(PointCalculatorService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should process a purchase and update user points', async () => {
      const userId = uuidv4();
      const orderId = uuidv4();
      const totalAmount = 100;
      const transactionId = uuidv4();
      const pointsEarned = 10;
      const tier = 'Gold';

      const purchaseEvent: PurchaseEventDto = {
        userId,
        orderId,
        totalAmount,
        transactionId
      };
      const mockUser: LoyaltyUser = {
        userId,
        points: 150,
        lastUpdated: Date.now(),
        tier,
        rewardHistory: [],
      };
      const mockUpdatedUser: LoyaltyUser = {
        userId,
        points: 160,
        lastUpdated: Date.now(),
        tier,
        rewardHistory: [],
      };
      mockLoyaltyUserRepository.getUser.mockResolvedValue(mockUser);
      mockPointCalculatorService.calculatePointsWithTier.mockReturnValue(pointsEarned);
      mockLoyaltyUserRepository.updatePoints.mockResolvedValue(mockUpdatedUser);

      const result = await useCase.execute(purchaseEvent);

      expect(result).toEqual(mockUpdatedUser);
      expect(loyaltyUserRepository.getUser).toHaveBeenCalledWith(userId);
      expect(pointCalculatorService.calculatePointsWithTier).toHaveBeenCalledWith(totalAmount, tier);
      expect(loyaltyUserRepository.updatePoints).toHaveBeenCalledWith(
        userId,
        pointsEarned,
        expect.any(String),
        orderId,
        `Points earned for order ${orderId}`
      );
      expect(loyaltyUserRepository.updatePoints).toHaveBeenCalledTimes(1);

    });
    it('should process a purchase, update user points and create new user if does not exist', async () => {
      const userId = uuidv4();
      const orderId = uuidv4();
      const totalAmount = 100;
      const transactionId = uuidv4();
      const pointsEarned = 10;
      const defaultTier = 'Basic';

      const purchaseEvent: PurchaseEventDto = {
        userId,
        orderId,
        totalAmount,
        transactionId
      };

      const mockUpdatedUser: LoyaltyUser = {
        userId,
        points: 10,
        lastUpdated: Date.now(),
        tier: defaultTier,
        rewardHistory: [],
      };
      mockLoyaltyUserRepository.getUser.mockResolvedValue(null);
      mockPointCalculatorService.calculatePointsWithTier.mockReturnValue(pointsEarned);
      mockLoyaltyUserRepository.updatePoints.mockResolvedValue(mockUpdatedUser);

      const result = await useCase.execute(purchaseEvent);

      expect(result).toEqual(mockUpdatedUser);
      expect(loyaltyUserRepository.getUser).toHaveBeenCalledWith(userId);
      expect(pointCalculatorService.calculatePointsWithTier).toHaveBeenCalledWith(totalAmount, defaultTier);
      expect(loyaltyUserRepository.updatePoints).toHaveBeenCalledWith(
        userId,
        pointsEarned,
        expect.any(String),
        orderId,
        `Points earned for order ${orderId}`
      );
      expect(loyaltyUserRepository.updatePoints).toHaveBeenCalledTimes(1);

    });
  });
});