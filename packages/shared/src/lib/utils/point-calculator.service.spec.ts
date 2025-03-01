import { Test, TestingModule } from '@nestjs/testing'
import { PointCalculatorService } from './point-calculator.service'

describe('PointCalculatorService', () => {
  let service: PointCalculatorService

  beforeEach(async () => {
    // No need to mock anything here, we test the *real* service.
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointCalculatorService],
    }).compile()

    service = module.get<PointCalculatorService>(PointCalculatorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculatePoints', () => {
    it('should return the floor of the total amount', () => {
      expect(service.calculatePoints(100)).toBe(100)
      expect(service.calculatePoints(100.5)).toBe(100)
      expect(service.calculatePoints(100.99)).toBe(100)
      expect(service.calculatePoints(0)).toBe(0)
      expect(service.calculatePoints(0.1)).toBe(0)
    })
  })

  describe('calculatePointsWithTier', () => {
    it('should calculate points with Gold tier multiplier', () => {
      expect(service.calculatePointsWithTier(100, 'Gold')).toBe(150)
      expect(service.calculatePointsWithTier(100.5, 'Gold')).toBe(150)
      expect(service.calculatePointsWithTier(100.9, 'Gold')).toBe(151) //Check rounding
    })

    it('should calculate points with Silver tier multiplier', () => {
      expect(service.calculatePointsWithTier(100, 'Silver')).toBe(120)
      expect(service.calculatePointsWithTier(100.5, 'Silver')).toBe(120)
    })

    it('should calculate points with Bronze tier multiplier', () => {
      expect(service.calculatePointsWithTier(100, 'Bronze')).toBe(110)
      expect(service.calculatePointsWithTier(100.9, 'Bronze')).toBe(110)
    })

    it('should calculate points with default multiplier for unknown tiers', () => {
      expect(service.calculatePointsWithTier(100, 'Platinum')).toBe(100) // Unknown tier
      expect(service.calculatePointsWithTier(100, '')).toBe(100) // Empty string
    })

    it('should handle zero and near zero amount', () => {
      expect(service.calculatePointsWithTier(0, 'Gold')).toBe(0)
      expect(service.calculatePointsWithTier(0.1, 'Silver')).toBe(0)
    })
  })
})
