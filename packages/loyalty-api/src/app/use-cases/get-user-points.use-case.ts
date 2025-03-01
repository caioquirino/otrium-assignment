import { Inject, Injectable } from '@nestjs/common'
import { DynamoDBLoyaltyUserRepository } from '@otrium-assignment/shared'

@Injectable()
export class GetUserPointsUseCase {
  private readonly loyaltyUserRepository: DynamoDBLoyaltyUserRepository

  constructor(
    @Inject(DynamoDBLoyaltyUserRepository)
    loyaltyUserRepository: DynamoDBLoyaltyUserRepository,
  ) {
    this.loyaltyUserRepository = loyaltyUserRepository
  }

  async execute(userId: string): Promise<number> {
    const user = await this.loyaltyUserRepository.getUser(userId)
    return user ? user.points : 0
  }
}
