export type RewardTransaction = {
  transactionId: string;
  type: 'EARN' | 'REDEEM';
  amount: number;
  timestamp: number;
  orderId?: string;
  description?: string;
};

export type LoyaltyTier = 'Gold' | 'Silver' | 'Bronze' | string;

export type LoyaltyUser = {
  userId: string;
  points: number;
  lastUpdated: number;
  tier: LoyaltyTier;
  rewardHistory: RewardTransaction[];
};