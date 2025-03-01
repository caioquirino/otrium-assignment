
import { Controller, Get, Param, NotFoundException, Inject } from '@nestjs/common';
import { GetUserPointsUseCase } from '../use-cases/get-user-points.use-case';

@Controller('loyalty')
export class LoyaltyController {
  constructor(
    @Inject(GetUserPointsUseCase)
    private readonly getUserPointsUseCase: GetUserPointsUseCase) {}

  @Get('points/:userId')
  async getUserPoints(@Param('userId') userId: string): Promise<{ userId: string; points: number }> {
    const points = await this.getUserPointsUseCase.execute(userId);
    if (points === null) {
      throw new NotFoundException(`User with ID ${userId} not found`); // Proper HTTP 404
    }
    return { userId, points };
  }
}