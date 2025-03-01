import { Injectable } from '@nestjs/common';
import {
  DynamoDBLoyaltyUserRepository,
  PointCalculatorService,
  PurchaseEventDto,
  LoyaltyUser,
  LoyaltyTier
} from '@otrium-assignment/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProcessPurchaseUseCase {
  constructor(
    private readonly loyaltyUserRepository: DynamoDBLoyaltyUserRepository,
    private readonly pointCalculator: PointCalculatorService,
  ) {}

  async execute(event: PurchaseEventDto): Promise<LoyaltyUser> {
    const { userId, orderId, totalAmount } = event;
    const transactionId = uuidv4();

    //Get User for tier
    const user = await this.loyaltyUserRepository.getUser(userId);
    const tier: LoyaltyTier = user ? user.tier: 'Basic';

    const pointsEarned = this.pointCalculator.calculatePointsWithTier(totalAmount, tier);

    return this.loyaltyUserRepository.updatePoints(
      userId,
      pointsEarned,
      transactionId,
      orderId,
      `Points earned for order ${orderId}`
    );
  }
}