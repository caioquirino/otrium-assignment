import { Injectable } from '@nestjs/common'
import { LoyaltyTier } from '../domain/loyalty-user.model'

@Injectable()
export class PointCalculatorService {
  calculatePoints(totalAmount: number): number {
    return Math.floor(totalAmount)
  }

  calculatePointsWithTier(totalAmount: number, tier: LoyaltyTier): number {
    let multiplier = 1
    switch (tier) {
      case 'Gold':
        multiplier = 1.5
        break
      case 'Silver':
        multiplier = 1.2
        break
      case 'Bronze':
        multiplier = 1.1
        break
      default:
        multiplier = 1
    }
    return Math.floor(totalAmount * multiplier)
  }
}
