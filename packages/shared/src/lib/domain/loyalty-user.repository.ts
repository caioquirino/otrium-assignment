import { Inject, Injectable } from '@nestjs/common';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { LoyaltyUser, RewardTransaction } from './loyalty-user.model';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb/dist-types/commands/UpdateCommand';

@Injectable()
export class DynamoDBLoyaltyUserRepository {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoDB: DynamoDBDocumentClient,
    @Inject('LOYALTY_TABLE_NAME') private readonly tableName: string, // Inject table name
  ) {}

  async getUser(userId: string): Promise<LoyaltyUser | null> {
    const params = {
      TableName: this.tableName, // Use injected table name
      Key: { userId },
    };

    const result = await this.dynamoDB.send(new GetCommand(params));
    return result.Item as LoyaltyUser | null;
  }

  async updatePoints(
    userId: string,
    pointsToAdd: number,
    transactionId: string,
    orderId?: string,
    description?: string
  ): Promise<LoyaltyUser> {
    const now = Date.now();
    const transaction: RewardTransaction = {
      transactionId,
      type: pointsToAdd >= 0 ? 'EARN' : 'REDEEM',
      amount: Math.abs(pointsToAdd),
      timestamp: now,
      orderId,
      description,
    };

    const params: UpdateCommandInput = {
      TableName: this.tableName, // Use injected table name
      Key: { userId },
      UpdateExpression:
        'SET #points = if_not_exists(#points, :zero) + :pointsToAdd, ' +
        '#lastUpdated = :now, ' +
        '#rewardHistory = list_append(if_not_exists(#rewardHistory, :emptyList), :newTransaction)',
      ExpressionAttributeNames: {
        '#points': 'points',
        '#lastUpdated': 'lastUpdated',
        '#rewardHistory': 'rewardHistory',
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':pointsToAdd': pointsToAdd,
        ':now': now,
        ':emptyList': [],
        ':newTransaction': [transaction],
        ':transactionId': transactionId,
      },
      ConditionExpression:
        'attribute_not_exists(rewardHistory) OR NOT contains(rewardHistory, :transactionId)',
      ReturnValues: 'ALL_NEW',
    };
    try {
      const result = await this.dynamoDB.send(new UpdateCommand(params));
      return result.Attributes as LoyaltyUser;
    } catch (error) {
      if ((error as Error).name === 'ConditionalCheckFailedException') {
        console.warn(`Transaction ${transactionId} already processed.`);
        throw new Error('Transaction already processed');
      }
      console.error('Error updating points:', error);
      throw error;
    }

  }
}