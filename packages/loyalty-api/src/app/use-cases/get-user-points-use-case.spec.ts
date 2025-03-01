import { Test, TestingModule } from '@nestjs/testing'
import { GetUserPointsUseCase } from './get-user-points.use-case'
import { DynamoDBLoyaltyUserRepository } from '@otrium-assignment/shared'
import { LoyaltyUser } from '@otrium-assignment/shared'

const mockLoyaltyUserRepository = {
  getUser: jest.fn(),
}

beforeEach(() => {
  jest.resetAllMocks()
})

describe('GetUserPointsUseCase', () => {
  let useCase: GetUserPointsUseCase
  let repository: DynamoDBLoyaltyUserRepository

  beforeEach(async () => {
    jest.resetAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPointsUseCase,
        {
          provide: DynamoDBLoyaltyUserRepository,
          useValue: mockLoyaltyUserRepository,
        },
      ],
    }).compile()

    useCase = module.get<GetUserPointsUseCase>(GetUserPointsUseCase)
    repository = module.get<DynamoDBLoyaltyUserRepository>(DynamoDBLoyaltyUserRepository)
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should return the user points if the user exists', async () => {
      const userId = 'user123'
      const mockUser: LoyaltyUser = {
        userId,
        points: 150,
        lastUpdated: Date.now(),
        tier: 'Gold',
        rewardHistory: [],
      }

      mockLoyaltyUserRepository.getUser.mockResolvedValue(mockUser)

      const points = await useCase.execute(userId)

      expect(points).toBe(150)
      expect(repository.getUser).toHaveBeenCalledWith(userId)
      expect(repository.getUser).toHaveBeenCalledTimes(1)
    })

    it('should return 0 if the user does not exist', async () => {
      const userId = 'nonexistentUser'

      mockLoyaltyUserRepository.getUser.mockResolvedValue(null)

      const points = await useCase.execute(userId)

      expect(points).toBe(0)
      expect(repository.getUser).toHaveBeenCalledWith(userId)
      expect(repository.getUser).toHaveBeenCalledTimes(1)
    })
  })
})
