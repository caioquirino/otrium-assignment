import { Controller, Get, Param, Inject } from '@nestjs/common'
import { GetUserPointsUseCase } from '../use-cases/get-user-points.use-case'

@Controller('loyalty')
export class LoyaltyController {
  private readonly getUserPointsUseCase: GetUserPointsUseCase
  constructor(
    @Inject(GetUserPointsUseCase)
    getUserPointsUseCase: GetUserPointsUseCase) {
    this.getUserPointsUseCase = getUserPointsUseCase
  }

  @Get('points/:userId')
  async getUserPoints(@Param('userId') userId: string): Promise<{ userId: string; points: number }> {
    const points = await this.getUserPointsUseCase.execute(userId);
    return { userId, points };

  }
}