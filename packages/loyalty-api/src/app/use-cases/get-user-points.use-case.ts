import { Inject, Injectable } from '@nestjs/common';
import { DynamoDBLoyaltyUserRepository } from '@otrium-assignment/shared';

@Injectable()
export class GetUserPointsUseCase {
  constructor(
    @Inject(DynamoDBLoyaltyUserRepository)
    private readonly loyaltyUserRepository: DynamoDBLoyaltyUserRepository
  ) {}

  async execute(userId: string): Promise<number> {
    const user = await this.loyaltyUserRepository.getUser(userId);
    return user ? user.points : 0;
  }
}