import { PointCalculatorService } from './point-calculator.service'

describe('PointCalculatorService', () => {
  let service: PointCalculatorService

  beforeEach(() => {
    service = new PointCalculatorService()
  })

  it('should calculate points correctly', () => {
    expect(service.calculatePoints(100)).toBe(100)
    expect(service.calculatePoints(100.5)).toBe(100)
    expect(service.calculatePoints(0)).toBe(0)
  })
  it('should calculate points with tier correctly', () => {
    expect(service.calculatePointsWithTier(100, 'Gold')).toBe(150)
    expect(service.calculatePointsWithTier(100.5, 'Silver')).toBe(120)
    expect(service.calculatePointsWithTier(100.5, 'Bronze')).toBe(110)
    expect(service.calculatePointsWithTier(0, 'Bronze')).toBe(0)
  })
})
