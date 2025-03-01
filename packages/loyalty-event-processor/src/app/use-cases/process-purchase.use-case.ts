import { Inject, Injectable } from '@nestjs/common'
import {
  DynamoDBLoyaltyUserRepository,
  PointCalculatorService,
  PurchaseEventDto,
  LoyaltyUser,
  LoyaltyTier,
} from '@otrium-assignment/shared'

@Injectable()
export class ProcessPurchaseUseCase {
  private readonly loyaltyUserRepository: DynamoDBLoyaltyUserRepository
  private readonly pointCalculator: PointCalculatorService

  constructor(
    @Inject(DynamoDBLoyaltyUserRepository)
    loyaltyUserRepository: DynamoDBLoyaltyUserRepository,
    @Inject(PointCalculatorService)
    pointCalculator: PointCalculatorService,
  ) {
    this.pointCalculator = pointCalculator
    this.loyaltyUserRepository = loyaltyUserRepository
  }

  async execute(event: PurchaseEventDto): Promise<LoyaltyUser> {
    const { userId, orderId, totalAmount, transactionId } = event

    //Get User for tier
    const user = await this.loyaltyUserRepository.getUser(userId)
    const tier: LoyaltyTier = user ? user.tier : 'Basic'

    const pointsEarned = this.pointCalculator.calculatePointsWithTier(totalAmount, tier)

    return this.loyaltyUserRepository.updatePoints(
      userId,
      pointsEarned,
      transactionId,
      orderId,
      `Points earned for order ${orderId}`,
    )
  }
}
