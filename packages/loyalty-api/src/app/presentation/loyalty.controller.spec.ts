// packages/loyalty-reader/src/presentation/loyalty.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyController } from './loyalty.controller';
import { GetUserPointsUseCase } from '../use-cases/get-user-points.use-case';

const mockGetUserPointsUseCase = {
  execute: jest.fn()
};

beforeEach(() => {
  jest.resetAllMocks()
})

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let useCase: GetUserPointsUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        {
          provide: GetUserPointsUseCase,
          useValue: mockGetUserPointsUseCase
        },
      ],
    }).compile();

    controller = module.get<LoyaltyController>(LoyaltyController);
    useCase = module.get<GetUserPointsUseCase>(GetUserPointsUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserPoints', () => {
    it('should return user points for a valid user ID', async () => {
      const userId = 'user123';
      const expectedPoints = 100;

      // Set up the mock to return a specific value
      mockGetUserPointsUseCase.execute.mockResolvedValue(expectedPoints);

      const result = await controller.getUserPoints(userId);

      expect(result).toEqual({ userId, points: expectedPoints });
      expect(useCase.execute).toHaveBeenCalledWith(userId);
      expect(useCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should return user and points equal zero if the user does not exist', async () => {
      const userId = 'user123';
      const expectedPoints = 0;

      // Set up the mock to return a specific value
      mockGetUserPointsUseCase.execute.mockResolvedValue(expectedPoints);

      const result = await controller.getUserPoints(userId);

      expect(result).toEqual({ userId, points: expectedPoints });
      expect(useCase.execute).toHaveBeenCalledWith(userId);
      expect(useCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});