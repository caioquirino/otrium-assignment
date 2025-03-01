import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBLoyaltyUserRepository } from './loyalty-user.repository';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { LoyaltyUser } from './loyalty-user.model';

const mockDynamoDBDocumentClient = {
  send: jest.fn(),
};

describe('DynamoDBLoyaltyUserRepository', () => {
  let repository: DynamoDBLoyaltyUserRepository;
  let dynamoDB: DynamoDBDocumentClient;
  const tableName = 'TestTable';

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamoDBLoyaltyUserRepository,
        {
          provide: 'DYNAMODB_CLIENT',
          useValue: mockDynamoDBDocumentClient,
        },
        {
          provide: 'LOYALTY_TABLE_NAME',
          useValue: tableName,
        },
        {
          provide: 'TABLE_NAME',
          useValue: tableName,
        },
      ],
    }).compile();

    repository = module.get<DynamoDBLoyaltyUserRepository>(DynamoDBLoyaltyUserRepository);
    dynamoDB = module.get<DynamoDBDocumentClient>('DYNAMODB_CLIENT');
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getUser', () => {
    it('should get a user by ID', async () => {
      const userId = 'test-user';
      const mockUser: LoyaltyUser = {
        userId,
        points: 100,
        lastUpdated: 1234567890,
        tier: 'Gold',
        rewardHistory: [],
      };

      mockDynamoDBDocumentClient.send.mockImplementationOnce((command) => {
        if (command instanceof GetCommand) {
          return Promise.resolve({ Item: mockUser });
        }
        return Promise.resolve({});
      });

      const user = await repository.getUser(userId);

      expect(user).toEqual(mockUser);
      expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(GetCommand));
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);

    });

    it('should return undefined if user is not found', async () => {
      const userId = 'nonexistent-user';

      mockDynamoDBDocumentClient.send.mockImplementationOnce((command) => {
        if (command instanceof GetCommand) {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });


      const user = await repository.getUser(userId);

      expect(user).toBeUndefined();
      expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(GetCommand));
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePoints', () => {
    it('should update points for an existing user', async () => {
      const userId = 'test-user';
      const pointsToAdd = 50;
      const transactionId = 'txn123';
      const orderId = 'order456';
      const now = Date.now();

      const mockUpdatedUser = {
        userId: 'test-user',
        points: 50,
        lastUpdated: now,
        rewardHistory:
          [
            {
              transactionId: 'txn123',
              type: 'EARN',
              amount: 50,
              timestamp: now,
              orderId: 'order456',
              description: "Points earned for order order456"
            }
          ],
        tier: 'Silver'
      }
      mockDynamoDBDocumentClient.send.mockImplementationOnce((command) => {
        if(command instanceof UpdateCommand){
          return Promise.resolve({ Attributes: mockUpdatedUser });
        }
        return Promise.resolve({});
      });


      const updatedUser = await repository.updatePoints(userId, pointsToAdd, transactionId, orderId, `Points earned for order ${orderId}`);
      expect(updatedUser).toEqual(mockUpdatedUser);
      expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);

    });

    it('should create a new user if the user does not exist', async () => {
      const userId = 'new-user';
      const pointsToAdd = 50;
      const transactionId = 'txn123';
      const orderId = 'order456';
      const now = Date.now();

      const mockUpdatedUser = {
        userId: 'new-user',
        points: 50,
        lastUpdated: now,
        rewardHistory:
          [
            {
              transactionId: 'txn123',
              type: 'EARN',
              amount: 50,
              timestamp: now,
              orderId: 'order456',
              description: "Points earned for order order456"
            }
          ],
        tier: 'Silver'
      }

      mockDynamoDBDocumentClient.send.mockImplementationOnce((command) => {
        if (command instanceof UpdateCommand) {
          return Promise.resolve({ Attributes: mockUpdatedUser });
        }
        return Promise.resolve({});
      });


      const updatedUser = await repository.updatePoints(userId, pointsToAdd, transactionId, orderId);

      expect(updatedUser).toEqual(mockUpdatedUser);
      expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if transactionId already exists', async () => {
      const userId = 'test-user';
      const pointsToAdd = 50;
      const transactionId = 'existing-txn';
      const orderId = 'order456';

      mockDynamoDBDocumentClient.send.mockImplementationOnce((command) => {
        if (command instanceof UpdateCommand) {
          return Promise.reject({name: 'ConditionalCheckFailedException'})
        }
        return Promise.resolve({});
      });

      await expect(
        repository.updatePoints(userId, pointsToAdd, transactionId, orderId)
      ).rejects.toThrow('Transaction already processed');
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);

    });
    it('should throw original error in any other error case', async()=> {
      const userId = 'test-user';
      const pointsToAdd = 50;
      const transactionId = 'existing-txn';
      const orderId = 'order456';

      mockDynamoDBDocumentClient.send.mockImplementationOnce((command) => {
        if (command instanceof UpdateCommand) {
          return Promise.reject(new Error('Unknown error'))
        }
        return Promise.resolve({});
      });

      await expect(
        repository.updatePoints(userId, pointsToAdd, transactionId, orderId)
      ).rejects.toThrow('Unknown error');
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);
    })
  });

  describe('deleteLoyalty', () => { // Renamed describe block
    it('should delete a user by ID', async () => {
      const userId = 'test-user';

      mockDynamoDBDocumentClient.send.mockImplementationOnce((command) => {
        if (command instanceof DeleteCommand) {
          return Promise.resolve({});
        }
        return Promise.resolve({});

      });

      await repository.deleteLoyalty(userId); // Renamed method call

      expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
      expect(dynamoDB.send).toHaveBeenCalledTimes(1);
    });
  });
});